import { describe, it, expect } from "vitest"
import { validateAbhaNumber, validateAbhaAddress, generateFhirPrescriptionBundle, abdmGateway } from "@/lib/abdm/fhir"
import { evaluateImci, evaluateAncMaternalRisk } from "@/lib/clinical/imci-anc"
import { generateJitsiToken } from "@/lib/jitsi/jwt"

describe("Phase 3 Digital Health Ecosystem", () => {
  describe("ABDM & FHIR R4 Adapter", () => {
    it("validates 14-digit ABHA numbers and normalizes them with hyphens", () => {
      const valid = validateAbhaNumber("14123456789012")
      expect(valid.isValid).toBe(true)
      expect(valid.normalized).toBe("14-1234-5678-9012")

      const validHyphenated = validateAbhaNumber("14-1234-5678-9012")
      expect(validHyphenated.isValid).toBe(true)
      expect(validHyphenated.normalized).toBe("14-1234-5678-9012")

      const invalid = validateAbhaNumber("12345")
      expect(invalid.isValid).toBe(false)
      expect(invalid.error).toBeDefined()
    })

    it("validates ABHA addresses ending with @abdm or @sbx", () => {
      expect(validateAbhaAddress("rajesh.kumar@abdm").isValid).toBe(true)
      expect(validateAbhaAddress("anita.sharma@sbx").isValid).toBe(true)
      expect(validateAbhaAddress("invalid_address@gmail.com").isValid).toBe(false)
    })

    it("generates an HL7 FHIR R4 Bundle containing Composition, Patient, Practitioner, and MedicationRequest", () => {
      const bundle = generateFhirPrescriptionBundle(
        {
          id: "pat-123",
          name: "Ramesh Verma",
          gender: "male",
          birthDate: "1980-05-12",
          abhaNumber: "14-1234-5678-9012",
          district: "Sehore",
          state: "Madhya Pradesh",
        },
        {
          id: "rx-999",
          doctorName: "Dr. Ajay Goenka",
          doctorRegistrationNumber: "MPMC-48291",
          facilityName: "District Hospital Sehore",
          date: new Date().toISOString(),
          medications: [
            {
              medicineName: "Amoxicillin 500mg",
              dosage: "500mg",
              frequency: "TDS",
              duration: "5 days",
              instructions: "After meals",
            },
          ],
        }
      )

      expect(bundle.resourceType).toBe("Bundle")
      expect(bundle.type).toBe("document")
      expect(bundle.entry.length).toBe(5) // Composition, Patient, Practitioner, Organization, MedicationRequest

      const resourceTypes = bundle.entry.map((e: any) => e.resource.resourceType)
      expect(resourceTypes).toContain("Composition")
      expect(resourceTypes).toContain("Patient")
      expect(resourceTypes).toContain("Practitioner")
      expect(resourceTypes).toContain("Organization")
      expect(resourceTypes).toContain("MedicationRequest")
    })

    it("operates in zero-cost simulated mode by default", async () => {
      expect(abdmGateway.isLive).toBe(false)
      const res = await abdmGateway.verifyAbha("14-1234-5678-9012")
      expect(res.verified).toBe(true)
      expect(res.mode).toBe("simulated")
    })
  })

  describe("Community Health Worker (IMCI & ANC) Clinical Triage", () => {
    it("flags pediatric general danger signs as EMERGENCY_RED", () => {
      const result = evaluateImci({
        ageMonths: 18,
        cannotDrinkOrBreastfeed: true,
        vomitsEverything: false,
        convulsions: false,
        lethargicOrUnconscious: false,
        hasCoughOrDifficultyBreathing: false,
        hasDiarrhea: false,
        hasFever: false,
      })

      expect(result.urgency).toBe("EMERGENCY_RED")
      expect(result.requiresImmediateReferral).toBe(true)
      expect(result.classifications[0]).toContain("VERY SEVERE DISEASE")
    })

    it("identifies pneumonia fast-breathing threshold for infants", () => {
      const fastBreathingInfant = evaluateImci({
        ageMonths: 6, // threshold 50 bpm
        cannotDrinkOrBreastfeed: false,
        vomitsEverything: false,
        convulsions: false,
        lethargicOrUnconscious: false,
        hasCoughOrDifficultyBreathing: true,
        respiratoryRate: 52,
        hasDiarrhea: false,
        hasFever: false,
      })

      expect(fastBreathingInfant.urgency).toBe("URGENT_YELLOW")
      expect(fastBreathingInfant.classifications[0]).toContain("PNEUMONIA")
    })

    it("triages maternal obstetric danger signs (preeclampsia/bleeding)", () => {
      const severePreEclampsia = evaluateAncMaternalRisk({
        gestationalWeeks: 32,
        vaginalBleeding: false,
        severeHeadacheWithBlurredVision: true,
        swellingFaceAndHands: true,
        highFever: false,
        foulSmellingDischarge: false,
        reducedFetalMovements: false,
        systolicBp: 165,
        diastolicBp: 112,
      })

      expect(severePreEclampsia.urgency).toBe("EMERGENCY_RED")
      expect(severePreEclampsia.requiresImmediateHospitalization).toBe(true)
      expect(severePreEclampsia.highRiskCategory[0]).toContain("ECLAMPSIA")
    })
  })

  describe("Teleconsultation Cryptographic JWT", () => {
    it("returns null token when no secret is configured ($0 Free Tier fallback)", () => {
      const result = generateJitsiToken({
        roomName: "room-abc",
        userId: "user-123",
        userName: "Test Doctor",
        role: "doctor",
      })

      expect(result.requiresToken).toBe(false)
      expect(result.token).toBeNull()
    })
  })
})
