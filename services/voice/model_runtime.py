"""Lazy local inference. This module never contacts a model host at runtime."""
import os
import threading
from pathlib import Path
from model_manifest import read_model_manifest, verify_snapshot

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"
ROOT = Path(__file__).resolve().parent / ".models"
os.environ["HF_HOME"] = str(ROOT)
os.environ["HF_HUB_CACHE"] = str(ROOT / "cache")
os.environ["HF_MODULES_CACHE"] = str(ROOT / "modules")
LANGUAGES = {"en": "English", "hi": "Hindi", "mr": "Marathi", "bn": "Bengali", "te": "Telugu", "ta": "Tamil", "gu": "Gujarati", "kn": "Kannada", "pa": "Punjabi", "or": "Odia", "ml": "Malayalam", "as": "Assamese", "ur": "Urdu"}
_loaded = {}
_lock = threading.Lock()


def manifest():
    return read_model_manifest(ROOT)


def loaded(name):
    if name in _loaded:
        return _loaded[name]
    with _lock:
        if name in _loaded:
            return _loaded[name]
        installed = manifest()
        entry = installed.get("models", {}).get(name)
        if not entry:
            raise RuntimeError("Run the explicit model installer first")
        verify_snapshot(entry)
        import torch
        from transformers import AutoModel, AutoModelForCausalLM, AutoTokenizer, WhisperForConditionalGeneration, WhisperProcessor
        device = "cuda" if torch.cuda.is_available() else "cpu"
        if name == "indic":
            if not installed.get("allowModelCode"):
                raise RuntimeError("Pinned custom model code was not approved")
            model = AutoModel.from_pretrained(entry["path"], trust_remote_code=True, local_files_only=True)
            _loaded[name] = (model, device)
        elif name == "english":
            processor = WhisperProcessor.from_pretrained(entry["path"], local_files_only=True)
            model = WhisperForConditionalGeneration.from_pretrained(entry["path"], local_files_only=True).to(device).eval()
            _loaded[name] = (processor, model, device)
        else:
            tokenizer = AutoTokenizer.from_pretrained(entry["path"], local_files_only=True)
            model = AutoModelForCausalLM.from_pretrained(entry["path"], local_files_only=True).to(device).eval()
            _loaded[name] = (tokenizer, model, device)
        return _loaded[name]


def transcribe(samples, language):
    import torch
    with torch.inference_mode():
        if language == "en":
            processor, model, device = loaded("english")
            inputs = processor(samples, sampling_rate=16000, return_tensors="pt").to(device)
            tokens = model.generate(**inputs, language="english", task="transcribe", max_new_tokens=160)
            return processor.batch_decode(tokens, skip_special_tokens=True)[0].strip()
        model, _device = loaded("indic")
        result = model(torch.from_numpy(samples).unsqueeze(0), language, "ctc")
        if isinstance(result, (list, tuple)):
            result = result[0]
        if not isinstance(result, str):
            raise RuntimeError("The installed Indic adapter returned an unsupported result; validate the pinned revision")
        return result.strip()


def chat(text, language):
    import torch
    tokenizer, model, device = loaded("chat")
    system = f"You are a concise health-navigation helper. Reply only in {LANGUAGES[language]}. Use at most 70 words. Do not diagnose, invent provider availability, claim bookings, or prescribe drug doses. Serious breathing difficulty, chest pain, unconsciousness or heavy bleeding needs immediate emergency care/108. Recommend a local clinician for medical decisions. Never execute actions."
    messages = [{"role": "system", "content": system}, {"role": "user", "content": text}]
    prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True, enable_thinking=False)
    inputs = tokenizer([prompt], return_tensors="pt").to(device)
    with torch.inference_mode():
        result = model.generate(**inputs, max_new_tokens=180, do_sample=False)
    return tokenizer.decode(result[0][inputs.input_ids.shape[-1]:], skip_special_tokens=True).strip()
