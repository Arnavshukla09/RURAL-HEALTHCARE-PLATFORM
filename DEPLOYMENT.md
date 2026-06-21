# Rural Healthcare Platform - Deployment Guide

## Environment Variables Setup

### Supabase Configuration
The following environment variables are required for Supabase integration:

**Public Variables (NEXT_PUBLIC_):**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

**Private Variables:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for server operations
- `SUPABASE_JWT_SECRET` - JWT secret for token validation

**Database Configuration:**
- `POSTGRES_URL` - PostgreSQL connection string
- `POSTGRES_PRISMA_URL` - Prisma connection string
- `POSTGRES_URL_NON_POOLING` - Non-pooling connection (for migrations)
- `POSTGRES_USER` - Database user
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DATABASE` - Database name
- `POSTGRES_HOST` - Database host

### Jitsi Configuration (Optional)
- `NEXT_PUBLIC_JITSI_DOMAIN` - Jitsi Meet domain (defaults to meet.jit.si)

### Development Variables
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` - Redirect URL for email confirmations during development

## Deployment Steps

### 1. Vercel Deployment

#### Prerequisites
- Vercel account
- GitHub repository with the code

#### Steps
\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Connect to GitHub repository
# Follow prompts to configure environment variables
\`\`\`

#### Configure Environment Variables in Vercel Dashboard
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all required environment variables listed above
4. Redeploy after adding variables

### 2. Database Migrations

After deployment, run the database setup scripts:

\`\`\`bash
# Create tables and setup RLS policies
# Use Supabase dashboard SQL editor or:
psql -U <POSTGRES_USER> -h <POSTGRES_HOST> -d <POSTGRES_DATABASE> -f scripts/001_create_tables.sql
psql -U <POSTGRES_USER> -h <POSTGRES_HOST> -d <POSTGRES_DATABASE> -f scripts/002_create_trigger.sql
\`\`\`

### 3. Email Configuration

Configure email settings in Supabase:
1. Go to Authentication > Email Templates
2. Configure email confirmation template
3. Set up SMTP settings if using custom SMTP

### 4. Security Configuration

#### Enable Row Level Security (RLS)
All tables already have RLS enabled. Verify:
- In Supabase dashboard, go to Databases > Tables
- Confirm RLS is enabled for all tables

#### Configure Authentication Settings
1. Go to Authentication > Providers
2. Configure allowed redirect URLs
3. Set email templates

#### API Security
- All API routes check for authenticated user
- Server-side Supabase client used for all database operations
- JWT validation via middleware

### 5. Production Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies verified
- [ ] Email confirmation working
- [ ] Jitsi Meet domain configured (if using custom instance)
- [ ] CORS settings configured if needed
- [ ] SSL certificates installed
- [ ] Database backups configured
- [ ] Monitoring and logging setup
- [ ] Rate limiting configured

## Health Monitoring

### Key Metrics to Monitor
1. API response times
2. Database query performance
3. Authentication success rates
4. Offline sync success rates
5. Jitsi video conference quality

### Logging
All API routes log errors to console. Consider integrating with:
- Vercel Analytics
- Sentry for error tracking
- LogRocket for session replay

## Troubleshooting

### Email Confirmation Not Working
- Check `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` for development
- Verify SMTP settings in Supabase
- Check email templates in Supabase dashboard

### Database Connection Issues
- Verify connection strings are correct
- Check network access rules
- Ensure database is running

### Jitsi Meet Issues
- If using public meet.jit.si, no configuration needed
- For custom instance, set `NEXT_PUBLIC_JITSI_DOMAIN`
- Ensure domain is accessible and CORS configured

### Offline Sync Issues
- Check browser local storage quota
- Verify API endpoint accessibility when online
- Check operation logging in browser console

## Rollback Procedure

To rollback to a previous version:

\`\`\`bash
# Using Vercel CLI
vercel rollback

# Or redeploy previous commit
git checkout <previous-commit>
git push
\`\`\`

## Performance Optimization

1. **Database Indexing** - Already configured in migration scripts
2. **Caching** - Implement Redis for session management
3. **CDN** - Vercel automatically serves static assets globally
4. **Image Optimization** - Use Next.js Image component
5. **Code Splitting** - Handled automatically by Next.js

## Support

For issues during deployment:
1. Check Vercel deployment logs
2. Review Supabase dashboard logs
3. Check browser console for client-side errors
4. Review API response status codes
