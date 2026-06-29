# RuralHealth Platform — Complete Action Plan
## Based on Full Codebase Audit + Live Site Review

> **Live URL:** https://rural-healthcare-platform.vercel.app  
> **GitHub:** https://github.com/Arnavshukla09/RURAL-HEALTHCARE-PLATFORM  
> **Date:** June 2026

---

## CURRENT STATE SUMMARY

### What Antigravity Added (Good)
- `DoctorDashboard.tsx`, `AdminDashboard.tsx`, `AppointmentManager.tsx`
- `AIConsultationChat.tsx` with Gemini API + image upload + voice input
- `HealthInfoHub.tsx` with vaccines, first aid, diseases tabs
- Updated `Authentication.tsx` with demo login buttons
- Updated `app/page.tsx` with role routing and Jitsi integration

### What Is Still Broken
1. **Google OAuth** — redirects to Supabase but never signs user in to the app
2. **Role routing** — reads from `user_metadata.role` which is always empty; real users always get patient dashboard
3. **AI Chat (Gemini)** — exists but only accessible via "ai-chat" route; patients can't reach it after symptom checker
4. **Consultation booking** — shows "incomplete user details, contact support" error
5. **Health Info diseases** — only 6 diseases listed; no search working on disease tab
6. **Navbar** — too many items, not mobile-friendly, shows pages patients shouldn't see
7. **Donation section** — unnecessary, should be removed from nav/landing
8. **HealthInfoHub** — accessible to anyone; should only be accessible after symptom checker with disease-specific content

---

## WHAT TO CHANGE — FULL PLAN

---

## FIX 1 — Google OAuth (Critical — users can't log in)

### Problem
`handleGoogleLogin` in `Authentication.tsx` calls:
```tsx
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${window.location.origin}` }
})
```
This redirects to Google → Google redirects to `https://rural-healthcare-platform.vercel.app` (the root), but the `onAuthStateChange` listener doesn't pick it up because the OAuth callback URL is not configured correctly in Supabase.

### Fix in Supabase Dashboard (you do this)
1. Go to **Supabase → Authentication → URL Configuration**
2. **Site URL:** `https://rural-healthcare-platform.vercel.app`
3. **Redirect URLs** — make sure BOTH exist:
   ```
   https://rural-healthcare-platform.vercel.app
   https://rural-healthcare-platform.vercel.app/auth/callback
   http://localhost:3000
   http://localhost:3000/auth/callback
   ```

### Fix in Code
**File: `app/auth/callback/route.ts`** — Create this new file:
```ts
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(`${origin}/`)
}
```

**File: `components/Authentication.tsx`** — Change redirectTo:
```tsx
// Change this:
redirectTo: `${window.location.origin}`
// To this:
redirectTo: `${window.location.origin}/auth/callback`
```

---

## FIX 2 — Role Routing (Critical — doctors/admins land on patient dashboard)

### Problem
`app/page.tsx` reads role from:
```tsx
role: session.user.user_metadata?.role || "patient"
```
`user_metadata.role` is always undefined. Role is stored in `patients.role` in Supabase.

### Fix in `app/page.tsx`
Replace the session handler in both `getSession` and `onAuthStateChange`:
```tsx
const fetchUserWithRole = async (sessionUser: any) => {
  const supabase = createClient()
  const { data: patient } = await supabase
    .from('patients')
    .select('role, first_name, last_name')
    .eq('user_id', sessionUser.id)
    .single()
  
  return {
    id: sessionUser.id,
    name: patient?.first_name || 
          sessionUser.user_metadata?.full_name || 
          sessionUser.email?.split("@")[0] || "User",
    email: sessionUser.email,
    role: patient?.role || "patient",
  }
}

// Then in getSession:
if (session?.user) {
  const userData = await fetchUserWithRole(session.user)
  setUser(userData)
}
// And in onAuthStateChange:
if (session?.user) {
  const userData = await fetchUserWithRole(session.user)
  setUser(userData)
}
```

---

## FIX 3 — Admin Login (Single hardcoded credential, no signup)

### Design
- Admin logs in via email/password only — NO Google OAuth for admin
- Single admin account: `admin@ruralhealth.com` / `Admin@123`
- No "Create Admin" flow anywhere in the app
- Admin dashboard shows: pending doctor requests, all patients, platform stats

### Fix in `components/Authentication.tsx`
Remove demo buttons. Add a subtle "Staff Login" link at the bottom:
```tsx
// At the bottom of the auth card:
<div className="text-center mt-4">
  <button 
    onClick={() => setIsStaffLogin(!isStaffLogin)} 
    className="text-xs text-gray-400 hover:text-gray-600">
    {isStaffLogin ? "Patient Login" : "Staff / Doctor Login"}
  </button>
</div>
```
When `isStaffLogin` is true — hide Google OAuth button, show only email/password form.

---

## FIX 4 — Doctor Registration Flow (Request-based, Admin approves)

### New flow:
1. Doctor fills registration form → selects "I am a Doctor"
2. A `doctor_requests` table entry is created with status `pending`
3. Doctor sees: "Your registration request has been submitted. You will receive access once verified."
4. Admin dashboard shows pending requests → clicks Approve → `patients.role` updated to `'doctor'`
5. Doctor can now log in and access DoctorDashboard

### SQL to run in Supabase:
```sql
CREATE TABLE IF NOT EXISTS doctor_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  specialization text,
  license_number text,
  hospital text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

ALTER TABLE doctor_requests ENABLE ROW LEVEL SECURITY;

-- Doctors can see their own request
CREATE POLICY "doctors_see_own_request" ON doctor_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Admin can see all requests  
CREATE POLICY "admin_see_all_requests" ON doctor_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM patients WHERE user_id = auth.uid() AND role = 'admin')
  );
```

### New API route: `app/api/doctor-requests/route.ts`
```ts
// POST — submit doctor registration request
// GET — admin fetches all pending requests  
// PATCH — admin approves/rejects
```

---

## FIX 5 — Symptom Checker → AI Chat Flow

### Current problem
Symptom checker completes → shows result → no connection to AI chat. 
AI chat is a separate page patients can't easily find.

### New Flow Design
```
Symptom Checker (Step 3 — Result)
  ↓ After assessment result shown
  ↓ "Get AI Health Advice" button appears
  ↓ Opens AIConsultationChat with pre-filled context:
     - Selected body part
     - Selected symptoms  
     - Urgency level (low/medium/high)
     - AI opens with: "Based on your symptoms [list], here's what I found..."
```

### Fix in `components/SymptomChecker.tsx`
Pass symptom data to AI chat via state in `page.tsx`:
```tsx
// In page.tsx, add state:
const [symptomContext, setSymptomContext] = useState<{
  bodyPart: string;
  symptoms: string[];
  urgency: string;
} | null>(null)

// In SymptomChecker result step, add button:
<Button onClick={() => {
  setSymptomContext({ bodyPart: selectedBodyPart, symptoms: selectedSymptoms, urgency })
  setCurrentPage("ai-chat")
}}>
  💬 Get AI Health Advice
</Button>
```

### Fix in `components/AIConsultationChat.tsx`
Accept and use symptom context:
```tsx
interface AIConsultationChatProps { 
  language: string
  setCurrentPage: (page: string) => void
  symptomContext?: { bodyPart: string; symptoms: string[]; urgency: string } | null
}

// Pre-fill first message with context:
useEffect(() => {
  if (symptomContext) {
    // Auto-send initial context message to Gemini
    const contextMsg = `I have the following symptoms in my ${symptomContext.bodyPart}: ${symptomContext.symptoms.join(", ")}. The urgency level assessed is ${symptomContext.urgency}.`
    // trigger sendMessage with this as initial input
  }
}, [symptomContext])
```

---

## FIX 6 — AI Chat: Disease-Only Conversation

### Problem
Current system prompt is too broad. Needs to be limited to health/disease questions only.

### Fix in `app/api/ai-chat/route.ts`
Replace system prompt:
```ts
const systemPrompt = `You are a medical health assistant for rural patients in India. 
Your ONLY role is to help patients understand health conditions, diseases, symptoms, and when to seek medical care.

STRICT RULES:
1. ONLY answer questions about health, diseases, symptoms, medications, and medical care
2. If asked about anything unrelated to health, say: "I can only help with health-related questions."
3. Always recommend consulting a real doctor for serious concerns
4. Keep answers simple — patients may have limited medical knowledge
5. Mention free/affordable treatment options available in rural India (PHC, ASHA, Jan Aushadhi)
6. Never diagnose definitively — always say "this could be" or "this may indicate"
7. Respond in ${language === "hi" ? "Hindi" : "English"}

Return JSON: { 
  "response": "your health advice",
  "severity": "mild|moderate|severe|emergency",
  "conditions": ["possible condition 1", "possible condition 2"],
  "specialist": "type of doctor to see",
  "freeResource": "nearest free care option"
}`
```

---

## FIX 7 — HealthInfoHub: Diseases + Vaccines Only, Post-Symptom-Checker

### Changes:
1. **Remove** "First Aid" and "Awareness" tabs from HealthInfoHub
2. **Keep** only "Diseases" and "Vaccination" tabs
3. **Add 20+ diseases** to the diseases list (currently only 6)
4. **Gate access** — HealthInfoHub only accessible after symptom checker completion
5. **Show relevant disease** at top based on symptom checker result

### 20+ Diseases to add:
```
Malaria, Dengue, Typhoid, Tuberculosis, Pneumonia, Anemia, 
Cholera, Diarrhea/Dysentery, Hepatitis A, Hepatitis B, 
Chickenpox, Measles, Mumps, Jaundice, Scabies, 
Diabetes, Hypertension, Asthma, Arthritis, 
Conjunctivitis (Pink Eye), Ringworm, Leptospirosis,
COVID-19, Chikungunya, Leishmaniasis
```

### Fix in `app/page.tsx` — gate health-info:
```tsx
case "health-info":
  if (!symptomContext) {
    // Redirect to symptom checker if no context
    return (
      <div className="p-6 text-center">
        <p>Please complete the symptom checker first to get personalized health information.</p>
        <Button onClick={() => setCurrentPage("symptom-checker")}>Start Symptom Checker</Button>
      </div>
    )
  }
  return <HealthInfoHub language={language} symptomContext={symptomContext} />
```

---

## FIX 8 — Consultation Booking ("Incomplete User Details" Error)

### Problem
ConsultationPortal likely fails because `user` is null or missing fields when passed to the booking API.

### Root cause
```tsx
// In page.tsx, user might be:
{ id: undefined, name: "User", email: undefined, role: "patient" }
// API requires patient_id which comes from user.id
```

### Fix
1. Check if user is logged in before showing consultation
2. If not logged in → show login prompt
3. If logged in but missing patient record → create it first

```tsx
case "consultation":
  if (!user) {
    return (
      <div className="p-6 text-center">
        <p>Please login to book a consultation.</p>
        <Button onClick={() => setCurrentPage("auth")}>Login</Button>
      </div>
    )
  }
  return <ConsultationSection language={language} user={user} />
```

Also fix `app/api/appointments/route.ts` to derive `patient_id` from session, never from body:
```ts
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

// Get patient record
const { data: patient } = await supabase
  .from('patients')
  .select('id')
  .eq('user_id', user.id)
  .single()

if (!patient) return NextResponse.json({ error: "Patient profile not found" }, { status: 404 })
// Use patient.id — never trust body.patient_id
```

---

## FIX 9 — Navbar Redesign (Simplified + Mobile)

### Remove from nav:
- Donation (remove entirely from nav and landing)
- Health Info (hidden — only accessible via symptom checker flow)
- AI Chat (hidden — only accessible via symptom checker)

### New nav items (patients only):
```
Home | Symptoms | Consult | Records | Emergency | Hospitals | Dashboard
```

### Mobile nav — bottom tab bar on mobile:
```
[Home] [Symptoms] [Consult] [Records] [Emergency]
```
5 items max on mobile bottom bar. Dashboard accessible via profile icon top right.

### Fix in `components/Header.tsx`:
```tsx
const navItems = [
  { key: "home",            label: en ? "Home"      : "होम",     icon: Home },
  { key: "symptom-checker", label: en ? "Symptoms"  : "लक्षण",   icon: Activity },
  { key: "consultation",    label: en ? "Consult"   : "परामर्श", icon: Phone },
  { key: "records",         label: en ? "Records"   : "रिकॉर्ड", icon: FileText },
  { key: "emergency",       label: en ? "Emergency" : "आपातकाल", icon: AlertTriangle },
  { key: "locations",       label: en ? "Hospitals" : "अस्पताल", icon: MapPin },
]
// Dashboard only shown when user is logged in, via profile avatar top right
// Donation removed entirely
```

### Mobile bottom nav (add to layout):
```tsx
// Show only on mobile (md:hidden):
<nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-50">
  <div className="grid grid-cols-5 h-16">
    {mobileNavItems.map(item => (
      <button key={item.key} onClick={() => setCurrentPage(item.key)}
        className={`flex flex-col items-center justify-center gap-0.5 text-xs ${
          currentPage === item.key ? "text-blue-600" : "text-gray-500"
        }`}>
        <item.icon className="h-5 w-5" />
        <span>{item.label}</span>
      </button>
    ))}
  </div>
</nav>
```

---

## FIX 10 — Remove Donation Section

### Remove from:
1. `app/page.tsx` — delete `DonationSection` component and `case "donation":` route
2. `components/Header.tsx` — remove donation nav item (already done above)
3. `components/LandingPage.tsx` — remove donation card from services grid
4. `components/Footer.tsx` — remove donation link
5. `components/Dashboard.tsx` — remove "Donations Made" stat card

---

## EXECUTION ORDER

```
Priority 1 — Immediate (fixes broken login)
  → FIX 1: Google OAuth callback route + Supabase URL config
  → FIX 2: Role routing from DB
  → FIX 8: Consultation booking user check

Priority 2 — Core Flow (next)
  → FIX 5: Symptom Checker → AI Chat flow
  → FIX 6: AI Chat disease-only prompt
  → FIX 7: HealthInfoHub gating + more diseases

Priority 3 — UX + Structure
  → FIX 9: Navbar simplify + mobile bottom bar
  → FIX 10: Remove donation
  → FIX 3: Admin single login
  → FIX 4: Doctor request flow

Priority 4 — Backend
  → Doctor requests SQL + API route
  → Connect Directory to real providers table
  → Connect notifications to real DB
```

---

## SUPABASE SQL TO RUN NOW

```sql
-- 1. Add doctor_requests table
CREATE TABLE IF NOT EXISTS doctor_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  specialization text,
  license_number text,
  hospital text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

ALTER TABLE doctor_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_own_request" ON doctor_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "admin_manage_requests" ON doctor_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM patients WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 2. Indexes for performance (if not already added)
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider ON appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);

-- 3. Verify roles
SELECT email, role FROM public.patients ORDER BY role;
```

---

## FILES TO CREATE / MODIFY

| File | Action | Fix |
|------|--------|-----|
| `app/auth/callback/route.ts` | CREATE | OAuth callback handler |
| `app/api/doctor-requests/route.ts` | CREATE | Doctor request API |
| `app/page.tsx` | MODIFY | Role fetch from DB, symptomContext state, route gating |
| `components/Authentication.tsx` | MODIFY | redirectTo callback URL, staff login toggle, doctor request form |
| `components/Header.tsx` | MODIFY | Simplified nav, mobile bottom bar |
| `components/SymptomChecker.tsx` | MODIFY | AI chat button on result step, detailed symptoms |
| `components/AIConsultationChat.tsx` | MODIFY | Accept symptomContext, disease-only mode |
| `components/HealthInfoHub.tsx` | MODIFY | Add 20+ diseases, remove first aid/awareness tabs, accept symptomContext |
| `app/api/ai-chat/route.ts` | MODIFY | Disease-only system prompt |
| `app/api/appointments/route.ts` | MODIFY | Derive patient_id from session |
| `components/AdminDashboard.tsx` | MODIFY | Show doctor requests with approve/reject |
| `components/Footer.tsx` | MODIFY | Remove donation link |
| `components/LandingPage.tsx` | MODIFY | Remove donation card, fix hero image |
| `components/Dashboard.tsx` | MODIFY | Remove donation stat, add AI chat shortcut after symptom |

---

## WHAT NOT TO CHANGE

- Keep `patients.role` column in DB — doctor and admin roles stay in backend
- Keep `DoctorDashboard.tsx` and `AdminDashboard.tsx` — just connect to real data
- Keep Jitsi integration — it works fine
- Keep Supabase RLS policies — security is correct
- Keep `lib/rate-limit.ts` — add to more routes
- Keep `EmergencyModule.tsx` — works well
- Keep `MapView.tsx` — OpenStreetMap works fine
- Keep `CampLocations.tsx` — useful feature
- Keep `Directory.tsx` — connect to real providers table

---

*Generated June 2026 — RuralHealth Platform Action Plan*
