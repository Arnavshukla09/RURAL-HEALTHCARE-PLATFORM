/**
 * components/symptom-checker/types.ts
 *
 * Types, catalogs, body parts, and urgency styling for Symptom Checker.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Triage Subsystem
 */

import {
  Brain,
  Eye,
  Ear,
  Heart,
  Droplet,
  Wind,
  Activity,
  User,
  Thermometer,
} from "lucide-react"

export interface SymptomCheckerProps {
  language: string
}

export interface PatientInfoState {
  age: string
  gender: string
  temperature: string
  tempUnit: string
  daysSick: string
  intensity: "mild" | "moderate" | "severe"
}

export const SYMPTOM_DB: Record<string, string[]> = {
  head:    ["Severe headache", "Mild headache", "Dizziness/vertigo", "Fainting", "Confusion", "Memory problems", "Migraine"],
  eyes:    ["Blurred vision", "Eye pain", "Redness/irritation", "Discharge", "Light sensitivity", "Double vision", "Swollen eyelids"],
  ears:    ["Ear pain", "Hearing loss", "Ringing in ears", "Discharge from ear", "Blocked ear", "Itching in ear"],
  chest:   ["Chest pain", "Shortness of breath", "Rapid heartbeat", "Cough with blood", "Wheezing", "Tightness in chest", "Palpitations"],
  stomach: ["Severe abdominal pain", "Mild stomach ache", "Nausea", "Vomiting", "Diarrhea", "Constipation", "Blood in stool", "Bloating", "Heartburn"],
  arms:    ["Pain in arm/shoulder", "Weakness in arm", "Numbness/tingling", "Swelling", "Joint pain", "Difficulty lifting"],
  legs:    ["Leg pain", "Swollen legs/feet", "Numbness/tingling", "Joint pain/knee", "Cramps", "Difficulty walking", "Varicose veins"],
  back:    ["Lower back pain", "Upper back pain", "Shooting pain down leg", "Stiffness", "Pain worsening at night", "Muscle spasms"],
  skin:    ["Rash/itching", "Yellowing of skin", "Pallor (pale skin)", "Bruising", "Wounds not healing", "Swelling/puffiness"],
  general: ["High fever (>103°F)", "Low fever (99–102°F)", "Chills/shivering", "Fatigue/exhaustion", "Unexplained weight loss", "Night sweats", "Loss of appetite"],
  throat:  ["Sore throat", "Difficulty swallowing", "Hoarseness", "Swollen lymph nodes", "Dry throat", "Bad breath"],
  urinary: ["Burning urination", "Frequent urination", "Blood in urine", "Difficulty urinating", "Lower abdominal pain"],
}

export const BODY_PARTS = [
  { id: "head",    label: "Head",     labelHi: "सिर",      icon: Brain },
  { id: "eyes",    label: "Eyes",     labelHi: "आंखें",    icon: Eye },
  { id: "ears",    label: "Ears",     labelHi: "कान",     icon: Ear },
  { id: "chest",   label: "Chest",    labelHi: "छाती",    icon: Heart },
  { id: "stomach", label: "Stomach",  labelHi: "पेट",     icon: Droplet },
  { id: "throat",  label: "Throat",   labelHi: "गला",     icon: Wind },
  { id: "back",    label: "Back",     labelHi: "पीठ",     icon: Activity },
  { id: "arms",    label: "Arms",     labelHi: "हाथ",     icon: User },
  { id: "legs",    label: "Legs",     labelHi: "पैर",     icon: User },
  { id: "skin",    label: "Skin",     labelHi: "त्वचा",   icon: Activity },
  { id: "urinary", label: "Urinary",  labelHi: "मूत्र",   icon: Droplet },
  { id: "general", label: "General",  labelHi: "सामान्य", icon: Thermometer },
]

export const SYMPTOM_HI: Record<string, string> = {
  "Severe headache": "तेज सिरदर्द", "Mild headache": "हल्का सिरदर्द", "Dizziness/vertigo": "चक्कर/वर्टिगो",
  "Fainting": "बेहोशी", "Confusion": "भ्रम", "Chest pain": "सीने में दर्द", "Shortness of breath": "सांस की तकलीफ",
  "High fever (>103°F)": "तेज बुखार (>103°F)", "Low fever (99–102°F)": "हल्का बुखार", "Chills/shivering": "ठंड/कंपकंपी",
  "Fatigue/exhaustion": "थकान", "Nausea": "मतली", "Vomiting": "उल्टी", "Diarrhea": "दस्त",
  "Severe abdominal pain": "तेज पेट दर्द", "Mild stomach ache": "हल्का पेट दर्द", "Cough with blood": "खून वाली खांसी",
  "Wheezing": "घर्र-घर्र की आवाज", "Sore throat": "गले में दर्द", "Rash/itching": "दाने/खुजली",
  "Burning urination": "पेशाब में जलन", "Leg pain": "पैर दर्द", "Lower back pain": "कमर दर्द",
  "Unexplained weight loss": "अकारण वजन घटना", "Night sweats": "रात में पसीना",
}

export const URGENCY_STYLES: Record<string, { bg: string; border: string; icon: string; iconClass: string }> = {
  emergency: { bg: "bg-red-50", border: "border-red-400", icon: "🚨", iconClass: "text-red-600" },
  high:      { bg: "bg-orange-50", border: "border-orange-400", icon: "⚠️", iconClass: "text-orange-600" },
  medium:    { bg: "bg-yellow-50", border: "border-yellow-400", icon: "🩺", iconClass: "text-yellow-600" },
  low:       { bg: "bg-green-50", border: "border-green-400", icon: "✅", iconClass: "text-green-600" },
}
