# ABDM and FHIR interoperability boundaries

Updated 23 November 2026. This repository implements local document formatting and validation; no national gateway certification or live identity verification is claimed.

lib/abdm/fhir generates prescription, diagnostic and encounter FHIR R4 document bundles using the repository's modeled NRCES profiles/codes. Unit conformance cases check the implemented structure and selected fields. They do not replace an official national validator, interoperability session or clinical coding review. Preserve clinical provenance and units when extending documents; a formatted document is not permission to exchange it.

The export service requires the authenticated owner or a doctor with the implemented care relationship; administrators cannot export confidential patient clinical bundles. Database RLS and server role/care checks remain authoritative. Raw record/database failures are not published through exception detail. Test owner, unrelated patient/doctor and admin boundaries before release.

lib/abdm/client.ts checks ABHA number/address syntax only. Its mode is always simulated and isLive is false, including when environment credentials exist. A format-valid result does not verify identity, ownership or enrollment. There are no implemented NHA token, OTP, consent manager, HIP/HIU, discover/link or national health-information exchange requests in that stub.

Live national integration requires a separate owner-approved design, official sandbox/production onboarding, secure server credentials, authenticated consent/provenance, retry/audit/privacy controls and independent national/clinical validation. No configuration flag or free hosted quota establishes those requirements. No real national requests or production patient data were used in this finishing audit.

See [API_REFERENCE.md](API_REFERENCE.md), [CLINICAL_SAFETY.md](CLINICAL_SAFETY.md) and [FINAL_AUDIT.md](FINAL_AUDIT.md).
