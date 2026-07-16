# Rural Healthcare Platform Walkthrough

Welcome to the Rural Healthcare Platform. This document outlines the key workflows and functionality of the application across its three primary user roles: **Patients**, **Doctors**, and **Admins**.

---

## 1. The Patient Journey

### 1.1 Onboarding & Profile Creation
When a patient signs up (either via Email or Google OAuth), the system automatically provisions a secure patient profile using a backend database trigger. 
- **First Login:** The patient is prompted with a "Complete Your Medical Profile" banner.
- **Medical Intake:** They enter their height, weight, blood type, and any chronic conditions. This is securely stored as a `[Medical Profile]` record.

### 1.2 AI Symptom Checker & Health Assistant
- **Symptom Checker:** Located on the dashboard, the patient selects a body part (e.g., Head, Chest) and chooses from localized symptoms. Google Gemini analyzes this and returns a triage result (Low, Medium, High, Emergency).
- **Handoff:** The AI seamlessly hands off the results to the floating chatbot. The patient can immediately ask, "What home remedies can I use for this?" without repeating their symptoms.

### 1.3 Finding Healthcare & Booking Consultations
- **Map View:** Powered by PostGIS, the patient can view a map of nearby PHCs, CHCs, and private clinics. They can drag the pin to their exact rural location to calculate distances.
- **Consultation Booking:** The patient navigates to the Consultation Portal. They can use the "Smart Fill" feature by selecting their occupation (e.g., Farmer), which auto-generates a medically relevant description of common occupational issues (like lower back pain or pesticide exposure). They then book a video, audio, or chat slot.

### 1.4 Medical Records & Offline Sync
- **Viewing Records:** Patients can view doctor-uploaded prescriptions, lab results, and vitals.
- **Adding Records:** Patients can manually upload past prescriptions (PDF/JPG) or log their own health metrics (like daily blood pressure).

---

## 2. The Doctor Journey

### 2.1 Dashboard & Appointments
- **Login:** Doctors log in and are routed to a specialized dashboard.
- **Review Requests:** They see incoming consultation requests. They can review the patient's self-reported symptoms and medical history *before* the call.

### 2.2 Teleconsultation
- **Jitsi Video Call:** At the scheduled time, both the doctor and patient click "Join Call" on their appointment card. A secure, unique Jitsi video room is generated instantly inside the browser. No external app installation is required.

### 2.3 Issuing Prescriptions
- **Medical Records Management:** Post-consultation, the doctor navigates to the patient's record tab and issues a Digital Prescription or Diagnosis. This is immediately visible to the patient.

---

## 3. The Admin Journey

### 3.1 System Oversight
- **All Patients & Records:** Admins have a god-eye view of all registered patients. They can view, edit, or delete any medical record across the system to maintain data integrity or handle compliance requests.
- **Role Management:** Admins can verify new doctor registrations and assign appropriate roles.

### 3.2 Campaigns & Health Camps
- **Camp Management:** Admins can create and schedule Health Camps (e.g., Polio Drops, TB Screening). These instantly populate on the public map and notify nearby users, increasing rural health participation.

---

## 4. Bilingual Support
At any point, any user can click the `A/अ` button in the top navigation bar. The entire interface, including the AI Chatbot's responses and the Symptom Checker, instantly translates between English and Hindi, ensuring accessibility for non-English speakers.

---

## 5. Security & Architecture
- **Row-Level Security (RLS):** Every database interaction is cryptographically verified by Supabase RLS. A patient cannot fetch another patient's records, even if they have the UUID.
- **PostGIS:** All spatial queries (finding the nearest hospital) are offloaded to the database using `ST_Distance` and `ST_DWithin`, ensuring lightning-fast performance even with thousands of rural clinics mapped.
