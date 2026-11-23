import json
import hashlib
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from model_manifest import read_model_manifest, verify_snapshot
from install_models import MODEL_IDS


class ModelFallbackTests(unittest.TestCase):
    def lock(self, root):
        models = {}
        for name in ("indic", "english", "chat"):
            location = root / "cache" / ("models--" + MODEL_IDS[name].replace("/", "--")) / "snapshots" / ("a" * 40)
            location.mkdir(parents=True)
            (location / "config.json").write_text("{}")
            models[name] = {"repository": MODEL_IDS[name], "revision": "a" * 40, "license": "mit", "path": location.relative_to(root).as_posix(), "files": ["config.json"]}
        (root / "model-lock.json").write_text(json.dumps({"protocolVersion": 1, "allowModelCode": True, "models": models}))
        return models

    def test_missing_indic_does_not_disable_english_or_chat_or_rewrite_lock(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); models = self.lock(root)
            (root / models["indic"]["path"] / "config.json").unlink()
            original = (root / "model-lock.json").read_bytes()
            available = read_model_manifest(root)
            self.assertEqual(set(available["models"]), {"english", "chat"})
            self.assertEqual(available["unavailableModels"], ["indic"])
            self.assertEqual((root / "model-lock.json").read_bytes(), original)

    def test_snapshot_digest_detects_modified_model_code(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); models = self.lock(root)
            entry = {**models["chat"], "path": str(root / models["chat"]["path"]), "sha256": {"config.json": hashlib.sha256(b"{}").hexdigest()}}
            verify_snapshot(entry)
            (Path(entry["path"]) / "config.json").write_text('{"modified":true}')
            with self.assertRaisesRegex(RuntimeError, "integrity mismatch"):
                verify_snapshot(entry)

    def test_unreviewed_repository_or_path_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); models = self.lock(root)
            models["chat"]["repository"] = "unreviewed/replacement"
            (root / "model-lock.json").write_text(json.dumps({"protocolVersion": 1, "allowModelCode": True, "models": models}))
            with self.assertRaisesRegex(RuntimeError, "Untrusted"):
                read_model_manifest(root)
