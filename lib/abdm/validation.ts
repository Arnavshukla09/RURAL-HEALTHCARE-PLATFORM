/**
 * lib/abdm/validation.ts
 *
 * ABHA credentials and FHIR R4 Bundle validation functions.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Information Systems
 */

/**
 * Validates an Indian ABHA 14-digit number (format: 12-3456-7890-1234 or 14 continuous digits)
 */
export function validateAbhaNumber(abha: string): { isValid: boolean; normalized: string; error?: string } {
  const cleaned = abha.replace(/[\s-]/g, "")
  if (!/^\d{14}$/.test(cleaned)) {
    return {
      isValid: false,
      normalized: cleaned,
      error: "ABHA number must be exactly 14 digits (e.g., 14-1234-5678-9012)",
    }
  }

  const formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}-${cleaned.slice(10, 14)}`
  return { isValid: true, normalized: formatted }
}

/**
 * Validates an ABHA Address (PHR address, e.g., name@abdm or name@sbx)
 */
export function validateAbhaAddress(address: string): { isValid: boolean; normalized: string; error?: string } {
  const trimmed = address.trim().toLowerCase()
  const regex = /^[a-zA-Z0-9._]+@(abdm|sbx|e-swasthya)$/i
  if (!regex.test(trimmed)) {
    return {
      isValid: false,
      normalized: trimmed,
      error: "ABHA address must end with @abdm or @sbx (e.g., rajesh.kumar@abdm)",
    }
  }
  return { isValid: true, normalized: trimmed }
}

export interface FhirValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Validates an ABDM NRCES HL7 FHIR R4 Document Bundle
 * Checks required profile conformance, top-level composition, and reference resolution integrity.
 */
export function validateFhirBundle(bundle: Record<string, any>): FhirValidationResult {
  const errors: string[] = []

  if (!bundle || typeof bundle !== "object") {
    return { isValid: false, errors: ["Bundle must be a non-null JSON object"] }
  }

  if (bundle.resourceType !== "Bundle") {
    errors.push("Top-level resourceType must be 'Bundle'")
  }

  if (bundle.type !== "document") {
    errors.push("Bundle type must be 'document'")
  }

  const profiles = bundle.meta?.profile
  const ndhmProfile = "https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"
  if (!Array.isArray(profiles) || !profiles.includes(ndhmProfile)) {
    errors.push(`Bundle meta.profile must include '${ndhmProfile}'`)
  }

  if (!Array.isArray(bundle.entry) || bundle.entry.length === 0) {
    errors.push("Bundle must contain a non-empty 'entry' array")
    return { isValid: false, errors }
  }

  const firstEntry = bundle.entry[0]?.resource
  if (firstEntry?.resourceType !== "Composition") {
    errors.push("The first resource in a FHIR Document Bundle must be 'Composition'")
  }

  const entryUrls = new Set<string>()
  for (const item of bundle.entry) {
    if (item.fullUrl) {
      entryUrls.add(item.fullUrl)
    }
  }

  for (const item of bundle.entry) {
    const res = item.resource
    if (!res) continue

    if (res.resourceType === "Composition") {
      const subjectRef = res.subject?.reference
      if (!subjectRef || !entryUrls.has(subjectRef)) {
        errors.push(`Composition subject reference '${subjectRef}' does not resolve to an entry in this bundle`)
      }
      if (Array.isArray(res.author)) {
        for (const author of res.author) {
          if (author.reference && !entryUrls.has(author.reference)) {
            errors.push(`Composition author reference '${author.reference}' does not resolve to an entry in this bundle`)
          }
        }
      }
    }

    if (res.resourceType === "Patient") {
      if (!res.name || !Array.isArray(res.name) || res.name.length === 0) {
        errors.push(`Patient resource '${res.id}' must include a valid name`)
      }
      if (!res.gender) {
        errors.push(`Patient resource '${res.id}' must include gender`)
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
