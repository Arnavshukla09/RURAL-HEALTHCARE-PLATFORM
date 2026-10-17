/**
 * components/patient-records/types.ts
 *
 * Types and static constants for Patient Medical Records.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Records Subsystem
 */

export interface PatientRecordsProps {
  language: string
  user?: any
}

export interface MedicalRecord {
  id: string
  record_type: string
  content: string
  file_url?: string
  created_at?: string
  patient_id?: string
  doctor_id?: string
}

export const RECORD_TYPES = [
  { value: 'prescription', label: 'Prescription', labelHi: 'प्रिस्क्रिप्शन', icon: '💊' },
  { value: 'lab_result', label: 'Lab Report', labelHi: 'लैब रिपोर्ट', icon: '🧪' },
  { value: 'diagnosis', label: 'Diagnosis', labelHi: 'निदान', icon: '🩺' },
  { value: 'vaccination', label: 'Vaccination', labelHi: 'टीकाकरण', icon: '💉' },
  { value: 'other', label: 'Other', labelHi: 'अन्य', icon: '📋' },
]

export const TYPE_BADGE_COLORS: Record<string, string> = {
  diagnosis: 'bg-blue-100 text-blue-700',
  prescription: 'bg-purple-100 text-purple-700',
  lab_result: 'bg-amber-100 text-amber-700',
  vaccination: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-700',
}
