/**
 * lib/ai/medical-brain.ts
 *
 * Scored, context-gated clinical knowledge engine for rural healthcare.
 * - Strict word-boundary matching (no loose substring collisions).
 * - Priority-weighted multi-factor scoring (emergency > red-flag > symptom > diet).
 * - Context-gated diet guidance (spicy, fiber, dairy only trigger when diarrhea/GI context is active).
 * - Age/weight relative fever and medication wording (no rigid adult dosages).
 */

export interface MedicalBrainEntry {
  id: string
  priority: number // 100 = emergency, 80 = red flag, 60 = acute symptom, 40 = diet/home care
  requiresGIContext?: boolean
  patterns: RegExp[]
  keywords: string[]
  en: string
  hi: string
}

export const CLINICAL_KNOWLEDGE_BASE: MedicalBrainEntry[] = [
  // ── PRIORITY 100: EMERGENCY & RED FLAGS ──
  {
    id: "emergency-chest-pain",
    priority: 100,
    patterns: [
      /\b(chest pain|heart attack|angina)\b/i,
      /\b(seene mein dard|chhati me dard)\b/i,
      /\b(सीने में दर्द|दिल का दौरा)\b/i,
    ],
    keywords: ["chest pain", "heart", "cardiac", "seene mein dard"],
    en: "🚨 CHEST PAIN IS A MEDICAL EMERGENCY:\n\n• Stop all physical activity immediately and sit upright.\n• If pain radiates to the left arm, jaw, neck, or is accompanied by breathlessness or cold sweating, CALL 108 AMBULANCE IMMEDIATELY.\n• Do not drive yourself. Stay calm while emergency responders arrive.",
    hi: "🚨 सीने का दर्द एक आपातकालीन स्थिति (Emergency) है:\n\n• तुरंत सारा काम बंद करके सीधे बैठ जाएं।\n• यदि दर्द बाएं हाथ, जबड़े या गर्दन में फैल रहा हो या पसीना व सांस फूल रही हो, तो तुरंत 108 पर कॉल करें।\n• खुद गाड़ी न चलाएं। आपातकालीन सहायता आने तक शांत रहें।",
  },
  {
    id: "emergency-respiratory",
    priority: 100,
    patterns: [
      /\b(shortness of breath|cannot breathe|gasping for air|suffocating)\b/i,
      /\b(saans lene me takleef|saans phoolna)\b/i,
      /\b(सांस लेने में तकलीफ|सांस फूलना)\b/i,
    ],
    keywords: ["shortness of breath", "breathing", "suffocating", "saans"],
    en: "🚨 SEVERE BREATHING DIFFICULTY IS AN EMERGENCY:\n\n• Sit upright; do not lie flat.\n• Loosen tight clothing around the neck and chest.\n• Call 108 Ambulance immediately or go to the nearest hospital casualty.",
    hi: "🚨 सांस लेने में अत्यधिक कठिनाई आपातकालीन स्थिति है:\n\n• सीधे बैठें, सीधे न लेटें।\n• कपड़े ढीले करें।\n• तुरंत 108 एम्बुलेंस पर कॉल करें या नजदीकी अस्पताल जाएं।",
  },
  {
    id: "emergency-hospital-red-flags",
    priority: 85,
    patterns: [
      /\b(danger signs|red flag|when to go to hospital|serious signs)\b/i,
      /\b(khatra|kab hospital jaye)\b/i,
      /\b(अस्पताल कब जाएं|खतरे के लक्षण)\b/i,
    ],
    keywords: ["hospital", "emergency", "danger", "serious", "khatra"],
    en: "Go to the nearest Hospital or Community Health Centre (CHC) immediately if you experience:\n\n1. Blood in vomit, cough, or stool\n2. Inability to keep any liquids down for 12+ hours\n3. Fever above 103°F not responding to medicine\n4. Drowsiness, confusion, or fainting\n5. Reduced urination for 8+ hours (severe dehydration)",
    hi: "तुरंत अस्पताल या सामुदायिक स्वास्थ्य केंद्र (CHC) जाएं यदि:\n\n1. उल्टी, खांसी या मल में खून आए\n2. 12 घंटे से पानी भी पेट में न रुक रहा हो\n3. 103°F से अधिक तेज बुखार जो दवा से न उतरे\n4. बेहोशी, भ्रम या अत्यधिक कमजोरी हो\n5. 8 घंटे से पेशाब न आया हो (गंभीर निर्जलीकरण)",
  },

  // ── PRIORITY 80: URGENT CLINICAL REFERRAL (NTEP / TB & Sub-acute red flags) ──
  {
    id: "urgent-referral-chronic-cough-tb",
    priority: 80,
    patterns: [
      /\b(cough for (2|3|4|two|three|four)\s*(weeks|plus weeks|months)|chronic cough|coughing for (2|3|4|two|three|four)\s*weeks)\b/i,
      /\b((2|3|4|do|teen|char)\s*(hafte|hafto|saptaah)\s*se\s*khansi|purani khansi)\b/i,
      /((दो|तीन|चार)\s*(हफ्ते|हफ्तों|सप्ताह)\s*से\s*खांसी|लगातार खांसी)/i,
    ],
    keywords: ["cough", "weeks", "khansi", "hafte", "sputum", "tb"],
    en: "⚠️ URGENT CLINICAL REFERRAL — COUGH LASTING OVER 2 WEEKS:\n\n• According to National Tuberculosis Elimination Program (NTEP) guidelines, a cough persisting for more than 2 weeks must be screened for Tuberculosis (TB).\n• Recommended Action: Visit your nearest Primary Health Centre (PHC) or Community Health Centre (CHC) for a free sputum test (microscopy/CBNAAT) and chest evaluation.\n• Do not take over-the-counter cough syrups to mask symptoms.\n• Note: If accompanied by blood in sputum, high fever, or night sweats, seek evaluation immediately at the government hospital.",
    hi: "⚠️ तुरंत डॉक्टर को दिखाएं — 2 हफ्ते से अधिक समय से खांसी:\n\n• राष्ट्रीय क्षय रोग उन्मूलन कार्यक्रम (NTEP) के अनुसार, 2 सप्ताह से अधिक समय तक लगातार रहने वाली खांसी की टीबी (Tuberculosis) जांच कराना आवश्यक है।\n• जरूरी कदम: अपने नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC) या सामुदायिक स्वास्थ्य केंद्र (CHC) जाएं और बलगम की मुफ्त जांच (Sputum Test) कराएं।\n• बिना डॉक्टर की सलाह के खांसी की दवा खाकर इसे न दबाएं।\n• यदि बलगम में खून, शाम को बुखार या वजन घटने के लक्षण हों तो तुरंत सरकारी अस्पताल संपर्क करें।",
  },
  {
    id: "urgent-referral-animal-dog-bite",
    priority: 85,
    patterns: [
      /\b(dog bite|dog bites|kutta ne kata|kutta kaat|kutte ne kaat|animal bite|monkey bite|rabies)\b/i,
      /(कुत्ते ने काट|कुत्ता काटा|कुत्ते का काटना|जानवर ने काटा|बंदर ने काटा|रेबीज)/i,
    ],
    keywords: ["dog bite", "animal bite", "kutta", "rabies", "pep"],
    en: "⚠️ URGENT CLINICAL REFERRAL — ANIMAL / DOG BITE (RABIES PROTOCOL):\n\n1. IMMEDIATE FIRST AID (Crucial):\n• Wash the wound thoroughly under running tap water with soap for at least 15 minutes immediately. This flushes out the virus.\n• DO NOT apply chili powder, lime, soil, turmeric, or tight bandages.\n• Apply antiseptic (Povidone-iodine or Dettol/Savlon) if available.\n\n2. URGENT MEDICAL CARE (Within 24 Hours):\n• Visit your nearest Primary Health Centre (PHC), CHC, or District Hospital immediately.\n• Anti-Rabies Vaccine (ARV) must be administered (Day 0, 3, 7, 28) for effective Post-Exposure Prophylaxis (PEP).\n• For deep bleeding bites (Category III), Rabies Immunoglobulin (RIG) is also mandatory.",
    hi: "⚠️ तुरंत अस्पताल जाएं — कुत्ते या जानवर का काटना (रेबीज रोकथाम प्रोटोकॉल):\n\n1. तुरंत प्राथमिक उपचार (अत्यंत महत्वपूर्ण):\n• घाव को तुरंत बहते साफ पानी और साबुन से कम से कम 15 मिनट तक लगातार धोएं। यह वायरस को खत्म करने का सबसे प्रभावी कदम है।\n• घाव पर मिर्च, चूना, मिट्टी या हल्दी बिल्कुल न लगाएं और कसकर पट्टी न बांधें।\n• यदि उपलब्ध हो तो पोविडोन-आयोडीन (Betadine) लगाएं।\n\n2. तुरंत डॉक्टर को दिखाएं (24 घंटे के भीतर):\n• तुरंत अपने नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC), CHC या सरकारी अस्पताल जाएं।\n• रेबीज का टीका (Anti-Rabies Vaccine) Day 0, 3, 7 और 28 पर लगवाना अनिवार्य है।\n• गहरे घाव होने पर रेबीज इम्यूनोग्लोबुलिन (RIG) लगवाना आवश्यक होता है।",
  },

  // ── PRIORITY 60: ACUTE SYMPTOM GUIDELINES ──
  {
    id: "symptom-fever",
    priority: 60,
    patterns: [
      /\b(fever|high temperature|pyrexia)\b/i,
      /\b(bukhar|tez bukhar)\b/i,
      /\b(बुखार|तेज बुखार|तापमान)\b/i,
    ],
    keywords: ["fever", "temperature", "bukhar", "chills"],
    en: "For fever (99°F–102°F):\n\n• Rest, stay well-hydrated, and apply room-temperature damp cloth sponging to the forehead.\n• Paracetamol may be used to lower fever — always follow the age/weight dosage instructions on the package or consult an ASHA worker/pharmacist.\n• If fever exceeds 103°F or lasts more than 3 days, get tested for Malaria/Dengue/Typhoid at your nearest PHC.",
    hi: "बुखार (99°F–102°F) के लिए:\n\n• आराम करें, पर्याप्त पानी पिएं और माथे पर सामान्य पानी की ठंडी पट्टी रखें।\n• बुखार कम करने के लिए पैरासिटामोल का उपयोग कर सकते हैं — हमेशा दवा के पैकेट पर दी गई उम्र और वजन के अनुसार खुराक लें या ASHA कार्यकर्ता/फार्मासिस्ट से पूछें।\n• बुखार 103°F से अधिक हो या 3 दिन से अधिक रहे तो PHC में मलेरिया/डेंगू की जांच कराएं।",
  },
  {
    id: "symptom-headache",
    priority: 60,
    patterns: [
      /\b(headache|migraine|head pain|throbbing head)\b/i,
      /\b(sir dard|sar dard|sirdard|sardard)\b/i,
      /\b(सिरदर्द|सिर दर्द|माइग्रेन)\b/i,
    ],
    keywords: ["headache", "migraine", "head", "sir dard"],
    en: "For headaches:\n\n• Rest in a quiet, dark room and drink plenty of water (dehydration is a frequent cause).\n• Gently massage the neck and temples.\n• Warning: A sudden, explosive 'thunderclap' headache, or headache with neck stiffness, vision change, or weakness requires immediate hospital emergency evaluation.",
    hi: "सिरदर्द के लिए:\n\n• शांत, अंधेरे कमरे में आराम करें और भरपूर पानी पिएं।\n• माथे और गर्दन की हल्की मालिश करें।\n• चेतावनी: यदि अचानक असहनीय तीव्र सिरदर्द हो, गर्दन में अकड़न हो या उल्टी व चक्कर आएं, तो तुरंत अस्पताल जाएं।",
  },
  {
    id: "symptom-vomiting-nausea",
    priority: 60,
    patterns: [
      /\b(vomiting|nausea|throwing up|vomit)\b/i,
      /\b(ulti|matli)\b/i,
      /\b(उल्टी|मतली|जी मिचलाना)\b/i,
    ],
    keywords: ["vomit", "vomiting", "nausea", "ulti", "matli"],
    en: "For vomiting and nausea:\n\n• Do not gulp large amounts of water at once; take 1–2 small sips every 5–10 minutes.\n• Sip warm water with ginger or fennel seeds (saunf).\n• Avoid lying flat right after drinking; keep the head elevated.\n• Consult a doctor if vomiting persists for more than 12 hours without retaining liquids.",
    hi: "उल्टी और मतली के लिए:\n\n• एक साथ ज्यादा पानी न पिएं; हर 5-10 मिनट में 1-2 घूंट करके पिएं।\n• अदरक की चाय या सौंफ का उबला पानी पिएं।\n• कुछ भी पीने के तुरंत बाद सीधे न लेटें।\n• यदि उल्टी 12 घंटे से अधिक समय तक लगातार हो, तो तुरंत डॉक्टर से मिलें।",
  },
  {
    id: "symptom-constipation",
    priority: 60,
    patterns: [
      /\b(constipation|constipated|hard stool|difficulty passing stool)\b/i,
      /\b(kabj|kabzi|pet saaf na hona)\b/i,
      /\b(कब्ज|कब्जियत|पेट साफ न होना)\b/i,
    ],
    keywords: ["constipation", "kabj", "hard stool", "constipated"],
    en: "For constipation and stomach heaviness:\n\n• Drink 8–10 glasses of warm water throughout the day, especially 1 glass of warm water early in the morning.\n• Eat high-fiber foods: ripe papaya, guava, green leafy vegetables, and whole grains (daliya, oats).\n• Avoid refined flour (maida), junk food, and excess tea/coffee which dehydrate the bowel.\n• Physical movement: 20–30 minutes of brisk walking helps stimulate intestinal movement.",
    hi: "कब्ज और पेट भारी होने के लिए:\n\n• दिन भर में 8-10 गिलास गुनगुना पानी पिएं, विशेष रूप से सुबह उठकर 1 गिलास गुनगुना पानी लें।\n• फाइबर युक्त भोजन करें: पका पपीता, अमरूद, हरी सब्जियां और दलिया खाएं।\n• मैदा, बाहर का तला-भुना खाना और ज्यादा चाय/कॉफी से बचें।\n• रोजाना 20-30 मिनट टहलें, इससे पाचन और आंतों की क्रिया सुधरती है।",
  },

  // ── PRIORITY 40: CONTEXT-GATED DIETARY & RECOVERY RULES ──
  {
    id: "diet-spicy-food",
    priority: 40,
    requiresGIContext: true,
    patterns: [
      /\b(spicy food|spicy|chillies|chili|oily food|fried food|masala)\b/i,
      /\b(tikha|teekha|masaledar|tala hua)\b/i,
      /\b(तीखा|मसालेदार|तला हुआ|मिर्च)\b/i,
    ],
    keywords: ["spicy", "oily", "chili", "masala", "tikha", "teekha"],
    en: "No, you should strictly avoid spicy, oily, and fried foods right now.\n\n• Why: Chillies and heavy masalas irritate the inflamed stomach and intestinal lining, worsening loose motions, cramping, and acidity.\n• What to eat instead: Bland, soothing meals such as plain moong dal khichdi, boiled potatoes, boiled white rice, and fresh curd.",
    hi: "नहीं, आपको इस समय तीखा, तला हुआ और मसालेदार खाना बिल्कुल नहीं खाना चाहिए।\n\n• कारण: मिर्च और मसाले आंतों में जलन पैदा करते हैं, जिससे दस्त, पेट दर्द और मरोड़ बढ़ जाती है।\n• क्या खाएं: हल्का सुपाच्य भोजन जैसे मूंग दाल की खिचड़ी, सादे उबले चावल, उबला आलू और ताजा दही लें।",
  },
  {
    id: "diet-fiber-food",
    priority: 40,
    requiresGIContext: true,
    patterns: [
      /\b(fiber rich|fiber|fibre|raw salad|raw vegetables|bran)\b/i,
      /\b(resha|salad)\b/i,
      /\b(फाइबर|रेशा|कच्चा सलाद)\b/i,
    ],
    keywords: ["fiber", "fibre", "salad", "raw vegetables"],
    en: "During active stomach upset or diarrhea, avoid high-insoluble fiber (raw salads, raw leafy greens, whole nuts, and bran).\n\n• Insoluble fiber speeds intestinal transit and can aggravate cramping.\n• Soluble fiber is beneficial: Ripe bananas, boiled apples, and oats help absorb excess fluid and firm up the stool. Resume normal high-fiber foods only 2–3 days after recovery.",
    hi: "दस्त या पेट खराब के दौरान कच्चे सलाद और साबुत अनाज (Insoluble Fiber) से बचें।\n\n• यह आंतों की गति तेज करता है जिससे दस्त बढ़ सकते हैं।\n• क्या ले सकते हैं: केला और सेब (Soluble Fiber) फायदेमंद हैं क्योंकि ये मल को बांधते हैं। सामान्य सब्जियां और सलाद पेट पूरी तरह ठीक होने के 2-3 दिन बाद ही लें।",
  },
  {
    id: "diet-dairy-milk",
    priority: 40,
    requiresGIContext: true,
    patterns: [
      /\b(milk|dairy|cheese|paneer|curd|buttermilk|chaas|dahi)\b/i,
      /\b(doodh|paneer|dahi|chaach)\b/i,
      /\b(दूध|पनीर|दही|छाछ|मट्ठा)\b/i,
    ],
    keywords: ["milk", "dairy", "cheese", "curd", "dahi", "chaas"],
    en: "Avoid whole milk and heavy paneer during stomach infection, as temporary lactose intolerance commonly occurs during diarrhea.\n\n• Fresh Curd (Dahi) and Buttermilk (Chaas) are strongly recommended: They contain natural gut probiotics (Lactobacillus) which soothe the digestive tract and help restore normal flora.",
    hi: "दस्त के दौरान सादा दूध और पनीर न लें, क्योंकि इस समय पेट दूध पचा नहीं पाता।\n\n• ताजा दही और छाछ (मट्ठा) बहुत लाभदायक हैं: इनमें प्राकृतिक प्रोबायोटिक्स होते हैं जो पेट को ठंडा करते हैं और पाचन को सुधारते हैं।",
  },
  {
    id: "diet-ors-hydration",
    priority: 45,
    patterns: [
      /\b(ors|oral rehydration|hydration|coconut water|dehydration)\b/i,
      /\b(nimbu pani|paani)\b/i,
      /\b(ओआरएस|जीवन रक्षक घोल|नारियल पानी|निर्जलीकरण)\b/i,
    ],
    keywords: ["ors", "hydration", "dehydration", "coconut water"],
    en: "Adequate hydration is the most crucial treatment for fever, diarrhea, and vomiting:\n\n• ORS (Oral Rehydration Solution): Drink 1 cup after every loose motion or vomit. Available free at any government health center.\n• Home ORS Recipe: Mix 6 level teaspoons of sugar and 1/2 teaspoon of salt in 1 litre of clean boiled water.\n• Also beneficial: Fresh coconut water, thin dal water, and rice starch (kanji).",
    hi: "बुखार, दस्त और उल्टी में पानी की कमी (डिहाइड्रेशन) से बचना सबसे महत्वपूर्ण है:\n\n• ORS घोल: हर दस्त या उल्टी के बाद 1 कप पिएं। यह सरकारी स्वास्थ्य केंद्र पर मुफ्त मिलता है।\n• घर पर बनाने की विधि: 1 लीटर उबले पानी में 6 चम्मच चीनी और आधा चम्मच नमक घोलें।\n• अन्य तरल: नारियल पानी, पतली दाल का पानी और चावल का मांड पिएं।",
  },
]

export interface ScoredMatchResult {
  entry: MedicalBrainEntry
  score: number
}

export function getMedicalBrainEntry(
  query: string,
  contextSymptoms: string[] = []
): MedicalBrainEntry | null {
  const q = query.trim().toLowerCase()

  // Check if GI / diarrhea context is present in recent symptoms or query
  const combinedContext = (contextSymptoms.join(" ") + " " + q).toLowerCase()
  const hasGIContext = /\b(diarrhea|diarrhoea|vomit|vomiting|nausea|stomach|loose motion|loosemotion|bloat|cramp|dast|ulti|pet dard)\b/i.test(
    combinedContext
  )

  let bestMatch: ScoredMatchResult | null = null

  for (const entry of CLINICAL_KNOWLEDGE_BASE) {
    // If entry requires GI context (diet entries) and no GI context exists, skip
    if (entry.requiresGIContext && !hasGIContext) {
      continue
    }

    let patternScore = 0
    for (const rx of entry.patterns) {
      if (rx.test(q)) {
        patternScore += 3
      }
    }

    let keywordScore = 0
    for (const kw of entry.keywords) {
      const kwRegex = new RegExp(`\\b${kw}\\b`, "i")
      if (kwRegex.test(q)) {
        keywordScore += 1
      }
    }

    const totalScore = patternScore + keywordScore
    if (totalScore >= 3) {
      // Prioritize higher total score, break ties by entry priority
      if (
        !bestMatch ||
        totalScore > bestMatch.score ||
        (totalScore === bestMatch.score && entry.priority > bestMatch.entry.priority)
      ) {
        bestMatch = { entry, score: totalScore }
      }
    }
  }

  return bestMatch ? bestMatch.entry : null
}

export function answerMedicalQuery(
  query: string,
  language: string = "en",
  contextSymptoms: string[] = []
): string | null {
  const lang = language === "hi" ? "hi" : "en"
  const entry = getMedicalBrainEntry(query, contextSymptoms)
  if (entry) {
    return lang === "hi" ? entry.hi : entry.en
  }
  return null
}
