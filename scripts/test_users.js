require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testUsers() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminClient = createClient(url, serviceKey);

  const { data: users, error } = await adminClient.auth.admin.listUsers();
  if (error) {
    console.error("Error fetching users:", error.message);
  } else {
    console.log(`Found ${users.users.length} users.`);
    users.users.forEach(u => console.log(u.email));
  }
}

testUsers();
