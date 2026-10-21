/**
 * lib/services/doctor-provider-link.service.ts
 *
 * Core administrative logic for auditing and linking doctor accounts to healthcare provider directories.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Administrative Operations
 */

import { NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { logAuditEvent } from "@/lib/audit"
import { z } from "zod"

export const LinkSchema = z.object({
  user_id: z.string().uuid(),
  provider_id: z.string().uuid(),
})

/**
 * Handles GET /api/admin/doctor-provider-link
 */
export async function getDoctorProviderLinkStatus(supabase: any, user: any) {
  const { data: adminPatient } = await supabase
    .from("patients")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (adminPatient?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const adminClient = getAdminClient()

  const { data: doctors, error: docErr } = await adminClient
    .from("patients")
    .select("id, user_id, first_name, last_name, email, phone, role, created_at")
    .eq("role", "doctor")

  if (docErr) {
    return NextResponse.json({ error: "Failed to query doctors: " + docErr.message }, { status: 500 })
  }

  const { data: providers, error: provErr } = await adminClient
    .from("healthcare_providers")
    .select("id, user_id, name, email, phone, location, specialization, is_verified")

  if (provErr) {
    return NextResponse.json({ error: "Failed to query providers: " + provErr.message }, { status: 500 })
  }

  const linkedUserIds = new Set((providers || []).map((p) => p.user_id).filter(Boolean))
  const unlinkedDoctors = (doctors || []).filter((d) => !linkedUserIds.has(d.user_id))
  const linkedDoctors = (doctors || []).filter((d) => linkedUserIds.has(d.user_id))
  const unlinkedProviders = (providers || []).filter((p) => !p.user_id)

  return NextResponse.json({
    summary: {
      total_doctor_users: (doctors || []).length,
      linked_doctors_count: linkedDoctors.length,
      unlinked_doctors_count: unlinkedDoctors.length,
      unlinked_providers_count: unlinkedProviders.length,
    },
    unlinkedDoctors,
    unlinkedProviders,
    linkedDoctors: linkedDoctors.map((d) => ({
      user_id: d.user_id,
      patient_id: d.id,
      name: `${d.first_name || ""} ${d.last_name || ""}`.trim() || d.email,
      email: d.email,
      provider: (providers || []).find((p) => p.user_id === d.user_id) || null,
    })),
  })
}

/**
 * Handles POST /api/admin/doctor-provider-link
 */
export async function linkDoctorToProvider(supabase: any, user: any, body: any) {
  const { data: adminPatient } = await supabase
    .from("patients")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (adminPatient?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const parsed = LinkSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { user_id, provider_id } = parsed.data
  const adminClient = getAdminClient()

  const { data: targetDoctor, error: docErr } = await adminClient
    .from("patients")
    .select("id, user_id, role, first_name, last_name, email")
    .eq("user_id", user_id)
    .maybeSingle()

  if (docErr || !targetDoctor) {
    return NextResponse.json({ error: "Target user not found" }, { status: 404 })
  }

  if (targetDoctor.role !== "doctor") {
    return NextResponse.json(
      {
        error: `User role is '${targetDoctor.role}'. Only users with role='doctor' can be linked to healthcare_providers.`,
        code: "INVALID_ROLE",
      },
      { status: 400 }
    )
  }

  const { data: provider, error: provErr } = await adminClient
    .from("healthcare_providers")
    .select("id, user_id, name, email")
    .eq("id", provider_id)
    .maybeSingle()

  if (provErr || !provider) {
    return NextResponse.json({ error: "Healthcare provider record not found" }, { status: 404 })
  }

  if (provider.user_id && provider.user_id !== user_id) {
    return NextResponse.json(
      {
        error: `Healthcare provider record (${provider.id}) is already linked to user ${provider.user_id}. Linking rejected.`,
        code: "PROVIDER_ALREADY_LINKED",
      },
      { status: 409 }
    )
  }

  const { data: existingLink } = await adminClient
    .from("healthcare_providers")
    .select("id, name")
    .eq("user_id", user_id)
    .maybeSingle()

  if (existingLink && existingLink.id !== provider_id) {
    return NextResponse.json(
      {
        error: `User is already linked to provider '${existingLink.name}' (${existingLink.id}). Unlink first before reassigning.`,
        code: "USER_ALREADY_LINKED",
      },
      { status: 409 }
    )
  }

  const { error: updateErr } = await adminClient
    .from("healthcare_providers")
    .update({
      user_id,
      is_verified: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", provider_id)

  if (updateErr) {
    return NextResponse.json(
      {
        error: "Failed to link provider: " + updateErr.message,
        code: "UPDATE_FAILED",
      },
      { status: 500 }
    )
  }

  await logAuditEvent({
    action: "admin_linked_doctor_provider",
    resourceType: "healthcare_providers",
    resourceId: provider_id,
    patientId: targetDoctor.id,
    userId: user.id,
    userRole: "admin",
    details: {
      target_doctor_user_id: user_id,
      provider_id,
      provider_name: provider.name,
    },
  })

  return NextResponse.json({
    success: true,
    message: `Doctor ${targetDoctor.email || user_id} successfully linked to provider ${provider.name} (${provider_id})`,
    user_id,
    provider_id,
  })
}
