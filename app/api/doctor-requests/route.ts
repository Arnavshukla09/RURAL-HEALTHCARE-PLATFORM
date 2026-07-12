import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/rate-limit"
import { z } from "zod"

// GET — admin fetches all pending requests
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1"
  if (!rateLimit(ip, 20, 60000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Only admin can list all requests
  const { data: patient } = await supabase
    .from("patients")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (patient?.role !== "admin") {
    // Non-admins can only see their own request
    const { data, error } = await supabase
      .from("doctor_requests")
      .select("*")
      .eq("user_id", user.id)
      .single()
    if (error) return NextResponse.json({ request: null })
    return NextResponse.json({ request: data })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") || "pending"

  const { data, error } = await supabase
    .from("doctor_requests")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ requests: data ?? [] })
}

// POST — doctor submits registration request
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1"
  if (!rateLimit(ip, 5, 60000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 })

  // Check if request already exists
  const { data: existing } = await supabase
    .from("doctor_requests")
    .select("id, status")
    .eq("user_id", user.id)
    .single()

  if (existing) {
    return NextResponse.json({
      error: `A request already exists with status: ${existing.status}`,
      existing,
    }, { status: 409 })
  }

  const Schema = z.object({
    full_name: z.string().min(2).max(100),
    email: z.string().email(),
    specialization: z.string().min(2).max(100).optional(),
    license_number: z.string().min(3).max(50),
    hospital_affiliation: z.string().max(200).optional(),
    experience_years: z.coerce.number().int().min(0).max(60).optional(),
  })

  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("doctor_requests")
    .insert({
      user_id: user.id,
      ...parsed.data,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ request: data, message: "Request submitted successfully" }, { status: 201 })
}

// PATCH — admin approves or rejects a request
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Verify admin role
  const { data: admin } = await supabase
    .from("patients")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (admin?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const Schema = z.object({
    request_id: z.string().uuid(),
    action: z.enum(["approved", "rejected"]),
    admin_notes: z.string().max(500).optional(),
  })

  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { request_id, action, admin_notes } = parsed.data

  // Get the request to find user_id
  const { data: request } = await supabase
    .from("doctor_requests")
    .select("user_id, email")
    .eq("id", request_id)
    .single()

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 })
  }

  // Update request status
  const { error: updateError } = await supabase
    .from("doctor_requests")
    .update({
      status: action,
      reviewed_at: new Date().toISOString(),
      admin_notes: admin_notes || null,
    })
    .eq("id", request_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // If approved — update the patient's role to doctor
  if (action === "approved") {
    const { error: roleError } = await supabase
      .from("patients")
      .update({ role: "doctor" })
      .eq("user_id", request.user_id)

    if (roleError) {
      return NextResponse.json({
        error: "Request approved but role update failed: " + roleError.message,
      }, { status: 500 })
    }
  }

  return NextResponse.json({
    message: `Request ${action} successfully`,
    user_id: request.user_id,
  })
}
