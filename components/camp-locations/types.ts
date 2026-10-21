/**
 * components/camp-locations/types.ts
 *
 * Types, backward-compatible shims, and localization dictionary for Outreach & Camps.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Outreach & Camps Subsystem
 */

export * from "@/lib/data/annual-campaigns"
import type { AnnualCampaign } from "@/lib/data/annual-campaigns"

export interface CampLocationsProps {
  language: string
}

export interface CampLocation {
  id: number | string
  name: string
  type: "blood-donation" | "checkup" | "vaccination" | "maternal" | "eye-care" | "communicable-disease"
  address: string
  landmark: string
  coordinates: { lat: number; lng: number }
  date: string
  time: string
  contact: string
  participants: number
  status: "active" | "upcoming" | "completed"
  description: string
  scope?: "national" | "state"
  stateCode?: string
  stateName?: string
  districtName?: string
  recurrence?: string
  cost?: string
  organizer?: string
  services?: string[]
  targetBeneficiaries?: string
}

/** Convert an AnnualCampaign into the UI CampLocation format for unified rendering */
export function campaignToCampLocation(camp: AnnualCampaign, language: string): CampLocation {
  const en = language === "en"
  return {
    id: camp.id,
    name: en ? camp.titleEn : camp.titleHi,
    type: camp.category as any,
    address: en ? camp.venueEn : camp.venueHi,
    landmark: camp.districtName,
    coordinates: { lat: 23.2599, lng: 77.4126 },
    date: camp.annualMonth,
    time: camp.timing,
    contact: camp.contact,
    participants: 150,
    status: camp.status,
    description: en
      ? `Organized by ${camp.organizerEn}. Beneficiaries: ${camp.targetBeneficiariesEn}`
      : `${camp.organizerHi} द्वारा आयोजित। लक्षित लाभार्थी: ${camp.targetBeneficiariesHi}`,
    scope: camp.scope,
    stateCode: camp.stateCode,
    stateName: en ? camp.stateNameEn : camp.stateNameHi,
    districtName: camp.districtName,
    recurrence: en ? camp.recurrenceEn : camp.recurrenceHi,
    cost: en ? camp.costEn : camp.costHi,
    organizer: en ? camp.organizerEn : camp.organizerHi,
    services: en ? camp.servicesEn : camp.servicesHi,
    targetBeneficiaries: en ? camp.targetBeneficiariesEn : camp.targetBeneficiariesHi,
  }
}

export function getCampLocationsContent(language: string) {
  const content = {
    en: {
      title: "Pan-India Health Camps & Annual Campaigns",
      subtitle: "Verified recurring government health drives, immunization days & specialized outreach camps",
      searchPlaceholder: "Search by campaign name, service (e.g. Polio, TB, ANC), or venue...",
      locateMe: "Use My Location",
      showMap: "Show on Map",
      filterAll: "All Campaigns",
      filterBlood: "Blood Donation",
      filterCheckup: "Health Checkup",
      filterVaccination: "Vaccination",
      sortDistance: "By Location",
      sortDate: "Upcoming First",
      getDirections: "Get Directions",
      callCamp: "Call Helpline",
      registerNow: "Register / Add to Records",
      shareLocation: "Share Details",
      today: "Today",
      tomorrow: "Tomorrow",
      active: "Active Now",
      upcoming: "Upcoming Round",
      completed: "Completed",
      participants: "expected participants",
      noLocation: "Please select your state or search to find camps",
      noCamps: "No health campaigns found matching your current filter criteria",
      locationAccess: "Location access denied. Please select your State manually.",
      viewOnMap: "View on Map",
      nationalBadge: "🇮🇳 National Drive (All States)",
      stateBadge: "📍 State Campaign",
      costFree: "100% Free / Cashless under NHM",
      selectState: "Select State / UT",
      selectDistrict: "Select District",
      allStates: "All India (National & All States)",
      allDistricts: "All Districts",
      resetFilters: "Reset Filters",
      filterLabel: "Filter by Category:",
      locationFilters: "Location & State Filters",
      servicesProvided: "Services & Diagnostic Highlights:",
      organizerLabel: "Organized by:",
      recurrenceLabel: "Recurrence & Schedule:",
      timingLabel: "Timing:",
      venueLabel: "Venue / Health Facility:",
      targetLabel: "Target Beneficiaries:",
    },
    hi: {
      title: "अखिल भारतीय स्वास्थ्य शिविर एवं वार्षिक अभियान",
      subtitle: "सत्यापित वार्षिक सरकारी स्वास्थ्य अभियान, टीकाकरण दिवस एवं विशेषज्ञ आउटरीच शिविर",
      searchPlaceholder: "अभियान का नाम, सेवा (जैसे पोलियो, टीबी, प्रसवपूर्व जांच) या स्थान खोजें...",
      locateMe: "मेरा स्थान उपयोग करें",
      showMap: "मानचित्र पर दिखाएं",
      filterAll: "सभी अभियान",
      filterBlood: "रक्तदान",
      filterCheckup: "स्वास्थ्य जांच",
      filterVaccination: "टीकाकरण",
      sortDistance: "स्थान अनुसार",
      sortDate: "आगामी पहले",
      getDirections: "दिशा निर्देश",
      callCamp: "हेल्पलाइन कॉल",
      registerNow: "पंजीकरण / रिकॉर्ड में जोड़ें",
      shareLocation: "विवरण साझा करें",
      today: "आज",
      tomorrow: "कल",
      active: "सक्रिय अभी",
      upcoming: "आगामी चरण",
      completed: "पूर्ण",
      participants: "अनुमानित प्रतिभागी",
      noLocation: "शिविर खोजने के लिए कृपया अपना राज्य चुनें या खोजें",
      noCamps: "आपके फ़िल्टर के अनुसार कोई स्वास्थ्य अभियान नहीं मिला",
      locationAccess: "स्थान पहुंच अस्वीकृत। कृपया मैन्युअल रूप से अपना राज्य चुनें।",
      viewOnMap: "मानचित्र पर देखें",
      nationalBadge: "🇮🇳 राष्ट्रीय अभियान (सभी राज्य)",
      stateBadge: "📍 राज्य स्तरीय अभियान",
      costFree: "NHM के तहत 100% निःशुल्क / कैशलेस",
      selectState: "राज्य / केंद्र शासित प्रदेश चुनें",
      selectDistrict: "जिला चुनें",
      allStates: "अखिल भारतीय (राष्ट्रीय व सभी राज्य)",
      allDistricts: "सभी जिले",
      resetFilters: "फ़िल्टर रीसेट करें",
      filterLabel: "श्रेणी अनुसार फ़िल्टर:",
      locationFilters: "स्थान व राज्य फ़िल्टर",
      servicesProvided: "उपलब्ध सेवाएं एवं प्रमुख जांचें:",
      organizerLabel: "आयोजक:",
      recurrenceLabel: "आवृत्ति एवं समय-सारणी:",
      timingLabel: "समय:",
      venueLabel: "स्थान / स्वास्थ्य केंद्र:",
      targetLabel: "लक्षित लाभार्थी:",
    },
  }

  return content[language as keyof typeof content] || content.en
}
