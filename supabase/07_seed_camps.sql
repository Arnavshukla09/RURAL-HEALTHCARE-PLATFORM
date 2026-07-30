-- ================================================================
-- 07_seed_camps.sql
-- Seeds 10 realistic health camps across Madhya Pradesh and India.
-- Run this in the Supabase SQL Editor after 04_seed_data.sql
-- ================================================================

INSERT INTO camps (
  name, description, location, start_date, end_date,
  organizer, contact_phone, camp_type, max_participants,
  latitude, longitude, status
) VALUES
  (
    'TB Screening & DOTS Camp — Bhopal Rural',
    'Free tuberculosis screening, chest X-ray interpretation, and DOTS therapy enrollment. Targets 500+ villagers in Berasia and Bairasiya blocks. Sputum samples collected on-site.',
    'PHC Berasia, Bhopal District, Madhya Pradesh',
    (CURRENT_DATE + INTERVAL '7 days')::date,
    (CURRENT_DATE + INTERVAL '9 days')::date,
    'National Health Mission MP & Bhopal District Health Society',
    '+91-755-2441234',
    'tuberculosis',
    500,
    23.6282, 77.4317,
    'upcoming'
  ),
  (
    'Maternal & Child Health Camp — Indore',
    'Antenatal checkups, iron-folic acid distribution, immunization (Pentavalent, BCG, OPV), nutrition assessment for children under 5. ASHA workers coordinating door-to-door enrollment.',
    'CHC Sanwer, Indore District, Madhya Pradesh',
    (CURRENT_DATE + INTERVAL '3 days')::date,
    (CURRENT_DATE + INTERVAL '5 days')::date,
    'CMHO Indore & UNICEF MP',
    '+91-731-2701234',
    'maternal_child',
    300,
    22.9734, 75.8245,
    'upcoming'
  ),
  (
    'Polio Pulse Immunization — Jabalpur Division',
    'Pulse Polio immunization drive covering children aged 0–5 years across 42 booths. OPV drops administered. Zero-dose children tracked via ANMOL app.',
    'Block PHC Sihora, Jabalpur District, Madhya Pradesh',
    (CURRENT_DATE + INTERVAL '14 days')::date,
    (CURRENT_DATE + INTERVAL '15 days')::date,
    'Directorate of Health Services MP & WHO India',
    '+91-761-2622345',
    'immunization',
    1200,
    23.4867, 79.8132,
    'upcoming'
  ),
  (
    'Diabetic & Hypertension Screening Camp',
    'Random blood glucose, HbA1c, and BP screening for adults above 30. NPCDCS enrollment for confirmed cases. Lifestyle counseling and free generic drug dispensing for 3 months.',
    'Community Health Centre Hoshangabad, Madhya Pradesh',
    (CURRENT_DATE + INTERVAL '10 days')::date,
    (CURRENT_DATE + INTERVAL '11 days')::date,
    'CMHO Hoshangabad & MP State NCD Cell',
    '+91-7574-255678',
    'ncd_screening',
    400,
    22.7477, 77.7279,
    'upcoming'
  ),
  (
    'Eye Care & Cataract Screening Camp — Gwalior',
    'Free vision testing, cataract screening, and corrective spectacle distribution. Confirmed cataract patients receive referral for free surgery at District Hospital. Organized under National Programme for Control of Blindness.',
    'PHC Dabra, Gwalior District, Madhya Pradesh',
    (CURRENT_DATE + INTERVAL '5 days')::date,
    (CURRENT_DATE + INTERVAL '6 days')::date,
    'NPCB Cell MP & Rotary Club Gwalior',
    '+91-751-2344567',
    'eye_care',
    350,
    25.8934, 78.3412,
    'upcoming'
  ),
  (
    'Skin Disease & Leprosy Detection Camp',
    'Early detection of leprosy (Madhya Pradesh has highest leprosy burden in India at 2.52 per 10,000), psoriasis, fungal infections. NLEP enrollment on-site. Dapsone/rifampicin MDT started immediately.',
    'Sub-District Hospital Tikamgarh, Madhya Pradesh',
    (CURRENT_DATE + INTERVAL '20 days')::date,
    (CURRENT_DATE + INTERVAL '21 days')::date,
    'NLEP MP & District Leprosy Office',
    '+91-7683-242123',
    'skin_leprosy',
    250,
    24.7443, 78.8305,
    'upcoming'
  ),
  (
    'Mental Health Awareness & Counseling Camp',
    'Destigmatization sessions, depression and anxiety screening (PHQ-9 & GAD-7), referral to DMHP services. Specially focused on agricultural communities dealing with crop failure stress. Psychiatrist and counselors present.',
    'Zila Panchayat Hall, Sagar, Madhya Pradesh',
    (CURRENT_DATE + INTERVAL '30 days')::date,
    (CURRENT_DATE + INTERVAL '30 days')::date,
    'District Mental Health Programme Sagar & NIMHANS Outreach',
    '+91-7582-224567',
    'mental_health',
    150,
    23.8388, 78.7378,
    'upcoming'
  ),
  (
    'Women''s Cancer Screening Camp — Cervical & Breast',
    'VIA (Visual Inspection with Acetic Acid) for cervical cancer screening, clinical breast examination, HPV vaccination for adolescent girls (9–14 years). Targets women aged 30–65. Organized under NPCDCS.',
    'CHC Vidisha, Madhya Pradesh',
    (CURRENT_DATE + INTERVAL '12 days')::date,
    (CURRENT_DATE + INTERVAL '13 days')::date,
    'CMHO Vidisha & National Cancer Control Programme',
    '+91-7592-232234',
    'cancer_screening',
    200,
    23.5251, 77.8082,
    'upcoming'
  ),
  (
    'Sickle Cell Disease Screening Camp — Tribal Area',
    'Free sickle cell disease screening (Madhya Pradesh tribal belt has 30–40% carrier prevalence). HbS solubility test + HPLC for confirmation. Genetic counseling for carrier couples. Children under 5 prioritized.',
    'PHC Mandla, Mandla District, Madhya Pradesh',
    (CURRENT_DATE + INTERVAL '18 days')::date,
    (CURRENT_DATE + INTERVAL '19 days')::date,
    'NHM MP Tribal Health Cell & ICMR',
    '+91-7642-252345',
    'genetic_screening',
    600,
    22.5985, 80.3779,
    'upcoming'
  ),
  (
    'Diarrheal Disease & ORS Distribution Camp',
    'Oral Rehydration Solution distribution, water purification tablet supply, and hygiene education for flood-prone villages. Cholera rapid test kits available. Pediatric IV fluid setup for severe dehydration cases.',
    'PHC Barwani, Barwani District, Madhya Pradesh',
    (CURRENT_DATE + INTERVAL '2 days')::date,
    (CURRENT_DATE + INTERVAL '4 days')::date,
    'Integrated Disease Surveillance Programme MP',
    '+91-7290-222456',
    'diarrheal_disease',
    800,
    22.0363, 74.9057,
    'upcoming'
  );
