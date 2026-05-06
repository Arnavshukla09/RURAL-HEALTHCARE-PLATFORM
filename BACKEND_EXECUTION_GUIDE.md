# Backend Execution Guide

## Prerequisites
Ensure you have:
- Node.js 18+ installed
- Supabase credentials in `.env.local` (see `.env.example`)
- Internet connection for Overpass API (seed script)

## Step 1: Start the Development Server

\`\`\`bash
npm ci
PORT=3000 npm run dev
\`\`\`

**Expected output:**
\`\`\`
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
\`\`\`

Keep this terminal running. The backend will be accessible at **http://localhost:3000**

---

## Step 2: Verify Database Migrations

In a new terminal, run:

\`\`\`bash
node scripts/verify_migrations.js
\`\`\`

**Expected output:**
\`\`\`
[VERIFY] Checking database tables...

✅ Table "users": OK (N records)
✅ Table "profiles": OK (N records)
✅ Table "patients": OK (N records)
✅ Table "healthcare_providers": OK (N records)
✅ Table "appointments": OK (0 records)
✅ Table "medical_records": OK (0 records)
✅ Table "health_data": OK (0 records)
✅ Table "notifications": OK (0 records)
✅ Table "offline_sync_log": OK (0 records)

[VERIFY] ✅ Migration check finished
\`\`\`

**If it fails with "RPC call to get_tables failed":**
- This is OK - the script has fallback logic to check tables individually
- The function `get_tables()` is defined in `scripts/003_create_helper_functions.sql`
- Optional: Run this SQL in Supabase dashboard to enable the RPC call:
  \`\`\`sql
  CREATE OR REPLACE FUNCTION public.get_tables()
  RETURNS TABLE(table_name text) AS $$
  BEGIN
    RETURN QUERY
    SELECT t.table_name::text
    FROM information_schema.tables t
    WHERE t.table_schema = 'public';
  END;
  $$ LANGUAGE plpgsql;
  \`\`\`

---

## Step 3: Seed Demo Facilities

Run with a small bounding box (rural area near Delhi):

\`\`\`bash
node scripts/seed_facilities.js --bbox "23.0,77.0,23.1,77.1"
\`\`\`

**Expected output:**
\`\`\`
[SEED] Starting facility seed with bbox: 23.0,77.0,23.1,77.1
[SEED] Querying Overpass API for healthcare facilities...
[SEED] Found N facilities
[SEED] Inserted N new facilities
[SEED] ✅ Seeding complete
\`\`\`

**Note:** If Overpass API fails or times out, the script falls back to 3 demo facilities:
- All India Institute of Medical Sciences (AIIMS), Delhi
- Max Super Specialty Hospital, Delhi
- Apollo Hospital, Delhi

---

## Step 4: Run Sanity Tests

\`\`\`bash
node scripts/sanity_test.js
\`\`\`

**Expected output:**
\`\`\`
[TEST] Running sanity tests...

✅ Test 1/8: Health endpoint accessible
✅ Test 2/8: Patient signup
✅ Test 3/8: Symptom checker
✅ Test 4/8: Provider discovery
✅ Test 5/8: Appointment creation
✅ Test 6/8: Offline sync push
✅ Test 7/8: Medical records retrieval
✅ Test 8/8: Health data submission

[TEST] ✅ All 8 tests passed (100%)
\`\`\`

---

## Backend Verification Summary

Run this for a quick report:

\`\`\`bash
npm run verify:db
\`\`\`

---

## All-in-One Verification

To run all three checks in sequence:

\`\`\`bash
npm run verify:db && npm run seed && npm run test
\`\`\`

Or with bbox for seed:

\`\`\`bash
npm run verify:db && node scripts/seed_facilities.js --bbox "23.0,77.0,23.1,77.1" && npm run test
\`\`\`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Missing Supabase credentials" | Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` |
| "Port 3000 already in use" | Kill existing process: `lsof -ti:3000 \| xargs kill -9` |
| "Overpass API timeout" | Script falls back to demo facilities automatically |
| RPC "get_tables" error | Run the optional SQL above, or just let it use the fallback table check |
| Tests fail with 401 | Ensure Supabase auth is working - check database RLS policies |

---

## Expected Results

After all steps complete, you should have:

1. ✅ Backend server running on http://localhost:3000
2. ✅ All 9 database tables verified
3. ✅ 50+ demo healthcare facilities seeded (or 3 fallback)
4. ✅ 8/8 sanity tests passing
5. ✅ Ready for frontend testing

---

## Backend URL

Once running, the backend is available at:

\`\`\`
http://localhost:3000
\`\`\`

All API endpoints are accessible:
- POST /api/auth/signup
- POST /api/auth/login
- GET /api/appointments
- POST /api/appointments
- GET /api/medical-records
- POST /api/health-data
- GET /api/providers
- POST /api/notifications
- POST /api/offline-sync/push
- GET /api/teleconsult/room

---

## Next Steps

1. Copy the commands above
2. Run them in your terminal
3. Paste the output here
4. I'll verify all results and confirm the system is ready
