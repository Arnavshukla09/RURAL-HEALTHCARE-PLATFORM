/**
 * lib/offline/offline-ai.ts
 *
 * Offline-first medical FAQ engine.
 * Works 100% without internet — no API needed.
 *
 * Architecture:
 *   1. Static knowledge base (this file) — instant lookup, 0ms, 0 API
 *   2. Learned query cache (query-learner.ts) — grows from user sessions
 *   3. Gemini fallback — only when online AND no cached answer found
 */

export interface OfflineAnswer {
  answer: string
  answerHi: string
  category: string
  confidence: 'high' | 'medium'
  emergency?: boolean
  referTo?: string  // "PHC" | "ASHA" | "108" | "District Hospital"
}

// ── Core Medical FAQ ────────────────────────────────────────────────────────────
// Curated from NHP (nhp.gov.in), WHO India, MOHFW guidelines — all public domain

export const MEDICAL_FAQ: Record<string, OfflineAnswer> = {

  // Emergency triggers
  'chest pain': {
    answer: 'Chest pain can be serious. Stop all activity and sit down immediately. If pain radiates to left arm or jaw, call 108 now. Do not eat or drink. If previously prescribed by a doctor, chew an aspirin. Otherwise do not self-medicate.',
    answerHi: 'सीने का दर्द गंभीर हो सकता है। तुरंत बैठ जाएं और 108 पर कॉल करें। यदि डॉक्टर ने पहले एस्पिरिन बताई हो तो ही लें, खुद से दवा न लें।',
    category: 'emergency', confidence: 'high', emergency: true, referTo: '108'
  },
  'shortness of breath': {
    answer: 'Severe difficulty breathing is an emergency. Call 108. Sit upright, loosen tight clothing. If you have an inhaler (for asthma), use it. Do not lie flat.',
    answerHi: 'सांस लेने में बहुत तकलीफ हो तो 108 पर तुरंत कॉल करें। सीधे बैठें, कपड़े ढीले करें।',
    category: 'emergency', confidence: 'high', emergency: true, referTo: '108'
  },
  'unconscious': {
    answer: 'Person is unconscious: Call 108 immediately. Check breathing — if not breathing, begin CPR (30 chest compressions + 2 breaths). Do not give water or food. Lay them on their side to prevent choking.',
    answerHi: 'व्यक्ति बेहोश हो तो 108 पर कॉल करें। सांस की जांच करें। पानी या खाना न दें। करवट लिटाएं।',
    category: 'emergency', confidence: 'high', emergency: true, referTo: '108'
  },

  // Fever
  'fever': {
    answer: 'For fever (99–102°F): Rest, drink plenty of water and ORS. Take paracetamol (500mg for adults). Use a wet cloth on forehead. Visit PHC if fever > 103°F, lasts more than 3 days, or has chills and sweating (could be malaria).',
    answerHi: 'बुखार (99–102°F) के लिए: आराम करें, पानी और ORS पिएं। पैरासिटामोल लें। माथे पर गीला कपड़ा रखें। बुखार 103°F से अधिक हो या 3 दिन से ज्यादा हो तो PHC जाएं।',
    category: 'common', confidence: 'high', referTo: 'PHC'
  },
  'high fever': {
    answer: 'High fever (> 103°F): This is serious. Visit your nearest PHC or hospital today. Take paracetamol to bring fever down temporarily. Drink fluids constantly. If fever comes with shivering and sweating, test for malaria immediately.',
    answerHi: 'तेज बुखार (103°F से अधिक): आज ही PHC या अस्पताल जाएं। पैरासिटामोल लें। ठंड के साथ बुखार हो तो मलेरिया की जांच कराएं।',
    category: 'urgent', confidence: 'high', referTo: 'PHC'
  },

  // Headache
  'headache': {
    answer: 'For a mild to moderate headache: Rest in a quiet, dark room, stay well hydrated with water, and gently massage your temples or neck. Over-the-counter paracetamol (500mg) can help. If headache is sudden and unusually severe ("thunderclap"), accompanied by neck stiffness, vision loss, vomiting, or weakness on one side, visit an emergency clinic or call 108 immediately.',
    answerHi: 'हल्के से मध्यम सिरदर्द के लिए: शांत और अंधेरे कमरे में आराम करें, पर्याप्त पानी पिएं। पैरासिटामोल (500mg) ले सकते हैं। यदि सिरदर्द अचानक और बहुत तीव्र हो, गर्दन में अकड़न हो या उल्टी आए, तो तुरंत अस्पताल जाएं या 108 पर कॉल करें।',
    category: 'common', confidence: 'high', referTo: 'PHC'
  },
  'cough': {
    answer: 'For common cough and throat irritation: Drink warm water, herbal tea (tulsi/ginger), or honey with warm water. Steam inhalation helps loosen congestion. If cough lasts more than 2 weeks, has blood, or comes with night sweats and weight loss, visit a PHC for a free Sputum Test to screen for TB.',
    answerHi: 'सामान्य खांसी और गले में खराश के लिए: गुनगुना पानी, तुलसी/अदरक की चाय या शहद का सेवन करें। भाप लें। यदि खांसी 2 सप्ताह से अधिक रहे या खून आए, तो टीबी की मुफ्त जांच के लिए तुरंत PHC जाएं।',
    category: 'common', confidence: 'high', referTo: 'PHC'
  },
  'cold': {
    answer: 'For a common cold: Rest, drink warm fluids, and take steam inhalation 2-3 times daily. Paracetamol helps relieve body aches and mild fever. Most viral colds improve within 5-7 days. Consult a PHC if breathing becomes difficult or fever exceeds 102°F.',
    answerHi: 'सर्दी-जुकाम के लिए: आराम करें, गर्म तरल पदार्थ पिएं और दिन में 2-3 बार भाप लें। बदन दर्द के लिए पैरासिटामोल ले सकते हैं। 5-7 दिनों में यह ठीक हो जाता है। यदि सांस लेने में कठिनाई हो तो PHC जाएं।',
    category: 'common', confidence: 'high', referTo: 'PHC'
  },
  'malaria': {
    answer: 'Malaria symptoms: Fever with chills and sweating, headache, body ache, coming in cycles every 1-3 days. Go to PHC for a free Rapid Diagnostic Test (RDT). Treatment (ACT medicine) is free at all government facilities. Spray your home and sleep under a mosquito net.',
    answerHi: 'मलेरिया के लक्षण: ठंड और पसीने के साथ बुखार, सिरदर्द, हर 1-3 दिन में आना। PHC में मुफ्त RDT जांच कराएं। सरकारी अस्पताल में दवाई मुफ्त मिलती है।',
    category: 'disease', confidence: 'high', referTo: 'PHC'
  },

  // Dengue
  'dengue': {
    answer: 'Dengue symptoms: High fever, severe headache, pain behind eyes, joint and muscle pain, rash. No specific medicine — rest, fluids, paracetamol only. Do NOT take ibuprofen or aspirin (causes bleeding). Go to hospital if fever does not reduce or you see bleeding gums/rash.',
    answerHi: 'डेंगू: तेज बुखार, सिरदर्द, आंखों के पीछे दर्द, जोड़ों में दर्द। पैरासिटामोल लें, Aspirin न लें। खूब पानी पिएं। ब्लीडिंग हो तो तुरंत अस्पताल जाएं।',
    category: 'disease', confidence: 'high', referTo: 'District Hospital'
  },

  // TB / Tuberculosis
  'tuberculosis': {
    answer: 'TB symptoms: Cough for more than 2 weeks, blood in cough, night sweats, weight loss, low fever. TB is fully curable with 6 months of free medicine (DOTS programme) at any government hospital or PHC. Early treatment prevents spread. Do not stop medicine even if you feel better.',
    answerHi: 'TB के लक्षण: 2 हफ्ते से ज्यादा खांसी, रात में पसीना, वजन घटना। सरकारी अस्पताल में मुफ्त इलाज मिलता है। दवाई पूरी लें, बीच में न छोड़ें।',
    category: 'disease', confidence: 'high', referTo: 'PHC'
  },

  // Typhoid
  'typhoid': {
    answer: 'Typhoid symptoms: Continuous fever for many days, headache, stomach pain, loss of appetite, weakness. Get a Widal test at any lab or PHC. Drink only boiled or filtered water. Eat clean, light food. Take antibiotics as prescribed by doctor.',
    answerHi: 'टाइफाइड: कई दिनों तक लगातार बुखार, पेट दर्द, भूख न लगना। Widal जांच कराएं। उबला पानी पिएं। डॉक्टर द्वारा बताई गई एंटीबायोटिक लें।',
    category: 'disease', confidence: 'high', referTo: 'PHC'
  },

  // Diarrhea / ORS
  'diarrhea': {
    answer: 'For diarrhea: Drink ORS (Oral Rehydration Solution) — available free at PHC or make at home: 1 litre boiled water + 6 teaspoons sugar + 1/2 teaspoon salt. Eat khichdi, banana, curd. Avoid oily or spicy food. Go to hospital if there is blood in stool, or child is not passing urine for 6+ hours (dangerous dehydration).',
    answerHi: 'दस्त के लिए: ORS पिएं (PHC पर मुफ्त)। घर पर बनाएं: 1L उबला पानी + 6 चम्मच चीनी + आधा चम्मच नमक। खिचड़ी, केला खाएं। मल में खून हो तो अस्पताल जाएं।',
    category: 'common', confidence: 'high', referTo: 'PHC'
  },
  'loose motion': {
    answer: 'For loose motion: Drink ORS. Make at home: 1 litre boiled water + 6 teaspoons sugar + half teaspoon salt. Eat light food. Avoid oil and spice. Go to PHC if child is not urinating or has sunken eyes.',
    answerHi: 'दस्त के लिए ORS पिएं। हल्का खाना खाएं। बच्चे को पेशाब न हो या आंखें धंसी हों तो PHC जाएं।',
    category: 'common', confidence: 'high', referTo: 'PHC'
  },

  // Maternal health
  'pregnancy': {
    answer: 'During pregnancy: Register at PHC/ANM for free ANC checkups. Take iron and folic acid tablets daily (free at government centres). Eat nutritious food. Get 4 ANC checkups minimum. Deliver at government hospital for free delivery (JSSK scheme) and cash incentive (JSY scheme).',
    answerHi: 'गर्भावस्था: PHC/ANM पर रजिस्टर करें। आयरन-फोलिक एसिड की गोलियां रोज लें (मुफ्त)। 4 ANC जांच जरूरी। सरकारी अस्पताल में प्रसव पर JSSK योजना में मुफ्त इलाज मिलता है।',
    category: 'maternal', confidence: 'high', referTo: 'PHC'
  },
  'delivery': {
    answer: 'Under the JSSK scheme, delivery at government hospitals is completely free including C-section, medicines, food, and transport. Under JSY scheme, rural mothers get Rs 1400 cash after institutional delivery. Contact your ASHA worker for help reaching the hospital.',
    answerHi: 'JSSK योजना में सरकारी अस्पताल में प्रसव मुफ्त है — ऑपरेशन, दवाई, खाना, और गाड़ी सब मुफ्त। JSY में ग्रामीण महिला को 1400 रुपये मिलते हैं। ASHA कार्यकर्ता से संपर्क करें।',
    category: 'maternal', confidence: 'high', referTo: 'ASHA'
  },

  // Child health
  'child vaccination': {
    answer: 'India\'s free vaccination schedule: BCG at birth, OPV at 6/10/14 weeks, Pentavalent vaccine, Measles at 9 months, Vitamin A at 9 months. All free at government centres. Get your child\'s health card at birth. Missing vaccines can be given later (catch-up schedule).',
    answerHi: 'टीकाकरण: जन्म पर BCG, 6/10/14 हफ्ते पर OPV, 9 महीने में खसरा और विटामिन A। सब सरकारी केंद्र में मुफ्त। स्वास्थ्य कार्ड बनवाएं।',
    category: 'child', confidence: 'high', referTo: 'PHC'
  },
  'malnutrition': {
    answer: 'Child malnutrition: Look for signs — very thin arms, swollen feet, pale inside eyelids. Take to ASHA or Anganwadi for free nutrition supplements (Poshan). NRC (Nutrition Rehabilitation Centres) at district hospitals treat severe malnutrition free of cost.',
    answerHi: 'कुपोषण: बच्चे के हाथ बहुत पतले हों, पैर सूजे हों, आंखें पीली हों तो ASHA/आंगनवाड़ी ले जाएं। जिला अस्पताल में NRC में मुफ्त इलाज मिलता है।',
    category: 'child', confidence: 'high', referTo: 'ASHA'
  },

  // Government schemes
  'jssk': {
    answer: 'JSSK (Janani Shishu Suraksha Karyakram): Free benefits for pregnant women at government hospitals — free delivery, C-section, medicines, blood, diagnostics, diet, and free transport. No payment at all. Valid across India.',
    answerHi: 'JSSK योजना: सरकारी अस्पताल में प्रसव बिल्कुल मुफ्त। दवाई, खून, खाना, जांच, गाड़ी — सब मुफ्त। कोई पैसा नहीं देना।',
    category: 'scheme', confidence: 'high'
  },
  'ayushman bharat': {
    answer: 'Ayushman Bharat (PM-JAY): Provides Rs 5 lakh per family per year for hospital treatment. Covers 1500+ diseases including surgeries, cancer, heart disease. Check eligibility at mera.pmjay.gov.in or call 14555. BPL and SECC families are automatically eligible.',
    answerHi: 'आयुष्मान भारत: प्रति परिवार 5 लाख रुपये तक का मुफ्त इलाज। कैंसर, हार्ट, सर्जरी सब शामिल। पात्रता जानें: 14555 पर कॉल करें।',
    category: 'scheme', confidence: 'high'
  },
  'jan aushadhi': {
    answer: 'Jan Aushadhi stores sell generic medicines at 50-90% less than branded prices. Find your nearest store at janaushadhi.gov.in or app. Available in most district towns. Same quality as expensive brands — manufactured under government supervision.',
    answerHi: 'जन औषधि स्टोर पर दवाइयां 50-90% सस्ती मिलती हैं। गुणवत्ता वही है। निकटतम स्टोर: janaushadhi.gov.in पर देखें।',
    category: 'scheme', confidence: 'high'
  },

  // First Aid
  'snake bite': {
    answer: 'Snake bite: CRITICAL EMERGENCY. Call 108 immediately. Keep the person still — movement spreads venom faster. Keep bitten limb below heart level. Remove rings/tight clothing near bite. Do NOT cut/suck the wound, apply tourniquet, or give traditional remedies. Anti-venom is free at district hospitals.',
    answerHi: 'सांप काटे: 108 तुरंत कॉल करें। व्यक्ति को हिलने-डुलने न दें। काटी जगह को दिल से नीचे रखें। जहर चूसने की कोशिश न करें। जिला अस्पताल में एंटी-वेनम मुफ्त है।',
    category: 'emergency', confidence: 'high', emergency: true, referTo: '108'
  },
  'burn': {
    answer: 'For burns: Immediately cool the burn under running cold water for 10-20 minutes. Do NOT use ice, butter, or toothpaste. Cover loosely with clean cloth. Do not break blisters. For burns larger than the palm, face burns, or deep burns — go to hospital immediately.',
    answerHi: 'जलने पर: 10-20 मिनट तक ठंडे पानी से धोएं। बर्फ, मक्खन या टूथपेस्ट न लगाएं। साफ कपड़े से ढकें। बड़ा जला हो तो अस्पताल जाएं।',
    category: 'firstaid', confidence: 'high'
  },

  // Mental health
  'depression': {
    answer: 'Depression is a real illness, not weakness. Symptoms: persistent sadness, loss of interest, disturbed sleep, feeling hopeless. Talk to a trusted person. Government mental health helpline: iCall 9152987821 (free, counselling in Hindi/English). PHCs now have a doctor for mental health.',
    answerHi: 'अवसाद असली बीमारी है। लक्षण: उदासी, नींद न आना, कुछ अच्छा न लगना। किसी से बात करें। सरकारी हेल्पलाइन: iCall 9152987821 (हिंदी में मुफ्त)।',
    category: 'mental', confidence: 'medium', referTo: 'PHC'
  },

  // Hotlines
  '108': {
    answer: '108 is the free national emergency ambulance number. Available 24/7 across India. Covers medical emergencies, accidents, trauma, maternity. The ambulance comes to you — completely free. Call 108 for any life-threatening emergency.',
    answerHi: '108 मुफ्त राष्ट्रीय एम्बुलेंस सेवा है। 24 घंटे, 7 दिन। जानलेवा स्थिति में 108 पर कॉल करें — पूरी तरह मुफ्त।',
    category: 'emergency', confidence: 'high', emergency: true, referTo: '108'
  },
}

// ── Fuzzy keyword lookup ──────────────────────────────────────────────────────

function normalizeQuery(q: string): string {
  return q.toLowerCase()
    .replace(/[।,!?।]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function lookupOffline(query: string): OfflineAnswer | null {
  const normalized = normalizeQuery(query)

  // Word-boundary key match
  for (const [key, answer] of Object.entries(MEDICAL_FAQ)) {
    const keyRegex = new RegExp(`\\b${key}\\b`, "i")
    if (keyRegex.test(normalized)) return answer
  }

  // Partial Hindi keyword scan
  const HINDI_KEYWORDS: Record<string, string> = {
    'बुखार': 'fever', 'खांसी': 'cough', 'जुकाम': 'cold', 'सर्दी': 'cold', 'सिरदर्द': 'headache',
    'सिर दर्द': 'headache', 'पेट दर्द': 'diarrhea',
    'उल्टी': 'diarrhea', 'दस्त': 'diarrhea', 'मलेरिया': 'malaria',
    'डेंगू': 'dengue', 'TB': 'tuberculosis', 'गर्भ': 'pregnancy',
    'प्रसव': 'delivery', 'बच्चा': 'child vaccination', 'टीका': 'child vaccination',
    'सांप': 'snake bite', 'जल गया': 'burn', 'जलना': 'burn', 'सीने': 'chest pain',
    'बेहोश': 'unconscious', 'सांस': 'shortness of breath', '108': '108',
    'आयुष्मान': 'ayushman bharat', 'JSSK': 'jssk', 'जन औषधि': 'jan aushadhi',
  }

  for (const [hindi, key] of Object.entries(HINDI_KEYWORDS)) {
    if (normalized.includes(hindi.toLowerCase())) {
      return MEDICAL_FAQ[key] ?? null
    }
  }

  return null
}

// ── Offline symptom triage ────────────────────────────────────────────────────

export interface OfflineTriageResult {
  urgency: 'low' | 'medium' | 'high' | 'emergency'
  immediateActions: string[]
  homeCare: string[]
  whenToGoToHospital: string
  referTo: string
}

const EMERGENCY_SYMPTOMS = [
  'chest pain', 'shortness of breath', 'unconscious', 'cough with blood',
  'saans ki takleef', 'seene mein dard', 'bेहोश',
]

const HIGH_SYMPTOMS = [
  'high fever', 'severe abdominal pain', 'blood in stool', 'swollen legs',
  'difficulty walking', 'tez bukhar',
]

export function triageOffline(symptoms: string[], lang: string): OfflineTriageResult {
  const en = lang !== 'hi'
  const combined = symptoms.join(' ').toLowerCase()

  const isEmergency = EMERGENCY_SYMPTOMS.some(s => combined.includes(s))
  const isHigh = HIGH_SYMPTOMS.some(s => combined.includes(s)) || symptoms.length >= 4

  const urgency = isEmergency ? 'emergency' : isHigh ? 'high' : symptoms.length >= 2 ? 'medium' : 'low'

  if (isEmergency) {
    return {
      urgency: 'emergency',
      immediateActions: en
        ? ['Call 108 ambulance immediately', 'Do not move the patient', 'Keep them calm and conscious']
        : ['तुरंत 108 पर कॉल करें', 'मरीज को हिलाएं नहीं', 'उन्हें शांत रखें'],
      homeCare: [],
      whenToGoToHospital: en ? 'Go to hospital IMMEDIATELY. This is an emergency.' : 'तुरंत अस्पताल जाएं। यह आपातकाल है।',
      referTo: '108',
    }
  }

  return {
    urgency,
    immediateActions: en
      ? ['Rest at home', 'Drink plenty of fluids (water/ORS)', 'Take paracetamol for fever/pain', 'Monitor symptoms every 4 hours']
      : ['आराम करें', 'पानी/ORS पिएं', 'बुखार/दर्द के लिए पैरासिटामोल लें', 'हर 4 घंटे में लक्षण देखें'],
    homeCare: en
      ? ['Eat light khichdi or rice', 'Avoid oily and spicy food', 'Sleep in a well-ventilated room', 'Keep area clean']
      : ['खिचड़ी या चावल खाएं', 'तेल-मसाले से बचें', 'हवादार कमरे में सोएं', 'साफ-सफाई रखें'],
    whenToGoToHospital: en
      ? 'Go to PHC if fever exceeds 103°F, symptoms worsen after 2 days, or you see bleeding, confusion, or difficulty breathing.'
      : 'बुखार 103°F से अधिक हो, 2 दिन बाद भी लक्षण बढ़ें, या खून आए, भ्रम हो, सांस लेने में तकलीफ हो तो PHC जाएं।',
    referTo: urgency === 'high' ? 'District Hospital' : 'PHC',
  }
}
