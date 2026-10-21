-- ==============================================================================
-- 20261114000000_clinical_encounters_and_observations.sql
--
-- Modular Clinical Encounter & Observation Hierarchy (Intelehealth / FHIR Pattern)
--
-- Adds structured clinical encounters and atomic LOINC-mapped observations
-- to support offline store-and-forward teleconsultation, frontline triage,
-- and longitudinal vitals tracking. Protected by database-enforced RLS.
--
-- Invariants enforced:
-- 1. All patient clinical data strictly isolated by Row Level Security (RLS).
-- 2. Clinicians must satisfy public.has_care_relationship(patient_id).
-- 3. Pre-assigned client UUIDs supported via DEFAULT gen_random_uuid().
-- ==============================================================================

-- 1. Create clinical_encounters table
CREATE TABLE IF NOT EXISTS public.clinical_encounters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.healthcare_providers(id) ON DELETE SET NULL,
    encounter_type TEXT NOT NULL CHECK (encounter_type IN ('screening', 'triage', 'teleconsult', 'followup')),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'queued', 'in_progress', 'completed', 'cancelled')),
    chief_complaint TEXT,
    clinical_notes TEXT,
    media_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    audio_note_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create clinical_observations table
CREATE TABLE IF NOT EXISTS public.clinical_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID NOT NULL REFERENCES public.clinical_encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    code_system TEXT NOT NULL DEFAULT 'LOINC',
    display TEXT NOT NULL,
    value_numeric NUMERIC,
    value_text TEXT,
    unit TEXT,
    interpretation TEXT CHECK (interpretation IS NULL OR interpretation IN ('normal', 'low', 'high', 'critical')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Performance & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_clinical_encounters_patient 
    ON public.clinical_encounters (patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clinical_encounters_status 
    ON public.clinical_encounters (status, created_at DESC) 
    WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS idx_clinical_observations_encounter 
    ON public.clinical_observations (encounter_id);

CREATE INDEX IF NOT EXISTS idx_clinical_observations_code 
    ON public.clinical_observations (patient_id, code, created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.clinical_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_observations ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for clinical_encounters

-- Patients can select their own encounters
DROP POLICY IF EXISTS "patient_select_own_clinical_encounters" ON public.clinical_encounters;
DROP POLICY IF EXISTS "Patients view own encounters" ON public.clinical_encounters;
CREATE POLICY "patient_select_own_clinical_encounters"
    ON public.clinical_encounters FOR SELECT
    TO authenticated
    USING (
        patient_id IN (
            SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
        )
    );

-- Patients can insert their own encounters (or offline triage submissions)
DROP POLICY IF EXISTS "patient_insert_own_clinical_encounters" ON public.clinical_encounters;
DROP POLICY IF EXISTS "Patients insert own encounters" ON public.clinical_encounters;
CREATE POLICY "patient_insert_own_clinical_encounters"
    ON public.clinical_encounters FOR INSERT
    TO authenticated
    WITH CHECK (
        patient_id IN (
            SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
        )
    );

-- Doctors with active care relationship can select encounters
DROP POLICY IF EXISTS "doctor_select_care_clinical_encounters" ON public.clinical_encounters;
DROP POLICY IF EXISTS "Clinicians access care-relationship encounters" ON public.clinical_encounters;
CREATE POLICY "doctor_select_care_clinical_encounters"
    ON public.clinical_encounters FOR SELECT
    TO authenticated
    USING (
        (SELECT public.get_user_role()) = 'doctor'
        AND public.has_care_relationship(patient_id)
    );

-- Doctors with active care relationship can insert encounters
DROP POLICY IF EXISTS "doctor_insert_care_clinical_encounters" ON public.clinical_encounters;
CREATE POLICY "doctor_insert_care_clinical_encounters"
    ON public.clinical_encounters FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT public.get_user_role()) = 'doctor'
        AND public.has_care_relationship(patient_id)
    );

-- Doctors with active care relationship can update encounters
DROP POLICY IF EXISTS "doctor_update_care_clinical_encounters" ON public.clinical_encounters;
CREATE POLICY "doctor_update_care_clinical_encounters"
    ON public.clinical_encounters FOR UPDATE
    TO authenticated
    USING (
        (SELECT public.get_user_role()) = 'doctor'
        AND public.has_care_relationship(patient_id)
    )
    WITH CHECK (
        (SELECT public.get_user_role()) = 'doctor'
        AND public.has_care_relationship(patient_id)
    );

-- Admins can delete encounters (moderation, cleanup, right-to-erasure)
DROP POLICY IF EXISTS "admin_delete_clinical_encounters" ON public.clinical_encounters;
CREATE POLICY "admin_delete_clinical_encounters"
    ON public.clinical_encounters FOR DELETE
    TO authenticated
    USING (
        (SELECT public.get_user_role()) = 'admin'
    );

-- 6. RLS Policies for clinical_observations

-- Patients can select their own observations
DROP POLICY IF EXISTS "patient_select_own_clinical_observations" ON public.clinical_observations;
DROP POLICY IF EXISTS "Patients view own observations" ON public.clinical_observations;
CREATE POLICY "patient_select_own_clinical_observations"
    ON public.clinical_observations FOR SELECT
    TO authenticated
    USING (
        patient_id IN (
            SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
        )
    );

-- Patients can insert their own observations
DROP POLICY IF EXISTS "patient_insert_own_clinical_observations" ON public.clinical_observations;
DROP POLICY IF EXISTS "Patients insert own observations" ON public.clinical_observations;
CREATE POLICY "patient_insert_own_clinical_observations"
    ON public.clinical_observations FOR INSERT
    TO authenticated
    WITH CHECK (
        patient_id IN (
            SELECT p.id FROM public.patients p WHERE p.user_id = (SELECT auth.uid())
        )
    );

-- Doctors with active care relationship can select observations
DROP POLICY IF EXISTS "doctor_select_care_clinical_observations" ON public.clinical_observations;
DROP POLICY IF EXISTS "Clinicians access care-relationship observations" ON public.clinical_observations;
CREATE POLICY "doctor_select_care_clinical_observations"
    ON public.clinical_observations FOR SELECT
    TO authenticated
    USING (
        (SELECT public.get_user_role()) = 'doctor'
        AND public.has_care_relationship(patient_id)
    );

-- Doctors with active care relationship can insert observations
DROP POLICY IF EXISTS "doctor_insert_care_clinical_observations" ON public.clinical_observations;
CREATE POLICY "doctor_insert_care_clinical_observations"
    ON public.clinical_observations FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT public.get_user_role()) = 'doctor'
        AND public.has_care_relationship(patient_id)
    );

-- Admins can delete observations (moderation, cleanup, right-to-erasure)
DROP POLICY IF EXISTS "admin_delete_clinical_observations" ON public.clinical_observations;
CREATE POLICY "admin_delete_clinical_observations"
    ON public.clinical_observations FOR DELETE
    TO authenticated
    USING (
        (SELECT public.get_user_role()) = 'admin'
    );
