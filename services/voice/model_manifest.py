"""Independent pinned snapshot checks; one missing optional model does not disable others."""
import hashlib
import json
import re
from pathlib import Path
from install_models import ALLOWED_LICENSES, MODEL_IDS


def read_model_manifest(root):
    root = Path(root).resolve()
    lock_path = root / "model-lock.json"
    if not lock_path.exists():
        return {"protocolVersion": 1, "models": {}, "unavailableModels": []}
    lock = json.loads(lock_path.read_text(encoding="utf-8"))
    if lock.get("protocolVersion") != 1 or not isinstance(lock.get("models"), dict):
        raise RuntimeError("Unsupported model manifest protocol")
    usable, unavailable = {}, []
    for name, entry in lock["models"].items():
        revision = entry.get("revision", "")
        location = (root / entry.get("path", "")).resolve()
        expected = (root / "cache" / ("models--" + str(MODEL_IDS.get(name)).replace("/", "--")) / "snapshots" / revision).resolve()
        if MODEL_IDS.get(name) != entry.get("repository") or not re.fullmatch(r"[a-f0-9]{40}", revision) or location != expected or not location.is_relative_to(root) or entry.get("license") not in ALLOWED_LICENSES:
            raise RuntimeError("Untrusted model manifest entry")
        if name == "indic" and not lock.get("allowModelCode"):
            raise RuntimeError("Pinned model code requires explicit approval")
        files = entry.get("files", [])
        if not isinstance(files, list) or any(not isinstance(file, str) or not (location / file).resolve().is_relative_to(root) for file in files):
            raise RuntimeError("Untrusted snapshot file path")
        if not (location / "config.json").is_file() or any(not (location / file).is_file() for file in files):
            unavailable.append(name)
            continue
        usable[name] = {**entry, "path": str(location)}
    return {**lock, "models": usable, "unavailableModels": unavailable}


def verify_snapshot(entry):
    """Verify digests at model load, not on every health probe. Older locks remain compatible."""
    hashes = entry.get("sha256")
    if hashes is None:
        return
    if not isinstance(hashes, dict) or set(hashes) != set(entry.get("files", [])):
        raise RuntimeError("Invalid snapshot digest inventory")
    for name, expected in hashes.items():
        if not isinstance(expected, str) or not re.fullmatch(r"[a-f0-9]{64}", expected):
            raise RuntimeError("Invalid snapshot digest")
        with (Path(entry["path"]) / name).open("rb") as source:
            digest = hashlib.file_digest(source, "sha256").hexdigest()
        if digest != expected:
            raise RuntimeError("Pinned snapshot integrity mismatch")
