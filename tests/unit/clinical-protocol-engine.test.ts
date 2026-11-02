import { describe, it, expect } from "vitest"
import {
  evaluateNcdProtocol,
  evaluateAncProtocol,
} from "@/lib/clinical/protocol-engine"

describe("Frontline Decision Support Protocol Engine (Ayu-inspired CDSS)", () => {
  describe("NCD Protocol: Hypertension & Diabetes", () => {
    it("classifies normal blood pressure and glucose within routine limits", () => {
      const result = evaluateNcdProtocol({
        systolicBp: 118,
        diastolicBp: 76,
        randomBloodSugar: 110,
      })

      expect(result.urgency).toBe("ROUTINE_GREEN")
      expect(result.requiresImmediateReferral).toBe(false)
      expect(result.classifications).toContain("NCD PARAMETERS WITHIN NORMAL LIMITS")
      expect(result.observations.length).toBe(3) // Systolic, Diastolic, Sugar

      const sysObs = result.observations.find((o) => o.code === "8480-6")
      expect(sysObs?.interpretation).toBe("normal")
    })

    it("triggers Stage 2 Hypertension for BP >= 140/90", () => {
      const result = evaluateNcdProtocol({
        systolicBp: 152,
        diastolicBp: 94,
      })

      expect(result.urgency).toBe("URGENT_YELLOW")
      expect(result.classifications).toContain("STAGE 2 HYPERTENSION")
      expect(result.hindiClassifications[0]).toContain("स्टेज 2 उच्च रक्तचाप")
    })

    it("escalates to EMERGENCY_RED on Hypertensive Crisis with target organ damage symptoms", () => {
      const result = evaluateNcdProtocol({
        systolicBp: 195,
        diastolicBp: 124,
        symptoms: {
          chestPain: true,
          shortnessOfBreath: true,
        },
      })

      expect(result.urgency).toBe("EMERGENCY_RED")
      expect(result.requiresImmediateReferral).toBe(true)
      expect(result.classifications).toContain("HYPERTENSIVE EMERGENCY (Target Organ Damage Risk)")
    })

    it("detects Hypoglycemia danger sign (< 70 mg/dL) as an immediate emergency", () => {
      const result = evaluateNcdProtocol({
        randomBloodSugar: 54,
      })

      expect(result.urgency).toBe("EMERGENCY_RED")
      expect(result.requiresImmediateReferral).toBe(true)
      expect(result.classifications).toContain("HYPOGLYCEMIA ALERT (Low Blood Sugar)")
      expect(result.recommendedActions[0]).toContain("15-20g oral fast-acting glucose")
    })
  })

  describe("High-Risk Pregnancy (ANC) Triage Protocol", () => {
    it("identifies routine pregnancy with no red flags", () => {
      const result = evaluateAncProtocol({
        gestationalWeeks: 24,
        systolicBp: 112,
        diastolicBp: 70,
      })

      expect(result.urgency).toBe("ROUTINE_GREEN")
      expect(result.requiresImmediateReferral).toBe(false)
      expect(result.classifications).toContain("ROUTINE ANTENATAL CARE (No Red Flags Detected)")
    })

    it("triggers emergency referral for impending eclampsia (Hypertension + Severe Headache/Blurred Vision)", () => {
      const result = evaluateAncProtocol({
        gestationalWeeks: 34,
        systolicBp: 156,
        diastolicBp: 102,
        hasSevereHeadacheOrBlurredVision: true,
      })

      expect(result.urgency).toBe("EMERGENCY_RED")
      expect(result.requiresImmediateReferral).toBe(true)
      expect(result.classifications).toContain("IMPENDING ECLAMPSIA / SEVERE PRE-ECLAMPSIA")
      expect(result.recommendedActions[0]).toContain("Magnesium Sulfate")
    })

    it("triggers emergency referral for vaginal bleeding at any gestational age", () => {
      const result = evaluateAncProtocol({
        gestationalWeeks: 28,
        hasVaginalBleeding: true,
      })

      expect(result.urgency).toBe("EMERGENCY_RED")
      expect(result.requiresImmediateReferral).toBe(true)
      expect(result.classifications).toContain("ANTEPARTUM / OBSTETRIC HEMORRHAGE RISK")
      expect(result.recommendedActions[0]).toContain("DO NOT perform digital pelvic examination")
    })

    it("flags decreased fetal movements in third trimester as urgent", () => {
      const result = evaluateAncProtocol({
        gestationalWeeks: 32,
        hasReducedFetalMovements: true,
      })

      expect(result.urgency).toBe("URGENT_YELLOW")
      expect(result.classifications).toContain("DECREASED FETAL MOVEMENTS (Fetal Distress Risk)")
    })
  })
})
