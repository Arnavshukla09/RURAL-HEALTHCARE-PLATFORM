import { describe, it, expect, vi } from "vitest"

// Mock the auth guard for unit test environment
vi.mock("@/lib/auth/guard", () => ({
  requireUser: vi.fn(),
  getPatientProfile: vi.fn(),
  authErrorResponse: vi.fn(),
}))

import { createClientEntityId } from "@/lib/offline/outbox"
import {
  ClinicalEncounterDataSchema,
  ClinicalObservationDataSchema,
  OperationSchema,
} from "@/lib/services/offline-sync.service"

describe("Edge-Preassigned Relational Offline Sync (Intelehealth Architecture)", () => {
  it("createClientEntityId generates RFC4122 v4 compliant UUID strings", () => {
    const uuid1 = createClientEntityId()
    const uuid2 = createClientEntityId()

    const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    expect(uuid1).toMatch(uuidv4Regex)
    expect(uuid2).toMatch(uuidv4Regex)
    expect(uuid1).not.toBe(uuid2)
  })

  it("validates ClinicalEncounterDataSchema for offline store-and-forward submissions", () => {
    const encounterId = createClientEntityId()
    const validEncounter = {
      id: encounterId,
      encounter_type: "triage" as const,
      status: "queued" as const,
      chief_complaint: "High fever with chills for 3 days",
      clinical_notes: "Frontline worker triage screening completed via IMCI protocol.",
      media_urls: ["https://example.com/rash.webp"],
    }

    const result = ClinicalEncounterDataSchema.safeParse(validEncounter)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBe(encounterId)
      expect(result.data.encounter_type).toBe("triage")
    }
  })

  it("validates ClinicalObservationDataSchema and links to parent encounter UUID", () => {
    const encounterId = createClientEntityId()
    const observationId = createClientEntityId()

    const observation = {
      id: observationId,
      encounter_id: encounterId,
      code: "8480-6",
      code_system: "LOINC",
      display: "Systolic blood pressure",
      value_numeric: 138,
      unit: "mmHg",
      interpretation: "high" as const,
    }

    const result = ClinicalObservationDataSchema.safeParse(observation)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.encounter_id).toBe(encounterId)
      expect(result.data.code).toBe("8480-6")
    }
  })

  it("accepts clinical_encounters and clinical_observations in OperationSchema", () => {
    const clientOpId = createClientEntityId()
    const encounterId = createClientEntityId()

    const op = {
      client_op_id: clientOpId,
      entity_id: encounterId,
      table: "clinical_encounters" as const,
      type: "INSERT" as const,
      data: {
        id: encounterId,
        encounter_type: "triage",
        chief_complaint: "Pediatric fever",
      },
    }

    const parsed = OperationSchema.safeParse(op)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.entity_id).toBe(encounterId)
      expect(parsed.data.table).toBe("clinical_encounters")
    }
  })
})
