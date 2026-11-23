# Model fallback and operations

Updated 23 November 2026. This document specifies implemented fallback behavior and the operator work that remains. Fixed contracts avoid routine model-name/port changes; they do not promise permanent service availability or freedom from security patches.

## Model and protocol inventory

| Function | Candidate | Runtime contract |
|---|---|---|
| Indian-language ASR | ai4bharat/indic-conformer-600m-multilingual | Explicitly reviewed custom code; only installed declared/operator-reviewed locales advertised |
| English ASR | openai/whisper-tiny | Local snapshot, local-only processor/model loading |
| Optional dialogue | Qwen/Qwen3-0.6B | Local snapshot; advisory output only; no action tools |
| Dynamic TTS | Matching browser/OS voice or optional eSpeak NG | Health reports actual installed owned voices; availability differs by device/language |
| Website automation | Deterministic registered control and workflow router | No inference requirement; server authorization and confirmation remain authoritative |

The installer reads model identifiers once from services/voice/install_models.py. Initial installation resolves an immutable 40-character revision, approved license identifier and relative snapshot path. New installations inventory files and SHA-256 digests. Runtime uses offline Hugging Face/Transformers flags and local_files_only; it does not fetch or resolve latest. The model lock is a local ignored operator artifact and must be backed up with the snapshots and dependency environment.

The ports remain website **3000** and inference **8765**, protocol v1. Internal service origin/token are read in lib/services/voice-config.ts and the server proxy, never in client-imported assistant configuration. A remote origin requires HTTPS and a nonblank matching service token. Fixed ports are defaults, not credentials or a security perimeter.

## Fallback decisions

| Failure or absence | Implemented result |
|---|---|
| No voice host configured or reachable | Native commands, navigation, emergency text, pictorial choices and request capture continue; use supported device speech |
| Owned ASR inference fails | That locale uses device recognition for the session if online or a verified local recognition pack is available |
| Device TTS playback fails | Attempt reachable owned TTS for an advertised matching locale |
| No matching speech voice | Keep accessible controls/text; do not replace native language with an English voice |
| Optional chat model fails/is omitted | Deterministic helper response; existing guided workflows continue |
| One snapshot is missing | Manifest lists that model unavailable and retains independent usable models |
| Manifest has an untrusted repo/path/revision or unapproved code | Fail closed rather than load an unreviewed replacement |
| Hashed snapshot bytes are changed | Integrity check fails at model load; do not infer with those bytes |
| App hidden, suspended, conference/emergency microphone owned | Stop/release assistant recording; require an appropriate later activation |
| A previous request completes after task replacement | Generation checks prevent stale dialogue/selection changes; submitted mutations still need receipt reconciliation |

Device recognition may use a browser-vendor network service. Only an explicitly verified installed recognition pack establishes the supported local/offline path. Owned inference requires a reachable host; a clinic PC reachable online is not an offline engine inside the phone. Session failover is cleared by a new assistant session/reload, not continual retry loops. Microphone denial and recorder initialization errors remain explicit failures, with controls available.

## Integrity and repair

The manifest validates approved repository names, immutable revisions, relative canonical paths, licenses and file paths. New per-file digests are checked at load, not each health poll. Health is capability/presence reporting, not proof of successful inference or checksum verification of every loaded model. Older locks without hashes remain compatible and have weaker byte-integrity evidence; use a known-good backup and a separately reviewed installation when upgrading that evidence.

Ordinary installer runs keep an existing lock unchanged and perform no download. Explicit --repair restores missing files only at the original locked revision and verifies any existing digest inventory after restoration. Present but corrupted files fail closed before repair downloads. Restore a known-good backup or deliberately remove the damaged snapshot and repair at the same revision; verify digests before restart. Never delete the lock to resolve latest as a routine repair. Gated access may require the original approved account/token. The installer never accepts publisher terms automatically.

## Hosting and rollout

Follow [VOICE_ASSISTANT_SETUP.md](VOICE_ASSISTANT_SETUP.md) for the exact isolated Python/install/start commands. Review the gated Indic card, custom code, weight terms and language coverage before allowing it. Keep HF_TOKEN only in the explicit installation environment and remove it afterward. Runtime requires no Hugging Face token. Optional eSpeak NG is installed separately and its voice notices must be preserved.

A Next.js serverless deployment does not start the Python host. Deploy inference on an owned reachable machine/service, supervise that process with the host's service manager, restrict ingress to the application where possible, use HTTPS/authentication for remote traffic, and configure both sides with the same secret. Do not publish private host addresses in repo documentation. A localhost origin works only when the Next.js process and inference process share that host.

Check capabilities, then perform actual ASR/TTS/dialogue in each supported locale on the target hardware. Test missing host/model, corrupt files, timeout, noise, denied microphone, suspension and recovery. Back up locks/models/config without publishing credentials. Monitor availability without logging audio, transcripts, private page content, access tokens or model prompts.

## Maintenance and cost

Dependency versions and model revisions are pinned; package/model updates are explicit operator actions. Security advisories, runtime/OS compatibility, browser engine changes and provider retirement can still require maintenance. Run dependency/security gates before releases and resolve expiring accepted risks. No automatic patching or hidden billable hosted inference is introduced.

Free weight access is separate from license obligations and compute/hosting cost. No permanent background PWA microphone or unlimited free hosted service can be guaranteed. Recorded native guidance and full browser-contained multilingual inference remain planned, not installed. See [FINAL_AUDIT.md](FINAL_AUDIT.md) for verification and release gates.

The finishing audit explicitly patched the optional Python dependency pins after public advisory review. Model identifiers, locked revisions, ports and protocol did not change. Metadata checks do not certify the pinned custom Indic code against the updated runtime; validate the isolated host before release. See [PYTHON_DEPENDENCY_AUDIT.json](reports/PYTHON_DEPENDENCY_AUDIT.json).
