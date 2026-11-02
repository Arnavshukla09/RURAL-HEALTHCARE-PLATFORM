/**
 * components/patient-records/types.ts
 *
 * Types, tag categorizations, and metadata for Patient Medical Records.
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
  appointment_id?: string
}

export type RecordFilterTag =
  | 'all'
  | 'prescription'
  | 'diagnosis'
  | 'lab_result'
  | 'consultation'
  | 'camp'
  | 'profile'
  | 'other'

export function getRecordTag(rec: MedicalRecord): RecordFilterTag {
  const content = rec.content || ""
  if (content.startsWith('[Consultation Request]') || rec.appointment_id) return 'consultation'
  if (content.startsWith('[Camp Registration]') || content.startsWith('[Annual Health Drive Registration]')) return 'camp'
  if (content.startsWith('[Medical Profile]')) return 'profile'
  if (rec.record_type === 'prescription' || rec.record_type === 'vaccination') return 'prescription'
  if (rec.record_type === 'diagnosis') return 'diagnosis'
  if (rec.record_type === 'lab_result') return 'lab_result'
  return 'other'
}

export const RECORD_FILTER_TAGS: {
  key: RecordFilterTag
  labelEn: string
  labelHi: string
}[] = [
  { key: 'all', labelEn: 'All Records', labelHi: 'सभी रिकॉर्ड' },
  { key: 'prescription', labelEn: 'Prescriptions', labelHi: 'दवा के पर्चे' },
  { key: 'diagnosis', labelEn: 'Diagnoses', labelHi: 'निदान / रोग' },
  { key: 'lab_result', labelEn: 'Lab Reports', labelHi: 'लैब रिपोर्ट' },
  { key: 'consultation', labelEn: 'Consultations', labelHi: 'परामर्श / अपॉइंटमेंट' },
  { key: 'camp', labelEn: 'Health Camps', labelHi: 'स्वास्थ्य शिविर' },
  { key: 'profile', labelEn: 'Medical Profile', labelHi: 'स्वास्थ्य प्रोफ़ाइल' },
  { key: 'other', labelEn: 'Other Notes', labelHi: 'अन्य रिकॉर्ड' },
]

export const RECORD_TYPES = [
  { value: 'prescription', label: 'Prescription', labelHi: 'प्रिस्क्रिप्शन', icon: '💊' },
  { value: 'lab_result', label: 'Lab Report', labelHi: 'लैब रिपोर्ट', icon: '🧪' },
  { value: 'diagnosis', label: 'Diagnosis', labelHi: 'निदान', icon: '🩺' },
  { value: 'vaccination', label: 'Vaccination', labelHi: 'टीकाकरण', icon: '💉' },
  { value: 'other', label: 'Other', labelHi: 'अन्य', icon: '📋' },
]

export const TYPE_BADGE_COLORS: Record<string, string> = {
  diagnosis: 'bg-blue-100 text-blue-700 border-blue-200',
  prescription: 'bg-purple-100 text-purple-700 border-purple-200',
  lab_result: 'bg-amber-100 text-amber-700 border-amber-200',
  vaccination: 'bg-green-100 text-green-700 border-green-200',
  consultation: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  camp: 'bg-amber-100 text-amber-800 border-amber-300',
  profile: 'bg-teal-100 text-teal-800 border-teal-300',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
}
