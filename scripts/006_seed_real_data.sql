-- ============================================================================
-- 006_seed_real_data.sql
-- RuralHealth Platform — Phase 1: Real Data Seed
-- Based on real Indian rural healthcare data from MoHFW, NHM, WHO India
-- ============================================================================
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
-- 4. Verify data in Table Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Seed healthcare_providers (public directory — no user_id needed)
-- These represent real facility types found across rural India (PHC, CHC, etc.)
-- Data based on NHM Health Infrastructure reports 2024
-- ============================================================================

INSERT INTO healthcare_providers (id, name, email, phone, location, specialization, bio, avatar_url, is_verified) VALUES
  -- Primary Health Centres (PHC) — based on real PHC naming conventions
  (gen_random_uuid(), 'Dr. Rajesh Kumar', 'dr.rajesh@ruralhealth.com', '+91-9876543210',
   'PHC Sunderbani, Rajouri, Jammu & Kashmir',
   'General Medicine',
   'MBBS from GMC Jammu. 12 years of rural practice in Pir Panjal region. Specializes in treating malaria, typhoid, and respiratory infections common in hilly areas. Trained under NHM for emergency obstetric care.',
   NULL, TRUE),

  (gen_random_uuid(), 'Dr. Anita Patel', 'dr.anita@ruralhealth.com', '+91-9823456789',
   'CHC Dahod, Dahod District, Gujarat',
   'Obstetrics & Gynecology',
   'MS OB-GYN from BJ Medical College, Ahmedabad. Leading maternal health programs in tribal Gujarat. Reduced MMR in Dahod block from 230 to 98 per 100,000 live births through SUMAN initiative. Handles 40+ deliveries per month.',
   NULL, TRUE),

  (gen_random_uuid(), 'Dr. Vikram Singh Rathore', 'dr.vikram@ruralhealth.com', '+91-9934567890',
   'PHC Phulera, Jaipur Rural, Rajasthan',
   'Orthopedics',
   'MS Orthopedics from SMS Medical College, Jaipur. Treats fractures, joint disorders, and occupational injuries among farming communities. Conducts weekly outreach camps in 8 surrounding villages.',
   NULL, TRUE),

  (gen_random_uuid(), 'Dr. Meenakshi Sundaram', 'dr.meenakshi@ruralhealth.com', '+91-9845678901',
   'PHC Thirumangalam, Madurai District, Tamil Nadu',
   'Pediatrics',
   'MD Pediatrics from Madurai Medical College. Focuses on childhood malnutrition (stunting rate 31.5% in Madurai rural), anemia screening, and immunization coverage. Runs weekly well-baby clinics across 12 sub-centres.',
   NULL, TRUE),

  (gen_random_uuid(), 'Dr. Suresh Chandra Mishra', 'dr.suresh@ruralhealth.com', '+91-9756789012',
   'CHC Daltonganj, Palamu District, Jharkhand',
   'Internal Medicine',
   'MD Medicine from RIMS Ranchi. Manages TB-DOTS center (Palamu has TB prevalence of 350/100,000). Also handles kala-azar endemic cases. Serves a catchment of 1,20,000 population across 45 villages.',
   NULL, TRUE),

  (gen_random_uuid(), 'Dr. Priya Nair', 'dr.priya@ruralhealth.com', '+91-9867890123',
   'Sub-Centre Wayanad, Wayanad District, Kerala',
   'Community Medicine',
   'MD Community Medicine from Calicut Medical College. Coordinates Accredited Social Health Activist (ASHA) network of 85 workers across Wayanad tribal belt. Focus on sickle cell anemia screening (12% prevalence in Paniya tribe).',
   NULL, TRUE),

  (gen_random_uuid(), 'Dr. Arun Bhatt', 'dr.arun@ruralhealth.com', '+91-9778901234',
   'PHC Pithoragarh, Pithoragarh District, Uttarakhand',
   'General Surgery',
   'MS General Surgery from AIIMS Rishikesh. Handles emergency surgeries at this remote Himalayan PHC. Trained in trauma management — essential given difficult terrain and road accident cases. Closest referral hospital is 6 hours away.',
   NULL, TRUE),

  (gen_random_uuid(), 'Dr. Kavitha Reddy', 'dr.kavitha@ruralhealth.com', '+91-9689012345',
   'PHC Mahbubnagar, Mahbubnagar District, Telangana',
   'Dermatology',
   'MD Dermatology from Osmania Medical College. Treats fluorosis-related skin conditions (endemic in Nalgonda/Mahbubnagar belt due to high fluoride in groundwater — up to 5.6 mg/L). Also manages leprosy surveillance program.',
   NULL, TRUE),

  (gen_random_uuid(), 'Dr. Mohammad Iqbal Sheikh', 'dr.iqbal@ruralhealth.com', '+91-9590123456',
   'CHC Kupwara, Kupwara District, Jammu & Kashmir',
   'Pulmonology',
   'MD Pulmonology from SKIMS Srinagar. Manages respiratory illness burden including high-altitude pulmonary edema (HAPE) cases and winter respiratory infections. Operates the only functional spirometry lab in North Kashmir rural area.',
   NULL, TRUE),

  (gen_random_uuid(), 'Dr. Lakshmi Devi Sharma', 'dr.lakshmi@ruralhealth.com', '+91-9401234567',
   'PHC Majuli, Majuli District, Assam',
   'General Medicine',
   'MBBS from Gauhati Medical College. Serves Majuli — world''s largest river island with 1.7 lakh population. During annual floods (Jun-Sep), coordinates mobile medical units across 150+ villages. Manages snakebite protocols and waterborne diseases.',
   NULL, TRUE),

  (gen_random_uuid(), 'Dr. Ramesh Babu Yadav', 'dr.ramesh@ruralhealth.com', '+91-9312345678',
   'PHC Sheohar, Sheohar District, Bihar',
   'Cardiology',
   'DM Cardiology from PMCH Patna. Bihar has only 0.3 cardiologists per 100,000 population. Runs weekly ECG camps and manages hypertension screening. Has screened 15,000+ patients under NCD program.',
   NULL, TRUE),

  (gen_random_uuid(), 'Dr. Sunita Kumari Barla', 'dr.sunita@ruralhealth.com', '+91-9223456789',
   'CHC Koraput, Koraput District, Odisha',
   'Tropical Medicine',
   'DTM from SCB Medical College, Cuttack. Koraput is hyperendemic for P.falciparum malaria (API > 10). Manages seasonal malaria treatment center and coordinates with Malaria Research Centre. Also runs sickle cell screening clinics for Bonda and Gadaba tribes.',
   NULL, TRUE)
ON CONFLICT DO NOTHING;


-- ============================================================================
-- STEP 2: Create provider profiles linked to auth users
-- (The doctor@ruralhealth.com user needs a `providers` row for appointments)
-- ============================================================================

-- First, let's ensure the doctor user has a providers row
INSERT INTO providers (id, user_id, first_name, last_name, specialization, license_number, bio, is_verified, verification_date)
SELECT
  gen_random_uuid(),
  au.id,
  'Dr. Rajesh',
  'Kumar',
  'General Medicine',
  'MCI-2014-JK-00847',
  'MBBS from GMC Jammu. Senior Medical Officer at PHC Sunderbani. 12 years of rural practice specializing in tropical and infectious diseases.',
  TRUE,
  NOW() - INTERVAL '2 years'
FROM auth.users au
WHERE au.email = 'doctor@ruralhealth.com'
  AND NOT EXISTS (SELECT 1 FROM providers p WHERE p.user_id = au.id);


-- ============================================================================
-- STEP 3: Seed appointments (linked to real patient + provider)
-- Uses lookup by email to resolve UUIDs dynamically
-- ============================================================================

-- Create appointments for whatever patients exist
DO $$
DECLARE
  v_patient_id UUID;
  v_provider_id UUID;
  v_doctor_user_id UUID;
BEGIN
  -- Get the doctor's provider ID
  SELECT au.id INTO v_doctor_user_id FROM auth.users au WHERE au.email = 'doctor@ruralhealth.com';
  SELECT p.id INTO v_provider_id FROM providers p WHERE p.user_id = v_doctor_user_id;

  -- Get any patient (not doctor/admin)
  SELECT pt.id INTO v_patient_id
  FROM patients pt
  WHERE pt.role = 'patient' OR pt.role IS NULL
  ORDER BY pt.created_at ASC
  LIMIT 1;

  -- If no regular patient exists, try to use admin patient record
  IF v_patient_id IS NULL THEN
    SELECT pt.id INTO v_patient_id
    FROM patients pt
    ORDER BY pt.created_at ASC
    LIMIT 1;
  END IF;

  -- Only proceed if we have both
  IF v_patient_id IS NOT NULL AND v_provider_id IS NOT NULL THEN

    -- Upcoming appointments (future dates)
    INSERT INTO appointments (id, patient_id, provider_id, appointment_date, duration_minutes, status, notes, teleconsult_room_id)
    VALUES
      (gen_random_uuid(), v_patient_id, v_provider_id,
       NOW() + INTERVAL '2 days' + INTERVAL '10 hours',
       30, 'scheduled',
       'Follow-up for seasonal fever and joint pain. Patient reported symptoms for 5 days. Need to check for dengue/chikungunya markers.',
       'ruralhealth-consult-' || substr(md5(random()::text), 1, 8)),

      (gen_random_uuid(), v_patient_id, v_provider_id,
       NOW() + INTERVAL '5 days' + INTERVAL '11 hours',
       45, 'scheduled',
       'Annual health screening — blood pressure, blood sugar, BMI check. Part of NCD screening program under NHM.',
       'ruralhealth-consult-' || substr(md5(random()::text), 1, 8)),

      (gen_random_uuid(), v_patient_id, v_provider_id,
       NOW() + INTERVAL '8 days' + INTERVAL '14 hours',
       30, 'scheduled',
       'Teleconsultation for chronic back pain management. Patient is a 45-year-old agricultural worker with L4-L5 disc issues.',
       'ruralhealth-consult-' || substr(md5(random()::text), 1, 8)),

    -- Past appointments (completed)
      (gen_random_uuid(), v_patient_id, v_provider_id,
       NOW() - INTERVAL '3 days' + INTERVAL '9 hours',
       30, 'completed',
       'Treated for acute gastroenteritis. Prescribed ORS + Zinc + Ciprofloxacin. Advised boiling water before drinking. Common in monsoon season.',
       NULL),

      (gen_random_uuid(), v_patient_id, v_provider_id,
       NOW() - INTERVAL '10 days' + INTERVAL '10 hours',
       45, 'completed',
       'Iron deficiency anemia follow-up. Hb improved from 8.2 to 10.1 g/dL after 3 months of iron supplementation (Ferrous Sulphate 200mg BD). Continue for 3 more months.',
       NULL),

      (gen_random_uuid(), v_patient_id, v_provider_id,
       NOW() - INTERVAL '20 days' + INTERVAL '15 hours',
       30, 'completed',
       'Malaria (P. vivax) treatment completion. RDT negative. Primaquine 14-day course completed. No G6PD deficiency detected. Patient cleared.',
       NULL),

    -- Cancelled appointment
      (gen_random_uuid(), v_patient_id, v_provider_id,
       NOW() - INTERVAL '1 day' + INTERVAL '16 hours',
       30, 'cancelled',
       'Patient could not reach PHC due to road blockage from heavy rainfall. Rescheduled to next week via teleconsultation.',
       NULL),

    -- Pending appointment
      (gen_random_uuid(), v_patient_id, v_provider_id,
       NOW() + INTERVAL '1 day' + INTERVAL '9 hours',
       30, 'scheduled',
       'Urgent: Child (8y) with high fever (103°F) for 2 days and rash. Need to rule out measles — last vaccination status unknown. Mother requesting video consultation.',
       'ruralhealth-consult-' || substr(md5(random()::text), 1, 8));

  END IF;
END $$;


-- ============================================================================
-- STEP 4: Seed medical_records (diagnosis, prescriptions, lab results)
-- Real-world diagnoses common in rural India
-- ============================================================================

DO $$
DECLARE
  v_patient_id UUID;
  v_provider_id UUID;
  v_doctor_user_id UUID;
BEGIN
  SELECT au.id INTO v_doctor_user_id FROM auth.users au WHERE au.email = 'doctor@ruralhealth.com';
  SELECT p.id INTO v_provider_id FROM providers p WHERE p.user_id = v_doctor_user_id;
  SELECT pt.id INTO v_patient_id FROM patients pt WHERE pt.role = 'patient' OR pt.role IS NULL ORDER BY pt.created_at ASC LIMIT 1;
  IF v_patient_id IS NULL THEN
    SELECT pt.id INTO v_patient_id FROM patients pt ORDER BY pt.created_at ASC LIMIT 1;
  END IF;

  IF v_patient_id IS NOT NULL AND v_provider_id IS NOT NULL THEN
    INSERT INTO medical_records (id, patient_id, provider_id, record_type, content, created_at) VALUES
      -- Diagnosis records
      (gen_random_uuid(), v_patient_id, v_provider_id, 'diagnosis',
       'Diagnosis: Iron Deficiency Anemia (ICD-10: D50.9)
Presenting Complaints: Fatigue, pallor, breathlessness on exertion for 3 months
Examination: Conjunctival pallor ++, koilonychia present, no hepatosplenomegaly
Lab: Hb 8.2 g/dL, MCV 68 fL, Serum Ferritin 8 ng/mL, TIBC 450 μg/dL
Assessment: Moderate iron deficiency anemia — likely nutritional + chronic hookworm infection
Plan: Ferrous Sulphate 200mg BD × 6 months, Albendazole 400mg stat, Folic Acid 5mg OD
Dietary counseling: increase green leafy vegetables, jaggery, amla juice
Follow-up: 1 month for Hb recheck
Note: Anemia prevalence in this region is 58.2% among women (NFHS-5 data)',
       NOW() - INTERVAL '90 days'),

      (gen_random_uuid(), v_patient_id, v_provider_id, 'diagnosis',
       'Diagnosis: Plasmodium vivax Malaria (ICD-10: B51.9)
Presenting Complaints: High-grade intermittent fever with chills and rigors × 4 days, headache, myalgia
Examination: Temp 103.2°F, mild splenomegaly, no jaundice
Lab: Peripheral smear — P.vivax trophozoites seen, Parasite count: 8,000/μL, RDT: Pv positive
Assessment: Uncomplicated P.vivax malaria
Treatment: Chloroquine 600mg stat → 300mg at 6h, 24h, 48h (total 1500mg base over 3 days)
Radical cure: Primaquine 15mg OD × 14 days (after G6PD screen — normal)
Note: This PHC falls under API category >2 (Annual Parasite Incidence). Bed net distributed to family.',
       NOW() - INTERVAL '60 days'),

      -- Prescription record
      (gen_random_uuid(), v_patient_id, v_provider_id, 'prescription',
       'PRESCRIPTION — Dr. Rajesh Kumar, PHC Sunderbani
Date: ' || to_char(NOW() - INTERVAL '30 days', 'DD-Mon-YYYY') || '
Patient complaints: Persistent cough × 3 weeks, evening rise of temperature, weight loss 4kg in 2 months
Sputum AFB: Sent for CBNAAT/GeneXpert (result awaited)
Provisional Diagnosis: Suspected Pulmonary Tuberculosis (pending confirmation)

Interim Treatment:
1. Tab. Paracetamol 500mg — SOS for fever (max 4 times/day)
2. Syp. Benadryl Cough — 10mL TDS
3. Tab. Multivitamin — OD
4. High protein diet counseling

INSTRUCTIONS:
- Sputum sample sent to District TB Centre for CBNAAT testing
- If positive: Start Cat-I ATT under DOTS (RNTCP protocol)
- Return in 3 days for results
- Wear mask, maintain cough hygiene, separate utensils
- Contact ASHA worker Smt. Kamla Devi for daily DOTS observation if needed',
       NOW() - INTERVAL '30 days'),

      -- Lab result
      (gen_random_uuid(), v_patient_id, v_provider_id, 'lab_result',
       'LABORATORY REPORT — PHC Sunderbani Laboratory
Date: ' || to_char(NOW() - INTERVAL '25 days', 'DD-Mon-YYYY') || '
Test: Complete Blood Count (CBC)

Results:
  Hemoglobin: 10.1 g/dL (Ref: 12-16 g/dL) — IMPROVED from 8.2
  RBC Count: 4.1 million/μL (Ref: 4.5-5.5)
  WBC Count: 7,200/μL (Ref: 4,000-11,000) — NORMAL
  Platelet Count: 2.3 lakh/μL (Ref: 1.5-4.0 lakh) — NORMAL
  MCV: 74 fL (Ref: 80-100) — still microcytic, improving
  MCH: 24.6 pg (Ref: 27-33)
  MCHC: 32.1 g/dL (Ref: 32-36) — NORMAL
  ESR: 18 mm/hr (Ref: 0-20) — NORMAL

Peripheral Smear: Microcytic hypochromic RBCs, no parasites seen
Impression: Improving iron deficiency anemia on treatment',
       NOW() - INTERVAL '25 days'),

      -- Lab result — Blood Sugar
      (gen_random_uuid(), v_patient_id, v_provider_id, 'lab_result',
       'LABORATORY REPORT — NCD Screening Camp, Village Sunderbani
Date: ' || to_char(NOW() - INTERVAL '15 days', 'DD-Mon-YYYY') || '
Test: NCD Screening Panel (under NPCDCS program)

Results:
  Fasting Blood Sugar: 96 mg/dL (Ref: 70-100) — NORMAL
  Post-Prandial Blood Sugar: 134 mg/dL (Ref: <140) — NORMAL
  Blood Pressure: 128/82 mmHg — PREHYPERTENSION
  BMI: 22.4 kg/m² — NORMAL
  Waist Circumference: 78 cm — NORMAL
  Random Blood Cholesterol: 198 mg/dL (Ref: <200) — BORDERLINE

Screening Risk Category: LOW RISK
Recommendation: Lifestyle modification, reduce salt intake (<5g/day), recheck BP in 3 months
Note: Screened under NPCDCS (National Programme for Prevention and Control of Cancer, Diabetes, CVD and Stroke)',
       NOW() - INTERVAL '15 days'),

      -- Vaccination record
      (gen_random_uuid(), v_patient_id, v_provider_id, 'diagnosis',
       'VACCINATION RECORD — Routine Immunization Session
Session Site: AWC (Anganwadi Centre) #47, Village Sunderbani
Date: ' || to_char(NOW() - INTERVAL '45 days', 'DD-Mon-YYYY') || '

Child: 9 months old (name on file)
Vaccinations Administered:
  ✅ Measles-Rubella (MR-1) — Right upper arm, SC injection
  ✅ JE-1 (Japanese Encephalitis) — Left upper arm, SC injection
  ✅ Vitamin A — 1 lakh IU oral dose

Previous Vaccines (verified from MCP card):
  ✅ BCG, OPV-0, Hep-B birth dose (at birth)
  ✅ Pentavalent 1,2,3 + OPV 1,2,3 + Rotavirus 1,2,3 + fIPV 1,2 + PCV 1,2,3
  
Next Due: MR-2 + JE-2 + DPT Booster-1 + OPV Booster at 16-24 months
AEFI Monitoring: 30 min observation completed, no adverse events
Immunization coverage this session: 23/28 eligible children (82.1%)',
       NOW() - INTERVAL '45 days');
  END IF;
END $$;


-- ============================================================================
-- STEP 5: Seed health_data (vital signs over time — realistic trends)
-- Based on typical rural Indian patient vitals
-- ============================================================================

DO $$
DECLARE
  v_patient_id UUID;
BEGIN
  SELECT pt.id INTO v_patient_id FROM patients pt WHERE pt.role = 'patient' OR pt.role IS NULL ORDER BY pt.created_at ASC LIMIT 1;
  IF v_patient_id IS NULL THEN
    SELECT pt.id INTO v_patient_id FROM patients pt ORDER BY pt.created_at ASC LIMIT 1;
  END IF;

  IF v_patient_id IS NOT NULL THEN
    INSERT INTO health_data (id, patient_id, data_type, value, unit, notes, recorded_at) VALUES
      -- Blood Pressure readings (systolic) — over 3 months
      (gen_random_uuid(), v_patient_id, 'blood_pressure_systolic', 128, 'mmHg', 'Prehypertension — counseled on salt reduction', NOW() - INTERVAL '90 days'),
      (gen_random_uuid(), v_patient_id, 'blood_pressure_systolic', 132, 'mmHg', 'Slightly elevated, patient reports stress from crop failure', NOW() - INTERVAL '60 days'),
      (gen_random_uuid(), v_patient_id, 'blood_pressure_systolic', 126, 'mmHg', 'Improving after dietary changes', NOW() - INTERVAL '30 days'),
      (gen_random_uuid(), v_patient_id, 'blood_pressure_systolic', 124, 'mmHg', 'Good trend — continue lifestyle modifications', NOW() - INTERVAL '7 days'),

      -- Blood Pressure (diastolic)
      (gen_random_uuid(), v_patient_id, 'blood_pressure_diastolic', 82, 'mmHg', NULL, NOW() - INTERVAL '90 days'),
      (gen_random_uuid(), v_patient_id, 'blood_pressure_diastolic', 86, 'mmHg', NULL, NOW() - INTERVAL '60 days'),
      (gen_random_uuid(), v_patient_id, 'blood_pressure_diastolic', 80, 'mmHg', NULL, NOW() - INTERVAL '30 days'),
      (gen_random_uuid(), v_patient_id, 'blood_pressure_diastolic', 78, 'mmHg', NULL, NOW() - INTERVAL '7 days'),

      -- Heart Rate
      (gen_random_uuid(), v_patient_id, 'heart_rate', 78, 'bpm', 'Normal resting heart rate', NOW() - INTERVAL '90 days'),
      (gen_random_uuid(), v_patient_id, 'heart_rate', 82, 'bpm', 'Slight tachycardia — anemia related', NOW() - INTERVAL '60 days'),
      (gen_random_uuid(), v_patient_id, 'heart_rate', 76, 'bpm', 'Improving with iron supplementation', NOW() - INTERVAL '30 days'),
      (gen_random_uuid(), v_patient_id, 'heart_rate', 74, 'bpm', 'Normal', NOW() - INTERVAL '7 days'),

      -- Temperature
      (gen_random_uuid(), v_patient_id, 'temperature', 98.6, '°F', 'Normal', NOW() - INTERVAL '90 days'),
      (gen_random_uuid(), v_patient_id, 'temperature', 103.2, '°F', 'High fever — malaria episode', NOW() - INTERVAL '60 days'),
      (gen_random_uuid(), v_patient_id, 'temperature', 98.4, '°F', 'Normal — post treatment', NOW() - INTERVAL '30 days'),
      (gen_random_uuid(), v_patient_id, 'temperature', 98.8, '°F', 'Normal', NOW() - INTERVAL '7 days'),

      -- Hemoglobin (g/dL) — tracking anemia treatment
      (gen_random_uuid(), v_patient_id, 'hemoglobin', 8.2, 'g/dL', 'Moderate anemia — started iron supplementation', NOW() - INTERVAL '90 days'),
      (gen_random_uuid(), v_patient_id, 'hemoglobin', 9.1, 'g/dL', 'Improving on Ferrous Sulphate 200mg BD', NOW() - INTERVAL '60 days'),
      (gen_random_uuid(), v_patient_id, 'hemoglobin', 10.1, 'g/dL', 'Significant improvement — continue treatment', NOW() - INTERVAL '30 days'),
      (gen_random_uuid(), v_patient_id, 'hemoglobin', 11.0, 'g/dL', 'Near normal — 3 more months of supplementation', NOW() - INTERVAL '7 days'),

      -- Weight (kg)
      (gen_random_uuid(), v_patient_id, 'weight', 52.0, 'kg', 'BMI 21.6 — normal range', NOW() - INTERVAL '90 days'),
      (gen_random_uuid(), v_patient_id, 'weight', 50.5, 'kg', 'Weight loss during illness', NOW() - INTERVAL '60 days'),
      (gen_random_uuid(), v_patient_id, 'weight', 51.8, 'kg', 'Recovering', NOW() - INTERVAL '30 days'),
      (gen_random_uuid(), v_patient_id, 'weight', 53.2, 'kg', 'Healthy weight gain on improved diet', NOW() - INTERVAL '7 days'),

      -- Blood Sugar (Fasting)
      (gen_random_uuid(), v_patient_id, 'blood_sugar_fasting', 94, 'mg/dL', 'Normal fasting glucose', NOW() - INTERVAL '90 days'),
      (gen_random_uuid(), v_patient_id, 'blood_sugar_fasting', 96, 'mg/dL', 'Normal — NCD screening', NOW() - INTERVAL '15 days'),

      -- SpO2
      (gen_random_uuid(), v_patient_id, 'oxygen_saturation', 97, '%', 'Normal oxygen saturation', NOW() - INTERVAL '60 days'),
      (gen_random_uuid(), v_patient_id, 'oxygen_saturation', 98, '%', 'Normal', NOW() - INTERVAL '7 days');
  END IF;
END $$;


-- ============================================================================
-- STEP 6: Seed notifications for existing users
-- ============================================================================

DO $$
DECLARE
  v_patient_user_id UUID;
  v_doctor_user_id UUID;
  v_admin_user_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO v_doctor_user_id FROM auth.users WHERE email = 'doctor@ruralhealth.com';
  SELECT id INTO v_admin_user_id FROM auth.users WHERE email = 'admin@ruralhealth.com';
  
  -- Get a patient user
  SELECT au.id INTO v_patient_user_id
  FROM auth.users au
  JOIN patients pt ON pt.user_id = au.id
  WHERE (pt.role = 'patient' OR pt.role IS NULL)
    AND au.email NOT IN ('doctor@ruralhealth.com', 'admin@ruralhealth.com')
  LIMIT 1;

  -- If no separate patient user, use any user
  IF v_patient_user_id IS NULL THEN
    SELECT au.id INTO v_patient_user_id
    FROM auth.users au
    JOIN patients pt ON pt.user_id = au.id
    WHERE au.email NOT IN ('doctor@ruralhealth.com', 'admin@ruralhealth.com')
    LIMIT 1;
  END IF;

  -- Notifications for doctor
  IF v_doctor_user_id IS NOT NULL THEN
    INSERT INTO notifications (id, user_id, title, message, type, read, created_at) VALUES
      (gen_random_uuid(), v_doctor_user_id,
       'New Patient Appointment',
       'A new teleconsultation appointment has been scheduled for tomorrow at 10:00 AM. Patient reports fever and joint pain for 5 days.',
       'appointment', FALSE, NOW() - INTERVAL '1 hour'),
      (gen_random_uuid(), v_doctor_user_id,
       'Lab Results Available',
       'CBC results for patient are ready. Hemoglobin has improved to 10.1 g/dL from 8.2 g/dL. Review and update treatment plan.',
       'result', FALSE, NOW() - INTERVAL '6 hours'),
      (gen_random_uuid(), v_doctor_user_id,
       'NHM Training Webinar',
       'Mandatory training session on updated RNTCP TB treatment guidelines (NTEP 2025) scheduled for next Monday at 2 PM. Register via NHM portal.',
       'alert', FALSE, NOW() - INTERVAL '1 day'),
      (gen_random_uuid(), v_doctor_user_id,
       'Monthly Report Due',
       'Monthly Health Management Information System (HMIS) report for this PHC is due by the 5th. Please submit patient counts, disease surveillance data, and medicine stock status.',
       'alert', TRUE, NOW() - INTERVAL '3 days');
  END IF;

  -- Notifications for admin
  IF v_admin_user_id IS NOT NULL THEN
    INSERT INTO notifications (id, user_id, title, message, type, read, created_at) VALUES
      (gen_random_uuid(), v_admin_user_id,
       'New Provider Registration',
       'Dr. Sunita Kumari Barla (Tropical Medicine, CHC Koraput) has submitted verification documents. Please review and approve.',
       'alert', FALSE, NOW() - INTERVAL '2 hours'),
      (gen_random_uuid(), v_admin_user_id,
       'Platform Health Check',
       'System Status: All services operational. Database: 94% storage used. Active users this week: 47. API response time: avg 230ms.',
       'alert', FALSE, NOW() - INTERVAL '12 hours'),
      (gen_random_uuid(), v_admin_user_id,
       'Medicine Stock Alert',
       'Critical stock alert: ORS packets at PHC Sunderbani below minimum threshold (23 remaining, minimum 100). Paracetamol stock at 15%. Place supply order urgently.',
       'alert', FALSE, NOW() - INTERVAL '1 day');
  END IF;

  -- Notifications for patient
  IF v_patient_user_id IS NOT NULL THEN
    INSERT INTO notifications (id, user_id, title, message, type, read, created_at) VALUES
      (gen_random_uuid(), v_patient_user_id,
       'Appointment Reminder',
       'Your teleconsultation with Dr. Rajesh Kumar is scheduled for tomorrow at 10:00 AM. Please ensure stable internet connection. Join via the Appointments section.',
       'appointment', FALSE, NOW() - INTERVAL '30 minutes'),
      (gen_random_uuid(), v_patient_user_id,
       'Prescription Ready',
       'Your prescription for Iron Deficiency Anemia treatment has been updated. Continue Ferrous Sulphate 200mg twice daily. Next blood test due in 4 weeks.',
       'result', FALSE, NOW() - INTERVAL '2 days'),
      (gen_random_uuid(), v_patient_user_id,
       'Health Camp Near You',
       'Free NCD screening camp at Anganwadi Centre #47, Sunderbani on Sunday 9 AM - 4 PM. Services: BP check, blood sugar, BMI, eye screening. Bring Aadhaar card.',
       'alert', FALSE, NOW() - INTERVAL '3 days'),
      (gen_random_uuid(), v_patient_user_id,
       'Vaccination Reminder',
       'Your child is due for MR-2, JE-2, and DPT Booster-1 vaccination at 16-24 months. Visit the nearest immunization session site. Check schedule at PHC Sunderbani.',
       'alert', TRUE, NOW() - INTERVAL '5 days'),
      (gen_random_uuid(), v_patient_user_id,
       'Lab Results Ready',
       'Your Complete Blood Count (CBC) results are available in your Medical Records section. Hemoglobin has improved from 8.2 to 10.1 g/dL. Continue iron supplements.',
       'result', TRUE, NOW() - INTERVAL '7 days');
  END IF;
END $$;


-- ============================================================================
-- STEP 7: Update patient profiles with more complete data
-- ============================================================================

-- Update doctor patient profile with full info
UPDATE patients SET
  phone = '+91-9876543210',
  gender = 'male',
  address = 'PHC Sunderbani, Rajouri District, Jammu & Kashmir - 185234',
  medical_history = 'No significant past medical history',
  allergies = 'None known',
  current_medications = 'None'
WHERE email = 'doctor@ruralhealth.com';

-- Update admin patient profile
UPDATE patients SET
  phone = '+91-9800000001',
  gender = 'male',
  address = 'District Health Office, Rajouri, J&K - 185131',
  medical_history = 'Mild hypertension, controlled on medication',
  allergies = 'Sulfa drugs',
  current_medications = 'Amlodipine 5mg OD'
WHERE email = 'admin@ruralhealth.com';


-- ============================================================================
-- STEP 8: Verify seed data
-- ============================================================================

-- Run these SELECT statements to verify:
SELECT 'healthcare_providers' AS "table", COUNT(*) AS "count" FROM healthcare_providers
UNION ALL
SELECT 'patients', COUNT(*) FROM patients
UNION ALL
SELECT 'providers', COUNT(*) FROM providers
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'medical_records', COUNT(*) FROM medical_records
UNION ALL
SELECT 'health_data', COUNT(*) FROM health_data
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;
