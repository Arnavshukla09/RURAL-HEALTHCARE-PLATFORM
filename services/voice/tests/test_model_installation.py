import contextlib
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import Mock, patch

SERVICE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE))
import model_runtime
import install_models


class InstallationContractTests(unittest.TestCase):
    def test_runtime_is_offline_without_implicit_downloads(self):
        self.assertEqual(os.environ["HF_HUB_OFFLINE"], "1")
        self.assertEqual(os.environ["TRANSFORMERS_OFFLINE"], "1")
        with tempfile.TemporaryDirectory() as directory, patch.object(model_runtime, "ROOT", Path(directory)):
            self.assertEqual(model_runtime.manifest()["models"], {})

    def test_relocation_preserves_relative_locked_snapshots(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(model_runtime, "ROOT", Path(directory)):
            root = Path(directory)
            location = root / "cache" / "models--openai--whisper-tiny" / "snapshots" / ("a" * 40)
            location.mkdir(parents=True)
            (location / "config.json").write_text("{}")
            lock = {"protocolVersion": 1, "models": {"english": {"repository": "openai/whisper-tiny", "license": "apache-2.0", "revision": "a" * 40, "path": location.relative_to(root).as_posix()}}}
            (root / "model-lock.json").write_text(json.dumps(lock))
            self.assertEqual(model_runtime.manifest()["models"]["english"]["path"], str(location.resolve()))

    def test_modified_revision_or_path_escape_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(model_runtime, "ROOT", Path(directory)):
            root = Path(directory)
            for entry in [{"revision": "not-a-commit", "path": "."}, {"revision": "a" * 40, "path": ".."}]:
                (root / "model-lock.json").write_text(json.dumps({"protocolVersion": 1, "models": {"indic": entry}}))
                with self.assertRaises(RuntimeError):
                    model_runtime.manifest()

    def test_existing_model_lock_is_never_updated(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(install_models, "MODEL_ROOT", Path(directory)), patch.object(sys, "argv", ["install_models.py"]):
            lock = Path(directory) / "model-lock.json"
            lock.write_text("existing immutable snapshots")
            with contextlib.redirect_stdout(io.StringIO()) as output:
                install_models.main()
            self.assertEqual(lock.read_text(), "existing immutable snapshots")
            self.assertIn("No updates or downloads", output.getvalue())

    def test_custom_model_code_requires_one_time_explicit_review(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(install_models, "MODEL_ROOT", Path(directory)), patch.object(sys, "argv", ["install_models.py"]), contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as error:
                install_models.main()
            self.assertEqual(error.exception.code, 2)

    def test_repair_restores_missing_files_at_the_locked_commit_without_latest_or_lock_updates(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(install_models, "MODEL_ROOT", Path(directory)), patch.object(sys, "argv", ["install_models.py", "--repair"]):
            root = Path(directory)
            revision = "a" * 40
            relative = f"cache/models--openai--whisper-tiny/snapshots/{revision}"
            location = root / relative
            location.mkdir(parents=True)
            (location / "config.json").write_text("{}")
            value = {"protocolVersion": 1, "allowModelCode": True, "models": {"english": {"repository": "openai/whisper-tiny", "revision": revision, "license": "mit", "path": relative, "files": ["config.json", "model.safetensors"]}}}
            lock = root / "model-lock.json"
            original = json.dumps(value, indent=2)
            lock.write_text(original)
            def restore(**kwargs):
                self.assertEqual(kwargs["revision"], revision)
                (location / "model.safetensors").write_text("fixture weights")
                return str(location)
            hub = types.ModuleType("huggingface_hub")
            hub.snapshot_download = Mock(side_effect=restore)
            hub.HfApi = Mock(side_effect=AssertionError("Repair must not resolve latest model information"))
            with patch.dict(sys.modules, {"huggingface_hub": hub}), contextlib.redirect_stdout(io.StringIO()):
                install_models.main()
            hub.snapshot_download.assert_called_once_with(repo_id="openai/whisper-tiny", revision=revision, cache_dir=str(root / "cache"), token=False)
            hub.HfApi.assert_not_called()
            self.assertEqual(lock.read_text(), original)
            self.assertEqual((location.parent.parent / "refs" / "main").read_text(), revision)

    def test_repair_skips_present_locked_snapshots_without_network_calls(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(install_models, "MODEL_ROOT", Path(directory)), patch.object(sys, "argv", ["install_models.py", "--repair"]):
            root = Path(directory)
            revision = "b" * 40
            relative = f"cache/models--openai--whisper-tiny/snapshots/{revision}"
            location = root / relative
            location.mkdir(parents=True)
            (location / "config.json").write_text("{}")
            (location / "model.safetensors").write_text("fixture weights")
            value = {"protocolVersion": 1, "models": {"english": {"repository": "openai/whisper-tiny", "revision": revision, "license": "mit", "path": relative, "files": ["config.json", "model.safetensors"]}}}
            lock = root / "model-lock.json"
            lock.write_text(json.dumps(value))
            hub = types.ModuleType("huggingface_hub")
            hub.snapshot_download = Mock(side_effect=AssertionError("Complete snapshots must not use the network"))
            with patch.dict(sys.modules, {"huggingface_hub": hub}), contextlib.redirect_stdout(io.StringIO()):
                install_models.main()
            hub.snapshot_download.assert_not_called()

    def test_repair_requires_an_existing_lock_and_does_not_turn_into_a_fresh_install(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(install_models, "MODEL_ROOT", Path(directory)), patch.object(sys, "argv", ["install_models.py", "--repair"]), contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as error:
                install_models.main()
            self.assertEqual(error.exception.code, 2)
            self.assertFalse((Path(directory) / "model-lock.json").exists())

    def test_authentication_requires_explicit_opt_in_and_a_token_value(self):
        with patch.dict(os.environ, {"HF_TOKEN": "fixture-access-token"}):
            self.assertIs(install_models.download_token(False), False)
            self.assertEqual(install_models.download_token(True), "fixture-access-token")
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(RuntimeError, "HF_TOKEN"):
                install_models.download_token(True)

    def test_gated_model_never_uses_an_environment_token_without_opt_in(self):
        hub = types.ModuleType("huggingface_hub")
        hub.HfApi = Mock(return_value=types.SimpleNamespace(model_info=lambda _: types.SimpleNamespace(gated="auto")))
        hub.snapshot_download = Mock()
        with tempfile.TemporaryDirectory() as directory, patch.object(install_models, "MODEL_ROOT", Path(directory)), patch.object(sys, "argv", ["install_models.py", "--allow-model-code"]), patch.dict(os.environ, {"HF_TOKEN": "fixture-access-token"}), patch.dict(sys.modules, {"huggingface_hub": hub}):
            with self.assertRaisesRegex(RuntimeError, "gated access"):
                install_models.main()
            hub.HfApi.assert_called_once_with(token=False)
            hub.snapshot_download.assert_not_called()
            self.assertFalse((Path(directory) / "model-lock.json").exists())

    def test_gated_auth_records_reviewed_languages_but_never_the_token(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(install_models, "MODEL_ROOT", Path(directory)):
            root = Path(directory)
            revision = "c" * 40
            hub = types.ModuleType("huggingface_hub")
            hub.HfApi = Mock(return_value=types.SimpleNamespace(model_info=lambda repo: types.SimpleNamespace(gated="auto" if repo.startswith("ai4bharat/") else False, card_data={"license": "mit"}, sha=revision)))
            def download(**kwargs):
                self.assertEqual(kwargs["token"], "fixture-access-token")
                self.assertEqual(kwargs["revision"], revision)
                location = root / "cache" / ("models--" + kwargs["repo_id"].replace("/", "--")) / "snapshots" / revision
                location.mkdir(parents=True)
                (location / "config.json").write_text("{}")
                return str(location)
            hub.snapshot_download = Mock(side_effect=download)
            args = ["install_models.py", "--allow-model-code", "--no-chat", "--use-hf-token", "--indic-languages", "hi,as,ur"]
            with patch.object(sys, "argv", args), patch.dict(os.environ, {"HF_TOKEN": "fixture-access-token"}), patch.dict(sys.modules, {"huggingface_hub": hub}), contextlib.redirect_stdout(io.StringIO()) as output:
                install_models.main()
            contents = (root / "model-lock.json").read_text()
            self.assertNotIn("fixture-access-token", contents)
            self.assertNotIn("fixture-access-token", output.getvalue())
            self.assertEqual(json.loads(contents)["models"]["indic"]["declaredLanguages"], ["hi", "as", "ur"])
            self.assertEqual(json.loads(contents)["models"]["indic"]["languageSource"], "operator-reviewed")

    def test_unreviewed_missing_language_metadata_cannot_claim_indic_coverage(self):
        hub = types.ModuleType("huggingface_hub")
        hub.HfApi = Mock(return_value=types.SimpleNamespace(model_info=lambda _: types.SimpleNamespace(gated=False, card_data={"license": "mit"}, sha="d" * 40)))
        hub.snapshot_download = Mock()
        with tempfile.TemporaryDirectory() as directory, patch.object(install_models, "MODEL_ROOT", Path(directory)), patch.object(sys, "argv", ["install_models.py", "--allow-model-code"]), patch.dict(sys.modules, {"huggingface_hub": hub}):
            with self.assertRaisesRegex(RuntimeError, "language metadata is missing"):
                install_models.main()
            hub.snapshot_download.assert_not_called()


if __name__ == "__main__":
    unittest.main()
