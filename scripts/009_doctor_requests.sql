-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS doctor_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  specialization text,
  license_number text,
  hospital_affiliation text,
  experience_years int,
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  admin_notes text
);

ALTER TABLE doctor_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_sees_own" ON doctor_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_inserts_own" ON doctor_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin_manages_all" ON doctor_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM patients WHERE user_id = auth.uid() AND role = 'admin')
);

-- Confirm storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('medical-records', 'medical-records', false, 5242880,
  ARRAY['image/jpeg','image/png','application/pdf'])
ON CONFLICT DO NOTHING;

SELECT 'Done' AS result;
