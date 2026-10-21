import { cache } from "react"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

/**
 * lib/auth/guard.ts
 *
 * Server-only authorization and authentication guards.
 * Provides typed, memoized session and profile verification for all API routes.
 */

export type UserRole = "patient" | "doctor" | "admin"

export interface PatientProfile {
  id: string
  user_id: string
  role: UserRole
  first_name: string
  last_name: string
  email: string
  phone?: string | null
}

export class AuthError extends Error {
  constructor(
    public status: 401 | 403 | 404,
    message: string,
    public code: string
  ) {
    super(message)
    this.name = "AuthError"
  }
}

/**
 * Ensures the request is authenticated by Supabase Auth.
 * Returns the authenticated User and user-scoped Supabase client.
 * Throws AuthError(401) on failure.
 */
export async function requireUser(): Promise<{
  user: User
  supabase: Awaited<ReturnType<typeof createClient>>
}> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new AuthError(401, "Authentication required", "UNAUTHORIZED")
  }

  return { user, supabase }
}

/**
 * Memoized per-request patient profile lookup.
 * Using React's cache() ensures only 1 DB query per request lifecycle.
 */
export const getPatientProfile = cache(
  async (userId: string): Promise<PatientProfile | null> => {
    const supabase = await createClient()
    const { data: patient, error } = await supabase
      .from("patients")
      .select("id, user_id, role, first_name, last_name, email, phone")
      .eq("user_id", userId)
      .single()

    if (error || !patient) {
      return null
    }

    return patient as PatientProfile
  }
)

/**
 * Resolves the patient profile ID for an authenticated user.
 * Throws AuthError(404) if no patient profile exists.
 */
export async function getPatientId(userId: string): Promise<string> {
  const patient = await getPatientProfile(userId)
  if (!patient) {
    throw new AuthError(404, "Patient profile not found", "PROFILE_NOT_FOUND")
  }
  return patient.id
}

/**
 * Enforces that the authenticated user possesses one of the required roles.
 * Throws AuthError(401) if unauthenticated, or AuthError(403) if role unauthorized.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<{
  user: User
  patient: PatientProfile
  supabase: Awaited<ReturnType<typeof createClient>>
}> {
  const { user, supabase } = await requireUser()
  const patient = await getPatientProfile(user.id)

  if (!patient) {
    throw new AuthError(404, "User profile not found", "PROFILE_NOT_FOUND")
  }

  if (!allowedRoles.includes(patient.role)) {
    throw new AuthError(
      403,
      `Access denied: requires ${allowedRoles.join(" or ")} role`,
      "FORBIDDEN"
    )
  }

  return { user, patient, supabase }
}

/**
 * Standard HTTP error responder for AuthErrors.
 */
export function authErrorResponse(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.status }
    )
  }
  console.error("[AuthGuard] Unexpected error:", err)
  return NextResponse.json(
    { error: "Internal server error", code: "INTERNAL_ERROR" },
    { status: 500 }
  )
}
