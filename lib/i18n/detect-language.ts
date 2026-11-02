/**
 * lib/i18n/detect-language.ts
 *
 * Client-Side Multilingual Engine & Regional Dialect Mapping for Rural Healthcare.
 * Zero external translation API cost ($0 Free Tier).
 *
 * Features:
 * 1. Device Language Detection via navigator.language / navigator.languages.
 * 2. Geo/LGD State-to-Language Mapping (all 36 States & UTs mapped to regional vernacular).
 * 3. Nearest GPS Coordinates to LGD State Center mapping.
 * 4. Endonyms and Dialect metadata (Bhojpuri, Maithili, Bundelkhandi, Malvi, Marwari, etc.).
 * 5. Browser HTML lang sync & preference persistence in localStorage.
 */

export interface SupportedLanguage {
  code: string
  name: string
  nativeName: string
  shortLabel: string
  primaryRegion: string
  dialects?: string[]
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    shortLabel: "EN",
    primaryRegion: "All India",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    shortLabel: "हिं",
    primaryRegion: "MP, UP, Bihar, Rajasthan, Delhi, HP, Uttarakhand, Haryana",
    dialects: ["Bhojpuri (भोजपुरी)", "Maithili (मैथिली)", "Bundelkhandi (बुंदेलखंडी)", "Malvi (मालवी)", "Marwari (मारवाड़ी)", "Chhattisgarhi (छत्तीसगढ़ी)"],
  },
  {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    shortLabel: "मरा",
    primaryRegion: "Maharashtra, Goa",
    dialects: ["Varhadi (वऱ्हाडी)", "Konkani (कोकणी)", "Ahirani (अहिराणी)"],
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    shortLabel: "বাং",
    primaryRegion: "West Bengal, Tripura",
    dialects: ["Rarh (রাঢ়ী)", "Varendra (বরেন্দ্রী)"],
  },
  {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    shortLabel: "తె",
    primaryRegion: "Andhra Pradesh, Telangana",
    dialects: ["Rayalaseema", "Coastal Andhra", "Telangana"],
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    shortLabel: "த",
    primaryRegion: "Tamil Nadu, Puducherry",
    dialects: ["Kongu Tamil", "Madurai Tamil"],
  },
  {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    shortLabel: "ગુ",
    primaryRegion: "Gujarat, Daman & Diu",
    dialects: ["Kathiyawadi (કાઠિયાવાડી)", "Surati (સુરતી)"],
  },
  {
    code: "kn",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    shortLabel: "ಕ",
    primaryRegion: "Karnataka",
    dialects: ["Kundagannada", "Arebhashe"],
  },
  {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    shortLabel: "ਪੰ",
    primaryRegion: "Punjab, Chandigarh",
    dialects: ["Majhi (ਮਾਝੀ)", "Malwai (ਮਲਵਈ)", "Doabi (ਦੁਆਬੀ)"],
  },
  {
    code: "or",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    shortLabel: "ଓ",
    primaryRegion: "Odisha",
    dialects: ["Sambalpuri (ସମ୍ବଲପୁରୀ)", "Desiya"],
  },
  {
    code: "ml",
    name: "Malayalam",
    nativeName: "മലയാളം",
    shortLabel: "मल",
    primaryRegion: "Kerala, Lakshadweep",
  },
  {
    code: "as",
    name: "Assamese",
    nativeName: "অসমীয়া",
    shortLabel: "অ",
    primaryRegion: "Assam",
  },
  {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    shortLabel: "ار",
    primaryRegion: "Jammu & Kashmir, Telangana, UP",
  },
]

/**
 * Mapping of LGD 2-digit State Codes to primary regional languages.
 * Source: Ministry of Panchayati Raj / Census Language Census.
 */
export const STATE_CODE_TO_LANGUAGE: Record<string, string> = {
  "27": "mr", // Maharashtra
  "19": "bn", // West Bengal
  "24": "gu", // Gujarat
  "33": "ta", // Tamil Nadu
  "29": "kn", // Karnataka
  "28": "te", // Andhra Pradesh
  "36": "te", // Telangana
  "03": "pa", // Punjab
  "21": "or", // Odisha
  "32": "ml", // Kerala
  "18": "as", // Assam
  "01": "ur", // Jammu & Kashmir
  "37": "ur", // Ladakh
  "23": "hi", // Madhya Pradesh
  "09": "hi", // Uttar Pradesh
  "10": "hi", // Bihar
  "08": "hi", // Rajasthan
  "22": "hi", // Chhattisgarh
  "20": "hi", // Jharkhand
  "07": "hi", // Delhi
  "06": "hi", // Haryana
  "05": "hi", // Uttarakhand
  "02": "hi", // Himachal Pradesh
  "30": "mr", // Goa
  "34": "ta", // Puducherry
  "04": "pa", // Chandigarh
  "38": "gu", // Dadra and Nagar Haveli and Daman and Diu
  "16": "bn", // Tripura
  "31": "ml", // Lakshadweep
  "35": "hi", // Andaman & Nicobar
  "11": "en", // Sikkim
  "12": "en", // Arunachal Pradesh
  "13": "en", // Nagaland
  "14": "en", // Manipur
  "15": "en", // Mizoram
  "17": "en", // Meghalaya
}

/**
 * Representative coordinate centers for states to resolve GPS coordinates to nearest state.
 */
const STATE_COORDINATE_CENTERS: Array<{ code: string; lat: number; lng: number }> = [
  { code: "23", lat: 23.4733, lng: 77.9479 }, // MP
  { code: "27", lat: 19.7515, lng: 75.7139 }, // Maharashtra
  { code: "08", lat: 27.0238, lng: 74.2179 }, // Rajasthan
  { code: "09", lat: 26.8467, lng: 80.9462 }, // UP
  { code: "10", lat: 25.0961, lng: 85.3131 }, // Bihar
  { code: "19", lat: 22.9868, lng: 87.8550 }, // West Bengal
  { code: "24", lat: 22.2587, lng: 71.1924 }, // Gujarat
  { code: "33", lat: 11.1271, lng: 78.6569 }, // Tamil Nadu
  { code: "29", lat: 15.3173, lng: 75.7139 }, // Karnataka
  { code: "28", lat: 15.9129, lng: 79.7400 }, // Andhra Pradesh
  { code: "36", lat: 18.1124, lng: 79.0193 }, // Telangana
  { code: "21", lat: 20.9517, lng: 85.0985 }, // Odisha
  { code: "03", lat: 31.1471, lng: 75.3412 }, // Punjab
  { code: "32", lat: 10.8505, lng: 76.2711 }, // Kerala
  { code: "18", lat: 26.2006, lng: 92.9376 }, // Assam
  { code: "22", lat: 21.2787, lng: 81.8661 }, // Chhattisgarh
  { code: "20", lat: 23.6102, lng: 85.2799 }, // Jharkhand
  { code: "07", lat: 28.7041, lng: 77.1025 }, // Delhi
  { code: "06", lat: 29.0588, lng: 76.0856 }, // Haryana
  { code: "05", lat: 30.0668, lng: 79.0193 }, // Uttarakhand
  { code: "02", lat: 31.1048, lng: 77.1734 }, // Himachal Pradesh
  { code: "01", lat: 33.7782, lng: 76.5762 }, // J&K
  { code: "30", lat: 15.2993, lng: 74.1240 }, // Goa
]

/**
 * Detect user's device preferred language from browser navigator.
 */
export function getDeviceLanguage(): string {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "en"
  }

  const rawLanguages: readonly string[] =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language || "en"]

  for (const raw of rawLanguages) {
    if (!raw) continue
    const prefix = raw.toLowerCase().split("-")[0]
    const match = SUPPORTED_LANGUAGES.find((l) => l.code === prefix)
    if (match) {
      return match.code
    }
  }

  return "en"
}

/**
 * Resolve language recommendation by LGD State code.
 */
export function getLanguageForStateCode(stateCode: string): string {
  return STATE_CODE_TO_LANGUAGE[stateCode] || "hi"
}

/**
 * Resolve closest LGD state code and regional language from GPS coordinates.
 */
export function getLanguageFromCoordinates(lat: number, lng: number): {
  stateCode: string
  languageCode: string
} {
  let minDistanceSq = Infinity
  let closestStateCode = "23" // default to MP

  for (const s of STATE_COORDINATE_CENTERS) {
    const dLat = s.lat - lat
    const dLng = s.lng - lng
    const distSq = dLat * dLat + dLng * dLng
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq
      closestStateCode = s.code
    }
  }

  const langCode = STATE_CODE_TO_LANGUAGE[closestStateCode] || "hi"
  return {
    stateCode: closestStateCode,
    languageCode: langCode,
  }
}

/**
 * Get language metadata by language code.
 */
export function getLanguageMetadata(code: string): SupportedLanguage {
  return (
    SUPPORTED_LANGUAGES.find((l) => l.code === code) || {
      code: "en",
      name: "English",
      nativeName: "English",
      shortLabel: "EN",
      primaryRegion: "All India",
    }
  )
}

/**
 * Helper to persist user's chosen language and sync document lang attribute.
 */
export function persistLanguageChoice(code: string): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem("rhcp_language", code)
    document.documentElement.lang = code
    window.dispatchEvent(
      new CustomEvent("rhcp-language-change", { detail: { language: code } })
    )
  } catch (err) {
    console.warn("[i18n] Failed to persist language:", err)
  }
}
