/**
 * lib/services/appointments.service.ts
 *
 * Core business logic and database access for Teleconsultation & Clinic Appointments.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Care Operations
 */

import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getPatientProfile } from "@/lib/auth/guard"
import { getAdminClient } from "@/lib/supabase/admin"
import { parsePaginationParams, paginateResults } from "@/lib/pagination"

export const CreateAppointmentSchema = z.object({
  provider_id: z.string().uuid().optional().nullable(),
  appointment_date: z.string().datetime(),
  consultation_type: z.enum(["video", "audio", "chat"]).default("video"),
  notes: z.string().max(500).optional(),
})

export const PatchAppointmentSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["scheduled", "completed", "cancelled"]),
})

/**
 * Handles GET /api/appointments
 */
export async function handleGetAppointments(supabase: any, user: any, searchParams: URLSearchParams) {
  let patient = await getPatientProfile(user.id)
  if (!patient) {
    return NextResponse.json({ error: "Patient profile not found", code: "NOT_FOUND" }, { status: 404 })
  }

  const { limit, cursor } = parsePaginationParams(searchParams, 20, 100)
  const admin = getAdminClient()

  // Verify if user is linked to a verified healthcare provider
  const { data: hpList } = await admin
    .from("healthcare_providers")
    .select("id, name, specialization, user_id")
    .eq("user_id", user.id)
    .eq("is_verified", true)

  const isDoctor = patient.role === "doctor" || (hpList && hpList.length > 0)

  // Self-heal patient role in public.patients if authenticated clinician is verified
  if (hpList && hpList.length > 0 && patient.role !== "doctor") {
    try {
      await admin.from("patients").update({ role: "doctor" }).eq("user_id", user.id)
      patient.role = "doctor"
    } catch {}
  }

  if (isDoctor) {
    const providerIds: string[] = (hpList || []).map((h: any) => h.id)
    if (!providerIds.includes(user.id)) providerIds.push(user.id)
    if (patient.id && !providerIds.includes(patient.id)) providerIds.push(patient.id)

    // Demo doctor account alias support to seamlessly bridge demo clinician sessions
    if (user.email?.toLowerCase().trim() === "doctor@ruralhealth.demo") {
      if (!providerIds.includes("0d6e51a3-b8dc-4c01-a7b2-dd44aa71b97f")) {
        providerIds.push("0d6e51a3-b8dc-4c01-a7b2-dd44aa71b97f")
      }
    }

    const doctorName = hpList?.[0]?.name || [patient.first_name, patient.last_name].filter(Boolean).join(" ")

    let doctorQuery = admin
      .from("appointments")
      .select("id, patient_id, provider_id, appointment_date, duration_minutes, status, notes, teleconsult_room_id, created_at, patients(first_name, last_name, email, phone)")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1)

    if (cursor) {
      doctorQuery = doctorQuery.lt("created_at", cursor.createdAt)
    }

    if (doctorName && doctorName.length > 3) {
      doctorQuery = doctorQuery.or(`provider_id.in.(${providerIds.join(",")}),notes.ilike.%${doctorName}%`)
    } else {
      doctorQuery = doctorQuery.in("provider_id", providerIds)
    }

    const { data: docAppts, error: docError } = await doctorQuery
    if (docError) {
      return NextResponse.json({ error: "Failed to fetch appointments", code: "DB_ERROR" }, { status: 500 })
    }

    // Auto-heal any legacy appointments where notes contain doctorName but provider_id was mismatched
    if (hpList?.[0]?.id && docAppts) {
      const correctHpId = hpList[0].id
      const mismatched = docAppts.filter(
        (a: any) => a.provider_id !== correctHpId && a.notes?.includes(doctorName)
      )
      if (mismatched.length > 0) {
        const mismatchedIds = mismatched.map((a: any) => a.id)
        admin.from("appointments").update({ provider_id: correctHpId }).in("id", mismatchedIds).then(() => {})
      }
    }

    const paginated = paginateResults((docAppts ?? []) as any, limit)
    return NextResponse.json({
      data: paginated.data,
      appointments: paginated.data,
      nextCursor: paginated.nextCursor,
    })
  }

  let query = supabase
    .from("appointments")
    .select("id, patient_id, provider_id, appointment_date, duration_minutes, status, notes, teleconsult_room_id, created_at, patients(first_name, last_name, email, phone)")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1)

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
}

/**
 * Handles POST /api/appointments
 */
export async function handleCreateAppointment(supabase: any, user: any, body: any) {
  let patient = await getPatientProfile(user.id)

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

  const parsed = CreateAppointmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten(), code: "VALIDATION_ERROR" },
      { status: 400 }
    )
  }

  let finalProviderId = parsed.data.provider_id || null
  if (!finalProviderId && parsed.data.notes) {
    const docMatch = parsed.data.notes.match(/—\s*([^,]+)/)
    if (docMatch && docMatch[1]) {
      const docName = docMatch[1].trim()
      const { data: matchedDoc } = await supabase
        .from("healthcare_providers")
        .select("id")
        .ilike("name", `%${docName}%`)
        .eq("is_verified", true)
        .limit(1)
        .maybeSingle()
      if (matchedDoc) {
        finalProviderId = matchedDoc.id
      }
    }
  }

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
}

/**
 * Handles PATCH /api/appointments
 */
export async function handlePatchAppointment(supabase: any, user: any, body: any) {
  const patient = await getPatientProfile(user.id)
  if (!patient) {
    return NextResponse.json({ error: "Profile not found", code: "NOT_FOUND" }, { status: 404 })
  }

  if (patient.role === "admin" && user.email?.toLowerCase().trim() === "admin@ruralhealth.demo") {
    return NextResponse.json(
      { error: "Forbidden: Demo accounts are in preview mode. Modifying appointments is disabled.", code: "DEMO_MODE_RESTRICTED" },
      { status: 403 }
    )
  }

  const parsed = PatchAppointmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten(), code: "VALIDATION_ERROR" },
      { status: 400 }
    )
  }

  const { id, status: newStatus } = parsed.data

  const { data: existingAppt, error: fetchErr } = await supabase
    .from("appointments")
    .select("id, patient_id, provider_id, status, appointment_date")
    .eq("id", id)
    .single()

  if (fetchErr || !existingAppt) {
    return NextResponse.json({ error: "Appointment not found", code: "NOT_FOUND" }, { status: 404 })
  }

  if (existingAppt.status === "completed" || existingAppt.status === "cancelled") {
    return NextResponse.json(
      {
        error: `Appointment is already ${existingAppt.status} and cannot be modified.`,
        code: "APPOINTMENT_TERMINAL",
      },
      { status: 409 }
    )
  }

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

  if (patient.role === "doctor") {
    const { data: doctorProvider } = await supabase
      .from("healthcare_providers")
      .select("id")
      .eq("user_id", user.id)
      .single()

    const isDemoDoctor = user.email?.toLowerCase().trim() === "doctor@ruralhealth.demo"
    const isMatched =
      (doctorProvider && existingAppt.provider_id === doctorProvider.id) ||
      existingAppt.provider_id === user.id ||
      (isDemoDoctor && existingAppt.provider_id === "0d6e51a3-b8dc-4c01-a7b2-dd44aa71b97f")

    if (!isMatched) {
      return NextResponse.json({ error: "Appointment not found", code: "NOT_FOUND" }, { status: 404 })
    }
  }

  const { data: updatedAppt, error: updateErr } = await supabase
    .from("appointments")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (updateErr) {
    return NextResponse.json({ error: "Failed to update appointment", code: "UPDATE_ERROR" }, { status: 500 })
  }

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
}
