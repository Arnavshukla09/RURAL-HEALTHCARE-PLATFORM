const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seed() {
  const users = [
    { email: 'admin@ruralhealth.com', password: 'Admin@123', role: 'admin', name: 'Admin User' },
    { email: 'doctor@ruralhealth.com', password: 'Doctor@123', role: 'doctor', name: 'Dr. Smith' },
    { email: 'patient@ruralhealth.com', password: 'Patient@123', role: 'patient', name: 'John Doe' }
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
        await supabase.auth.admin.updateUserById(userId, { password: u.password });
        console.log(`Updated password for ${u.email}`);
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
          role: u.role,
          phone: '9999999999'
        }, { onConflict: 'id' });
        
      if (profileErr) console.error('Error upserting profile:', profileErr.message);
      else console.log(`Upserted profile for ${u.email}`);
    }
  }
}

seed().catch(console.error);
