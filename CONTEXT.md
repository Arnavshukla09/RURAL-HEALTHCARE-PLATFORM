# CONTEXT.md — RuralHealth Platform
## Handoff Document for Google Antigravity

> **Live URL:** https://rural-healthcare-platform.vercel.app  
> **GitHub:** https://github.com/Arnavshukla09/RURAL-HEALTHCARE-PLATFORM  
> **Generated:** June 2026 | Based on full build history

---

## 1. PROJECT ARCHITECTURE

### Tech Stack (100% Free)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.2.8 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email + Google OAuth) |
| Video Calls | Jitsi Meet (meet.jit.si public server) |
| AI Chat | Google Gemini API |
| Maps | OpenStreetMap (free, no key) |
| Deployment | Vercel (Hobby free tier) |
| Version Control | GitHub |

### Directory Structure

```
/
├── app/
│   ├── page.tsx              ← MAIN ENTRY POINT — all routing here
│   ├── layout.tsx            ← Root layout (no Geist font — removed)
│   ├── globals.css           ← Tailwind v3 directives
│   └── api/
│       ├── appointments/route.ts
│       ├── medical-records/route.ts
│       ├── auth/profile/route.ts
│       ├── providers/route.ts
│       ├── notifications/route.ts
│       ├── health-data/route.ts
│       ├── teleconsult/room/route.ts
│       ├── offline-sync/route.ts
│       └── ai-chat/route.ts
├── components/
│   ├── LandingPage.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Authentication.tsx
│   ├── AccessibilityBar.tsx
│   ├── Dashboard.tsx         ← Patient dashboard
│   ├── DoctorDashboard.tsx
│   ├── AdminDashboard.tsx
│   ├── AppointmentManager.tsx
│   ├── ConsultationPortal.tsx
│   ├── JitsiMeeting.tsx
│   ├── PatientRecords.tsx
│   ├── SymptomChecker.tsx
│   ├── AIConsultationChat.tsx
│   ├── HealthInfoHub.tsx
│   ├── EmergencyModule.tsx
│   ├── MapView.tsx
│   ├── Directory.tsx
│   ├── CampLocations.tsx
│   ├── DonationPortal.tsx
│   ├── figma/ImageWithFallback.tsx
│   └── ui/                  ← shadcn/ui components
├── lib/
│   ├── supabase/
│   │   ├── client.ts        ← Browser Supabase client
│   │   ├── server.ts        ← Server Supabase client
│   │   └── middleware.ts    ← Session refresh
│   ├── rate-limit.ts
│   └── hooks/
├── middleware.ts             ← Supabase session middleware
├── scripts/                 ← SQL migration files
│   ├── 001_create_tables.sql
│   ├── 002_create_trigger.sql
│   ├── 003_create_helper_functions.sql
│   ├── 004_create_payment_tables.sql
│   └── 005_auth_setup.sql   ← RLS policies + indexes + storage
└── public/                  ← Static assets
```

### Routing Architecture

All routing is **client-side state** in `app/page.tsx` using `useState("home")`.  
There are **no separate Next.js route files** for pages — everything is a single page app pattern.

```
currentPage state → switch statement → renders component
"home"          → <LandingPage />
"auth"          → <Authentication />  (no header/footer)
"dashboard"     → <Dashboard /> or <DoctorDashboard /> or <AdminDashboard /> (by role)
"symptom-checker" → <SymptomChecker />
"consultation"  → <ConsultationSection /> (inline in page.tsx)
"records"       → <PatientRecords />
"emergency"     → <EmergencyModule />
"locations"     → <MapSection /> (inline in page.tsx)
"directory"     → <Directory />
"camps"         → <CampLocations />
"donation"      → <DonationSection /> (inline in page.tsx)
"health-info"   → <HealthInfoHub />
"appointments"  → <AppointmentManager />
"ai-chat"       → <AIConsultationChat />
"jitsi"         → <JitsiMeeting /> (full screen, no header)
```

### Supabase Database Schema

```sql
-- 11 tables total, all with RLS enabled
patients          (id, user_id FK→auth.users, first_name, last_name, email, phone, role)
providers         (id, user_id FK→auth.users, first_name, specialization, ...)
healthcare_providers (id, name, specialization, location, is_verified, ...)
appointments      (id, patient_id, provider_id, appointment_date, status, notes, ...)
medical_records   (id, patient_id, title, description, record_date, file_url, ...)
health_data       (id, patient_id, bp, temperature, pulse, blood_sugar, ...)
notifications     (id, user_id, title, message, read, ...)
payments          (id, user_id, amount, status, ...)
donations         (id, user_id, amount, ...)
offline_sync_log  (id, user_id, action, data, synced_at, ...)
consultation_payments (id, appointment_id, amount, ...)
```

### User Roles

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| patient | any signup | any | Dashboard.tsx |
| doctor | doctor@ruralhealth.com | Doctor@123 | DoctorDashboard.tsx |
| admin | admin@ruralhealth.com | Admin@123 | AdminDashboard.tsx |

Role is stored in `patients.role` column (values: `'patient'`, `'doctor'`, `'admin'`).

### Environment Variables

```bash
# Required in .env.local AND Vercel Project Settings
NEXT_PUBLIC_SUPABASE_URL=https://boyzdmlvzvcplzolenef.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...   # public, safe for browser
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...       # secret, server-side only, Production env only
NEXT_PUBLIC_GEMINI_API_KEY=AIza...          # for AI consultation chat
NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si        # teleconsultation
API_URL=https://rural-healthcare-platform.vercel.app
```

---

## 2. BUGS SOLVED (with fixes)

### Bug 1 — `.env,local` (comma instead of dot)
**Symptom:** `Error: Your project's URL and Key are required to create a Supabase client`  
**Root cause:** File was named `.env,local` (comma) instead of `.env.local` (dot)  
**Fix:** Renamed file on Windows with `ren .env,local .env.local`

### Bug 2 — Vite vs Next.js dual framework conflict
**Symptom:** `Failed to resolve import "@/src/App"` and `vite:import-analysis` errors  
**Root cause:** Project had both `vite.config.ts` and `next.config.mjs`. `app/page.tsx` imported from `@/src/App` which doesn't exist in Next.js.  
**Fix:** Deleted `vite.config.ts`, `index.html`, `src/main.tsx`, `src/index.css`. Fixed `app/page.tsx` to import from `@/components/LandingPage`.

### Bug 3 — Tailwind v4 vs v3 incompatibility
**Symptom:** `The 'border-border' class does not exist` and `@layer base` errors  
**Root cause:** `app/globals.css` used Tailwind v4 syntax (`@theme inline`, `oklch()` colors) but `tailwind.config.js` was v3.  
**Fix:** Replaced `globals.css` with v3-compatible version using `@tailwind base/components/utilities` and `hsl(var(--border))` CSS variables. Replaced `@tailwindcss/postcss` with standard `tailwindcss` + `autoprefixer` in `postcss.config.mjs`.

### Bug 4 — `@tailwindcss/postcss` missing module
**Symptom:** `Cannot find module '@tailwindcss/postcss'` on build  
**Root cause:** `postcss.config.mjs` referenced Tailwind v4 plugin  
**Fix:** `postcss.config.mjs` → `{ plugins: { tailwindcss: {}, autoprefixer: {} } }`

### Bug 5 — Stripe references breaking build
**Symptom:** `Cannot find module '@/components/stripe-checkout'` and `Cannot find name 'getProductsByCategory'`  
**Root cause:** `ConsultationPortal.tsx` and `DonationPortal.tsx` imported from deleted Stripe files  
**Fix:** Rewrote both components without Stripe. Consultation → free Jitsi. Donation → bank transfer details display.

### Bug 6 — `recharts@2.15.2` version in import string
**Symptom:** `Cannot find module 'recharts@2.15.2'`  
**Root cause:** `components/ui/chart.tsx` had `import * as RechartsPrimitive from "recharts@2.15.2"` with version number  
**Fix:** Changed to `import * as RechartsPrimitive from "recharts"`

### Bug 7 — Duplicate `<Tabs>` components breaking registration tab
**Symptom:** Clicking "Register" tab showed Login form, fields didn't switch  
**Root cause:** `Authentication.tsx` had TWO separate `<Tabs defaultValue="login">` — one in `<CardHeader>` and one in `<CardContent>`. They were independent and not synced.  
**Fix:** Merged into a single `<Tabs>` component wrapping both the tab triggers and content.

### Bug 8 — `handle_new_patient()` trigger crashing user creation
**Symptom:** `Database error creating new user` even from Supabase dashboard  
**Root cause:** A hidden trigger `on_auth_user_created_patient` was calling a function `handle_new_patient()` that had a bug. It existed alongside our trigger.  
**Fix:**
```sql
DROP TRIGGER IF EXISTS on_auth_user_created_patient ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_patient();
```
Then created a single clean trigger with `EXCEPTION WHEN OTHERS THEN NULL` to never block signup.

### Bug 9 — `patients.user_id` had no UNIQUE constraint
**Symptom:** `ON CONFLICT (user_id) DO NOTHING` failed with "no unique constraint"  
**Fix:**
```sql
ALTER TABLE public.patients ADD CONSTRAINT patients_user_id_unique UNIQUE (user_id);
```

### Bug 10 — `LandingPage` rejected `setLanguage` prop
**Symptom:** `Property 'setLanguage' does not exist on type 'LandingPageProps'`  
**Fix:** Removed `setLanguage={setLanguage}` from `<LandingPage>` call in `page.tsx`

### Bug 11 — `JitsiMeeting` wrong prop names
**Symptom:** `Property 'user' does not exist on JitsiMeetingProps`, `Property 'onClose' does not exist`  
**Root cause:** `JitsiMeeting` accepts `displayName: string` and `onLeave?: () => void`, not `user` or `onClose`  
**Fix:**
```tsx
// Wrong:
<JitsiMeeting roomName={room} user={user} onClose={() => ...} />
// Correct:
<JitsiMeeting roomName={room} displayName={user?.name || "Guest"} onLeave={() => ...} />
```

### Bug 12 — `MapView` missing required props
**Symptom:** `Type missing properties: userLocation, camps` from `MapViewProps`  
**Root cause:** Original `MapView` required Google Maps API key and props we didn't have  
**Fix:** Completely rewrote `MapView.tsx` to use OpenStreetMap (free, no API key). New props: `{ language: string; userLocation?: any; camps?: any[] }` — all optional.

### Bug 13 — `CampLocations` passing wrong props to `MapView`
**Symptom:** `Property 'searchLocation' does not exist`, then `Property 'onClose' does not exist`  
**Fix:** Replaced `<MapView searchLocation={...} onClose={...} />` with modal wrapper:
```tsx
{showMap && (
  <div className="fixed inset-0 z-50 bg-black/50 ...">
    <MapView language={language} />
  </div>
)}
```

### Bug 14 — `PatientRecords` rejected `user` and `setCurrentPage` props
**Symptom:** `Property 'user' does not exist on PatientRecordsProps`  
**Root cause:** `PatientRecords` only accepts `{ language: string }` — nothing else  
**Fix:** `<PatientRecords language={language} />` (remove all other props)

### Bug 15 — Next.js 15.2.4 security vulnerability blocking Vercel deploy
**Symptom:** Vercel showed "Vulnerable version of Next.js detected" and blocked deployment  
**Fix:** Updated `package.json`: `"next": "15.2.8"` then `npm install && git push`

### Bug 16 — `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` confusion
**Symptom:** Supabase suggested using `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` but codebase used `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
**Fix:** Keep using `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy key format). Delete the publishable key variable from Vercel. Both point to the same anon key from the "Legacy anon, service_role API keys" tab in Supabase.

### Bug 17 — Google OAuth users not getting patient profiles
**Symptom:** Google login worked but `patients` table stayed empty  
**Root cause:** Trigger used `first_name` from metadata but Google OAuth sends `full_name`  
**Fix:** Updated trigger to handle both:
```sql
COALESCE(
  NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
  NULLIF(NEW.raw_user_meta_data->>'first_name', ''),
  split_part(email, '@', 1)
)
```

### Bug 18 — Read Aloud had no stop button
**Symptom:** `speechSynthesis.speak()` ran until completion with no way to stop  
**Fix:** Added `isSpeaking` state. Button toggles between "Read Aloud" and "Stop Reading":
```tsx
onClick={() => {
  if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false) }
  else { /* start speech */ setIsSpeaking(true) }
}}
```

### Bug 19 — Font size and high contrast not actually working
**Symptom:** Clicking Increase/Decrease font and contrast toggle had no visible effect  
**Fix:**
```tsx
// Font size
document.documentElement.style.fontSize = `${next}px`

// High contrast
document.documentElement.setAttribute("data-contrast", "high")
// CSS: [data-contrast="high"] { filter: invert(1) hue-rotate(180deg); }
```

### Bug 20 — 403 Forbidden on live site after first successful deploy
**Symptom:** `Error: Forbidden` on `rural-healthcare-platform.vercel.app`  
**Root cause:** Supabase middleware blocking all requests because env vars weren't set in Vercel  
**Fix:** Added all 3 env vars in Vercel → Project Settings → Environment Variables, then redeployed.

---

## 3. REMAINING UNRESOLVED ISSUES

### 🔴 Critical (blocks real users)

#### ISSUE-01: Role-based routing broken for real logins
**File:** `app/page.tsx` — `onAuthStateChange` handler  
**Problem:** Role is read from `session.user.user_metadata?.role` which is always `undefined` for real users. Only demo login buttons work correctly.  
**Fix needed:**
```tsx
// After getting session, fetch role from DB:
const { data: patient } = await supabase
  .from('patients')
  .select('role')
  .eq('user_id', session.user.id)
  .single()
const role = patient?.role || 'patient'
setUser({ ...userData, role })
```

#### ISSUE-02: Appointments are all hardcoded mock data
**File:** `components/AppointmentManager.tsx`  
**Problem:** `const appointments = [{ id: 1, patient: "Priya Sharma" ... }]` — hardcoded array  
**Fix needed:** Replace with `useEffect` calling `GET /api/appointments`

#### ISSUE-03: Patient Records are all hardcoded mock data  
**File:** `components/PatientRecords.tsx`  
**Problem:** Vitals, prescriptions, lab reports are hardcoded  
**Fix needed:** Fetch from `/api/medical-records` and `/api/health-data`

#### ISSUE-04: Gemini API key may not be in Vercel
**Check:** Vercel → Project Settings → Environment Variables → look for `NEXT_PUBLIC_GEMINI_API_KEY`  
**If missing:** Get from aistudio.google.com → Create API Key → add to Vercel → redeploy

#### ISSUE-05: Appointment booking form doesn't exist
**Problem:** Users can't actually book an appointment. ConsultationPortal just opens Jitsi without saving anything.  
**Fix needed:** Form with doctor picker + date/time → POST `/api/appointments`

### 🟡 Important (degrades experience)

#### ISSUE-06: Directory shows hardcoded doctors
**File:** `components/Directory.tsx`  
**Problem:** All doctor cards are hardcoded. `healthcare_providers` table exists in Supabase but is not queried.  
**Fix needed:** `useEffect` → `GET /api/providers`

#### ISSUE-07: Dashboard notifications are hardcoded
**File:** `components/Dashboard.tsx`  
**Problem:** Notification list is hardcoded array  
**Fix needed:** `useEffect` → `GET /api/notifications`

#### ISSUE-08: Doctor dashboard patient list is hardcoded
**File:** `components/DoctorDashboard.tsx`  
**Problem:** Patient queue is a hardcoded array of 4 fake patients  
**Fix needed:** Fetch real appointments from DB where `provider_id = current doctor's id`

#### ISSUE-09: Admin dashboard stats are hardcoded
**File:** `components/AdminDashboard.tsx`  
**Problem:** "2847 users, 234 active" etc are fake numbers  
**Fix needed:** Query `patients` table count, `appointments` table count etc.

#### ISSUE-10: File upload in PatientRecords is non-functional
**File:** `components/PatientRecords.tsx`  
**Problem:** "Upload New Report" button exists but does nothing  
**Fix needed:** Connect to Supabase Storage bucket `medical-records` (already created in 005_auth_setup.sql)

#### ISSUE-11: Landing page hero image broken
**File:** `components/LandingPage.tsx`  
**Problem:** Hero image shows grey placeholder box (ImageWithFallback fallback)  
**Fix needed:** Add a real image file to `/public/hero.jpg` and update the `src` prop

### 🟢 Minor / Enhancement

- Footer social links (Facebook, YouTube) are `href="#"` placeholders
- Newsletter subscribe in Footer has no backend
- No password reset flow (Supabase supports it — just needs UI)
- No profile edit page
- Camp location registration saves nothing to database
- `API_URL` env var is set to `https://placeholder.vercel.app` — update to real URL
- Email confirmation is disabled (turned off for testing) — must re-enable for production
- MIT License not linked from the website (only in repo root)

---

## 4. CODING RULES & CONSTRAINTS

### Architecture Constraints

1. **Single-page routing only** — all pages are components rendered in `app/page.tsx` via a switch on `currentPage` state. Do NOT create new Next.js route files like `app/dashboard/page.tsx`.

2. **No Stripe** — completely removed. Payment is handled via bank transfer / UPI instructions shown in UI. Do not add Stripe back.

3. **No paid services** — everything must work on free tiers. Approved free services: Supabase, Vercel, Jitsi (meet.jit.si), OpenStreetMap, Gemini API free tier, GitHub.

4. **Tailwind v3 only** — NOT v4. `globals.css` must start with `@tailwind base; @tailwind components; @tailwind utilities;`. Do not use `@import "tailwindcss"`, `@theme`, or `oklch()` colors. Use `hsl(var(--color))` pattern.

5. **No Geist font** — removed from `layout.tsx` because it caused build failures. Use system fonts via `font-sans` Tailwind class.

### TypeScript Rules

6. **Always check component prop interfaces before passing props.** Key interfaces to know:
   ```
   JitsiMeeting:    { roomName: string; displayName: string; onLeave?: () => void; language?: string }
   PatientRecords:  { language: string }  ← only this, nothing else
   MapView:         { language: string; userLocation?: any; camps?: any[] }
   LandingPage:     { setCurrentPage: fn; language: string }  ← NO setLanguage prop
   Dashboard:       { user: any; setCurrentPage: fn; language: string }
   ```

7. **Never use `ignoreBuildErrors: true` in `next.config.mjs`** — TypeScript errors must be fixed, not suppressed.

### Supabase Rules

8. **ANON key goes in browser (client.ts), SERVICE_ROLE key goes server-side only**. Never prefix `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_`.

9. **Role is in `patients.role` column** — not in `auth.users.user_metadata`. Always fetch from DB after auth.

10. **All auth API routes must check user before querying:**
    ```ts
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    ```

11. **Use `SECURITY DEFINER SET search_path = public`** on all trigger functions to prevent privilege escalation.

12. **Trigger functions must never block signup.** Always wrap inserts in:
    ```sql
    BEGIN ... EXCEPTION WHEN OTHERS THEN NULL; END;
    ```

### Component Rules

13. **All interactive components need `"use client"` directive** — any component using `useState`, `useEffect`, `onClick` etc. The `app/page.tsx` already has `"use client"` so everything it imports is fine, but standalone components in `components/` that use hooks must declare it themselves.

14. **`ImageWithFallback`** is in `components/figma/ImageWithFallback.tsx` and must have `"use client"` as its first line (it uses `useState`).

15. **Jitsi room names** should be hard to guess: `ruralhealth-${userId}-${Date.now()}` pattern. Do not use sequential IDs.

### Deployment Rules

16. **Never use `npm audit fix --force`** — it breaks package compatibility.

17. **Never merge Vercel's auto-generated pull requests** (for CVEs, runtime errors etc.) — they always make things worse. Fix errors manually.

18. **Never use the v0.dev AI to fix errors** — it introduced multiple additional bugs in this project. Fix errors by reading the TypeScript error message and changing the specific prop/type.

19. **Environment variables added to Vercel require a redeploy** — after adding a new env var, go to Deployments → click `...` on latest → Redeploy.

20. **`SUPABASE_SERVICE_ROLE_KEY` must be set to "Production only"** in Vercel — not Preview or Development — to prevent the bypass key from being available in preview deployments.

### Package Rules

21. **`leaflet` package is in `package.json`** but we switched to OpenStreetMap iframe. Leaflet is not currently used. Remove `leaflet` and `@types/leaflet` to reduce bundle size.

22. **`zod` is used for validation in all API routes** — keep it. All POST/PUT endpoints have Zod schemas at the top of the file.

23. **`next` version must be 15.2.8 or higher** — 15.2.4 had a critical CVE (CVE-2025-66478) that Vercel rejects.

---

## 5. SUPABASE SQL REFERENCE

### Key SQL run so far (in order):

```sql
-- 1. Core tables
-- Run: scripts/001_create_tables.sql
-- Run: scripts/002_create_trigger.sql
-- Run: scripts/003_create_helper_functions.sql
-- Run: scripts/004_create_payment_tables.sql
-- Run: scripts/005_auth_setup.sql  ← RLS + indexes + storage bucket + trigger

-- 2. Add role column (run manually)
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS role text DEFAULT 'patient';
ALTER TABLE public.patients ADD CONSTRAINT patients_user_id_unique UNIQUE (user_id);

-- 3. Set doctor and admin roles
UPDATE public.patients SET role = 'doctor', first_name = 'Dr. Rajesh', last_name = 'Kumar'
WHERE email = 'doctor@ruralhealth.com';

UPDATE public.patients SET role = 'admin', first_name = 'Admin', last_name = 'User'
WHERE email = 'admin@ruralhealth.com';

-- 4. Set column defaults
ALTER TABLE patients ALTER COLUMN first_name SET DEFAULT 'New';
ALTER TABLE patients ALTER COLUMN last_name SET DEFAULT 'User';
ALTER TABLE patients ALTER COLUMN email SET DEFAULT '';
```

### Current trigger (working):
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.patients (user_id, first_name, last_name, email)
    VALUES (
      NEW.id,
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
               NULLIF(NEW.raw_user_meta_data->>'first_name', ''),
               split_part(COALESCE(NEW.email, 'new@user.com'), '@', 1)),
      'User',
      COALESCE(NEW.email, '')
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RETURN NEW;
END;
$$;
```

---

## 6. NEXT STEPS (Priority Order)

1. **Fix ISSUE-01** — role routing (30 min) — highest impact
2. **Fix ISSUE-02** — real appointments from DB (3 hours)
3. **Fix ISSUE-03** — real patient records from DB (3 hours)
4. **Fix ISSUE-04** — add Gemini key to Vercel (15 min)
5. **Fix ISSUE-05** — appointment booking form (4 hours)
6. **Fix ISSUE-06** — directory from DB (2 hours)
7. **Fix ISSUE-10** — file upload to Supabase Storage (4 hours)
8. **Fix ISSUE-11** — hero image (20 min)

---

*End of CONTEXT.md — RuralHealth Platform handoff for Google Antigravity*
