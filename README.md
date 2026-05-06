# Rural Healthcare Platform

A comprehensive offline-first telemedicine platform designed for rural healthcare delivery in India, featuring patient-doctor consultations, symptom checking, appointment management, and real-time health monitoring.

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Supabase project (free tier supported)
- Jitsi Meet (optional, for video consultations)

### Installation

\`\`\`bash
# Clone repository
git clone <repo-url>
cd rural-healthcare-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run migrations (one-time)
npm run seed

# Start development server
npm run dev
\`\`\`

**Environment Variables (.env.local):**
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_JITSI_DOMAIN=meet.jitsi.com
API_URL=http://localhost:3000
\`\`\`

### Verify Setup

\`\`\`bash
# Run all verification and sanity tests
npm run verify

# Or individually:
npm run seed              # Populate facilities from Overpass
npm test                  # Run sanity tests
npm run lint              # Run ESLint
\`\`\`

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy:

\`\`\`bash
npm run build
vercel deploy --prod
\`\`\`

### Manual Deployment

\`\`\`bash
# Build for production
npm run build

# Start production server
npm start

# Use PM2 for process management (optional)
pm2 start npm --name "healthcare-platform" -- run dev
\`\`\`

## Architecture

- **Frontend**: React 18 + Vite (Offline-first with IndexedDB)
- **Backend**: Next.js API routes + Supabase PostgreSQL
- **Real-time**: Supabase Realtime subscriptions
- **Video**: Jitsi Meet for teleconsultations
- **Storage**: Supabase Storage for medical documents
- **Sync**: Store-and-forward pattern for offline operations

## Key Features

### For Patients
- Multi-language support (English, Hindi)
- Symptom checker with AI-powered suggestions
- Appointment booking with available providers
- Video consultations (Jitsi integration)
- Medical records access
- Health metrics tracking
- Offline symptom logging

### For Doctors
- Patient appointment queue
- Video consultation initiation
- Prescription writing
- Medical record updates
- Patient health history review

### For Healthcare Facilities
- Facility registration
- Bed availability tracking
- Staff management
- Consultation history

### Offline-First
- Local IndexedDB storage
- Automatic sync on connection restore
- Optimistic UI updates
- Queue-based operation tracking

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PATCH /api/appointments/:id` - Update appointment

### Medical Data
- `GET /api/medical-records` - Get medical records
- `POST /api/medical-records` - Add medical record
- `GET /api/health-data` - Get health metrics
- `POST /api/health-data` - Submit health data

### Providers
- `GET /api/providers` - Find providers
- `GET /api/providers/:id` - Get provider details

### Sync
- `POST /api/sync/push` - Push offline operations
- `GET /api/sync/pull` - Pull server updates

### Notifications
- `GET /api/notifications` - List notifications
- `POST /api/notifications/mark-read` - Mark as read

## Testing

\`\`\`bash
# Run verification suite
npm run verify

# Run individual sanity tests
npm test

# Run linting
npm run lint
\`\`\`

Test results are saved to `test-results.json`

## Known Issues & Fixes

**Issue**: Offline sync not triggering on reconnection
**Fix**: Check browser IndexedDB in DevTools; ensure service worker is registered

**Issue**: Jitsi room fails to load
**Fix**: Verify `NEXT_PUBLIC_JITSI_DOMAIN` is set; check browser console for CORS errors

**Issue**: Supabase RLS policies blocking requests
**Fix**: Ensure user is authenticated; check RLS policies in Supabase console

## Demo Script

See `DEMO.md` for step-by-step demo instructions.

## Support

- Check logs: `npm run lint` for syntax issues
- Test API: `npm test` for endpoint verification
- DB issues: Check Supabase console for migration errors
- Frontend issues: Check browser DevTools console

## License

MIT

## Attribution

Built with shadcn/ui, Radix UI, Tailwind CSS, and Supabase.
