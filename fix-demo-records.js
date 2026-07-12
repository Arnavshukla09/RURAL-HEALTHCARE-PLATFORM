require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const adminClient = createClient(supabaseUrl, supabaseKey);
const userClient = createClient(supabaseUrl, supabaseAnon);

async function fixDemoRecords() {
  const patientEmail = 'demo_1783750201217@ruralhealth.test';
  
  // 1. Get Patient & Provider IDs
  const { data: patient } = await adminClient.from('patients').select('*').eq('email', patientEmail).single();
  const { data: provider } = await adminClient.from('providers').select('*').order('created_at', { ascending: false }).limit(1).single();
  
  if (!patient || !provider) {
    console.log("Missing patient or provider");
    return;
  }
  
  // 2. Get Provider's Email
  const { data: usersData } = await adminClient.auth.admin.listUsers();
  const provAuthUser = usersData.users.find(u => u.id === provider.user_id);
  
  if (!provAuthUser) {
    console.log("Could not find auth user for provider");
    return;
  }
  
  const provEmail = provAuthUser.email;
  const provPassword = "Password123!"; // From our seed script
  
  // 3. Log in as the PROVIDER (this sets auth.uid() in Postgres, and providers have RLS to insert medical_records)
  const { data: session, error: loginError } = await userClient.auth.signInWithPassword({
    email: provEmail,
    password: provPassword
  });
  
  if (loginError) {
    console.log("Login failed:", loginError.message);
    return;
  }
  console.log("Logged in as provider successfully! auth.uid() is:", session.user.id);
  
  // 4. Insert Medical Records using the PROVIDER client
  console.log("Inserting Medical Records...");
  const { error } = await userClient.from('medical_records').insert([
    {
      patient_id: patient.id,
      provider_id: provider.id,
      record_type: "other",
      content: "[Camp Registration] Free Antenatal Checkup Camp — Jhabua PHC on 15 Oct at 10:00 AM. Contact: +91 9988776655"
    },
    {
      patient_id: patient.id,
      provider_id: provider.id,
      record_type: "other",
      content: "[Camp Registration] Blood Donation Camp — District Hospital on 20 Oct at 09:00 AM. Contact: +91 1122334455"
    }
  ]);
  
  if (error) {
    console.log("Error inserting medical records:", error.message);
  } else {
    console.log("Successfully inserted medical records with provider auth.uid()!");
  }
}
fixDemoRecords();
