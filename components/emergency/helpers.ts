/**
 * components/emergency/helpers.ts
 *
 * Emergency SOS message formatting and speech generation helpers.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Emergency Subsystem
 */

import type { EmergencyProfile } from "@/lib/emergency/vault"

export function getVoiceAlertMessage(profile: EmergencyProfile, language: string): string {
  if (profile.customVoiceAlert && profile.customVoiceAlert.trim()) {
    return profile.customVoiceAlert.trim()
  }
  if (language === "hi") {
    const namePart = profile.fullName ? `मरीज ${profile.fullName}। ` : ""
    const conditionPart = profile.chronicConditions ? `बीमारी: ${profile.chronicConditions}। ` : ""
    return `आपातकाल! तत्काल चिकित्सा सहायता चाहिए! ${namePart}${conditionPart}कृपया 108 एम्बुलेंस बुलाएं!`
  }
  const namePart = profile.fullName ? `Patient ${profile.fullName}. ` : ""
  const conditionPart = profile.chronicConditions ? `Condition: ${profile.chronicConditions}. ` : ""
  return `Emergency medical alert! ${namePart}${conditionPart}Please call 108 ambulance immediately!`
}

export function buildCompleteSosMessage(
  profile: EmergencyProfile,
  coords?: { lat: number; lng: number }
): string {
  const lines: string[] = ["🚨 *MEDICAL EMERGENCY DISTRESS ALERT* 🚨"]

  if (profile.fullName) {
    const ageStr = profile.age ? ` (${profile.age} yrs)` : ""
    lines.push(`*Patient:* ${profile.fullName}${ageStr}`)
  }
  if (profile.bloodGroup && profile.bloodGroup !== "Unknown") {
    lines.push(`*Blood Group:* ${profile.bloodGroup}`)
  }
  if (coords) {
    lines.push(`*Live GPS Location:* https://maps.google.com/?q=${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`)
  }
  if (profile.chronicConditions) {
    lines.push(`*Chronic Conditions:* ${profile.chronicConditions}`)
  }
  if (profile.severeAllergies) {
    lines.push(`*Severe Allergies:* ${profile.severeAllergies}`)
  }
  if (profile.currentMedications) {
    lines.push(`*Current Medications:* ${profile.currentMedications}`)
  }
  const contactsList = [profile.primaryEmergencyContact, profile.secondaryEmergencyContact, profile.tertiaryEmergencyContact]
    .filter(Boolean)
    .join(", ")
  if (contactsList) {
    lines.push(`*Emergency Contacts:* ${contactsList}`)
  }
  if (profile.customVoiceAlert) {
    lines.push(`*Alert Note:* ${profile.customVoiceAlert}`)
  }

  lines.push("⚠️ IMMEDIATE MEDICAL ASSISTANCE REQUIRED! Please dispatch ambulance / help!")
  return lines.join("\n")
}

export function buildTestSosMessage(
  profile: EmergencyProfile,
  coords?: { lat: number; lng: number }
): string {
  const lines: string[] = ["🧪 *[TEST MESSAGE - NOT AN EMERGENCY]*"]
  lines.push(`Rural Healthcare Platform test verification from: ${profile.fullName || "User"}.`)
  if (coords) {
    lines.push(`Live GPS Link: https://maps.google.com/?q=${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`)
  }
  lines.push("All system checks are normal. Please reply to this message to confirm receipt.")
  return lines.join("\n")
}
