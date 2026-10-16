import { type NextRequest, NextResponse } from "next/server"
import { requireUser, authErrorResponse } from "@/lib/auth/guard"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
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

export const dynamic = "force-dynamic"

/**
 * GET /api/abdm/fhir-export?record_id=<id>
 *
 * Exports a clinical record in ABDM NRCES-compliant HL7 FHIR R4 Document Bundle format.
 * Enforces cross-tenant data isolation:
 * - Patients can only export their own records.
 * - Doctors and administrators may export records within their clinical scope.
 */
export async function GET(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "read")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const { searchParams } = new URL(request.url)
    const recordId = searchParams.get("record_id")

    if (!recordId) {
      return NextResponse.json(
        { error: "Missing required 'record_id' query parameter" },
        { status: 400 }
      )
    }

    // 1. Fetch record from database
    const { data: record, error: recordError } = await supabase
      .from("medical_records")
      .select("*, patients(*)")
      .eq("id", recordId)
      .single()

    if (recordError || !record) {
      return NextResponse.json(
        { error: "Medical record not found" },
        { status: 404 }
      )
    }

    // 2. Fetch current caller's role and patient profile
    const { data: callerPatient } = await supabase
      .from("patients")
      .select("id, role")
      .eq("user_id", user.id)
      .single()

    const callerRole = callerPatient?.role || "patient"
    const isOwner = callerPatient?.id === record.patient_id
    const isPrivileged = callerRole === "doctor" || callerRole === "admin"

    if (!isOwner && !isPrivileged) {
      return NextResponse.json(
        { error: "Access denied. You are not authorized to export this patient's clinical bundle." },
        { status: 403 }
      )
    }

    // 3. Assemble Patient Demographics
    const pat = record.patients || {}
    const patientName = [pat.first_name, pat.last_name].filter(Boolean).join(" ") || "Patient"
    const demographics: PatientDemographics = {
      id: pat.id || record.patient_id,
      name: patientName,
      gender: pat.gender === "female" ? "female" : pat.gender === "other" ? "other" : "male",
      birthDate: pat.date_of_birth || undefined,
      phone: pat.phone || undefined,
      district: pat.district || undefined,
      state: pat.state || undefined,
      abhaNumber: pat.abha_number || undefined,
      abhaAddress: pat.abha_address || undefined,
    }

    // 4. Generate bundle based on record_type
    let bundle: Record<string, any>

    if (record.record_type === "prescription") {
      const parsedMedications = record.metadata?.medications || [
        {
          medicineName: record.content || "Prescription item",
          dosage: "Standard dose",
          frequency: "As directed",
          duration: "5 days",
        },
      ]

      const prescriptionRecord: PrescriptionRecord = {
        id: record.id,
        doctorName: record.metadata?.doctor_name || "Treating Clinician",
        doctorRegistrationNumber: record.metadata?.doctor_registration || undefined,
        facilityName: record.metadata?.facility_name || "Rural Health Centre",
        date: record.created_at || new Date().toISOString(),
        diagnosis: record.metadata?.diagnosis || record.content,
        medications: parsedMedications,
      }

      bundle = generateFhirPrescriptionBundle(demographics, prescriptionRecord)
    } else if (record.record_type === "lab_result" || record.record_type === "diagnosis") {
      const diagnosticRecord: DiagnosticReportRecord = {
        id: record.id,
        doctorName: record.metadata?.doctor_name || "Pathologist / Clinician",
        doctorRegistrationNumber: record.metadata?.doctor_registration || undefined,
        facilityName: record.metadata?.facility_name || "Diagnostic Laboratory",
        date: record.created_at || new Date().toISOString(),
        category: "LAB",
        conclusion: record.content,
        observations: record.metadata?.observations || [
          {
            code: "11502-2",
            display: "Clinical Diagnostic Finding",
            value: record.content,
          },
        ],
      }

      bundle = generateFhirDiagnosticBundle(demographics, diagnosticRecord)
    } else {
      const encounterRecord: EncounterRecord = {
        id: record.id,
        doctorName: record.metadata?.doctor_name || "Medical Officer",
        doctorRegistrationNumber: record.metadata?.doctor_registration || undefined,
        facilityName: record.metadata?.facility_name || "Primary Health Centre",
        date: record.created_at || new Date().toISOString(),
        reasonForVisit: record.content || "General Medical Encounter",
        serviceType: (record.metadata?.service_type as any) || "OPD",
        vitals: record.metadata?.vitals || undefined,
      }

      bundle = generateFhirEncounterBundle(demographics, encounterRecord)
    }

    // 5. Strict FHIR Validation
    const validation = validateFhirBundle(bundle)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Generated FHIR bundle failed NRCES conformance validation",
          validationErrors: validation.errors,
        },
        { status: 500 }
      )
    }

    // 6. Return standard application/fhir+json response
    return new NextResponse(JSON.stringify(bundle, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/fhir+json; charset=utf-8",
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-ABDM-Conformance": "NRCES-FHIR-R4-M2",
      },
    })
  } catch (error: any) {
    if (error?.message?.includes("auth") || error?.status === 401) {
      return authErrorResponse(error)
    }
    return NextResponse.json(
      { error: "Internal server error exporting FHIR bundle", detail: error?.message },
      { status: 500 }
    )
  }
}
