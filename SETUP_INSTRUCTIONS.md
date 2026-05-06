# Rural Healthcare Platform - Setup Instructions

## Prerequisites

- Node.js 18+ and npm/pnpm installed
- Supabase project created and linked
- Environment variables configured (.env.local)

## Step 1: Initial Setup

\`\`\`bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=your_url
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# API_URL=http://localhost:3000
\`\`\`

## Step 2: Create Database Tables & Functions

### Option A: Using Supabase Dashboard (Manual)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query and run each SQL file in order:
   - `scripts/001_create_tables.sql` - Creates all 8 core tables with RLS policies
   - `scripts/002_create_trigger.sql` - Creates auto-profile trigger for new signups
   - `scripts/003_create_helper_functions.sql` - Creates helper function for verification

### Option B: Using CLI (Automated - Recommended)

\`\`\`bash
# Set Supabase environment variables first
export SUPABASE_URL="your_url"
export SUPABASE_SERVICE_ROLE_KEY="your_key"

# Run migration script (coming soon in updated flow)
npm run db:migrate
\`\`\`

## Step 3: Start Backend Server

\`\`\`bash
# Start Next.js development server on port 3000
npm run dev

# Server will be available at:
# - Frontend: http://localhost:3000
# - API: http://localhost:3000/api
\`\`\`

## Step 4: Verify Database Setup

\`\`\`bash
# Run verification to check all tables are created
node scripts/verify_migrations.js

# Expected output:
# ✅ Table "users": OK
# ✅ Table "profiles": OK
# ✅ Table "patients": OK
# ✅ Table "healthcare_providers": OK
# ✅ Table "appointments": OK
# ✅ Table "medical_records": OK
# ✅ Table "health_data": OK
# ✅ Table "notifications": OK
# ✅ Table "offline_sync_log": OK
# ✅ Migration check finished
\`\`\`

## Step 5: Seed Demo Data

\`\`\`bash
# Populate facilities from Overpass API (with fallback demo data)
node scripts/seed_facilities.js

# Expected output:
# [SEED] Fetching facilities from Overpass API...
# [SEED] Found 50 healthcare facilities
# [SEED] Facilities saved to seeds/facilities.json
# [SEED] Complete: 50 facilities ready
\`\`\`

## Step 6: Run Sanity Tests

\`\`\`bash
# Run all automated tests (requires server running on port 3000)
node scripts/sanity_test.js

# Expected output:
# --- Test 1: Health Check ---
# ✅ Health endpoint accessible
# 
# --- Test 2: Authentication ---
# ✅ Patient signup
# 
# ... 6 more tests ...
#
# --- Test Summary ---
# ✅ Passed: 8
# ❌ Failed: 0
# Total: 8
\`\`\`

## Quick Start (All in One)

\`\`\`bash
# 1. Install and setup env
npm install && cp .env.example .env.local

# 2. Run database migrations (via Supabase dashboard for now)
# Manual: SQL Editor → Copy/paste each script file in order

# 3. Start server
npm run dev &

# 4. In a new terminal, verify & seed
node scripts/verify_migrations.js
node scripts/seed_facilities.js
node scripts/sanity_test.js
\`\`\`

## Troubleshooting

### Error: "The "lucide-react" module does not provide an export named "Hospital""

**Solution**: This has been fixed. Update to the latest code where `Hospital` icon is replaced with `Building2`.

\`\`\`bash
git pull origin main
npm install
\`\`\`

### Error: "Missing Supabase credentials"

**Solution**: Check your `.env.local` file contains:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
\`\`\`

Get these from your Supabase project settings → API.

### Error: "Cannot POST /api/health"

**Solution**: Ensure the server is running:

\`\`\`bash
# Terminal 1
npm run dev

# Terminal 2 (in another terminal)
node scripts/sanity_test.js
\`\`\`

### Error: "RPC call to get_tables failed"

**Solution**: Run the helper function creation SQL:

\`\`\`bash
# In Supabase SQL Editor:
# Copy and paste: scripts/003_create_helper_functions.sql
\`\`\`

The verify script will automatically fall back to checking tables individually if this function doesn't exist.

### Error: "Overpass API timeout"

**Solution**: The seed script uses fallback demo facilities automatically if Overpass API is unavailable or rate-limited.

## Database Schema

### Users (Supabase Auth)
- Managed by Supabase Auth
- Linked to profiles via user_id

### Patients
- Patient-specific information
- Linked to health_data and medical_records

### Healthcare Providers
- Provider profiles
- Specialization and verification status

### Appointments
- Bookings between patients and providers
- Includes Jitsi room ID for video consultations

### Medical Records
- Patient health history
- Created by providers during/after appointments

### Health Data
- Vital signs and measurements (blood pressure, heart rate, etc)
- Recorded by patients or providers

### Notifications
- User notifications for appointments, results, alerts
- Read/unread status

### Offline Sync Log
- Tracks operations during offline mode
- Synced when connection restored

## API Endpoints

All endpoints require authentication except `/api/health` and `/api/providers`.

- `GET /api/health` - Server health check
- `POST /api/appointments` - Create appointment
- `GET /api/appointments` - List user's appointments
- `POST /api/medical-records` - Create medical record
- `GET /api/medical-records` - List patient's records
- `POST /api/health-data` - Submit health data
- `GET /api/health-data` - List patient's health data
- `GET /api/providers` - Discover healthcare providers
- `POST /api/notifications` - Create notification
- `GET /api/notifications` - List user's notifications
- `POST /api/offline-sync/push` - Push offline changes
- `GET /api/offline-sync/pull` - Pull server changes
- `POST /api/teleconsult/room` - Create Jitsi room

## Environment Variables

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Jitsi (Optional - for video consultations)
NEXT_PUBLIC_JITSI_DOMAIN=your_jitsi_domain
NEXT_PUBLIC_JITSI_APP_ID=your_app_id

# Application
API_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_VIDEO=true
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true
NEXT_PUBLIC_ENABLE_SYMPTOM_CHECKER=true
\`\`\`

## Next Steps

1. Deploy to Vercel: `vercel deploy --prod`
2. Add monitoring: Sentry integration for error tracking
3. Add analytics: Segment or Mixpanel for usage tracking
4. Setup CI/CD: GitHub Actions for automated testing

## Support

For issues or questions:
1. Check ISSUES_AND_FIXES.md for known issues
2. Review test results: `cat test-results.json`
3. Check server logs: `npm run dev` output
