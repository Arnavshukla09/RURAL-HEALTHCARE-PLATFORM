-- ================================================================
-- 07_seed_camps.sql
-- Seeds 10 realistic health camps across Madhya Pradesh.
-- Columns match schema in 01_schema.sql exactly:
-- title, description, location, address, start_date, end_date,
-- start_time, status, category, participants, phone, map_url, is_annual
-- ================================================================

INSERT INTO camps (title, description, location, address, start_date, end_date, start_time, status, category, participants, phone, map_url, is_annual)
VALUES

  (
    'TB Screening & DOTS Enrollment Camp',
    'Free tuberculosis screening, chest X-ray interpretation, and DOTS therapy enrollment under Nikshay Poshan Yojana. Sputum samples collected on-site. Targets villagers in Berasia and Bairasiya blocks.',
    'PHC Berasia, Bhopal District, Madhya Pradesh',
    'Near Berasia Bus Stand, Bhopal Rural',
    (CURRENT_DATE + INTERVAL '7 days')::date,
    (CURRENT_DATE + INTERVAL '9 days')::date,
    '09:00',
    'upcoming',
    'tb_screening',
    500,
    '+91-755-2441234',
    'https://maps.google.com/?q=PHC+Berasia+Bhopal',
    FALSE
  ),

  (
    'Maternal & Child Health Immunization Camp',
    'Antenatal checkups, iron-folic acid distribution, immunization (Pentavalent, BCG, OPV), and nutrition assessment for children under 5. ASHA workers coordinating door-to-door enrollment.',
    'CHC Sanwer, Indore District, Madhya Pradesh',
    'Sanwer Community Health Centre Campus',
    (CURRENT_DATE + INTERVAL '3 days')::date,
    (CURRENT_DATE + INTERVAL '5 days')::date,
    '08:30',
    'upcoming',
    'maternal_child',
    300,
    '+91-731-2701234',
    'https://maps.google.com/?q=CHC+Sanwer+Indore',
    FALSE
  ),

  (
    'Pulse Polio Immunization Drive — Jabalpur',
    'Pulse Polio immunization drive covering children aged 0–5 years across 42 booths. OPV drops administered. Zero-dose children tracked via ANMOL app.',
    'PHC Sihora, Jabalpur District, Madhya Pradesh',
    'Block PHC Campus, Sihora',
    (CURRENT_DATE + INTERVAL '14 days')::date,
    (CURRENT_DATE + INTERVAL '15 days')::date,
    '07:00',
    'upcoming',
    'immunization',
    1200,
    '+91-761-2622345',
    'https://maps.google.com/?q=PHC+Sihora+Jabalpur',
    TRUE
  ),

  (
    'Diabetes & Hypertension Screening Camp',
    'Random blood glucose, HbA1c, and BP screening for adults above 30. NPCDCS enrollment for confirmed cases. Lifestyle counseling and free generic drug dispensing for 3 months.',
    'CHC Hoshangabad, Narmadapuram District, Madhya Pradesh',
    'Narmadapuram Community Health Centre',
    (CURRENT_DATE + INTERVAL '10 days')::date,
    (CURRENT_DATE + INTERVAL '11 days')::date,
    '10:00',
    'upcoming',
    'ncd_screening',
    400,
    '+91-7574-255678',
    'https://maps.google.com/?q=CHC+Hoshangabad+MP',
    FALSE
  ),

  (
    'Eye Care & Cataract Screening Camp',
    'Free vision testing, cataract screening, and corrective spectacle distribution. Confirmed cataract patients receive referral for free surgery at District Hospital under National Programme for Control of Blindness.',
    'PHC Dabra, Gwalior District, Madhya Pradesh',
    'Dabra Primary Health Centre, Gwalior',
    (CURRENT_DATE + INTERVAL '5 days')::date,
    (CURRENT_DATE + INTERVAL '6 days')::date,
    '09:30',
    'upcoming',
    'eye_care',
    350,
    '+91-751-2344567',
    'https://maps.google.com/?q=PHC+Dabra+Gwalior',
    FALSE
  ),

  (
    'Leprosy Detection & MDT Camp — Tikamgarh',
    'Early detection of leprosy under NLEP. HbS solubility test and HPLC confirmation. Dapsone/Rifampicin MDT started immediately. Skin disease and fungal infection treatment also available.',
    'Sub-District Hospital, Tikamgarh, Madhya Pradesh',
    'Tikamgarh SDH Premises',
    (CURRENT_DATE + INTERVAL '20 days')::date,
    (CURRENT_DATE + INTERVAL '21 days')::date,
    '10:00',
    'upcoming',
    'skin_leprosy',
    250,
    '+91-7683-242123',
    'https://maps.google.com/?q=Sub+District+Hospital+Tikamgarh',
    FALSE
  ),

  (
    'Mental Health Awareness & Counseling Camp',
    'Destigmatization sessions, depression and anxiety screening using PHQ-9 and GAD-7 tools. Referral to DMHP services. Focused on agricultural communities dealing with crop failure stress. Psychiatrist and counselors present.',
    'Zila Panchayat Hall, Sagar, Madhya Pradesh',
    'Main Zila Panchayat Building, Sagar',
    (CURRENT_DATE + INTERVAL '30 days')::date,
    (CURRENT_DATE + INTERVAL '30 days')::date,
    '11:00',
    'upcoming',
    'mental_health',
    150,
    '+91-7582-224567',
    'https://maps.google.com/?q=Zila+Panchayat+Sagar+MP',
    FALSE
  ),

  (
    'Cervical & Breast Cancer Screening Camp',
    'VIA (Visual Inspection with Acetic Acid) for cervical cancer screening, clinical breast examination, HPV vaccination for adolescent girls (9–14 years). Targets women aged 30–65 under NPCDCS.',
    'CHC Vidisha, Vidisha District, Madhya Pradesh',
    'Vidisha Community Health Centre',
    (CURRENT_DATE + INTERVAL '12 days')::date,
    (CURRENT_DATE + INTERVAL '13 days')::date,
    '09:00',
    'upcoming',
    'cancer_screening',
    200,
    '+91-7592-232234',
    'https://maps.google.com/?q=CHC+Vidisha+MP',
    FALSE
  ),

  (
    'Sickle Cell Disease Screening — Mandla Tribal Area',
    'Free sickle cell disease screening in MP tribal belt (30–40% carrier prevalence). HbS solubility test and HPLC confirmation. Genetic counseling for carrier couples. Children under 5 prioritized.',
    'PHC Mandla, Mandla District, Madhya Pradesh',
    'Mandla PHC Campus, Near Narmada Bank',
    (CURRENT_DATE + INTERVAL '18 days')::date,
    (CURRENT_DATE + INTERVAL '19 days')::date,
    '08:00',
    'upcoming',
    'genetic_screening',
    600,
    '+91-7642-252345',
    'https://maps.google.com/?q=PHC+Mandla+MP',
    FALSE
  ),

  (
    'Diarrheal Disease & ORS Distribution Camp',
    'ORS distribution, water purification tablet supply, and hygiene education for flood-prone villages. Cholera rapid test kits available. Pediatric IV fluid setup for severe dehydration cases. IDSP coordinated.',
    'PHC Barwani, Barwani District, Madhya Pradesh',
    'Barwani PHC, Near District Collectorate',
    (CURRENT_DATE + INTERVAL '2 days')::date,
    (CURRENT_DATE + INTERVAL '4 days')::date,
    '07:30',
    'upcoming',
    'diarrheal_disease',
    800,
    '+91-7290-222456',
    'https://maps.google.com/?q=PHC+Barwani+MP',
    FALSE
  );
