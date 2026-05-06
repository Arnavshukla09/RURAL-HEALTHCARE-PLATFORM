# Quick Reference: All Run Commands

## Development
\`\`\`bash
npm run dev          # Start dev server (Vite on :5173)
npm run build        # Build for production
npm run preview      # Preview production build
\`\`\`

## Database & Seeds
\`\`\`bash
npm run seed         # Populate facilities from Overpass API
npm run verify:db    # Check database migrations status
\`\`\`

## Testing & Quality
\`\`\`bash
npm run test         # Run sanity tests
npm run lint         # Run ESLint
npm run verify       # Run seed + verify:db + test
npm run verify:full  # Run lint + verify (complete check)
\`\`\`

## Full Setup (Fresh Start)
\`\`\`bash
npm install                    # Install dependencies
cp .env.example .env.local     # Setup env vars
npm run verify:full            # Complete verification
npm run dev                    # Start dev server
\`\`\`

## Deployment
\`\`\`bash
npm run build                  # Build for production
vercel deploy                  # Deploy to Vercel staging
vercel deploy --prod           # Deploy to production
\`\`\`

## Testing Workflows

### Full Workflow Test
\`\`\`bash
npm run verify:full
# Output: lint results → seed results → DB verification → test results
\`\`\`

### Quick API Test
\`\`\`bash
npm run test
# Output: 8 sanity tests with pass/fail, saved to test-results.json
\`\`\`

### Database Only
\`\`\`bash
npm run seed && npm run verify:db
# Output: facilities populated, tables verified
\`\`\`

## Environment Setup

\`\`\`bash
# Copy template
cp .env.example .env.local

# Edit with your credentials
nano .env.local  # or use your preferred editor

# Required values:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - All others have defaults
\`\`\`

## Debugging

\`\`\`bash
# Check for errors
npm run lint

# Test database connection
npm run verify:db

# Run API tests
npm run test

# Check file structure
find . -name "*.ts" -o -name "*.tsx" | head -20
\`\`\`

## CI/CD Integration

\`\`\`bash
# For GitHub Actions or similar:
npm run verify:full

# This will:
# 1. Lint code (exit 0 on success)
# 2. Seed facilities
# 3. Verify database
# 4. Run sanity tests
# 5. Generate test-results.json
\`\`\```
