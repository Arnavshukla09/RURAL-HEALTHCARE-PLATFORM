# Changelog

All notable changes to the Rural Healthcare Platform are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> [!NOTE]
> For the complete, uncompressed historical audit trail and pre-v1.0.0 verbose development logs, refer to [Changelog Archive](history/CHANGELOG_ARCHIVE.md).


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
