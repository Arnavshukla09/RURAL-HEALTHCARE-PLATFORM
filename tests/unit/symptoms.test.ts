import { describe, it, expect } from "vitest"
import { buildSymptomKey, composeResponse } from "@/lib/symptoms/compose"
import { computeSeverity } from "@/lib/symptoms/rules"

describe("Structured Symptom Composition & Rules", () => {
  it("buildSymptomKey is order-independent", () => {
    const key1 = buildSymptomKey({ symptoms: ["fever", "headache"], intensity: "mild" })
    const key2 = buildSymptomKey({ symptoms: ["headache", "fever"], intensity: "mild" })
    expect(key1).toBe(key2)
  })

  it("escalates severity for infants (<1y) and elders (>=60y)", () => {
    const adultSev = computeSeverity({ symptoms: ["mild-headache"], age: "30", intensity: "mild" })
    const infantSev = computeSeverity({ symptoms: ["mild-headache"], age: "0.5", intensity: "mild" })
    const elderSev = computeSeverity({ symptoms: ["mild-headache"], age: "65", intensity: "mild" })

    expect(adultSev).toBe("low")
    expect(infantSev).toBe("medium")
    expect(elderSev).toBe("medium")
  })

  it("escalates high fever >= 103F to at least high urgency", () => {
    const sev = computeSeverity({ symptoms: ["low-fever"], temperature: "103.5", tempUnit: "F" })
    expect(["high", "emergency"]).toContain(sev)
  })

  it("always includes 108 / PHC emergency line in composed response", () => {
    const result = composeResponse({ symptoms: ["mild-headache"] }, "en")
    expect(result.whenToGoToHospital).toContain("Primary Health Centre")
  })

  it("triggers combination override for chest pain + breathlessness", () => {
    const result = composeResponse({ symptoms: ["chest-pain", "shortness-of-breath"] }, "en")
    expect(result.urgency).toBe("emergency")
    expect(result.whenToGoToHospital).toContain("108")
  })
})
