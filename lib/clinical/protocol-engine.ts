/**
 * lib/clinical/protocol-engine.ts
 *
 * Frontline Worker Clinical Decision Support Engine (Ayu-inspired CDSS).
 * Provides offline-executable clinical mindmaps for IMCI, ANC, and NCD triage.
 *
 * Maps clinical findings to standardized LOINC codes and generates bilingual
 * guidance (English & Hindi) for grassroots community health workers (ASHA/ANM).
 *
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Intelligence Subsystem
 */

export type ClinicalUrgency = "EMERGENCY_RED" | "URGENT_YELLOW" | "ROUTINE_GREEN"

export interface StandardizedObservation {
  code: string // LOINC code
  codeSystem: "LOINC" | "SNOMED-CT"
  display: string
  valueNumeric?: number
  valueText?: string
  unit?: string
  interpretation: "normal" | "low" | "high" | "critical"
}

export interface ProtocolTriageResult {
  protocolName: string
  urgency: ClinicalUrgency
  classifications: string[]
  hindiClassifications: string[]
  recommendedActions: string[]
  hindiRecommendedActions: string[]
  requiresImmediateReferral: boolean
  observations: StandardizedObservation[]
}

// -------------------------------------------------------------
// 1. NCD Protocol: Hypertension & Diabetes Staging
// -------------------------------------------------------------

export interface NcdAssessmentInput {
  systolicBp?: number
  diastolicBp?: number
  randomBloodSugar?: number // mg/dL
  fastingBloodSugar?: number // mg/dL
  symptoms?: {
    chestPain?: boolean
    shortnessOfBreath?: boolean
    severeHeadache?: boolean
    confusionOrAlteredMentalState?: boolean
    frequentUrinationOrExcessiveThirst?: boolean
  }
}

export function evaluateNcdProtocol(input: NcdAssessmentInput): ProtocolTriageResult {
  const classifications: string[] = []
  const hindiClassifications: string[] = []
  const recommendedActions: string[] = []
  const hindiRecommendedActions: string[] = []
  const observations: StandardizedObservation[] = []
  let urgency: ClinicalUrgency = "ROUTINE_GREEN"

  const { systolicBp, diastolicBp, randomBloodSugar, fastingBloodSugar, symptoms = {} } = input

  // Blood Pressure Evaluation (LOINC 8480-6 & 8462-4)
  if (systolicBp != null || diastolicBp != null) {
    const sys = systolicBp ?? 120
    const dia = diastolicBp ?? 80

    if (systolicBp != null) {
      observations.push({
        code: "8480-6",
        codeSystem: "LOINC",
        display: "Systolic blood pressure",
        valueNumeric: systolicBp,
        unit: "mmHg",
        interpretation: sys > 140 ? "high" : sys < 90 ? "low" : "normal",
      })
    }

    if (diastolicBp != null) {
      observations.push({
        code: "8462-4",
        codeSystem: "LOINC",
        display: "Diastolic blood pressure",
        valueNumeric: diastolicBp,
        unit: "mmHg",
        interpretation: dia > 90 ? "high" : dia < 60 ? "low" : "normal",
      })
    }

    if (sys >= 180 || dia >= 120) {
      urgency = "EMERGENCY_RED"
      const hasEndOrgan = symptoms.chestPain || symptoms.shortnessOfBreath || symptoms.severeHeadache || symptoms.confusionOrAlteredMentalState
      if (hasEndOrgan) {
        classifications.push("HYPERTENSIVE EMERGENCY (Target Organ Damage Risk)")
        hindiClassifications.push("उच्च रक्तचाप आपातकाल (अंग क्षति का खतरा)")
        recommendedActions.push("Immediate ambulance transfer to CHC/District Hospital; monitor vitals every 10 mins")
        hindiRecommendedActions.push("सीएचसी/जिला अस्पताल के लिए तत्काल एम्बुलेंस ट्रांसफर; हर 10 मिनट में बीपी जांचें")
      } else {
        classifications.push("HYPERTENSIVE CRISIS / SEVERE HYPERTENSION")
        hindiClassifications.push("गंभीर उच्च रक्तचाप (संकट स्तर)")
        recommendedActions.push("Urgent medical consultation within 24 hours; rest in quiet room and recheck")
        hindiRecommendedActions.push("24 घंटे के भीतर तत्काल डॉक्टर परामर्श; शांत कमरे में आराम कराएं और दोबारा जांचें")
      }
    } else if (sys >= 140 || dia >= 90) {
      urgency = "URGENT_YELLOW"
      classifications.push("STAGE 2 HYPERTENSION")
      hindiClassifications.push("स्टेज 2 उच्च रक्तचाप (हाइपरटेंशन)")
      recommendedActions.push("Schedule teleconsultation with medical officer; start sodium reduction & lifestyle counseling")
      hindiRecommendedActions.push("चिकित्सा अधिकारी के साथ टेलीकंसल्टेशन तय करें; नमक कम करने की सलाह दें")
    } else if (sys >= 130 || dia >= 80) {
      if (urgency === "ROUTINE_GREEN") urgency = "URGENT_YELLOW"
      classifications.push("STAGE 1 HYPERTENSION")
      hindiClassifications.push("स्टेज 1 उच्च रक्तचाप")
      recommendedActions.push("Recheck blood pressure in 2 weeks; advise dietary modification and exercise")
      hindiRecommendedActions.push("2 सप्ताह में दोबारा बीपी जांचें; आहार में सुधार और व्यायाम की सलाह दें")
    }
  }

  // Blood Glucose Evaluation (LOINC 2339-0)
  const sugar = randomBloodSugar ?? fastingBloodSugar
  if (sugar != null) {
    observations.push({
      code: "2339-0",
      codeSystem: "LOINC",
      display: randomBloodSugar != null ? "Random blood glucose" : "Fasting blood glucose",
      valueNumeric: sugar,
      unit: "mg/dL",
      interpretation: sugar > 200 ? "high" : sugar < 70 ? "low" : "normal",
    })

    if (sugar < 70) {
      urgency = "EMERGENCY_RED"
      classifications.push("HYPOGLYCEMIA ALERT (Low Blood Sugar)")
      hindiClassifications.push("हाइपोग्लाइसीमिया चेतावनी (रक्त शर्करा की अत्यधिक कमी)")
      recommendedActions.push("Administer 15-20g oral fast-acting glucose (sugar water, fruit juice) immediately; recheck in 15 mins")
      hindiRecommendedActions.push("तुरंत 15-20 ग्राम त्वरित ग्लूकोज (चीनी का घोल या जूस) दें; 15 मिनट बाद दोबारा जांचें")
    } else if (sugar >= 300) {
      if (urgency !== "EMERGENCY_RED") urgency = "URGENT_YELLOW"
      classifications.push("SEVERE HYPERGLYCEMIA (Diabetic Complication Risk)")
      hindiClassifications.push("गंभीर हाइपरग्लाइसीमिया (उच्च रक्त शर्करा)")
      recommendedActions.push("Check hydration and ketone status; refer to Primary Health Centre for urgent insulin evaluation")
      hindiRecommendedActions.push("पानी की मात्रा जांचें; तत्काल इंसुलिन मूल्यांकन के लिए पीएचसी रेफर करें")
    } else if (sugar >= 200) {
      if (urgency === "ROUTINE_GREEN") urgency = "URGENT_YELLOW"
      classifications.push("ELEVATED BLOOD SUGAR / SUSPECTED DIABETES")
      hindiClassifications.push("रक्त शर्करा का उच्च स्तर / संभावित मधुमेह")
      recommendedActions.push("Order fasting plasma glucose & HbA1c; advise diabetic lifestyle management")
      hindiRecommendedActions.push("उपवास रक्त शर्करा (Fasting) और HbA1c जांच कराएं; जीवनशैली प्रबंधन की सलाह दें")
    }
  }

  if (classifications.length === 0) {
    classifications.push("NCD PARAMETERS WITHIN NORMAL LIMITS")
    hindiClassifications.push("सभी एनसीडी पैरामीटर सामान्य सीमा के भीतर हैं")
    recommendedActions.push("Encourage regular physical activity, balanced diet, and annual screening")
    hindiRecommendedActions.push("नियमित शारीरिक गतिविधि, संतुलित आहार और वार्षिक जांच को प्रोत्साहित करें")
  }

  return {
    protocolName: "NCD_HYPERTENSION_DIABETES",
    urgency,
    classifications,
    hindiClassifications,
    recommendedActions,
    hindiRecommendedActions,
    requiresImmediateReferral: urgency === "EMERGENCY_RED",
    observations,
  }
}

// -------------------------------------------------------------
// 2. High-Risk Pregnancy (ANC) Triage Protocol
// -------------------------------------------------------------

export interface AncAssessmentInput {
  gestationalWeeks?: number
  systolicBp?: number
  diastolicBp?: number
  hasVaginalBleeding?: boolean
  hasSevereHeadacheOrBlurredVision?: boolean
  hasSwollenHandsOrFace?: boolean
  hasSevereAbdominalPain?: boolean
  hasReducedFetalMovements?: boolean
  hasHighFever?: boolean
}

export function evaluateAncProtocol(input: AncAssessmentInput): ProtocolTriageResult {
  const classifications: string[] = []
  const hindiClassifications: string[] = []
  const recommendedActions: string[] = []
  const hindiRecommendedActions: string[] = []
  const observations: StandardizedObservation[] = []
  let urgency: ClinicalUrgency = "ROUTINE_GREEN"

  if (input.gestationalWeeks != null) {
    observations.push({
      code: "11884-4",
      codeSystem: "LOINC",
      display: "Gestational age in weeks",
      valueNumeric: input.gestationalWeeks,
      unit: "weeks",
      interpretation: "normal",
    })
  }

  // Pre-eclampsia Danger Signs
  const isHypertensive = (input.systolicBp ?? 0) >= 140 || (input.diastolicBp ?? 0) >= 90
  if (isHypertensive && input.hasSevereHeadacheOrBlurredVision) {
    urgency = "EMERGENCY_RED"
    classifications.push("IMPENDING ECLAMPSIA / SEVERE PRE-ECLAMPSIA")
    hindiClassifications.push("गंभीर प्री-एक्लेम्पसिया / एक्लेम्पसिया का अत्यधिक खतरा")
    recommendedActions.push("Immediate emergency transfer to FRU/District Hospital with Obstetrician; administer Magnesium Sulfate per national protocol")
    hindiRecommendedActions.push("एफआरयू या जिला अस्पताल में तत्काल आपातकालीन रेफरल; राष्ट्रीय प्रोटोकॉल अनुसार मैग्नीशियम सल्फेट दें")
  }

  // Vaginal Bleeding
  if (input.hasVaginalBleeding) {
    urgency = "EMERGENCY_RED"
    classifications.push("ANTEPARTUM / OBSTETRIC HEMORRHAGE RISK")
    hindiClassifications.push("गर्भावस्था में रक्तस्राव (एंटीपार्टम हेमरेज का खतरा)")
    recommendedActions.push("Keep patient in left lateral tilt; DO NOT perform digital pelvic examination; transfer immediately")
    hindiRecommendedActions.push("मरीज़ को बाईं करवट लिटाएं; आंतरिक योनि जांच न करें; तुरंत अस्पताल पहुंचाएं")
  }

  // Reduced Fetal Movements
  if (input.hasReducedFetalMovements && (input.gestationalWeeks ?? 0) >= 28) {
    if (urgency !== "EMERGENCY_RED") urgency = "URGENT_YELLOW"
    classifications.push("DECREASED FETAL MOVEMENTS (Fetal Distress Risk)")
    hindiClassifications.push("गर्भस्थ शिशु की हलचल में कमी (शिशु तनाव का खतरा)")
    recommendedActions.push("Auscultate fetal heart rate (normal 110-160 bpm); arrange urgent ultrasound/NST within 12 hours")
    hindiRecommendedActions.push("भ्रूण की हृदय गति (FHR) जांचें; 12 घंटे के भीतर तत्काल अल्ट्रासाउंड/एनएसटी करवाएं")
  }

  if (classifications.length === 0) {
    classifications.push("ROUTINE ANTENATAL CARE (No Red Flags Detected)")
    hindiClassifications.push("सामान्य प्रसव पूर्व देखभाल (कोई खतरे का संकेत नहीं)")
    recommendedActions.push("Administer IFA tablets, Calcium, Td immunization, and schedule next monthly checkup")
    hindiRecommendedActions.push("आयरन-फॉलिक एसिड गोलियां, कैल्शियम, टीडी का टीका दें और अगली मासिक जांच तय करें")
  }

  return {
    protocolName: "ANC_MATERNAL_HEALTH",
    urgency,
    classifications,
    hindiClassifications,
    recommendedActions,
    hindiRecommendedActions,
    requiresImmediateReferral: urgency === "EMERGENCY_RED",
    observations,
  }
}
