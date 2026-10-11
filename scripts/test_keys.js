require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("URL:", url);
  console.log("Anon Key present:", !!anonKey);
  console.log("Service Key present:", !!serviceKey);

  const adminClient = createClient(url, serviceKey);

  console.log("\n--- Testing Service Role Key ---");
  const { data: adminData, error: adminError } = await adminClient.from('patients').select('id').limit(1);
  if (adminError) {
    console.error("Admin Client Error:", adminError.message);
  } else {
    console.log("Admin Client Success! Found patients:", adminData.length);
  }

  const anonClient = createClient(url, anonKey);
  console.log("\n--- Testing Anon Key ---");
  const { data: anonData, error: anonError } = await anonClient.from('facilities').select('id').limit(1);
  if (anonError) {
    console.error("Anon Client Error:", anonError.message);
  } else {
    console.log("Anon Client Success! Found facilities:", anonData.length);
  }
}

testSupabase();
