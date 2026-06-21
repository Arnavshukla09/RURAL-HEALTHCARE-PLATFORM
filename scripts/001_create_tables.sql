-- Create healthcare providers table
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

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create healthcare providers profile
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

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled
  notes TEXT,
  teleconsult_room_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medical records table
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  record_type TEXT, -- diagnosis, prescription, lab_result, etc
  content TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create health data (vital signs, measurements) table
CREATE TABLE IF NOT EXISTS health_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL, -- blood_pressure, heart_rate, temperature, weight, etc
  value NUMERIC NOT NULL,
  unit TEXT,
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create offline sync log table
CREATE TABLE IF NOT EXISTS offline_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  data JSONB NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT, -- appointment, result, alert, etc
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_providers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patients
CREATE POLICY "patients_select_own" ON patients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "patients_insert_own" ON patients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "patients_update_own" ON patients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "patients_delete_own" ON patients FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for providers
CREATE POLICY "providers_select_own" ON providers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "providers_insert_own" ON providers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "providers_update_own" ON providers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "providers_delete_own" ON providers FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for appointments (patients and providers can see their own)
CREATE POLICY "appointments_select_patient" ON appointments FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM patients WHERE id = patient_id)
);
CREATE POLICY "appointments_select_provider" ON appointments FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM providers WHERE id = provider_id)
);
CREATE POLICY "appointments_insert_patient" ON appointments FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM patients WHERE id = patient_id)
);
CREATE POLICY "appointments_update_patient" ON appointments FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM patients WHERE id = patient_id)
);

-- RLS Policies for medical_records
CREATE POLICY "medical_records_select_patient" ON medical_records FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM patients WHERE id = patient_id)
);
CREATE POLICY "medical_records_select_provider" ON medical_records FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM providers WHERE id = provider_id)
);
CREATE POLICY "medical_records_insert_provider" ON medical_records FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM providers WHERE id = provider_id)
);

-- RLS Policies for health_data
CREATE POLICY "health_data_select_own" ON health_data FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM patients WHERE id = patient_id)
);
CREATE POLICY "health_data_insert_own" ON health_data FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM patients WHERE id = patient_id)
);

-- RLS Policies for offline_sync_log
CREATE POLICY "offline_sync_log_select_own" ON offline_sync_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "offline_sync_log_insert_own" ON offline_sync_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for healthcare_providers (publicly readable)
CREATE POLICY "healthcare_providers_select_all" ON healthcare_providers FOR SELECT USING (TRUE);
