import { NextResponse } from "next/server"
import { Client } from "pg"

export async function GET() {
  const directUrl = 'postgresql://postgres:RxnyAKbj4pj490Le@db.boyzdmlvzvcplzolenef.supabase.co:5432/postgres';
  
  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Fix get_user_role for authenticated users (which fixes Medical Records and Appointments)
    await client.query("GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;");
    
    // Explicitly grant nearby_facilities to anon and authenticated
    await client.query("GRANT EXECUTE ON FUNCTION public.nearby_facilities(double precision, double precision, text, double precision) TO anon, authenticated;");
    
    // Grant handle_new_user to anon, authenticated
    await client.query("GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon, public;");
    
    await client.end();
    
    return NextResponse.json({ success: true, message: "Database permissions successfully unlocked!" })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
