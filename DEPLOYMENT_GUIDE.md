# Deployment Guide - Rural Healthcare Platform

## Prerequisites
- Node.js 16+ and npm
- Supabase account (free tier works)
- GitHub repository (for Vercel deployment)
- Environment variables ready

## 1. Local Development Setup

### Clone & Install
\`\`\`bash
git clone <your-repo-url>
cd rural-healthcare-platform
npm install
\`\`\`

### Configure Environment
\`\`\`bash
cp .env.example .env.local

# Edit .env.local with your Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, etc.
\`\`\`

### Run Migrations & Seed
\`\`\`bash
# 1. Execute database migrations
npm run seed

# 2. Verify database setup
npm run verify:db

# 3. Run all tests
npm run verify:full
\`\`\`

### Start Development Server
\`\`\`bash
npm run dev
# Open http://localhost:5173 (Vite) or http://localhost:3000 (if using Next.js)
\`\`\`

## 2. Supabase Setup (Required)

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Click "New Project"
3. Select region closest to India (Singapore or Mumbai)
4. Save project credentials

### Step 2: Execute Database Migrations
\`\`\`bash
# In Supabase Dashboard → SQL Editor:

-- 1. Copy & paste contents of scripts/001_create_tables.sql
-- 2. Execute
-- 3. Copy & paste contents of scripts/002_create_trigger.sql
-- 4. Execute

# Or use Supabase CLI:
npm install -g supabase
supabase db push
\`\`\`

### Step 3: Verify Database
\`\`\`bash
npm run verify:db
\`\`\`

Expected output:
\`\`\`
✅ Table "users": OK
✅ Table "profiles": OK
✅ Table "patients": OK
✅ Table "healthcare_providers": OK
✅ Table "appointments": OK
✅ Table "medical_records": OK
✅ Table "health_data": OK
✅ Table "notifications": OK
✅ Table "offline_sync_log": OK
\`\`\`

## 3. Seed Data & Testing

### Populate Facilities
\`\`\`bash
npm run seed

# Output: Creates seeds/facilities.json with 3+ demo healthcare facilities
\`\`\`

### Run Sanity Tests
\`\`\`bash
npm run test

# Tests:
# ✅ Health check
# ✅ Patient signup
# ✅ Symptom checker
# ✅ Provider discovery
# ✅ Appointment creation
# ✅ Offline sync
# ✅ Medical records
# ✅ Health data submission
\`\`\`

### Run Linting
\`\`\`bash
npm run lint
\`\`\`

### Full Verification
\`\`\`bash
npm run verify:full

# Runs: lint → seed → verify:db → test
\`\`\`

## 4. Vercel Deployment

### Connect to Vercel

1. **Push code to GitHub**
   \`\`\`bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   \`\`\`

2. **Import project to Vercel**
   - Go to https://vercel.com/new
   - Select your GitHub repository
   - Click "Import"

3. **Configure Environment Variables**
   - In Vercel Dashboard → Settings → Environment Variables
   - Add all variables from `.env.example`:
     \`\`\`
     NEXT_PUBLIC_SUPABASE_URL=...
     NEXT_PUBLIC_SUPABASE_ANON_KEY=...
     SUPABASE_SERVICE_ROLE_KEY=...
     NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si
     API_URL=https://your-deployment-url.vercel.app
     \`\`\`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)

### Post-Deployment Verification

\`\`\`bash
# Test live deployment
curl https://your-deployment-url.vercel.app/api/health

# Should return 200 OK
\`\`\`

## 5. Domain Configuration

### Add Custom Domain (Optional)

1. In Vercel Dashboard → Domains
2. Add your domain
3. Configure DNS records per Vercel instructions
4. Update \`API_URL\` to new domain

### SSL/TLS

- Automatically provided by Vercel
- Certificates auto-renew

## 6. Monitoring & Maintenance

### Check Deployment Status
\`\`\`bash
# View deployment logs in Vercel Dashboard
# Settings → Deployments

# Or use Vercel CLI:
npm install -g vercel
vercel logs <project-name>
\`\`\`

### Monitor Supabase
- Go to https://supabase.com → Project Dashboard
- Check Database → Realtime status
- Monitor Authentication → Users
- Check Storage → Uploaded files

### Performance Monitoring
- Set up Sentry: Add SENTRY_DSN to env vars
- Enable Vercel Analytics: Add to layout.tsx
- Check Supabase Postgres metrics

## 7. Backup & Recovery

### Database Backup
\`\`\`bash
# Supabase handles automated daily backups
# Access in Dashboard → Backups

# Manual backup (export data):
# Dashboard → SQL Editor → Download query results
\`\`\`

### Code Backup
\`\`\`bash
# GitHub automatically backs up all commits
# To restore: git revert <commit-hash>
\`\`\`

## 8. Troubleshooting

### Build Fails
\`\`\`bash
# Check build logs in Vercel Dashboard
# Common issues:
# - Missing env vars → Add to Vercel dashboard
# - Dependency version conflict → Run npm install locally first
# - TypeScript errors → Run npm run build locally to debug
\`\`\`

### API Routes Not Working
\`\`\`bash
# Verify:
1. Environment variables are set in Vercel
2. Supabase credentials are correct
3. Database migrations executed
4. Check Vercel function logs: Dashboard → Deployment → Functions
\`\`\`

### Supabase Connection Issues
\`\`\`bash
# Test connection:
npm run verify:db

# If fails:
1. Check SUPABASE_URL and keys in .env
2. Verify Supabase project is running
3. Check network policies (Vercel IP whitelist)
\`\`\`

### Offline Sync Not Working
\`\`\`bash
# Ensure:
1. Service Worker registered (browser DevTools → Application)
2. IndexedDB available (check DevTools → Storage)
3. Check browser console for errors
# Reset: Clear LocalStorage & IndexedDB, restart app
\`\`\`

## 9. Performance Optimization

### Caching Strategy
\`\`\`bash
# Enable edge caching for API responses
# In next.config.mjs:
headers: {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120"
}
\`\`\`

### Database Optimization
\`\`\`sql
-- Add indexes for common queries
CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_health_data_user ON health_data(user_id);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
\`\`\`

### Image Optimization
- Use Next.js Image component
- Enable automatic format conversion (AVIF, WebP)
- Set responsive sizes

## 10. Rollback Plan

### If Deployment Breaks Production

\`\`\`bash
# Option 1: Revert to previous deployment (Vercel Dashboard)
1. Go to Deployments
2. Find last working deployment
3. Click "..." → Promote to Production

# Option 2: Rollback code
git revert <breaking-commit>
git push origin main
# New deployment will automatically trigger

# Option 3: Manual hotfix
git checkout -b hotfix/critical-issue
# Fix the issue
git push origin hotfix/critical-issue
# Create Pull Request and merge
\`\`\`

## Summary Checklist

- [ ] Local development works (npm run dev)
- [ ] Database migrations executed (npm run verify:db)
- [ ] Seed data loaded (npm run seed)
- [ ] All tests pass (npm run verify:full)
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] All env vars added to Vercel
- [ ] Deployment successful
- [ ] Live API endpoints tested
- [ ] Custom domain configured (optional)
\`\`\`
