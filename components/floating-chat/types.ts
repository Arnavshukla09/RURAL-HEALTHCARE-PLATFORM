/**
 * components/floating-chat/types.ts
 *
 * Types, navigation mappings, and site guide routes for FloatingChat.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — AI Navigation Subsystem
 */

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  navButtons?: NavButton[]
  queryId?: string
  feedback?: 1 | -1
}

export interface NavButton {
  label: string
  page?: string
  action?: string
  icon?: string
}

export const NAV_KEYWORDS: Record<string, { page: string; label: string }> = {
  symptom: { page: "symptom-checker", label: "Symptom Checker" },
  symptoms: { page: "symptom-checker", label: "Symptom Checker" },
  लक्षण: { page: "symptom-checker", label: "लक्षण जांचक" },
  hospital: { page: "locations", label: "Find Hospitals" },
  hospitals: { page: "locations", label: "Find Hospitals" },
  clinic: { page: "locations", label: "Find Clinics" },
  map: { page: "locations", label: "Health Facilities Map" },
  facility: { page: "locations", label: "Health Facilities" },
  अस्पताल: { page: "locations", label: "अस्पताल खोजें" },
  appointment: { page: "appointments", label: "Book Appointment" },
  appointments: { page: "appointments", label: "My Appointments" },
  book: { page: "consultation", label: "Book Consultation" },
  consult: { page: "consultation", label: "Consult a Doctor" },
  doctor: { page: "consultation", label: "Find Doctor" },
  doctors: { page: "directory", label: "Doctor Directory" },
  अपॉइंटमेंट: { page: "appointments", label: "अपॉइंटमेंट" },
  record: { page: "records", label: "Medical Records" },
  records: { page: "records", label: "Medical Records" },
  prescription: { page: "records", label: "My Records" },
  रिकॉर्ड: { page: "records", label: "मेडिकल रिकॉर्ड" },
  emergency: { page: "emergency", label: "Emergency Services" },
  आपातकाल: { page: "emergency", label: "आपातकालीन सेवाएं" },
  camp: { page: "camps", label: "Health Camps" },
  camps: { page: "camps", label: "Health Camps" },
  health: { page: "health-info", label: "Health Information" },
  information: { page: "health-info", label: "Health Info Hub" },
  dashboard: { page: "dashboard", label: "My Dashboard" },
  home: { page: "dashboard", label: "Go Home" },
}

export const SITE_GUIDE_PAGES = [
  { icon: "🏠", label: "Dashboard", labelHi: "डैशबोर्ड", page: "dashboard" },
  { icon: "🩺", label: "Symptom Checker", labelHi: "लक्षण जांचक", page: "symptom-checker" },
  { icon: "👨‍⚕️", label: "Book a Doctor", labelHi: "डॉक्टर बुक करें", page: "consultation" },
  { icon: "📅", label: "My Appointments", labelHi: "मेरी अपॉइंटमेंट", page: "appointments" },
  { icon: "📋", label: "Medical Records", labelHi: "मेडिकल रिकॉर्ड", page: "records" },
  { icon: "🗺️", label: "Nearby Hospitals", labelHi: "निकटतम अस्पताल", page: "locations" },
  { icon: "⛺", label: "Health Camps", labelHi: "स्वास्थ्य शिविर", page: "camps" },
  { icon: "📚", label: "Health Info", labelHi: "स्वास्थ्य जानकारी", page: "health-info" },
  { icon: "🆘", label: "Emergency", labelHi: "आपातकाल", page: "emergency" },
]

export function detectNavIntent(text: string): { page: string; label: string } | null {
  const lower = text.toLowerCase()
  for (const [kw, nav] of Object.entries(NAV_KEYWORDS)) {
    if (lower.includes(kw)) return nav
  }
  return null
}

export const PAGE_LABELS: Record<string, { en: string; hi: string }> = {
  "symptom-checker": { en: "Symptom Checker", hi: "लक्षण जांचक" },
  consultation: { en: "Book Consultation", hi: "परामर्श बुक करें" },
  appointments: { en: "Appointments", hi: "अपॉइंटमेंट" },
  records: { en: "Medical Records", hi: "मेडिकल रिकॉर्ड" },
  locations: { en: "Health Facilities", hi: "स्वास्थ्य केंद्र" },
  camps: { en: "Health Camps", hi: "स्वास्थ्य शिविर" },
  "health-info": { en: "Health Info", hi: "स्वास्थ्य जानकारी" },
  emergency: { en: "Emergency", hi: "आपातकाल" },
  dashboard: { en: "Dashboard", hi: "डैशबोर्ड" },
  directory: { en: "Doctor Directory", hi: "डॉक्टर डायरेक्टरी" },
}

export function getWelcomeMessage(en: boolean): ChatMessage {
  return {
    role: "assistant",
    content: en
      ? "👋 Hi! I'm your **RuralHealth Guide**. I can:\n\n• Navigate you to any section of this website\n• Answer health questions in real-time\n• Explain your symptoms\n• Find nearby hospitals\n\nTap a quick action below or ask me anything!"
      : "👋 नमस्ते! मैं आपका **ग्रामीण स्वास्थ्य गाइड** हूं। मैं कर सकता हूं:\n\n• वेबसाइट के किसी भी भाग में नेविगेट करना\n• स्वास्थ्य प्रश्नों का उत्तर देना\n• लक्षण समझाना\n• निकटतम अस्पताल खोजना\n\nनीचे त्वरित विकल्प चुनें या कुछ पूछें!",
    navButtons: [
      { label: en ? "🗺️ Navigate Site" : "🗺️ साइट गाइड", action: "show_guide" },
      { label: en ? "🩺 Check Symptoms" : "🩺 लक्षण जांचें", page: "symptom-checker" },
      { label: en ? "🆘 Emergency" : "🆘 आपातकाल", page: "emergency" },
      { label: en ? "👨‍⚕️ Book Doctor" : "👨‍⚕️ डॉक्टर बुक करें", page: "consultation" },
    ],
  }
}

export function getQuickActions(en: boolean): string[] {
  return en
    ? [
        "Check my symptoms",
        "Find nearest hospital",
        "I need emergency help",
        "Book an appointment",
      ]
    : [
        "मेरे लक्षण जांचें",
        "निकटतम अस्पताल खोजें",
        "मुझे आपातकालीन मदद चाहिए",
        "अपॉइंटमेंट बुक करें",
      ]
}
