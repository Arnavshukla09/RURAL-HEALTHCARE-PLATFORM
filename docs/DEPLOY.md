# Deployment and owner rollout

Updated 23 November 2026. This runbook describes required setup and gates; the final source audit did not deploy or execute SQL against a real project.

## Web application

1. Use Node.js 22, npm ci and the committed lockfile. Run quality/security/tests before building.
2. Configure Supabase public URL/publishable browser key and server-only service role key in the hosting secret manager. Public client configuration is visible by design; it must never grant service-role authority.
3. Set the exact canonical NEXT_PUBLIC_SITE_URL (or NEXT_PUBLIC_APP_URL if used). Configure exact approved auth redirect origins. Do not authorize every foreign preview using a wildcard domain.
4. Configure optional Redis, conferencing and external AI only when required. Missing Redis uses process-local limits; missing external AI does not disable guided navigation. ABDM credentials do not activate the format-only stub. Bhashini live integration remains unimplemented.
5. Build with npm run build; serve through the supported Next.js host. Verify login/role scope, cache rules, origin failures and accessible navigation in staging before owner release.

Never place service/signing tokens in NEXT_PUBLIC variables, committed files, screenshots or audit traces. .env.example contains blanks/synthetic configuration only. Rotate credentials through the owner process if compromised; scans do not rotate or validate live credentials.

## Database

All **25 sealed migrations** are append-only and checked against supabase/migrations.sha256. Do not edit a historical file. Deliver future changes as chronological migrations. The owner runs [OFFLINE_SYNC_ROLLOUT.md](OFFLINE_SYNC_ROLLOUT.md), including the atomic replay migration followed by the expiry guard. Missing migration returns MIGRATION_REQUIRED and retains pending requests.

Only disposable localhost Supabase may be started/reset for tests. REQUIRE_DB=1 and the report gate require 29 cases with no skipped assertions in CI. This audit never ran production SQL, migrations or resets. Review policies, backup/recovery and owner-specific data before applying rollout runbooks. Role authority is patients.role; approved doctor/admin provisioning must be a trusted server/database operation. Production rejects browser-local demo claim references; that UI is not a national clinician verification service.

## Optional owned voice host

Use [VOICE_ASSISTANT_SETUP.md](VOICE_ASSISTANT_SETUP.md) for commands and [MODEL_FALLBACK_AND_OPERATIONS.md](MODEL_FALLBACK_AND_OPERATIONS.md) for backups/integrity/failover. A serverless web deployment does not launch Python. Deploy an owned supervised host, restrict remote access, and configure a server-only HTTPS origin and matching VOICE_SERVICE_TOKEN. Bind unauthenticated local development to loopback only. Keep port 8765 and protocol v1 unless a deliberate operator decision changes configuration.

Do explicit model installation/license/code review once. Back up immutable snapshots/lock and dependency environment. Runtime does not download models. Test actual voices and inference on hardware; health/presence checks and mocked CI do not prove all-language speech quality. Models/hardware/electricity/hosting have separate costs. Provider free quotas and uptime cannot be guaranteed permanently.

## Release and recovery checklist

- Require green finishing-commit CI for quality/build, all 29 local-database cases and all 24 seeded browser journeys.
- Resolve new high/critical advisories; the five current high exceptions expire 31 December 2026. Review optional Python inference dependencies before deployment; standard-library contract tests do not vulnerability-scan an installed inference environment.
- Test all roles/pages/modal states, native languages, low-end devices, disability access, denied permissions and secure/device handoffs.
- Validate real conferencing, emergency clinical content, offline cache eviction, account switching, queued receipts and delayed result reconciliation.
- Check secret manager permissions, server-only config, exact origins, backup restore and sanitized logs. CSP remains report-only until a separate staging enforcement review.
- On inference loss, preserve core guided/text controls and deterministic emergency help; restore the same pinned snapshots, never silently repin. On database failure keep pending requests and check receipts after recovery.

The keep-alive workflow uses repository secrets and logs no project URL. It is best-effort and cannot prevent a hosted free database from pausing indefinitely. See [FINAL_AUDIT.md](FINAL_AUDIT.md) for residual risks and evidence.
