# Schema Drift Analysis — Production vs. Repository Contract
Generated: 2026-10-21

## Executive Summary
A comprehensive cross-comparison of the live production database snapshot (`docs/schema_snapshots/production_2026-10-21.md`) versus repository source code migrations (`supabase/migrations/`) reveals four critical structural drifts and one table cluster drift.

---

## 1. Foreign Key Target Drift on Core Provider Tables (P0)

### (i) `appointments.provider_id`
- **Repository Definition (`20260701000000_core_schema.sql` L64):**
  `provider_id UUID NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE`
- **Live Production Database:**
  `appointments_provider_id_fkey: provider_id REFERENCES providers(id) ON DELETE CASCADE`
- **Classification:** **(i) Production Bug / Legacy Drift**
- **Impact:** 
  The Next.js application (`app/api/providers`, `components/AppointmentManager.tsx`, `appointments.service.ts`) books and references doctors by `healthcare_providers.id`. 
  Furthermore, RLS policy `doctor_read_assigned_appointments` checks:
  `provider_id IN (SELECT hp.id FROM healthcare_providers hp WHERE hp.user_id = auth.uid())`.
  Because production's FK points to `providers(id)`, booking with any modern directory doctor not present in `providers` fails with FK violation 23503, and doctors cannot see assigned appointments.

### (ii) `medical_records.provider_id`
- **Repository Definition (`20260701000000_core_schema.sql` L81):**
  `provider_id UUID REFERENCES healthcare_providers(id) ON DELETE SET NULL`
- **Live Production Database:**
  `medical_records_provider_id_fkey: provider_id REFERENCES providers(id) ON DELETE CASCADE`
- **Classification:** **(i) Production Bug & (ii) Severe Data Safety Risk**
- **Impact:**
  1. Points to table `providers` instead of `healthcare_providers`.
  2. Uses `ON DELETE CASCADE` instead of `ON DELETE SET NULL`. If a provider record is removed, all linked medical records of patients are permanently destroyed.

---

## 2. Table Existence Drift (Production-Only Tables)
- **Tables in Production Not in Repository Migrations:**
  - `consultation_payments` (1 row in production; references `payments(id)` ON DELETE CASCADE)
  - `donations` (1 row in production; references `payments(id)` ON DELETE CASCADE)
- **Classification:** **(iii) Intentional / Out-of-band Production Experiment**
- **Impact:**
  Attempting to run `DROP TABLE payments CASCADE` would cascade and destroy `consultation_payments` and `donations`. These tables must remain untouched until post-Nov 14.

---

## 3. RLS Policy Drift on `chat_cache`
- **Legacy Policies Present in Production:**
  - `"Anyone can read approved chat cache entries"` (SELECT TO public)
  - `"Authenticated users can submit pending chat cache entries"` (INSERT TO public)
- **Repository Migration State:**
  Created in `20260704000000_chat_cache.sql`, but never dropped in subsequent reconciliation migrations.
- **Classification:** **(i) Repository & Production Security Gap**
- **Impact:** Anyone (including unauthenticated visitors) can read approved chat cache entries and insert arbitrary entries with `status='pending'`.

---

## 4. Index Drift
- **Indexes in Production:**
  - Has single-column indexes: `idx_appointments_patient_id`, `idx_appointments_provider_id`, `idx_medical_records_patient_id`, `idx_medical_records_provider_id`, `idx_health_data_patient`.
  - Has compound indexes: `idx_appointments_patient_date`, `idx_appointments_provider_date`, `idx_medical_records_patient_created`, `idx_health_data_recorded`.
  - Does NOT have `idx_audit_log_user_id` or `idx_audit_log_patient_id`.
- **Classification:** **(iii) Intentional Minor Discrepancy**; no operational hazard.
