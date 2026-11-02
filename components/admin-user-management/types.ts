/**
 * components/admin-user-management/types.ts
 *
 * Types, role colors, and constants for Admin User & Clinician Management.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Administration Subsystem
 */

export interface AdminUserManagementProps {
  language: string
}

export interface UserProfile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  role: string
  created_at: string
}

export const ROLES = ["patient", "doctor", "admin"]

export const ROLE_COLORS: Record<string, string> = {
  patient: "bg-blue-100 text-blue-700",
  doctor: "bg-teal-100 text-teal-700",
  admin: "bg-purple-100 text-purple-700",
}
