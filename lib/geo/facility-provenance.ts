/**
 * lib/geo/facility-provenance.ts
 *
 * Canonical Facility Schema, Geospatial Verification & Provenance Engine.
 * Implements Phase 5 of the Rural Healthcare Platform Engineering Roadmap:
 * - Canonical facility data normalization
 * - Indian territorial bounding box geospatial validation & coordinate inversion detection
 * - Deterministic canonical ID generation for idempotent ETL pipelines
 * - Entity resolution and deduplication
 * - Contact verification and shared helpline detection
 * - Data quality metrics calculation
 */

export type VerificationStatus =
  | "independently_verified"
  | "source_confirmed"
  | "facility_nodal_contact"
  | "unverified"

export type FacilityType =
  | "hospital"
  | "clinic"
  | "health_post"
  | "sub_centre"
  | "phc"
  | "chc"
  | "sdh"
  | "district_hospital"
  | "medical_college"
  | "pharmacy"
  | "lab"

export interface CanonicalFacilityRecord {
  facility_id: string
  name: string
  facility_type: FacilityType
  address: string | null
  district: string
  state: string
  latitude: number
  longitude: number
  phone: string | null
  phone_verification_status: VerificationStatus
  source_name: string
  source_record_id: string
  source_url: string
  last_checked_at: string
  operational_status: "active" | "closed" | "unknown"
}

export interface DataQualityReport {
  totalRecords: number
  validCoordinatesCount: number
  validCoordinatesPercentage: number
  traceableSourceCount: number
  traceableSourcePercentage: number
  phoneProvidedCount: number
  phoneVerificationBreakdown: Record<VerificationStatus, number>
  duplicateCount: number
  sharedPhoneClusterCount: number
}

/**
 * Official Geographic Bounding Box for the Republic of India:
 * Latitude: 6.5° N (Indira Point / Great Nicobar) to 37.5° N (Indira Col / Ladakh)
 * Longitude: 68.7° E (Ghuar Moti / Gujarat) to 97.5° E (Kibithu / Arunachal Pradesh)
 */
export const INDIA_BOUNDS = {
  MIN_LAT: 6.5,
  MAX_LAT: 37.5,
  MIN_LON: 68.7,
  MAX_LON: 97.5,
} as const

/**
 * Validates whether GPS coordinates lie within the sovereign territory bounding box of India.
 * Also detects coordinate inversion (common GIS error where latitude and longitude are swapped).
 */
export function validateCoordinates(
  lat: number,
  lon: number
): { isValid: boolean; error?: string; isSwapped?: boolean } {
  if (typeof lat !== "number" || typeof lon !== "number" || isNaN(lat) || isNaN(lon)) {
    return { isValid: false, error: "Coordinates must be valid non-NaN numbers" }
  }

  // Detect coordinate inversion (latitude inside longitude range, longitude inside latitude range)
  if (
    lat >= INDIA_BOUNDS.MIN_LON &&
    lat <= INDIA_BOUNDS.MAX_LON &&
    lon >= INDIA_BOUNDS.MIN_LAT &&
    lon <= INDIA_BOUNDS.MAX_LAT
  ) {
    return {
      isValid: false,
      isSwapped: true,
      error: "Latitude and longitude appear to be inverted (lat matches India longitude bounds)",
    }
  }

  if (
    lat < INDIA_BOUNDS.MIN_LAT ||
    lat > INDIA_BOUNDS.MAX_LAT ||
    lon < INDIA_BOUNDS.MIN_LON ||
    lon > INDIA_BOUNDS.MAX_LON
  ) {
    return {
      isValid: false,
      isSwapped: false,
      error: `Coordinates (${lat}, ${lon}) fall outside the Indian territorial bounding box`,
    }
  }

  return { isValid: true }
}

/**
 * Normalizes Indian phone numbers (10-digit mobile or landline with STD code).
 * Strips formatting noise and normalizes to standard +91 or numeric string.
 */
export function normalizePhoneNumber(
  raw: string | null | undefined
): { normalized: string | null; isValid: boolean; error?: string } {
  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return { normalized: null, isValid: false, error: "Empty or missing phone number" }
  }

  const cleaned = raw.trim()
  const digitsOnly = cleaned.replace(/\D/g, "")

  // Reject obvious placeholder or mock numbers
  if (/^0{6,}|1{6,}|9{10,}$/.test(digitsOnly)) {
    return { normalized: null, isValid: false, error: "Repetitive or placeholder digits detected" }
  }

  // Formatted landline with STD code delimiter (e.g., "+91 755-2672355" or "07562-224430")
  if (cleaned.includes("-") || cleaned.includes("(") || cleaned.includes(")")) {
    if (digitsOnly.length >= 8 && digitsOnly.length <= 13) {
      return { normalized: cleaned, isValid: true }
    }
  }

  // Mobile: 10 digits starting with 6, 7, 8, or 9
  // Or 12 digits starting with 91 (e.g., 919876543210)
  // Or 11 digits starting with 0 (e.g., 09876543210)
  if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
    return { normalized: `+91 ${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`, isValid: true }
  }

  if (digitsOnly.length === 12 && digitsOnly.startsWith("91") && /^[6-9]/.test(digitsOnly.slice(2))) {
    const core = digitsOnly.slice(2)
    return { normalized: `+91 ${core.slice(0, 5)} ${core.slice(5)}`, isValid: true }
  }

  if (digitsOnly.length === 11 && digitsOnly.startsWith("0") && /^[6-9]/.test(digitsOnly.slice(1))) {
    const core = digitsOnly.slice(1)
    return { normalized: `+91 ${core.slice(0, 5)} ${core.slice(5)}`, isValid: true }
  }

  // Landline with STD code (typically 10-11 digits total, e.g., 0755-2672355 or 7552672355)
  if (digitsOnly.length >= 9 && digitsOnly.length <= 11) {
    return { normalized: cleaned, isValid: true }
  }

  return { normalized: cleaned, isValid: false, error: "Unrecognized telephone format" }
}

/**
 * Generates a deterministic canonical facility identifier.
 * Guarantees that re-running an ETL import on identical source records yields
 * identical primary keys, enforcing idempotent inserts without row duplication.
 */
export function generateCanonicalFacilityId(
  sourceName: string,
  sourceRecordId: string,
  name?: string,
  district?: string
): string {
  const sanitize = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").slice(0, 40)

  if (sourceRecordId && sourceRecordId.trim()) {
    return `fac_${sanitize(sourceName)}_${sanitize(sourceRecordId)}`
  }

  const fallback = `${sanitize(name || "unknown")}_${sanitize(district || "unknown")}`
  return `fac_${sanitize(sourceName)}_${fallback}`
}

/**
 * Resolves duplicate facilities across datasets.
 * Matches on exact sourceRecordId, or on normalized name + district + geospatial proximity (< 200m).
 */
export function resolveFacilityDuplicates(
  records: CanonicalFacilityRecord[]
): {
  unique: CanonicalFacilityRecord[]
  duplicateCount: number
  duplicateGroups: Map<string, CanonicalFacilityRecord[]>
} {
  const uniqueMap = new Map<string, CanonicalFacilityRecord>()
  const duplicateGroups = new Map<string, CanonicalFacilityRecord[]>()
  let duplicateCount = 0

  for (const record of records) {
    // Spatial hash key: 2 decimal places is ~1.1km; 3 decimals is ~110m
    const roundedLat = record.latitude.toFixed(3)
    const roundedLon = record.longitude.toFixed(3)
    const normName = record.name.toLowerCase().replace(/[^a-z0-9]/g, "")
    const dedupeKey = record.source_record_id
      ? `${record.source_name}:${record.source_record_id}`
      : `${record.state}:${record.district}:${normName}:${roundedLat}:${roundedLon}`

    if (uniqueMap.has(dedupeKey)) {
      duplicateCount++
      const existing = uniqueMap.get(dedupeKey)!
      const group = duplicateGroups.get(dedupeKey) || [existing]
      group.push(record)
      duplicateGroups.set(dedupeKey, group)

      // Keep the one with the higher verification rank
      const rankOrder: Record<VerificationStatus, number> = {
        independently_verified: 4,
        source_confirmed: 3,
        facility_nodal_contact: 2,
        unverified: 1,
      }
      if (rankOrder[record.phone_verification_status] > rankOrder[existing.phone_verification_status]) {
        uniqueMap.set(dedupeKey, record)
      }
    } else {
      uniqueMap.set(dedupeKey, record)
    }
  }

  return {
    unique: Array.from(uniqueMap.values()),
    duplicateCount,
    duplicateGroups,
  }
}

/**
 * Detects phone numbers shared across multiple facilities.
 * In public health directories, multiple facilities sharing the same number
 * usually indicates a centralized administrative desk rather than an on-site contact.
 */
export function detectSharedPhoneNumbers(
  records: CanonicalFacilityRecord[]
): Map<string, CanonicalFacilityRecord[]> {
  const phoneClusters = new Map<string, CanonicalFacilityRecord[]>()

  for (const record of records) {
    if (!record.phone) continue
    const norm = record.phone.replace(/\D/g, "")
    if (!norm || norm.length < 8) continue

    const cluster = phoneClusters.get(norm) || []
    cluster.push(record)
    phoneClusters.set(norm, cluster)
  }

  // Filter to only those shared by > 1 facility
  const shared = new Map<string, CanonicalFacilityRecord[]>()
  for (const [phone, list] of phoneClusters.entries()) {
    if (list.length > 1) {
      shared.set(phone, list)
    }
  }

  return shared
}

/**
 * Calculates a comprehensive Data Quality & Provenance Scorecard.
 */
export function calculateDataQualityMetrics(
  records: CanonicalFacilityRecord[]
): DataQualityReport {
  const totalRecords = records.length
  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      validCoordinatesCount: 0,
      validCoordinatesPercentage: 0,
      traceableSourceCount: 0,
      traceableSourcePercentage: 0,
      phoneProvidedCount: 0,
      phoneVerificationBreakdown: {
        independently_verified: 0,
        source_confirmed: 0,
        facility_nodal_contact: 0,
        unverified: 0,
      },
      duplicateCount: 0,
      sharedPhoneClusterCount: 0,
    }
  }

  let validCoordinatesCount = 0
  let traceableSourceCount = 0
  let phoneProvidedCount = 0

  const verificationBreakdown: Record<VerificationStatus, number> = {
    independently_verified: 0,
    source_confirmed: 0,
    facility_nodal_contact: 0,
    unverified: 0,
  }

  for (const rec of records) {
    const geo = validateCoordinates(rec.latitude, rec.longitude)
    if (geo.isValid) validCoordinatesCount++

    if (rec.source_record_id && rec.source_name && rec.source_url) {
      traceableSourceCount++
    }

    if (rec.phone) {
      phoneProvidedCount++
    }

    verificationBreakdown[rec.phone_verification_status] =
      (verificationBreakdown[rec.phone_verification_status] || 0) + 1
  }

  const { duplicateCount } = resolveFacilityDuplicates(records)
  const sharedClusters = detectSharedPhoneNumbers(records)

  return {
    totalRecords,
    validCoordinatesCount,
    validCoordinatesPercentage: Math.round((validCoordinatesCount / totalRecords) * 1000) / 10,
    traceableSourceCount,
    traceableSourcePercentage: Math.round((traceableSourceCount / totalRecords) * 1000) / 10,
    phoneProvidedCount,
    phoneVerificationBreakdown: verificationBreakdown,
    duplicateCount,
    sharedPhoneClusterCount: sharedClusters.size,
  }
}
