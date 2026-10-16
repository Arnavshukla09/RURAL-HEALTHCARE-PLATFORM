import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { z } from "zod"
import { requireUser, getPatientProfile, authErrorResponse, AuthError } from "@/lib/auth/guard"
import { getAdminClient } from "@/lib/supabase/admin"

const CreateAppointmentSchema = z.object({
  provider_id: z.string().uuid().optional().nullable(),
  appointment_date: z.string().datetime(),
  consultation_type: z.enum(["video", "audio", "chat"]).default("video"),
  notes: z.string().max(500).optional(),
})

const PatchAppointmentSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["scheduled", "completed", "cancelled"]),
})

import { parsePaginationParams, paginateResults } from "@/lib/pagination"

export async function GET(req: NextRequest) {
  try {
    const rl = await checkRateLimit(req, "read")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const patient = await getPatientProfile(user.id)
    if (!patient) {
      return NextResponse.json({ error: "Patient profile not found", code: "NOT_FOUND" }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const { limit, cursor } = parsePaginationParams(searchParams, 20, 100)

    // Explicit column selection (H8) - avoids unbounded select("*")
    let query = supabase
      .from("appointments")
      .select("id, patient_id, provider_id, appointment_date, duration_minutes, status, notes, teleconsult_room_id, created_at, patients(first_name, last_name, email, phone)")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1)

    // Patients see only their own appointments (enforced by RLS + explicit filter)
    if (patient.role === "patient") {
      query = query.eq("patient_id", patient.id)
    }

    if (cursor) {
      query = query.lt("created_at", cursor.createdAt)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: "Failed to fetch appointments", code: "DB_ERROR" }, { status: 500 })
    }

    const paginated = paginateResults((data ?? []) as any, limit)
    return NextResponse.json({
      data: paginated.data,
      appointments: paginated.data,
      nextCursor: paginated.nextCursor,
    })
  } catch (err) {
    return authErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const rl = await checkRateLimit(req, "write")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    let patient = await getPatientProfile(user.id)

    // Edge-case auto-create patient profile if missing (OAuth new users)
    if (!patient) {
      const { data: newPatient, error: createError } = await supabase
        .from("patients")
        .insert({
          user_id: user.id,
          first_name: user.user_metadata?.full_name?.split(" ")[0] || "New",
          last_name: user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "User",
          email: user.email || "",
          role: "patient",
        })
        .select("id, user_id, role, first_name, last_name, email, phone")
        .single()

      if (createError || !newPatient) {
        return NextResponse.json(
          { error: "Could not create patient profile", code: "PROFILE_CREATE_FAILED" },
          { status: 500 }
        )
      }
      patient = newPatient as any
    }

    const body = await req.json()
    const parsed = CreateAppointmentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten(), code: "VALIDATION_ERROR" },
        { status: 400 }
      )
    }

    // Resolve provider from canonical table: healthcare_providers (matches appointments FK)
    let finalProviderId = parsed.data.provider_id || null
    if (!finalProviderId) {
      const { data: defaultProvider } = await supabase
        .from("healthcare_providers")
        .select("id")
        .eq("is_verified", true)
        .limit(1)
        .single()

      if (defaultProvider) {
        finalProviderId = defaultProvider.id
      } else {
        return NextResponse.json(
          { error: "No verified healthcare providers are currently available.", code: "NO_PROVIDERS" },
          { status: 400 }
        )
      }
    }

    // Cryptographically secure, unguessable room ID for teleconsultation
    const roomId = crypto.randomUUID()

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        patient_id: patient!.id,
        provider_id: finalProviderId,
        appointment_date: parsed.data.appointment_date,
        notes: parsed.data.notes || null,
        status: "scheduled",
        teleconsult_room_id: roomId,
      })
      .select()
      .single()

    if (error) {
      // Map PostgreSQL 23505 unique constraint violation (slot already booked) to 409
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This time slot is already booked for this provider.", code: "SLOT_TAKEN" },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: "Failed to book appointment", code: "INSERT_ERROR" },
        { status: 500 }
      )
    }

    // AUDITED SERVICE-ROLE USE: Creating notification for the user
    // Service role is permitted here because notifications table policy restricts inserts to admins
    try {
      const admin = getAdminClient()
      await admin.from("notifications").insert([
        {
          recipient_id: patient!.id,
          recipient_type: "individual",
          title: "Appointment Requested",
          message: `You requested a ${parsed.data.consultation_type} consultation.`,
          type: "info",
        },
      ])
    } catch (notifErr) {
      console.warn("[appointments:POST] Notification insert skipped:", notifErr)
    }

    return NextResponse.json({ appointment: data }, { status: 201 })
  } catch (err) {
    return authErrorResponse(err)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const rl = await checkRateLimit(req, "write")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const patient = await getPatientProfile(user.id)
    if (!patient) {
      return NextResponse.json({ error: "Profile not found", code: "NOT_FOUND" }, { status: 404 })
    }

    // DEMO ADMIN PROTECTION: Demo accounts are restricted to preview mode
    if (user.email?.toLowerCase().includes("demo") || user.email === "admin@ruralhealth.demo") {
      return NextResponse.json(
        { error: "Forbidden: Demo accounts are in preview mode. Modifying appointments is disabled.", code: "DEMO_MODE_RESTRICTED" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const parsed = PatchAppointmentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten(), code: "VALIDATION_ERROR" },
        { status: 400 }
      )
    }

    const { id, status: newStatus } = parsed.data

    // Fetch existing appointment using user-scoped client so RLS applies
    const { data: existingAppt, error: fetchErr } = await supabase
      .from("appointments")
      .select("id, patient_id, provider_id, status, appointment_date")
      .eq("id", id)
      .single()

    // Return 404 (not 403) when not visible or not found, per security spec
    if (fetchErr || !existingAppt) {
      return NextResponse.json({ error: "Appointment not found", code: "NOT_FOUND" }, { status: 404 })
    }

    // Terminal state check: completed or cancelled appointments cannot be modified
    if (existingAppt.status === "completed" || existingAppt.status === "cancelled") {
      return NextResponse.json(
        {
          error: `Appointment is already ${existingAppt.status} and cannot be modified.`,
          code: "APPOINTMENT_TERMINAL",
        },
        { status: 409 }
      )
    }

    // Role-based authorization rules (C2):
    // 1. Patient: May ONLY set status to 'cancelled', and ONLY on their own appointment
    if (patient.role === "patient") {
      if (existingAppt.patient_id !== patient.id) {
        return NextResponse.json({ error: "Appointment not found", code: "NOT_FOUND" }, { status: 404 })
      }
      if (newStatus !== "cancelled") {
        return NextResponse.json(
          { error: "Patients may only cancel appointments.", code: "ACTION_NOT_PERMITTED" },
          { status: 403 }
        )
      }
    }

    // 2. Doctor: May only modify appointments of their own provider record
    if (patient.role === "doctor") {
      // Find doctor's provider id
      const { data: doctorProvider } = await supabase
        .from("healthcare_providers")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (!doctorProvider || existingAppt.provider_id !== doctorProvider.id) {
        return NextResponse.json({ error: "Appointment not found", code: "NOT_FOUND" }, { status: 404 })
      }
    }

    // 3. Admin: May update any appointment

    // Update appointment using user-scoped client
    const { data: updatedAppt, error: updateErr } = await supabase
      .from("appointments")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: "Failed to update appointment", code: "UPDATE_ERROR" }, { status: 500 })
    }

    // AUDITED SERVICE-ROLE USE: Creating notification for the other party
    try {
      const admin = getAdminClient()
      const targetUserId = existingAppt.patient_id
      if (targetUserId) {
        await admin.from("notifications").insert([
          {
            recipient_id: targetUserId,
            recipient_type: "individual",
            title: `Appointment ${newStatus}`,
            message: `Your appointment status has been updated to ${newStatus}.`,
            type: newStatus === "cancelled" ? "warning" : "info",
          },
        ])
      }
    } catch (notifErr) {
      console.warn("[appointments:PATCH] Notification insert skipped:", notifErr)
    }

    return NextResponse.json({ appointment: updatedAppt })
  } catch (err) {
    return authErrorResponse(err)
  }
}

