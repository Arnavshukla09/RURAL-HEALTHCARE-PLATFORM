/**
 * lib/chat/suggestions.ts
 *
 * Fast client-side fuzzy suggestions engine using Fuse.js.
 * Indexes:
 * 1. 31 National Health Portal / WHO rural diseases
 * 2. Structured symptom definitions from lib/symptoms/catalog
 * 3. Common medical FAQ questions from offline-ai and medical-brain
 */

import Fuse from "fuse.js"
import { SYMPTOM_CATALOG } from "@/lib/symptoms/catalog"
import { normalizeQuery } from "./normalize"

export interface SuggestionItem {
  id: string
  type: "disease" | "symptom" | "faq"
  textEn: string
  textHi: string
  queryEn: string
  queryHi: string
  keywords: string[]
}

const COMMON_DISEASES = [
  { name: "Malaria", nameHi: "मलेरिया", hinglish: ["malaria", "thand bukhar"] },
  { name: "Dengue", nameHi: "डेंगू", hinglish: ["dengue", "haddi tod bukhar"] },
  { name: "Tuberculosis (TB)", nameHi: "टीबी (क्षयरोग)", hinglish: ["tb", "tuberculosis", "purani khasi"] },
  { name: "Typhoid", nameHi: "टाइफाइड", hinglish: ["typhoid", "motijhara", "miyadi bukhar"] },
  { name: "Pneumonia", nameHi: "निमोनिया", hinglish: ["pneumonia", "nimoniya"] },
  { name: "Anemia", nameHi: "एनीमिया (खून की कमी)", hinglish: ["anemia", "khoon ki kami"] },
  { name: "Hypertension (High BP)", nameHi: "उच्च रक्तचाप (हाई बीपी)", hinglish: ["high bp", "hypertension"] },
  { name: "Diabetes (Sugar)", nameHi: "मधुमेह (डायबिटीज/शुगर)", hinglish: ["diabetes", "sugar"] },
  { name: "Heart Disease", nameHi: "हृदय रोग", hinglish: ["heart disease", "dil ki bimari"] },
  { name: "Stroke", nameHi: "स्ट्रोक (लकवा)", hinglish: ["stroke", "lakwa", "paralysis"] },
  { name: "COVID-19", nameHi: "कोविड-19", hinglish: ["covid", "corona"] },
  { name: "Influenza (Flu)", nameHi: "इन्फ्लूएंजा (फ्लू)", hinglish: ["flu", "viral fever"] },
  { name: "Cholera", nameHi: "हैजा (कॉलरा)", hinglish: ["cholera", "haija"] },
  { name: "Hepatitis B (Jaundice)", nameHi: "हेपेटाइटिस (पीलिया)", hinglish: ["jaundice", "peeliya", "hepatitis"] },
  { name: "Asthma", nameHi: "दमा (अस्थमा)", hinglish: ["asthma", "dama", "saans ki bimari"] },
  { name: "COPD", nameHi: "सीओपीडी (फेफड़ों की बीमारी)", hinglish: ["copd", "fephdo ki bimari"] },
  { name: "Cataract", nameHi: "मोतियाबिंद", hinglish: ["cataract", "motiyabind"] },
  { name: "Osteoporosis", nameHi: "हड्डियों की कमजोरी", hinglish: ["osteoporosis", "haddi kamzori"] },
  { name: "Arthritis", nameHi: "गठिया (आर्थराइटिस)", hinglish: ["arthritis", "gathiya", "jodo ka dard"] },
  { name: "Leprosy", nameHi: "कुष्ठ रोग (कोढ़)", hinglish: ["leprosy", "kushth rog"] },
  { name: "Chikungunya", nameHi: "चिकनगुनिया", hinglish: ["chikungunya"] },
  { name: "Diarrheal Disease", nameHi: "अतिसार (दस्त)", hinglish: ["diarrhea", "dast", "loose motion"] },
  { name: "Measles", nameHi: "खसरा (मीजल्स)", hinglish: ["measles", "khasra"] },
  { name: "Ear Infection", nameHi: "कान का संक्रमण", hinglish: ["ear infection", "kaan behna"] },
  { name: "Skin Infection", nameHi: "त्वचा का संक्रमण (दाद/खाज)", hinglish: ["skin infection", "daad", "khujli"] },
  { name: "HIV/AIDS", nameHi: "एचआईवी/एड्स", hinglish: ["hiv", "aids"] },
  { name: "Polio", nameHi: "पोलियो", hinglish: ["polio"] },
  { name: "Kidney Disease", nameHi: "गुर्दे की बीमारी", hinglish: ["kidney disease", "gurde ki bimari"] },
  { name: "Liver Disease", nameHi: "लिवर की बीमारी", hinglish: ["liver disease", "jigar ki bimari"] },
  { name: "Epilepsy (Seizures)", nameHi: "मिर्गी (दौरे)", hinglish: ["epilepsy", "mirgi", "daure"] },
  { name: "Dental Caries", nameHi: "दांतों में कीड़ा/सड़न", hinglish: ["dental caries", "danto ka dard"] },
]

export function buildSuggestionsIndex(): SuggestionItem[] {
  const items: SuggestionItem[] = []

  // 1. Add Disease Questions
  for (const d of COMMON_DISEASES) {
    items.push({
      id: `disease-${d.name.toLowerCase().replace(/\s+/g, "-")}`,
      type: "disease",
      textEn: `What are the symptoms and cure for ${d.name}?`,
      textHi: `${d.nameHi} के क्या लक्षण और उपचार हैं?`,
      queryEn: `What is ${d.name} and what are its symptoms?`,
      queryHi: `${d.nameHi} के क्या लक्षण और घरेलू उपचार हैं?`,
      keywords: [d.name.toLowerCase(), d.nameHi, ...d.hinglish],
    })
  }

  // 2. Add Catalog Symptoms
  for (const s of SYMPTOM_CATALOG) {
    items.push({
      id: `symptom-${s.id}`,
      type: "symptom",
      textEn: `Home remedies for ${s.en}`,
      textHi: `${s.hi} के लिए घरेलू उपचार`,
      queryEn: `What should I do for ${s.en.toLowerCase()}?`,
      queryHi: `${s.hi} के लिए क्या करना चाहिए?`,
      keywords: [s.en.toLowerCase(), s.hi, s.id],
    })
  }

  // 3. Add Common Clinical FAQs
  const commonFAQs = [
    {
      en: "Can I eat spicy food during diarrhea?",
      hi: "क्या दस्त में तीखा खाना खा सकते हैं?",
      keywords: ["spicy", "mirch", "masala", "diarrhea", "dast", "food", "khana"],
    },
    {
      en: "Can I eat fiber-rich food during loose motions?",
      hi: "क्या दस्त के समय रेशेदार (फाइबर) भोजन कर सकते हैं?",
      keywords: ["fiber", "resha", "salad", "diarrhea", "dast"],
    },
    {
      en: "How to prepare ORS solution at home?",
      hi: "घर पर ओआरएस (ORS) घोल कैसे बनाएं?",
      keywords: ["ors", "sugar salt", "paani", "hydration"],
    },
    {
      en: "Emergency warning: Call 108 ambulance for chest pain",
      hi: "सीने में दर्द होने पर 108 पर कॉल करें",
      keywords: ["chest pain", "heart", "108", "seene mein dard", "emergency"],
    },
  ]

  for (let i = 0; i < commonFAQs.length; i++) {
    const f = commonFAQs[i]
    items.push({
      id: `faq-${i}`,
      type: "faq",
      textEn: f.en,
      textHi: f.hi,
      queryEn: f.en,
      queryHi: f.hi,
      keywords: f.keywords,
    })
  }

  return items
}

const INDEX = buildSuggestionsIndex()

const fuse = new Fuse(INDEX, {
  keys: ["textEn", "textHi", "keywords"],
  threshold: 0.35,
  minMatchCharLength: 2,
})

export function getLiveSuggestions(query: string, language: string = "en", limit = 4): SuggestionItem[] {
  if (!query || query.trim().length < 2) return []

  const normalized = normalizeQuery(query)
  const results = fuse.search(normalized)

  return results.slice(0, limit).map((r) => r.item)
}
