# Changelog

All notable changes to the Rural Healthcare Platform are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> [!NOTE]
> For the complete, uncompressed historical audit trail and pre-v1.0.0 verbose development logs, refer to [Changelog Archive](history/CHANGELOG_ARCHIVE.md).


---

## [1.1.0] - 2026-10-21

### Security & Role Scoping
- **Clinician Medical Record Immutability:** Enforced strict HTTP 403 `ACTION_NOT_PERMITTED` in `PATCH` and `DELETE` on `/api/medical-records` for clinicians. Doctors are granted read-only clinical access under established care relationships and cannot mutate historical patient records.
- **Role Redirection Guard on `/records`:** Implemented automatic client-side role guards on `app/records/page.tsx` redirecting doctors to `/doctor/patients` and administrators to `/admin/records`, preventing unauthorized exposure of patient self-service portals and deletion controls.
- **Doctor & Patient Notification Routing Isolation:** Scoped the notification engine (`lib/notifications/notification-engine.ts`) so patient notifications point to `/records` or `/appointments` while clinician notifications route strictly to `/doctor/patients` or `/doctor/appointments`. Filtered patient self-service links from doctor sessions in `getLocalNotifications`.
- **Self-Healing Clinician Role Synchronization:** Implemented server-side detection in `lib/services/appointments.service.ts` that automatically recognizes verified clinicians registered in `public.healthcare_providers` and synchronizes `public.patients.role = 'doctor'`, ensuring Postgres RLS policies function without manual SQL intervention.

### Clinical & UI Resilience
- **Elapsed Appointments Expiry State Machine:** Scheduled consultations where $T_{\text{appt}} + \text{duration} < \text{NOW}()$ automatically shift from the Upcoming queue to the **Past** tab with an amber `Expired / Incomplete` (`समय समाप्त / अपूर्ण`) badge. Active "Join" and "Cancel" buttons are disabled on elapsed consultations.
- **Modularized Doctor Patients Subsystem (`components/doctor-patients/`):** Refactored the doctor patient directory into a modular structure (`index.tsx`, `parts/PatientCard.tsx`, `types.ts`) under the 400 LOC standard. Populated directly from assigned consultations so patients appear with or without uploaded files.
- **Filter Bar Container Containment:** Constrained `RecordFilterRow`, `ScrollableFilterRow`, and `CardHeader` with `w-full min-w-0 max-w-full overflow-hidden` to eliminate horizontal category badge spillover outside white card boundaries.
- **Database Maintenance & Operations Plan:** Added comprehensive state machine documentation, periodic vacuuming, re-indexing, and auto-archival cron runbooks to `docs/DATABASE.md`.

---

## [1.0.0] - 2026-10-18

### Security & Access Control
- **Database Role Derivation Invariant:** Refactored `public.get_user_role()` to derive roles strictly from `public.patients.role`. Client-writable `user_metadata` is completely ignored across all database RLS policies, trigger procedures, and APIs (`SEC-2026-10-17-ROLE-TRUST`).
- **Unconditional Safe Signup:** Hardened `public.handle_new_user()` to assign the `patient` role unconditionally on user registration.
- **Signup & Privilege Escalation Guards:** Trigger `guard_patient_privileges()` rejects any client attempt to insert or update elevated roles (`admin`, `doctor`).
- **Clinical Confidentiality Invariant:** Dropped direct administrative `SELECT` and `UPDATE` policies on `public.medical_records`.
- **Audited Right-to-Erasure RPC:** Introduced `public.admin_erase_medical_record(p_record_id, p_reason)` with mandatory reason validation, atomic deletion, and tamper-resistant audit logging to `access_audit_log`.
- **Doctor Care Relationship Scoping:** Replaced blanket clinician policies with `public.has_care_relationship(p_patient_id, p_doctor_id)`, granting doctors access only to patients with scheduled/in-progress consultations.
- **Production Database Reconciliation:** Reconciled remote Supabase instance (`boyzdmlvzvcplzolenef`), purged legacy permissive policies, dropped diagnostic function `get_tables()`, and synchronized the migration ledger.

### Clinical & Resilience Engineering
- **Concurrency & Double-Booking Protection:** Added unique partial index `uq_provider_slot_scheduled` on `appointments` and implemented transactional optimistic concurrency control with HTTP 409 Conflict handling.
- **Offline Outbox & Sync Hardening:** Rewrote IndexedDB outbox queue (`lib/offline/`) with exponential backoff retry, conflict detection, and server-side patient ownership enforcement in `/api/offline-sync`.
- **ABDM & FHIR Conformance:** Standardized medical record bundles to FHIR R4 document standards with client-side JSON export.
- **Migration Immutability Gate:** Added cryptographic SHA-256 verification gate (`scripts/check_migration_immutability.mjs`) in pre-commit hooks and CI to guarantee historical database migrations remain append-only.

---

## [0.9.0] - 2026-10-16

### Added
- Care-relationship RLS integration test suite with 22 contract tests and 7 behavioral mutation proofs.
- Teleconsultation room management via Jitsi Meet integration with room access authorization.
- PM-JAY facility directory covering district and sub-district hospitals across India.

### Changed
- Migrated PWA service worker toolchain from legacy Workbox wrappers to `@serwist/next` with offline asset precaching.
- Reduced initial landing page image payload by 86.6% via WebP conversion.

---

## [0.8.0] - 2026-10-11

### Added
- Real-time notification engine with Web Audio feedback and appointment lifecycle triggers.
- Multi-tier emergency module with offline visual first-aid guides and SOS calling.
- Multilingual symptom checker with bilingual translation toggles (Hindi / English).

---

## [0.1.0] - 2026-07-01

### Initial Release
- Core schema, Supabase Auth integration, and basic clinical records viewer.
