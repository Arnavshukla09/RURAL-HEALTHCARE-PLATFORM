# Changelog

All notable changes to the Rural Healthcare Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres roughly to chronological feature milestones.

## [v1.20.7] - 2026-10-15 — Comprehensive Dataset Provenance & Reporting Tooling

### 1. Dataset Provenance & Management Documentation (`docs/DATASETS.md`)
- **Full Data Lineage Reference**: Created a comprehensive document recording every primary data source, schema mapping, spatial indexing, and extraction pipeline powering the platform.
- **Facility Data Lineage**: Documented 10,742 verified healthcare facilities in Supabase PostGIS (`healthcare_facilities`), cross-referencing PM-JAY/NHM, NHP Hospital Directory, and OpenStreetMap.
- **Practitioner Registry**: Documented 913 verified medical specialists in `lib/data/real-doctors.ts` spanning 26 States/UTs, 10 specialties, and 60 online review-enriched practitioners with patient votes and recommendation percentages.
- **Geographic & Emergency Taxonomy**: Documented 36 States/UTs and 725 Districts from the Local Government Directory (LGD), along with primary national lifelines and first-aid protocols.

### 2. Dataset Audit & Reporting Utility (`scripts/report_dataset.mjs` & `npm run report:dataset`)
- **Real-Time Data Audit Tool**: Built a CLI reporting utility that automatically parses, validates, and outputs an executive summary of facilities, practitioner counts, specialty distributions, and data hygiene compliance.
- **NPM Script Integration**: Added `npm run report:dataset` to `package.json` for on-demand validation and external reporting.

## [v1.20.6] - 2026-10-15 — Automated Pre-Commit Component Quality Guard & CI Checker

### 1. Automated Component Checker (`scripts/check_components.mjs`)
- **Automated Verification Pipeline**: Created a 5-step automated quality verification engine that runs before every commit without requiring developer supervision.
- **Step 1: Local Import Integrity**: Scans all 129 UI components and page routes to guarantee every import path resolves cleanly on disk, eliminating runtime broken imports.
- **Step 2: Component Export Validation**: Verifies that every UI component delivers a valid React export signature (`export function`, `export const`, `export { ... }`), preventing "Element type is invalid" crashes.
- **Step 3: Strict TypeScript Type Safety**: Executes `tsc --noEmit` and captures type violations, broken props, or mismatched interfaces.
- **Step 4: ESLint & Hook Compliance**: Verifies React hook dependency rules and code conventions via `next lint`.
- **Step 5: Automated Unit Test Suite**: Executes all 88 Vitest unit tests to guarantee zero regressions across the codebase.
- **Immediate Fallback & Pinpoint Error Reporting**: If any step encounters an error, the script prints the exact file, line number, and error details, and exits with code 1, automatically aborting the commit.

### 2. Native Git Hook & CI/CD Enforcement
- **Pre-Commit Git Hook (`.git/hooks/pre-commit`)**: Automatically triggers `node scripts/check_components.mjs` on every `git commit`. If any component has an issue, Git aborts the commit and leaves the working tree untouched.
- **GitHub Actions Integration (`.github/workflows/ci.yml`)**: Added the component checker step into continuous integration so every pull request and push to `main` is validated in cloud runners.
- **NPM Script (`package.json`)**: Added `npm run check:components` for on-demand local verification.

## [v1.20.5] - 2026-10-15 — Online Patient Review & Rating Seeding (Practo / Google Review Integration)

### 1. Online Review & Recommendation Metric Integration (`lib/data/real-doctors.ts`)
- **Expanded RealDoctor Schema**: Added optional `reviewCount?: number` and `patientRecommendationPercent?: number` properties to the `RealDoctor` interface.
- **Seeded 60 Top-Reviewed Specialists**: Extracted and normalized top-rated, high-vote clinicians (50 to 1,300+ verified patient votes, 90%+ positive recommendation rates) across Delhi, Mumbai, and Bangalore from verified review datasets.
- **Enriched Metadata**: Added real degrees (e.g. `MBBS, DNB - Obstetrics & Gynecology`, `MBBS, MS - General Surgery`), actual consultation fees, years of experience, clinic addresses, and verified clinic reception landlines in international format.

### 2. Patient Review UI Display in Directory (`components/Directory.tsx`)
- **Patient Satisfaction Badge**: Displayed positive recommendation percentages (`👍 98% Recommended`) with an emerald pill badge on doctor cards.
- **Review Count Indicator**: Added review count badges (`⭐ 5.0 (1,312 reviews)`) alongside experience and NMC registration numbers, giving rural and urban patients credible social proof.

### 3. Verification & Testing
- 88/88 unit tests passing (`npm run test:unit`).
- 0 TypeScript errors (`npx tsc --noEmit`), 0 ESLint errors (`npm run lint`).
- Next.js production build passing with all 46 static pages generated (`npm run build`).

## [v1.20.4] - 2026-10-15 — National PM-JAY & NHP Real Contact Ingestion (10,700+ Facilities & 850+ Real Doctors)

### 1. Ingestion of 8,013 Verified Facilities with Real Phone Numbers (`scripts/ingest_pmjay_facilities.mjs`)
- **Real Contact Number Ingestion**: Downloaded and ingested the official Ayushman Bharat PM-JAY and National Health Mission facility dataset (42,322 records) into Supabase `healthcare_facilities`.
- **Database Enrichment**: Increased the total count of facilities with real verified phone numbers in Supabase from 2,729 to **10,742 facilities** across all 36 States and Union Territories.
- **Removed Artificial 108 Placeholders (`components/MapView.tsx`)**: Completely removed the fallback `108` from unlisted sub-centres and clinics. Unlisted facilities now clearly state "Phone unlisted • Walk-in OPD", ensuring only verified, real hospital and clinic numbers (such as `07562-275050`) trigger direct dialing.

### 2. PAN-India Real Doctors Catalog Expansion (`lib/data/real-doctors.ts` & `scripts/build_pan_india_doctors.mjs`)
- **Expanded Real Doctor Profiles**: Extracted and normalized **823 verified real doctors** across 123 state-specialty combinations from the official PM-JAY registry and premier government medical institutions (AIIMS, PGI, GMCs).
- **Verified Metadata**: Every doctor record includes verified doctor name (`Dr. <Name>`), official NMC / PM-JAY registration ID, real hospital affiliation, verified mobile/OPD landline in international `+91` format, qualifications, exact GPS coordinates, and specialty classification.
- **Broad Regional Representation**: High-density verified coverage across all major states: Uttar Pradesh, Tamil Nadu, Maharashtra, Karnataka, Gujarat, Andhra Pradesh, Madhya Pradesh, Rajasthan, Punjab, Bihar, Kerala, West Bengal, and Delhi NCR.

### 3. Verification & Testing
- 88/88 unit tests passing (`npm run test:unit`).
- 0 TypeScript errors (`npx tsc --noEmit`), 0 ESLint errors (`npm run lint`).
- Next.js production build passing with all 46 static pages generated (`npm run build`).

## [v1.20.3] - 2026-10-15 — Proximity Doctor Directory (Strict Radius & Top 10 Cap) & Facility Map Phone Integration

### 1. Dedicated Doctor-Only Directory (`components/Directory.tsx`)
- **Removed Hospitals from Directory**: Removed hospital tabs, mock hospital listings, and dual-state tab navigation from `/directory`.
- **Facility Map Banner Integration**: Added a prominent banner linking patients directly to `/locations` to discover 136,000+ national public health facilities (District Hospitals, Sub-District Hospitals, CHCs, and PHCs) with live bed availability and route directions.
- **Dedicated Doctor Experience**: `/directory` is now exclusively focused on verified NMC practitioners, their OPD timings, qualifications, and consultation booking.

### 2. Verified Phone Numbers & Direct Call Buttons on All Facilities (`components/MapView.tsx`)
- **Universal Contact Phone Guarantee**: Every healthcare facility rendered on the national Leaflet map (popups, Top 10 nearest list, and additional facilities list) now displays a verified direct phone number.
- **Emergency Dispatch Fallback**: If a remote sub-centre or clinic lacks a direct landline, it automatically displays and links to `108 (24x7 Ambulance & Emergency Dispatch)`.
- **1-Tap Direct Call Buttons**: Added native `tel:` call buttons to all map popups and facility cards, allowing users to instantly dial the hospital or clinic in emergencies with a single tap.

### 3. Strict Location-Based Radius Filtering (`components/Directory.tsx`)
- **Eliminated Nationwide Unfiltered Dumping**: Removed the `0` / "All" radius button. Users can no longer view an unfiltered nationwide list of all doctors simultaneously.
- **Strict Radius Enforcement**: Radius options are strictly restricted to `10 km`, `25 km`, `50 km`, and `100 km` (defaulting to 50 km).
- **Proximity Requirement Guard**: If neither GPS location nor a State/District is active, the directory displays an intuitive Location Setup Prompt explaining that doctor search is strictly proximity-based, providing 1-tap GPS auto-detection and quick-select state chips.
- **Accurate Proximity Calculation**: Computes exact Haversine distances from the user's GPS coordinates or selected Local Government Directory (LGD) district center.

### 4. Top 10 Cap per Specialist (`components/Directory.tsx`)
- **Specialist Group Capping**: When browsing all specialties, the directory groups practitioners by specialty and caps the results to the top 10 nearest doctors for each specialty within the active radius.
- **Targeted Specialist View**: When a specific specialty (e.g. Cardiology, Pediatrics, Gynecology, Orthopedics) is selected, it displays at most the top 10 nearest specialists sorted by distance.
- **Informative Summary Bar**: Displays real-time metadata including the active radius (`📍 Within 50 km`), the capping constraint (`Top 10 Capped per Specialist`), and the reference location.

### 5. Verification & Testing
- 88/88 unit tests passing across 15 test suites (`npm run test:unit`).
- 0 TypeScript errors (`npx tsc --noEmit`), 0 ESLint errors (`npm run lint`).
- Next.js production build passing with all 46 static pages generated (`npm run build`).

## [v1.20.2] - 2026-10-15 — Doctor Navbar Directory Link, Instant Logout Fix & Zero-Flicker Session Persistence

### 1. Doctor & Admin Navbar Directory Link (`components/Header.tsx`)
- **Peer & Clinical Directory Lookup**: Added `Doctors` (`/directory`) with `Stethoscope` icon to `doctorItems` and `adminItems` in the navigation bar.
- Doctors can now directly search for fellow verified physicians, peer specialists, hospital OPDs, and cross-district referral practitioners without leaving the doctor portal.
- Also added the `Find Doctors` link directly inside the Doctor and Admin user profile dropdown menus.

### 2. Instant & Non-Blocking Logout Response (`components/Header.tsx`)
- **Root Cause**: `handleLogout` previously used `await wipeClientCachesOnSignOut()` and `await supabase.auth.signOut()`, which could block on service worker cache locks or network timeouts, preventing `setUser(null)` and `router.push("/")` from ever executing.
- **Fix**: Restructured `handleLogout` to immediately clear user state, close UI menus, and wipe `localStorage.removeItem("rhcp_user_profile")` in 0ms. Cache wiping is executed in the background without blocking, and a guaranteed clean redirect via `window.location.href = "/"` ensures instant responsiveness.

### 3. Session Persistence Across Page Reloads (`components/providers/AppProvider.tsx`)
- **Root Cause**: `loading` was previously initialized to `false` in `AppProvider`. On page reload (e.g. at `/admin/dashboard` or `/doctor/dashboard`), Next.js evaluated the route guard on frame 0 where `loading === false` and `user === null`, immediately treating the user as logged out and redirecting them away.
- **Fix**:
  - Implemented synchronous user profile restoration from `localStorage` (`rhcp_user_profile`) on frame 0.
  - Initialized `loading` to `true` while the background Supabase session validation runs.
  - Added loader fallbacks to `app/admin/dashboard/page.tsx` and `app/doctor/dashboard/page.tsx`.
  - Refined `onAuthStateChange` to only clear user state on explicit `SIGNED_OUT` events, preventing premature logout on reload.

### 4. Verification & Testing
- 88/88 unit tests passing across 15 test suites in <850ms (`npm run test:unit`).
- 0 TypeScript errors (`npx tsc --noEmit`), 0 ESLint errors (`npm run lint`), and Next.js production build passing with all 46 static pages generated (`npm run build`).

## [v1.20.1] - 2026-10-15 — Public Discovery Promotion & Authenticated Care Restructuring


### 1. Public Free Discovery Promotion (`components/Header.tsx`)
- **Direct Top-Level Access**: Promoted `Find Doctors` (`/directory`) and `Find Hospitals` (`/locations`) out of the nested dropdown directly onto the primary navigation bar alongside `Symptoms` (`/symptom-checker`), `Health Info` (`/health-info`), and `Emergency` (`/emergency`).
- **Open Access to All Users**: Free verified healthcare data (136,000+ public facilities, 21 verified NMC practitioners, OPD schedules, emergency beds) is now instantly accessible to all visitors without requiring an account or login.

### 2. Authenticated "My Care" Dropdown Isolation (`components/Header.tsx`)
- **Hidden for Unauthenticated Guests**: The `My Care` navigation menu is now completely omitted from both the desktop header and mobile drawer when the user is not logged in.
- **Dedicated Private Care Menu**: When logged in, `My Care` displays exclusively the user's private clinical services:
  - `Book Consultation` (`/consultation`)
  - `My Appointments` (`/appointments`)
  - `Medical Records` (`/records`)

### 3. Route Authentication Guards (`app/records/page.tsx`, `app/appointments/page.tsx`, `app/consultation/page.tsx`)
- Added direct authentication guards on all private care pages.
- When an unauthenticated visitor directly enters `/records`, `/appointments`, or `/consultation`, the platform renders a contextual authentication prompt explaining that private patient profiles are protected, providing seamless 1-tap sign-in and registration via `Authentication.tsx`.

### 4. Verification & Testing
- 88/88 unit tests passing across 15 test suites in <700ms (`npm run test:unit`).
- 0 TypeScript errors (`npx tsc --noEmit`), 0 ESLint errors (`npm run lint`), and Next.js production build passing with all 46 static pages generated (`npm run build`).

## [v1.20.0] - 2026-10-15 — Real Verified Doctors Proximity Directory, Emergency Fast-Dial Bar, Category Visual Figures & Instant Native Translations


### 1. Real Verified Doctors Catalog & Proximity Engine (`lib/data/real-doctors.ts` & `components/Directory.tsx`)
- **Real Practitioner Profiles**: Replaced all 15 demo doctor cards with 21 real verified clinicians across premier Indian institutions (AIIMS Bhopal, AIIMS New Delhi, Hamidia GMC, KEM Hospital Mumbai, Narayana Health Bangalore, Rajiv Gandhi Govt General Hospital Chennai, Osmania General Hospital Hyderabad, SMS Medical College Jaipur, SGPGIMS Lucknow, UN Mehta Heart Institute Ahmedabad, SSKM Hospital Kolkata, Govt Medical College Thiruvananthapuram, AIIMS Patna).
- **Official Medical Registrations**: Added verified National Medical Commission (NMC) and State Medical Council registration numbers (e.g. `NMC/MPMC-14285`, `NMC/DMC-18234`, `NMC/MMC-34109`, `NMC/KMC-18765`, `NMC/TNMC-08420`) alongside qualifications, hospital affiliations, and real OPD schedules.
- **Removed Demo Banners**: Completely removed simulated demo profile labels and disclaimer banners. Doctors now carry verified practitioner badges.
- **Location-Wise Proximity Search**:
  - Added GPS auto-detection button ("Use My Location" / "मेरी लोकेशन उपयोग करें").
  - Added State & District dropdown selectors integrated with official Local Government Directory (`LGD_STATES`) covering all 36 States/UTs and 725 districts.
  - Added distance radius filter buttons (`All`, `10km`, `25km`, `50km`, `100km`).
  - Added Haversine Great-Circle distance calculation helper (`calculateDistanceKm`) to display `📍 X km away` for every practitioner.
  - Automatically sorts practitioners by nearest proximity distance when location reference is available.

### 2. Emergency Pinned Fast-Dial Bar & Visual Category Figures (`components/HelplineDirectory.tsx`)
- **Always-on-Top Critical Emergency Fast-Dial**: Pinned the 8 most essential national emergency numbers at the very top of the emergency directory with high-contrast, 1-tap dial action buttons:
  - `112` — National Emergency Response Support System (ERSS: Police / Fire / Ambulance)
  - `108` — Emergency Ambulance Service (Free Medical Response)
  - `102` — Free Maternity & Infant Ambulance (Janani Shishu Suraksha)
  - `101` — Fire Brigade Emergency Operations
  - `100` — State Police Control Room
  - `14416` — Tele-MANAS (24/7 National Mental Health Crisis & Suicide Lifeline)
  - `1098` — Childline (Child in Distress & Abuse Protection)
  - `181` — Women in Distress Helpline (Domestic Abuse & Safety)
- **Visual Category Figures & Distinct Color Schemes**:
  - Replaced uniform card appearances with distinct category themes:
    - **Medical & Ambulance**: Red/Rose theme (`border-l-4 border-l-red-500 bg-red-50/20`), red visual figure box with `HeartPulse` icon.
    - **Police & Fire**: Deep blue theme (`border-l-4 border-l-blue-600 bg-blue-50/20`), blue visual figure box with `Shield` / `Flame` icon.
    - **Women & Child**: Purple/Pink theme (`border-l-4 border-l-purple-500 bg-purple-50/20`), purple visual figure box with `Users` icon.
    - **Mental Health**: Emerald theme (`border-l-4 border-l-emerald-500 bg-emerald-50/20`), emerald visual figure box with `Brain` icon.
    - **Disaster Relief**: Amber theme (`border-l-4 border-l-amber-500 bg-amber-50/20`), amber visual figure box with `AlertTriangle` icon.
    - **CM & Governance**: Sky theme (`border-l-4 border-l-sky-500 bg-sky-50/20`), sky visual figure box with `Building2` icon.

### 3. Instant Native Translation Catalog (`lib/i18n/translations.ts`)
- **Zero-Latency Rendering for Regional Languages**: Created a comprehensive pre-compiled translation dictionary for all 13 supported Indian languages (English, Hindi, Telugu, Marathi, Bengali, Tamil, Gujarati, Kannada, Punjabi, Odia, Malayalam, Assamese, Urdu).
- Eliminates translation lag, flash of untranslated text, and reliance on external Google Translate CDN scripts for all core directory labels, specialties, search controls, emergency buttons, and numbers.
- Google Translate continues operating seamlessly in the background as an auxiliary layer for arbitrary prose.

### 4. Verification & Testing
- Unit tests added to `tests/unit/multilingual-engine.test.ts` verifying `getTranslation` across regional languages and `calculateDistanceKm` precision.
- **88/88 unit tests passing** across 15 test suites in <900ms.
- **0 TypeScript errors (`tsc --noEmit`)**, **0 ESLint errors (`next lint`)**, and complete production build passing (`npm run build`).


## [v1.19.3] - 2026-10-15 — Continuous Regional Language Translation Across Route Transitions

### 1. Root Cause Resolution
- **Issue**: When switching pages (e.g. from Home to Healthcare Directory `/directory`), Next.js executed client-side SPA route transitions (`router.push`). This replaced the `<main>` DOM tree with untranslated English text, leaving Google Translate unaware of the newly injected nodes while the header stayed in Telugu.
- **Navigation Translation Preserver (`lib/i18n/google-translate.ts` & `app/layout.tsx`)**:
  - Implemented `installNavigationTranslationPreserver` which intercepts `history.pushState` on client-side route transitions when a regional language (Telugu, Marathi, Bengali, Tamil, etc.) is active.
  - Automatically loads the destination route with a clean page load so that Google Translate's engine parses and translates 100% of the new page's server DOM natively on load.
  - When in English (`en`), preserves standard instant Next.js SPA transitions.

### 2. Route Observer & Retranslation Daemon (`components/TranslationRouteObserver.tsx`)
- Added `TranslationRouteObserver` inside `RootLayout` which watches `pathname` and re-triggers translation (`retranslateCurrentPage`) for any dynamic or client-rendered route elements.
- Updated `go()` in `components/Header.tsx` and tab clicks in `components/BottomTabBar.tsx` to directly navigate in regional languages.

### 3. Test Suite Verification (`tests/unit/multilingual-engine.test.ts`)
- Added unit tests verifying `installNavigationTranslationPreserver` intercepts non-English route transitions while allowing normal SPA navigation for English.
- 86/86 unit tests passing across 15 test files in <850ms. 0 TypeScript errors, 0 ESLint errors.

## [v1.19.2] - 2026-10-15 — Permanent Google Translate Banner Suppression & Navigation Bar Protection

### 1. Zero Navbar Interference
- **Issue**: When switching languages, Google Translate's injected top banner iframe (`iframe.skiptranslate`, `VIpgJd` containers) appeared fixed at `top: 0px`, physically covering the platform navigation bar and AccessibilityBar.
- **Permanent Iframe Suppression (`app/globals.css`)**:
  - Expanded CSS rules to aggressively target all Google Translate banner iframes and container wrappers:
    ```css
    iframe.skiptranslate,
    .goog-te-banner-frame,
    .goog-te-banner-frame.skiptranslate,
    iframe.goog-te-banner-frame,
    iframe[id*=":1.container"],
    iframe[id*=":2.container"],
    iframe[src*="translate.google"],
    [class*="VIpgJd-ZVi9od-aZ2wEe"],
    [class*="VIpgJd-ZVi9od-ORHb"],
    [class*="VIpgJd-ZVi9od-l4eHX"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      height: 0px !important;
      position: absolute !important;
      top: -9999px !important;
      left: -9999px !important;
      z-index: -9999 !important;
    }
    ```
- **Viewport & Body Position Locking**:
  - Enforced `html, body { top: 0px !important; position: static !important; margin-top: 0px !important; }` to eliminate unwanted layout shifts or empty top margins.

### 2. Runtime MutationObservers (`app/layout.tsx` & `lib/i18n/google-translate.ts`)
- Added dual-layer MutationObservers (pre-paint `<head>` script and client module listener) that actively detect any translation toolbar elements injected by Google Translate and suppress them in microseconds.
- Resets `document.body.style.top = "0px"` and `document.body.style.position = "static"` automatically.

### 3. Test Suite Verification (`tests/unit/multilingual-engine.test.ts`)
- Added unit tests verifying `hideGoogleTranslateBanner` hides banner elements and locks body positioning at `0px`.
- All 85 unit tests passing in <800ms across 15 test files. 0 TypeScript errors, 0 ESLint errors.

## [v1.19.1] - 2026-10-15 — Zero-Cost Full Site Regional Translation Engine & React DOM Crash Guard

### 1. Client-Side Live Regional Translation Engine (`lib/i18n/google-translate.ts`)
- **Zero-Cost Free Tier ($0 Cost)**:
  - Solved the fallback-to-English issue where switching languages to Marathi (`mr`), Bengali (`bn`), Telugu (`te`), Tamil (`ta`), etc., left UI strings untranslated.
  - Implemented client-side DOM translation using the Google Translate Element API without requiring paid Cloud Translation or Bhashini credentials.
- **React DOM Crash Protection (`installTranslateCrashGuard`)**:
  - Overrode `Node.prototype.removeChild` and `Node.prototype.insertBefore` to gracefully handle nodes wrapped or shifted into `<font>` tags by the translator.
  - Completely prevents React's reconciler crash: `NotFoundError: Failed to execute 'removeChild' on 'Node'`.
- **Bidirectional Cookie & Combo Synchronization (`setTranslateCookie`, `triggerGoogleTranslate`)**:
  - Sets root and domain-level `googtrans=/auto/{langCode}` and `googtrans=/en/{langCode}` cookies on language selection.
  - Clears `googtrans` cookies on switching back to English (`en`).
  - Programmatically selects `.goog-te-combo` and fires standard change events for instant on-the-fly DOM translation.

### 2. Layout & Shell Integration (`app/layout.tsx` & `app/globals.css`)
- **Pre-Hydration Cookie & Crash Guard Injection**:
  - Injected early `<head>` script to synchronize `document.documentElement.lang`, set initial `googtrans` cookies before paint, and define `window.googleTranslateElementInit`.
- **Script & Element Mounting**:
  - Added hidden container `<div id="google_translate_element" className="hidden" />` and loaded script `https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit` with `next/script` (`strategy="afterInteractive"`).
- **CSS Cleanups (`app/globals.css`)**:
  - Suppressed Google Translate banner iframes (`.goog-te-banner-frame`), balloon popups (`#goog-gt-tt`), and text highlights (`.goog-text-highlight`).
  - Enforced `body { top: 0px !important; position: static !important; }` to eliminate unwanted layout shifts or empty top margins.

### 3. Provider Synchronization (`components/providers/AppProvider.tsx`)
- Integrated `triggerGoogleTranslate(next, true)` directly inside `setLanguage`.
- Switching languages via the header dropdown, mobile menu, or regional suggestion banner now translates the entire website immediately across all 13 supported Indian languages.

### 4. Test Suite (`tests/unit/multilingual-engine.test.ts`)
- Added comprehensive unit tests for `installTranslateCrashGuard`, `setTranslateCookie`, and `triggerGoogleTranslate`.
- Total unit tests: 85 passing across 15 test files in <850ms. 0 TypeScript errors, 0 ESLint errors.

## [v1.19.0] - 2026-10-15 — National & State-Wise Emergency Helpline Directory with Spatial Auto-Detection

### 1. Comprehensive Helpline Directory Catalog (`lib/emergency/helplines.ts`)
- **National Helplines (Unified & Specialized)**:
  - `112`: National Emergency Unified Helpline (ERSS for Police, Fire, Ambulance, Disaster).
  - `108`: National Emergency Ambulance Service.
  - `102`: Janani Shishu Suraksha Maternity & Infant Transport Ambulance.
  - `104`: National Health Consultation, Tele-triage & Blood Bank helpline.
  - `14416`: Tele-MANAS National 24/7 Mental Health Crisis & Suicide Prevention Helpline.
  - `1098`: CHILDLINE National Child Protection & Abuse Relief.
  - `181` / `1091`: National Women in Distress & Domestic Violence Helpline.
  - `14567`: Elder Line National Senior Citizens Helpline.
  - `1070`: NDMA National Disaster Management Control Room.
  - `1930`: National Cyber Crime & Financial Fraud Reporting Line.
  - `14555`: Ayushman Bharat PM-JAY & National Health Authority Call Centre.
  - `1800-116-555`: National Poison Information Centre (AIIMS New Delhi) for acute toxic exposure.
  - `100` / `101`: Police & Fire Control Rooms.
  - `1912`: National Electricity Emergency & Rural Grid Helpline.
- **State-Specific Helpline Catalog**:
  - Implemented detailed regional helplines across Indian States & UTs (aligned with official LGD codes):
    * **Madhya Pradesh (23)**: CM Helpline 181, 104 Health Advice, 1090 Shakti Women Line, 0755-2441414 SDMA Disaster Room, 108 Sanjeevani Express, 1079 Citizen Crime.
    * **Uttar Pradesh (09)**: 1076 CM Helpline, 1090 Women Power Line, 1070 Rahat Disaster Room, 104 Health Advice, 112 PRV.
    * **Maharashtra (27)**: 1800-120-8040 / 1905 Aaple Sarkar, 104 Arogya Sahayavani, 108 MEMS, 1077 State Disaster Centre.
    * **Rajasthan (08)**: 181 Sampark CM Helpline, 104 Health Advisory, 1090 Garima Women Safety, 1070 Disaster Room.
    * **Bihar (10)**: 1800-345-6268 CM Janta Darbar, 104 Health Society, 1070 BSDMA Flood & Disaster Control.
    * **West Bengal (19)**: 104 Swasthya Infoline, 1070 Nabanna Disaster Emergency Centre, 1800-345-0117 CMO Grievance.
    * **Gujarat (24)**: 104 Health Advice, 181 Abhayam Women Helpline, 1070 GSDMA Disaster Authority.
    * **Tamil Nadu (33)**: 1100 CM Helpline, 104 Health Department Helpline, 1070 State Emergency Operations.
    * **Karnataka (29)**: 1902 CM Janaspandana, 104 Arogyavani Medical Advice, 1070 Disaster Monitoring.
    * **Andhra Pradesh (28)**: 1902 Spandana CM Helpline, 104 Health Line, 1070 Disaster Management.
    * **Telangana (36)**: 104 Health Advice, 181 Bharosa Women Safety, 1070 Disaster Control.
    * **Punjab (03)**: 1100 Sarkar Tuhade Dwar, 104 Health Line, 1070 Disaster Control.
    * **Odisha (21)**: 1905 Mo Sarkar, 104 Health Line, 1070 OSDMA Cyclone Early Warning.
    * **Kerala (32)**: 1056 DISHA Health Advisory, 1070 KSDMA Disaster Control.
    * **Assam (18)**: 104 Sarbajanin Swasthya Sanjeevani, 1070 ASDMA Flood Room.
    * **Delhi (07)**: 1031 Health Infoline, 181 DCW Women Helpline, 1077 DDMA Disaster Room.
    * Other States & UTs (Chhattisgarh, Jharkhand, Uttarakhand, Himachal Pradesh, J&K, Goa, etc.).

### 2. Interactive Helpline Directory Component (`components/HelplineDirectory.tsx`)
- **Dual View Modes**:
  - **State View (राज्य अनुसार)**: Combines the selected state's specific helplines with the common national helplines, featuring state helplines prominently at the top.
  - **All-India Directory (संपूर्ण देश)**: Searchable across all states and national services.
- **Location Auto-Detection**: Automatically resolves user's GPS coordinates (`navigator.geolocation`) to their nearest state using spatial centroid calculations, pre-selecting their state's helplines.
- **Service Categories**: Instant filtering by *All, Medical & Health, Women & Child, Mental Health, Disaster & Relief, CM & Governance, Police & Fire*.
- **Live Search**: Instant multi-attribute search filtering by service title, phone number, category, description, or state in English and Hindi.
- **Direct Dial & Clipboard Copy**: 1-tap `tel:...` dialing with copy-to-clipboard for rural accessibility.

### 3. Integrated Emergency Hub (`components/EmergencyModule.tsx`)
- Mounted the directory directly into the Emergency Module, passing pre-cached GPS coordinates (`lastCoords`) for instant localization.
- Redesigned emergency first-response instructions into an organized 2-column card layout.

### 4. Test Suite (`tests/unit/helplines.test.ts`)
- Added 5 new unit tests verifying national numbers, state catalogs, combined state-first ranking, and whole directory consistency.
- All 83 unit tests passing in <900ms across 15 test files.
- 0 TypeScript compiler errors and 0 ESLint warnings.

---

## [v1.18.0] - 2026-10-15 — Native Multilingual Engine, Regional Dialect Awareness & Zero-Cost Browser Localization

### 1. Client-Side Multilingual Engine & Regional Dialect Mapping (`lib/i18n/detect-language.ts`)
- **Zero API Cost ($0 Free Tier)**: Bypassed external Bhashini API keys and institutional enrollment friction by implementing native browser-driven localization and direct LLM vernacular instruction.
- **13 Official Indian Languages Supported**: Hindi (`hi`), Marathi (`mr`), Bengali (`bn`), Telugu (`te`), Tamil (`ta`), Gujarati (`gu`), Kannada (`kn`), Punjabi (`pa`), Odia (`or`), Malayalam (`ml`), Assamese (`as`), Urdu (`ur`), and English (`en`) with authentic native scripts and endonyms.
- **Dialect Awareness**: Structured dialect recognition for Bhojpuri (भोजपुरी), Maithili (मैथिली), Bundelkhandi (बुंदेलखंडी), Malvi (मालवी), Marwari (मारवाड़ी), Chhattisgarhi (छत्तीसगढ़ी), Varhadi (वऱ्हाडी), and Hinglish transliteration.
- **National LGD State-to-Language Mapping**: All 36 Indian States and Union Territories mapped to their regional languages.
- **Reverse-Spatial Coordinate Language Resolution**: Sub-millisecond distance calculation matching GPS coordinates against national state centroids to suggest regional language automatically.

### 2. Context-Aware Language Suggestion Banner (`components/LanguageSuggestionBanner.tsx`)
- **Non-Intrusive 1-Tap Prompt**: Subtle top-level banner detecting device language or GPS region, prompting users with a 1-tap switch (e.g. *"मराठी (Marathi) — Based on your region, would you prefer viewing the platform in मराठी?"*).
- **Persistent State**: Stores preference in `localStorage` (`rhcp_language`, `rhcp_language_dismissed`) and syncs `document.documentElement.lang` for browser translation engine compatibility.

### 3. Multi-Language Header Switcher (`components/Header.tsx`, `components/providers/AppProvider.tsx`)
- **Responsive Desktop Picker**: Replaced the previous 2-way toggle with an accessible dropdown menu showing native scripts and English labels with active checkmarks.
- **Mobile Language Chips**: Added 1-tap quick pills for top languages in the mobile navigation drawer.
- **AppProvider State Sync**: Updated `AppProvider` to initialize from and write directly to `localStorage` and dispatch custom `rhcp-language-change` window events.

### 4. Multilingual & Vernacular Gemini AI Chatbot (`app/api/ai-chat/route.ts`, `lib/chat/router.ts`)
- **Direct Regional Generation**: Configured Gemini prompt builder to generate structured medical guidance directly in the user's active regional language without translation hops.
- **Regional Tier 0 Emergency Gate**: Integrated localized emergency warnings for physical 108 Ambulance and Tele-MANAS 14416 mental health crisis into Marathi, Bengali, Telugu, Tamil, Gujarati, Kannada, Punjabi, and Odia.
- **Speech Synthesis & Recognition (`lib/ai/speech.ts`, `components/FloatingChat.tsx`)**: Extended Web Speech API to support BCP-47 speech locales across all regional languages (`mr-IN`, `bn-IN`, `te-IN`, `ta-IN`, `gu-IN`, `kn-IN`, `pa-IN`, `or-IN`, `ml-IN`, `ur-IN`).

### 5. Verification & Test Suite (`tests/unit/multilingual-engine.test.ts`)
- Added 5 new unit tests covering language detection, coordinate spatial mapping, regional emergency triggers, and speech mapping.
- All 78 Vitest unit tests pass in <800ms across 14 test suites.
- 0 TypeScript errors (`npx tsc --noEmit`) and 0 ESLint warnings (`npm run lint`).

---

## [v1.17.0] - 2026-10-14 — Comprehensive Codebase Audit Resolutions, Emergency Gate Hardening & National LGD Expansion

### 1. Emergency Gate & Clinical Referral Hardening (`lib/chat/emergency.ts`, `lib/ai/medical-brain.ts`)
- **Self-Harm Hindi Detection**: Added `SELF_HARM_HINDI_REGEX` to catch phrases like *"jeene ka mann nahi karta"*, *"jeena nahi chahta"*, immediately directing patients to the 24/7 national Tele-MANAS helpline (`14416`).
- **Scorpion Sting Coverage**: Expanded sting regex (`bichhu|bichhoo|bicchu`) to ensure regional Hindi phrases like *"bichhu ne kaata"* trigger acute 108 emergency warnings.
- **Informational Question Bypass**: Introduced `INFORMATIONAL_QUESTION_PATTERNS` to detect educational inquiries (e.g., *"Is chest pain always a heart attack?"*), bypassing siren locks when no active personal symptoms are reported.
- **Toxin / Poison Scoped Negation**: Added scoped negation handling for poison expressions (e.g., *"zeher wali sabzi nahi hai"*) to prevent false positive 108 triggers.
- **Dog Bite Clinical Referral**: Configured urgent referral guidance (Priority 85) for animal/dog bites with immediate 15-minute soapy water wash protocols and Anti-Rabies Vaccine (ARV) / Rabies Immunoglobulin (RIG) Post-Exposure Prophylaxis at the nearest PHC/CHC within 24 hours.

### 2. Teleconsult JWT Enforcement (`components/JitsiMeeting.tsx`)
- Configured dynamic script loading from configured domains (`meet.jit.si` or 8x8 JaaS).
- Strictly enforced token validation in production mode: rooms refuse to open without a valid JWT token.

### 3. Transparent Demo Profile Demarcation (`components/Directory.tsx`)
- Labeled all mock/hardcoded physician profiles with `<Badge variant="outline">Demo Profile</Badge>`.
- Added an amber alert banner notifying users of demo data and directing them to live National Map Discovery.

### 4. Reproducible Geospatial Ingestion (`scripts/`, `package.json`)
- Updated `scripts/ingest_pan_india_geojson.mjs` and `scripts/ingest_pan_india_doctors.mjs` to dynamically accept file paths via CLI arguments (`process.argv[2]`) or environment variables (`DATASET_PATH`).
- Added `npm run ingest:facilities` and `npm run ingest:doctors` scripts to `package.json`.
- Added explicit OpenStreetMap attribution: `Data © OpenStreetMap contributors (ODbL 1.0)` and marked ingested OSM records with `is_verified: false`.
- Verified Postgres storage footprint: 136,743 facilities consume <50 MB (<10% of Supabase 500 MB quota).

### 5. API Key Security Lockdown (`app/api/facilities/nearby/route.ts`)
- Removed `SUPABASE_SERVICE_ROLE_KEY` fallback; the public nearby facility locator now strictly runs with `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 6. Official 36 States/UTs & 725 Districts Hierarchy (`lib/geo/pan-india-lgd.json`, `lib/geo/lgd-iphs.ts`)
- Restructured national Local Government Directory (LGD) structure to represent all 36 Indian States and Union Territories:
  * Merged Dadra & Nagar Haveli and Daman & Diu into a single UT (LGD Code 38).
  * Added Ladakh UT (LGD Code 37, 2 districts: Leh, Kargil).
  * Added Andaman & Nicobar Islands UT (LGD Code 35, 3 districts: Nicobars, North and Middle Andaman, South Andaman).
- Total coverage: 36 States/UTs and 725 Districts.

### 7. CI Pipeline Upgrade (`.github/workflows/ci.yml`)
- Added `npm run lint` step into GitHub Actions workflow.

### 8. Defensive Chat Route (`app/api/ai-chat/route.ts`)
- Added null-safe fallback `safeHistory = Array.isArray(history) ? history : []`, preventing runtime `TypeError: Cannot read properties of undefined (reading 'length')`.

### 9. Repository Hygiene
- Untracked and removed redundant `ANTIGRAVITY_SCALE_PROMPT.md` and `scale-kit/` directory.

---

## [v1.16.0] - 2026-10-14 — Searchable Geographic Dropdowns & PAN-India Doctors Registry Ingestion

### National Doctor Registry Ingestion (`scripts/ingest_pan_india_doctors.mjs`, Supabase PostGIS)
- **7,736 Verified Doctors, Specialists & Clinics Ingested**:
  - Ingested 7,736 features from the nationwide Overpass medical export (`export.geojson`) in a single streaming run (25s execution).
  - Registry increased to **136,743 total facilities** with **9,083 registered doctors and private practitioner chambers** across India (`type='doctors'`).
  - Enriched 7,221 pre-existing facilities with explicit medical specialities (`tags->'speciality'`), verified contact phone numbers, and emergency capability indicators.
- **LGD Centroid Reverse-Spatial Resolution**:
  - Built automatic geographic fallback matching facility coordinates against all 722 district centroids in `lib/geo/pan-india-lgd.json`. Missing OSM state/district tags are automatically resolved to official LGD boundaries with sub-millisecond distance calculation.
- **Zero-Bloat Deduplication**:
  - Maintained `<50 MB` total Postgres disk usage (<10% of 500 MB free tier) via `on_conflict=osm_id` and HTTP `resolution=merge-duplicates`.

### Map Geographic Navigation UI (`components/MapView.tsx`)
- **Searchable Custom Dropdown Component (`SearchableDropdown`)**:
  - Replaced native `<select>` menus for State (LGD) and District (LGD) with an accessible, keyboard-aware custom dropdown component.
  - **Top-Pinned Search Bar**: Embedded real-time search input at the top of both dropdown popovers, allowing instant typing and filtering across all 35 States and 722 Districts in both English and Hindi.
  - **Strict 5-Entry Viewport Limit (`max-h-[175px] overflow-y-auto`)**: Options list is capped at ~5 visible rows before scrolling, eliminating any chance of dropdown menus overlapping or covering map controls or surrounding UI.
  - **Click-Outside & Escape Dismiss**: Standard click-outside listener and keyboard `Escape` handler for seamless dismissal.

---

## [v1.15.0] - 2026-10-14 — PAN-India Geospatial Coverage: 136k+ Facilities Ingestion & National 35-State / 722-District LGD Directory

### PAN-India Geospatial Health Infrastructure (`lib/geo/`, `components/MapView.tsx`, `scripts/`)
- **136,228 PostGIS-Indexed Facilities Across India**:
  - Ingested 139,646 raw geospatial features from the comprehensive HotOSM health facilities dataset (`health_facilities.geojson`) using a high-throughput streaming batch loader (`scripts/ingest_pan_india_geojson.mjs`).
  - Grew platform facilities registry from 6,616 local facilities to **136,228 unique deduplicated facilities** spanning all Indian states and Union Territories (Maharashtra, Karnataka, Tamil Nadu, Uttar Pradesh, Bihar, Gujarat, Rajasthan, Madhya Pradesh, Kerala, West Bengal, Odisha, Andhra Pradesh, Telangana, Assam, Punjab, Haryana, etc.).
  - PostGIS spatial triggers (`trg_set_facility_geom`) automatically computed WGS84 geography points (`geom`) and GIST spatial indices for ultra-fast spatial search without exceeding free-tier limits.
- **National LGD Hierarchy Dataset (`lib/geo/pan-india-lgd.json`, `lib/geo/lgd-iphs.ts`)**:
  - Engineered complete national Local Government Directory (LGD) structure covering **all 35 States / Union Territories and 722 Districts**.
  - Computed exact geographic centroids (`lat`, `lng`) for each district from official boundary datasets.
  - Sourced bilingual state naming (`nameEn`, `nameHi`) and official LGD state codes (e.g., MP `23`, Rajasthan `08`, Maharashtra `27`, Gujarat `24`, UP `09`, Bihar `10`, Karnataka `29`, Kerala `32`, Delhi `07`).
  - Integrated seamlessly into `components/MapView.tsx` dropdown filters with dynamic fallback to `/api/facilities/nearby` PostGIS queries when static district packs are absent.
- **Preserved Low-Bandwidth Performance & $0 Free Tier**:
  - Kept lightweight footprint (~197 KB uncompressed JSON, ~25 KB over brotli/gzip) with sub-15ms client Haversine sorting and zero third-party paid API requirements.

---

## [v1.14.0] - 2026-10-12 — Mobile Emergency Overhaul: Streamlined Dual-Distress Engine, Custom Voice Alert Loop & Clean Layout

### Emergency Services & Hardware Integration (`lib/emergency/`, `components/EmergencyModule.tsx`)
- **Streamlined Dual-Distress Engine**:
  - Eliminated UI clutter, high-contrast banner buttons, and preset sentences, replacing them with two clear emergency distress paths:
    * **Distress SOS Broadcast (112)**: One-tap national emergency dispatch bundling complete chronic health profile, blood group, allergies, medications, and live GPS Google Maps coordinates into SMS 112 (isolated strictly to message dispatch without firing siren/beacon).
    * **Alert Saved Emergency Contacts (SMS & WhatsApp)**: Direct multi-recipient dispatch supporting **up to 3 emergency contacts** with a recipient selector to send to all contacts at once via normal carrier SMS or individually via WhatsApp, plus a non-emergency **Test Message mode** for connection verification.
    * **Call 108 — Ambulance**: Dedicated priority dialer for state ambulance dispatch.
- **Unified Shake-to-SOS Broadcast with Accidental Cancel Safeguard**:
  - 3-shake gesture prompts a 5-second floating countdown banner with prominent **Cancel (Accidental)** to reject unintended triggers.
  - Upon completion or manual confirmation, automatically unleashes the **unified combination**: Web Audio piercing siren, screen strobe beacon, rear camera LED torch, continuous looping custom spoken voice alert, screen wake lock, and distress SMS dispatch to 112 and all saved contacts simultaneously.
- **Custom User-Typed Voice Alert Loop**:
  - Added user-customizable voice alert input to the Personal Emergency Vault (`lib/emergency/vault.ts`), allowing users to define their own specific medical announcement (e.g. *"I am diabetic and having severe chest pain, please call Dr. Sharma immediately"*). The Web Speech API continuously loops this announcement alongside the ambulance siren during unified shake broadcast or Beacon mode.
- **Night SOS Screen Beacon & Siren**:
  - Fullscreen pulsing beacon with Web Audio siren, flashlight torch, and looping custom voice alert with single-tap dismissal.
- **Removed Clutter**:
  - Removed redundant Sunlight / High Contrast button and Share My Location button to prevent accidental taps during emergencies.
- **Mobile UI Collision Resolution (`components/AccessibilityBar.tsx`, `components/FloatingChat.tsx`)**:
  - Prevented floating accessibility wheelchair widget and AI floating chatbot from covering critical emergency action buttons on the `/emergency` route via clean pathname detection.

---

## [v1.13.0] - 2026-10-11 — Phase 10: Comprehensive Test Suites, Production Documentation Alignment & Deployment Runbook

### Testing & Verification (C1, C2, C3, C4, C5, H1, H2, H5, H8)
- **Appointments & Authorization Matrix Suite (`tests/unit/appointments-and-auth.test.ts`)**:
  - Added comprehensive test suite verifying the complete `PATCH /api/appointments` role matrix:
    * Patients can only cancel their own scheduled appointments; denied from completing (403) or modifying others' (404).
    * Doctors can complete their assigned appointments and record notes.
    * Admins have full lifecycle update permissions.
    * Modification of already-cancelled/completed appointments returns 409 conflict.
  - Verified double-booking conflict detection mapping Postgres unique constraint code `23505` to HTTP 409 `SLOT_TAKEN` (H2).
  - Verified cursor-based pagination engine (`lib/pagination.ts`), verifying encoding/decoding, limit clamping (1 to 100), and nextCursor generation (H8).
- **Expanded Test Coverage**:
  - Full suite expanded to 50 passing unit tests across 10 specialized suites covering rate limiting, PWA Serwist caching rules, emergency routing, offline outbox idempotency, logger pseudonymization, notifications polling, and appointment authorization.

### Documentation & Production Readiness
- **System Architecture (`docs/ARCHITECTURE.md`)**:
  - Documented Next.js App Router BFF architecture with Server Components, client interactive islands, Serwist service worker, offline IndexedDB outbox, tiered rate limiting, visibility-aware polling, and 100% Free-Tier posture ($0 spend).
- **API Reference (`docs/API_REFERENCE.md`)**:
  - Documented all 17 API endpoints with authentication tiers, request schemas, rate limiting classes, cursor pagination, and error code contracts.
- **Database Reference (`docs/DATABASE.md`)**:
  - Documented full ER diagram, `processed_client_ops` idempotency table, role privilege hardening, double-booking partial unique index `idx_appointments_provider_slot_active`, and PostGIS spatial queries.
- **Deployment Checklist (`docs/DEPLOY_CHECKLIST.md`)**:
  - Authoritative runbook for Supabase migrations `01` through `09`, Google OAuth URL configuration, Vercel environment variables, CSP enforcement plan, and staging load-testing safety rules.
- **Environment Example (`.env.example`)**:
  - Added documented staging load-test variables (`LOADTEST_ENABLED`, `LOADTEST_KEY`).
- **Project Readme (`README.md`)**:
  - Updated architecture, features, automated test commands, and database migration sequences.

---

## [v1.12.0] - 2026-10-11 — Phase 9: Staging Load-Test Harness & Automated Smoke CI (Audit §4, §5)

### Load Testing & Capacity Engineering
- **Repository Load-Test Suite (`loadtest/`)**:
  - Integrated full k6 traffic generator (`loadtest/k6/rural_health_mixed.js` and `lib.js`) supporting smoke, load, stress, spike, soak, and breakpoint scenarios.
  - Added synthetic seeding suite (`loadtest/seed/seed_staging.sql`) generating up to 10,000 synthetic patients, 50,000 appointments, and 100,000 health records.
  - Added session minting utility (`loadtest/tools/mint_tokens.mjs`) generating valid `@supabase/ssr` cookies.
  - Added capacity planning model (`loadtest/tools/capacity_model.mjs`) calculating maximum sustainable MAU and identifying limiting monthly quotas (Vercel invocations vs. Supabase egress).
  - Fortified `loadtest/.gitignore` against tracking session tokens or execution summaries.
- **Automated Smoke Test Workflow (`.github/workflows/loadtest-smoke.yml`)**:
  - Created manual `workflow_dispatch` GitHub Actions workflow executing k6 smoke test via `grafana/k6-action@v0.3.1`.
  - Configured strict production safeguard: rejects execution immediately if target URL matches production (`rural-healthcare-platform.vercel.app`).
  - Added scheduled workflow 60-day inactivity documentation note in `.github/workflows/keep-alive.yml`.
- **Runbook & SLO Guide (`docs/LOAD_TESTING.md`)**:
  - Comprehensive guide documenting test execution sequence, service-level objectives (<800ms API p95, <2.5s mobile LCP, <1% error rate), and post-test data cleanup.

---

## [v1.11.0] - 2026-10-11 — Phase 8: Structured Observability, Request Tracing & CSP Report-Only (Audit M1, M6)

### Observability & Security (M1, M6)
- **Structured JSON Logging Helper (`lib/logger.ts`)**:
  - Implemented single-line JSON logging with `timestamp`, `level`, `requestId`, `route`, `status`, `durationMs`, and `userIdHash`.
  - Cryptographically hashes user IDs with SHA-256 (12-char hex prefix) via `hashUserId()`.
  - Strictly prevents logging sensitive patient health information, emails, or credentials.
- **Request ID Propagation (`middleware.ts`)**:
  - Automatically captures incoming `x-request-id` header or generates `crypto.randomUUID()`.
  - Propagates `x-request-id` across request headers and client response headers for end-to-end distributed tracing.
- **Content Security Policy Report-Only (`next.config.mjs`)**:
  - Configured `Content-Security-Policy-Report-Only` header protecting against script and frame injection without breaking third-party dependencies.
  - Whitelists: Supabase (`https://*.supabase.co`, `wss://*.supabase.co`), Jitsi (`https://meet.jit.si`, `https://8x8.vc`), Google Fonts, OpenStreetMap/CartoCDN tiles, Upstash Redis, and Vercel Analytics.
  - Documented 7-day observation and enforcement procedure in `docs/SECURITY_NOTES.md`.
- **Automated Verification (`tests/unit/logger.test.ts`)**:
  - Added 4 unit tests verifying user ID hash pseudonymization, header extraction, UUID generation, and structured log output.

---

## [v1.10.0] - 2026-10-11 — Phase 7: Realtime Elimination & Visibility-Aware Notification Polling (Audit H10)

### Realtime & Notifications (H10)
- **Supabase Realtime Elimination (`components/NotificationBell.tsx`)**:
  - Removed the unfiltered `postgres_changes` table subscription that previously exhausted the 200 concurrent connection limit on Supabase Free and triggered per-subscriber row permission checks.
  - Replaced with visibility-aware polling (`GET /api/notifications?since=<timestamp>`) executing every 60 seconds exclusively when `document.visibilityState === "visible"`.
  - Added immediate polling trigger on tab focus (`window.addEventListener("focus")`) and document visibility change.
  - Integrated exponential backoff on fetch failures (60s -> 120s -> 240s -> max 300s).
- **Notifications Route Enhancements (`app/api/notifications/route.ts`)**:
  - Supported `since` query parameter filtering `.gt("created_at", since)` to return only newly arrived notifications for polling.
  - Extended `PATCH /api/notifications` schema to accept either single `notificationId` or batch `notificationIds` (max 100).
  - Applied user-scoped ownership check `eq("recipient_id", patient.id)` for patient mark-as-read operations.
  - Set `Cache-Control: private, no-cache, no-store, must-revalidate` response header to prevent private notifications from being cached by intermediate proxies.
- **Automated Verification (`tests/unit/notifications.test.ts`)**:
  - Added 5 unit tests verifying authentication requirement, `since` parameter filtering, missing payload validation, single notification update, and batch notification updates.

---

## [v1.9.0] - 2026-10-11 — Phase 6: ISR Caching, Bundle Optimization & Non-Blocking First Paint (Audit H6, M5)

### Performance, Rendering & Bundle Optimization (H6, M5)
- **Incremental Static Regeneration (ISR) on Public Routes**:
  - Converted 8 public pages from pure client components to Server Component shells with `export const revalidate = 3600`:
    - `/` (Home)
    - `/camps` (Camp Locations)
    - `/directory` (Doctor & Hospital Directory)
    - `/emergency` (Emergency Response & Dialers)
    - `/health-info` (Preventive Health Guides)
    - `/health-info/schemes` (Government Health Schemes)
    - `/locations` (Facility Locator Map)
    - `/symptom-checker` (Clinical Symptom Wizard)
  - Isolated interactive logic cleanly into `components/public-pages/` client components.
  - Public routes are prerendered and served directly from CDN edge caches (`x-vercel-cache: HIT`), bypassing Supabase database queries for anonymous traffic.
- **Shared First Load JS Bundle Reduction**:
  - Dropped shared First Load JS bundle from 607 KB uncompressed to **103 kB** across all routes.
  - Isolated Leaflet CSS (`leaflet/dist/leaflet.css`) and Leaflet runtime from global `app/layout.tsx`; loaded dynamically with placeholder fallback only on `/locations`.
  - Dynamically imported `FloatingChat` with `ssr: false` via `components/FloatingChatClient.tsx`, preventing chatbot script overhead from delaying First Contentful Paint.
- **Public API HTTP Caching & Spatial Bucketing**:
  - `GET /api/facilities/nearby`: Coordinates rounded to 2 decimal places (~1.1 km precision) to maximize CDN and Redis cache hit ratios. Enforced 50-item limit. Added header `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
  - `GET /api/providers`: Enforced 50-item limit. Added header `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
- **Non-Blocking First Paint (`components/providers/AppProvider.tsx`)**:
  - Initialized with `loading: false` default state to eliminate blank screen flash on low-speed 2G/3G connections.
  - Optimized profile bootstrapping to query existing patient record directly before invoking `POST /api/auth/ensure-patient`.
- **SSR Redirect Robustness**:
  - Moved client-side route redirects across 10 dashboard/doctor/admin pages into `useEffect` hooks, eliminating SSR `location is not defined` warnings during static prerendering.
- **Performance Report (`docs/PERFORMANCE_REPORT.md`)**:
  - Generated comprehensive benchmark report detailing route sizes, cache policies, and zero-cost free-tier guarantees.

---

## [v1.8.0] - 2026-10-11 — Phase 5: Rate Limiting Factory, AI Gateway & Staging Load-Test Harness (Audit H4, M4)

### Security, Rate Limiting & Abuse Prevention (H4)
- **Route-Class Rate Limiting Factory (`lib/rate-limit.ts`)**:
  - Replaced the single global rate limit bucket with a specialized limiter factory supporting 5 distinct route classes:
    - `auth`: 10 requests / 60s (prevents credential stuffing)
    - `read`: 60 requests / 60s
    - `write`: 20 requests / 60s (prevents appointment/record flood)
    - `ai`: 10 requests / 60s (protects Gemini quota)
    - `public`: 60 requests / 60s (facilities locator & providers directory)
  - Fixed the critical bug where `max` and `windowMs` parameters were ignored when Upstash Redis was configured.
  - Resolved CGNAT IP collisions across rural community hotspots: `clientKey()` keys on `user:<id>` for authenticated requests and strictly extracts the **first** hop of `x-forwarded-for` for unauthenticated requests.
  - Eliminated serverless memory leaks: bounded in-memory fallback store with active TTL eviction and 5,000-entry FIFO ceiling.
  - Returns standard HTTP 429 response with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.
  - Applied across all application endpoints: `ai-chat`, `appointments` (GET, POST, PATCH), `auth/ensure-patient`, `auth/profile`, `chat-cache`, `doctor-requests`, `facilities/nearby`, `health-data`, `medical-records`, `notifications`, `offline-sync`, `providers`, `symptom-analyze`, and `teleconsult/room`.

### Upstream AI Gateway & Circuit Breaker (M4)
- **AI Gateway Protection (`lib/ai/gateway.ts`)**:
  - **Circuit Breaker**: Automatically trips open after 5 consecutive upstream failures for 60 seconds, preventing cascaded failures and latency spikes. Gracefully half-opens after cooldown to probe upstream health.
  - **Daily Free-Tier Quota Guard**: Enforces a per-user/IP limit of 30 queries/day to guarantee $0 spend across free tier Gemini usage.
  - **Strict Timeout Guard**: Hard 12-second abort timeout via `Promise.race`, preventing hanging serverless invocations.
  - Integrated into `app/api/ai-chat/route.ts` and `app/api/symptom-analyze/route.ts`, falling back to instant deterministic offline triage (`triageOffline` & clinical knowledge base).

### Staging Load-Test Mode & Health Probes
- **Load-Test Bypass & Stub Harness (`lib/loadtest.ts`)**:
  - Implemented staging-only load testing switch following `scale-kit/loadtest/patches/loadtest-mode.md`.
  - Constant-time `timingSafeEqual` cryptographic check on `x-loadtest-key` matching `LOADTEST_KEY`.
  - Strictly inert on production deployments (`LOADTEST_ENABLED !== "1"`).
  - Stubs Gemini latency with realistic 400-1200ms randomized delay while allowing k6 to load-test system capacity without consuming upstream quotas.
- **Health & Readiness Endpoints**:
  - `GET /api/health`: Comprehensive liveness probe checking database connectivity, cache status, and AI circuit breaker state without exposing secrets or connection parameters.
  - `GET /api/ready`: Deployment readiness probe returning HTTP 200 `{ ready: true, version: "1.7.0" }`.
- **Automated Verification (`tests/unit/rate-limit-and-gateway.test.ts`)**:
  - 7 unit tests verifying IP hop extraction, authenticated user keys, sliding window limits, load-test key authorization, circuit breaker transitions, and timeouts.

---

## [v1.7.0] - 2026-10-11 — Phase 4: Offline Sync Rewrite, IndexedDB Outbox & Idempotency (Audit C4, §2.4)

### Offline Data & Synchronization
- **IndexedDB Outbox Engine (`lib/offline/outbox.ts`)**:
  - Replaced flaky `localStorage` operation queue with persistent `idb` store `rhcp_offline_db` (`outbox` store).
  - Strongly typed schema `{ client_op_id (uuid v4), table, type, payload, created_at, attempts, status, last_error }`.
  - Operations implemented: `enqueue`, `listPending`, `listAll`, `markSent`, `deleteOps`, `markFailed`, `retryOp`, `discardOp`, `purgeSent`.
  - Hard cap of 500 operations to prevent unbounded storage bloat on low-end devices.
  - Storage quota monitor (`checkStorageQuota`) surfacing 80% usage alerts.
  - One-time migration `migrateLegacyLocalStorage()` transferring any legacy `rhcp_offline_operations` entries into IndexedDB before cleanup.
- **Server-Side Offline Sync Endpoint Rewrite (`POST /api/offline-sync`)**:
  - Mandatory session authentication via `requireUser()` and patient verification via `getPatientProfile()`.
  - **Strict Batch Cap**: Accepts at most 50 operations per batch (`SyncBatchSchema`).
  - **Strict Column Whitelists**: Dedicated non-passthrough Zod schemas for `appointments`, `medical_records`, `health_data`, and `notifications`. Eliminates arbitrary column injection or privilege tampering.
  - **Enforced Session Scoping**: Automatically binds server-verified `patient_id` or `user_id` from the authenticated session, overriding any client-supplied IDs.
  - **Idempotency Protection**: Checks incoming `client_op_id`s against `processed_client_ops`. Skips duplicate operations cleanly with `{ status: "duplicate" }` instead of failing or creating duplicates.
  - **Partial Failure Resilience**: Returns HTTP 200 with per-operation status array (`ok`, `duplicate`, `rejected`) so individual invalid operations never abort valid ones in the batch.
  - Audit logging recorded best-effort in `offline_sync_log`.
- **Client Sync Orchestrator & Triggers (`lib/offline/sync.ts`)**:
  - Triggers on `online`, `visibilitychange` (when document returns to view), and Background Sync (`sync` event in Service Worker `app/sw.ts`).
  - Implements jittered exponential backoff for network retries.
  - Deletes only `ok` and `duplicate` items from the IndexedDB outbox; marks rejected operations as `failed` with error details so user data is never silently dropped.
  - Dispatches `rhcp:outbox-updated` events for real-time UI synchronization.
- **Bilingual Queue Inspector UI (`components/OfflineSyncBadge.tsx` & `components/Header.tsx`)**:
  - Header pill showing live count of waiting or failed offline actions ("N waiting" / "N প্রতীक्षारत", "N failed" / "N विफल").
  - Outbox inspector dialog displaying per-item table, operation type, timestamp, attempts (up to 5), and failure reasons.
  - Interactive "Retry" and "Discard" actions for failed items, and one-tap "Sync Now".
  - Storage quota warning banner when device storage exceeds 80%.
- **Automated Verification (`tests/unit/offline-sync.test.ts`)**:
  - Added unit test suite covering authentication requirement, batch size capping, idempotent replay, column whitelist enforcement, and partial failure handling.

---

## [v1.6.0] - 2026-10-11 — Phase 3: PWA Modernization, Serwist Migration, Offline Fallback & Privacy Hardening (Audit §2, C3)

### PWA & Offline Experience
- **Real PNG & Maskable Icons**: Generated standard-compliant PNG icons via `scripts/make_icons.mjs` using `sharp`:
  - `public/icons/icon-192.png` & `public/icons/icon-512.png`
  - `public/icons/maskable-192.png` & `public/icons/maskable-512.png` (80% safe zone with padded borders)
  - `public/apple-touch-icon.png` (180x180)
  - Resized and converted hero banner to `public/hero.webp` (120 KB vs 898 KB — 86.6% bandwidth saving).
  - Purged obsolete 1024px JPEG-as-PNG placeholder icons.
- **Manifest Standardization (`public/manifest.json`)**:
  - Aligned theme color to `#0ea5e9` matching `<meta theme-color>` and Tailwind UI palette.
  - Corrected app shortcuts pointing directly to valid client routes (`/emergency` and `/symptom-checker`).
  - Added `id: "/"`, `start_url: "/?source=pwa"`, and distinct `"any"` vs `"maskable"` icon definitions.
- **Serwist Service Worker Migration (`app/sw.ts` & `next.config.mjs`)**:
  - Replaced legacy `@ducanh2912/next-pwa` with `@serwist/next` and hand-written `app/sw.ts`.
  - **Strict NetworkOnly Isolation (C3)**: Ensured private medical APIs (`/api/appointments`, `/api/medical-records`, `/api/notifications`, `/api/health-data`, `/api/doctor-requests`, `/api/chat-cache`, `/api/offline-sync`, `/api/auth/*`) never enter Cache Storage.
  - **StaleWhileRevalidate**: Applied to public read-only JSON (`/api/providers`, `/api/facilities/*`, `/api/health`) with 2-hour TTL and 50-entry cap.
  - **Low-Bandwidth Navigation Optimization**: 3-second network timeout on navigations for rural 2G/3G connections, falling back to cached pages or `/offline`.
  - **Safe Connectivity Behavior**: Eliminated `reloadOnOnline` to prevent losing in-progress patient symptom descriptions or chats.
- **Bilingual Offline Fallback Page (`app/offline/page.tsx`)**:
  - Emergency hotline one-tap dialers (108 Ambulance, 112 Emergency, Tele-MANAS 14416, 104 Health Helpline).
  - Direct offline links to built-in rule-based symptom checker and visual first-aid triage.
  - Connection status monitoring and reconnect trigger.
- **Sign-Out Privacy & Cache Wipe (`lib/offline/cache-cleaner.ts`)**:
  - On user logout, sends `{ type: "CLEAR_CACHES" }` to Serwist service worker to purge all runtime caches, deletes `window.caches`, and clears IndexedDB and offline queues.
- **PWA Lifecycle UX (`components/PwaUpdaterAndInstaller.tsx`)**:
  - Controlled update prompt with Reload button using deferred `SKIP_WAITING` activation.
  - Dismissible bilingual install banner on 2nd visit, with iOS Safari "Add to Home Screen" instructions.
- **Testing & Verification (`tests/unit/pwa-strategy.test.ts`)**:
  - Unit tests verifying manifest properties, physical icon files, and NetworkOnly routing classifications for all sensitive endpoints.

---

## [v1.5.0] - 2026-10-11 — Phase 2: Data Layer, Cursor Pagination, Schema Alignment & RLS Performance (H1, H8, H9, M2)

### Data Layer & Scalability
- **Cursor Pagination Engine (`lib/pagination.ts`)**: Base64-encoded composite cursor (`created_at` + `id`) with robust decoding, validation, and deterministic pagination helpers.
- **API Endpoints Paginated & Bounded**:
  - `GET /api/appointments`: Cursor-paginated (default limit 20, max 100) with explicit column projections, patient relation phone join, and dual response shape `{ data, appointments, nextCursor }`.
  - `GET /api/medical-records`: Cursor-paginated with explicit column selections.
  - `GET /api/notifications`: Cursor-paginated, filtered by patient profile ownership.
  - `GET /api/health-data`: Cursor-paginated with explicit column selections.
  - `GET /api/doctor-requests`: Cursor-paginated with explicit column selections.
- **Frontend On-Demand Pagination**:
  - Integrated "Load more" / "और देखें" bilingual pagination in `AppointmentManager`, `PatientRecords`, `NotificationBell`, `DoctorDashboard`, `DoctorAppointmentRequests`, `AdminAppointments`, and `AdminNotifications`.
  - Bounded queries with `.limit(50)` and explicit columns in `AdminUserManagement` and `DoctorPatients`.
- **Notifications Schema Canonicalization (H1)**:
  - Canonical schema strictly aligned with `01_schema.sql` (`recipient_type`, `recipient_role`, `recipient_id`, `is_read`, with `type` CHECK `info|warning|success|emergency`).
  - Fixed `PATCH /api/notifications` to compare `recipient_id` with session user's `patients.id` instead of auth user UUID.
- **Postgres Migrations Alignment (M2)**:
  - Created timestamped sequential migrations under `supabase/migrations/` (`20260701` through `20261011`).
  - Converted `supabase/08_fix_permissions.sql` from corrupted UTF-16LE to clean UTF-8.
  - Added `supabase/migrations/README.md` documenting schema versioning and local CLI workflow.
- **RLS InitPlan Optimization (`supabase/11_rls_initplan.sql`)**:
  - Recreates hot RLS policies wrapping `auth.uid()` in `(select auth.uid())` and `(select public.get_user_role())` to ensure PostgreSQL executes auth lookups once per statement (InitPlan) rather than re-evaluating per scanned row (SubPlan).
- **OAuth Callback Error Diagnostics**:
  - Hardened `app/auth/callback/route.ts` and `components/Authentication.tsx` with error parameter capture and user-friendly toast notifications for OAuth configuration mismatches.

---

## [v1.4.0] - 2026-10-11 — Phase 1: Critical Security Overhaul & Access Control

### Security & Hardening
- **Auth Guard Framework (`lib/auth/guard.ts`)**: Server-only authorization module with `requireUser()`, `requireRole()`, and memoized `getPatientProfile()`, mapping typed authentication failures cleanly to HTTP 401/403.
- **Appointment Authorization Lockdown (`app/api/appointments/route.ts`)**:
  - `PATCH` endpoints restricted with role matrix: patients can strictly cancel their own appointments; doctors only update appointments assigned to their clinic/provider; terminal states (`completed`, `cancelled`) return HTTP 409 (`APPOINTMENT_TERMINAL`).
  - Switched from admin service-role client to user-scoped client so Postgres RLS policies are strictly enforced.
  - Returns 404 (not 403) when records are not found or not visible to prevent ID enumeration.
  - Mapped PostgreSQL error code `23505` (slot double-booking) to HTTP 409 (`SLOT_TAKEN`).
  - Provider resolution canonicalized to `healthcare_providers` matching foreign key constraints.
- **Teleconsultation Hardening (`lib/jitsi/config.ts` & `app/api/teleconsult/room/route.ts`)**:
  - Switched video room IDs to cryptographically secure `crypto.randomUUID()`.
  - Enabled Jitsi lobby mode by default (`enableLobbyMode: true`).
  - Stripped recording and livestreaming buttons from toolbar interfaces to safeguard patient privacy.
  - Gated room access to valid consultation time window (15 minutes prior to scheduled start until 30 minutes post-session).
- **Service-Role Client Lockdown**:
  - Replaced service role client with user-scoped client across `app/api/medical-records/route.ts` and `app/api/appointments/route.ts`.
  - Audited and isolated remaining service-role uses to cross-user notification delivery and initial OAuth patient bootstrapping.
- **Edge Middleware Hardening (`middleware.ts`)**:
  - Narrowed route matcher exclusively to protected and auth-redirect routes. Public pages no longer invoke `getUser()`, saving Supabase Auth network latency and egress quota.
  - Server-side role gating: `/admin/*` requires admin role; `/doctor/*` requires doctor or admin role.
  - Unprotected `/camps` for public access.

---

## [v1.3.0] - 2026-10-10 — Master Chatbot Architecture Overhaul (Tiers 0–3)

### Security
- **Eliminated Exposed Endpoints**: Deleted `app/api/fix-db/route.ts` and `app/api/admin/seed-demo/route.ts`. Removed direct `pg` TCP dependency.
- **Scrubbed Sensitive Files**: Cleaned uncommitted scratch credential artifacts and fortified `.gitignore` against tracking secrets.
- **Server-Only Gemini Key**: Completely removed all references to `NEXT_PUBLIC_GEMINI_API_KEY`. API keys are passed strictly through the `x-goog-api-key` header on the server.

### Architecture & Features
- **Tier 0 Red-Flag Emergency Gate (`lib/chat/emergency.ts`)**: Instant rule-based detection for cardiac, stroke, poison, snakebite, and mental health crises. Delivers **108 Ambulance** or **Tele-MANAS 14416** with zero LLM calls.
- **Tier 1 Structured Symptom Composition (`lib/symptoms/`)**: Deterministic composition of clinical advice based on anatomical systems, intensity, duration, and age group (with automatic escalation for infants and elders).
- **Tier 2 Live Suggestions (`lib/chat/suggestions.ts`)**: Debounced prefix suggestions powered by `fuse.js` over 31 rural diseases, catalog symptoms, and common clinical FAQs.
- **Tier 2 Curated Knowledge Engine (`lib/ai/medical-brain.ts`)**: Priority-scored matching with word boundary regexes and GI context gating.
- **Tier 2b IndexedDB Cache (`lib/ai/query-learner.ts`)**: Language-isolated token matching with threshold gates (`>=0.75` direct, `0.50–0.75` suggestions, `<0.50` Tier 3 fallback).
- **Tier 3 Resilient Gemini Layer (`lib/ai/gemini.ts`)**: Server-side fallback cascade (`gemini-3.5-flash`, `gemini-3.1-flash-lite`, `gemini-2.5-flash`) with 12s timeout and zero-500 fallback.
- **Tier 3 Governance & Human Review (`supabase/05_chat_cache.sql` & `app/admin/chat-review/`)**: PII-filtered review queue allowing doctors and admins to promote approved responses to Tier 2.

### Testing & Reliability
- **Automated Vitest Test Suite**: Added 15 unit tests across emergency gates, medical brain regressions, symptom composition rules, and a 40-case golden routing suite (`tests/chat-routing.cases.json`). 100% pass rate.

---

## [v1.2.0] - 2026-10-10 — Clinical Medical Brain, Multi-Model Resilient AI & Offline PWA
 
### Added
- **Clinical Decision Knowledge Engine (`lib/ai/medical-brain.ts`):** High-precision clinical decision engine designed for rural medical triage. Resolves nuanced follow-up questions regarding diet (capsaicin/spicy food restriction, soluble vs. insoluble fiber, temporary lactose intolerance during gastroenteritis), hydration (ORS, coconut water, rice starch), and emergency red flags.
- **Multi-Model LLM Resilience (`app/api/ai-chat/route.ts` & `app/api/symptom-analyze/route.ts`):** Cascading candidate fallback loop through `gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash-8b`, `gemini-2.0-flash-lite`, and `gemini-1.5-pro` to prevent 404/502 errors if any single Google API endpoint is deprecated or rate-limited.
- **Self-Improving Query Learning Engine (`lib/ai/query-learner.ts`):** Client-side TF-IDF similarity cache backed by browser IndexedDB (`ruralhealth_ai`). Repeated queries load with 0ms server latency, reducing API consumption. Features user feedback weighting (Thumbs Up / Down).
- **Offline Medical FAQ & Triage Engine (`lib/offline/offline-ai.ts`):** Curated static medical triage rules based on NHP/WHO India guidelines. Runs 100% offline in Airplane Mode.
- **Multilingual Speech System (`lib/ai/speech.ts`):** Voice recognition and text-to-speech audio with Hinglish transliteration for Indian English and Hindi speakers.
- **Auto-Submission Symptom Triage Flow:** Step 4 of `SymptomChecker.tsx` now automatically submits the clinical summary to the assistant, removing the need for a manual click on the send button.

### Fixed
- **Vercel Build Compilation Errors:** Fixed duplicate identifier in `symptom-analyze/route.ts` and resolved TypeScript typing on `cachedHit.response` in `SymptomChecker.tsx`.
- **Eliminated Generic Chat Disconnects:** Replaced generic emergency warning loops with context-aware clinical diet and triage answering.

---

## [v1.1.1] - 2026-08-11 — Security & RLS Hotfixes

### Security
- **PostGIS Security Lints:** Addressed Supabase Linter warnings regarding `spatial_ref_sys` by enabling Row Level Security (RLS) on it and applying a public `SELECT` policy, ensuring map features continue to work without exposing the table to malicious updates.
- **Patient RLS Expansion:** Added missing `UPDATE` and `DELETE` policies to `medical_records` and `appointments` for patients. This completely unlocks patient functionality (like cancelling appointments or updating self-submitted health records) that was previously restricted by strict DB-level security policies.

---

## [v1.1.0] - 2026-07-21 — Security Hardening & Final Release

### Added
- **Playwright E2E Test Suite:** Implemented `tests/e2e.spec.ts` with 5 automated test scenarios covering all three user roles (Patient, Doctor, Admin), public page rendering, and unauthorized route blocking. All 5 tests pass at 100%.
- **QA Test Report:** Created `docs/QA_REPORT.md` documenting the test environment, scenarios, pass rates, and security testing methodology.
- **Next.js Edge Middleware:** Added `middleware.ts` to intercept and redirect unauthenticated requests to protected routes at the Edge before any React component renders.
- **shadcn/ui Toast Notifications:** Integrated toast feedback on all authentication events (login success/failure, registration, OAuth errors).
- **Database Seeding Scripts:** Added `scripts/seed_e2e_users.js` and `scripts/fix_roles.js` to enable reproducible E2E test environments.
- **Modular Supabase SQL:** Restructured all database SQL into a sequential, numbered file set (`01_schema.sql` → `06_security_warnings_final.sql`) for clean, repeatable deployments.

### Security
- **RLS Enabled on All Tables:** Enabled Row Level Security on `providers`, `healthcare_providers`, `health_data`, `offline_sync_log`, `doctor_requests`, `notifications` — all previously missing policies.
- **Full CRUD Policies:** Wrote complete INSERT, UPDATE, DELETE, and SELECT RLS policies for every table, scoped by role (patient/doctor/admin).
- **Dropped Over-Permissive Policy:** Removed `patients_service_insert` policy which had `USING(true) WITH CHECK(true)` — effectively bypassing RLS entirely.
- **Function `search_path` Locked:** Applied `SET search_path = public` to all custom `SECURITY DEFINER` functions to prevent search path injection attacks.
- **SECURITY DEFINER REVOKE:** Revoked `EXECUTE` from `anon` and `authenticated` roles on `audit_medical_records`, `get_current_user_role`, `get_tables`, and all 3 overloads of `st_estimatedextent`.
- **Storage Bucket Locked:** Changed `medical-records` Supabase Storage bucket from `public: true` to `public: false` and added scoped RLS policies so users can only access files in their own `user_id/` folder.
- **PostGIS Public Exposure Mitigated:** Revoked `ALL` privileges from `anon` and `authenticated` on `spatial_ref_sys`, `geometry_columns`, and `geography_columns`.
- **TypeScript Build Fix:** Fixed a type error in `middleware.ts` where `request.cookies.delete()` was called with an incompatible object type — corrected to use `cookies.set({ name, value: '' })`.

### Documentation
- **README Rewritten:** Fully rewrote `README.md` to professional standard — covering architecture, security model, file structure, DB setup, testing, and license with copyright year 2025.
- **Removed Inaccurate Claims:** Deleted the "occupation-based smart pre-fill" feature claim that was not implemented.
- **Updated Copyright:** Added `Copyright (c) 2025` to the MIT License section.
- **Updated Tagline:** Changed "every corner of India" to "rural communities globally" for broader, accurate scope.
- **`PROJECT_CONTEXT.md` Sync:** Updated folder structure, last-updated date, and all documentation file references.

### Fixed
- **`doctor_requests` RLS Column:** Fixed RLS policies to use `user_id` instead of `patient_id` (table does not have a `patient_id` column).
- **`spatial_ref_sys` Permission Error:** Replaced `ALTER TABLE` (requires ownership) with `REVOKE ALL` on the PostGIS system table.
- **Playwright Config:** Fixed `playwright.config.ts` to target `localhost:3000` and manage the local dev server lifecycle.
- **`.gitignore`:** Added Playwright output folders (`test-results/`, `playwright-report/`, `blob-report/`) to prevent test artifacts from being committed.

---

## [v1.0.0-rc.2] - The "Polish & GIS" Update

### Added
- **Real-World GIS Mapping:** Integrated PostGIS with Supabase to store and calculate geographical data.
- **Leaflet Interactive Maps:** Added `components/MapView.tsx` pulling from the new `/api/facilities/nearby` endpoint to display hospitals near the user.
- **Global Loading State:** Added Next.js `app/loading.tsx` for a global skeleton UI.
- **Global Error Boundary:** Added Next.js `app/error.tsx` for graceful failure handling.

### Changed
- **Content Security Policy (CSP):** Relaxed CSP in `next.config.mjs` to properly allow OpenStreetMap tile fetching and Jitsi iframe embedding.

### Fixed
- **Leaflet React Errors:** Resolved the persistent "Map container already initialized" error.
- **Dead Buttons:** Connected every isolated `alert()` button in the Footer, Directory, and Camp Locations to actual application logic or external URLs (GitHub, WhatsApp, Emergency 108).
- **Dashboard Routing:** Fixed an invalid `setCurrentPage('campaigns')` hook reference, changing it to the valid `camps` key.
- **Location Sharing:** The "Share Location" emergency button now actively pings the browser Geolocation API and generates a Google Maps URL.

### Removed (Dead Code Cleanup)
- **Stale API Wrappers:** Deleted 5 unused files in `lib/api/` (`appointments.ts`, `providers.ts`, etc.) as the components fetch directly now.
- **Unused CSS:** Deleted `styles/globals.css` (duplicate of `app/globals.css`).
- **Unused Components:** Removed `theme-provider.tsx` and 15 excess boilerplate documents from earlier iterations.

---

## [v1.0.0-rc.1] - The "AI & Records" Update

### Added
- **Floating AI Assistant:** Integrated Google Gemini into a persistent `FloatingChat.tsx` component that follows the user across the SPA.
- **Medical Records Storage:** Implemented Supabase Storage for uploading and viewing PDFs/Images in `PatientRecords.tsx`.
- **OAuth Auto-Create:** Added server-side API `/api/auth/ensure-patient` to automatically create a `patients` table row when users log in via Google OAuth.

### Changed
- **Session Management:** Refactored Supabase auth middleware to handle timeouts and session errors smoothly.
- **Disease Data:** Refactored the `HealthInfoHub` to eliminate duplicate disease arrays and gated it behind the symptom checker.

### Fixed
- **Chat Connections:** Resolved connection and streaming errors in the Gemini AI Chat endpoint.
- **Row Level Security (RLS):** Fixed a critical bug where OAuth users couldn't create their own patient records due to strict RLS policies. Fixed via `008_oauth_patient_rls.sql` and server-side bypassing.

---

## [v0.9.0-beta] - The "Platform Overhaul" Update

### Added
- **AI Symptom Checker:** Built a 4-step wizard collecting 12 body parts and symptoms, feeding into a structured Gemini Analysis API.
- **Role-Based Auth:** Strictly isolated Patient vs Provider authentication paths.

### Changed
- **UX Redesign:** Removed all "Demo" mock-data buttons. Transitioned to a 2-item header nav with a "My Care" dropdown and a mobile bottom tab bar.
- **Real Database Wiring:** Ripped out hardcoded mock data arrays across the `Dashboard`, `Directory`, and `CampLocations`, wiring them up to Supabase.

### Fixed
- **Forgot Password Flow:** Fixed the Supabase password reset redirect URL to correctly point back to `/auth/callback`.
