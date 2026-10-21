/**
 * lib/abdm/types.ts
 *
 * Domain types and interfaces for ABDM HL7 FHIR R4 clinical data structures.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Information Systems
 */

export interface PatientDemographics {
  id: string
  abhaNumber?: string
  abhaAddress?: string
  name: string
  gender: "male" | "female" | "other" | "unknown"
  birthDate?: string // YYYY-MM-DD
  phone?: string
  district?: string
  state?: string
}

export interface PrescriptionItem {
  medicineName: string
  dosage: string // e.g. "500mg"
  frequency: string // e.g. "Twice daily after meals"
  duration: string // e.g. "5 days"
  instructions?: string
}

export interface PrescriptionRecord {
  id: string
  doctorName: string
  doctorRegistrationNumber?: string
  facilityName: string
  facilityId?: string
  date: string // ISO string
  diagnosis?: string
  medications: PrescriptionItem[]
}

export interface LabObservationItem {
  code: string // LOINC code, e.g. "1558-6" for Fasting Glucose, "2345-7" for Glucose
  display: string // e.g. "Fasting blood glucose"
  value: number | string // e.g. 95 or "Negative"
  unit?: string // e.g. "mg/dL"
  referenceRangeLow?: number
  referenceRangeHigh?: number
  interpretation?: "N" | "H" | "L" | "A" // Normal, High, Low, Abnormal
}

export interface DiagnosticReportRecord {
  id: string
  doctorName: string
  doctorRegistrationNumber?: string
  facilityName: string
  facilityId?: string
  date: string // ISO string
  category: "LAB" | "RAD" // Laboratory or Radiology
  conclusion?: string
  observations?: LabObservationItem[]
}

export interface EncounterVitals {
  systolicBp?: number
  diastolicBp?: number
  heartRate?: number
  temperatureFahrenheit?: number
  respiratoryRate?: number
  spo2Percentage?: number
}

export interface EncounterRecord {
  id: string
  doctorName: string
  doctorRegistrationNumber?: string
  facilityName: string
  facilityId?: string
  date: string // ISO string
  reasonForVisit: string
  serviceType: "OPD" | "CAMP" | "TELECONSULT"
  vitals?: EncounterVitals
}
