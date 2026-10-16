-- ==========================================
-- 01_schema.sql
-- Core Table Definitions for Rural Healthcare
-- ==========================================

-- Enable PostGIS extension for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Healthcare Providers Table
CREATE TABLE IF NOT EXISTS healthcare_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  specialization TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  medical_history TEXT,
  allergies TEXT,
  current_medications TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Providers Profile (Legacy mapping, optional)
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  specialization TEXT,
  license_number TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  teleconsult_room_id TEXT,
  consultation_type TEXT DEFAULT 'video' CHECK (consultation_type IN ('video', 'audio', 'chat', 'in_person')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON public.appointments(provider_id);

-- 5. Medical Records Table
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES healthcare_providers(id) ON DELETE SET NULL, -- Nullable to allow patient-uploaded records
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  record_type TEXT, 
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_provider_id ON public.medical_records(provider_id);

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'emergency')),
  recipient_type TEXT NOT NULL DEFAULT 'individual' CHECK (recipient_type IN ('all', 'role', 'individual')),
  recipient_role TEXT,
  recipient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);

-- 7. Camps Table
CREATE TABLE IF NOT EXISTS camps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  address TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('active', 'upcoming', 'ended')),
  category TEXT NOT NULL DEFAULT 'checkup',
  participants INTEGER,
  phone TEXT,
  map_url TEXT,
  is_annual BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_camps_status ON camps(status);
CREATE INDEX IF NOT EXISTS idx_camps_start_date ON camps(start_date);

-- 8. Healthcare Facilities (PostGIS)
CREATE TABLE IF NOT EXISTS healthcare_facilities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  osm_id bigint UNIQUE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('hospital','clinic','doctors','pharmacy','lab','health_post')),
  address text,
  phone text,
  district text,
  state text DEFAULT 'Madhya Pradesh',
  lat double precision NOT NULL,
  lon double precision NOT NULL,
  geom geography(Point, 4326),
  tags jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_facilities_geom ON healthcare_facilities USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_facilities_type ON healthcare_facilities (type);

-- 9. Health Data Table (Vitals & Clinical Telemetry)
CREATE TABLE IF NOT EXISTS health_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  data_type TEXT,
  value NUMERIC,
  unit TEXT,
  notes TEXT,
  blood_pressure TEXT,
  temperature NUMERIC,
  pulse_rate NUMERIC,
  blood_sugar NUMERIC,
  spo2 NUMERIC,
  weight NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_health_data_patient ON health_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_data_recorded ON health_data(patient_id, recorded_at DESC);

-- 10. Processed Client Operations (Offline Idempotency)
CREATE TABLE IF NOT EXISTS processed_client_ops (
  user_id UUID NOT NULL,
  client_op_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, client_op_id)
);
CREATE INDEX IF NOT EXISTS idx_processed_client_ops_age ON processed_client_ops(processed_at);

-- 11. Offline Sync Log
CREATE TABLE IF NOT EXISTS offline_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name TEXT,
  operation TEXT,
  client_op_id UUID,
  status TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_offline_sync_log_user_id ON offline_sync_log(user_id);

-- 12. Doctor Onboarding & Verification Requests
CREATE TABLE IF NOT EXISTS doctor_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  specialization TEXT,
  license_number TEXT,
  qualification TEXT,
  experience_years INTEGER,
  hospital_affiliation TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_doctor_requests_user_id ON doctor_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_requests_status ON doctor_requests(status);

-- 13. Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- 14. Storage configuration for Medical Records
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-records', 'medical-records', false) ON CONFLICT DO NOTHING;
