require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testRls() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const adminClient = createClient(url, serviceKey);
  const anonClient = createClient(url, anonKey);

  const testEmail = `test_${Date.now()}@ruralhealth.com`;
  console.log("Creating temporary user:", testEmail);
  
  const { data: authData, error: authError } = await anonClient.auth.signUp({
    email: testEmail,
    password: 'Password123!'
  });

  if (authError) {
    console.error("SignUp failed:", authError.message);
    return;
  }

  console.log("SignUp success! User ID:", authData.user.id);

  console.log("Fetching appointments to test RLS policies...");
  const { data, error } = await anonClient.from('appointments').select('*').limit(1);

  if (error) {
    console.error("RLS Error:", error.message, error.details, error.hint);
  } else {
    console.log("RLS Success! Appointments fetched:", data.length);
  }
  
  // Cleanup
  await adminClient.auth.admin.deleteUser(authData.user.id);
  console.log("Cleaned up temporary user.");
}

testRls();
