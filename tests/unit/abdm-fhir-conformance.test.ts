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
let mockHasCareRelationship = true

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

                if (table === "healthcare_providers") {
                  if (col === "user_id" && val === mockCurrentUser?.id) {
                    return { data: { id: "prov-1", user_id: mockCurrentUser?.id }, error: null }
                  }
                  return { data: null, error: { message: "Provider not found" } }
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
              eq: (_col2: string, _val2: any) => ({
                in: (_col3: string, _vals3: any[]) => ({
                  limit: async (_n: number) => {
                    if (table === "appointments") {
                      return {
                        data: mockHasCareRelationship ? [{ id: "apt-1" }] : [],
                        error: null,
                      }
                    }
                    return { data: [], error: null }
                  },
                }),
              }),
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
    })

    it("rejects invalid length and non-numeric ABHA numbers", () => {
      expect(validateAbhaNumber("1234").isValid).toBe(false)
      expect(validateAbhaNumber("14-ABCD-5678-9012").isValid).toBe(false)
      expect(validateAbhaNumber("").isValid).toBe(false)
    })

    it("validates official ABHA addresses (@abdm and sandbox @sbx)", () => {
      expect(validateAbhaAddress("ramesh.sharma@abdm").isValid).toBe(true)
      expect(validateAbhaAddress("anita_verma123@sbx").isValid).toBe(true)
      expect(validateAbhaAddress("priya.patel.99@abdm").isValid).toBe(true)
    })

    it("rejects commercial email handles and invalid characters in ABHA addresses", () => {
      expect(validateAbhaAddress("ramesh@gmail.com").isValid).toBe(false)
      expect(validateAbhaAddress("user@yahoo.co.in").isValid).toBe(false)
      expect(validateAbhaAddress("bad user@abdm").isValid).toBe(false)
      expect(validateAbhaAddress("").isValid).toBe(false)
    })
  })

  describe("2. FHIR Prescription DocumentBundle Generation", () => {
    const samplePrescription: PrescriptionRecord = {
      id: "rx-2026-001",
      doctorName: "Dr. Ajay Goenka",
      doctorRegistrationNumber: "NMC/MPMC-14285",
      facilityName: "AIIMS Bhopal",
      facilityId: "hosp-aiims-bpl",
      date: "2026-10-16T10:30:00Z",
      diagnosis: "Acute Bronchitis (ICD-10 J20.9)",
      medications: [
        {
          medicineName: "Amoxicillin and Clavulanic Acid Tablet 625mg",
          dosage: "625mg",
          frequency: "Twice daily after food",
          duration: "5 days",
          instructions: "Complete the full course even if symptoms resolve",
        },
        {
          medicineName: "Paracetamol Tablet 500mg",
          dosage: "500mg",
          frequency: "Thrice daily as needed for fever",
          duration: "3 days",
        },
      ],
    }

    it("generates a conformant FHIR R4 Document Bundle with Composition entry 0", () => {
      const bundle = generateFhirPrescriptionBundle(samplePatient, samplePrescription)

      expect(bundle.resourceType).toBe("Bundle")
      expect(bundle.type).toBe("document")
      expect(bundle.meta.profile[0]).toContain("DocumentBundle")

      expect(bundle.entry[0].resource.resourceType).toBe("Composition")
      expect(bundle.entry[0].resource.status).toBe("final")
      expect(bundle.entry[0].resource.type.coding[0].code).toBe("PRE")

      const patientEntry = bundle.entry.find((e: any) => e.resource.resourceType === "Patient")
      expect(patientEntry).toBeDefined()
      expect(patientEntry.resource.name[0].text).toBe("Rameshwar Prasad")

      const practitionerEntry = bundle.entry.find((e: any) => e.resource.resourceType === "Practitioner")
      expect(practitionerEntry).toBeDefined()
      expect(practitionerEntry.resource.identifier[0].value).toBe("NMC/MPMC-14285")

      const medRequests = bundle.entry.filter((e: any) => e.resource.resourceType === "MedicationRequest")
      expect(medRequests.length).toBe(2)
      expect(medRequests[0].resource.medicationCodeableConcept.text).toContain("Amoxicillin")

      const validation = validateFhirBundle(bundle)
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  describe("3. FHIR DiagnosticReport DocumentBundle Generation", () => {
    const sampleDiagnostic: DiagnosticReportRecord = {
      id: "diag-2026-002",
      doctorName: "Dr. Sunita Pathak",
      doctorRegistrationNumber: "MPMC-9921",
      facilityName: "District Hospital Sehore Diagnostic Lab",
      date: "2026-10-16T11:00:00Z",
      category: "LAB",
      conclusion: "Mild fasting hyperglycemia, HbA1c indicative of pre-diabetes",
      observations: [
        {
          code: "1558-6",
          display: "Fasting Blood Glucose",
          value: 118,
          unit: "mg/dL",
          referenceRangeLow: 70,
          referenceRangeHigh: 100,
          interpretation: "H",
        },
        {
          code: "4548-4",
          display: "Hemoglobin A1c/Hemoglobin.total in Blood",
          value: 5.9,
          unit: "%",
          referenceRangeLow: 4.0,
          referenceRangeHigh: 5.6,
          interpretation: "H",
        },
      ],
    }

    it("generates a conformant FHIR DiagnosticReport Bundle with structured LOINC observations", () => {
      const bundle = generateFhirDiagnosticBundle(samplePatient, sampleDiagnostic)

      expect(bundle.resourceType).toBe("Bundle")
      expect(bundle.type).toBe("document")
      expect(bundle.entry[0].resource.resourceType).toBe("Composition")

      const diagEntry = bundle.entry.find((e: any) => e.resource.resourceType === "DiagnosticReport")
      expect(diagEntry).toBeDefined()
      expect(diagEntry.resource.conclusion).toContain("pre-diabetes")
      expect(diagEntry.resource.result.length).toBe(2)

      const observations = bundle.entry.filter((e: any) => e.resource.resourceType === "Observation")
      expect(observations.length).toBe(2)
      expect(observations[0].resource.valueQuantity.value).toBe(118)
      expect(observations[0].resource.interpretation[0].coding[0].code).toBe("H")

      const validation = validateFhirBundle(bundle)
      expect(validation.isValid).toBe(true)
    })
  })

  describe("4. FHIR Encounter DocumentBundle Generation", () => {
    const sampleEncounter: EncounterRecord = {
      id: "enc-2026-003",
      doctorName: "Dr. Arjun Patel",
      facilityName: "Community Health Centre Ashta",
      date: "2026-10-16T09:15:00Z",
      reasonForVisit: "Routine Antenatal Followup (Second Trimester)",
      serviceType: "OPD",
      vitals: {
        systolicBp: 118,
        diastolicBp: 76,
        heartRate: 78,
        spo2Percentage: 99,
        temperatureFahrenheit: 98.4,
      },
    }

    it("generates a conformant FHIR Encounter Bundle with vital observations", () => {
      const bundle = generateFhirEncounterBundle(samplePatient, sampleEncounter)

      expect(bundle.entry[0].resource.resourceType).toBe("Composition")
      const encEntry = bundle.entry.find((e: any) => e.resource.resourceType === "Encounter")
      expect(encEntry).toBeDefined()
      expect(encEntry.resource.reasonCode[0].text).toContain("Antenatal Followup")

      const vitals = bundle.entry.filter((e: any) => e.resource.resourceType === "Observation")
      expect(vitals.length).toBe(5)

      const validation = validateFhirBundle(bundle)
      expect(validation.isValid).toBe(true)
    })
  })

  describe("5. FHIR Validation Engine Defenses", () => {
    it("catches bundles missing required profile or invalid type", () => {
      const invalidBundle = {
        resourceType: "Bundle",
        type: "collection",
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

  describe("7. Truthful FHIR Export & Access Scope (GET /api/abdm/fhir-export)", () => {
    beforeEach(() => {
      mockCurrentUser = { id: "user-patient-1", email: "ramesh@example.com" }
      mockSupabaseCallerRole = "patient"
      mockCallerPatientId = "pat-1"
      mockHasCareRelationship = true

      mockDatabaseRecords = {
        "rec-complete-rx": {
          id: "rec-complete-rx",
          patient_id: "pat-1",
          record_type: "prescription",
          content: "Tab Amoxicillin 500mg TDS",
          created_at: "2026-10-16T12:00:00Z",
          metadata: {
            doctor_name: "Dr. Ajay Goenka",
            doctor_registration: "NMC-14285",
            facility_name: "AIIMS Bhopal",
            diagnosis: "Bacterial Pharyngitis",
            medications: [
              {
                medicineName: "Amoxicillin 500mg",
                dosage: "500mg",
                frequency: "Three times daily",
                duration: "5 days",
              },
            ],
          },
          patients: {
            id: "pat-1",
            first_name: "Rameshwar",
            last_name: "Prasad",
            gender: "unknown",
            phone: "+91 98260 12345",
            abha_number: "14-1234-5678-9012",
          },
        },
        "rec-incomplete-rx": {
          id: "rec-incomplete-rx",
          patient_id: "pat-1",
          record_type: "prescription",
          content: "Raw prescription note without structured dosage",
          created_at: "2026-10-16T12:00:00Z",
          // Missing metadata.medications and doctor/facility details
          patients: {
            id: "pat-1",
            first_name: "Rameshwar",
            last_name: "Prasad",
            gender: "male",
          },
        },
      }
    })

    it("rejects incomplete prescription with HTTP 422 and missing_fields array", async () => {
      const req = new NextRequest("http://localhost:3000/api/abdm/fhir-export?record_id=rec-incomplete-rx")
      const res = await GET(req)
      expect(res.status).toBe(422)
      const data = await res.json()
      expect(data.error).toBe("INCOMPLETE_CLINICAL_RECORD")
      expect(data.missing_fields).toContain("metadata.medications")
    })

    it("maps unknown patient gender to FHIR 'unknown' and never fabricates 'male'", async () => {
      const req = new NextRequest("http://localhost:3000/api/abdm/fhir-export?record_id=rec-complete-rx")
      const res = await GET(req)
      expect(res.status).toBe(200)

      const bundle = await res.json()
      const pat = bundle.entry.find((e: any) => e.resource.resourceType === "Patient")
      expect(pat.resource.gender).toBe("unknown")
    })

    it("strictly asserts that no fabricated default string 'Standard dose' exists in output", async () => {
      const req = new NextRequest("http://localhost:3000/api/abdm/fhir-export?record_id=rec-complete-rx")
      const res = await GET(req)
      const rawText = await res.text()
      expect(rawText).not.toContain("Standard dose")
      expect(rawText).not.toContain("As directed")
      expect(rawText).not.toContain("Treating Clinician")
      expect(rawText).not.toContain("Rural Health Centre")
    })

    it("strictly denies administrators from viewing or exporting patient clinical bundles (403)", async () => {
      mockCurrentUser = { id: "user-admin-1", email: "admin@ruralhealth.gov" }
      mockSupabaseCallerRole = "admin"
      mockCallerPatientId = "pat-admin-1"

      const req = new NextRequest("http://localhost:3000/api/abdm/fhir-export?record_id=rec-complete-rx")
      const res = await GET(req)
      expect(res.status).toBe(403)
      const data = await res.json()
      expect(data.error).toContain("Administrators cannot view or export confidential patient clinical bundles")
    })

    it("denies doctor without care relationship from exporting patient bundle (403)", async () => {
      mockCurrentUser = { id: "user-doctor-1", email: "doctor@ruralhealth.gov" }
      mockSupabaseCallerRole = "doctor"
      mockCallerPatientId = "pat-doc-1"
      mockHasCareRelationship = false

      const req = new NextRequest("http://localhost:3000/api/abdm/fhir-export?record_id=rec-complete-rx")
      const res = await GET(req)
      expect(res.status).toBe(403)
      const data = await res.json()
      expect(data.error).toContain("established care relationship")
    })

    it("permits doctor WITH active care relationship to export patient bundle (200)", async () => {
      mockCurrentUser = { id: "user-doctor-1", email: "doctor@ruralhealth.gov" }
      mockSupabaseCallerRole = "doctor"
      mockCallerPatientId = "pat-doc-1"
      mockHasCareRelationship = true

      const req = new NextRequest("http://localhost:3000/api/abdm/fhir-export?record_id=rec-complete-rx")
      const res = await GET(req)
      expect(res.status).toBe(200)
      const bundle = await res.json()
      expect(bundle.resourceType).toBe("Bundle")
    })
  })
})
