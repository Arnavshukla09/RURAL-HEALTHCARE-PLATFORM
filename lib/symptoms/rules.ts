/**
 * lib/symptoms/rules.ts
 *
 * Deterministic clinical rules to compute urgency/severity.
 * Escalates high-risk demographics: infants (<1y) and elders (>=60y).
 */

import { SYMPTOM_CATALOG } from "./catalog"

export type Intensity = "mild" | "moderate" | "severe"
export type DurationGroup = "lt1d" | "1to3d" | "gt3d"
export type AgeGroup = "infant" | "child" | "adult" | "elder"
export type ComputedSeverity = "low" | "medium" | "high" | "emergency"

export interface TriageInput {
  symptoms: string[]
  intensity?: Intensity
  temperature?: string
  tempUnit?: string
  daysSick?: string
  age?: string
  gender?: string
}

export function deriveAgeGroup(ageStr?: string): AgeGroup {
  if (!ageStr) return "adult"
  const age = parseFloat(ageStr)
  if (isNaN(age)) return "adult"
  if (age < 1) return "infant"
  if (age < 12) return "child"
  if (age >= 60) return "elder"
  return "adult"
}

export function deriveDurationGroup(daysSickStr?: string): DurationGroup {
  if (!daysSickStr) return "1to3d"
  const days = parseFloat(daysSickStr)
  if (isNaN(days) || days <= 1) return "lt1d"
  if (days <= 3) return "1to3d"
  return "gt3d"
}

export function computeSeverity(input: TriageInput): ComputedSeverity {
  const { symptoms, intensity = "moderate", temperature, tempUnit = "F", daysSick, age } = input

  const ageGroup = deriveAgeGroup(age)
  const durationGroup = deriveDurationGroup(daysSick)

  const tempVal = temperature ? parseFloat(temperature) : NaN
  const isHighFever =
    !isNaN(tempVal) && (tempUnit.toUpperCase() === "C" ? tempVal >= 39.4 : tempVal >= 103.0)

  // 1. Check for red-flag symptoms
  const hasRedFlag = symptoms.some((s) => {
    const sLower = s.toLowerCase()
    const def = SYMPTOM_CATALOG.find(
      (c) => c.id === sLower || c.en.toLowerCase() === sLower || c.hi.toLowerCase() === sLower
    )
    return def?.redFlag
  })

  // Cardiac or severe respiratory is immediate emergency
  const isCriticalEmergency = symptoms.some((s) => {
    const l = s.toLowerCase()
    return (
      l.includes("chest pain") ||
      l.includes("shortness of breath") ||
      l.includes("fainting") ||
      l.includes("blood in stool") ||
      l.includes("cough with blood")
    )
  })

  if (isCriticalEmergency) {
    return "emergency"
  }

  // Base tier from red flags and intensity
  let severity: ComputedSeverity = "low"

  if (hasRedFlag || isHighFever || intensity === "severe") {
    severity = "high"
  } else if (intensity === "moderate" || symptoms.length >= 3 || durationGroup === "gt3d") {
    severity = "medium"
  } else {
    severity = "low"
  }

  // 2. Vulnerable demographic escalation (Infants and Elders escalate one level)
  if (ageGroup === "infant" || ageGroup === "elder") {
    if (severity === "low") severity = "medium"
    else if (severity === "medium") severity = "high"
    else if (severity === "high") severity = "emergency"
  }

  return severity
}
