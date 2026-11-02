# Production Schema Snapshot — 2026-10-21

Generated directly from verified live production read-only SQL diagnostic output.

## 1. Table Row Counts (Production)
- `patients`: 13
- `doctor_role_patients`: 2
- `healthcare_providers`: 27
- `healthcare_providers_with_user_id`: 0
- `providers`: 2
- `appointments`: 6
- `medical_records`: 31
- `payments`: 0
- `consultation_payments`: 1
- `donations`: 1

## 2. Foreign Keys (Production)
| Table | Column | References | On Delete | Constraint Name |
| :--- | :--- | :--- | :--- | :--- |
| `appointments` | `patient_id` | `patients(id)` | CASCADE | `appointments_patient_id_fkey` |
| `appointments` | `provider_id` | `providers(id)` | **CASCADE** (Drift N1) | `appointments_provider_id_fkey` |
| `medical_records` | `patient_id` | `patients(id)` | CASCADE | `medical_records_patient_id_fkey` |
| `medical_records` | `provider_id` | `providers(id)` | **CASCADE** (Drift N1, N2) | `medical_records_provider_id_fkey` |
| `medical_records` | `appointment_id` | `appointments(id)` | SET NULL | `medical_records_appointment_id_fkey` |
| `consultation_payments` | `payment_id` | `payments(id)` | CASCADE | `consultation_payments_payment_id_fkey` |
| `donations` | `payment_id` | `payments(id)` | CASCADE | `donations_payment_id_fkey` |

## 3. Columns Verified
- `appointments`: `id`, `patient_id`, `provider_id`, `appointment_date`, `duration_minutes`, `status`, `notes`, `teleconsult_room_id`, `created_at`, `updated_at`
- `healthcare_providers`: `id`, `name` (NOT NULL), `email` (NOT NULL), `phone`, `location`, `specialization`, `bio`, `avatar_url`, `is_verified`, `created_at`, `updated_at`, `user_id`
- `providers`: `id`, `user_id` (NOT NULL), `first_name`, `last_name`, `specialization`, `license_number`, `bio`, `avatar_url`, `is_verified`, `verification_date`, `created_at`, `updated_at` (NO email column)
- `medical_records`: `id`, `patient_id`, `provider_id`, `appointment_id`, `record_type`, `content` (NOT NULL), `file_url`, `created_at`, `updated_at`
- `payments`: `id`, `user_id`, `stripe_session_id`, `stripe_customer_id`, `product_id`, `product_category`, `amount_cents`, `amount_currency`, `status`, `metadata`, `created_at`, `updated_at`
- `consultation_payments`: `id`, `payment_id`, `patient_id`, `provider_id`, `consultation_type`, `scheduled_at`, `completed_at`, `created_at`
- `donations`: `id`, `payment_id`, `user_id`, `amount_cents`, `purpose`, `anonymous`, `receipt_email`, `created_at`

## 4. Key Security & Policy State (Production)
- `chat_cache` has 4 policies:
  - `Anyone can read approved chat cache entries` (SELECT, public) — **Confirmed legacy leak**
  - `Authenticated users can submit pending chat cache entries` (INSERT, public) — **Confirmed legacy leak**
  - `chat_cache_select_verified` (SELECT, admin/doctor)
  - `chat_cache_update_verified` (UPDATE, admin/doctor)
- `healthcare_providers`:
  - `healthcare_providers_public_read`: SELECT `true` to `anon`, `authenticated`
  - `healthcare_providers_admin_write`: ALL to `authenticated` (admin)
  - `providers_admin_insert`: INSERT to `authenticated` (admin)
  - Table grants: `anon` and `authenticated` have table-level INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER grants, governed by RLS.
- `appointments`:
  - `doctor_read_assigned_appointments`: checks `provider_id IN (SELECT id FROM healthcare_providers WHERE user_id = auth.uid())`
  - `doctor_update_assigned_appointments`: checks `provider_id IN (SELECT id FROM healthcare_providers WHERE user_id = auth.uid())`
- `medical_records`:
  - `doctor_read_care_records`: checks `has_care_relationship(patient_id)`
  - `doctor_insert_care_records`: checks `has_care_relationship(patient_id)`
