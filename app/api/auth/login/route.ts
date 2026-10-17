import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

/**
 * POST /api/auth/login
 * Server-side authentication route.
 * Bypasses client-side browser Web Locks, CORS, and third-party cookie/ad-blocker blocks.
 * Sets HttpOnly session cookies directly via Next.js response headers.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body?.email?.trim()
    const password = body?.password

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!data.user) {
      return NextResponse.json({ error: "No user returned from authentication" }, { status: 401 })
    }

    // Fetch patient role & profile info
    const { data: patient } = await supabase
      .from("patients")
      .select("role, first_name, last_name, phone")
      .eq("user_id", data.user.id)
      .single()

    const role = patient?.role || data.user.user_metadata?.role || "patient"
    const name = patient?.first_name
      ? patient.first_name + (patient.last_name ? ` ${patient.last_name}` : "")
      : data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "User"

    return NextResponse.json({
      user: {
        id: data.user.id,
        name,
        email: data.user.email,
        role,
        phone: patient?.phone || "",
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error during login" },
      { status: 500 }
    )
  }
}
