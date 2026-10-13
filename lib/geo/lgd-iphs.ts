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

// Curated LGD States & Pilot Districts
export const LGD_STATES: LgdState[] = [
  {
    code: "23",
    nameEn: "Madhya Pradesh",
    nameHi: "मध्य प्रदेश",
    center: { lat: 23.2599, lng: 77.4126 },
    districts: [
      { code: "2301", stateCode: "23", nameEn: "Bhopal", nameHi: "भोपाल", center: { lat: 23.2599, lng: 77.4126 }, blocks: ["Berasia", "Phanda Urban", "Phanda Rural"] },
      { code: "2302", stateCode: "23", nameEn: "Sehore", nameHi: "सीहोर", center: { lat: 23.2031, lng: 77.0844 }, blocks: ["Sehore", "Ashta", "Ichhawar", "Nasrullaganj", "Budni"] },
      { code: "2303", stateCode: "23", nameEn: "Indore", nameHi: "इंदौर", center: { lat: 22.7196, lng: 75.8577 }, blocks: ["Indore Urban", "Depalpur", "Mhow", "Sanwer"] },
      { code: "2304", stateCode: "23", nameEn: "Raisen", nameHi: "रायसेन", center: { lat: 23.3315, lng: 77.7816 }, blocks: ["Raisen", "Gairatganj", "Begamganj", "Silwani", "Obedullaganj"] },
      { code: "2305", stateCode: "23", nameEn: "Vidisha", nameHi: "विदिशा", center: { lat: 23.5251, lng: 77.8081 }, blocks: ["Vidisha", "Gyaraspur", "Basoda", "Kurwai", "Sironj"] },
    ],
  },
  {
    code: "08",
    nameEn: "Rajasthan",
    nameHi: "राजस्थान",
    center: { lat: 26.9124, lng: 75.7873 },
    districts: [
      { code: "0801", stateCode: "08", nameEn: "Jaipur", nameHi: "जयपुर", center: { lat: 26.9124, lng: 75.7873 }, blocks: ["Amer", "Chaksu", "Jhotwara", "Phulera", "Sanganer"] },
      { code: "0802", stateCode: "08", nameEn: "Dahod Border / Banswara", nameHi: "बांसवाड़ा", center: { lat: 23.5461, lng: 74.4349 }, blocks: ["Banswara", "Garhi", "Ghatol", "Kushalgarh"] },
    ],
  },
  {
    code: "27",
    nameEn: "Maharashtra",
    nameHi: "महाराष्ट्र",
    center: { lat: 19.7515, lng: 75.7139 },
    districts: [
      { code: "2701", stateCode: "27", nameEn: "Nagpur", nameHi: "नागपुर", center: { lat: 21.1458, lng: 79.0882 }, blocks: ["Nagpur Rural", "Kamptee", "Hingna", "Katol", "Saoner"] },
      { code: "2702", stateCode: "27", nameEn: "Amravati", nameHi: "अमरावती", center: { lat: 20.9374, lng: 77.7796 }, blocks: ["Amravati", "Achalpur", "Chandur Bazar", "Dharni", "Chikhaldara"] },
    ],
  },
]
