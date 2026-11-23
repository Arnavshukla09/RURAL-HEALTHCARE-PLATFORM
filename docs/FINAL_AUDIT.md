# Final source, security and documentation audit

Audit date: **23 November 2026**. Base revision: `d4aeb5f`. Scope: the current working source, newly added assistant/controller, accessibility and map updates, private voice proxy, model installation/fallback, publication controls and active documentation. This is a source/test audit, not a production penetration test or clinical certification. No production database SQL, reset, migration or patient-data test was executed.

## Findings resolved

| Finding | Final implementation and evidence |
|---|---|
| Foreign preview domains trusted by wildcard | Exact request/configured origins only; production rejects foreign preview origins. Cross-site mutation Fetch Metadata rejected. Behavioral mutation fails origin test. |
| Unbounded or redirecting voice responses | Reject upstream redirects; bound streams, JSON/WAV input/output, content types, protocol and language fields. Proxy errors are generic; capabilities omit internal model metadata. |
| Private configuration in client-imported assistant module | Moved origin/token handling to server services. Import graph checks 152 client roots and 264 reachable modules; no forbidden server secret references. |
| Raw database/exception logging and responses | Static failures across changed endpoints/services, dropped sensitive/nested logger payloads, recognized credential/URL/email redaction and request-ID/query bounds. Arbitrary free text still needs care. |
| Public directory enriched private patient contacts | Explicit public provider-field selection; removed patient-profile enrichment. Behavioral select-all mutation fails the boundary test. |
| Legacy browser claim secret/bypass | Removed server secret reference from demo module, removed constant bypass and rejected local claim references in production. Production-disable mutation fails. This does not implement trusted clinician invitation issuance. |
| ABI/identity stub overclaimed live service | ABDM format stub always simulated/isLive false, including configured credentials; output explains identity is unverified. |
| One missing optional snapshot disabled all models | Independent usable/unavailable manifest entries; untrusted manifest fails closed; missing Indic leaves English/chat usable. |
| Snapshot bytes had no integrity inventory | New installations record per-file SHA-256; load and explicit repair verify hashes. Older locks remain compatible with weaker integrity evidence. Corrupt present snapshots fail closed. |
| Speech-engine failure blocked output/input path | Session device fallback after owned ASR failure; owned TTS after supported device failure; unavailable native speech leaves controls usable. Core controller/emergency help does not depend on dialogue models. |
| Stale target survived a new modal | Recheck active page/modal scope immediately before execution; browser regression revokes the old selection. |
| Stale docs and exposed deployment identifiers | Rewrote active README/architecture/API/deployment/components/limits/setup/model operations. Marked historical reviews as historical. Redacted retained deployment identifiers; reports publish metadata only. |
| Optional inference pins had known advisories | Explicit patched direct dependencies selected from official fix metadata; OSV query of 54 resolved/candidate package versions returned no known findings. See dependency evidence and compatibility limits below. |

## Working product state

The floating UI separates Chat from Actions and collapses settings. Shared accessibility remains available through the avatar and toolbar. Map controls order location/search, service filters, then GPS/radius/Nearest; nearest respects service selection. Leaflet lifecycle is owned by one effect, with zoom upper-left and pan/recenter lower-right.

The website inventory is **509 registered first-party templates**, **499 reachable candidates**, **28 page entries**, **100 reachable files** and **24 API routes**. Templates include wrappers, disabled/hidden candidates and explicit handoffs; source registration is not certification of every live action. Only current registered controls are advertised. Target identity, fingerprint, modal scope, enabled state and confirmation are checked. Model text does not supply scripts/selectors/URLs or bypass authorization.

Task replacement revokes old dialogue/read/model callbacks and prepared selections. It cannot roll back dispatched transactions. Guided writes require server receipts; generic page activation says requested. Secure fields and device prompts require supported device input. Thirteen native assistant catalogs exist; most legacy page text still depends on English/Hindi or online DOM translation. No matching speech engine means accessible text/pictorial controls remain.

## Verification evidence

| Check | Result and scope |
|---|---|
| Component gate | Passed imports/exports, TypeScript, ESLint, module/API size, Knip and **323 unit cases** |
| Production build | Passed with placeholder database credentials; no live configuration/data attestation |
| Python contracts | **20 passed**; standard library only, no inference/model installation |
| Browser suite | **21 locally passed**, three role cases deferred to disposable seeded CI; **24 total**; recognition/synthesis mocked |
| Database suite | **29 required cases** in disposable CI with fail-on-skipped report gate; no local Docker stack available |
| Model/source control registry | **509**, zero missing registrations; hashes/route inventory refreshed |
| Dataset provenance | Local file rules passed; source directory 456 entries and 42,321 raw coordinate-valid facility rows; not national credential validation |
| Algorithmic benchmark | **21/21** passed; simulations distinct from live database/network evidence |
| Security mutations | **Five** vulnerabilities deliberately injected; expected tests failed, restored source passed; metadata in SECURITY_MUTATIONS.json |
| Publication scan | Zero current source/document findings; no matched strings or environment values published |
| Gitleaks | Current source and retained history scans passed under explicit reviewed exceptions; raw redacted reports stay ignored |
| Client boundary | 152 roots/264 modules, zero findings for the checker scope |
| npm advisories | Gate passed with five accepted high package exceptions expiring **31 December 2026**; not zero advisories |
| Python advisory query | 54 resolved/candidate public package versions, zero known OSV findings; not a full installed-platform vulnerability certification |
| Documentation links | Local file links checked; external pages/anchors are outside this gate |

Machine-readable evidence: [FINAL_VERIFICATION.json](reports/FINAL_VERIFICATION.json), [SOURCE_INVENTORY.json](reports/SOURCE_INVENTORY.json), [PUBLICATION_SAFETY.json](reports/PUBLICATION_SAFETY.json), [SECRET_SCAN_SUMMARY.json](reports/SECRET_SCAN_SUMMARY.json), [SECURITY_MUTATIONS.json](reports/SECURITY_MUTATIONS.json), [PYTHON_DEPENDENCY_AUDIT.json](reports/PYTHON_DEPENDENCY_AUDIT.json). Finishing-commit CI is recorded separately in the final verification report; base-revision CI success is not evidence for later changes.

## Endpoint and secret boundary

The browser necessarily sees public API paths, publishable Supabase configuration and external resource requests. Hiding those paths is not access control. [CURRENT_ENDPOINTS.md](CURRENT_ENDPOINTS.md) lists application contracts without private origins or credentials. Private inference origin/token, service-role/signing keys and installation HF token stay server/operator-only. Remote inference requires HTTPS/authentication; schema/docs/redoc endpoints are disabled. Public provider records expose only selected directory fields.

Scanner exceptions are limited to explicit synthetic placeholders, exact file-checksum/storage-key patterns and retained historical incident commits. History exceptions do not prove the historical incident never exposed data; follow the owner credential-rotation runbook if needed. Ignored local environments/models/builds are not published and are outside the current source scan. Static/import checks cannot establish that arbitrary future logs, user content or dependencies will never expose a secret.

## Dependency and maintenance limits

Model IDs, v1 protocol and ports 3000/8765 remain unchanged. Runtime never downloads/repins weights. Package updates are explicit; security patches remain necessary. The patched optional Python pins move beyond the original inference versions. A Windows Python 3.11 metadata-only resolution passed for the preceding Transformers release, which was discovered to be yanked; its non-yanked patch **5.10.1** replaced it and was checked using official metadata/OSV. A complete final pip re-resolution was prevented by network restrictions after two automatic approval-review timeouts. Package versions alone do not prove custom Indic adapter, ABI or hardware compatibility. Validate the final isolated host before deployment; do not silently return to vulnerable pins.

Five npm high exceptions remain for Serwist build packages, bundled Zod and PostCSS; CI fails after expiry/new unaccepted risks. Full platform-specific Python install/lock, transitive native/CUDA libraries, inference performance and patch compatibility remain operator gates. Fixed models do not eliminate browser/OS/provider retirement or security maintenance.

## Remaining release gates

- Live role/page/modal/tab/repeated-result audit for all 28 pages; legacy write handoffs need their independent service review.
- Real ASR/TTS, interruption, permission/noise/echo/headset tests across all 13 languages on target Android/iOS/desktop hardware; native speaker review of page labels and commands.
- Qualified clinical review and usability sessions with non-readers, disabled users, screen-reader/switch users and Urdu layouts.
- Real conferencing and device handoffs; the web app cannot grant its own trusted permissions or provide guaranteed touch-free OS control.
- Offline eviction, shared-device cleanup, queued receipt reconciliation, service recovery and backup restoration; private IndexedDB/localStorage still exists despite NetworkOnly HTTP caching.
- Owner-controlled migration/deployment, credentials and monitoring; CSP remains report-only and rate-limit memory fallback is per process.

No permanent background PWA microphone or unlimited free hosting is guaranteed. No required paid avatar/inference API was added; hardware, electricity, bandwidth, hosting and review still have costs. See [MODEL_FALLBACK_AND_OPERATIONS.md](MODEL_FALLBACK_AND_OPERATIONS.md), [DEPLOY.md](DEPLOY.md) and [ASSISTANT_RELEASE_CHECKLIST.md](ASSISTANT_RELEASE_CHECKLIST.md).
