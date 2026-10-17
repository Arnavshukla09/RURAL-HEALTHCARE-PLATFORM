# Platform Limitations, Engineering Boundaries & Security Model

This document provides a transparent, evidence-based technical disclosure of the known boundaries, operational constraints, and intentional security trade-offs in the **Rural Healthcare Platform**.

---

## 1. Status & Conformance Taxonomy

Every subsystem in the repository is tracked against a strict 4-tier verification taxonomy:

| Tier | Status Label | Verification Standard |
|---|---|---|
| **Tier 1** | `Implemented & Unit Tested` | Complete production implementation verified by automated deterministic Vitest suites (`npm run test:unit`, 162 tests). |
| **Tier 2** | `Implemented & Simulation Tested` | End-to-end algorithmic behaviors verified through deterministic offline simulation suites (`npm run benchmark:integration`). |
| **Tier 3** | `Real Database Verification in CI` | Full behavioral RLS contract verification with real authenticated JWTs running in GitHub Actions CI local Supabase container (`db-tests`). Local execution requires an active Supabase test container. |
| **Tier 4** | `Planned / Roadmap` | Architecture and schema specified in documentation and database migrations, pending live integration with external national APIs (e.g. ABDM Sandbox Gateway). |

---

## 2. Directory & Provider Data Boundaries

### Facility Contacts vs. Personal Doctor Mobiles
* **Source Truth:** Public facilities (AIIMS, GMCs, District Hospitals, CHCs, PHCs) are sourced directly from official open government datasets (`data.gov.in`, MP Health Directory).
* **Boundary:** Phone numbers for public healthcare centers represent institutional contact desks, nodal officers, or department lines—**not** personal mobile devices of individual medical practitioners.
* **Integrity Guard:** The platform strictly prohibits fabricating `'Dr. '` prefixes, OPD consultation fees, or invented specialties. Facilities without specific named doctors are transparently labeled as `Medical Officer / Facility Contact` or `Institutional Contact Desk`.
* **Doctor Claim Workflow:** Individual doctors claim, verify medical registration certificates, and set OPD schedules through `/doctor/claim`. Unclaimed institutional listings have appointment booking disabled.

---

## 3. ABDM & FHIR Interoperability Boundaries

### Profile Alignment vs. National Gateway Certification
* **Conformance Status:** Modelled on NRCES FHIR R4 profile; not yet officially certified against the national validator.
* **Structural Model:** The platform formats medical records into **HL7 FHIR R4 Document Bundles** modelled on the National Resource Centre for EHR in India (NRCES) ABDM profiles (`PrescriptionBundle`, `DiagnosticReportBundle`, `OPConsultationBundle`).
* **Boundary:** While schemas and field mappings adhere strictly to NRCES StructureDefinitions, bundles have not undergone formal milestone certification through the official National Health Authority (NHA) ABDM Sandbox validator gateway or the official Java HL7 validator CLI.
* **Strict Rejection Over Fabrication:** If a record lacks required clinical data (e.g., medication timing, diagnosis code, practitioner reference), the API returns **HTTP 422 Unprocessable Entity** detailing missing fields. The platform never injects default placeholders or fabricated observation codes.

---

## 4. Doctor-Patient Confidentiality & Admin Safety Model

### Administrator Read Restriction & Audited Erasure Invariant
* **Strict Clinical Confidentiality Invariant:** To protect medical privacy under clinical ethics and data protection standards (DPDP Act 2023), administrators **never have read or update access** to confidential diagnoses, clinical consultation notes, or patient medical files (`file_url`).
* **Implementation:**
  * **Zero Direct Access:** Admin role has **zero `SELECT` or `UPDATE` policies** on `public.medical_records` under PostgreSQL Row-Level Security. General queries such as `supabase.from('medical_records').select('*')` executed by an administrator return an empty set (`[]`).
  * **Audited Erasure Only:** Administrators cannot execute raw SQL `DELETE` on `medical_records`. Right-to-erasure and moderation actions can **only** be executed through the security-definer function `public.admin_erase_medical_record(p_record_id, p_reason)` or the admin endpoint `POST /api/admin/erase-record`, which strictly verifies admin status and atomically writes to `access_audit_log` (recording actor UUID, role, record ID, patient ID, reason, and UTC timestamp).
  * **Administrative Metadata Overview:** The administrative API (`GET /api/medical-records?all=true`) masks all clinical notes with `[Protected Health Information — Confidential Patient Record]` and suppresses `file_url`, returning only `has_file: boolean`.

### Demo Admin Preview Mode
* **Boundary Guard:** Demo administrative accounts (`admin@ruralhealth.demo` or email containing `demo`) operate exclusively in **Preview Mode**.
* **Protections:**
  * Frontend UI: Displays persistent amber preview alert banners and disables mutating actions.
  * API Routes: All mutating requests (`DELETE`, `PATCH`, role modifications) return **HTTP 403 Forbidden** with code `DEMO_MODE_RESTRICTED`.
  * PostgreSQL Trigger: `guard_demo_admin_safety()` halts transactions attempting to delete rows or escalate patient roles.

---

## 5. Doctor Access Scoping

### Care Relationship Requirement
* **Doctor RLS:** A doctor cannot browse all patients across the platform.
* **Condition:** A doctor can only view medical records and patient demographics if an active care relationship exists via `public.has_care_relationship(p_patient_id)`.
* **Criteria:** An established appointment (scheduled, confirmed, completed) or an approved consultation request between the provider and the patient.

---

## 6. Connectivity & Teleconsultation Boundaries

### Offline Resilient PWA Architecture
* **IndexedDB Outbox:** When offline, prescriptions, symptom submissions, and appointment bookings are queued in client-side IndexedDB (`rural-healthcare-db`).
* **Background Sync:** Queued items replay with exponential backoff and randomized jitter upon network reconnection.
* **Teleconsultation Fallback:** While video consultations require WebRTC peer connectivity (minimum ~150 kbps), low-bandwidth rural connections automatically downgrade to low-bitrate audio or asynchronous messaging with clinical review queues.

---

## 7. Security Advisory Posture

* **Next.js Version:** `15.5.28` (patched against all critical and high-severity Next.js image optimization, middleware bypass, and SSRF advisories).
* **Audit Enforcement:** Automated CI workflows strictly fail on any critical security advisory (`npm audit --audit-level=critical`) and enforce zero unallowlisted high advisories via `scripts/ci/audit_allowlist.mjs`.

---

## 8. Content Security Policy (CSP) Posture

* **Status:** Deployed in `Content-Security-Policy-Report-Only` mode.
* **Limitation:** CSP is **not currently enforced in blocking mode**. It operates in report-only mode to prevent breaking external integrations (Jitsi WebRTC teleconsult rooms, Google Translate, and CartoCDN tile servers) until complete staging evaluation across mobile user agents is finished.
