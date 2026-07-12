require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMockData() {
  console.log("Verifying Mock Data for the Demo User...");
  const email = 'demo_1783750201217@ruralhealth.test';
  
  // 1. Get the User ID
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  const demoUser = users.users.find(u => u.email === email);
  if (!demoUser) {
    console.error("Demo user not found!");
    return;
  }
  const userId = demoUser.id;
  console.log(`\nFound User ID: ${userId}`);

  // 2. Check Patient Profile
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (patientError) {
    console.error("Failed to fetch patient:", patientError.message);
  } else {
    console.log(`\nPatient Profile Found: ${patient.first_name} ${patient.last_name}, Role: ${patient.role}`);
  }

  // 3. Check Notifications
  const { data: notifs, error: notifError } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (notifError) {
    console.error("Failed to fetch notifications:", notifError.message);
  } else {
    console.log(`\nFound ${notifs.length} Notifications:`);
    notifs.forEach(n => console.log(` - [${n.type.toUpperCase()}] ${n.title}: ${n.message}`));
  }

  // 4. Check Registered Camps (Medical Records)
  if (patient) {
    const { data: records, error: recordsError } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patient.id)
      .eq('record_type', 'other')
      .like('content', '[Camp Registration]%')
      .order('created_at', { ascending: false });
      
    if (recordsError) {
      console.error("Failed to fetch medical records:", recordsError.message);
    } else {
      console.log(`\nFound ${records.length} Registered Campaigns (Medical Records):`);
      records.forEach(r => {
        console.log(` - ${r.content}`);
        
        // Let's test the Dashboard.tsx parsing logic
        const content = r.content;
        const titleMatch = content.match(/\[Camp Registration\] (.*?) —/);
        const locMatch = content.match(/— (.*?) on/);
        const dateMatch = content.match(/on (.*?) at/);
        const timeMatch = content.match(/at (.*?)\. Contact:/);
        
        console.log(`   -> Parsed Title: ${titleMatch ? titleMatch[1] : 'Failed'}`);
        console.log(`   -> Parsed Location: ${locMatch ? locMatch[1] : 'Failed'}`);
        console.log(`   -> Parsed Date: ${dateMatch ? dateMatch[1] : 'Failed'}`);
        console.log(`   -> Parsed Time: ${timeMatch ? timeMatch[1] : 'Failed'}`);
      });
    }
  }

  console.log("\nVerification Complete!");
}

verifyMockData();
