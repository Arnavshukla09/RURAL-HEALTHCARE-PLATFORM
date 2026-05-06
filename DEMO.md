# Rural Healthcare Platform - Demo Script

A complete walkthrough of the platform for professors and stakeholders. Expected duration: 10 minutes.

## Setup (1 min)

1. Open browser to the deployed URL
2. Show the multi-language selector (English/Hindi)
3. Demonstrate accessibility bar (font size, contrast)

## 1. Patient Signup & Login (2 min)

**Step 1.1**: Click "Sign Up"
- Email: `patient_demo@example.com`
- Password: `Demo@12345`
- Name: `Rajesh Kumar`
- Role: Select "Patient"
- Click "Sign Up"

**Show**: Confirmation email message, redirects to dashboard

**Step 1.2**: Login with created credentials
- Show the Patient Dashboard

## 2. Symptom Checker (1.5 min)

**Step 2.1**: Click "Symptom Checker" in navigation
**Step 2.2**: Select symptoms:
- Check: Fever, Cough, Shortness of Breath
- Duration: 3 days
- Click "Check Symptoms"

**Show**: 
- AI-powered symptom analysis
- Suggested conditions (Pneumonia, Cold, etc.)
- Severity indicator
- Recommendation: "Book appointment with provider"

## 3. Find Healthcare Providers (1 min)

**Step 3.1**: Click "Find Providers" or "Book Appointment"
**Step 3.2**: Show map view with facilities
- Zoom/pan around
- Click on facility marker
- Show bed availability, contact info

**Show**: 
- Multiple facilities from Overpass dataset
- Distance calculation
- Real-time availability

## 4. Appointment Booking (1.5 min)

**Step 4.1**: Click "Book Appointment" on any provider
**Step 4.2**: Fill appointment form:
- Select date: Tomorrow at 2 PM
- Reason: "Persistent fever and cough"
- Upload document (optional): Show file upload
- Click "Request Appointment"

**Show**: 
- Appointment confirmation
- Doctor info displayed
- Appointment added to calendar
- Status: "Pending Confirmation"

## 5. Video Consultation (Jitsi) (2 min)

**Step 5.1**: Click "Start Consultation" on a confirmed appointment
**Step 5.2**: Grant camera/mic permissions

**Show**:
- Jitsi meet room opens
- Patient can enable/disable video/audio
- Show features: chat, screen share, recording toggle
- Leave and show it's recorded in appointment history

## 6. Health Metrics & Records (1 min)

**Step 6.1**: Click "My Health" or "Health Data"
**Step 6.2**: Show:
- BP readings chart over time
- Heart rate trends
- Medical records uploaded
- Last visit notes

**Step 6.3**: Click "Add Health Data"
- Enter: BP 130/85, HR 78
- Save and show it updates the dashboard

## 7. Offline Functionality (1.5 min)

**Step 7.1**: Open browser DevTools (F12)
**Step 7.2**: Go to Network tab → Throttle to "Offline"
**Step 7.3**: While offline:
- Create new health data entry: "Heart Rate: 82 bpm"
- Try to create an appointment (will queue)
- Show entries appear in "Offline Queue" or "Pending Sync"

**Step 7.4**: Go back online (DevTools → Network → No throttle)
**Step 7.5**: Click "Sync Now" or wait auto-sync
- Show pending operations sync to server
- Show "Synced" badge

**Demo Note**: Explain offline-first architecture and store-and-forward for remote areas

## 8. Doctor View (1 min)

**Step 8.1**: Logout (top-right menu)
**Step 8.2**: Sign up/login as Doctor:
- Email: `doctor_demo@example.com`
- Role: "Healthcare Provider"

**Step 8.3**: Show Doctor Dashboard:
- List of pending appointments
- Patient queue
- Click appointment → View patient history

**Step 8.4**: Click "Start Consultation" on patient appointment
- Join video room (same Jitsi room)
- Show ability to write prescriptions
- Show notes field

## 9. Facility Manager View (1 min)

**Step 9.1**: Logout and login as Facility Manager:
- Email: `facility_demo@example.com`
- Role: "Healthcare Facility"

**Step 9.2**: Show Facility Dashboard:
- Bed availability management
- Staff list
- Appointment schedule
- Revenue/metrics

## 10. Data & Sync Summary (1 min)

**Show in browser DevTools:**
- IndexedDB → See local data storage
- Local Storage → See sync queue
- Network tab → Show API calls to `/api/sync/push` and `/api/sync/pull`

**Explain**: 
- All data synced to Supabase
- Offline operations queued and synced when online
- RLS policies ensure data privacy per user

## Q&A Tips

- **"How does it work offline?"** → Show IndexedDB storage, explain sync queue, demonstrate offline→online transition
- **"Is data private?"** → Show Supabase RLS policies in DB schema, explain row-level access control
- **"How is video handled?"** → Explain Jitsi Meet iframe integration, peer-to-peer for low bandwidth
- **"Can it scale?"** → Mention Supabase auto-scaling, CDN caching, and load testing approach
- **"Multi-language?"** → Show language toggle at top (switches English ↔ Hindi)

## Time Breakdown
- Setup: 1 min
- Authentication: 2 min
- Symptom Checker: 1.5 min
- Providers & Booking: 2.5 min
- Video Call: 2 min
- Health Data: 1 min
- Offline Demo: 1.5 min
- Provider/Facility Views: 2 min
- Data & Architecture: 1 min
- **Total: ~16 minutes** (with Q&A: 20 min)

## Troubleshooting Demo Issues

- **Jitsi won't load**: Check CORS and `NEXT_PUBLIC_JITSI_DOMAIN` env var
- **Offline not working**: Ensure Service Worker is registered (check DevTools → Application)
- **Sync hangs**: Check API routes are accessible; verify Supabase connection
- **No providers showing**: Run `npm run seed` to populate facilities
