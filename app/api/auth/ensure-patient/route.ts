import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

/**
 * POST /api/auth/ensure-patient
 * Ensures the current authenticated user has a row in the patients table.
 * Called on login (especially OAuth) to guarantee the patient record exists
 * BEFORE any booking or records operations.
 * 
 * This runs server-side so it bypasses RLS — no SQL script needed.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"
    if (!rateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if patient row already exists
    const { data: existing } = await supabase
      .from("patients")
      .select("id, first_name, last_name, phone, role")
      .eq("user_id", user.id)
      .single()

    if (existing?.id) {
      // Already exists — return it
      return NextResponse.json({
        patient_id: existing.id,
        name: existing.first_name,
        phone: existing.phone || "",
        role: existing.role || "patient",
        created: false,
      })
    }

    // Create new patient row
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "User"
    const firstName = fullName.split(" ")[0]
    const lastName = fullName.split(" ").slice(1).join(" ") || ""

    const { data: newPatient, error } = await supabase
      .from("patients")
      .insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: user.email,
        role: "patient",
        phone: user.user_metadata?.phone || "",
      })
      .select("id, first_name, last_name, phone, role")
      .single()

    if (error) {
      // Might be a unique constraint race condition — try select again
      const { data: raceCheck } = await supabase
        .from("patients")
        .select("id, first_name, last_name, phone, role")
        .eq("user_id", user.id)
        .single()

      if (raceCheck?.id) {
        return NextResponse.json({
          patient_id: raceCheck.id,
          name: raceCheck.first_name,
          phone: raceCheck.phone || "",
          role: raceCheck.role || "patient",
          created: false,
        })
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      patient_id: newPatient.id,
      name: newPatient.first_name,
      phone: newPatient.phone || "",
      role: newPatient.role || "patient",
      created: true,
    })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
