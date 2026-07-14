import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

// This endpoint creates demo accounts using the service role key
// Only callable in development or with a secret token

export async function POST(req: NextRequest) {
  // Basic protection – only allow if a secret matches
  const body = await req.json().catch(() => ({}))
  if (body.secret !== "ruralhealth-demo-2026") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Add it in Vercel." },
      { status: 500 }
    )
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const results: any[] = []

  const demoAccounts = [
    {
      email: "doctor@ruralhealth.demo",
      password: "Doctor@123",
      first_name: "Dr. Arjun",
      last_name: "Mehta",
      role: "doctor",
    },
    {
      email: "admin@ruralhealth.demo",
      password: "Admin@123",
      first_name: "Admin",
      last_name: "User",
      role: "admin",
    },
    {
      email: "patient@ruralhealth.demo",
      password: "Patient@123",
      first_name: "Priya",
      last_name: "Sharma",
      role: "patient",
    },
  ]

  for (const account of demoAccounts) {
    try {
      // Create auth user (ignore if already exists)
      const { data: authData, error: authErr } = await admin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: { full_name: `${account.first_name} ${account.last_name}` },
      })

      let userId = authData?.user?.id

      // If user already exists, look up their ID
      if (authErr?.message?.includes("already been registered") || authErr?.code === "email_exists") {
        const { data: existingUsers } = await admin.auth.admin.listUsers()
        const existing = existingUsers?.users?.find(u => u.email === account.email)
        userId = existing?.id
      } else if (authErr) {
        results.push({ email: account.email, status: "auth_error", error: authErr.message })
        continue
      }

      if (!userId) {
        results.push({ email: account.email, status: "no_user_id" })
        continue
      }

      // Upsert patient row
      const { error: patientErr } = await admin.from("patients").upsert({
        user_id: userId,
        email: account.email,
        first_name: account.first_name,
        last_name: account.last_name,
        role: account.role,
      }, { onConflict: "user_id" })

      if (patientErr) {
        results.push({ email: account.email, status: "patient_error", error: patientErr.message })
      } else {
        results.push({ email: account.email, status: "ok", role: account.role })
      }
    } catch (e: any) {
      results.push({ email: account.email, status: "exception", error: e.message })
    }
  }

  return NextResponse.json({ results })
}
