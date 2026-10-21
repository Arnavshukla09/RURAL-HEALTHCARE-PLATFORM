/**
 * components/doctor-patients/types.ts
 *
 * Types for Doctor's assigned patient directory and clinical records.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 */

export interface DoctorPatientsProps {
  language: string
}

export interface AssignedPatient {
  id: string
  user_id?: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  created_at: string
  role?: string
  appointment_count: number
  latest_date?: string | null
  latest_status?: string | null
  latest_notes?: string | null
}

export const RECORD_TYPE_COLORS: Record<string, string> = {
  prescription: "bg-purple-100 text-purple-700",
  lab_result: "bg-blue-100 text-blue-700",
  diagnosis: "bg-orange-100 text-orange-700",
  vaccination: "bg-green-100 text-green-700",
  other: "bg-gray-100 text-gray-600",
}
