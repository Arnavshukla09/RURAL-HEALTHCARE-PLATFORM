# Assistant: simple setup, operation and release checks

Updated 22 November 2026. The code is integrated into the existing project. Production database rollout, heavyweight model installation and real-device/native-language certification are separate release steps.

## How it works

1. A floating SVG avatar appears throughout the open website/PWA. Tap it to start audio; choose one of the 13 existing languages.
2. The guide asks one question at a time. You can speak, type or tap the large choices. Matching device voices speak replies; recognition depends on the browser/device or configured owned service.
   “Page options” and “more options” discover the mapped website controls; “select three” operates an advertised option. Field mode supports next/previous/clear, and “new question …” leaves it. Font/contrast/read/reset settings work during other tasks. Use Cancel task or, during speech where supported, “RuralHealth new request …”. See [current controller behavior and handoffs](HANDS_FREE_IMPLEMENTATION.md).
3. Navigation and symptom rules run locally. Serious warning signs interrupt normal tasks and show emergency guidance and a phone-call link.
4. Booking/cancellation requires patient confirmation. The server validates identity, provider, time and the signed draft, then the avatar checks the receipt before announcing success.
5. Use the download control while online to save public guidance, native packs and application assets. Offline bookings remain pending; an account-owned queue retries when connectivity/browser execution permits. Help is not dispatched merely by opening a phone dialler.
6. Closing/suspending the app stops continuous voice operation. Reopen it and explicitly resume audio. The installed PWA shortcut and saved public guidance remain available subject to browser storage retention.

## Put it into use

1. Pull the updated repository and run `npm ci`. Keep real credentials in ignored environment files or deployment settings.
2. Follow [OFFLINE_SYNC_ROLLOUT.md](OFFLINE_SYNC_ROLLOUT.md): test both new sealed migrations on a disposable local Supabase stack. After verification, the owner applies them in order through the production migration process. Existing SQL must not be edited or reset against production.
3. Run the website with `npm run dev` at port **3000**, or deploy it through the existing Next.js workflow. The guided core does not require a hosted avatar/model API.
4. For optional owned speech/conversation, follow [VOICE_ASSISTANT_SETUP.md](VOICE_ASSISTANT_SETUP.md). IndicConformer requires one-time account access approval, explicit installer authentication and a reviewed language list when metadata omits it. Review the exact model cards/licenses, install Python dependencies and snapshots once, then start the service at **8765**. A deployed web server needs an owned reachable HTTPS endpoint and the matching server-only token; its localhost does not point to a clinic PC.
5. Preserve the model lock, cache and environment. Runtime does not download newer models. Explicit `--repair` restores missing files at the same locked revisions. Ordinary security updates still require deliberate maintenance.
6. Enable broader use only after the checks below pass on representative devices and languages. There is no claim of unlimited free hosting, certified diagnosis or uninterrupted background listening.

## Automated checks

Run from the repository root:

```powershell
npm run check:components
node scripts/data/register_voice_controls.mjs
npm run check:migrations
npm run report:dataset
npm run benchmark:integration
node scripts/ci/audit_allowlist.mjs
python -m unittest discover -s services/voice/tests -v
npm run build
```

The Python command requires an installed Python interpreter, but its contract tests do not require downloaded inference dependencies or model weights. A build needs the repository's environment configuration; use placeholders for verification instead of live database credentials.

With a disposable local database and its local test keys configured, run `npm run test:integration` with `REQUIRE_DB=1`. Both database suites must execute: **29 total cases, zero skipped**. CI's JSON verification rejects a missing or skipped atomic-replay suite. Without the database, the three safety smoke cases pass and 26 database cases are skipped; that result cannot certify database behavior.

Run `npx playwright test` for browser journeys. The assistant journeys mock speech/model service responses and do not certify real microphones or model quality. Existing patient/doctor/admin login journeys need ephemeral local test accounts; CI creates those accounts in its disposable stack. Never supply production patient accounts to the test suite.

## Manual testing and audit before release

| Check | Required evidence |
|---|---|
| All 13 languages | Native speakers review instructions, emergency wording, symptom terms, names, dates/numbers and confirmation clarity; Urdu direction is correct |
| Real speech | Test recognition and synthesis for every language on low-end Android, iOS and desktop; document unavailable voices and online/offline processing |
| Website controller | Audit all 28 routes/modal/tab/result states; voice maps 499 reachable source templates with explicit dispositions, not 499 certified executable actions |
| Interruption/accessibility | Verify actual font/contrast changes, cancellation during slow reads and submitted writes, corrections, wake/echo/false-confirmation handling and secure-input suspension |
| Offline PWA | Prepare a pack, reload offline, navigate saved pages, queue a booking, reconnect and observe an actual acknowledgment; verify storage eviction/reinstallation behavior |
| Emergency | Test local guidance, dial links, beacon interruption, stop/restart, phone lock, denied permissions and cleanup; confirm tapping does not imply dispatch |
| Identity/privacy | Account A's drafts/queue cannot appear or execute as B; logout wipes private caches and recordings; ordinary users cannot elevate roles |
| Booking/consultation | Duplicate replay creates one row; expired requests fail; failed writes never show success; unauthorized rooms never mount Jitsi; prescriptions remain appointment/author bound |
| Models/licenses | Verify exact snapshot licenses, custom model code, attribution, hardware latency/RAM and service-token exposure; benchmark real inference rather than health metadata |
| Security/operations | Review the current npm advisory allowlist before its 31 December 2026 expiry, audit Python dependencies before enabling the service, run Gitleaks in CI, and check service uptime/backup procedures |
| Clinical review | A qualified clinician reviews deterministic triage and localized emergency content; the assistant remains guidance and does not replace medical assessment |

Source-review findings are preserved in [DOCUMENTATION_ACCURACY.md](DOCUMENTATION_ACCURACY.md) and [PROJECT_REVIEW.md](PROJECT_REVIEW.md). Those files are pre-implementation snapshots; unresolved legacy workflows, vendor/device limitations and national clinical certification must not be mistaken for completed audits.
