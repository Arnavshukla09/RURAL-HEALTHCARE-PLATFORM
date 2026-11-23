# Voice assistant: installed code and one-time setup

The assistant replaces the old floating text widget with a lightweight SVG avatar, native workflow prompts for all 13 selected languages, finalized voice turns, automatic read-aloud where a matching voice exists, pictorial controls, emergency-first routing, guided symptom intake and authenticated appointment actions. There is no required paid avatar or inference API.

## Stable defaults

| Setting | Value |
|---|---|
| Website port | Existing port **3000** |
| Optional owned voice service | **8765**, protocol `/v1/*` |
| Browser-facing voice/action routes | `/api/assistant/voice`, `/api/assistant/actions` |
| Indian speech candidate | `ai4bharat/indic-conformer-600m-multilingual` |
| English speech candidate | `openai/whisper-tiny` |
| Optional local conversation candidate | `Qwen/Qwen3-0.6B` |
| Dynamic speech output | Matching installed browser/OS voices; optional locally installed eSpeak NG |

Model identifiers are defined once in `services/voice/install_models.py`; server origin validation lives in lib/services/voice-config.ts; protocol limits/port are in `lib/assistant/config.ts`. The explicit installer resolves immutable model commits and writes `.models/model-lock.json`. Re-running it preserves an existing lock. Runtime sets Hugging Face/Transformers offline mode and loads only local snapshots; it does not check for newer models, download at startup, or rotate model names. Moving the service folder preserves relative snapshot paths. Normal security maintenance may still require dependency updates; no code can responsibly guarantee never needing maintenance.

## What works without a model service

- Persistent avatar and native instructions, navigation and pictorial choices.
- Website control discovery/selection, non-secret field editing, shared accessibility, task replacement and supported wake-prefixed speech interruption. See [HANDS_FREE_IMPLEMENTATION.md](HANDS_FREE_IMPLEMENTATION.md) for the complete option map, explicit handoffs and release limits.
- Local command matching, symptom severity rules and emergency instructions.
- Authenticated provider/slot/appointment lookup, draft-bound signed confirmations, creation/cancellation and authorized consultation entry.
- Account-scoped offline request capture, checksum-verified public/language packs and truthful pending/confirmed status.
- Device speech when the selected voice/recognizer is available. Experimental on-device recognition packs are checked and installed only after the user requests offline preparation.

The selected language changes native assistant text independently of Google DOM translation. Navigation retains the root component in all languages. Voice pauses when hidden, when entering a conference, or while an emergency beacon uses speech. It requires explicit activation after page/browser suspension; a PWA is not a permanent background microphone service.

The offline download contains native text/command data and application assets, not invented prerecorded audio. Offline spoken interaction needs a matching local device voice and local recognizer, or reachable owned inference service. “Offline guidance ready” does not mean every phone has all thirteen speech engines. Finite workflow vocabularies are not unrestricted language comprehension.

## One-time database rollout

Apply `supabase/migrations/20261122000200_atomic_offline_sync.sql`, then `supabase/migrations/20261122000300_offline_booking_expiry_guard.sql` through the owner-controlled migration process. The second migration rejects expired new booking requests while preserving acknowledgment of previously committed duplicates. See [OFFLINE_SYNC_ROLLOUT.md](OFFLINE_SYNC_ROLLOUT.md) for local verification and rollback guidance. Historical migrations were not modified.

Until that RPC is installed, offline replay reports `MIGRATION_REQUIRED` and retains requests. Never reset or test against production. Live RLS/concurrent-transaction tests need a disposable local Supabase stack.

## Optional owned voice server

This repository contains the service and installation contracts. Heavyweight dependencies and model assets have **not been installed or downloaded**. Official public metadata was read on 22 November 2026: IndicConformer reports MIT and gated access; Whisper and Qwen report Apache 2.0 and ungated access. Metadata is not a substitute for reading full code/weight/voice terms, running inference or native-speaker/hardware validation. The gated Indic model card itself could not be read without account access. The installer accepts only explicitly listed license identifiers and never accepts model-access terms automatically.

Use Python 3.11 or 3.12 on the machine that will run inference. Create an isolated environment and install the pinned requirements:

```powershell
py -3.11 -m venv .voice-venv
.\.voice-venv\Scripts\python.exe -m pip install -r services/voice/requirements.txt
```

For IndicConformer, request access on its [official Hugging Face page](https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual), review its gated card/implementation and verify the supported language codes. Provide a read token through `HF_TOKEN` in the installer environment, then explicitly opt into authentication. After verifying all twelve selected Indian-language codes, the first-install command is:

```powershell
.\.voice-venv\Scripts\python.exe services/voice/install_models.py --allow-model-code --use-hf-token --indic-languages hi,mr,bn,te,ta,gu,kn,pa,or,ml,as,ur
```

`--indic-languages` records the operator-reviewed subset when the publisher's language metadata is missing; it does not certify model quality. Omit unsupported codes. Without declared/reviewed languages the installer refuses to advertise Indic coverage. `HF_TOKEN` is used only for explicit downloads/repair and is never written to the model lock. Remove it from the installation environment afterward; runtime needs no Hugging Face token. Never place it in browser/public environment variables. The separate `VOICE_SERVICE_TOKEN` authenticates your owned service.

`--no-chat` omits the optional conversation model for a smaller deployment. Keep the model-lock file, model cache and dependency environment when moving/backing up the service. eSpeak NG is a separate optional installation from its official distribution; preserve its license notices. `ESPEAK_NG_PATH` may point to the executable if it is not on PATH. The health endpoint reports only voices actually found on that installation and Indian ASR locale tags declared in the installed model metadata.

Normal installer runs retain the existing lock without downloading anything. To restore missing snapshot files after a damaged cache, explicitly run `services/voice/install_models.py --repair` with the same environment. Repair uses only the revisions already in the lock and does not update model choices or rewrite the lock. Keep its backup: repair cannot reconstruct a lost lock. `--no-chat` is an installation-time choice; adding a conversation model later requires a separately reviewed installation, rather than silently changing an existing lock.

The installer remains unauthenticated unless `--use-hf-token` is explicitly supplied. A gated snapshot repair may also need that flag and approved account access, but it still uses only the original locked commits. Health metadata indicates installed snapshot presence and declared/reviewed languages, not a successful inference benchmark.

Run the local-only service at the fixed default port:

```powershell
.\.voice-venv\Scripts\python.exe -m uvicorn server:app --app-dir services/voice --host 127.0.0.1 --port 8765
```

For Next.js on that same machine, add once to `.env.local`:

```dotenv
VOICE_SERVICE_URL=http://127.0.0.1:8765
```

For a deployed Next.js server, localhost refers to that server, **not your clinic PC**. Use a reachable owned HTTPS service and matching `VOICE_SERVICE_TOKEN` at both ends; do not expose an unauthenticated inference port. The browser always calls the same-origin app proxy, keeping the service token out of browser bundles. No hosted Hugging Face endpoint, rented GPU or paid API is automatically enabled.

Hardware, electricity, bandwidth, uptime and hosting still have costs. Larger speech models may be slow on CPU or exceed cheap-phone memory. The owned server is optional: its absence must not block local emergency guidance, navigation or request capture.

## Verification evidence and remaining gates

Updated 23 November 2026: **323 unit cases**, **20 Python contracts**, 25 sealed migrations and local type/lint/import/size/Knip gates passed. Browser suite has **24 journeys**, with **21 local passes** and three authenticated-role cases for CI's disposable stack. Required database/safety suite is **29 cases**, with no skipped assertions allowed in its CI job. See [FINAL_AUDIT.md](FINAL_AUDIT.md) and [FINAL_VERIFICATION.json](reports/FINAL_VERIFICATION.json) for finishing-commit evidence.

Python tests do not install or execute weights. Browser recognition/synthesis is mocked. Real microphones, all-language quality, low-end Android/iOS, clinical review, disability usability and real conferencing remain release gates. Earlier receipt/audio/security mutation records remain in [ASSISTANT_BACKEND_TEST_EVIDENCE.md](ASSISTANT_BACKEND_TEST_EVIDENCE.md) and [CONSULTATION_CLIENT_TEST_EVIDENCE.md](CONSULTATION_CLIENT_TEST_EVIDENCE.md).

Startup never probes experimental offline recognition while closed; user activation/preparation is required. Independent missing snapshots, digest failure, device/owned failover, private proxy limits and safe repair are described in [MODEL_FALLBACK_AND_OPERATIONS.md](MODEL_FALLBACK_AND_OPERATIONS.md). New installations have per-file digests; older compatible locks have weaker integrity evidence. Corrupted present snapshots fail closed, including explicit repair; restore a known-good backup or repair removed damaged files at the same locked revision.

The finishing audit explicitly patched the optional Python dependency pins after public advisory review. Model identifiers, locked revisions, ports and protocol did not change. Metadata checks do not certify the pinned custom Indic code against the updated runtime; validate the isolated host before release. See [PYTHON_DEPENDENCY_AUDIT.json](reports/PYTHON_DEPENDENCY_AUDIT.json).
