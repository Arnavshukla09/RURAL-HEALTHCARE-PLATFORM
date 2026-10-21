import { describe, it, expect } from "vitest"
import { answerMedicalQuery } from "@/lib/ai/medical-brain"

describe("Hardened Medical Brain Regressions", () => {
  it("does not match 'knee pain' to stomach advice", () => {
    const res = answerMedicalQuery("knee pain", "en")
    expect(res).toBeNull()
  })

  it("does not match 'doctors' to ORS hydration advice", () => {
    const res = answerMedicalQuery("how to find doctors near me", "en")
    expect(res).toBeNull()
  })

  it("does not match 'brand new medicine' to fiber advice", () => {
    const res = answerMedicalQuery("is this brand new medicine safe", "en")
    expect(res).toBeNull()
  })

  it("triggers diet-spicy-food advice when GI context is present", () => {
    const res = answerMedicalQuery("can i eat spicy food", "en", ["diarrhea"])
    expect(res).not.toBeNull()
    expect(res).toContain("avoid spicy")
  })

  it("does not give spicy diarrhea advice when context is unrelated (e.g. knee pain)", () => {
    const res = answerMedicalQuery("spicy sauce recipe", "en", ["knee pain"])
    expect(res).toBeNull()
  })

  it("triggers urgent clinical referral and rabies PEP protocol on animal/dog bite", () => {
    const res = answerMedicalQuery("I got a dog bite today in the village", "en")
    expect(res).not.toBeNull()
    expect(res).toContain("ANIMAL / DOG BITE (RABIES PROTOCOL)")
    expect(res).toContain("Wash the wound thoroughly under running tap water with soap for at least 15 minutes")
    expect(res).toContain("Anti-Rabies Vaccine (ARV)")
  })
})
