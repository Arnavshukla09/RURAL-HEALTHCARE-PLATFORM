require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMR() {
  const { data: patient } = await supabase.from('patients').select('id').limit(1).single();
  const { data: provider } = await supabase.from('providers').select('id').limit(1).single();
  
  if (!patient || !provider) {
    console.log("Missing patient or provider");
    return;
  }
  
  const { error } = await supabase.from('medical_records').insert([
    {
      patient_id: patient.id,
      provider_id: provider.id,
      record_type: "other",
      content: "[Camp Registration] Test"
    }
  ]);
  
  if (error) {
    console.log("Error inserting medical record:", error.message);
  } else {
    console.log("Successfully inserted medical record!");
  }
}
checkMR();
