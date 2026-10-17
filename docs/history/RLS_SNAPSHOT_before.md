# Live Database RLS & Schema Snapshot (Pre-Hardening Baseline)

Captured directly from live Supabase PostgreSQL production instance on 2026-10-16.
This snapshot serves as the authoritative rollback reference and pre-hardening evidence.

---

## 1. Summary of Verified Evidence

* **Email match count:**
  * `doctor_users`: 2
  * `doctors_matching_provider_email`: 0
  * `duplicate_provider_emails`: 0
  * **Finding:** Zero doctors in `patients` match an email in `healthcare_providers`. An automatic backfill by email would match 0 rows.
* **`healthcare_providers` Columns:**
  * `id, name, email, phone, location, specialization, bio, avatar_url, is_verified, created_at, updated_at`.
  * **Finding:** There is **no `user_id` column** in `healthcare_providers`.
* **Legacy `providers` Table:**
  * An older table `providers` exists with `id, user_id, first_name, last_name, specialization, license_number, bio, avatar_url, is_verified, verification_date, created_at, updated_at`.
  * Some legacy policies on `appointments` and `medical_records` join against `providers` (`WHERE providers.id = medical_records.provider_id`), but the canonical table used by modern API routes and appointments FK is `healthcare_providers`.
* **Triggers on `public`:**
  * `healthcare_facilities`: `trg_facility_updated`, `trg_set_facility_geom`
  * `medical_records`: `medical_records_audit` (AFTER INSERT, UPDATE, DELETE)
  * `patients`: `trg_guard_patient_privileges` (BEFORE INSERT, UPDATE)
  * **Finding:** No demo safety trigger exists in live production.
* **Storage Policies (`storage.objects` for `medical-records`):**
  * Multiple duplicate policies exist (`Users read own files`, `Users can view their own records`, `medical_records_objects_select`), all restricting access strictly to `(storage.foldername(name))[1] = auth.uid()::text`.
  * Doctors and administrators currently have **zero read access** to storage objects in `medical-records` bucket.
* **Policy Drift on `medical_records`:**
  * Live policies:
    * `admin_read_all_medical_records` (SELECT to authenticated: `get_current_user_role() = 'admin'`)
    * `doctor_read_all_medical_records` (SELECT to authenticated: `get_current_user_role() = 'doctor'`)
    * `medical_records_admin_write` (ALL to authenticated: `get_user_role() = 'admin'`)
    * `medical_records_doctor_write` (ALL to authenticated: `get_user_role() = 'doctor'`)
    * `medical_records_insert_patient` (INSERT: patient owns row)
    * `medical_records_insert_provider` (INSERT: provider owns row via legacy `providers` table)
    * `medical_records_select_own` (SELECT: patient owns row)
    * `medical_records_select_patient` (SELECT: patient owns row)
    * `medical_records_select_provider` (SELECT: provider owns row via legacy `providers` table)
    * `patients_delete_own_records` (DELETE: patient owns row)
    * `patients_read_own_records` (SELECT: patient owns row)
    * `patients_update_own_records` (UPDATE: patient owns row)

---

## 2. Full Raw Snapshot JSON

```json
{
  "D_email_counts": {
    "doctor_users": 2,
    "doctors_matching_provider_email": 0,
    "duplicate_provider_emails": 0
  },
  "B_columns": [
    { "table_name": "appointments", "column_name": "id", "data_type": "uuid" },
    { "table_name": "appointments", "column_name": "patient_id", "data_type": "uuid" },
    { "table_name": "appointments", "column_name": "provider_id", "data_type": "uuid" },
    { "table_name": "appointments", "column_name": "appointment_date", "data_type": "timestamp with time zone" },
    { "table_name": "appointments", "column_name": "duration_minutes", "data_type": "integer" },
    { "table_name": "appointments", "column_name": "status", "data_type": "text" },
    { "table_name": "appointments", "column_name": "notes", "data_type": "text" },
    { "table_name": "appointments", "column_name": "teleconsult_room_id", "data_type": "text" },
    { "table_name": "appointments", "column_name": "created_at", "data_type": "timestamp with time zone" },
    { "table_name": "appointments", "column_name": "updated_at", "data_type": "timestamp with time zone" },
    { "table_name": "doctor_requests", "column_name": "id", "data_type": "uuid" },
    { "table_name": "doctor_requests", "column_name": "user_id", "data_type": "uuid" },
    { "table_name": "doctor_requests", "column_name": "email", "data_type": "text" },
    { "table_name": "doctor_requests", "column_name": "full_name", "data_type": "text" },
    { "table_name": "doctor_requests", "column_name": "specialization", "data_type": "text" },
    { "table_name": "doctor_requests", "column_name": "license_number", "data_type": "text" },
    { "table_name": "doctor_requests", "column_name": "hospital_affiliation", "data_type": "text" },
    { "table_name": "doctor_requests", "column_name": "experience_years", "data_type": "integer" },
    { "table_name": "doctor_requests", "column_name": "status", "data_type": "text" },
    { "table_name": "doctor_requests", "column_name": "created_at", "data_type": "timestamp with time zone" },
    { "table_name": "doctor_requests", "column_name": "reviewed_at", "data_type": "timestamp with time zone" },
    { "table_name": "doctor_requests", "column_name": "admin_notes", "data_type": "text" },
    { "table_name": "healthcare_providers", "column_name": "id", "data_type": "uuid" },
    { "table_name": "healthcare_providers", "column_name": "name", "data_type": "text" },
    { "table_name": "healthcare_providers", "column_name": "email", "data_type": "text" },
    { "table_name": "healthcare_providers", "column_name": "phone", "data_type": "text" },
    { "table_name": "healthcare_providers", "column_name": "location", "data_type": "text" },
    { "table_name": "healthcare_providers", "column_name": "specialization", "data_type": "text" },
    { "table_name": "healthcare_providers", "column_name": "bio", "data_type": "text" },
    { "table_name": "healthcare_providers", "column_name": "avatar_url", "data_type": "text" },
    { "table_name": "healthcare_providers", "column_name": "is_verified", "data_type": "boolean" },
    { "table_name": "healthcare_providers", "column_name": "created_at", "data_type": "timestamp with time zone" },
    { "table_name": "healthcare_providers", "column_name": "updated_at", "data_type": "timestamp with time zone" },
    { "table_name": "medical_records", "column_name": "id", "data_type": "uuid" },
    { "table_name": "medical_records", "column_name": "patient_id", "data_type": "uuid" },
    { "table_name": "medical_records", "column_name": "provider_id", "data_type": "uuid" },
    { "table_name": "medical_records", "column_name": "appointment_id", "data_type": "uuid" },
    { "table_name": "medical_records", "column_name": "record_type", "data_type": "text" },
    { "table_name": "medical_records", "column_name": "content", "data_type": "text" },
    { "table_name": "medical_records", "column_name": "file_url", "data_type": "text" },
    { "table_name": "medical_records", "column_name": "created_at", "data_type": "timestamp with time zone" },
    { "table_name": "medical_records", "column_name": "updated_at", "data_type": "timestamp with time zone" },
    { "table_name": "notifications", "column_name": "id", "data_type": "uuid" },
    { "table_name": "notifications", "column_name": "recipient_type", "data_type": "text" },
    { "table_name": "notifications", "column_name": "recipient_id", "data_type": "uuid" },
    { "table_name": "notifications", "column_name": "recipient_role", "data_type": "text" },
    { "table_name": "notifications", "column_name": "title", "data_type": "text" },
    { "table_name": "notifications", "column_name": "message", "data_type": "text" },
    { "table_name": "notifications", "column_name": "type", "data_type": "text" },
    { "table_name": "notifications", "column_name": "is_read", "data_type": "boolean" },
    { "table_name": "notifications", "column_name": "created_at", "data_type": "timestamp with time zone" },
    { "table_name": "patients", "column_name": "id", "data_type": "uuid" },
    { "table_name": "patients", "column_name": "user_id", "data_type": "uuid" },
    { "table_name": "patients", "column_name": "first_name", "data_type": "text" },
    { "table_name": "patients", "column_name": "last_name", "data_type": "text" },
    { "table_name": "patients", "column_name": "email", "data_type": "text" },
    { "table_name": "patients", "column_name": "phone", "data_type": "text" },
    { "table_name": "patients", "column_name": "date_of_birth", "data_type": "date" },
    { "table_name": "patients", "column_name": "gender", "data_type": "text" },
    { "table_name": "patients", "column_name": "address", "data_type": "text" },
    { "table_name": "patients", "column_name": "medical_history", "data_type": "text" },
    { "table_name": "patients", "column_name": "allergies", "data_type": "text" },
    { "table_name": "patients", "column_name": "current_medications", "data_type": "text" },
    { "table_name": "patients", "column_name": "avatar_url", "data_type": "text" },
    { "table_name": "patients", "column_name": "created_at", "data_type": "timestamp with time zone" },
    { "table_name": "patients", "column_name": "updated_at", "data_type": "timestamp with time zone" },
    { "table_name": "patients", "column_name": "role", "data_type": "text" },
    { "table_name": "providers", "column_name": "id", "data_type": "uuid" },
    { "table_name": "providers", "column_name": "user_id", "data_type": "uuid" },
    { "table_name": "providers", "column_name": "first_name", "data_type": "text" },
    { "table_name": "providers", "column_name": "last_name", "data_type": "text" },
    { "table_name": "providers", "column_name": "specialization", "data_type": "text" },
    { "table_name": "providers", "column_name": "license_number", "data_type": "text" },
    { "table_name": "providers", "column_name": "bio", "data_type": "text" },
    { "table_name": "providers", "column_name": "avatar_url", "data_type": "text" },
    { "table_name": "providers", "column_name": "is_verified", "data_type": "boolean" },
    { "table_name": "providers", "column_name": "verification_date", "data_type": "timestamp with time zone" },
    { "table_name": "providers", "column_name": "created_at", "data_type": "timestamp with time zone" },
    { "table_name": "providers", "column_name": "updated_at", "data_type": "timestamp with time zone" }
  ],
  "C_triggers": [
    { "trigger_name": "trg_facility_updated", "action_timing": "BEFORE", "event_manipulation": "UPDATE", "event_object_table": "healthcare_facilities" },
    { "trigger_name": "trg_set_facility_geom", "action_timing": "BEFORE", "event_manipulation": "UPDATE", "event_object_table": "healthcare_facilities" },
    { "trigger_name": "trg_set_facility_geom", "action_timing": "BEFORE", "event_manipulation": "INSERT", "event_object_table": "healthcare_facilities" },
    { "trigger_name": "medical_records_audit", "action_timing": "AFTER", "event_manipulation": "INSERT", "event_object_table": "medical_records" },
    { "trigger_name": "medical_records_audit", "action_timing": "AFTER", "event_manipulation": "DELETE", "event_object_table": "medical_records" },
    { "trigger_name": "medical_records_audit", "action_timing": "AFTER", "event_manipulation": "UPDATE", "event_object_table": "medical_records" },
    { "trigger_name": "trg_guard_patient_privileges", "action_timing": "BEFORE", "event_manipulation": "UPDATE", "event_object_table": "patients" },
    { "trigger_name": "trg_guard_patient_privileges", "action_timing": "BEFORE", "event_manipulation": "INSERT", "event_object_table": "patients" }
  ],
  "A_policies": [
    {
      "cmd": "SELECT",
      "qual": "(get_current_user_role() = 'admin'::text)",
      "roles": ["authenticated"],
      "tablename": "appointments",
      "policyname": "admin_read_all_appointments",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "INSERT",
      "qual": null,
      "roles": ["public"],
      "tablename": "appointments",
      "policyname": "appointments_insert_own",
      "schemaname": "public",
      "with_check": "(patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())))"
    },
    {
      "cmd": "INSERT",
      "qual": null,
      "roles": ["public"],
      "tablename": "appointments",
      "policyname": "appointments_insert_patient",
      "schemaname": "public",
      "with_check": "(auth.uid() = ( SELECT patients.user_id FROM patients WHERE (patients.id = appointments.patient_id)))"
    },
    {
      "cmd": "SELECT",
      "qual": "(patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())))",
      "roles": ["public"],
      "tablename": "appointments",
      "policyname": "appointments_select_own",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "(auth.uid() = ( SELECT patients.user_id FROM patients WHERE (patients.id = appointments.patient_id)))",
      "roles": ["public"],
      "tablename": "appointments",
      "policyname": "appointments_select_patient",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "(auth.uid() = ( SELECT providers.user_id FROM providers WHERE (providers.id = appointments.provider_id)))",
      "roles": ["public"],
      "tablename": "appointments",
      "policyname": "appointments_select_provider",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "UPDATE",
      "qual": "(auth.uid() = ( SELECT patients.user_id FROM patients WHERE (patients.id = appointments.patient_id)))",
      "roles": ["public"],
      "tablename": "appointments",
      "policyname": "appointments_update_patient",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "(get_current_user_role() = 'doctor'::text)",
      "roles": ["authenticated"],
      "tablename": "appointments",
      "policyname": "doctor_read_all_appointments",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "DELETE",
      "qual": "(patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())))",
      "roles": ["public"],
      "tablename": "appointments",
      "policyname": "patients_delete_own_appointments",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "(patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())))",
      "roles": ["authenticated"],
      "tablename": "appointments",
      "policyname": "patients_read_own_appointments",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "UPDATE",
      "qual": "(patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())))",
      "roles": ["public"],
      "tablename": "appointments",
      "policyname": "patients_update_own_appointments",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "DELETE",
      "qual": "(( SELECT patients.role FROM patients WHERE (patients.user_id = auth.uid()) LIMIT 1) = 'admin'::text)",
      "roles": ["authenticated"],
      "tablename": "camps",
      "policyname": "camps_admin_delete",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "INSERT",
      "qual": null,
      "roles": ["authenticated"],
      "tablename": "camps",
      "policyname": "camps_admin_insert",
      "schemaname": "public",
      "with_check": "(( SELECT patients.role FROM patients WHERE (patients.user_id = auth.uid()) LIMIT 1) = 'admin'::text)"
    },
    {
      "cmd": "UPDATE",
      "qual": "(( SELECT patients.role FROM patients WHERE (patients.user_id = auth.uid()) LIMIT 1) = 'admin'::text)",
      "roles": ["authenticated"],
      "tablename": "camps",
      "policyname": "camps_admin_update",
      "schemaname": "public",
      "with_check": "(( SELECT patients.role FROM patients WHERE (patients.user_id = auth.uid()) LIMIT 1) = 'admin'::text)"
    },
    {
      "cmd": "SELECT",
      "qual": "true",
      "roles": ["public"],
      "tablename": "camps",
      "policyname": "camps_public_read",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "UPDATE",
      "qual": "((EXISTS ( SELECT 1 FROM providers WHERE (providers.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM patients WHERE ((patients.user_id = auth.uid()) AND (patients.role = ANY (ARRAY['admin'::text, 'doctor'::text]))))) OR (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = ANY (ARRAY['admin'::text, 'doctor'::text])))",
      "roles": ["public"],
      "tablename": "chat_cache",
      "policyname": "Admins and doctors can update chat cache entries",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "((EXISTS ( SELECT 1 FROM providers WHERE (providers.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM patients WHERE ((patients.user_id = auth.uid()) AND (patients.role = ANY (ARRAY['admin'::text, 'doctor'::text]))))) OR (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = ANY (ARRAY['admin'::text, 'doctor'::text])))",
      "roles": ["public"],
      "tablename": "chat_cache",
      "policyname": "Admins and doctors can view pending entries for review",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "((status)::text = 'approved'::text)",
      "roles": ["public"],
      "tablename": "chat_cache",
      "policyname": "Anyone can read approved chat cache entries",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "INSERT",
      "qual": null,
      "roles": ["public"],
      "tablename": "chat_cache",
      "policyname": "Authenticated users can submit pending chat cache entries",
      "schemaname": "public",
      "with_check": "((status)::text = 'pending'::text)"
    },
    {
      "cmd": "INSERT",
      "qual": null,
      "roles": ["public"],
      "tablename": "consultation_payments",
      "policyname": "Patients can book consultations",
      "schemaname": "public",
      "with_check": "(auth.uid() = patient_id)"
    },
    {
      "cmd": "SELECT",
      "qual": "((auth.uid() = patient_id) OR (auth.uid() = provider_id))",
      "roles": ["public"],
      "tablename": "consultation_payments",
      "policyname": "Users can view their consultation payments",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "ALL",
      "qual": "(EXISTS ( SELECT 1 FROM patients WHERE ((patients.user_id = auth.uid()) AND (patients.role = 'admin'::text))))",
      "roles": ["public"],
      "tablename": "doctor_requests",
      "policyname": "admin_manages_all",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "ALL",
      "qual": "(get_user_role() = 'admin'::text)",
      "roles": ["authenticated"],
      "tablename": "doctor_requests",
      "policyname": "doctor_requests_admin_all",
      "schemaname": "public",
      "with_check": "(get_user_role() = 'admin'::text)"
    },
    {
      "cmd": "INSERT",
      "qual": null,
      "roles": ["public"],
      "tablename": "doctor_requests",
      "policyname": "doctor_requests_insert_own",
      "schemaname": "public",
      "with_check": "(user_id = auth.uid())"
    },
    {
      "cmd": "SELECT",
      "qual": "(user_id = auth.uid())",
      "roles": ["public"],
      "tablename": "doctor_requests",
      "policyname": "doctor_requests_select_own",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "INSERT",
      "qual": null,
      "roles": ["public"],
      "tablename": "doctor_requests",
      "policyname": "user_inserts_own",
      "schemaname": "public",
      "with_check": "(auth.uid() = user_id)"
    },
    {
      "cmd": "SELECT",
      "qual": "(auth.uid() = user_id)",
      "roles": ["public"],
      "tablename": "doctor_requests",
      "policyname": "user_sees_own",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "INSERT",
      "qual": null,
      "roles": ["public"],
      "tablename": "donations",
      "policyname": "Users can insert donations",
      "schemaname": "public",
      "with_check": "(auth.uid() = user_id)"
    },
    {
      "cmd": "SELECT",
      "qual": "((auth.uid() = user_id) OR (anonymous = false))",
      "roles": ["public"],
      "tablename": "donations",
      "policyname": "Users can view their donations",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "(get_user_role() = 'admin'::text)",
      "roles": ["public"],
      "tablename": "health_data",
      "policyname": "health_data_admin_read",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "DELETE",
      "qual": "(patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())))",
      "roles": ["public"],
      "tablename": "health_data",
      "policyname": "health_data_delete_own",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "(get_user_role() = 'doctor'::text)",
      "roles": ["public"],
      "tablename": "health_data",
      "policyname": "health_data_doctor_read",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "INSERT",
      "qual": null,
      "roles": ["public"],
      "tablename": "health_data",
      "policyname": "health_data_insert_own",
      "schemaname": "public",
      "with_check": "(patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())))"
    },
    {
      "cmd": "SELECT",
      "qual": "(patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())))",
      "roles": ["public"],
      "tablename": "health_data",
      "policyname": "health_data_select_own",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "UPDATE",
      "qual": "(patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())))",
      "roles": ["public"],
      "tablename": "health_data",
      "policyname": "health_data_update_own",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "true",
      "roles": ["public"],
      "tablename": "healthcare_facilities",
      "policyname": "facilities_public_read",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "ALL",
      "qual": "(get_user_role() = 'admin'::text)",
      "roles": ["authenticated"],
      "tablename": "healthcare_providers",
      "policyname": "healthcare_providers_admin_write",
      "schemaname": "public",
      "with_check": "(get_user_role() = 'admin'::text)"
    },
    {
      "cmd": "SELECT",
      "qual": "true",
      "roles": ["anon", "authenticated"],
      "tablename": "healthcare_providers",
      "policyname": "healthcare_providers_public_read",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "true",
      "roles": ["public"],
      "tablename": "healthcare_providers",
      "policyname": "healthcare_providers_read_all",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "true",
      "roles": ["public"],
      "tablename": "healthcare_providers",
      "policyname": "providers_public_read",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "(get_current_user_role() = 'admin'::text)",
      "roles": ["authenticated"],
      "tablename": "medical_records",
      "policyname": "admin_read_all_medical_records",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "(get_current_user_role() = 'doctor'::text)",
      "roles": ["authenticated"],
      "tablename": "medical_records",
      "policyname": "doctor_read_all_medical_records",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "ALL",
      "qual": "(get_user_role() = 'admin'::text)",
      "roles": ["authenticated"],
      "tablename": "medical_records",
      "policyname": "medical_records_admin_write",
      "schemaname": "public",
      "with_check": "(get_user_role() = 'admin'::text)"
    },
    {
      "cmd": "ALL",
      "qual": "(get_user_role() = 'doctor'::text)",
      "roles": ["authenticated"],
      "tablename": "medical_records",
      "policyname": "medical_records_doctor_write",
      "schemaname": "public",
      "with_check": "(get_user_role() = 'doctor'::text)"
    },
    {
      "cmd": "INSERT",
      "qual": null,
      "roles": ["public"],
      "tablename": "medical_records",
      "policyname": "medical_records_insert_patient",
      "schemaname": "public",
      "with_check": "(patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())))"
    },
    {
      "cmd": "INSERT",
      "qual": null,
      "roles": ["public"],
      "tablename": "medical_records",
      "policyname": "medical_records_insert_provider",
      "schemaname": "public",
      "with_check": "(auth.uid() = ( SELECT providers.user_id FROM providers WHERE (providers.id = medical_records.provider_id)))"
    },
    {
      "cmd": "SELECT",
      "qual": "(patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())))",
      "roles": ["public"],
      "tablename": "medical_records",
      "policyname": "medical_records_select_own",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "(auth.uid() = ( SELECT patients.user_id FROM patients WHERE (patients.id = medical_records.patient_id)))",
      "roles": ["public"],
      "tablename": "medical_records",
      "policyname": "medical_records_select_patient",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "(auth.uid() = ( SELECT providers.user_id FROM providers WHERE (providers.id = medical_records.provider_id)))",
      "roles": ["public"],
      "tablename": "medical_records",
      "policyname": "medical_records_select_provider",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "DELETE",
      "qual": "(patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())))",
      "roles": ["public"],
      "tablename": "medical_records",
      "policyname": "patients_delete_own_records",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "(patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())))",
      "roles": ["authenticated"],
      "tablename": "medical_records",
      "policyname": "patients_read_own_records",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "UPDATE",
      "qual": "(patient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())))",
      "roles": ["public"],
      "tablename": "medical_records",
      "policyname": "patients_update_own_records",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "ALL",
      "qual": "(get_current_user_role() = 'admin'::text)",
      "roles": ["authenticated"],
      "tablename": "notifications",
      "policyname": "admin_full_access",
      "schemaname": "public",
      "with_check": "(get_current_user_role() = 'admin'::text)"
    },
    {
      "cmd": "ALL",
      "qual": "(get_user_role() = 'admin'::text)",
      "roles": ["authenticated"],
      "tablename": "notifications",
      "policyname": "notifications_admin_write",
      "schemaname": "public",
      "with_check": "(get_user_role() = 'admin'::text)"
    },
    {
      "cmd": "SELECT",
      "qual": "((recipient_type = 'all'::text) OR ((recipient_type = 'role'::text) AND (recipient_role = get_user_role())) OR ((recipient_type = 'individual'::text) AND (recipient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())))))",
      "roles": ["public"],
      "tablename": "notifications",
      "policyname": "notifications_select_own",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "UPDATE",
      "qual": "(recipient_id IN ( SELECT patients.id FROM patients WHERE (patients.user_id = auth.uid())))",
      "roles": ["public"],
      "tablename": "notifications",
      "policyname": "notifications_update_own",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "((recipient_type = 'all'::text) OR ((recipient_type = 'role'::text) AND (recipient_role = get_current_user_role())) OR ((recipient_type = 'individual'::text) AND (recipient_id = auth.uid())))",
      "roles": ["authenticated"],
      "tablename": "notifications",
      "policyname": "users_read_notifications",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "UPDATE",
      "qual": "((recipient_type = 'individual'::text) AND (recipient_id = auth.uid()))",
      "roles": ["authenticated"],
      "tablename": "notifications",
      "policyname": "users_update_notifications",
      "schemaname": "public",
      "with_check": "((recipient_type = 'individual'::text) AND (recipient_id = auth.uid()))"
    },
    {
      "cmd": "DELETE",
      "qual": "(user_id = auth.uid())",
      "roles": ["public"],
      "tablename": "offline_sync_log",
      "policyname": "offline_sync_delete_own",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "INSERT",
      "qual": null,
      "roles": ["public"],
      "tablename": "offline_sync_log",
      "policyname": "offline_sync_insert_own",
      "schemaname": "public",
      "with_check": "(user_id = auth.uid())"
    },
    {
      "cmd": "INSERT",
      "qual": null,
      "roles": ["public"],
      "tablename": "offline_sync_log",
      "policyname": "offline_sync_log_insert_own",
      "schemaname": "public",
      "with_check": "(auth.uid() = user_id)"
    },
    {
      "cmd": "SELECT",
      "qual": "(auth.uid() = user_id)",
      "roles": ["public"],
      "tablename": "offline_sync_log",
      "policyname": "offline_sync_log_select_own",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "(user_id = auth.uid())",
      "roles": ["public"],
      "tablename": "offline_sync_log",
      "policyname": "offline_sync_select_own",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "(get_current_user_role() = 'admin'::text)",
      "roles": ["authenticated"],
      "tablename": "patients",
      "policyname": "admin_read_all_patients",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "(get_current_user_role() = 'doctor'::text)",
      "roles": ["authenticated"],
      "tablename": "patients",
      "policyname": "doctor_read_all_patients",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "DELETE",
      "qual": "(auth.uid() = user_id)",
      "roles": ["public"],
      "tablename": "patients",
      "policyname": "patients_delete_own",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "INSERT",
      "qual": null,
      "roles": ["public"],
      "tablename": "patients",
      "policyname": "patients_insert_own",
      "schemaname": "public",
      "with_check": "(auth.uid() = user_id)"
    },
    {
      "cmd": "SELECT",
      "qual": "(user_id = auth.uid())",
      "roles": ["authenticated"],
      "tablename": "patients",
      "policyname": "patients_read_own_row",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "(auth.uid() = user_id)",
      "roles": ["public"],
      "tablename": "patients",
      "policyname": "patients_select_own",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "UPDATE",
      "qual": "(auth.uid() = user_id)",
      "roles": ["public"],
      "tablename": "patients",
      "policyname": "patients_update_own",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "INSERT",
      "qual": null,
      "roles": ["public"],
      "tablename": "payments",
      "policyname": "Users can insert payments",
      "schemaname": "public",
      "with_check": "(auth.uid() = user_id)"
    },
    {
      "cmd": "SELECT",
      "qual": "(auth.uid() = user_id)",
      "roles": ["public"],
      "tablename": "payments",
      "policyname": "Users can view their own payments",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "INSERT",
      "qual": null,
      "roles": ["public"],
      "tablename": "providers",
      "policyname": "authenticated_insert_providers",
      "schemaname": "public",
      "with_check": "(user_id = auth.uid())"
    },
    {
      "cmd": "SELECT",
      "qual": "(get_user_role() = 'admin'::text)",
      "roles": ["public"],
      "tablename": "providers",
      "policyname": "providers_admin_read_all",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "DELETE",
      "qual": "(auth.uid() = user_id)",
      "roles": ["public"],
      "tablename": "providers",
      "policyname": "providers_delete_own",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "INSERT",
      "qual": null,
      "roles": ["public"],
      "tablename": "providers",
      "policyname": "providers_insert_own",
      "schemaname": "public",
      "with_check": "(user_id = auth.uid())"
    },
    {
      "cmd": "SELECT",
      "qual": "(user_id = auth.uid())",
      "roles": ["public"],
      "tablename": "providers",
      "policyname": "providers_select_own",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "UPDATE",
      "qual": "(user_id = auth.uid())",
      "roles": ["public"],
      "tablename": "providers",
      "policyname": "providers_update_own",
      "schemaname": "public",
      "with_check": null
    },
    {
      "cmd": "INSERT",
      "qual": null,
      "roles": ["public"],
      "tablename": "objects",
      "policyname": "Users can upload their own records",
      "schemaname": "storage",
      "with_check": "((bucket_id = 'medical-records'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))"
    },
    {
      "cmd": "SELECT",
      "qual": "((bucket_id = 'medical-records'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))",
      "roles": ["public"],
      "tablename": "objects",
      "policyname": "Users can view their own records",
      "schemaname": "storage",
      "with_check": null
    },
    {
      "cmd": "DELETE",
      "qual": "((bucket_id = 'medical-records'::text) AND ((auth.uid())::text = (string_to_array(name, '/'::text))[1]))",
      "roles": ["authenticated"],
      "tablename": "objects",
      "policyname": "Users delete own files",
      "schemaname": "storage",
      "with_check": null
    },
    {
      "cmd": "SELECT",
      "qual": "((bucket_id = 'medical-records'::text) AND ((auth.uid())::text = (string_to_array(name, '/'::text))[1]))",
      "roles": ["authenticated"],
      "tablename": "objects",
      "policyname": "Users read own files",
      "schemaname": "storage",
      "with_check": null
    },
    {
      "cmd": "INSERT",
      "qual": null,
      "roles": ["authenticated"],
      "tablename": "objects",
      "policyname": "Users upload own files",
      "schemaname": "storage",
      "with_check": "((bucket_id = 'medical-records'::text) AND ((auth.uid())::text = (string_to_array(name, '/'::text))[1]))"
    },
    {
      "cmd": "DELETE",
      "qual": "((bucket_id = 'medical-records'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))",
      "roles": ["authenticated"],
      "tablename": "objects",
      "policyname": "medical_records_objects_delete",
      "schemaname": "storage",
      "with_check": null
    },
    {
      "cmd": "INSERT",
      "qual": null,
      "roles": ["authenticated"],
      "tablename": "objects",
      "policyname": "medical_records_objects_insert",
      "schemaname": "storage",
      "with_check": "((bucket_id = 'medical-records'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))"
    },
    {
      "cmd": "SELECT",
      "qual": "((bucket_id = 'medical-records'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))",
      "roles": ["authenticated"],
      "tablename": "objects",
      "policyname": "medical_records_objects_select",
      "schemaname": "storage",
      "with_check": null
    }
  ]
}
```
