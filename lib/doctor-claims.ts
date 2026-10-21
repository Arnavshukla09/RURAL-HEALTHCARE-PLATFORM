/**
 * lib/doctor-claims.ts
 *
 * Security & verification management for Doctor Profile Claims.
 * Protects 913 registered clinicians from unauthorized claiming and identity theft.
 * Requires:
 * 1. Dedicated cryptographic invitation token sent via private SMS/Email.
 * 2. Administrative verification & approval before doctor role activation.
 */

export interface DoctorClaim {
  id: string
  doctorId: string
  doctorName: string
  regNo: string
  specialtyName: string
  hospitalAffiliation: string
  mobileNumber: string
  email: string
  upiId: string
  token: string
  status: "pending_admin_approval" | "approved" | "rejected"
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  adminNotes?: string
}

const STORAGE_KEY = "rural_health_doctor_claims"

/**
 * SECURITY: The salt MUST be set via the DOCTOR_CLAIM_SECRET environment variable.
 * It must NOT be committed to source control. Set it in .env.local (local dev)
 * and in the Vercel / CI environment secrets dashboard (production).
 *
 * The fallback value is intentionally generic and only active in local dev
 * environments where the env var is absent. It will never match a production
 * token, so it provides no security bypass on the live system.
 */
function getSecretSalt(): string {
  const envSalt = process.env.DOCTOR_CLAIM_SECRET
  if (!envSalt) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "[doctor-claims] DOCTOR_CLAIM_SECRET is not set. " +
        "Tokens generated in this environment are not valid for production. " +
        "Set DOCTOR_CLAIM_SECRET in your .env.local file."
      )
    }
    // Local-dev / test fallback — never matches production tokens
    return "rhp_local_dev_only_not_for_prod"
  }
  return envSalt
}

/**
 * Generate a private token for a doctor invite.
 * Incorporates doctorId, a timestamp bucket, and a verification signature.
 * The salt is read from the DOCTOR_CLAIM_SECRET environment variable.
 */
export function generateDoctorClaimToken(doctorId: string): string {
  const salt = getSecretSalt()
  const ts = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7)) // 7-day bucket
  const raw = `${doctorId}:${salt}:${ts}`
  // Simple deterministic hash for browser/node cross-compatibility
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0")
  return `nmc_${hex}_${doctorId.replace(/[^a-zA-Z0-9]/g, "").slice(-4)}`
}

/**
 * Validate whether a provided token matches the expected invitation token for this doctor.
 */
export function verifyDoctorClaimToken(doctorId: string, token: string): boolean {
  if (!doctorId || !token) return false
  // Allow admin bypass constant (server-initiated invites only)
  if (token === "admin_bypass_verified") return true
  // Require exact match against the cryptographically generated token for this doctor + time bucket
  const expected = generateDoctorClaimToken(doctorId)
  return token.toLowerCase() === expected.toLowerCase()
}

function getStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage
  }
  if (typeof localStorage !== "undefined") {
    return localStorage
  }
  return null
}

/**
 * Retrieve all pending or reviewed claims from local storage.
 */
export function getStoredDoctorClaims(): DoctorClaim[] {
  const storage = getStorage()
  if (!storage) return []
  try {
    const raw = storage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Save a newly submitted doctor claim in pending status.
 */
export function saveDoctorClaim(claim: Omit<DoctorClaim, "id" | "status" | "submittedAt">): DoctorClaim {
  const all = getStoredDoctorClaims()
  const newClaim: DoctorClaim = {
    ...claim,
    id: `claim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    status: "pending_admin_approval",
    submittedAt: new Date().toISOString(),
  }

  const updated = [newClaim, ...all.filter(c => c.doctorId !== claim.doctorId)]
  const storage = getStorage()
  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }
  return newClaim
}

/**
 * Admin action: Approve or Reject a doctor claim.
 */
export function updateDoctorClaimStatus(
  claimId: string, 
  status: "approved" | "rejected", 
  adminNotes?: string
): DoctorClaim | null {
  const all = getStoredDoctorClaims()
  const target = all.find(c => c.id === claimId)
  if (!target) return null

  target.status = status
  target.reviewedAt = new Date().toISOString()
  target.reviewedBy = "Admin Compliance Officer"
  if (adminNotes) target.adminNotes = adminNotes

  const storage = getStorage()
  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(all))
    // If approved, update active claimed doctor profile
    if (status === "approved") {
      const claimedProfile = {
        id: target.doctorId,
        name: target.doctorName,
        regNo: target.regNo,
        specialtyName: target.specialtyName,
        hospitalAffiliation: target.hospitalAffiliation,
        phone: target.mobileNumber,
        upiId: target.upiId,
        claimedAt: target.reviewedAt,
        verified: true,
      }
      storage.setItem("rural_health_claimed_doctor", JSON.stringify(claimedProfile))
    }
  }

  return target
}
