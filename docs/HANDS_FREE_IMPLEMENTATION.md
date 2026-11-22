# Website controller: implemented behavior and release audit

Updated 22 November 2026. This update implements a controller across the existing website, including accessibility and task replacement. It does not certify every device, language, clinical workflow or browser/OS handoff as touch-free.

## What is implemented

| Capability | Current behavior |
|---|---|
| Website mapping | 507 stamped first-party JSX templates, including error/loading surfaces; 497 candidates reachable from the 28 page entries and global layout, across 99 files. Counts include forms, wrappers and explicit handoffs, not 507 independently executable actions. |
| Active options | “Page options” advertises five controls at a time from the current page or active modal. “More options” advances through the snapshot. Hidden/inert controls are excluded; disabled controls are explained and cannot execute. |
| Selection | “Select three” resolves an advertised number to its stored element, stable source registration and current fingerprint. A unique accessible name can also select a control. Ambiguous names require numbered selection. |
| Navigation and filters | Registered links, navigation, tabs, filter choices, pagination and local state controls reuse their existing handlers. A Radix tab uses its supported Enter-key handler. |
| Field editing | Selecting a non-secret field enters field mode. Dictation reaches the existing React change handler through native input/change events. Date and numeric inputs use the existing localized parsers; selects accept existing enabled options. “Next field,” “previous field” and “clear field” operate the active page fields. |
| Accessibility | Font size 12–24 px in 2 px steps, contrast on/off, reset, page reading, stop reading and speech rate controls. Toolbar and bot use one shared state store. Font, contrast and rate persist locally; opening the panel does not persist as a preference. The toolbar remains on `/emergency`. |
| Task replacement | Text input, Speak, task cards, page options and Cancel task remain usable during a pending assistant request. Known new tasks leave unrelated guided stages. “New question …” and “new request …” explicitly leave field/intake mode. |
| Avatar controls | Close assistant, listening/replay and offline-preparation commands reuse the avatar controls, with conference/beacon/online readiness checks. First microphone activation and reopening a stopped/closed voice session still require an available device input. |
| Corrections | “Correct last answer” revisits supported symptom/booking questions and revokes prepared confirmations. Page-field values can be replaced directly in field mode. |
| Spoken interruption | During output, an activated session can use supported native recognition for the restricted wake-prefixed channel: “RuralHealth cancel task,” “RuralHealth new request …,” “RuralHealth stop,” or emergency. Native command suffixes use the selected catalog. Echoes of the current output and affirmative confirmations are rejected. Devices without concurrent native recognition require Speak/Cancel or an OS assistive input. |
| Nearby facilities | “Nearest,” including category commands, operates the map's existing filtered data. PHC requests inspect tier/name rather than equating every PHC with the health-post badge. The selected entity is shown and its list page is opened. Existing call/route controls carry the facility's name and ID. |
| Map controls | First-party controls call the supported Leaflet zoom/pan/recenter API. They do not inspect third-party widget DOM. |
| Meetings | Authorized Jitsi mounts expose first-party microphone, camera, chat, raise-hand, tile-view and leave controls through the configured external API. Mute indicators use SDK events. Screen sharing/fullscreen are explicit device handoffs. Assistant microphone use remains paused in meetings. |
| Offline packs | Version 1/catalog revision 4 includes all 13 native controller catalogs, facility/media labels and existing workflow/parser data. Older revision-3 preparations must be refreshed. This does not install ASR/TTS models. |
| Optional models | Existing identifiers, locked snapshots, port 3000/8765 and v1 protocol are unchanged. The controller requires no model to enumerate or execute its permitted menu. |

## Control identity and execution

`scripts/data/register_voice_controls.mjs` stamps first-party JSX with stable `data-voice-control="ui.<opaque-id>"` values and generates `lib/assistant/registered-controls.json`. IDs remain in source when code moves; line numbers are audit references, not identities. New controls receive a new ID. The ordinary script run verifies the map; only an explicit `--register` regenerates it. CI runs that verification.

Each entry has a source path, tag, disposition, secure-field marker and field type. Dispositions are:

- `local`: navigation/state interactions through the existing visible control.
- `field`: native editable field, subject to type/enabled/validity checks.
- `confirm`: review and explicit yes/no before requesting a page action.
- `link`: internal navigation or reviewed external/dialler handoff; unsafe URL protocols are rejected.
- `handoff`: secure/device input or an unreviewed legacy write; the bot explains that assistance is required and does not activate it.
- `container`: form/custom wrapper whose child controls own interaction.
- `assistant`: the avatar's own controls, served by its workflow/global command router rather than recursively included in the page menu.

The implementation uses a source-approved native-control adapter for broad coverage instead of duplicating hundreds of page handlers. It enumerates only stamped first-party controls. Number/name matching chooses among those registrations; it does not accept a model-selected selector, JavaScript, table name or arbitrary URL. Inputs use the existing React handler/validation; buttons reuse the corresponding existing handler. Availability and current modal scope are rechecked immediately before execution.

A selection/confirmation retains the actual element and a fingerprint of its label, destination, entity and non-secret form values. Replaced/disconnected/disabled targets or changed values cannot execute a stale selection. Repeated facility/doctor/patient/appointment controls have entity context where added; the runtime element is also part of identity. The full hidden/modal/dynamic-state audit remains a release gate, particularly for repeated controls without useful native labels.

A generic page action says **requested**, then the existing page owns the actual validation/error/result. It never declares a booking, prescription, notification delivery, benefit application or emergency dispatch merely because a click handler ran. Its review includes available non-secret form fields within the form/modal/card; long fields are truncated for the spoken review and must be inspected through the page reader before consequential submission. Assistant booking/cancellation still require the existing signed drafts and validated server receipts before success speech.

## Conversation and audio lifecycle

Assistant task generations invalidate old reads and model calls. Task replacement aborts those requests, revokes prepared confirmations, clears guided choices, and prevents an old completion/finally block from resetting a newer task. Facility follow-up announcements are cancelled when the task changes. Route/account/language transitions discard page-control DOM references.

**Cancelling the conversation cannot roll back an already submitted mutation.** A dispatched booking/cancellation continues to be reconciled through its receipt for the same account/language session. A late successful receipt may add its acknowledgment without resetting the newer dialogue. A timeout produces a request/result-check message, not a fabricated failure or rollback. After an account/language transition, check the authoritative appointment/page result again. Page handlers outside the guided workflow keep their own existing request lifecycle.

Speech/transcription requests, recorder startup, playback URLs, native recognition, timers and old callbacks retain turn ownership checks. A new request can interrupt output and transcription. The restricted interruption listener is active only after voice activation, while visible, where native recognition is available; it never authorizes a write. Matching transcript text contained in current output is ignored. Hardware echo cancellation, accents, native wake-name recognition, ambient speech and false interruption rates still require device testing. This is not a measured all-device barge-in guarantee.

Page reading uses the same avatar voice session and selected speech locale; it does not use a competing English-only toolbar synthesizer. The command asks for consent because private page content may be audible. The direct toolbar Read page button is an explicit reading request. It reads a bounded portion of `main` and does not send that text to the optional conversation model or persist it as a draft. Secure-field selection stops recognition, announces the secure-input instruction when a voice is available, and does not automatically resume listening afterward.

Visibility changes, conference entry and emergency-beacon ownership continue to stop the assistant microphone. Stop only cancels native speech owned by the assistant; emergency speech has its own controls. The avatar's typed controls and accessibility settings remain available. Meeting speech coexistence is deliberately not enabled without hardware validation. A stopped/hidden microphone is not silently restarted by old timers.

## Simple operating steps

1. Open the website/PWA and activate the avatar. Choose the language and grant the microphone permission using a supported device input.
2. Say **page options**, then **select one** or **more options**. Open menus/tabs and ask for options again to discover their controls.
3. Select a field, dictate the value, and use **next field**, **previous field** or **clear field**. Use **new question …** to leave field mode. Passwords/codes use secure OS input.
4. Say **increase font size**, **high contrast on**, **read page**, **speak slower** or **reset accessibility** whenever needed. Equivalent native commands ship in every selected language.
5. Say **cancel task** or **new request …** to switch tasks. During speech, where supported, prefix the interruption with **RuralHealth**. Cancel task/Speak remain physical and switch-accessible alternatives.
6. Review consequential actions and say **yes**. Listen to the actual page/server result; **requested** and **queued** are not final success.
7. Prepare offline guidance while online. Reopen/reactivate voice after a closed or suspended app. Refresh older installed language preparations to revision 4.
8. Keep the existing optional voice server if device speech is inadequate. No model name or port change is required by this controller update.

## Verification and unresolved release gates

Local checks cover type/lint/imports, component/API size limits, the source registry, native command catalogs/checksums, task ownership, spoken-interruption grammar and existing action/audio/account security contracts. Playwright uses mocked recognition/synthesis/service responses to test actual root font/contrast changes, toolbar synchronization, guided corrections, slow-request replacement, wake-prefixed interruption, navigation, fields, secret exclusion, disabled/stale targets and emergency-page accessibility. Real role login and database cases run against CI's disposable Supabase stack, not production.

Local evidence for this update: **307 unit cases and 15 Python contracts passed**; type/lint/component/Knip/migration/source-map checks passed; production build passed. The full local browser run passed **17 journeys**, with the three role-login journeys skipped because disposable credentials were not available locally. CI seeds those accounts and must pass the full 20-journey suite and 29 real-database cases before release. Browser audio is simulated, not an inference or disability-usability certification.

Before calling this fully hands-free for a target population, audit:

| Gate | Evidence still required |
|---|---|
| All 28 pages/states | Enumerate live enabled, disabled, modal, tab and repeated-result controls for patient/doctor/admin roles. Verify swallowed custom props, unlabeled icons and useful entity context. Source coverage alone is insufficient. |
| All 13 languages | Native review of command/output catalogs and page labels. Most legacy pages still have English/Hindi source labels and depend on online DOM translation for other page text; native controller vocabulary is independent. Offline native page labeling is not complete. |
| Speech and interruption | Real ASR/TTS and concurrent-recognition tests on low-end Android, iOS and desktop, including noise/headsets/echo, false wake/yes, secure input, silence, latency and denied permissions. No heavyweight model inference has been certified here. |
| Device handoffs | Microphone/location permission, files, camera, OAuth, password managers, diallers, share/print/fullscreen/screen sharing. Validate Android Voice Access/iOS Voice Control or equivalent. The page cannot grant its own trusted gestures. |
| Legacy writes | Doctor invitation/provisioning, admin role/removal/record erasure and reopen/reschedule require their independent server/security review. Their mapped handoffs are not newly implemented write services. |
| Clinical/disability | Qualified clinical review and sessions with users with the actual access needs, including non-readers, screen-reader/switch users and Urdu layouts. |
| Offline/operations | Cache eviction, saved-region coverage, queued-write receipts, lost connectivity, service uptime and battery. PWA closure/suspension cannot guarantee continued listening. |

The code adds no required paid inference or automation API and no dependency package. Hosting, hardware, electricity, bandwidth, native recordings and review effort still cost money. Free hosted quotas cannot be guaranteed forever. Native recordings for devices without a dynamic voice remain planned; no recordings or model weights were fabricated or installed as part of this update.

Use [the complete route option map](HANDS_FREE_ACTION_MAP.md), [per-control inventory](HANDS_FREE_CONTROL_INVENTORY.md), [original design/release plan](HANDS_FREE_WEBSITE_PLAN.md) and [setup checklist](ASSISTANT_RELEASE_CHECKLIST.md) together. The inventory records source registrations/dispositions; this file defines what those registrations do and what they cannot certify.
