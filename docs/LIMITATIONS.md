# Current limitations and release gates

Updated 23 November 2026. Implemented source behavior is distinct from clinical certification, production verification and actual disability usability. [FINAL_AUDIT.md](FINAL_AUDIT.md) records current evidence.

| Area | Boundary |
|---|---|
| Background operation | A PWA cannot guarantee continuous listening after closure, suspension, battery restrictions or permission loss. Reactivate when reopened. |
| Languages | Thirteen native assistant catalogs exist. Matching ASR/TTS depends on actual engines; native quality needs review. Most legacy page labels are English/Hindi plus online DOM translation. |
| Offline | Public/language packs do not contain complete audio engines or every page/data region. Browser storage can be evicted. Owned inference must remain reachable. |
| Page automation | 509 source registrations are not 509 independently verified live actions. Active modal/page scope and target checks reduce stale execution; all role/dynamic states need auditing. |
| Secure/device controls | Passwords, codes, permission prompts, uploads, OS diallers/OAuth/share/print/fullscreen need trusted device assistance; browser code cannot grant its own permission. |
| Task replacement | Old dialogue is revoked. Already submitted mutations cannot be rolled back by cancelling chat; inspect the authoritative receipt/page state. |
| Legacy workflows | Browser-local claim references fail closed in production and cannot provision roles. Legacy admin/provisioning writes mapped as handoffs retain independent release reviews. |
| Clinical | Symptom/emergency rules and model responses are decision support. No diagnosis, dosage, emergency dispatch or clinical/disability certification is claimed. |
| ABDM | Local FHIR formatting and ABHA syntax only; credentials do not create national verification/consent exchange. |
| Conferencing | Connectivity/provider/permissions required; automatic measured video-to-audio downgrade is not implemented. |
| Private storage | NetworkOnly protects HTTP Cache Storage; private IndexedDB/localStorage still exists. Shared-device cleanup and device-loss privacy need testing. |
| Rate limits | Redis is shared when configured; memory fallback is per process, not fleet-wide abuse protection. |
| CSP | Report-only; no blocking enforcement claim. |
| Secrets | Publication/import/scanner checks reduce known patterns; no permanent or absolute non-disclosure proof. Public routes/config must remain reachable. |
| Dependency security | Five accepted high npm package exceptions expire 31 December 2026. Pinning does not eliminate security maintenance. Full installed Python vulnerability evaluation remains a deployment gate. |
| Costs | No new required paid inference API; compute, power, hosting, review and provider quotas have costs and changing terms. |

Doctor care access uses authoritative role and actual server/RLS relationships, including scheduled/completed appointment conditions where implemented; a client-supplied role or invite URL grants no access. Directory verification flags describe stored source data, not national credential certification or confirmed clinic availability. Public contact publication still needs owner consent/content review.

Local CI mocks audio and cannot certify microphones, model quality, battery life, waking accuracy, low-end performance, live meetings or every language. Production database/deployment operations were not executed. See [ASSISTANT_RELEASE_CHECKLIST.md](ASSISTANT_RELEASE_CHECKLIST.md) and [MODEL_FALLBACK_AND_OPERATIONS.md](MODEL_FALLBACK_AND_OPERATIONS.md).
