const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRoles() {
  const { data: users } = await supabase.auth.admin.listUsers();
  
  const admin = users.users.find(u => u.email === 'admin@ruralhealth.com');
  const doctor = users.users.find(u => u.email === 'doctor@ruralhealth.com');

  if (admin) {
    await supabase.from('patients').update({ role: 'admin' }).eq('user_id', admin.id);
    console.log('Updated admin role');
  }
  if (doctor) {
    await supabase.from('patients').update({ role: 'doctor' }).eq('user_id', doctor.id);
    console.log('Updated doctor role');
  }
}
fixRoles().catch(console.error);
