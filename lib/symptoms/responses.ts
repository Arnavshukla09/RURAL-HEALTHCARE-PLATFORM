/**
 * lib/symptoms/responses.ts
 *
 * Modular clinical response fragments and dangerous combination overrides.
 */

export interface SymptomResponsePart {
  immediateActionsEn: string[]
  immediateActionsHi: string[]
  homeCareEn: string[]
  homeCareHi: string[]
  specialistEn: string
  specialistHi: string
}

export const SYMPTOM_PARTS: Record<string, SymptomResponsePart> = {
  fever: {
    immediateActionsEn: ["Rest in a well-ventilated room", "Apply room-temperature damp cloth sponging to forehead"],
    immediateActionsHi: ["हवादार कमरे में आराम करें", "माथे पर सामान्य पानी की ठंडी पट्टी रखें"],
    homeCareEn: ["Drink clean boiled water and oral fluids regularly", "Wear loose, comfortable cotton clothing"],
    homeCareHi: ["उबला पानी और तरल पदार्थ लगातार पिएं", "हल्के सूती कपड़े पहनें"],
    specialistEn: "General Physician / Medical Officer",
    specialistHi: "सामान्य चिकित्सक (Medical Officer)",
  },
  diarrhea: {
    immediateActionsEn: ["Start ORS (Oral Rehydration Solution) immediately", "Avoid spicy, fried, and oily meals"],
    immediateActionsHi: ["तुरंत ओआरएस (ORS) घोल पीना शुरू करें", "तीखा, तला और मसालेदार भोजन न खाएं"],
    homeCareEn: ["Eat soft moong dal khichdi, bananas, and curd", "Drink clean boiled water"],
    homeCareHi: ["मूंग दाल की पतली खिचड़ी, केला और ताजा दही खाएं", "उबला हुआ स्वच्छ पानी पिएं"],
    specialistEn: "General Physician / Medical Officer",
    specialistHi: "सामान्य चिकित्सक",
  },
  vomiting: {
    immediateActionsEn: ["Sip small amounts of water or ORS every 5–10 minutes", "Avoid gulping liquids or eating heavy meals"],
    immediateActionsHi: ["हर 5-10 मिनट में 1-2 घूंट पानी या ORS पिएं", "एक साथ ज्यादा पानी न पिएं और भारी भोजन न करें"],
    homeCareEn: ["Sip ginger or fennel seed (saunf) warm water", "Keep head elevated and rest"],
    homeCareHi: ["सौंफ या अदरक का गुनगुना पानी पिएं", "सिर ऊंचा रखकर आराम करें"],
    specialistEn: "General Physician / Medical Officer",
    specialistHi: "सामान्य चिकित्सक",
  },
  constipation: {
    immediateActionsEn: ["Drink 2–3 glasses of warm water", "Eat fiber-rich foods like cooked vegetables and papaya"],
    immediateActionsHi: ["2-3 गिलास गुनगुना पानी पिएं", "पपीता, हरी सब्जियां और फाइबर युक्त भोजन लें"],
    homeCareEn: ["Walk lightly and avoid long sitting", "Avoid oily, refined flour (maida) foods"],
    homeCareHi: ["हल्का टहलें और लंबे समय तक एक जगह न बैठें", "मैदा और तली-भुनी चीजों से बचें"],
    specialistEn: "General Physician / Medical Officer",
    specialistHi: "सामान्य चिकित्सक",
  },
  stomachAche: {
    immediateActionsEn: ["Eat light, warm, bland food like khichdi", "Avoid oily, spicy, and acidic foods"],
    immediateActionsHi: ["हल्की मूंग दाल की खिचड़ी खाएं", "तीखे, खट्टे और तले हुए भोजन से बचें"],
    homeCareEn: ["Sip warm water and avoid heavy meals", "Rest comfortably and do not press on stomach"],
    homeCareHi: ["गुनगुना पानी पिएं और हल्का भोजन लें", "आराम करें और पेट पर दबाव न डालें"],
    specialistEn: "General Physician / Medical Officer",
    specialistHi: "सामान्य चिकित्सक",
  },
  headache: {
    immediateActionsEn: ["Rest in a quiet, darkened area away from bright screens", "Hydrate with 2 glasses of water"],
    immediateActionsHi: ["स्क्रीन से दूर शांत, अंधेरे कमरे में आराम करें", "पर्याप्त पानी पिएं"],
    homeCareEn: ["Gentle temple and neck massage", "Avoid missing regular meals"],
    homeCareHi: ["माथे और गर्दन की हल्की मालिश करें", "समय पर भोजन लें"],
    specialistEn: "General Physician",
    specialistHi: "सामान्य चिकित्सक",
  },
  cough: {
    immediateActionsEn: ["Drink warm water or tulsi/ginger tea", "Take steam inhalation for 5–10 minutes"],
    immediateActionsHi: ["गुनगुना पानी या अदरक-तुलसी का काढ़ा पिएं", "दिन में 2 बार भाप लें"],
    homeCareEn: ["Rest voice and avoid cold drinks", "Keep sleeping area free of dust and smoke"],
    homeCareHi: ["ठंडी चीजों से बचें", "कमरे को धूल और धुएं से मुक्त रखें"],
    specialistEn: "Medical Officer / Chest Physician",
    specialistHi: "चिकित्सा अधिकारी",
  },
  general: {
    immediateActionsEn: ["Take adequate bed rest", "Monitor temperature and symptoms every 4–6 hours"],
    immediateActionsHi: ["पर्याप्त आराम करें", "हर 4-6 घंटे में तापमान और लक्षणों की जांच करें"],
    homeCareEn: ["Consume warm, light, freshly prepared home meals", "Stay hydrated"],
    homeCareHi: ["ताजा, हल्का और सुपाच्य भोजन लें", "भरपूर पानी पिएं"],
    specialistEn: "Primary Health Centre (PHC) Doctor",
    specialistHi: "प्राथमिक स्वास्थ्य केंद्र (PHC) डॉक्टर",
  },
}

export const COMBINATION_OVERRIDES: Record<
  string,
  { urgency: "high" | "emergency"; warningEn: string; warningHi: string; actionEn: string; actionHi: string }
> = {
  "chest-pain+shortness-of-breath": {
    urgency: "emergency",
    warningEn: "Chest pain combined with breathlessness strongly indicates acute cardiac or pulmonary distress.",
    warningHi: "सीने में दर्द के साथ सांस फूलना गंभीर हृदय या फेफड़ों की समस्या का संकेत है।",
    actionEn: "Call 108 Ambulance immediately. Do not exert the patient.",
    actionHi: "तुरंत 108 पर कॉल करें। मरीज को बिल्कुल न चलाएं।",
  },
  "fever+chills-shivering": {
    urgency: "high",
    warningEn: "High fever accompanied by shivering suggests potential Vector-Borne Infection (Malaria/Dengue).",
    warningHi: "ठंड और कंपकंपी के साथ बुखार मलेरिया या डेंगू का संकेत हो सकता है।",
    actionEn: "Visit your nearest PHC for a free blood smear / Rapid Diagnostic Test (RDT) today.",
    actionHi: "आज ही नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC) जाकर मुफ्त मलेरिया जांच कराएं।",
  },
  "diarrhea+vomiting": {
    urgency: "high",
    warningEn: "Combined loose motions and vomiting carries a high risk of rapid clinical dehydration.",
    warningHi: "दस्त और उल्टी एक साथ होना गंभीर डिहाइड्रेशन (पानी की कमी) का खतरा पैदा करता है।",
    actionEn: "Administer 1 glass of ORS after every bowel movement. If unable to retain liquids, visit a PHC.",
    actionHi: "हर बार दस्त या उल्टी के बाद ORS पिएं। पानी न रुकने पर तुरंत स्वास्थ्य केंद्र जाएं।",
  },
}
