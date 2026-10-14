/**
 * lib/geo/lgd-iphs.ts
 *
 * National Geographic & Public Health Facility Standards:
 * 1. LGD (Local Government Directory): Administrative hierarchy (State -> District -> Sub-District / Block).
 * 2. IPHS (Indian Public Health Standards 2022): Facility capability tiers and services.
 */

export interface LgdState {
  code: string // e.g. "23" for MP, "08" for Rajasthan, "27" for Maharashtra
  nameEn: string
  nameHi: string
  center: { lat: number; lng: number }
  districts: LgdDistrict[]
}

export interface LgdDistrict {
  code: string
  stateCode: string
  nameEn: string
  nameHi: string
  center: { lat: number; lng: number }
  blocks: string[]
}

export type IphsFacilityTier =
  | "sub_centre"        // Ayushman Arogya Mandir / Sub Health Centre (population 3,000 - 5,000)
  | "phc"               // Primary Health Centre (population 20,000 - 30,000)
  | "chc"               // Community Health Centre (population 80,000 - 1,20,000)
  | "sdh"               // Sub-District Hospital (31 - 100 beds)
  | "district_hospital" // District Hospital (100 - 500 beds)
  | "medical_college"   // Tertiary Care / Apex Medical College (AIIMS / State GMC)

export interface IphsCapabilities {
  tier: IphsFacilityTier
  tierNameEn: string
  tierNameHi: string
  is24x7: boolean
  isFRU: boolean               // First Referral Unit (Emergency Obstetric Care)
  hasBloodBankOrStorage: boolean
  hasICU: boolean
  hasNICU: boolean
  hasDialysis: boolean
  isPmJayEmpaneled: boolean     // Ayushman Bharat PM-JAY
  primarySpecialties: string[]
}

export interface NationalFacility {
  id: string
  nameEn: string
  nameHi: string
  stateCode: string
  districtCode: string
  blockName?: string
  tier: IphsFacilityTier
  capabilities: IphsCapabilities
  addressEn: string
  addressHi: string
  phone: string
  emergency: boolean
  beds: number
  lat: number
  lon: number
}

// Canonical Tier Metadata mapping IPHS 2022 definitions
export const IPHS_TIER_CONFIG: Record<IphsFacilityTier, { en: string; hi: string; level: number; badgeColor: string }> = {
  sub_centre: {
    en: "Sub Health Centre (Arogya Mandir)",
    hi: "उप स्वास्थ्य केंद्र (आरोग्य मंदिर)",
    level: 1,
    badgeColor: "bg-emerald-100 text-emerald-800",
  },
  phc: {
    en: "Primary Health Centre (PHC)",
    hi: "प्राथमिक स्वास्थ्य केंद्र (PHC)",
    level: 2,
    badgeColor: "bg-blue-100 text-blue-800",
  },
  chc: {
    en: "Community Health Centre (CHC)",
    hi: "सामुदायिक स्वास्थ्य केंद्र (CHC)",
    level: 3,
    badgeColor: "bg-amber-100 text-amber-800",
  },
  sdh: {
    en: "Sub-District Hospital (SDH)",
    hi: "उप-जिला अस्पताल",
    level: 4,
    badgeColor: "bg-purple-100 text-purple-800",
  },
  district_hospital: {
    en: "District Hospital",
    hi: "जिला अस्पताल",
    level: 5,
    badgeColor: "bg-red-100 text-red-800",
  },
  medical_college: {
    en: "Medical College & Tertiary Care",
    hi: "मेडिकल कॉलेज एवं सुपर स्पेशियलिटी",
    level: 6,
    badgeColor: "bg-indigo-100 text-indigo-800",
  },
}

import panIndiaLgd from "./pan-india-lgd.json"

// Complete National LGD States & 722 Districts
export const LGD_STATES: LgdState[] = panIndiaLgd as LgdState[]
