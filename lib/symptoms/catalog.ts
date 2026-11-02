/**
 * lib/symptoms/catalog.ts
 *
 * Canonical catalog of all clinical symptoms organized by anatomical system.
 * Retains 100% of existing symptoms from SymptomChecker.tsx with stable IDs.
 */

export interface SymptomDefinition {
  id: string
  category: string
  en: string
  hi: string
  redFlag?: boolean
}

export const SYMPTOM_CATALOG: SymptomDefinition[] = [
  // Head / Neuro
  { id: "severe-headache", category: "head", en: "Severe headache", hi: "तेज सिरदर्द", redFlag: true },
  { id: "mild-headache", category: "head", en: "Mild headache", hi: "हल्का सिरदर्द" },
  { id: "dizziness-vertigo", category: "head", en: "Dizziness/vertigo", hi: "चक्कर/वर्टिगो" },
  { id: "fainting", category: "head", en: "Fainting", hi: "बेहोशी", redFlag: true },
  { id: "confusion", category: "head", en: "Confusion", hi: "भ्रम", redFlag: true },
  { id: "memory-problems", category: "head", en: "Memory problems", hi: "याददाश्त की समस्या" },
  { id: "migraine", category: "head", en: "Migraine", hi: "माइग्रेन" },

  // Eyes
  { id: "blurred-vision", category: "eyes", en: "Blurred vision", hi: "धुंधली दृष्टि", redFlag: true },
  { id: "eye-pain", category: "eyes", en: "Eye pain", hi: "आंख में दर्द" },
  { id: "redness-irritation", category: "eyes", en: "Redness/irritation", hi: "लालिमा/जलन" },
  { id: "discharge", category: "eyes", en: "Discharge", hi: "आंख से पानी/कीचड़" },
  { id: "light-sensitivity", category: "eyes", en: "Light sensitivity", hi: "रोशनी से परेशानी" },
  { id: "double-vision", category: "eyes", en: "Double vision", hi: "दोहरा दिखना", redFlag: true },
  { id: "swollen-eyelids", category: "eyes", en: "Swollen eyelids", hi: "पलकों में सूजन" },

  // Ears
  { id: "ear-pain", category: "ears", en: "Ear pain", hi: "कान में दर्द" },
  { id: "hearing-loss", category: "ears", en: "Hearing loss", hi: "सुनाई कम देना" },
  { id: "ringing-in-ears", category: "ears", en: "Ringing in ears", hi: "कान में घंटी बजना" },
  { id: "discharge-from-ear", category: "ears", en: "Discharge from ear", hi: "कान बहना" },
  { id: "blocked-ear", category: "ears", en: "Blocked ear", hi: "कान बंद होना" },
  { id: "itching-in-ear", category: "ears", en: "Itching in ear", hi: "कान में खुजली" },

  // Chest / Cardiac / Pulmonary
  { id: "chest-pain", category: "chest", en: "Chest pain", hi: "सीने में दर्द", redFlag: true },
  { id: "shortness-of-breath", category: "chest", en: "Shortness of breath", hi: "सांस की तकलीफ", redFlag: true },
  { id: "rapid-heartbeat", category: "chest", en: "Rapid heartbeat", hi: "तेज धड़कन" },
  { id: "cough-with-blood", category: "chest", en: "Cough with blood", hi: "खून वाली खांसी", redFlag: true },
  { id: "wheezing", category: "chest", en: "Wheezing", hi: "घर्र-घर्र की आवाज" },
  { id: "tightness-in-chest", category: "chest", en: "Tightness in chest", hi: "छाती में जकड़न", redFlag: true },
  { id: "palpitations", category: "chest", en: "Palpitations", hi: "घबराहट" },

  // Stomach / Gastrointestinal
  { id: "severe-abdominal-pain", category: "stomach", en: "Severe abdominal pain", hi: "तेज पेट दर्द", redFlag: true },
  { id: "mild-stomach-ache", category: "stomach", en: "Mild stomach ache", hi: "हल्का पेट दर्द" },
  { id: "nausea", category: "stomach", en: "Nausea", hi: "मतली" },
  { id: "vomiting", category: "stomach", en: "Vomiting", hi: "उल्टी" },
  { id: "diarrhea", category: "stomach", en: "Diarrhea", hi: "दस्त" },
  { id: "constipation", category: "stomach", en: "Constipation", hi: "कब्ज" },
  { id: "blood-in-stool", category: "stomach", en: "Blood in stool", hi: "मल में खून", redFlag: true },
  { id: "bloating", category: "stomach", en: "Bloating", hi: "पेट फूलना/गैस" },
  { id: "heartburn", category: "stomach", en: "Heartburn", hi: "सीने में जलन" },

  // General Systemic
  { id: "high-fever", category: "general", en: "High fever (>103°F)", hi: "तेज बुखार (>103°F)", redFlag: true },
  { id: "low-fever", category: "general", en: "Low fever (99–102°F)", hi: "हल्का बुखार" },
  { id: "chills-shivering", category: "general", en: "Chills/shivering", hi: "ठंड/कंपकंपी" },
  { id: "fatigue-exhaustion", category: "general", en: "Fatigue/exhaustion", hi: "थकान" },
  { id: "unexplained-weight-loss", category: "general", en: "Unexplained weight loss", hi: "अकारण वजन घटना" },
  { id: "night-sweats", category: "general", en: "Night sweats", hi: "रात में पसीना" },
  { id: "loss-of-appetite", category: "general", en: "Loss of appetite", hi: "भूख न लगना" },

  // Throat
  { id: "sore-throat", category: "throat", en: "Sore throat", hi: "गले में दर्द" },
  { id: "difficulty-swallowing", category: "throat", en: "Difficulty swallowing", hi: "निगलने में कठिनाई" },
  { id: "hoarseness", category: "throat", en: "Hoarseness", hi: "आवाज बैठना" },
  { id: "swollen-lymph-nodes", category: "throat", en: "Swollen lymph nodes", hi: "गले की ग्रंथियों में सूजन" },

  // Urinary
  { id: "burning-urination", category: "urinary", en: "Burning urination", hi: "पेशाब में जलन" },
  { id: "frequent-urination", category: "urinary", en: "Frequent urination", hi: "बार-बार पेशाब आना" },
  { id: "blood-in-urine", category: "urinary", en: "Blood in urine", hi: "पेशाब में खून", redFlag: true },
  { id: "difficulty-urinating", category: "urinary", en: "Difficulty urinating", hi: "पेशाब करने में रुकावट" },
]

export function findSymptomByIdOrName(query: string): SymptomDefinition | undefined {
  const q = query.trim().toLowerCase()
  return SYMPTOM_CATALOG.find(
    (s) => s.id === q || s.en.toLowerCase() === q || s.hi.toLowerCase() === q
  )
}
