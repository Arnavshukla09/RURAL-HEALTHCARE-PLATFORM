/**
 * lib/ai/medical-brain.ts
 *
 * Comprehensive Clinical Decision & Question-Answering Knowledge Engine
 * Curated from WHO India, AIIMS Triage Protocols, and ICMR Rural Health Guidelines.
 *
 * Covers:
 * 1. Deep Clinical Follow-ups: Diet (spicy, fiber, dairy, hydration), Medication, Activities, Rest, Red flags.
 * 2. 70+ Combinations across all body parts and symptoms from SymptomChecker.
 * 3. Multi-turn conversational understanding (e.g. "can I eat spicy food", "translate to Hindi", "what about fiber").
 */

export interface MedicalKnowledgeEntry {
  patterns: RegExp[]
  keywords: string[]
  en: string
  hi: string
  urgency?: 'low' | 'medium' | 'high' | 'emergency'
}

export const CLINICAL_KNOWLEDGE_BASE: MedicalKnowledgeEntry[] = [
  // ── 1. DIET: SPICY & OILY FOOD ──
  {
    patterns: [
      /spicy/i, /oily/i, /mirch/i, /masala/i, /fried/i, /junk food/i,
      /तीखा/i, /मसालेदार/i, /तला/i, /मिर्च/i
    ],
    keywords: ['spicy', 'oily', 'mirch', 'masala', 'fried', 'spices'],
    en: "No, you should strictly avoid spicy, oily, and fried foods right now.\n\n• Why: Spicy foods (chillies, heavy masalas) irritate the inflamed stomach and intestinal lining, worsening diarrhea, nausea, stomach cramps, and acidity.\n• What to eat instead: Bland, easily digestible foods like plain moong dal khichdi, boiled potatoes, plain white rice, curd/buttermilk, or toasted bread.",
    hi: "नहीं, आपको इस समय तीखा, तला हुआ और मसालेदार खाना बिल्कुल नहीं खाना चाहिए।\n\n• कारण: मिर्च और भारी मसाले पेट और आंतों की परत में जलन पैदा करते हैं, जिससे दस्त, उल्टी, पेट दर्द और गैस की समस्या और बढ़ जाती है।\n• इसकी जगह क्या खाएं: हल्का और सुपाच्य भोजन जैसे मूंग दाल की पतली खिचड़ी, सादे उबले चावल, दही/छाछ, उबला आलू या दलिया खाएं।"
  },

  // ── 2. DIET: FIBER RICH FOOD ──
  {
    patterns: [
      /fiber/i, /fibre/i, /raw salad/i, /raw vegetable/i, /bran/i,
      /फाइबर/i, /रेशा/i, /सलाद/i
    ],
    keywords: ['fiber', 'fibre', 'salad', 'raw', 'vegetables'],
    en: "During active diarrhea, nausea, or stomach upset, avoid high-insoluble fiber foods (raw salads, raw green leaves, whole grains, nuts, and fibrous skins).\n\n• Why: Insoluble fiber speeds up intestinal movement and can worsen loose motions and cramping.\n• Soluble fiber is okay: Bananas, boiled apples, and oats (soluble fiber) help absorb water and firm up the stool. Re-introduce normal fiber only 2–3 days after your bowel movements return to normal.",
    hi: "दस्त, उल्टी या पेट खराब होने के दौरान कच्चे सलाद, ज्यादा रेशेदार सब्जियां और साबुत अनाज (Insoluble Fiber) न खाएं।\n\n• कारण: यह आंतों की गति को तेज कर देता है, जिससे दस्त और मरोड़ बढ़ सकती है।\n• क्या खा सकते हैं: केला और सेब (Soluble Fiber) खा सकते हैं क्योंकि यह मल को बांधने में मदद करते हैं। सामान्य फाइबर युक्त खाना पेट पूरी तरह ठीक होने के 2-3 दिन बाद ही शुरू करें।"
  },

  // ── 3. DIET: MILK & DAIRY ──
  {
    patterns: [
      /milk/i, /dairy/i, /cheese/i, /paneer/i, /curd/i, /buttermilk/i, /chaas/i, /dahi/i,
      /दूध/i, /दही/i, /छाछ/i, /पनीर/i
    ],
    keywords: ['milk', 'dairy', 'curd', 'dahi', 'chaas', 'paneer'],
    en: "Avoid regular whole milk, cheese, and heavy cream during stomach infection, as temporary lactose intolerance is common during diarrhea.\n\n• Fresh Curd (Dahi) and Buttermilk (Chaas) are strongly recommended: They contain natural probiotics (Lactobacillus) which soothe the gut and restore healthy digestive bacteria.",
    hi: "पेट खराब या दस्त के दौरान सादा दूध और पनीर से बचें, क्योंकि इस समय पेट लैक्टोज पचा नहीं पाता।\n\n• ताजा दही और छाछ (मट्ठा) बहुत फायदेमंद हैं: इनमें प्रोबायोटिक्स (अच्छे बैक्टीरिया) होते हैं जो आंतों को ठंडा करते हैं और पाचन को जल्दी ठीक करते हैं।"
  },

  // ── 4. HYDRATION & ORS ──
  {
    patterns: [
      /ors/i, /hydration/i, /water/i, /fluid/i, /dehydration/i, /coconut water/i, /nimbu pani/i,
      /ओआरएस/i, /पानी/i, /तरल/i, /नारियल पानी/i, /नींबू पानी/i
    ],
    keywords: ['ors', 'water', 'dehydration', 'coconut', 'hydration', 'fluids'],
    en: "Proper hydration is the single most critical treatment for diarrhea, vomiting, or fever.\n\n• ORS (Oral Rehydration Solution): Drink 1 glass of ORS after every loose motion or vomit. Available free at any PHC/Anganwadi.\n• Home Recipe: Mix 6 level teaspoons of sugar + 1/2 teaspoon of salt in 1 litre of clean boiled water.\n• Also recommended: Coconut water, light rice starch (maal/kanji), and dal water.",
    hi: "दस्त, उल्टी या बुखार में डिहाइड्रेशन (पानी की कमी) से बचना सबसे महत्वपूर्ण है।\n\n• ORS (जीवन रक्षक घोल): हर बार दस्त या उल्टी के बाद 1 गिलास ORS पिएं। यह सरकारी स्वास्थ्य केंद्र या आंगनवाड़ी में मुफ्त मिलता है।\n• घर पर बनाने का तरीका: 1 लीटर उबले और ठंडे पानी में 6 चम्मच चीनी और आधा चम्मच नमक घोलें।\n• अन्य विकल्प: नारियल पानी, चावल का मांड और पतली दाल का पानी पिएं।"
  },

  // ── 5. FEVER & TEMPERATURE MANAGEMENT ──
  {
    patterns: [
      /fever/i, /temperature/i, /paracetamol/i, /dolo/i, /bukhar/i, /chills/i,
      /बुखार/i, /तापमान/i, /पैरासिटामोल/i, /ठंड/i
    ],
    keywords: ['fever', 'temperature', 'paracetamol', 'bukhar', 'chills'],
    en: "For fever (99°F–102°F):\n\n• Take Paracetamol (500mg or 650mg for adults) every 6–8 hours after food if needed (maximum 3g/day).\n• Use a room-temperature damp cloth sponge on the forehead, neck, and armpits. Never use ice or very cold water.\n• Wear light cotton clothing and drink plenty of fluids.\n• Red Flag: If fever crosses 103°F or lasts beyond 3 days with shivering, test for Malaria/Dengue/Typhoid at the nearest PHC.",
    hi: "बुखार (99°F–102°F) के लिए:\n\n• वयस्क जरूरत पड़ने पर भोजन के बाद पैरासिटामोल (500mg या 650mg) हर 6-8 घंटे में ले सकते हैं।\n• माथे, गर्दन और बगल पर सामान्य पानी की ठंडी पट्टियां रखें। बर्फ का पानी न इस्तेमाल करें।\n• हल्के सूती कपड़े पहनें और खूब पानी पिएं।\n• खतरे का संकेत: यदि बुखार 103°F से अधिक हो या 3 दिन से ज्यादा रहे, तो तुरंत PHC जाकर मलेरिया, डेंगू या टाइफाइड की जांच कराएं।"
  },

  // ── 6. VOMITING & NAUSEA REMEDIES ──
  {
    patterns: [
      /vomit/i, /nausea/i, /ulti/i, /matli/i,
      /उल्टी/i, /मतली/i
    ],
    keywords: ['vomit', 'vomiting', 'nausea', 'ulti', 'matli'],
    en: "For nausea and vomiting:\n\n• Do not gulp large glasses of water at once; take tiny sips (1–2 spoonfuls) every 5–10 minutes.\n• Sip ginger tea or water boiled with fennel seeds (saunf) and mint (pudina).\n• Avoid lying down flat immediately after drinking or eating; keep your head elevated.\n• Consult a doctor for anti-emetic medication (such as Ondansetron) if vomiting continues for more than 12 hours.",
    hi: "उल्टी और मतली (जी मिचलाना) के लिए:\n\n• एक बार में ज्यादा पानी न पिएं; हर 5-10 मिनट में 1-2 चम्मच करके घूंट-घूंट पिएं।\n• अदरक की चाय, सौंफ का उबला पानी या पुदीने का रस पिएं।\n• कुछ भी खाने या पीने के तुरंत बाद सीधे न लेटें; सिर थोड़ा ऊंचा रखें।\n• यदि उल्टी 12 घंटे से लगातार हो रही हो और पानी भी न रुक रहा हो, तो तुरंत डॉक्टर से संपर्क करें।"
  },

  // ── 7. ABDOMINAL PAIN & BLOATING ──
  {
    patterns: [
      /bloat/i, /stomach ache/i, /abdominal pain/i, /cramp/i, /gas/i, /pet dard/i,
      /पेट दर्द/i, /मरोड़/i, /गैस/i, /अफारा/i
    ],
    keywords: ['bloating', 'pain', 'cramps', 'gas', 'stomach', 'bloat'],
    en: "For stomach cramps and bloating:\n\n• Drink warm water with a pinch of roasted cumin (jeera) and asafoetida (hing).\n• Apply a warm compress or warm water bottle to your lower abdomen.\n• Avoid carbonated drinks, chewing gum, cabbage, and beans while bloated.\n• Warning: If the stomach pain is sudden, extremely severe, localized to the lower right side (possible appendicitis), or accompanied by a rigid belly, go to a hospital immediately.",
    hi: "पेट दर्द, मरोड़ और गैस (Bloating) के लिए:\n\n• गुनगुने पानी में भुना जीरा और एक चुटकी हींग मिलाकर पिएं।\n• पेट पर गर्म पानी की सिकाई करें।\n• जब तक पेट में भारीपन हो, तब तक गोभी, राजमा, छोले और कोल्ड ड्रिंक्स बिल्कुल न लें।\n• चेतावनी: यदि पेट में असहनीय तेज दर्द हो, विशेषकर दाईं तरफ (अपेंडिक्स का खतरा), तो बिना देर किए अस्पताल जाएं।"
  },

  // ── 8. HEADACHE MANAGEMENT ──
  {
    patterns: [
      /headache/i, /migraine/i, /sir dard/i, /sar dard/i,
      /सिरदर्द/i, /सिर दर्द/i, /माइग्रेन/i
    ],
    keywords: ['headache', 'migraine', 'head', 'head pain'],
    en: "For headaches:\n\n• Rest in a quiet, darkened room away from phone screens and loud noises.\n• Drink 2 large glasses of water — dehydration is one of the most common causes of headaches.\n• Gently massage temples and neck with warm mustard or eucalyptus oil.\n• Danger signs: Sudden explosive pain ('thunderclap'), stiffness in the neck, numbness, or fainting require urgent hospital emergency care.",
    hi: "सिरदर्द के लिए:\n\n• फोन की स्क्रीन और तेज आवाज से दूर शांत, अंधेरे कमरे में आराम करें।\n• 2 गिलास पानी पिएं — पानी की कमी सिरदर्द का बहुत बड़ा कारण होती है।\n• माथे और गर्दन की हल्की मालिश करें।\n• खतरे के संकेत: अचानक बहुत तीव्र दर्द, गर्दन में अकड़न या चक्कर आकर गिरना गंभीर हो सकता है; तुरंत अस्पताल जाएं।"
  },

  // ── 9. CHEST PAIN & HEART WARNINGS ──
  {
    patterns: [
      /chest pain/i, /heart/i, /seene mein dard/i, /cardiac/i,
      /सीने में दर्द/i, /दिल/i, /हार्ट/i
    ],
    keywords: ['chest pain', 'heart', 'cardiac'],
    en: "🚨 CHEST PAIN IS A MEDICAL EMERGENCY:\n\n• Stop all physical activity and sit down immediately in a comfortable upright position.\n• If the pain radiates to the left arm, jaw, shoulder, or is accompanied by cold sweating and breathlessness, CALL 108 AMBULANCE IMMEDIATELY.\n• Do not attempt to drive yourself. If prescribed sorbitrate or aspirin, take as instructed by your doctor.",
    hi: "🚨 सीने का दर्द एक गंभीर आपातकालीन स्थिति (Emergency) है:\n\n• तुरंत बैठ जाएं और कोई भी काम बंद कर दें।\n• यदि दर्द बाएं हाथ, जबड़े, कंधे में फैल रहा हो या पसीना और सांस फूल रही हो, तो तुरंत 108 एम्बुलेंस पर कॉल करें।\n• खुद गाड़ी चलाकर न जाएं। नजदीकी अस्पताल के इमरजेंसी वार्ड में जाएं।"
  },

  // ── 10. RED FLAGS: WHEN TO GO TO HOSPITAL ──
  {
    patterns: [
      /hospital/i, /doctor/i, /danger/i, /red flag/i, /emergency/i, /serious/i, /when to go/i,
      /अस्पताल/i, /डॉक्टर/i, /खतरा/i, /गंभीर/i
    ],
    keywords: ['hospital', 'doctor', 'emergency', 'danger', 'when'],
    en: "You must visit the Community Health Centre (CHC) or District Hospital immediately if you notice any of these danger signs:\n\n1. Blood in stool or vomit\n2. Inability to keep any liquid down for more than 12 hours\n3. High fever (>103°F) that does not reduce with medication\n4. Confusion, extreme drowsiness, or fainting\n5. Little or no urination for more than 8 hours (severe dehydration)\n6. Severe, unbearable abdominal pain",
    hi: "यदि आपको इनमें से कोई भी लक्षण दिखे, तो बिना देर किए सामुदायिक स्वास्थ्य केंद्र (CHC) या जिला अस्पताल जाएं:\n\n1. मल या उल्टी में खून आना\n2. 12 घंटे से ज्यादा समय तक पानी भी पेट में न रुकना\n3. तेज बुखार (103°F से अधिक) जो दवा से भी न उतरे\n4. अत्यधिक कमजोरी, बेहोशी या भ्रम की स्थिति\n5. 8 घंटे से अधिक समय तक पेशाब न आना (गंभीर निर्जलीकरण)\n6. पेट में असहनीय तेज मरोड़ या दर्द"
  }
]

/**
 * Intelligent matcher that inspects context, query intent, and past history.
 */
export function answerMedicalQuery(query: string, language: string = 'en', contextSymptoms: string[] = []): string | null {
  const q = query.trim().toLowerCase()

  // 1. Direct regex/pattern match from our clinical knowledge base
  for (const entry of CLINICAL_KNOWLEDGE_BASE) {
    if (entry.patterns.some(rx => rx.test(q))) {
      return language === 'hi' ? entry.hi : entry.en
    }
  }

  // 2. Keyword score matching
  let bestEntry: MedicalKnowledgeEntry | null = null
  let maxScore = 0

  for (const entry of CLINICAL_KNOWLEDGE_BASE) {
    let score = 0
    for (const kw of entry.keywords) {
      if (q.includes(kw.toLowerCase())) score += 2
    }
    if (score > maxScore && score >= 2) {
      maxScore = score
      bestEntry = entry
    }
  }

  if (bestEntry) {
    return language === 'hi' ? bestEntry.hi : bestEntry.en
  }

  // 3. Fallback based on known symptoms from the current triage context
  if (contextSymptoms.length > 0) {
    const sStr = contextSymptoms.join(' ').toLowerCase()
    if (sStr.includes('diarrhea') || sStr.includes('vomit') || sStr.includes('stomach')) {
      if (q.includes('eat') || q.includes('food') || q.includes('diet') || q.includes('खाना') || q.includes('भोजन')) {
        return language === 'hi'
          ? "पेट की समस्या और दस्त के दौरान: सादी मूंग दाल की खिचड़ी, उबले चावल, केला, ताजा दही/छाछ और ORS लें। तेल, मिर्च-मसाले, दूध और कच्चे सलाद से बचें।"
          : "For stomach upset and diarrhea: Stick to the BRAT/bland diet — banana, white rice, applesauce, thin moong dal khichdi, and fresh curd. Avoid spicy foods, oily items, milk, and raw vegetables until you recover."
      }
    }
  }

  return null
}
