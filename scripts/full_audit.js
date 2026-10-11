require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function fullAudit() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('=== SUPABASE KEY AUDIT ===');
  console.log('URL:', url);
  console.log('Anon Key:', anonKey ? anonKey.substring(0, 20) + '...' : 'MISSING');
  console.log('Service Key:', serviceKey ? serviceKey.substring(0, 20) + '...' : 'MISSING');
  
  // 1. Test service role key (bypasses RLS)
  console.log('\n=== TEST 1: Service Role Key ===');
  const admin = createClient(url, serviceKey);
  
  const { data: patients, error: pErr } = await admin.from('patients').select('id, role, email').limit(5);
  console.log('patients table:', pErr ? 'ERROR: ' + pErr.message : patients.length + ' rows OK');
  
  const { data: appts, error: aErr } = await admin.from('appointments').select('id, status').limit(5);
  console.log('appointments table:', aErr ? 'ERROR: ' + aErr.message : appts.length + ' rows OK');
  
  const { data: records, error: rErr } = await admin.from('medical_records').select('id, record_type').limit(5);
  console.log('medical_records table:', rErr ? 'ERROR: ' + rErr.message : records.length + ' rows OK');
  
  const { data: notifs, error: nErr } = await admin.from('notifications').select('id').limit(5);
  console.log('notifications table:', nErr ? 'ERROR: ' + nErr.message : notifs.length + ' rows OK');
  
  const { data: camps, error: cErr } = await admin.from('camps').select('id').limit(5);
  console.log('camps table:', cErr ? 'ERROR: ' + cErr.message : camps.length + ' rows OK');
  
  const { data: facilities, error: fErr } = await admin.from('healthcare_facilities').select('id').limit(5);
  console.log('healthcare_facilities table:', fErr ? 'ERROR: ' + fErr.message : facilities.length + ' rows OK');
  
  const { data: healthData, error: hErr } = await admin.from('health_data').select('id').limit(5);
  console.log('health_data table:', hErr ? 'ERROR: ' + hErr.message : healthData.length + ' rows OK');
  
  // 2. Test anon key with authenticated user
  console.log('\n=== TEST 2: Anon Key (Public Access) ===');
  const anon = createClient(url, anonKey);
  
  const { data: pubFacilities, error: pfErr } = await anon.from('healthcare_facilities').select('id').limit(3);
  console.log('healthcare_facilities (public):', pfErr ? 'ERROR: ' + pfErr.message : (pubFacilities ? pubFacilities.length + ' rows OK' : 'null'));
  
  const { data: pubCamps, error: pcErr } = await anon.from('camps').select('id').limit(3);
  console.log('camps (public):', pcErr ? 'ERROR: ' + pcErr.message : (pubCamps ? pubCamps.length + ' rows OK' : 'null'));
  
  // 3. Test authenticated user access via sign-up
  console.log('\n=== TEST 3: Authenticated User (RLS Test) ===');
  const testEmail = `audit_${Date.now()}@test.com`;
  const { data: signup, error: sErr } = await anon.auth.signUp({
    email: testEmail,
    password: 'AuditTest123!'
  });
  
  if (sErr) {
    console.log('Sign up failed:', sErr.message);
  } else {
    console.log('Sign up OK, user:', signup.user.id);
    
    // Try to read appointments (this triggers get_user_role RLS)
    const { data: userAppts, error: uaErr } = await anon.from('appointments').select('id').limit(1);
    console.log('appointments (authenticated):', uaErr ? 'RLS ERROR: ' + uaErr.message : 'OK');
    
    const { data: userRecords, error: urErr } = await anon.from('medical_records').select('id').limit(1);
    console.log('medical_records (authenticated):', urErr ? 'RLS ERROR: ' + urErr.message : 'OK');
    
    const { data: userNotifs, error: unErr } = await anon.from('notifications').select('id').limit(1);
    console.log('notifications (authenticated):', unErr ? 'RLS ERROR: ' + unErr.message : 'OK');
    
    // Cleanup
    await admin.auth.admin.deleteUser(signup.user.id);
    console.log('Cleaned up test user');
  }
  
  // 4. Test RPC functions
  console.log('\n=== TEST 4: RPC Functions ===');
  const { data: nearbyData, error: nearbyErr } = await admin.rpc('nearby_facilities', {
    lat: 26.9, lon: 75.8, facility_type: 'hospital', search_radius: 50
  });
  console.log('nearby_facilities RPC:', nearbyErr ? 'ERROR: ' + nearbyErr.message : (nearbyData ? nearbyData.length + ' results' : 'null'));

  console.log('\n=== AUDIT COMPLETE ===');
}

fullAudit().catch(console.error);
