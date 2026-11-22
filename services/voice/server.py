"""Owned local voice server, stable protocol v1. Default bind:127.0.0.1:8765."""
import asyncio
import io
import os
import shutil
import subprocess
from fastapi import FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool
import numpy as np
import soundfile as sf
from model_runtime import LANGUAGES, chat, manifest, transcribe
from voice_auth import authorize_voice_client

app = FastAPI(title="RuralHealth local voice", version="1.0.0", docs_url=None, redoc_url=None)
inference_lock = asyncio.Semaphore(1)
token = os.getenv("VOICE_SERVICE_TOKEN", "")
espeak = os.getenv("ESPEAK_NG_PATH") or shutil.which("espeak-ng")
try:
    voice_list = subprocess.run([espeak, "--voices"], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=5, check=True).stdout.decode("utf-8") if espeak else ""
    installed_voices = {line.split()[1].split("-")[0] for line in voice_list.splitlines()[1:] if len(line.split()) > 2}
except Exception:
    installed_voices = set()


def authorize(authorization, request):
    try:
        authorize_voice_client(token, authorization, request.client.host if request.client else None)
    except PermissionError as error:
        raise HTTPException(401, str(error))


def validate_language(language):
    if language not in LANGUAGES:
        raise HTTPException(400, "Unsupported language")


@app.get("/v1/health")
async def health(request: Request, authorization: str | None = Header(default=None)):
    authorize(authorization, request)
    try:
        installed = manifest().get("models", {})
    except Exception:
        installed = {}
    declared = installed.get("indic", {}).get("declaredLanguages", [])
    if isinstance(declared, str):
        declared = [declared]
    asr = (["en"] if "english" in installed else []) + ([lang for lang in LANGUAGES if lang != "en" and lang in declared] if "indic" in installed else [])
    voices = [language for language in LANGUAGES if language in installed_voices]
    return {"protocolVersion": 1, "available": bool(asr or voices), "asrLanguages": asr, "ttsLanguages": voices, "conversationAvailable": "chat" in installed, "modelRevision": {name: entry["revision"] for name, entry in installed.items()}, "validation": "Installed snapshot metadata and detected eSpeak voices; adapters are loaded lazily and inference/language quality is unverified"}


@app.post("/v1/transcribe")
async def recognize(request: Request, language: str = Form(...), audio: UploadFile = File(...), authorization: str | None = Header(default=None)):
    authorize(authorization, request)
    validate_language(language)
    content = await audio.read(2 * 1024 * 1024 + 1)
    await audio.close()
    if len(content) > 2 * 1024 * 1024 or not content.startswith(b"RIFF"):
        raise HTTPException(400, "Bounded WAV audio required")
    try:
        samples, rate = sf.read(io.BytesIO(content), dtype="float32")
        if rate != 16000 or samples.ndim != 1 or not 4800 <= len(samples) <= 320000 or not np.all(np.isfinite(samples)):
            raise ValueError("16kHz mono,0.3–20 seconds required")
        if np.sqrt(np.mean(samples * samples)) < 0.004:
            return {"transcript": "", "language": language}
        async with inference_lock:
            result = await run_in_threadpool(transcribe, samples, language)
        return {"transcript": result[:2000], "language": language}
    except Exception:
        raise HTTPException(503, "Local recognizer unavailable; validate the installed snapshot")


class SpeechRequest(BaseModel):
    language: str
    text: str = Field(min_length=1, max_length=1200)
    task: str | None = None


@app.post("/v1/speak")
async def speak(request: SpeechRequest, client_request: Request, authorization: str | None = Header(default=None)):
    authorize(authorization, client_request)
    validate_language(request.language)
    if not espeak or request.language not in installed_voices:
        raise HTTPException(503, "Install eSpeak NG or use a matching device voice")
    try:
        command = [espeak, "--stdout", "--stdin", "-v", request.language, "-s", "145"]
        result = await run_in_threadpool(lambda: subprocess.run(command, input=request.text.encode("utf-8"), stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=15, check=True))
        return Response(result.stdout, media_type="audio/wav", headers={"Cache-Control": "no-store"})
    except Exception:
        raise HTTPException(503, "Requested local voice unavailable")


@app.post("/v1/chat")
async def converse(request: SpeechRequest, client_request: Request, authorization: str | None = Header(default=None)):
    authorize(authorization, client_request)
    validate_language(request.language)
    try:
        async with inference_lock:
            reply = await run_in_threadpool(chat, request.text, request.language)
        return {"reply": reply[:1200], "language": request.language}
    except Exception:
        raise HTTPException(503, "Optional local conversation model unavailable")
