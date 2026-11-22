"""One-time, explicit download. Runtime uses the installed immutable snapshots only."""
import argparse
import json
import os
import re
from pathlib import Path

MODEL_ROOT = Path(__file__).resolve().parent / ".models"
MODEL_IDS = {
    "indic": "ai4bharat/indic-conformer-600m-multilingual",
    "english": "openai/whisper-tiny",
    "chat": "Qwen/Qwen3-0.6B",
}
ALLOWED_LICENSES = {"mit", "apache-2.0", "cc-by-4.0"}
INDIC_LANGUAGES = {"hi", "mr", "bn", "te", "ta", "gu", "kn", "pa", "or", "ml", "as", "ur"}


def download_token(use_token):
    if not use_token:
        return False
    token = os.environ.get("HF_TOKEN", "").strip()
    if not token:
        raise RuntimeError("Set HF_TOKEN in the installer environment before using --use-hf-token")
    return token


def repair_locked_snapshots(lock_path, token=False):
    """Explicitly restore missing files at existing commits; never resolve latest or rewrite a lock."""
    lock = json.loads(lock_path.read_text(encoding="utf-8"))
    if lock.get("protocolVersion") != 1 or not isinstance(lock.get("models"), dict):
        raise RuntimeError("Invalid model lock; restore the original lock backup")
    missing = []
    for name, entry in lock["models"].items():
        repository = entry.get("repository")
        revision = entry.get("revision", "")
        location = (MODEL_ROOT / entry.get("path", "")).resolve()
        expected = (MODEL_ROOT / "cache" / ("models--" + str(repository).replace("/", "--")) / "snapshots" / revision).resolve()
        if MODEL_IDS.get(name) != repository or not re.fullmatch(r"[a-f0-9]{40}", revision) or location != expected or not location.is_relative_to(MODEL_ROOT.resolve()) or entry.get("license") not in ALLOWED_LICENSES:
            raise RuntimeError("Model lock contains an unsupported repository, revision, path or license")
        if name == "indic" and not lock.get("allowModelCode"):
            raise RuntimeError("Original locked custom model code was not approved")
        files = entry.get("files")
        if files is not None and (not isinstance(files, list) or any(not isinstance(file, str) or not (location / file).resolve().is_relative_to(MODEL_ROOT.resolve()) for file in files)):
            raise RuntimeError("Model lock contains invalid snapshot file paths")
        absent = not location.is_dir() or not (location / "config.json").is_file()
        if isinstance(files, list):
            absent = absent or any(not (location / file).is_file() for file in files)
        elif location.is_dir():
            # Older locks have no file inventory; detect absent weights or broken cached links.
            absent = absent or not any(file.is_file() and file.suffix in {".safetensors", ".bin", ".onnx"} for file in location.rglob("*"))
        if absent:
            missing.append((name, entry, location))
    if not missing:
        print("Locked snapshots are present. No updates or downloads performed.")
        return
    from huggingface_hub import snapshot_download
    for name, entry, expected in missing:
        restored = Path(snapshot_download(repo_id=entry["repository"], revision=entry["revision"], cache_dir=str(MODEL_ROOT / "cache"), token=token)).resolve()
        if restored != expected:
            raise RuntimeError("Restored snapshot path differs from its unchanged lock")
        if not (restored / "config.json").is_file() or any(not (restored / file).is_file() for file in entry.get("files", [])):
            raise RuntimeError("Locked snapshot repair did not restore required files")
        references = restored.parent.parent / "refs"
        references.mkdir(parents=True, exist_ok=True)
        (references / "main").write_text(entry["revision"], encoding="utf-8")
        print(f"Repaired {name} at locked revision {entry['revision']}; model lock unchanged.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--allow-model-code", action="store_true", help="Allow the pinned AI4Bharat custom model implementation after reviewing it")
    parser.add_argument("--no-chat", action="store_true", help="Install speech only for a smaller deployment")
    parser.add_argument("--repair", action="store_true", help="Restore missing snapshots/files at existing immutable commits; never update the lock")
    parser.add_argument("--use-hf-token", action="store_true", help="Explicitly read HF_TOKEN for one-time gated downloads; never save it in the lock")
    parser.add_argument("--indic-languages", help="Comma-separated app language codes verified against the gated model card/implementation")
    args = parser.parse_args()
    MODEL_ROOT.mkdir(parents=True, exist_ok=True)
    lock_path = MODEL_ROOT / "model-lock.json"
    if lock_path.exists():
        if args.repair:
            repair_locked_snapshots(lock_path, download_token(args.use_hf_token))
            return
        print("Existing model lock retained. No updates or downloads performed.")
        return
    if args.repair:
        parser.error("--repair requires an existing model-lock.json; it never creates a new installation")
    if not args.allow_model_code:
        parser.error("Review the AI4Bharat model implementation/license, then explicitly pass --allow-model-code")
    reviewed_languages = [value.strip() for value in args.indic_languages.split(",")] if args.indic_languages else None
    if reviewed_languages is not None and (not reviewed_languages or any(value not in INDIC_LANGUAGES for value in reviewed_languages) or len(set(reviewed_languages)) != len(reviewed_languages)):
        parser.error("--indic-languages must contain distinct supported app language codes")
    token = download_token(args.use_hf_token)
    from huggingface_hub import HfApi, snapshot_download
    api = HfApi(token=token)
    lock = {"protocolVersion": 1, "allowModelCode": True, "models": {}}
    for name, repo_id in MODEL_IDS.items():
        if name == "chat" and args.no_chat:
            continue
        info = api.model_info(repo_id)
        if getattr(info, "gated", False) and not token:
            raise RuntimeError(f"{repo_id}: gated access requires reviewing/accepting its terms on Hugging Face, then HF_TOKEN and --use-hf-token. The installer never accepts terms automatically.")
        metadata = dict(info.card_data or {})
        license_name = metadata.get("license", "")
        if license_name not in ALLOWED_LICENSES:
            raise RuntimeError(f"{repo_id}: license {license_name!r} is not pre-approved; verify the exact weight license before proceeding")
        revision = info.sha
        if not revision or len(revision) != 40:
            raise RuntimeError(f"{repo_id}: immutable revision unavailable")
        declared_languages = metadata.get("language", [])
        if name == "indic" and reviewed_languages is not None:
            declared_languages = reviewed_languages
        if name == "indic" and not declared_languages:
            raise RuntimeError("Indic language metadata is missing. Verify the model card/implementation and provide --indic-languages before declaring voice coverage.")
        location = snapshot_download(repo_id=repo_id, revision=revision, cache_dir=str(MODEL_ROOT / "cache"), token=token)
        # Custom implementations using the local "main" ref still resolve this pinned snapshot offline.
        references = Path(location).parent.parent / "refs"
        references.mkdir(parents=True, exist_ok=True)
        (references / "main").write_text(revision, encoding="utf-8")
        files = sorted(file.relative_to(location).as_posix() for file in Path(location).rglob("*") if file.is_file())
        lock["models"][name] = {"repository": repo_id, "revision": revision, "license": license_name, "path": Path(location).relative_to(MODEL_ROOT).as_posix(), "declaredLanguages": declared_languages, "languageSource": "operator-reviewed" if name == "indic" and reviewed_languages is not None else "model-metadata", "files": files}
        print(f"Installed {name}: {revision} ({license_name})")
    temporary = MODEL_ROOT / "model-lock.tmp"
    temporary.write_text(json.dumps(lock, indent=2), encoding="utf-8")
    temporary.replace(lock_path)
    print("Snapshots pinned. Review licences/NOTICE files and test all required languages on this hardware.")


if __name__ == "__main__":
    main()
