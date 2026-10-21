/**
 * lib/services/fhir-export.service.ts
 *
 * Core business logic and clinical validation for FHIR R4 Export bundles.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — ABDM / NRCES Interoperability
 */

import { type NextRequest, NextResponse } from "next/server"
import { logAuditEvent } from "@/lib/audit"
import {
  generateFhirPrescriptionBundle,
  generateFhirDiagnosticBundle,
  generateFhirEncounterBundle,
  validateFhirBundle,
  type PatientDemographics,
  type PrescriptionRecord,
  type DiagnosticReportRecord,
  type EncounterRecord,
} from "@/lib/abdm/fhir"

/**
 * Handles GET /api/abdm/fhir-export
 */
export async function exportFhirRecordBundle(supabase: any, user: any, recordId: string) {
  // 1. Fetch record from database
  const { data: record, error: recordError } = await supabase
    .from("medical_records")
    .select("*, patients(*)")
    .eq("id", recordId)
    .single()

  if (recordError || !record) {
    return NextResponse.json({ error: "Medical record not found" }, { status: 404 })
  }

  // 2. Fetch current caller's role and patient profile
  const { data: callerPatient } = await supabase
    .from("patients")
    .select("id, role")
    .eq("user_id", user.id)
    .single()

  const callerRole = callerPatient?.role || "patient"
  const isOwner = callerPatient?.id === record.patient_id

  if (!isOwner) {
    if (callerRole === "admin") {
      await logAuditEvent({
        action: "fhir_export_denied",
        resourceType: "medical_records",
        resourceId: recordId,
        patientId: record.patient_id,
        userId: user.id,
        userRole: callerRole,
        details: { reason: "admin_confidentiality_restriction" },
      })
      return NextResponse.json(
        { error: "Access denied. Administrators cannot view or export confidential patient clinical bundles." },
        { status: 403 }
      )
    }

    if (callerRole === "doctor") {
      const { data: provider } = await supabase
        .from("healthcare_providers")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (!provider) {
        await logAuditEvent({
          action: "fhir_export_denied",
          resourceType: "medical_records",
          resourceId: recordId,
          patientId: record.patient_id,
          userId: user.id,
          userRole: callerRole,
          details: { reason: "provider_profile_missing" },
        })
        return NextResponse.json(
          { error: "Access denied. Healthcare provider profile not found." },
          { status: 403 }
        )
      }

      const { data: careRelationship } = await supabase
        .from("appointments")
        .select("id")
        .eq("patient_id", record.patient_id)
        .eq("provider_id", provider.id)
        .in("status", ["scheduled", "completed"])
        .limit(1)

      if (!careRelationship || careRelationship.length === 0) {
        await logAuditEvent({
          action: "fhir_export_denied",
          resourceType: "medical_records",
          resourceId: recordId,
          patientId: record.patient_id,
          userId: user.id,
          userRole: callerRole,
          details: { reason: "no_care_relationship" },
        })
        return NextResponse.json(
          { error: "Access denied. You do not have an established care relationship with this patient." },
          { status: 403 }
        )
      }
    } else {
      await logAuditEvent({
        action: "fhir_export_denied",
        resourceType: "medical_records",
        resourceId: recordId,
        patientId: record.patient_id,
        userId: user.id,
        userRole: callerRole,
        details: { reason: "unauthorized_role" },
      })
      return NextResponse.json(
        { error: "Access denied. You are not authorized to export this patient's clinical bundle." },
        { status: 403 }
      )
    }
  }

  // 3. Assemble Patient Demographics
  const pat = record.patients || {}
  const patientName = [pat.first_name, pat.last_name].filter(Boolean).join(" ") || "Patient"
  const genderMapped =
    pat.gender === "female"
      ? "female"
      : pat.gender === "other"
        ? "other"
        : pat.gender === "male"
          ? "male"
          : "unknown"

  const demographics: PatientDemographics = {
    id: pat.id || record.patient_id,
    name: patientName,
    gender: genderMapped,
    birthDate: pat.date_of_birth || undefined,
    phone: pat.phone || undefined,
    district: pat.district || undefined,
    state: pat.state || undefined,
    abhaNumber: pat.abha_number || undefined,
    abhaAddress: pat.abha_address || undefined,
  }

  // 4. Resolve Clinician / Facility details
  let doctorName = record.metadata?.doctor_name
  let facilityName = record.metadata?.facility_name
  let doctorRegistration = record.metadata?.doctor_registration

  if ((!doctorName || !facilityName || !doctorRegistration) && record.provider_id) {
    const { data: prov } = await supabase
      .from("healthcare_providers")
      .select("name, hospital_affiliation, registration_number")
      .eq("id", record.provider_id)
      .maybeSingle()
    if (prov) {
      if (!doctorName && prov.name) doctorName = prov.name
      if (!facilityName && prov.hospital_affiliation) facilityName = prov.hospital_affiliation
      if (!doctorRegistration && prov.registration_number) doctorRegistration = prov.registration_number
    }
  }

  let bundle: Record<string, any>

  if (record.record_type === "prescription") {
    const parsedMedications = record.metadata?.medications
    if (!parsedMedications || !Array.isArray(parsedMedications) || parsedMedications.length === 0) {
      return NextResponse.json(
        {
          error: "INCOMPLETE_CLINICAL_RECORD",
          message: "Prescription record is missing structured medication items. Fabricated default dosages are prohibited.",
          missing_fields: ["metadata.medications"],
        },
        { status: 422 }
      )
    }

    for (const med of parsedMedications) {
      if (!med.medicineName || !med.dosage || !med.frequency || !med.duration) {
        return NextResponse.json(
          {
            error: "INCOMPLETE_CLINICAL_RECORD",
            message: "Medication item is missing required clinical fields (medicineName, dosage, frequency, or duration).",
            missing_fields: ["medicineName", "dosage", "frequency", "duration"].filter((k) => !med[k]),
          },
          { status: 422 }
        )
      }
    }

    if (!doctorName || !facilityName) {
      return NextResponse.json(
        {
          error: "INCOMPLETE_CLINICAL_RECORD",
          message: "Prescription record is missing treating clinician or facility details.",
          missing_fields: [!doctorName && "metadata.doctor_name", !facilityName && "metadata.facility_name"].filter(Boolean),
        },
        { status: 422 }
      )
    }

    const prescriptionRecord: PrescriptionRecord = {
      id: record.id,
      doctorName,
      doctorRegistrationNumber: doctorRegistration || undefined,
      facilityName,
      date: record.created_at || new Date().toISOString(),
      diagnosis: record.metadata?.diagnosis || record.content,
      medications: parsedMedications,
    }

    bundle = generateFhirPrescriptionBundle(demographics, prescriptionRecord)
  } else if (record.record_type === "lab_result" || record.record_type === "diagnosis") {
    if (!doctorName || !facilityName) {
      return NextResponse.json(
        {
          error: "INCOMPLETE_CLINICAL_RECORD",
          message: "Diagnostic record is missing pathologist/clinician or facility details.",
          missing_fields: [!doctorName && "metadata.doctor_name", !facilityName && "metadata.facility_name"].filter(Boolean),
        },
        { status: 422 }
      )
    }

    const diagnosticRecord: DiagnosticReportRecord = {
      id: record.id,
      doctorName,
      doctorRegistrationNumber: doctorRegistration || undefined,
      facilityName,
      date: record.created_at || new Date().toISOString(),
      category: "LAB",
      conclusion: record.content,
      observations: record.metadata?.observations || [],
    }

    bundle = generateFhirDiagnosticBundle(demographics, diagnosticRecord)
  } else {
    if (!doctorName || !facilityName) {
      return NextResponse.json(
        {
          error: "INCOMPLETE_CLINICAL_RECORD",
          message: "Encounter record is missing treating clinician or facility details.",
          missing_fields: [!doctorName && "metadata.doctor_name", !facilityName && "metadata.facility_name"].filter(Boolean),
        },
        { status: 422 }
      )
    }

    const encounterRecord: EncounterRecord = {
      id: record.id,
      doctorName,
      doctorRegistrationNumber: doctorRegistration || undefined,
      facilityName,
      date: record.created_at || new Date().toISOString(),
      reasonForVisit: record.content || "General Medical Encounter",
      serviceType: (record.metadata?.service_type as any) || "OPD",
      vitals: record.metadata?.vitals || undefined,
    }

    bundle = generateFhirEncounterBundle(demographics, encounterRecord)
  }

  // 5. Strict FHIR Referential Integrity Validation
  const validation = validateFhirBundle(bundle)
  if (!validation.isValid) {
    return NextResponse.json(
      {
        error: "Generated FHIR bundle failed referential integrity validation",
        validationErrors: validation.errors,
      },
      { status: 500 }
    )
  }

  await logAuditEvent({
    action: "fhir_export_success",
    resourceType: "medical_records",
    resourceId: recordId,
    patientId: record.patient_id,
    userId: user.id,
    userRole: callerRole,
    details: { record_type: record.record_type },
  })

  return new NextResponse(JSON.stringify(bundle, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/fhir+json; charset=utf-8",
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      "X-ABDM-Conformance": "FHIR-R4-NRCES-Modelled",
    },
  })
}
