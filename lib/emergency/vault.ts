/**
 * lib/emergency/vault.ts
 *
 * Emergency Health Vault & SOS Dispatch Engine for Rural Healthcare Platform.
 * - Stores patient chronic health profile locally in localStorage / IndexedDB (100% offline).
 * - Generates structured SOS emergency SMS with GPS coordinates and clinical history.
 * - Uses native browser APIs: Geolocation, Vibration (Morse SOS), Web Share, and tel:/sms: URIs.
 * - $0 operating cost (operates directly through user's device & SIM card).
 */

export interface EmergencyProfile {
  fullName: string
  age: string
  bloodGroup: string
  chronicConditions: string
  currentMedications: string
  severeAllergies: string
  primaryEmergencyContact: string
  secondaryEmergencyContact: string
  emergencyNotes: string
  customVoiceAlert?: string
}

const STORAGE_KEY = "ruralhealth_emergency_vault_v1"

export const DEFAULT_PROFILE: EmergencyProfile = {
  fullName: "",
  age: "",
  bloodGroup: "Unknown",
  chronicConditions: "",
  currentMedications: "",
  severeAllergies: "",
  primaryEmergencyContact: "",
  secondaryEmergencyContact: "",
  emergencyNotes: "",
  customVoiceAlert: "",
}

export function getEmergencyProfile(): EmergencyProfile {
  if (typeof localStorage === "undefined") return DEFAULT_PROFILE
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PROFILE
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PROFILE
  }
}

export function saveEmergencyProfile(profile: Partial<EmergencyProfile>): EmergencyProfile {
  if (typeof localStorage === "undefined") return DEFAULT_PROFILE
  try {
    const current = getEmergencyProfile()
    const updated = { ...current, ...profile }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error("Failed to save emergency profile to local storage:", err)
    return DEFAULT_PROFILE
  }
}

/**
 * Triggers native SOS vibration in Morse Code: ... --- ... (Save Our Souls)
 */
export function triggerSosVibration() {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      // Morse: S (200,100,200,100,200) pause 300, O (500,100,500,100,500) pause 300, S (200,100,200,100,200)
      navigator.vibrate([200, 100, 200, 100, 200, 300, 500, 100, 500, 100, 500, 300, 200, 100, 200, 100, 200])
    } catch {
      // Vibration not supported or denied
    }
  }
}

/**
 * Constructs structured medical SOS text
 */
export function buildSosMessage(profile: EmergencyProfile, coords?: { lat: number; lng: number }): string {
  const parts: string[] = ["🚨 MEDICAL EMERGENCY SOS!"]

  if (coords) {
    parts.push(`📍 Location: https://maps.google.com/?q=${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`)
  }

  if (profile.fullName) {
    const ageStr = profile.age ? `, Age: ${profile.age}` : ""
    const bloodStr = profile.bloodGroup && profile.bloodGroup !== "Unknown" ? `, Blood: ${profile.bloodGroup}` : ""
    parts.push(`👤 Patient: ${profile.fullName}${ageStr}${bloodStr}`)
  }

  if (profile.chronicConditions) {
    parts.push(`🩺 Chronic Conditions: ${profile.chronicConditions}`)
  }

  if (profile.severeAllergies) {
    parts.push(`⚠️ Allergies: ${profile.severeAllergies}`)
  }

  if (profile.currentMedications) {
    parts.push(`💊 Medications: ${profile.currentMedications}`)
  }

  if (profile.emergencyNotes) {
    parts.push(`📝 Notes: ${profile.emergencyNotes}`)
  }

  parts.push("Please send medical help immediately!")
  return parts.join("\n")
}

/**
 * Dispatches emergency SOS via SMS URI (works offline via GSM carrier SIM, 0 cost)
 */
export function dispatchSmsSos(profile: EmergencyProfile, coords?: { lat: number; lng: number }): string {
  const message = buildSosMessage(profile, coords)
  const encoded = encodeURIComponent(message)

  const numbers = [profile.primaryEmergencyContact, profile.secondaryEmergencyContact]
    .map((n) => n.trim().replace(/[^\d+]/g, ""))
    .filter(Boolean)

  const targetRecipient = numbers.length > 0 ? numbers.join(",") : "112"
  const smsUrl = `sms:${targetRecipient}?body=${encoded}`
  return smsUrl
}
