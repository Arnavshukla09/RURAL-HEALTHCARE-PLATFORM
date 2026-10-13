import { describe, it, expect } from "vitest"
import { detectTier0Emergency } from "@/lib/chat/emergency"

describe("Tier 0 Emergency Gate", () => {
  const emergencyTriggers = [
    "I have severe chest pain",
    "heart attack symptoms",
    "seene mein dard ho raha hai",
    "chhati me dard hai",
    "my father cannot breathe",
    "shortness of breath",
    "saans lene me takleef hai",
    "patient is unconscious",
    "saanp ne kaat liya snake bite",
    "snakebite in field",
    "severe bleeding from leg",
    "cough with blood",
    "khoon ki ulti ho rahi hai",
    "stroke symptoms on left side",
    "lakwa mar gaya paralysis",
    "i want to end my life",
    "suicide help",
    "atmahathya karna chahta hu",
    "i want to die",
    "suffocating completely",
    "choking and breathless",
    "poison consumption zeher",
    "loss of consciousness suddenly",
    "fainted and unresponsive",
    "khudkushi ke vichar",
  ]

  const nearMisses = [
    "what is heart healthy diet",
    "exercises for chest muscles",
    "taking a deep breath to relax",
    "snake plant for home",
    "diet during blood donation",
    "paralysis tick prevention in dogs",
    "die of embarrassment",
    "faint smell of smoke",
    "stroke of luck",
    "feeling breathless after running 5km",
    "chilly weather giving mild cold",
    "blood test report review",
    "how to increase blood count naturally",
    "headache after long screen time",
    "mild back pain",
    "knee pain when climbing stairs",
    "drinking water benefits",
    "how to prepare ors at home",
    "can i eat rice in diabetes",
    "fever temperature check",
    "sore throat home remedy",
    "itchy rash on hand",
    "stomach ache after spicy food",
    "healthy food for elderly",
    "vaccination schedule for baby",
  ]

  it("should trigger on all 25 critical emergency phrases", () => {
    for (const phrase of emergencyTriggers) {
      const match = detectTier0Emergency(phrase, "en")
      expect(match, `Expected emergency trigger for: "${phrase}"`).not.toBeNull()
      expect(match?.isEmergency).toBe(true)
    }
  })

  it("should provide Tele-MANAS 14416 for self-harm emergencies", () => {
    const match = detectTier0Emergency("i want to end my life", "en")
    expect(match?.hotline).toBe("14416")
    expect(match?.reply).toContain("14416")
  })

  it("should provide 108 Ambulance for physical emergencies", () => {
    const match = detectTier0Emergency("severe chest pain", "en")
    expect(match?.hotline).toBe("108")
    expect(match?.reply).toContain("108")
  })

  it("should NOT trigger on near-misses", () => {
    for (const phrase of nearMisses) {
      const match = detectTier0Emergency(phrase, "en")
      expect(match, `Unexpected emergency trigger for: "${phrase}"`).toBeNull()
    }
  })

  it("should detect new critical emergencies (pediatric, obstetric, seizures, FAST, toxins)", () => {
    const newEmergencies = [
      "baby not breathing",
      "infant cannot breathe",
      "pregnant woman bleeding heavily",
      "garbhvati mahila heavy bleeding",
      "patient having continuous seizures",
      "mirgi ke daure aa rahe hain",
      "face drooping and slurred speech",
      "swallowed pesticide in farm",
      "keetnashak pi liya",
      "scorpion sting in village",
      "bichhu ne kaat liya",
      "severe burns from fire accident",
      "mujhe saans nahi aa rahi",
    ]

    for (const phrase of newEmergencies) {
      const match = detectTier0Emergency(phrase, "en")
      expect(match, `Expected emergency trigger for new condition: "${phrase}"`).not.toBeNull()
      expect(match?.isEmergency).toBe(true)
      expect(match?.hotline).toBe("108")
    }
  })

  it("should strictly preserve inherently negative emergency phrases (allowlist)", () => {
    const inherentNegativeEmergencies = [
      "baby not breathing",
      "bachha saans nahi le raha",
      "not breathing after accident",
      "saans nahi aa rahi",
      "unable to breathe",
      "सांस नहीं आ रही",
      "बच्चा सांस नहीं ले रहा",
    ]

    for (const phrase of inherentNegativeEmergencies) {
      const match = detectTier0Emergency(phrase, "hi")
      expect(match, `Inherently negative phrase must NOT be suppressed: "${phrase}"`).not.toBeNull()
      expect(match?.isEmergency).toBe(true)
    }
  })

  it("should suppress false alarms when symptom is specifically negated", () => {
    const negatedSymptomPhrases = [
      "I do not have chest pain",
      "don't have chest pain",
      "no chest pain doctor",
      "patient denies chest pain",
      "without any chest pain",
      "seene mein dard nahi hai",
      "chhati me dard nahi hai",
      "dard nahi hai",
      "सीने में दर्द नहीं है",
    ]

    for (const phrase of negatedSymptomPhrases) {
      const match = detectTier0Emergency(phrase, "en")
      expect(match, `Negated symptom should NOT trigger emergency: "${phrase}"`).toBeNull()
    }
  })
})
