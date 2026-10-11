require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testRls() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(url, anonKey);

  console.log("Logging in as patient...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'patient@ruralhealth.com',
    password: 'password123'
  });

  if (authError) {
    console.error("Login failed:", authError.message);
    return;
  }

  console.log("Login success! User ID:", authData.user.id);

  console.log("Fetching appointments to test RLS policies...");
  const { data, error } = await supabase.from('appointments').select('*').limit(1);

  if (error) {
    console.error("RLS Error:", error.message, error.details, error.hint);
  } else {
    console.log("RLS Success! Appointments fetched:", data.length);
  }
}

testRls();
