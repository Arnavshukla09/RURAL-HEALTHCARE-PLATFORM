/**
 * lib/clinical/imci-anc.ts
 *
 * Clinical Decision Support & Triage Protocols for Community Health Workers (ASHA / ANM).
 *
 * Implements:
 * 1. WHO/UNICEF Integrated Management of Childhood Illness (IMCI)
 *    - Assesses general danger signs (inability to drink/breastfeed, vomiting everything, convulsions, lethargy/unconsciousness).
 *    - Cough / Difficult Breathing (fast breathing threshold based on age, chest indrawing, stridor).
 *    - Diarrhea assessment (dehydration degree: severe, some, none).
 *    - Fever / Malaria risk.
 * 2. High-Risk Pregnancy (ANC) Triage
 *    - Danger signs: severe headache with blurred vision (preeclampsia/eclampsia), vaginal bleeding,
 *      reduced fetal movements, high fever, swollen face/hands.
 *
 * Zero-Cost Architecture:
 * - 100% deterministic, offline-capable pure algorithmic triage engine.
 * - Bilingual output (English & Hindi) for grassroots community health workers.
 */

export type TriageUrgency = "EMERGENCY_RED" | "URGENT_YELLOW" | "ROUTINE_GREEN"

export interface ImciChildAssessment {
  ageMonths: number // 2 months to 5 years
  // General Danger Signs
  cannotDrinkOrBreastfeed: boolean
  vomitsEverything: boolean
  convulsions: boolean
  lethargicOrUnconscious: boolean
  // Respiratory
  hasCoughOrDifficultyBreathing: boolean
  respiratoryRate?: number // breaths per minute
  chestIndrawing?: boolean
  stridorWhenCalm?: boolean
  // Diarrhea
  hasDiarrhea: boolean
  diarrheaDays?: number
  bloodInStool?: boolean
  sunkenEyes?: boolean
  drinkingEagerlyOrThirsty?: boolean
  // Fever
  hasFever: boolean
  feverDays?: number
  stiffNeck?: boolean
}

export interface ImciTriageResult {
  urgency: TriageUrgency
  classifications: string[]
  hindiClassifications: string[]
  recommendedActions: string[]
  hindiRecommendedActions: string[]
  requiresImmediateReferral: boolean
}

export function evaluateImci(data: ImciChildAssessment): ImciTriageResult {
  const classifications: string[] = []
  const hindiClassifications: string[] = []
  const recommendedActions: string[] = []
  const hindiRecommendedActions: string[] = []
  let urgency: TriageUrgency = "ROUTINE_GREEN"

  // 1. General Danger Signs (Tier 0 Referral)
  const hasGeneralDangerSign =
    data.cannotDrinkOrBreastfeed || data.vomitsEverything || data.convulsions || data.lethargicOrUnconscious

  if (hasGeneralDangerSign) {
    urgency = "EMERGENCY_RED"
    classifications.push("VERY SEVERE DISEASE / GENERAL DANGER SIGN PRESENT")
    hindiClassifications.push("अत्यधिक गंभीर बीमारी / सामान्य खतरे के संकेत उपस्थित")
    recommendedActions.push("Urgent referral to CHC / District Hospital with pediatric care")
    hindiRecommendedActions.push("सीएचसी या जिला अस्पताल में तत्काल आपातकालीन रेफरल")
    if (data.convulsions) {
      recommendedActions.push("Keep airway clear, do not put anything in mouth, position on side")
      hindiRecommendedActions.push("हवा का रास्ता खुला रखें, मुंह में कुछ न डालें, करवट लेकर लिटाएं")
    }
  }

  // 2. Cough / Difficult Breathing
  if (data.hasCoughOrDifficultyBreathing) {
    const fastBreathingThreshold = data.ageMonths < 12 ? 50 : 40
    const isFastBreathing = data.respiratoryRate ? data.respiratoryRate >= fastBreathingThreshold : false

    if (data.chestIndrawing || data.stridorWhenCalm) {
      urgency = "EMERGENCY_RED"
      classifications.push("SEVERE PNEUMONIA OR VERY SEVERE DISEASE")
      hindiClassifications.push("गंभीर निमोनिया / अति गंभीर रोग (सीने में गड्ढे या सांस की घरघराहट)")
      recommendedActions.push("Give first dose of appropriate oral antibiotic if available and refer urgently")
      hindiRecommendedActions.push("उपलब्ध होने पर एंटीबायोटिक की पहली खुराक दें और तुरंत रेफर करें")
    } else if (isFastBreathing) {
      if (urgency !== "EMERGENCY_RED") urgency = "URGENT_YELLOW"
      classifications.push("PNEUMONIA (Fast breathing)")
      hindiClassifications.push("निमोनिया (तेज़ सांस चलना)")
      recommendedActions.push("Prescribe appropriate oral antibiotic (Amoxicillin) per national protocol. Home care advice.")
      hindiRecommendedActions.push("राष्ट्रीय प्रोटोकॉल अनुसार ओरल एमोक्सिसिलिन दें और घरेलू देखभाल की सलाह दें")
    } else {
      classifications.push("NO PNEUMONIA: COUGH OR COLD")
      hindiClassifications.push("निमोनिया नहीं: सामान्य खांसी या सर्दी")
      recommendedActions.push("Soothe throat and relieve cough with warm fluids. Advise when to return immediately.")
      hindiRecommendedActions.push("गर्म पेय से गले को आराम दें। खतरे के लक्षणों पर तुरंत लौटने की सलाह दें।")
    }
  }

  // 3. Diarrhea Assessment
  if (data.hasDiarrhea) {
    if (data.sunkenEyes && data.lethargicOrUnconscious) {
      urgency = "EMERGENCY_RED"
      classifications.push("SEVERE DEHYDRATION")
      hindiClassifications.push("अति गंभीर निर्जलीकरण (गंभीर पानी की कमी)")
      recommendedActions.push("Start IV fluids immediately or refer urgently if IV setup not available. Give ORS on the way.")
      hindiRecommendedActions.push("तत्काल आईवी ड्रिप शुरू करें या तुरंत रेफर करें। रास्ते में ओआरएस देते रहें।")
    } else if (data.drinkingEagerlyOrThirsty || data.sunkenEyes) {
      if (urgency !== "EMERGENCY_RED") urgency = "URGENT_YELLOW"
      classifications.push("SOME DEHYDRATION")
      hindiClassifications.push("मध्यम निर्जलीकरण (पानी की कमी)")
      recommendedActions.push("Administer ORS Plan B (75 ml/kg over 4 hours) + Zinc supplementation for 14 days.")
      hindiRecommendedActions.push("ओआरएस प्लान बी (4 घंटे में ओआरएस) + 14 दिनों तक जिंक की गोलियां दें।")
    } else {
      classifications.push("NO DEHYDRATION")
      hindiClassifications.push("निर्जलीकरण नहीं")
      recommendedActions.push("Administer extra fluids (ORS Plan A) and Zinc 20mg for 14 days. Continued feeding.")
      hindiRecommendedActions.push("अतिरिक्त तरल पदार्थ (ओआरएस) और 14 दिनों तक जिंक दें। खानपान जारी रखें।")
    }

    if (data.bloodInStool) {
      if (urgency !== "EMERGENCY_RED") urgency = "URGENT_YELLOW"
      classifications.push("DYSENTERY")
      hindiClassifications.push("पेचिश (मल में खून)")
      recommendedActions.push("Treat with recommended antibiotic for Shigella dysentery.")
      hindiRecommendedActions.push("पेचिश हेतु निर्धारित एंटीबायोटिक से उपचार करें।")
    }
  }

  // 4. Fever Assessment
  if (data.hasFever) {
    if (data.stiffNeck || hasGeneralDangerSign) {
      urgency = "EMERGENCY_RED"
      classifications.push("VERY SEVERE FEBRILE DISEASE / SUSPECTED MENINGITIS")
      hindiClassifications.push("अति गंभीर बुखार / मस्तिष्क ज्वर (गर्दन में अकड़न)")
      recommendedActions.push("Urgent hospital referral with pre-referral medication.")
      hindiRecommendedActions.push("रेफरल पूर्व दवा देकर तुरंत अस्पताल रेफर करें।")
    } else if (data.feverDays && data.feverDays >= 7) {
      if (urgency !== "EMERGENCY_RED") urgency = "URGENT_YELLOW"
      classifications.push("PROLONGED FEVER (> 7 DAYS)")
      hindiClassifications.push("लंबे समय से बुखार (7 दिन से अधिक)")
      recommendedActions.push("Refer for laboratory investigation (Malaria, Typhoid, Dengue).")
      hindiRecommendedActions.push("रक्त जांच (मलेरिया, टाइफाइड, डेंगू) हेतु रेफर करें।")
    }
  }

  return {
    urgency,
    classifications,
    hindiClassifications,
    recommendedActions,
    hindiRecommendedActions,
    requiresImmediateReferral: urgency === "EMERGENCY_RED",
  }
}

export interface AncMaternalAssessment {
  gestationalWeeks: number
  // Critical Maternal Danger Signs
  vaginalBleeding: boolean
  severeHeadacheWithBlurredVision: boolean // Preeclampsia / Eclampsia sign
  swellingFaceAndHands: boolean
  highFever: boolean
  foulSmellingDischarge: boolean
  reducedFetalMovements: boolean // After 24 weeks
  systolicBp?: number
  diastolicBp?: number
  hemoglobinGdl?: number
}

export interface AncTriageResult {
  urgency: TriageUrgency
  highRiskCategory: string[]
  hindiHighRiskCategory: string[]
  recommendations: string[]
  hindiRecommendations: string[]
  requiresImmediateHospitalization: boolean
}

export function evaluateAncMaternalRisk(data: AncMaternalAssessment): AncTriageResult {
  const highRiskCategory: string[] = []
  const hindiHighRiskCategory: string[] = []
  const recommendations: string[] = []
  const hindiRecommendations: string[] = []
  let urgency: TriageUrgency = "ROUTINE_GREEN"

  // 1. Severe Obstetric Emergencies
  if (data.vaginalBleeding) {
    urgency = "EMERGENCY_RED"
    highRiskCategory.push("ANTEPARTUM / POSTPARTUM HEMORRHAGE RISK")
    hindiHighRiskCategory.push("गर्भावस्था में रक्तस्राव का गंभीर खतरा (एंटीपार्टम हेमरेज)")
    recommendations.push("Immediate emergency transport to First Referral Unit (FRU) / CHC. Keep patient warm.")
    hindiRecommendations.push("फर्स्ट रेफरल यूनिट (FRU) या सीएचसी के लिए तत्काल 108 एम्बुलेंस बुलाएं।")
  }

  const isSevereHypertension =
    (data.systolicBp && data.systolicBp >= 160) || (data.diastolicBp && data.diastolicBp >= 110)

  if (data.severeHeadacheWithBlurredVision || isSevereHypertension) {
    urgency = "EMERGENCY_RED"
    highRiskCategory.push("IMPENDING ECLAMPSIA / SEVERE PREECLAMPSIA")
    hindiHighRiskCategory.push("एक्लेम्पसिया / गंभीर प्री-एक्लेम्पसिया (तेज सिरदर्द, धुंधला दिखना, उच्च रक्तचाप)")
    recommendations.push("Immediate referral to FRU. Administer loading dose of Magnesium Sulfate (MgSO4) if trained.")
    hindiRecommendations.push("तुरंत एफआरयू रेफर करें। प्रशिक्षित होने पर मैग्नीशियम सल्फेट (MgSO4) की लोडिंग डोज दें।")
  }

  if (data.reducedFetalMovements && data.gestationalWeeks >= 24) {
    if (urgency !== "EMERGENCY_RED") urgency = "URGENT_YELLOW"
    highRiskCategory.push("DECREASED FETAL MOVEMENT (FETAL DISTRESS RISK)")
    hindiHighRiskCategory.push("गर्भस्थ शिशु की हलचल में कमी (शिशु संकट का खतरा)")
    recommendations.push("Refer for immediate Non-Stress Test (NST) and ultrasound monitoring.")
    hindiRecommendations.push("तत्काल सोनोग्राफी और गैर-तनाव परीक्षण (एनएसटी) हेतु रेफर करें।")
  }

  // 2. Severe Anemia screening
  if (data.hemoglobinGdl !== undefined) {
    if (data.hemoglobinGdl < 7.0) {
      if (urgency !== "EMERGENCY_RED") urgency = "URGENT_YELLOW"
      highRiskCategory.push("SEVERE ANEMIA (Hb < 7 g/dL)")
      hindiHighRiskCategory.push("गंभीर एनीमिया (हीमोग्लोबिन 7 g/dL से कम)")
      recommendations.push("Refer to District Hospital for IV Iron Sucrose or blood transfusion evaluation.")
      hindiRecommendations.push("आईवी आयरन या रक्त संचार मूल्यांकन हेतु जिला अस्पताल रेफर करें।")
    } else if (data.hemoglobinGdl < 11.0) {
      highRiskCategory.push("MODERATE ANEMIA")
      hindiHighRiskCategory.push("मध्यम एनीमिया")
      recommendations.push("Prescribe daily Iron & Folic Acid (IFA) tablets and dietary counseling.")
      hindiRecommendations.push("दैनिक आयरन एवं फोलिक एसिड (आईएफए) की 2 गोलियां और पौष्टिक आहार की सलाह दें।")
    }
  }

  return {
    urgency,
    highRiskCategory,
    hindiHighRiskCategory,
    recommendations,
    hindiRecommendations,
    requiresImmediateHospitalization: urgency === "EMERGENCY_RED",
  }
}
