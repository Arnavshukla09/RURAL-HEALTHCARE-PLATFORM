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

### 2.5 `EmergencyModule.tsx`
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

### 3.1 `MapView.tsx`
- **Purpose:** National healthcare facility and doctor discovery portal indexed by Local Government Directory (LGD) and Indian Public Health Standards (IPHS). Features interactive Leaflet maps, driving routes via OSRM, Haversine proximity calculations, and searchable state/district selectors.
- **Props:**
  ```typescript
  {
    language: string;
    userLocation?: any;
    camps?: any[];
  }
  ```
- **State:** `selectedState` (LGD code), `selectedDistrict` (LGD code), `facilities` (Array), `loading` (boolean), `locating` (boolean), `filter` (Facility type), `radiusKm` (number), `searchQuery` (string), `routeData` (OSRM GeoJSON route).
- **Sub-Components:**
  - `SearchableDropdown`: Accessible popover with a top-pinned real-time search input for both English and Hindi queries, constrained to a strict 5-item visible viewport limit (`max-h-[175px] overflow-y-auto`) to avoid covering map controls. Includes click-outside and `Escape` key listeners.
- **Dependencies:** `react-leaflet`, `leaflet`, `lucide-react`, `lib/geo/pan-india-lgd.json`, `lib/geo/lgd-iphs.ts`. Calls `/api/facilities/district/[districtCode]` and `/api/facilities/nearby`.
- **Files Where Used:** `app/page.tsx`, `app/locations/page.tsx`

### 3.2 `JitsiMeeting.tsx`
- **Purpose:** Wraps the external Jitsi Meet API to embed video consultations.
- **Props:**
  ```typescript
  {
    roomName: string;
    displayName: string;
    onReadyToClose: () => void;
  }
  ```
- **State:** `loading` (boolean).
- **Dependencies:** Dynamic script injection of `https://8x8.vc/external_api.js`.
- **Styling:** Full viewport height container for the iframe.
- **Files Where Used:** `app/page.tsx`

### 3.3 `AppointmentManager.tsx`
- **Purpose:** Tabbed UI for users to book and view upcoming/past appointments, and launch the Jitsi room.
- **Props:**
  ```typescript
  {
    user: any;
    language: string;
    setCurrentPage: (page: string) => void;
    setJitsiRoom?: (room: string) => void;
  }
  ```
- **State:** `activeTab` (upcoming/past), `appointments` (Array), `showBooking` (boolean), `bookingForm` (Object).
- **Dependencies:** `lucide-react`, `shadcn/ui` (Tabs, Input, Select). Calls `/api/appointments`.
- **Files Where Used:** `app/page.tsx`

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
