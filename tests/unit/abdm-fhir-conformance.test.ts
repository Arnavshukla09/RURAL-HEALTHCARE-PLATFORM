import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  validateAbhaNumber,
  validateAbhaAddress,
  generateFhirPrescriptionBundle,
  generateFhirDiagnosticBundle,
  generateFhirEncounterBundle,
  validateFhirBundle,
  abdmGateway,
  type PatientDemographics,
  type PrescriptionRecord,
  type DiagnosticReportRecord,
  type EncounterRecord,
} from "@/lib/abdm/fhir"
import { GET } from "@/app/api/abdm/fhir-export/route"
import { NextRequest } from "next/server"

// Mock rate-limit to always pass
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, limit: 100, remaining: 99, reset: 0 }),
  rateLimitResponse: vi.fn(),
}))

// Mock auth guard
let mockCurrentUser: { id: string; email: string } | null = { id: "user-patient-1", email: "ramesh@example.com" }
let mockSupabaseCallerRole = "patient"
let mockCallerPatientId = "pat-1"

let mockDatabaseRecords: Record<string, any> = {}

vi.mock("@/lib/auth/guard", () => ({
  requireUser: vi.fn().mockImplementation(async () => {
    if (!mockCurrentUser) {
      const err: any = new Error("Authentication required")
      err.status = 401
      throw err
    }
    return {
      user: mockCurrentUser,
      supabase: {
        from: (table: string) => ({
          select: (_cols?: string) => ({
            eq: (col: string, val: any) => ({
              single: async () => {
                if (table === "patients") {
                  if (col === "user_id" && val === mockCurrentUser?.id) {
                    return {
                      data: {
                        id: mockCallerPatientId,
                        user_id: mockCurrentUser?.id,
                        role: mockSupabaseCallerRole,
                      },
                      error: null,
                    }
                  }
                  return { data: null, error: { message: "Patient not found" } }
                }

                if (table === "medical_records") {
                  if (col === "id") {
                    const record = mockDatabaseRecords[val]
                    if (record) {
                      return { data: record, error: null }
                    }
                    return { data: null, error: { message: "Record not found" } }
                  }
                }

                return { data: null, error: null }
              },
            }),
          }),
        }),
      },
    }
  }),
  authErrorResponse: vi.fn().mockImplementation((_err: any) => {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }),
}))

describe("ABDM & FHIR R4 Interoperability Conformance (Phase 8)", () => {
  const samplePatient: PatientDemographics = {
    id: "pat-101",
    name: "Rameshwar Prasad",
    gender: "male",
    birthDate: "1982-05-14",
    phone: "+91 98260 12345",
    district: "Sehore",
    state: "Madhya Pradesh",
    abhaNumber: "14-1234-5678-9012",
    abhaAddress: "rameshwar.prasad@abdm",
  }

  describe("1. ABHA Number & Address Validation", () => {
    it("normalizes and validates standard 14-digit ABHA numbers", () => {
      const res1 = validateAbhaNumber("14-1234-5678-9012")
      expect(res1.isValid).toBe(true)
      expect(res1.normalized).toBe("14-1234-5678-9012")

      const res2 = validateAbhaNumber("14123456789012")
      expect(res2.isValid).toBe(true)
      expect(res2.normalized).toBe("14-1234-5678-9012")

      const res3 = validateAbhaNumber("14 1234 5678 9012")
      expect(res3.isValid).toBe(true)
      expect(res3.normalized).toBe("14-1234-5678-9012")
    })

    it("rejects invalid ABHA number formats", () => {
      const tooShort = validateAbhaNumber("14-1234-5678")
      expect(tooShort.isValid).toBe(false)
      expect(tooShort.error).toBeDefined()

      const nonDigits = validateAbhaNumber("14-1234-5678-ABCD")
      expect(nonDigits.isValid).toBe(false)

      const tooLong = validateAbhaNumber("14-1234-5678-9012-34")
      expect(tooLong.isValid).toBe(false)
    })

    it("validates official ABHA addresses (@abdm, @sbx, @e-swasthya)", () => {
      expect(validateAbhaAddress("ramesh.kumar@abdm").isValid).toBe(true)
      expect(validateAbhaAddress("dr.sharma.clinic@sbx").isValid).toBe(true)
      expect(validateAbhaAddress("anita_verma@e-swasthya").isValid).toBe(true)
    })

    it("rejects non-ABDM handles and malformed addresses", () => {
      expect(validateAbhaAddress("ramesh@gmail.com").isValid).toBe(false)
      expect(validateAbhaAddress("invalid_handle").isValid).toBe(false)
      expect(validateAbhaAddress("@abdm").isValid).toBe(false)
    })
  })

  describe("2. Prescription FHIR R4 Document Bundle Conformance", () => {
    const samplePrescription: PrescriptionRecord = {
      id: "rx-2026-001",
      doctorName: "Dr. Ajay Goenka",
      doctorRegistrationNumber: "MPMC-48291",
      facilityName: "District Hospital Sehore",
      date: "2026-10-16T10:00:00Z",
      diagnosis: "Acute Bronchitis (J20.9)",
      medications: [
        {
          medicineName: "Amoxicillin 500mg",
          dosage: "500mg",
          frequency: "Thrice daily after meals",
          duration: "5 days",
          instructions: "Complete entire antibiotic course",
        },
        {
          medicineName: "Paracetamol 650mg",
          dosage: "650mg",
          frequency: "SOS for fever above 100 F",
          duration: "3 days",
        },
      ],
    }

    it("generates an NRCES-compliant FHIR R4 Prescription Document Bundle", () => {
      const bundle = generateFhirPrescriptionBundle(samplePatient, samplePrescription)

      expect(bundle.resourceType).toBe("Bundle")
      expect(bundle.type).toBe("document")
      expect(bundle.meta.profile).toContain("https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle")

      // Entry 0 MUST be Composition
      const comp = bundle.entry[0].resource
      expect(comp.resourceType).toBe("Composition")
      expect(comp.type.coding[0].code).toBe("PRE")
      expect(comp.section[0].code.coding[0].code).toBe("57833-6") // LOINC for Prescription

      // Patient Resource
      const patientEntry = bundle.entry.find((e: any) => e.resource.resourceType === "Patient")?.resource
      expect(patientEntry).toBeDefined()
      expect(patientEntry.name[0].text).toBe("Rameshwar Prasad")
      expect(patientEntry.identifier.some((id: any) => id.value === "14-1234-5678-9012")).toBe(true)

      // Practitioner Resource
      const practEntry = bundle.entry.find((e: any) => e.resource.resourceType === "Practitioner")?.resource
      expect(practEntry).toBeDefined()
      expect(practEntry.identifier[0].value).toBe("MPMC-48291")

      // MedicationRequest Resources
      const medRequests = bundle.entry.filter((e: any) => e.resource.resourceType === "MedicationRequest")
      expect(medRequests.length).toBe(2)
      expect(medRequests[0].resource.medicationCodeableConcept.text).toBe("Amoxicillin 500mg")

      // Conformance validator passes
      const validation = validateFhirBundle(bundle)
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  describe("3. Diagnostic Report & Observations Bundle Conformance", () => {
    const sampleDiagnostic: DiagnosticReportRecord = {
      id: "diag-2026-004",
      doctorName: "Dr. Nidhi Gupta",
      doctorRegistrationNumber: "MPMC-39182",
      facilityName: "AIIMS Bhopal Central Laboratory",
      date: "2026-10-16T09:30:00Z",
      category: "LAB",
      conclusion: "Impaired Fasting Glucose, normal lipid profile.",
      observations: [
        {
          code: "1558-6",
          display: "Fasting Blood Glucose",
          value: 118,
          unit: "mg/dL",
          referenceRangeLow: 70,
          referenceRangeHigh: 99,
          interpretation: "H",
        },
        {
          code: "2085-9",
          display: "HDL Cholesterol",
          value: 48,
          unit: "mg/dL",
          referenceRangeLow: 40,
          referenceRangeHigh: 60,
          interpretation: "N",
        },
        {
          code: "11268-0",
          display: "Urine Glucose",
          value: "Negative",
        },
      ],
    }

    it("generates an NRCES-compliant DiagnosticReport with LOINC Observations", () => {
      const bundle = generateFhirDiagnosticBundle(samplePatient, sampleDiagnostic)

      expect(bundle.resourceType).toBe("Bundle")
      expect(bundle.type).toBe("document")

      const diagRep = bundle.entry.find((e: any) => e.resource.resourceType === "DiagnosticReport")?.resource
      expect(diagRep).toBeDefined()
      expect(diagRep.status).toBe("final")
      expect(diagRep.category[0].coding[0].code).toBe("LAB")
      expect(diagRep.result.length).toBe(3)

      const observations = bundle.entry.filter((e: any) => e.resource.resourceType === "Observation")
      expect(observations.length).toBe(3)

      // Numeric observation with range
      const fbg = observations[0].resource
      expect(fbg.code.coding[0].code).toBe("1558-6")
      expect(fbg.valueQuantity.value).toBe(118)
      expect(fbg.referenceRange[0].high.value).toBe(99)
      expect(fbg.interpretation[0].coding[0].code).toBe("H")

      // Qualitative observation
      const urine = observations[2].resource
      expect(urine.valueString).toBe("Negative")

      // Conformance validation
      const validation = validateFhirBundle(bundle)
      expect(validation.isValid).toBe(true)
    })
  })

  describe("4. Encounter & Vital Signs Bundle Conformance", () => {
    const sampleEncounter: EncounterRecord = {
      id: "enc-2026-088",
      doctorName: "Dr. Kavita Sharma",
      facilityName: "CHC Berasia Rural Health Camp",
      date: "2026-10-16T11:00:00Z",
      reasonForVisit: "Hypertension screening and general health checkup",
      serviceType: "CAMP",
      vitals: {
        systolicBp: 138,
        diastolicBp: 88,
        heartRate: 74,
        temperatureFahrenheit: 98.4,
        spo2Percentage: 98,
      },
    }

    it("generates an Encounter Bundle with Vital Signs Observations", () => {
      const bundle = generateFhirEncounterBundle(samplePatient, sampleEncounter)

      expect(bundle.resourceType).toBe("Bundle")
      const encResource = bundle.entry.find((e: any) => e.resource.resourceType === "Encounter")?.resource
      expect(encResource).toBeDefined()
      expect(encResource.status).toBe("finished")
      expect(encResource.class.code).toBe("AMB")

      const vitalsObs = bundle.entry.filter((e: any) => e.resource.resourceType === "Observation")
      expect(vitalsObs.length).toBe(5)

      const sysBp = vitalsObs.find((o: any) => o.resource.code.coding[0].code === "8480-6")
      expect(sysBp).toBeDefined()
      expect(sysBp.resource.valueQuantity.value).toBe(138)
      expect(sysBp.resource.valueQuantity.unit).toBe("mmHg")

      const validation = validateFhirBundle(bundle)
      expect(validation.isValid).toBe(true)
    })
  })

  describe("5. FHIR Validation Engine Defenses", () => {
    it("catches bundles missing required NRCES profile or invalid type", () => {
      const invalidBundle = {
        resourceType: "Bundle",
        type: "collection", // Invalid: must be 'document'
        meta: { profile: ["https://example.org/OtherBundle"] },
        entry: [],
      }

      const res = validateFhirBundle(invalidBundle)
      expect(res.isValid).toBe(false)
      expect(res.errors.some((e) => e.includes("document"))).toBe(true)
      expect(res.errors.some((e) => e.includes("meta.profile"))).toBe(true)
    })

    it("catches dangling internal references", () => {
      const valid = generateFhirPrescriptionBundle(samplePatient, {
        id: "rx-99",
        doctorName: "Dr. Test",
        facilityName: "PHC",
        date: "2026-10-16T00:00:00Z",
        medications: [{ medicineName: "Test", dosage: "1", frequency: "1", duration: "1" }],
      })

      // Corrupt Composition subject reference to point to a non-existent UUID
      valid.entry[0].resource.subject.reference = "urn:uuid:ghost-patient-999"

      const res = validateFhirBundle(valid)
      expect(res.isValid).toBe(false)
      expect(res.errors.some((e) => e.includes("ghost-patient-999"))).toBe(true)
    })

    it("catches missing Patient gender or name", () => {
      const valid = generateFhirPrescriptionBundle(samplePatient, {
        id: "rx-100",
        doctorName: "Dr. Test",
        facilityName: "PHC",
        date: "2026-10-16T00:00:00Z",
        medications: [{ medicineName: "Test", dosage: "1", frequency: "1", duration: "1" }],
      })

      // Remove patient gender
      const patIndex = valid.entry.findIndex((e: any) => e.resource.resourceType === "Patient")
      delete valid.entry[patIndex].resource.gender

      const res = validateFhirBundle(valid)
      expect(res.isValid).toBe(false)
      expect(res.errors.some((e) => e.includes("gender"))).toBe(true)
    })
  })

  describe("6. ABDM Gateway Zero-Cost Verification", () => {
    it("operates in simulated mode without network egress when credentials are unset", async () => {
      expect(abdmGateway.isLive).toBe(false)
      const res = await abdmGateway.verifyAbha("14-1234-5678-9012")
      expect(res.verified).toBe(true)
      expect(res.mode).toBe("simulated")
      expect(res.abhaNumber).toBe("14-1234-5678-9012")
    })
  })

  describe("7. FHIR Export API Route Security & Authorization (GET /api/abdm/fhir-export)", () => {
    beforeEach(() => {
      mockCurrentUser = { id: "user-patient-1", email: "ramesh@example.com" }
      mockSupabaseCallerRole = "patient"
      mockCallerPatientId = "pat-1"

      mockDatabaseRecords = {
        "rec-own": {
          id: "rec-own",
          patient_id: "pat-1",
          record_type: "prescription",
          content: "Tab Ciprofloxacin 500mg BD",
          created_at: "2026-10-16T12:00:00Z",
          patients: {
            id: "pat-1",
            first_name: "Rameshwar",
            last_name: "Prasad",
            gender: "male",
            phone: "+91 98260 12345",
            abha_number: "14-1234-5678-9012",
          },
        },
        "rec-other": {
          id: "rec-other",
          patient_id: "pat-2",
          record_type: "prescription",
          content: "Confidential record of Patient 2",
          created_at: "2026-10-16T12:00:00Z",
          patients: {
            id: "pat-2",
            first_name: "Other",
            last_name: "Patient",
            gender: "female",
          },
        },
      }
    })

    it("rejects request missing record_id parameter with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/abdm/fhir-export")
      const res = await GET(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain("Missing required 'record_id'")
    })

    it("rejects unauthenticated request with 401", async () => {
      mockCurrentUser = null
      const req = new NextRequest("http://localhost:3000/api/abdm/fhir-export?record_id=rec-own")
      const res = await GET(req)
      expect(res.status).toBe(401)
    })

    it("blocks cross-tenant unauthorized export with 403 Forbidden", async () => {
      // Patient 1 attempting to export Patient 2's record
      const req = new NextRequest("http://localhost:3000/api/abdm/fhir-export?record_id=rec-other")
      const res = await GET(req)
      expect(res.status).toBe(403)
      const data = await res.json()
      expect(data.error).toContain("Access denied")
    })

    it("allows patient to export their own prescription as an application/fhir+json bundle", async () => {
      const req = new NextRequest("http://localhost:3000/api/abdm/fhir-export?record_id=rec-own")
      const res = await GET(req)
      expect(res.status).toBe(200)
      expect(res.headers.get("content-type")).toContain("application/fhir+json")
      expect(res.headers.get("x-abdm-conformance")).toBe("NRCES-FHIR-R4-M2")

      const bundle = await res.json()
      expect(bundle.resourceType).toBe("Bundle")
      expect(bundle.type).toBe("document")
      expect(bundle.entry[0].resource.resourceType).toBe("Composition")
    })

    it("allows doctor to export any patient's record within clinical scope", async () => {
      mockCurrentUser = { id: "user-doctor-1", email: "doctor@ruralhealth.gov" }
      mockSupabaseCallerRole = "doctor"
      mockCallerPatientId = "pat-doc-1"

      const req = new NextRequest("http://localhost:3000/api/abdm/fhir-export?record_id=rec-other")
      const res = await GET(req)
      expect(res.status).toBe(200)
      const bundle = await res.json()
      expect(bundle.resourceType).toBe("Bundle")
    })

    it("returns 404 when requested medical record does not exist", async () => {
      const req = new NextRequest("http://localhost:3000/api/abdm/fhir-export?record_id=rec-ghost")
      const res = await GET(req)
      expect(res.status).toBe(404)
    })
  })
})
