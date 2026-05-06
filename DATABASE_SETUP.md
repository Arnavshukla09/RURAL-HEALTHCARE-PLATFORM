# Database Setup Instructions

## Quick Start

### For Development
1. Create a Supabase project at https://supabase.com
2. Copy the project URL and API key
3. Run the migration scripts from the `scripts/` directory using the Supabase SQL editor or:

\`\`\`bash
psql -U postgres -h your_host -d rural_healthcare -f scripts/001_create_tables.sql
psql -U postgres -h your_host -d rural_healthcare -f scripts/002_create_trigger.sql
\`\`\`

### For Production
1. Use the same Supabase project or create a new one
2. Ensure database backups are enabled
3. Run migrations using the production database connection

## Data Structure

### Core Tables

#### patients
- Stores patient/user profiles
- References auth.users(id)
- Contains personal health information

#### providers
- Stores healthcare provider profiles
- References auth.users(id)
- Contains specialization and verification info

#### appointments
- Links patients and providers
- Tracks consultation type and status
- Stores Jitsi room ID for video calls

#### medical_records
- Stores patient medical documents
- Associated with appointments
- Contains diagnoses, prescriptions, lab results

#### health_data
- Time-series vital signs and measurements
- Blood pressure, heart rate, temperature, weight
- Used for health tracking and analytics

#### offline_sync_log
- Tracks offline operations for syncing
- Ensures data consistency
- Helps debug sync issues

#### notifications
- User notifications for appointments, results, alerts
- Read/unread status tracking

## Row Level Security (RLS)

All tables have RLS enabled with policies:
- Patients can only see their own data
- Providers can only see their own profiles and assigned patients
- Bidirectional access for appointments

Verify RLS status:
\`\`\`sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
\`\`\`

## Backup and Recovery

### Automated Backups
- Supabase provides daily backups
- Retention: 7 days for free tier, 30+ days for paid

### Manual Backup
\`\`\`bash
pg_dump -U postgres -h your_host rural_healthcare > backup.sql
\`\`\`

### Restore
\`\`\`bash
psql -U postgres -h your_host -d rural_healthcare < backup.sql
\`\`\`

## Performance Tuning

### Indexes
Indexes are created automatically in the migration scripts for:
- user_id columns
- created_at timestamps
- status fields

### Query Optimization
- Use indexed columns in WHERE clauses
- Paginate large result sets
- Use LIMIT clauses when appropriate

## Monitoring

Monitor database health:
1. Check connection count
2. Monitor query performance
3. Monitor storage usage
4. Review slow query logs

In Supabase dashboard:
- Home tab shows overview
- Database tab shows current connections
- Logs tab shows activity
