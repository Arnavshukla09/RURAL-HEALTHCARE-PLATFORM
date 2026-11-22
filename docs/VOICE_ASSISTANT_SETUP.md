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

Model identifiers are defined once in `services/voice/install_models.py`; protocol limits/port are in `lib/assistant/config.ts`. The explicit installer resolves immutable model commits and writes `.models/model-lock.json`. Re-running it preserves an existing lock. Runtime sets Hugging Face/Transformers offline mode and loads only local snapshots; it does not check for newer models, download at startup, or rotate model names. Moving the service folder preserves relative snapshot paths. Normal security maintenance may still require dependency updates; no code can responsibly guarantee never needing maintenance.

## What works without a model service

- Persistent avatar and native instructions, navigation and pictorial choices.
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

This repository contains the service and installation contracts. Its heavyweight dependencies and model assets were **not installed or downloaded in this session**: automatic approval review rejected network/dependency access. Browser/real microphone/model quality has not been certified. The candidate's code and weight licenses, native-language quality and hardware compatibility must be checked at installation. The installer accepts only explicitly listed permissive license identifiers; it does not replace reading the actual model/voice terms.

Use Python 3.11 or 3.12 on the machine that will run inference. Create an isolated environment and install the pinned requirements:

```powershell
py -3.11 -m venv .voice-venv
.\.voice-venv\Scripts\python.exe -m pip install -r services/voice/requirements.txt
```

Review the official model card and pinned custom AI4Bharat implementation before the explicit first download:

```powershell
.\.voice-venv\Scripts\python.exe services/voice/install_models.py --allow-model-code
```

`--no-chat` omits the optional conversation model for a smaller deployment. Keep the model-lock file, model cache and dependency environment when moving/backing up the service. eSpeak NG is a separate optional installation from its official distribution; preserve its license notices. `ESPEAK_NG_PATH` may point to the executable if it is not on PATH. The health endpoint reports only voices actually found on that installation and Indian ASR locale tags declared in the installed model metadata.

Normal installer runs retain the existing lock without downloading anything. To restore missing snapshot files after a damaged cache, explicitly run `services/voice/install_models.py --repair` with the same environment. Repair uses only the revisions already in the lock and does not update model choices or rewrite the lock. Keep its backup: repair cannot reconstruct a lost lock. `--no-chat` is an installation-time choice; adding a conversation model later requires a separately reviewed installation, rather than silently changing an existing lock.

The installer uses public, unauthenticated Hugging Face downloads. A gated or private model is not supported by this installer and requires a separately reviewed access configuration. Health metadata indicates candidate snapshot presence, not a successful inference benchmark.

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

Final local verification on 22 November 2026 passed **300 unit tests**, TypeScript, ESLint, Knip, import/export checks, module limits and **25 sealed migration hashes**. The production build passed using placeholder Supabase credentials. The dependency-free Python suite passed **11 tests**. The full Playwright run passed **7 tests** including all five assistant journeys; **3 existing role-login cases skipped** without local test accounts. Integration smoke passed **3 tests** and skipped **26 database-dependent tests** across 29 cases; this is not a database integration pass. Dataset provenance and 21 algorithmic benchmark checks passed. The npm audit passed with the existing, unexpired advisory allowlist, not zero advisories. CI now requires both database suites, all 29 cases and zero skips, and runs Python contracts without heavyweight model installation.

- Existing and new unit tests exercise language/confirmation parsing, native numeric/date/temperature handling, server authorization, replay ownership, private-data cleanup, signed actions, clinical severity floors, and safe booking/room/record acknowledgments.
- Eleven Python tests validate offline runtime flags, immutable snapshot locks, relative path relocation, repair at locked commits, local/token access and one-time custom-code approval. They do **not** execute downloaded models.
- Five Playwright assistant journeys passed after localhost execution became available: guided intake with explicit units, emergency routing after network loss, Assamese/Urdu selection, invalid consultation links and explicit server-denied rooms. Speech and model responses are mocked; no real microphone/model certification is claimed.
- Six new real-database replay tests and existing RLS tests remain unexecuted without a local database stack.
- Native-speaker speech/content review, actual low-end Android/iOS testing, and real conferencing remain release gates.

Focused voice receipt cases additionally reject a scheduled appointment returned as a cancellation receipt, incorrect provider/date/operation IDs and mismatched prepared selections/users. A cancellation-status mutation made that behavioral test fail and the restored implementation passed. Recorder lifecycle tests verify cancellation does not transmit captured audio and that late permission or initialization failures release the microphone. Eight beacon/hardware race cases exercise stop/restart/unmount and late resource acquisition. Backend and consultation mutation evidence is recorded in [ASSISTANT_BACKEND_TEST_EVIDENCE.md](ASSISTANT_BACKEND_TEST_EVIDENCE.md) and [CONSULTATION_CLIENT_TEST_EVIDENCE.md](CONSULTATION_CLIENT_TEST_EVIDENCE.md).

The new optional conversation endpoint uses only the configured owned service. Browser speech recognition can use the browser vendor's network service when an on-device pack is unavailable; a language tag does not establish local processing. Configure owned inference or use a verified local recognition pack for speech that must remain local. Other pre-existing application features retain their external-service dependencies.
