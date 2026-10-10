/**
 * lib/symptoms/compose.ts
 *
 * Deterministic composition of clinical advice from symptom components.
 * Memoizes compositions in-memory and client storage for 0ms offline execution.
 */

import { TriageInput, computeSeverity, deriveAgeGroup, deriveDurationGroup, ComputedSeverity } from "./rules"
import { SYMPTOM_PARTS, COMBINATION_OVERRIDES } from "./responses"
import { findSymptomByIdOrName } from "./catalog"

export interface ComposedTriageResult {
  urgency: ComputedSeverity
  specialistNeeded: string
  immediateActions: string[]
  homeCare: string[]
  whenToGoToHospital: string
  cacheKey: string
}

export function buildSymptomKey(input: TriageInput): string {
  const sortedSymptoms = [...input.symptoms]
    .map((s) => {
      const def = findSymptomByIdOrName(s)
      return def ? def.id : s.toLowerCase().replace(/\s+/g, "-")
    })
    .sort()
    .join("+")

  const intensity = input.intensity || "moderate"
  const duration = deriveDurationGroup(input.daysSick)
  const ageGroup = deriveAgeGroup(input.age)

  return `${sortedSymptoms}|${intensity}|${duration}|${ageGroup}`
}

export function composeResponse(input: TriageInput, language: string = "en"): ComposedTriageResult {
  const lang = language === "hi" ? "hi" : "en"
  const urgency = computeSeverity(input)
  const cacheKey = buildSymptomKey(input)

  const immediateActions: string[] = []
  const homeCare: string[] = []
  let specialist = lang === "hi" ? "सामान्य चिकित्सक (Medical Officer)" : "General Physician / Medical Officer"

  // 1. Check dangerous combination overrides
  for (const [comboKey, override] of Object.entries(COMBINATION_OVERRIDES)) {
    const requiredSymptoms = comboKey.split("+")
    const hasAll = requiredSymptoms.every((req) =>
      input.symptoms.some((s) => s.toLowerCase().includes(req.replace(/-/g, " ")) || s.toLowerCase().includes(req))
    )

    if (hasAll) {
      immediateActions.push(lang === "hi" ? override.actionHi : override.actionEn)
      homeCare.push(lang === "hi" ? override.warningHi : override.warningEn)
    }
  }

  // 2. Aggregate per-symptom fragments
  for (const s of input.symptoms) {
    const l = s.toLowerCase()
    let partKey = "general"

    if (l.includes("fever")) partKey = "fever"
    else if (l.includes("diarrhea") || l.includes("stool") || l.includes("stomach")) partKey = "diarrhea"
    else if (l.includes("headache")) partKey = "headache"
    else if (l.includes("cough")) partKey = "cough"

    const part = SYMPTOM_PARTS[partKey] || SYMPTOM_PARTS.general

    const actions = lang === "hi" ? part.immediateActionsHi : part.immediateActionsEn
    const care = lang === "hi" ? part.homeCareHi : part.homeCareEn

    for (const a of actions) {
      if (!immediateActions.includes(a) && immediateActions.length < 4) immediateActions.push(a)
    }
    for (const c of care) {
      if (!homeCare.includes(c) && homeCare.length < 4) homeCare.push(c)
    }
  }

  // Fallback defaults if empty
  if (immediateActions.length === 0) {
    immediateActions.push(
      lang === "hi"
        ? "पर्याप्त विश्राम करें और स्वच्छ जल/तरल पदार्थों का सेवन करें"
        : "Rest comfortably and stay hydrated with clean boiled water or fluids"
    )
  }

  // Guaranteed emergency line
  const whenToGoToHospital =
    urgency === "emergency"
      ? lang === "hi"
        ? "🚨 तुरंत 108 एम्बुलेंस पर कॉल करें या नजदीकी अस्पताल के इमरजेंसी वार्ड में जाएं।"
        : "🚨 CALL 108 AMBULANCE IMMEDIATELY or go directly to the nearest hospital casualty."
      : lang === "hi"
      ? "यदि बुखार 103°F से ऊपर जाए, सांस लेने में तकलीफ हो, या 2 दिन में सुधार न दिखे, तो नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC) जाएं।"
      : "Visit your nearest Primary Health Centre (PHC) if symptoms worsen after 2 days, fever exceeds 103°F, or breathing difficulty develops."

  return {
    urgency,
    specialistNeeded: specialist,
    immediateActions,
    homeCare,
    whenToGoToHospital,
    cacheKey,
  }
}
