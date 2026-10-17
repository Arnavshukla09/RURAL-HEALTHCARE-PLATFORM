/**
 * components/map-view/types.ts
 *
 * Types and configurations for the National Facility Map.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Map Subsystem
 */

import type { IphsCapabilities, IphsFacilityTier } from "@/lib/geo/lgd-iphs"

export interface Facility {
  id: string
  name: string
  type: "hospital" | "clinic" | "doctors" | "pharmacy" | "health_post" | "lab"
  address: string | null
  phone: string | null
  district: string | null
  distance_km: number
  lat: number
  lon: number
  tier?: IphsFacilityTier
  capabilities?: IphsCapabilities
  specialtyName?: string
  doctorQualifications?: string
  hospitalAffiliation?: string
  regNo?: string
  consultationFee?: number
  opdTimings?: string
  recordType?: "clinician" | "facility_nodal_contact"
  verificationStatus?: "independently_verified" | "source_confirmed" | "unverified"
  sourceName?: string
}

export interface MapViewProps {
  language: string
  userLocation?: any
  camps?: any[]
}

export const TYPE_CONFIG: Record<
  string,
  { color: string; en: string; hi: string; icon: string; markerColor: string }
> = {
  hospital: { color: "#dc2626", en: "Hospital", hi: "अस्पताल", icon: "🏥", markerColor: "#dc2626" },
  clinic: { color: "#1d4ed8", en: "Clinic", hi: "क्लिनिक", icon: "🩺", markerColor: "#1d4ed8" },
  doctors: { color: "#7c3aed", en: "Doctor", hi: "डॉक्टर", icon: "👨‍⚕️", markerColor: "#7c3aed" },
  pharmacy: { color: "#15803d", en: "Pharmacy", hi: "फार्मेसी", icon: "💊", markerColor: "#15803d" },
  health_post: { color: "#b45309", en: "Health Post/PHC", hi: "PHC/स्वास्थ्य केंद्र", icon: "⛑️", markerColor: "#b45309" },
  lab: { color: "#0d9488", en: "Lab", hi: "लैब", icon: "🧪", markerColor: "#0d9488" },
}

export const MP_CENTER = { lat: 23.2599, lng: 77.4126 }
