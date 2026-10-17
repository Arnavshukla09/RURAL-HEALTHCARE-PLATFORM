const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const doctorPassword = process.env.E2E_DOCTOR_PASSWORD;
const patientPassword = process.env.E2E_PATIENT_PASSWORD;

if (!adminPassword || !doctorPassword || !patientPassword) {
  throw new Error(
    'Missing required E2E credentials: E2E_ADMIN_PASSWORD, E2E_DOCTOR_PASSWORD, and E2E_PATIENT_PASSWORD must all be defined.'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seed() {
  const users = [
    { email: process.env.E2E_ADMIN_EMAIL || 'admin@ruralhealth.demo', password: adminPassword, role: 'admin', name: 'Admin User' },
    { email: process.env.E2E_DOCTOR_EMAIL || 'doctor@ruralhealth.demo', password: doctorPassword, role: 'doctor', name: 'Dr. Smith' },
    { email: process.env.E2E_PATIENT_EMAIL || 'patient@ruralhealth.demo', password: patientPassword, role: 'patient', name: 'John Doe' }
  ];

  for (const u of users) {
    console.log(`Ensuring user ${u.email}...`);
    // Create user in auth
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.name, role: u.role }
    });

    let userId = authData?.user?.id;

    if (authErr && authErr.message.includes('already been registered')) {
      // User exists, update password
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = listData.users.find(user => user.email === u.email);
      if (existing) {
        userId = existing.id;
        await supabase.auth.admin.updateUserById(userId, {
          password: u.password,
          user_metadata: { full_name: u.name, role: u.role },
        });
        console.log(`Updated password and metadata for ${u.email}`);
      }
    } else if (authErr) {
      console.error('Error creating user:', authErr.message);
      continue;
    } else {
      console.log(`Created auth user for ${u.email}`);
    }

    // Upsert into patients table (public profile)
    if (userId) {
      const { error: profileErr } = await supabase
        .from('patients')
        .upsert({
          user_id: userId,
          first_name: u.name,
          last_name: '',
          email: u.email,
          role: u.role,
          phone: '9999999999',
        }, { onConflict: 'user_id' });
        
      if (profileErr) console.error('Error upserting profile:', profileErr.message);
      else console.log(`Upserted profile for ${u.email}`);

      if (u.role === 'doctor') {
        const { data: existingHp } = await supabase
          .from('healthcare_providers')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (!existingHp) {
          await supabase.from('healthcare_providers').insert({
            user_id: userId,
            name: u.name,
            email: u.email,
            specialization: 'General Medicine',
            is_verified: true,
          });
          console.log(`Created healthcare provider record for ${u.email}`);
        }
      }
    }
  }
}

seed().catch(console.error);
