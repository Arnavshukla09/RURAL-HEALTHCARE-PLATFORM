# Quick Command Reference

## Setup (First Time)

\`\`\`bash
npm install
cp .env.example .env.local
# Edit .env.local with Supabase credentials
\`\`\`

## Database Setup (One Time)

In Supabase SQL Editor, run these scripts in order:
1. `scripts/001_create_tables.sql` - Main tables
2. `scripts/002_create_trigger.sql` - Auto profile trigger
3. `scripts/003_create_helper_functions.sql` - Helper functions

## Running the Platform

\`\`\`bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Verify database
node scripts/verify_migrations.js

# Terminal 2: Seed demo data
node scripts/seed_facilities.js

# Terminal 2: Run tests
node scripts/sanity_test.js
\`\`\`

## Development

\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Check code quality
\`\`\`

## Deployment

\`\`\`bash
# To Vercel
vercel deploy --prod

# Or manually
npm run build
npm start
\`\`\`

## Debugging

\`\`\`bash
# Check database tables
node scripts/verify_migrations.js

# View test results
cat test-results.json

# Check server logs
# Look at terminal where npm run dev is running
\`\`\`

## Common Issues

| Issue | Fix |
|-------|-----|
| "Missing Supabase credentials" | Update .env.local with correct values from Supabase dashboard |
| "Cannot POST /api/health" | Ensure server is running: npm run dev |
| "RPC call to get_tables failed" | This is OK - script will check tables individually |
| "Overpass API timeout" | Script will use fallback demo facilities |

## URLs (When Running Locally)

- Frontend: http://localhost:3000
- API: http://localhost:3000/api
- Supabase Dashboard: https://supabase.com/dashboard
