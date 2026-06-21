# Execute These Steps Now

Follow these steps in order to get the platform running and verified.

## Step 1: Install Dependencies

\`\`\`bash
npm install
\`\`\`

**Expected**: All packages installed, no errors.

## Step 2: Configure Environment

\`\`\`bash
cp .env.example .env.local
\`\`\`

Then edit `.env.local` and add your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL` - From Supabase project settings
- `SUPABASE_SERVICE_ROLE_KEY` - From Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Supabase project settings

## Step 3: Create Database Tables

Go to your Supabase project dashboard → SQL Editor → create new query.

Copy and paste **each file** in order and click "Run":

### File 1: `scripts/001_create_tables.sql`
- Creates 8 tables (patients, providers, appointments, medical_records, health_data, notifications, offline_sync_log, healthcare_providers)
- Enables Row Level Security
- Creates RLS policies

### File 2: `scripts/002_create_trigger.sql`
- Creates trigger to auto-create patient profile on signup

### File 3: `scripts/003_create_helper_functions.sql`
- Creates `get_tables()` helper function

**Expected**: All 3 scripts run without errors (ignore "already exists" warnings).

## Step 4: Start Backend Server

\`\`\`bash
npm run dev
\`\`\`

**Expected**: Server starts on port 3000
\`\`\`
✓ compiled client and server successfully
ready - started server on 0.0.0.0:3000
\`\`\`

Leave this terminal running!

## Step 5: Verify Database (New Terminal)

\`\`\`bash
node scripts/verify_migrations.js
\`\`\`

**Expected Output**:
\`\`\`
[VERIFY] Checking database tables...

✅ Table "patients": OK (0 records)
✅ Table "healthcare_providers": OK (0 records)
✅ Table "appointments": OK (0 records)
✅ Table "medical_records": OK (0 records)
✅ Table "health_data": OK (0 records)
✅ Table "notifications": OK (0 records)
✅ Table "offline_sync_log": OK (0 records)
✅ Table "healthcare_providers": OK (0 records)

[VERIFY] ✅ Migration check finished
\`\`\`

## Step 6: Seed Demo Data

\`\`\`bash
node scripts/seed_facilities.js
\`\`\`

**Expected Output**:
\`\`\`
[SEED] Fetching facilities from Overpass API...
[SEED] Found 50 healthcare facilities
[SEED] Facilities saved to seeds/facilities.json
[SEED] Complete: 50 facilities ready
\`\`\`

Or if Overpass API times out:
\`\`\`
[SEED] Using fallback demo facilities
[SEED] Complete: 3 facilities ready
\`\`\`

**Result**: Either way, facilities are ready! ✅

## Step 7: Run Sanity Tests

\`\`\`bash
node scripts/sanity_test.js
\`\`\`

**Expected Output**:
\`\`\`
[SANITY] Starting Rural Healthcare Platform tests

--- Test 1: Health Check ---
✅ Health endpoint accessible

--- Test 2: Authentication ---
✅ Patient signup

--- Test 3: Symptom Checker ---
✅ Symptom check endpoint

--- Test 4: Provider Discovery ---
✅ Provider discovery

--- Test 5: Appointment Management ---
✅ Appointment creation

--- Test 6: Offline Sync ---
✅ Offline sync push

--- Test 7: Medical Records ---
✅ Medical records retrieval

--- Test 8: Health Data ---
✅ Health data submission

--- Test Summary ---
✅ Passed: 8
❌ Failed: 0
Total: 8

[SANITY] Results saved to test-results.json
\`\`\`

## Success Criteria

✅ All 3 SQL scripts run without errors
✅ Verify script shows 8 tables OK
✅ Seed script shows facilities ready
✅ Sanity tests show 8/8 passing
✅ Server running on http://localhost:3000

## If Something Goes Wrong

### Error: "Missing Supabase credentials"

**Fix**: 
1. Check `.env.local` file
2. Verify credentials from Supabase dashboard → Settings → API
3. Restart server: `npm run dev`

### Error: "RPC call to get_tables failed"

**Fix**: This is OK! The script automatically falls back to checking tables individually. Just verify that all 8 tables appear as "✅ OK".

### Error: "Cannot connect to localhost:3000"

**Fix**:
1. Ensure server is running: `npm run dev` in Terminal 1
2. Server should show: `ready - started server on 0.0.0.0:3000`
3. Wait 5 seconds after startup before running tests

### Error: "Overpass API timeout"

**Fix**: This is OK! The seed script automatically uses fallback demo facilities.

## Next Steps After Success

1. **View the frontend**: Open http://localhost:3000 in browser
2. **Read the demo script**: See `DEMO.md` for walkthrough
3. **Deploy to production**: See `DEPLOYMENT_GUIDE.md`
4. **Review known issues**: See `ISSUES_AND_FIXES.md`

## Files Reference

- `SETUP_INSTRUCTIONS.md` - Detailed setup guide
- `QUICK_COMMANDS.md` - Command reference
- `DEMO.md` - Step-by-step demo for professors
- `DEPLOYMENT_GUIDE.md` - Production deployment
- `ISSUES_AND_FIXES.md` - Known issues and solutions
