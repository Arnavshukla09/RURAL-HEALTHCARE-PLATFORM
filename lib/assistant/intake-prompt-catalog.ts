import type { AssistantLanguageCode } from "./languages"

const en = { mild: "Mild", moderate: "Moderate", severe: "Severe", gps: "Use my location", district: "Choose district", intakeComplete: "Your symptom information is ready to check." }
export type IntakePromptKey = keyof typeof en
export const INTAKE_PROMPTS: Record<AssistantLanguageCode, Record<IntakePromptKey, string>> = {
  en,
  hi: { mild: "हल्के", moderate: "मध्यम", severe: "गंभीर", gps: "मेरी जगह का उपयोग करें", district: "जिला चुनें", intakeComplete: "आपके लक्षणों की जानकारी जाँच के लिए तैयार है।" },
  mr: { mild: "सौम्य", moderate: "मध्यम", severe: "तीव्र", gps: "माझे स्थान वापरा", district: "जिल्हा निवडा", intakeComplete: "तुमच्या लक्षणांची माहिती तपासणीसाठी तयार आहे." },
  bn: { mild: "হালকা", moderate: "মাঝারি", severe: "গুরুতর", gps: "আমার অবস্থান ব্যবহার করুন", district: "জেলা বাছুন", intakeComplete: "আপনার লক্ষণের তথ্য পরীক্ষা করার জন্য প্রস্তুত।" },
  te: { mild: "తేలిక", moderate: "మధ్యస్థ", severe: "తీవ్ర", gps: "నా స్థానాన్ని వాడండి", district: "జిల్లా ఎంచుకోండి", intakeComplete: "మీ లక్షణాల సమాచారం పరిశీలించడానికి సిద్ధంగా ఉంది." },
  ta: { mild: "லேசான", moderate: "மிதமான", severe: "தீவிரமான", gps: "என் இடத்தைப் பயன்படுத்து", district: "மாவட்டத்தைத் தேர்வு செய்யுங்கள்", intakeComplete: "உங்கள் அறிகுறித் தகவல் பரிசோதனைக்குத் தயாராக உள்ளது." },
  gu: { mild: "હળવા", moderate: "મધ્યમ", severe: "ગંભીર", gps: "મારું સ્થાન વાપરો", district: "જિલ્લો પસંદ કરો", intakeComplete: "તમારા લક્ષણોની માહિતી તપાસ માટે તૈયાર છે." },
  kn: { mild: "ಸೌಮ್ಯ", moderate: "ಮಧ್ಯಮ", severe: "ತೀವ್ರ", gps: "ನನ್ನ ಸ್ಥಳ ಬಳಸಿ", district: "ಜಿಲ್ಲೆ ಆಯ್ಕೆ ಮಾಡಿ", intakeComplete: "ನಿಮ್ಮ ಲಕ್ಷಣಗಳ ಮಾಹಿತಿ ಪರಿಶೀಲನೆಗೆ ಸಿದ್ಧವಾಗಿದೆ." },
  pa: { mild: "ਹਲਕੇ", moderate: "ਦਰਮਿਆਨੇ", severe: "ਗੰਭੀਰ", gps: "ਮੇਰੀ ਥਾਂ ਵਰਤੋ", district: "ਜ਼ਿਲ੍ਹਾ ਚੁਣੋ", intakeComplete: "ਤੁਹਾਡੇ ਲੱਛਣਾਂ ਦੀ ਜਾਣਕਾਰੀ ਜਾਂਚ ਲਈ ਤਿਆਰ ਹੈ।" },
  or: { mild: "ହାଲୁକା", moderate: "ମଧ୍ୟମ", severe: "ଗୁରୁତର", gps: "ମୋ ସ୍ଥାନ ବ୍ୟବହାର କରନ୍ତୁ", district: "ଜିଲ୍ଲା ବାଛନ୍ତୁ", intakeComplete: "ଆପଣଙ୍କ ଲକ୍ଷଣ ସୂଚନା ଯାଞ୍ଚ ପାଇଁ ପ୍ରସ୍ତୁତ।" },
  ml: { mild: "ലഘു", moderate: "മിതം", severe: "ഗുരുതരം", gps: "എന്റെ സ്ഥലം ഉപയോഗിക്കുക", district: "ജില്ല തിരഞ്ഞെടുക്കൂ", intakeComplete: "നിങ്ങളുടെ ലക്ഷണവിവരം പരിശോധിക്കാൻ തയ്യാറായി." },
  as: { mild: "মৃদু", moderate: "মধ্যম", severe: "গুৰুতৰ", gps: "মোৰ স্থান ব্যৱহাৰ কৰক", district: "জিলা বাছক", intakeComplete: "আপোনাৰ লক্ষণৰ তথ্য পৰীক্ষাৰ বাবে সাজু হৈছে।" },
  ur: { mild: "ہلکی", moderate: "درمیانی", severe: "شدید", gps: "میرا مقام استعمال کریں", district: "ضلع چنیں", intakeComplete: "آپ کی علامات کی معلومات جانچ کے لیے تیار ہیں۔" },
}
