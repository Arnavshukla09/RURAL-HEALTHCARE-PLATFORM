require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runDemo() {
  console.log("Starting Demo Data Injection...");
  
  // 1. Create a demo user via Admin API
  const email = `demo_${Date.now()}@ruralhealth.test`;
  const password = "Password123!";
  
  console.log(`Creating demo auth user: ${email}`);
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  if (authError) {
    console.error("Failed to create auth user:", authError.message);
    return;
  }
  
  const userId = authData.user.id;
  console.log(`Auth user created successfully! ID: ${userId}`);
  
  // 2. Update Patient Profile (Trigger already created it)
  console.log("Updating Patient Profile...");
  const { data: patient, error: patientError } = await supabase.from('patients').update({
      first_name: "Anita",
      last_name: "Devi",
      phone: "+91 9876543210",
      gender: "Female",
      address: "Village Jhabua, MP",
      role: "patient"
  }).eq('user_id', userId).select().single();
  
  if (patientError) {
    console.error("Failed to create patient:", patientError.message);
    return;
  }
  console.log(`Patient profile created! Patient ID: ${patient.id}`);
  
  // 3. Create a Provider (Doctor) to link appointments to
  console.log("Creating Fake Provider (Doctor)...");
  // We need a separate auth user for the provider due to FK constraint
  const { data: provAuth } = await supabase.auth.admin.createUser({
    email: `dr_${Date.now()}@ruralhealth.test`,
    password: "Password123!",
    email_confirm: true
  });
  
  const { data: provider, error: providerError } = await supabase.from('providers').insert([
    {
      user_id: provAuth.user.id,
      first_name: "Dr. Ramesh",
      last_name: "Sharma",
      specialization: "Obstetrics & Gynecology",
      is_verified: true
    }
  ]).select().single();
  
  if (providerError) console.error("Failed provider:", providerError.message);
  
  // 4. Create Medical Record for Campaign Registration (so it appears on Dashboard)
  console.log("Creating Campaign Registration (Medical Record)...");
  await supabase.from('medical_records').insert([
    {
      patient_id: patient.id,
      provider_id: provider ? provider.id : null,
      record_type: "other",
      content: "[Camp Registration] Free Antenatal Checkup Camp — Jhabua PHC on 15 Oct at 10:00 AM. Contact: +91 9988776655"
    },
    {
      patient_id: patient.id,
      provider_id: provider ? provider.id : null,
      record_type: "other",
      content: "[Camp Registration] Blood Donation Camp — District Hospital on 20 Oct at 09:00 AM. Contact: +91 1122334455"
    }
  ]);
  
  // 5. Create some notifications
  console.log("Creating Notifications...");
  await supabase.from('notifications').insert([
    {
      user_id: userId,
      title: "Upcoming Camp Reminder",
      message: "Your Antenatal Checkup Camp is tomorrow at Jhabua PHC.",
      type: "info"
    },
    {
      user_id: userId,
      title: "Scheme Eligibility",
      message: "You are eligible for JSY cash incentive of ₹1400. Bring your documents to the hospital.",
      type: "alert"
    }
  ]);
  
  console.log("\n========================================");
  console.log("DEMO INJECTION COMPLETE!");
  console.log(`You can log in to test with:`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log("========================================\n");
}

runDemo();
