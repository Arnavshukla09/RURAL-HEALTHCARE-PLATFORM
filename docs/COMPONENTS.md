# Component Reference: Rural Healthcare Platform

This document catalogs the domain-specific React components used throughout the application. Note that generic UI primitives (like `<Button>`, `<Input>`) are sourced from `shadcn/ui` and are located in `components/ui/`; they follow standard Radix UI documentation and are omitted here.

---

## 1. Core Layout & Navigation

### 1.1 `AccessibilityBar.tsx`
- **Purpose:** Provides global toggles for language (English/Hindi) and high-contrast mode for visually impaired users.
- **Props:**
  ```typescript
  {
    language: "en" | "hi";
    setLanguage: (lang: "en" | "hi") => void;
    highContrast: boolean;
    setHighContrast: (val: boolean) => void;
  }
  ```
- **State:** None (Pure component driven by props).
- **Dependencies:** `lucide-react` (icons).
- **Styling:** Tailwind sticky header with z-index.
- **Files Where Used:** `app/page.tsx`
- **Usage Example:**
  ```tsx
  <AccessibilityBar language={language} setLanguage={setLanguage} highContrast={false} setHighContrast={() => {}} />
  ```

### 1.2 `Dashboard.tsx`
- **Purpose:** The primary authenticated grid view showing quick actions, recent notifications, and dynamic widgets based on user role (Patient vs. Provider).
- **Props:**
  ```typescript
  {
    user: UserProfile | null;
    language: string;
    setCurrentPage: (page: string) => void;
  }
  ```
- **State:** `notifications` (Array), `userStats` (Object).
- **Dependencies:** `lucide-react`, `shadcn/ui` (Card, Button, Badge).
- **Styling:** CSS Grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- **Files Where Used:** `app/page.tsx`

---

## 2. Core Features

### 2.1 `Authentication.tsx`
- **Purpose:** Handles login, registration, password resets, and guest access routing.
- **Props:**
  ```typescript
  {
    language: string;
    setUser: (user: UserProfile) => void;
    setCurrentPage: (page: string) => void;
  }
  ```
- **State:** `isLogin` (boolean), `formData` (email, password, etc.), `isLoading` (boolean), `errors` (Array).
- **Dependencies:** `@supabase/ssr` (for `createClient()`).
- **Styling:** Flexbox centered card with a gradient background.
- **Files Where Used:** `app/page.tsx`

### 2.2 `SymptomChecker.tsx`
- **Purpose:** Multi-step wizard collecting symptoms and querying the Gemini AI triage API. Now features an embedded inline AI Chat interface for diagnosis follow-up.
- **Props:**
  ```typescript
  {
    language: string;
    setCurrentPage: (page: string) => void;
  }
  ```
- **State:** `step` (number), `selectedBodyPart` (string), `symptoms` (Array), `severity` (number), `duration` (string), `analysis` (Object), `loading` (boolean).
- **Dependencies:** `lucide-react`. Calls `/api/symptom-analyze`.
- **Styling:** Animated progress bars and responsive multi-column layouts.
- **Files Where Used:** `app/page.tsx`

### 2.3 `FloatingChat.tsx`
- **Purpose:** Persistent Gemini AI chatbot fixed to the bottom right of the screen.
- **Props:**
  ```typescript
  {
    language: string;
    setCurrentPage: (page: string) => void;
  }
  ```
- **State:** `isOpen` (boolean), `messages` (Array), `input` (string), `isLoading` (boolean), `isTyping` (boolean).
- **Dependencies:** Calls `/api/ai-chat` using Server-Sent Events (streaming).
- **Styling:** Fixed positioning (`bottom-4 right-4`), absolute max height with internal scroll.
- **Files Where Used:** `app/page.tsx` (rendered outside the main content conditional logic).

### 2.4 `HealthInfoHub.tsx`
- **Purpose:** A static medical encyclopedia allowing users to browse vaccines, first aid procedures, and disease awareness information. Accessible via the main navigation menu.
- **Props:**
  ```typescript
  {
    language: string;
    setCurrentPage?: (page: string) => void;
  }
  ```
- **State:** `activeTab` (string).
- **Dependencies:** `lucide-react`, `shadcn/ui`.
- **Styling:** Clean tabbed interface with collapsible accordions.
- **Files Where Used:** `app/page.tsx`

### 2.5 `GovernmentSchemes.tsx`
- **Purpose:** Comprehensive national and state government healthcare schemes directory across India. Features dual National vs. State scope switching, a searchable State selector popover, 12 demographic and disease differentiator filters (kids, maternal, 70+ elderly, paralysis/disability, cancer, rare diseases, dialysis, TB, mental health, universal BPL, emergency trauma), live multi-field keyword search, and 1-tap `tel:` calling and official web portal linking.
- **Props:**
  ```typescript
  {
    language: string;
  }
  ```
- **State:** `scopeMode` ("all" | "national" | "state"), `selectedStateCode` (string), `selectedCategory` (SchemeCategory), `searchQuery` (string).
- **Sub-Components:**
  - `SearchableStateSelect`: Accessible popover with a top-pinned search input for filtering states and Union Territories in English and Hindi.
- **Dependencies:** `lib/schemes/health-schemes.ts`, `lucide-react`, `shadcn/ui`.
- **Files Where Used:** `app/health-info/schemes/page.tsx`, `components/public-pages/SchemesClient.tsx`.

### 2.6 `EmergencyModule.tsx`
- **Purpose:** Primary emergency response hub partitioned into 3 streamlined severity modes (Critical Life Threat, Urgent Distress Dispatch, Urgent Care Navigation). Includes direct Paramedic ICE Medical Pass display, 1-tap bilingual voice vocalizers, camera LED strobe, ambulance siren audio synthesis, screen wake lock, integrated national/state helpline directory, and offline IndexedDB incident audio blackbox.
- **Props:**
  ```typescript
  {
    language: "en" | "hi";
    onNavigate?: (page: string) => void;
  }
  ```
- **State:** `alarmActive`, `torchActive`, `sirenActive`, `strobeActive`, `isRecording`, `audioRecordings`, `showDistressDialog`, `showParamedicModal`, `lastCoords`.
- **Dependencies:** `lib/emergency/hardware.ts`, `lib/emergency/audio-blackbox.ts`, `components/HelplineDirectory.tsx`, `lucide-react`, `shadcn/ui`.
- **Styling:** High-contrast mobile-optimized severity cards with emergency animations and fullscreen modal overlays.
- **Files Where Used:** `app/emergency/page.tsx`

### 2.6 `HelplineDirectory.tsx`
- **Purpose:** Interactive, location-aware national & state-wise emergency helpline directory. Provides toggleable State View (combining regional state helplines with common national numbers) and Whole All-India Directory view. Features GPS spatial auto-detection, category filtering, live keyword search, 1-tap `tel:` calling, and clipboard copy.
- **Props:**
  ```typescript
  {
    language: string;
    initialCoords?: { lat: number; lng: number };
  }
  ```
- **State:** `viewMode` ("state" | "all"), `selectedStateCode` (LGD state code), `selectedCategory` (HelplineCategory), `searchQuery` (string), `copiedId` (string | null), `isDetectingLocation` (boolean).
- **Dependencies:** `lib/emergency/helplines.ts`, `lib/geo/lgd-iphs.ts`, `lib/i18n/detect-language.ts`, `lucide-react`, `shadcn/ui`.
- **Files Where Used:** `components/EmergencyModule.tsx`

---

## 3. Telemedicine & Maps

### 3.1 `Directory.tsx`
- **Purpose:** NMC-verified doctor and specialist directory featuring a prominent pop-out Universal Search bar, collapsible location/proximity filter drawer, mutually-exclusive GPS Proximity vs State/District hierarchy modes, and client-side 10-per-page pagination.
- **Props:**
  ```typescript
  {
    language: string;
  }
  ```
- **State:** `searchQuery` (string), `selectedSpecialty` (string), `userCoords` ({ lat, lng } | null), `selectedRadius` (number), `selectedStateCode` (string), `selectedDistrictName` (string), `isFilterMenuOpen` (boolean), `currentPage` (number).
- **Sub-Components:**
  - `SearchableDropdown`: Accessible popover with a top-pinned search box for instant filtering of States and Districts in both English and Hindi, with active checkmarks and bounded scroll viewport (`max-h-[190px]`).
- **Key Mechanics:**
  - **Pop-Out Universal Search:** Ranks results via a multi-field weighted scoring algorithm (name +100, specialty +80, hospital +60, district +50, state/location +40, qualifications +30, bio +20).
  - **Mutual Exclusivity:** GPS mode and State/District mode cannot be active concurrently; selecting one disables and fades out the other with a clear switch action.
  - **Distance Guard:** Physical distance badges (`📍 X km away`) strictly render when physical GPS (`userCoords`) is active.
- **Dependencies:** `lucide-react`, `lib/data/real-doctors.ts`, `lib/geo/lgd-iphs.ts`, `lib/i18n/translations.ts`.
- **Files Where Used:** `app/directory/page.tsx`, `app/page.tsx`.

### 3.2 `MapView.tsx`
- **Purpose:** National healthcare facility and doctor discovery portal indexed by Local Government Directory (LGD) and Indian Public Health Standards (IPHS). Features interactive Leaflet maps, driving routes via OSRM, Haversine proximity calculations, 913 NMC-verified clinical practitioners, 10-per-page pagination, smart GPS vs District distance display, and searchable state/district selectors.
- **Props:**
  ```typescript
  {
    language: string;
    userLocation?: any;
    camps?: any[];
  }
  ```
- **State:** `selectedState` (LGD code), `selectedDistrict` (LGD code), `facilities` (Array), `doctorFacilities` (Array), `loading` (boolean), `locating` (boolean), `filter` (Facility type | "all" | "doctors"), `radiusKm` (number), `searchQuery` (string), `routeData` (OSRM GeoJSON route), `currentPage` (number).
- **Sub-Components:**
  - `SearchableDropdown`: Accessible popover with a top-pinned real-time search input for both English and Hindi queries, constrained to a strict 5-item visible viewport limit (`max-h-[175px] overflow-y-auto`) to avoid covering map controls. Includes click-outside and `Escape` key listeners.
- **Key Mechanics:**
  - **913 Verified Doctors Integration:** Seamlessly incorporates doctors from `lib/data/real-doctors.ts` matching active state, district, or GPS proximity radius.
  - **Smart Distance Guard:** Physical distances (e.g. `2.4 km away`) strictly render when physical GPS (`userCoords`) is active; in state/district browsing mode, cards cleanly render the district/city name without fabricating distances.
  - **10-per-Page Pagination:** Prevents DOM overload by paginating results cleanly in blocks of 10 with Previous and Next controls.
  - **Direct Actions:** Leaflet popup and cards offer 1-tap `tel:` calling, OSRM driving routes, and direct "Book Appointment" links to `/consultation`.
- **Dependencies:** `react-leaflet`, `leaflet`, `lucide-react`, `lib/geo/pan-india-lgd.json`, `lib/geo/lgd-iphs.ts`, `lib/data/real-doctors.ts`. Calls `/api/facilities/district/[districtCode]` and `/api/facilities/nearby`.
- **Files Where Used:** `app/page.tsx`, `app/locations/page.tsx`

### 3.3 `ConsultationPortal.tsx`
- **Purpose:** Comprehensive appointment booking and teleconsultation portal powered by 913 authentic NMC/State Medical Council-registered doctors across India. Features real-time multi-field search, specialty chips, state filtering, 10-per-page pagination, 7-day dynamic slot generator, direct patient booking, teleconsultation room provisioning, 4-way doctor invitation dispatch (WhatsApp, SMS, phone OPD call, copy link), and automatic notification dispatch.
- **Props:**
  ```typescript
  {
    language: string;
    user?: UserProfile | null;
    symptomResult?: SymptomResult | null;
  }
  ```
- **State:** `consultType` ("video" | "audio" | "chat"), `selectedDoctor` (RealDoctor | null), `selectedDate` (string), `selectedSlot` (string), `patientName` (string), `patientPhone` (string), `notes` (string), `doctorSearch` (string), `specialtyFilter` (string), `stateFilter` (string), `currentPage` (number), `successData` (Object | null), `copied` (boolean).
- **Key Mechanics:**
  - **913 Doctors Catalog:** Full pan-India practitioner roster from AIIMS, PGI, GMCs, and District Hospitals.
  - **Dynamic Slot Generator:** Computes morning, afternoon, and evening slots for the next 7 days using deterministic doctor schedule seeding (Sundays closed).
  - **4-Way Doctor Invitation Suite:** WhatsApp 1-tap dispatch with pre-filled consultation details, cellular SMS dispatch for zero-data/feature phones, hospital OPD desk phone dialer (`tel:`), and 1-click link copy.
  - **Direct Room Launch:** Patients transition directly into the `/teleconsult/room` upon booking confirmation.
  - **Notification Dispatch:** Automatically dispatches notifications to both patient and doctor roles via `lib/notifications/notification-engine.ts` with audio chime upon booking confirmation.
- **Dependencies:** `lib/data/real-doctors.ts`, `lib/geo/lgd-iphs.ts`, `lib/notifications/notification-engine.ts`, `lucide-react`, `shadcn/ui`.
- **Files Where Used:** `app/consultation/page.tsx`, `app/page.tsx`.

### 3.4 `teleconsult/room/page.tsx` (Passwordless Guest Teleconsultation Room)
- **Purpose:** Standalone, frictionless WebRTC consultation room powered by `JitsiMeeting`. Does NOT require a Supabase account or password, allowing external NMC-registered clinicians (or guest patients) to join the video consultation via 1-tap WhatsApp or SMS invitation links.
- **Query Parameters:** `id` (room ID), `name` (participant display name), `role` ("doctor" | "patient"), `lang` ("en" | "hi").
- **Features:**
  - **2G Ultra Low-Bandwidth Mode:** Auto-detects 2G cellular connections and provides a 1-tap toolbar toggle to drop video feeds to 0 kbps and run low-bitrate Opus audio (16-24 kbps), saving 95% bandwidth for poor rural signals.
  - **Consultation Record & e-Prescription Auto-Export:** Pre-populates doctor credentials, NMC reg number, diagnosis, Rx medications, advice, and follow-up. 1-click saves directly to `/api/medical-records` and local prescription storage, and 1-click prints an official medical prescription PDF.
  - **Room Utilities:** Participant role badges, encrypted WebRTC badge, direct WhatsApp invitation button, 1-click link copy, and safe exit confirmation modal routing to `/appointments`.
- **Dependencies:** `components/JitsiMeeting.tsx`, `lucide-react`, `shadcn/ui`.
- **Route:** `/teleconsult/room`.

### 3.5 `teleconsult/confirm/page.tsx` (Doctor OPD Confirmation & Availability Portal)
- **Purpose:** Dedicated, public clinician confirmation portal opened by doctors clicking the WhatsApp/SMS appointment link.
- **Query Parameters:** `id` (room ID), `action` ("accept" | "reschedule" | "view"), `doc` (doctor name), `patient` (patient name), `date` (appointment date), `time` (slot), `fee` (consultation fee), `mode` (consultation mode).
- **Features:**
  - **1-Tap Accept:** Confirms booking and instantly triggers notification chime to the patient.
  - **Propose Another Time (Reschedule):** Lets the doctor pick an alternative slot and send a custom note to the patient.
  - **Decline / Refer:** Allows declining with emergency referral advice.
- **Dependencies:** `lib/notifications/notification-engine.ts`, `lucide-react`, `shadcn/ui`.
- **Route:** `/teleconsult/confirm`.

### 3.6 `doctor/claim/page.tsx` (Doctor Profile Onboarding & Verification)
- **Purpose:** Onboarding workflow enabling external medical specialists in `lib/data/real-doctors.ts` to claim their profile, link their NMC registration number to an authenticated Supabase account, and configure their direct UPI ID for patient payments.
- **Features:** Live search across 913 NMC-verified practitioners, profile verification form, custom UPI VPA setup (0% platform deduction), and 1-click role elevation to `doctor` with redirection to `DoctorDashboard`.
- **Dependencies:** `lib/data/real-doctors.ts`, `lib/supabase/client`, `lucide-react`, `shadcn/ui`.
- **Route:** `/doctor/claim`.

### 3.7 `NotificationBell.tsx`
- **Purpose:** Central notification center for Patients, Doctors, Admins, and Guests. Connects to backend `/api/notifications`, syncs with local storage for guest/offline sessions, subscribes to cross-tab window events (`ruralhealth:notification`), filters by categories (All, Appointments, Alerts), and routes directly to action URLs on click.
- **Props:**
  ```typescript
  {
    user: any;
    language: string;
  }
  ```
- **State:** `open` (boolean), `notifications` (AppNotification[]), `activeTab` ("all" | "appointments" | "alerts"), `unreadCount` (number), `nextCursor` (string | null).
- **Dependencies:** `lib/notifications/notification-engine.ts`, `lucide-react`.
- **Files Where Used:** `components/Header.tsx`.

### 3.8 `AppointmentManager.tsx`
- **Purpose:** Tabbed UI for users to manage upcoming and past appointments, cancel bookings with automatic notifications, and launch embedded Jitsi teleconsultation rooms.
- **Props:**
  ```typescript
  {
    user: any;
    language: string;
    setJitsiRoom?: (room: string | null) => void;
  }
  ```
- **State:** `activeTab` ("upcoming" | "past"), `appointments` (Array), `showBooking` (boolean), `bookingForm` (Object).
- **Dependencies:** `lib/notifications/notification-engine.ts`, `lucide-react`, `shadcn/ui`. Calls `/api/appointments`.
- **Files Where Used:** `app/page.tsx`, `app/appointments/page.tsx`.

---

## 4. Utilities & Miscellaneous

### 4.1 `ImageWithFallback.tsx`
- **Purpose:** Wraps `next/image` to gracefully handle broken URLs (commonly from missing Supabase Storage images).
- **Props:**
  ```typescript
  {
    src: string;
    alt: string;
    fallbackSrc?: string;
    [key: string]: any; // standard Next/Image props
  }
  ```
- **State:** `error` (boolean).
- **Dependencies:** `next/image`.
- **Files Where Used:** Widely used in `Dashboard.tsx`, `Directory.tsx`, `PatientRecords.tsx`.

### 4.2 `Footer.tsx`
- **Purpose:** Standard footer containing SOS links, social navigation, and newsletter subscriptions.
- **Props:**
  ```typescript
  {
    setCurrentPage: (page: string) => void;
    language: string;
  }
  ```
- **State:** `expandedSection` (string | null), `email` (string), `subscribed` (boolean).
- **Dependencies:** `lucide-react`.
- **Styling:** Dark theme (`bg-gray-900 text-white`). Includes an emergency red strip (`bg-red-600`).
- **Files Where Used:** `app/page.tsx`
