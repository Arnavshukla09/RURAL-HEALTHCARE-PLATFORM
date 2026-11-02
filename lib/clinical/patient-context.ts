/**
 * lib/clinical/patient-context.ts
 *
 * Patient Clinical Pretext Extraction, Sanitization, and Caching Subsystem.
 * Generates an anonymized, structured clinical baseline from patient demographic
 * and intake health data to augment downstream AI triage (Gemini /api/ai-chat).
 *
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Intelligence Subsystem
 */

export interface PatientClinicalPretext {
  patientId?: string
  age?: number
  gender?: string
  chronicConditions?: string[]
  knownAllergies?: string[]
  currentMedications?: string[]
  bloodPressure?: string
  bloodSugar?: string
  lastUpdated?: string
}

export interface PretextSessionTriage {
  symptoms?: string[]
  bodyPart?: string
  durationDays?: number
  severity?: string
  urgency?: string
}

export const PRETEXT_STORAGE_KEY = "rhcp_patient_clinical_pretext"
const MAX_PRETEXT_LENGTH = 600

/**
 * Scrubs PII (names, phone numbers, emails, addresses) and neutralizes prompt-injection keywords.
 */
export function sanitizeClinicalPretext(input: string): string {
  if (!input || typeof input !== "string") return ""

  let clean = input
    // Scrub emails
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]")
    // Scrub phone numbers (Indian 10-digit, 5+5, 3+3+4, international with +91)
    .replace(/(?:\+?\d{1,3}[-.\s]?)?(?:\d{5}[-.\s]?\d{5}|\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}|\d{10})/g, "[REDACTED_PHONE]")
    // Scrub potential system prompt injection patterns
    .replace(/(?:ignore|override|disregard|forget)\s+(?:all\s+)?(?:previous|prior|above|system)\s+(?:instructions|prompts|rules)/gi, "[REDACTED_INSTRUCTION]")
    .replace(/(?:you\s+are\s+now|act\s+as|pretend\s+to\s+be)\s+a(?:n)?\s+(?:unrestricted|jailbroken|developer|admin)/gi, "[REDACTED_ROLE_HIJACK]")
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[\r\n\t]+/g, " ") // Collapse whitespace
    .trim()

  if (clean.length > MAX_PRETEXT_LENGTH) {
    clean = clean.slice(0, MAX_PRETEXT_LENGTH) + "..."
  }

  return clean
}

/**
 * Extracts a structured PatientClinicalPretext record from diverse profile sources.
 */
export function extractPretextFromProfile(
  patient?: any,
  medicalProfile?: any,
  latestVitals?: any
): PatientClinicalPretext {
  const chronicConditions: string[] = []
  const knownAllergies: string[] = []
  const currentMedications: string[] = []

  // Extract from medical profile if present
  if (medicalProfile) {
    if (Array.isArray(medicalProfile.chronic_conditions)) {
      chronicConditions.push(...medicalProfile.chronic_conditions.filter(Boolean))
    } else if (typeof medicalProfile.chronic_conditions === "string") {
      chronicConditions.push(
        ...medicalProfile.chronic_conditions.split(",").map((s: string) => s.trim()).filter(Boolean)
      )
    }

    if (Array.isArray(medicalProfile.allergies)) {
      knownAllergies.push(...medicalProfile.allergies.filter(Boolean))
    } else if (typeof medicalProfile.allergies === "string") {
      knownAllergies.push(
        ...medicalProfile.allergies.split(",").map((s: string) => s.trim()).filter(Boolean)
      )
    }

    if (Array.isArray(medicalProfile.current_medications)) {
      currentMedications.push(...medicalProfile.current_medications.filter(Boolean))
    } else if (typeof medicalProfile.current_medications === "string") {
      currentMedications.push(
        ...medicalProfile.current_medications.split(",").map((s: string) => s.trim()).filter(Boolean)
      )
    }
  }

  // Extract vitals
  let bloodPressure: string | undefined
  let bloodSugar: string | undefined

  if (latestVitals) {
    if (latestVitals.blood_pressure) {
      bloodPressure = String(latestVitals.blood_pressure).trim()
    } else if (latestVitals.systolic && latestVitals.diastolic) {
      bloodPressure = `${latestVitals.systolic}/${latestVitals.diastolic} mmHg`
    }

    if (latestVitals.blood_sugar) {
      bloodSugar = `${latestVitals.blood_sugar} mg/dL`
    }
  }

  const age = patient?.age ? Number(patient.age) : undefined
  const gender = patient?.gender ? String(patient.gender) : undefined

  return {
    patientId: patient?.id,
    age: isNaN(age as any) ? undefined : age,
    gender,
    chronicConditions: Array.from(new Set(chronicConditions)),
    knownAllergies: Array.from(new Set(knownAllergies)),
    currentMedications: Array.from(new Set(currentMedications)),
    bloodPressure,
    bloodSugar,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Saves clinical pretext to localStorage.
 */
export function savePatientPretextLocally(pretext: PatientClinicalPretext): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(PRETEXT_STORAGE_KEY, JSON.stringify(pretext))
  } catch (err) {
    console.warn("Failed to persist patient clinical pretext locally:", err)
  }
}

/**
 * Retrieves saved clinical pretext from localStorage.
 */
export function getSavedPatientPretext(): PatientClinicalPretext | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(PRETEXT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return null
    return parsed as PatientClinicalPretext
  } catch {
    return null
  }
}

/**
 * Clears saved pretext from localStorage.
 */
export function clearSavedPatientPretext(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(PRETEXT_STORAGE_KEY)
  } catch {}
}

/**
 * Formats baseline profile and optional session triage into a sanitized clinical prompt block.
 */
export function formatPretextForPrompt(
  pretext: PatientClinicalPretext,
  triage?: PretextSessionTriage
): string {
  const parts: string[] = []

  // Demographics
  const demo: string[] = []
  if (pretext.age) demo.push(`Age: ${pretext.age}`)
  if (pretext.gender) demo.push(`Gender: ${pretext.gender}`)
  if (demo.length > 0) parts.push(demo.join(", "))

  // Chronic conditions
  if (pretext.chronicConditions && pretext.chronicConditions.length > 0) {
    parts.push(`Chronic: ${pretext.chronicConditions.join(", ")}`)
  }

  // Known allergies
  if (pretext.knownAllergies && pretext.knownAllergies.length > 0) {
    parts.push(`Allergies: ${pretext.knownAllergies.join(", ")}`)
  }

  // Medications
  if (pretext.currentMedications && pretext.currentMedications.length > 0) {
    parts.push(`Meds: ${pretext.currentMedications.join(", ")}`)
  }

  // Baseline Vitals
  const vitals: string[] = []
  if (pretext.bloodPressure) vitals.push(`BP ${pretext.bloodPressure}`)
  if (pretext.bloodSugar) vitals.push(`Sugar ${pretext.bloodSugar}`)
  if (vitals.length > 0) parts.push(`Vitals: ${vitals.join(", ")}`)

  // Session Triage
  if (triage) {
    const triageParts: string[] = []
    if (triage.symptoms && triage.symptoms.length > 0) {
      triageParts.push(`Symptoms: ${triage.symptoms.join(", ")}`)
    }
    if (triage.bodyPart) triageParts.push(`Site: ${triage.bodyPart}`)
    if (triage.durationDays !== undefined && triage.durationDays !== null) {
      triageParts.push(`Duration: ${triage.durationDays}d`)
    }
    if (triage.severity) triageParts.push(`Severity: ${triage.severity}`)
    if (triage.urgency) triageParts.push(`Urgency: ${triage.urgency}`)
    if (triageParts.length > 0) {
      parts.push(`Intake: ${triageParts.join(" | ")}`)
    }
  }

  if (parts.length === 0) return ""

  const rawPretext = `[PATIENT CLINICAL BASELINE] ${parts.join(" | ")}`
  return sanitizeClinicalPretext(rawPretext)
}
