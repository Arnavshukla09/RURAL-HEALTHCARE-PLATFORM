"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Search, Syringe, Heart, Shield, BookOpen, AlertTriangle, Stethoscope, Baby, UserCheck, AlertCircle, CheckCircle2 } from "lucide-react"
import {
  evaluateImci,
  evaluateAncMaternalRisk,
  type ImciChildAssessment,
  type AncMaternalAssessment,
} from "@/lib/clinical/imci-anc"

interface HealthInfoHubProps {
  language: string
  symptomResult?: any | null
}

export function HealthInfoHub({ language, symptomResult }: HealthInfoHubProps) {
  const router = useRouter();
  const en = language === "en"
  const hasRelevantDiseases = (symptomResult?.relevantDiseases?.length ?? 0) > 0
  const [tab, setTab] = useState<"vaccines" | "firstaid" | "diseases" | "awareness" | "asha">(
    hasRelevantDiseases ? "diseases" : "firstaid"
  )
  const [search, setSearch] = useState("")

  // ASHA / ANM Copilot State
  const [copilotMode, setCopilotMode] = useState<"imci" | "anc">("imci")
  const [imciData, setImciData] = useState<ImciChildAssessment>({
    ageMonths: 12,
    cannotDrinkOrBreastfeed: false,
    vomitsEverything: false,
    convulsions: false,
    lethargicOrUnconscious: false,
    hasCoughOrDifficultyBreathing: false,
    respiratoryRate: 40,
    chestIndrawing: false,
    stridorWhenCalm: false,
    hasDiarrhea: false,
    diarrheaDays: 2,
    bloodInStool: false,
    sunkenEyes: false,
    drinkingEagerlyOrThirsty: false,
    hasFever: false,
    feverDays: 2,
    stiffNeck: false,
  })

  const [ancData, setAncData] = useState<AncMaternalAssessment>({
    gestationalWeeks: 28,
    vaginalBleeding: false,
    severeHeadacheWithBlurredVision: false,
    swellingFaceAndHands: false,
    highFever: false,
    foulSmellingDischarge: false,
    reducedFetalMovements: false,
    systolicBp: 120,
    diastolicBp: 80,
    hemoglobinGdl: 11,
  })

  const imciResult = evaluateImci(imciData)
  const ancResult = evaluateAncMaternalRisk(ancData)

  const vaccines = [
    { name: "BCG", age: "At birth", disease: "Tuberculosis", hi: "जन्म — तपेदिक" },
    { name: "OPV + IPV", age: "6, 10, 14 weeks", disease: "Polio", hi: "6, 10, 14 सप्ताह — पोलियो" },
    { name: "DPT", age: "6, 10, 14 weeks", disease: "Diphtheria, Tetanus, Pertussis", hi: "6, 10, 14 सप्ताह — डिप्थीरिया, टेटनस" },
    { name: "Hepatitis B", age: "Birth, 6, 10, 14 weeks", disease: "Hepatitis B", hi: "जन्म और 6, 10, 14 सप्ताह" },
    { name: "Measles/MR", age: "9-12 months", disease: "Measles, Rubella", hi: "9-12 माह — खसरा" },
    { name: "JE Vaccine", age: "9-12 months", disease: "Japanese Encephalitis", hi: "9-12 माह — जापानी एन्सेफलाइटिस" },
    { name: "Vitamin A", age: "9 months - 5 years", disease: "Vitamin A deficiency", hi: "9 माह - 5 वर्ष" },
    { name: "DPT Booster", age: "16-24 months", disease: "Diphtheria, Tetanus", hi: "16-24 माह" },
    { name: "TT (Pregnant)", age: "During pregnancy", disease: "Tetanus", hi: "गर्भावस्था के दौरान — टेटनस" },
  ]

  const firstAid = [
    { icon: "🩹", title: "Cuts & Wounds", hi: "कट और घाव", steps: ["Clean wound with clean water", "Apply pressure to stop bleeding", "Cover with clean cloth/bandage", "Seek medical help if deep"], hiSteps: ["स्वच्छ पानी से घाव साफ करें", "रक्तस्राव रोकने के लिए दबाव डालें", "साफ कपड़े/पट्टी से ढकें", "गहरा होने पर चिकित्सकीय मदद लें"] },
    { icon: "🔥", title: "Burns", hi: "जलना", steps: ["Cool with running water 10+ min", "Do NOT use ice or butter", "Cover loosely with clean cloth", "Seek help for large burns"], hiSteps: ["10+ मिनट तक बहते पानी से ठंडा करें", "बर्फ या मक्खन का प्रयोग न करें", "साफ कपड़े से ढीला ढकें", "बड़े जलने के लिए मदद लें"] },
    { icon: "🐍", title: "Snake Bite", hi: "सांप काटना", steps: ["Keep patient still and calm", "Keep bite below heart level", "Remove jewelry near bite", "Rush to hospital — call 108"], hiSteps: ["रोगी को स्थिर और शांत रखें", "काटने को हृदय के स्तर से नीचे रखें", "काटने के पास के गहने हटा दें", "अस्पताल ले जाएं — 108 डायल करें"] },
    { icon: "😮", title: "Choking", hi: "गला घुटना", steps: ["Encourage coughing", "5 back blows between shoulders", "5 abdominal thrusts", "Call 108 if not resolved"], hiSteps: ["खांसने के लिए प्रोत्साहित करें", "कंधों के बीच 5 बार थपथपाएं", "5 बार पेट पर दबाव डालें", "हल न होने पर 108 डायल करें"] },
    { icon: "❤️", title: "Heart Attack", hi: "दिल का दौरा", steps: ["Call 108 immediately", "Sit/lie comfortably", "Loosen tight clothing", "Give aspirin if conscious"], hiSteps: ["तुरंत 108 डायल करें", "आराम से बैठें/लेट जाएं", "तंग कपड़े ढीले करें", "होश में होने पर एस्पिरिन दें"] },
    { icon: "🌡️", title: "High Fever", hi: "तेज बुखार", steps: ["Give paracetamol as directed", "Keep patient hydrated", "Wet cloth on forehead", "Seek help if >103°F"], hiSteps: ["निर्देशानुसार पेरासिटामोल दें", "रोगी को हाइड्रेटेड रखें", "माथे पर गीला कपड़ा रखें", ">103°F होने पर मदद लें"] },
    { icon: "💧", title: "Dehydration", hi: "निर्जलीकरण", steps: ["Give ORS solution", "Small sips frequently", "Continue breastfeeding (infants)", "Seek help if no urine for 6 hrs"], hiSteps: ["ओआरएस (ORS) घोल दें", "बार-बार छोटे घूंट दें", "स्तनपान जारी रखें (शिशुओं के लिए)", "6 घंटे तक पेशाब न होने पर मदद लें"] },
    { icon: "⚡", title: "Electric Shock", hi: "बिजली का झटका", steps: ["Switch off power source first", "Do NOT touch with bare hands", "Check breathing/pulse", "Start CPR if needed, call 108"], hiSteps: ["सबसे पहले पावर स्रोत बंद करें", "नंगे हाथों से न छुएं", "सांस/पल्स की जांच करें", "यदि आवश्यक हो तो सीपीआर शुरू करें, 108 डायल करें"] },
  ]

  const diseases = [
    { icon: "🦟", name: "Malaria", hi: "मलेरिया", symptoms: "Fever, chills, sweating, headache, body aches", hiSymptoms: "बुखार, ठंड लगना, पसीना आना, सिरदर्द, शरीर में दर्द", prevention: "Mosquito nets, repellent, drain stagnant water", hiPrevention: "मच्छरदानी, विकर्षक (repellent), रुका हुआ पानी निकालें", severity: "moderate" },
    { icon: "🦟", name: "Dengue", hi: "डेंगू", symptoms: "High fever, severe headache, joint/muscle pain, rash", hiSymptoms: "तेज बुखार, गंभीर सिरदर्द, जोड़ों/मांसपेशियों में दर्द, दाने", prevention: "Remove stagnant water, use repellent, wear long sleeves", hiPrevention: "रुका हुआ पानी हटाएं, विकर्षक का उपयोग करें, पूरी आस्तीन पहनें", severity: "severe" },
    { icon: "🫁", name: "Tuberculosis", hi: "क्षय रोग", symptoms: "Persistent cough >2 weeks, weight loss, night sweats", hiSymptoms: ">2 सप्ताह तक लगातार खांसी, वजन कम होना, रात में पसीना आना", prevention: "BCG vaccine, ventilation, avoid close contact", hiPrevention: "बीसीजी वैक्सीन, वेंटिलेशन, निकट संपर्क से बचें", severity: "severe" },
    { icon: "💧", name: "Typhoid", hi: "टाइफाइड", symptoms: "Sustained fever, weakness, stomach pain, headache", hiSymptoms: "लगातार बुखार, कमजोरी, पेट दर्द, सिरदर्द", prevention: "Clean water, hygienic food, handwashing", hiPrevention: "स्वच्छ पानी, स्वच्छ भोजन, हाथ धोना", severity: "moderate" },
    { icon: "🫁", name: "Pneumonia", hi: "निमोनिया", symptoms: "Cough, fever, difficulty breathing, chest pain", hiSymptoms: "खांसी, बुखार, सांस लेने में कठिनाई, सीने में दर्द", prevention: "Vaccination, nutrition, avoid smoking", hiPrevention: "टीकाकरण, पोषण, धूम्रपान से बचें", severity: "severe" },
    { icon: "🩸", name: "Anemia", hi: "एनीमिया", symptoms: "Fatigue, weakness, pale skin, breathlessness", hiSymptoms: "थकान, कमजोरी, पीली त्वचा, सांस फूलना", prevention: "Iron-rich foods, supplements, treat infections", hiPrevention: "लौह युक्त (Iron-rich) खाद्य पदार्थ, सप्लीमेंट्स, संक्रमण का इलाज", severity: "moderate" },
    { icon: "🫀", name: "Hypertension", hi: "उच्च रक्तचाप", symptoms: "Headache, dizziness, blurred vision, often no symptoms", hiSymptoms: "सिरदर्द, चक्कर आना, धुंधला दिखाई देना, अक्सर कोई लक्षण नहीं", prevention: "Reduce salt, exercise, maintain healthy weight", hiPrevention: "नमक कम करें, व्यायाम करें, स्वस्थ वजन बनाए रखें", severity: "moderate" },
    { icon: "🍬", name: "Diabetes", hi: "मधुमेह", symptoms: "Frequent urination, excessive thirst, fatigue, weight loss", hiSymptoms: "बार-बार पेशाब आना, अत्यधिक प्यास, थकान, वजन कम होना", prevention: "Healthy diet, exercise, regular checkups", hiPrevention: "स्वस्थ आहार, व्यायाम, नियमित जांच", severity: "severe" },
    { icon: "❤️", name: "Heart Disease", hi: "हृदय रोग", symptoms: "Chest pain, shortness of breath, fatigue", hiSymptoms: "सीने में दर्द, सांस की तकलीफ, थकान", prevention: "Healthy lifestyle, avoid smoking, regular exercise", hiPrevention: "स्वस्थ जीवन शैली, धूम्रपान से बचें, नियमित व्यायाम", severity: "severe" },
    { icon: "🧠", name: "Stroke", hi: "स्ट्रोक", symptoms: "Sudden weakness, facial droop, speech difficulty", hiSymptoms: "अचानक कमजोरी, चेहरे का लटकना, बोलने में कठिनाई", prevention: "Control blood pressure, healthy lifestyle", hiPrevention: "रक्तचाप (Blood pressure) को नियंत्रित करें, स्वस्थ जीवन शैली", severity: "critical" },
    { icon: "🦠", name: "COVID-19", hi: "कोविड-19", symptoms: "Fever, cough, loss of taste, breathing difficulty", hiSymptoms: "बुखार, खांसी, स्वाद न आना, सांस लेने में कठिनाई", prevention: "Vaccination, hand hygiene, masks when needed", hiPrevention: "टीकाकरण, हाथ की स्वच्छता, जरूरत पड़ने पर मास्क", severity: "severe" },
    { icon: "🤧", name: "Influenza", hi: "फ्लू", symptoms: "Fever, cough, sore throat, body aches", hiSymptoms: "बुखार, खांसी, गले में खराश, शरीर में दर्द", prevention: "Vaccination, handwashing, avoid close contact", hiPrevention: "टीकाकरण, हाथ धोना, निकट संपर्क से बचें", severity: "moderate" },
    { icon: "💩", name: "Cholera", hi: "हैजा", symptoms: "Severe diarrhea, dehydration, vomiting", hiSymptoms: "गंभीर दस्त, निर्जलीकरण (Dehydration), उल्टी", prevention: "Safe water, sanitation, handwashing", hiPrevention: "सुरक्षित पानी, स्वच्छता, हाथ धोना", severity: "critical" },
    { icon: "🧫", name: "Hepatitis B", hi: "हेपेटाइटिस बी", symptoms: "Jaundice, fatigue, abdominal pain", hiSymptoms: "पीलिया, थकान, पेट दर्द", prevention: "Vaccination, safe injections, screened blood", hiPrevention: "टीकाकरण, सुरक्षित इंजेक्शन, जांची गई रक्त", severity: "severe" },
    { icon: "🫀", name: "Asthma", hi: "अस्थमा", symptoms: "Wheezing, shortness of breath, chest tightness", hiSymptoms: "घरघराहट, सांस की तकलीफ, सीने में जकड़न", prevention: "Avoid triggers, regular medication", hiPrevention: "ट्रिगर्स से बचें, नियमित दवा", severity: "moderate" },
    { icon: "🌬️", name: "COPD", hi: "सीओपीडी", symptoms: "Chronic cough, breathlessness, mucus production", hiSymptoms: "पुरानी खांसी, सांस फूलना, बलगम बनना", prevention: "Avoid smoking and air pollution", hiPrevention: "धूम्रपान और वायु प्रदूषण से बचें", severity: "severe" },
    { icon: "👁️", name: "Cataract", hi: "मोतियाबिंद", symptoms: "Blurred vision, sensitivity to light", hiSymptoms: "धुंधला दिखाई देना, प्रकाश के प्रति संवेदनशीलता", prevention: "Eye protection, regular eye checkups", hiPrevention: "आंखों की सुरक्षा, नियमित आंखों की जांच", severity: "moderate" },
    { icon: "🦴", name: "Osteoporosis", hi: "ऑस्टियोपोरोसिस", symptoms: "Bone weakness, fractures, back pain", hiSymptoms: "हड्डियों की कमजोरी, फ्रैक्चर, पीठ दर्द", prevention: "Calcium, vitamin D, exercise", hiPrevention: "कैल्शियम, विटामिन डी, व्यायाम", severity: "moderate" },
    { icon: "🦴", name: "Arthritis", hi: "गठिया", symptoms: "Joint pain, stiffness, swelling", hiSymptoms: "जोड़ों का दर्द, जकड़न, सूजन", prevention: "Healthy weight, exercise, injury prevention", hiPrevention: "स्वस्थ वजन, व्यायाम, चोट से बचाव", severity: "moderate" },
    { icon: "🩹", name: "Leprosy", hi: "कुष्ठ रोग", symptoms: "Skin patches, numbness, muscle weakness", hiSymptoms: "त्वचा पर धब्बे, सुन्नता, मांसपेशियों में कमजोरी", prevention: "Early diagnosis and treatment", hiPrevention: "शीघ्र निदान और उपचार", severity: "moderate" },
    { icon: "🦟", name: "Chikungunya", hi: "चिकनगुनिया", symptoms: "High fever, severe joint pain, rash", hiSymptoms: "तेज बुखार, जोड़ों में गंभीर दर्द, दाने", prevention: "Mosquito control and repellents", hiPrevention: "मच्छर नियंत्रण और विकर्षक", severity: "moderate" },
    { icon: "🤢", name: "Diarrheal Disease", hi: "दस्त", symptoms: "Loose stools, dehydration, abdominal cramps", hiSymptoms: "पतले दस्त, निर्जलीकरण, पेट में ऐंठन", prevention: "Clean water, sanitation, handwashing", hiPrevention: "स्वच्छ पानी, स्वच्छता, हाथ धोना", severity: "moderate" },
    { icon: "🧒", name: "Measles", hi: "खसरा", symptoms: "Fever, rash, cough, red eyes", hiSymptoms: "बुखार, दाने, खांसी, लाल आंखें", prevention: "MMR vaccination", hiPrevention: "एमएमआर (MMR) टीकाकरण", severity: "severe" },
    { icon: "👂", name: "Ear Infection", hi: "कान का संक्रमण", symptoms: "Ear pain, hearing difficulty, fever", hiSymptoms: "कान में दर्द, सुनने में कठिनाई, बुखार", prevention: "Good hygiene, timely treatment", hiPrevention: "अच्छी स्वच्छता, समय पर इलाज", severity: "mild" },
    { icon: "🧴", name: "Skin Infection", hi: "त्वचा संक्रमण", symptoms: "Redness, itching, swelling, pus", hiSymptoms: "लालिमा, खुजली, सूजन, मवाद", prevention: "Personal hygiene, clean clothing", hiPrevention: "व्यक्तिगत स्वच्छता, साफ कपड़े", severity: "mild" },
    { icon: "🦠", name: "HIV/AIDS", hi: "एचआईवी/एड्स", symptoms: "Weight loss, recurrent infections, fever", hiSymptoms: "वजन कम होना, बार-बार संक्रमण, बुखार", prevention: "Safe sex, screened blood, sterile needles", hiPrevention: "सुरक्षित यौन संबंध, जांचा हुआ रक्त, साफ सुईयां", severity: "severe" },
    { icon: "🧒", name: "Polio", hi: "पोलियो", symptoms: "Fever, muscle weakness, paralysis", hiSymptoms: "बुखार, मांसपेशियों में कमजोरी, लकवा (Paralysis)", prevention: "Polio vaccination", hiPrevention: "पोलियो टीकाकरण", severity: "critical" },
    { icon: "🩺", name: "Kidney Disease", hi: "गुर्दा रोग", symptoms: "Swelling, fatigue, reduced urine output", hiSymptoms: "सूजन, थकान, कम पेशाब आना", prevention: "Control diabetes and blood pressure", hiPrevention: "मधुमेह और रक्तचाप को नियंत्रित करें", severity: "severe" },
    { icon: "🫀", name: "Liver Disease", hi: "यकृत रोग", symptoms: "Jaundice, fatigue, abdominal swelling", hiSymptoms: "पीलिया, थकान, पेट में सूजन", prevention: "Avoid alcohol misuse, vaccination", hiPrevention: "शराब के दुरुपयोग से बचें, टीकाकरण", severity: "severe" },
    { icon: "🧠", name: "Epilepsy", hi: "मिर्गी", symptoms: "Seizures, loss of consciousness", hiSymptoms: "दौरे पड़ना, बेहोशी", prevention: "Medication adherence and medical care", hiPrevention: "दवा का पालन और चिकित्सा देखभाल", severity: "moderate" },
    { icon: "🦷", name: "Dental Caries", hi: "दंत क्षय", symptoms: "Tooth pain, cavities, sensitivity", hiSymptoms: "दांत दर्द, कैविटी, संवेदनशीलता", prevention: "Brushing, flossing, dental checkups", hiPrevention: "ब्रश करना, फ्लॉसिंग, दांतों की जांच", severity: "mild" }
  ]

  const sevColors: Record<string, string> = { mild: "bg-green-100 text-green-700", moderate: "bg-amber-100 text-amber-700", severe: "bg-red-100 text-red-700" }
  const tabs = [
    { key: "vaccines", icon: Syringe, label: en ? "Vaccination" : "टीकाकरण" },
    { key: "firstaid", icon: Heart, label: en ? "First Aid" : "प्राथमिक उपचार" },
    { key: "diseases", icon: Shield, label: en ? "Diseases" : "बीमारियां" },
    { key: "awareness", icon: BookOpen, label: en ? "Awareness" : "जागरूकता" },
    { key: "asha", icon: Stethoscope, label: en ? "ASHA / ANM Copilot" : "आशा / एएनएम सहायता" },
  ]


  // Filter diseases relevant to symptom result
  const relevantKeys: string[] = symptomResult?.relevantDiseases || []
  const filteredDiseases = relevantKeys.length > 0
    ? diseases.filter(d => relevantKeys.some(k => d.name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(d.name.toLowerCase())))
    : diseases

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{en ? "Health Information Hub" : "स्वास्थ्य जानकारी केंद्र"}</h1>
          {symptomResult?.possibleConditions?.length > 0 ? (
            <p className="text-muted-foreground text-sm mt-1">
              {en ? `Showing information for: ${symptomResult.possibleConditions.map((c: any) => c.name).slice(0,2).join(', ')}` : `के लिए जानकारी: ${symptomResult.possibleConditions.map((c: any) => c.name).slice(0,2).join(', ')}`}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">{en ? "Personalized health information based on your symptoms" : "आपके लक्षणों के आधार पर स्वास्थ्य जानकारी"}</p>
          )}
        </div>

        {/* Tab Bar */}
        <div className="flex gap-2 flex-wrap justify-center">
          {tabs.map(t => { const I = t.icon; return (
            <Button key={t.key} variant={tab === t.key ? "default" : "outline"} size="sm" onClick={() => setTab(t.key as any)} className={tab === t.key ? "gradient-primary text-white" : ""}>
              <I className="h-4 w-4 mr-1.5" />{t.label}
            </Button>
          )})}
        </div>

        {/* Government Schemes Link */}
        <div className="max-w-md mx-auto">
          <Button 
            onClick={() => router.push("/health-info/schemes")}
            className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md border border-green-500"
          >
            <Shield className="h-4 w-4 mr-2" />
            {en ? "View Government Health Schemes" : "सरकारी स्वास्थ्य योजनाएं देखें"}
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input className="w-full pl-9 h-9 border rounded-lg text-sm" placeholder={en ? "Search..." : "खोजें..."} value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Vaccines Tab */}
        {tab === "vaccines" && (
          <Card><CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="gradient-primary text-white">
                  <th className="p-3 text-left text-sm font-medium">Vaccine</th>
                  <th className="p-3 text-left text-sm font-medium">Age/Schedule</th>
                  <th className="p-3 text-left text-sm font-medium">Protects Against</th>
                </tr></thead>
                <tbody>{vaccines.filter(v => v.name.toLowerCase().includes(search.toLowerCase()) || v.disease.toLowerCase().includes(search.toLowerCase())).map((v, i) => (
                  <tr key={v.name} className={i % 2 === 0 ? "bg-white" : "bg-teal-50/50"}>
                    <td className="p-3 font-semibold text-sm">{v.name}</td>
                    <td className="p-3 text-sm text-muted-foreground">{en ? v.age : v.hi.split("—")[0]}</td>
                    <td className="p-3 text-sm">{en ? v.disease : v.hi.split("—")[1] || v.disease}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="p-3 bg-amber-50 border-t text-sm text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />{en ? "Contact your nearest Anganwadi or PHC for vaccination" : "टीकाकरण के लिए नजदीकी आंगनवाड़ी से संपर्क करें"}
            </div>
          </CardContent></Card>
        )}

        {/* First Aid Tab */}
        {tab === "firstaid" && (
          <div className="grid md:grid-cols-2 gap-4">
            {firstAid.filter(f => f.title.toLowerCase().includes(search.toLowerCase())).map(f => (
              <Card key={f.title} className="hover-lift">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3"><span className="text-2xl">{f.icon}</span><h3 className="font-semibold">{en ? f.title : f.hi}</h3></div>
                  <ol className="list-decimal list-inside space-y-1.5">
                    {(en ? f.steps : (f.hiSteps || f.steps)).map((s, i) => <li key={i} className="text-sm text-muted-foreground">{s}</li>)}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Diseases Tab */}
        {tab === "diseases" && (
          <div className="grid md:grid-cols-2 gap-4">
            {(filteredDiseases.length > 0 ? filteredDiseases : diseases).filter(d => d.name.toLowerCase().includes(search.toLowerCase())).map(d => (
              <Card key={d.name} className="hover-lift">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><span className="text-2xl">{d.icon}</span><h3 className="font-semibold">{en ? d.name : d.hi}</h3></div>
                    <Badge className={`text-xs ${sevColors[d.severity]}`}>{d.severity}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1"><strong>{en ? "Symptoms:" : "लक्षण:"}</strong> {en ? d.symptoms : (d.hiSymptoms || d.symptoms)}</p>
                  <p className="text-sm text-green-700"><strong>{en ? "Prevention:" : "रोकथाम:"}</strong> {en ? d.prevention : (d.hiPrevention || d.prevention)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Awareness Tab */}
        {tab === "awareness" && (
          <div className="grid md:grid-cols-2 gap-4">
            {[{ icon: "🚰", title: "Clean Water", hi: "स्वच्छ पानी", body: "Always boil or filter drinking water. Use ORS for diarrhea. Wash hands before eating.", hiBody: "पीने के पानी को हमेशा उबालें या फिल्टर करें। दस्त के लिए ORS का उपयोग करें। खाने से पहले हाथ धोएं।" },
              { icon: "🥗", title: "Nutrition", hi: "पोषण", body: "Eat iron-rich foods (spinach, beans). Include fruits daily. Breastfeed infants for 6 months.", hiBody: "आयरन युक्त खाद्य पदार्थ (पालक, बीन्स) खाएं। प्रतिदिन फलों को शामिल करें। 6 महीने तक शिशुओं को स्तनपान कराएं।" },
              { icon: "🤱", title: "Maternal Health", hi: "मातृ स्वास्थ्य", body: "4+ ANC checkups during pregnancy. Institutional delivery recommended. Take iron & folic acid.", hiBody: "गर्भावस्था के दौरान 4+ एएनसी जांच। संस्थागत प्रसव (Institutional delivery) की सलाह दी जाती है। आयरन और फोलिक एसिड लें।" },
              { icon: "👶", title: "Child Health", hi: "बाल स्वास्थ्य", body: "Complete all vaccinations. Monitor growth with weight chart. Seek help for fever in infants.", hiBody: "सभी टीकाकरण पूरे करें। वजन चार्ट से विकास की निगरानी करें। शिशुओं में बुखार होने पर मदद लें।" },
              { icon: "🧼", title: "Hygiene", hi: "स्वच्छता", body: "Wash hands with soap 20+ seconds. Use clean toilets. Keep surroundings clean.", hiBody: "साबुन से 20+ सेकंड तक हाथ धोएं। साफ शौचालयों का उपयोग करें। आसपास सफाई रखें।" },
              { icon: "🩺", title: "Regular Checkups", hi: "नियमित जांच", body: "Annual health checkup for adults. BP & sugar test after 40.", hiBody: "वयस्कों के लिए वार्षिक स्वास्थ्य जांच। 40 के बाद बीपी और शुगर की जांच।" },
            ].filter(a => a.title.toLowerCase().includes(search.toLowerCase())).map(a => (
              <Card key={a.title} className="hover-lift"><CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2"><span className="text-2xl">{a.icon}</span><h3 className="font-semibold">{en ? a.title : a.hi}</h3></div>
                <p className="text-sm text-muted-foreground">{en ? a.body : (a.hiBody || a.body)}</p>
              </CardContent></Card>
            ))}
          </div>
        )}

        {/* ASHA / ANM Community Health Worker Copilot Tab */}
        {tab === "asha" && (
          <div className="space-y-6">
            <Card className="border-emerald-200 bg-emerald-50/40">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-emerald-900">
                      <Stethoscope className="h-5 w-5 text-emerald-600" />
                      {en ? "ASHA & ANM Field Decision Support (IMCI & ANC)" : "आशा एवं एएनएम फील्ड नैदानिक सहायता (IMCI और ANC)"}
                    </h2>
                    <p className="text-xs text-emerald-700 mt-1">
                      {en
                        ? "100% Offline algorithmic triage based on WHO/UNICEF Child Illness protocols and National High-Risk Pregnancy guidelines."
                        : "डब्ल्यूएचओ/यूनिसेफ बाल रोग प्रोटोकॉल और राष्ट्रीय उच्च जोखिम गर्भावस्था दिशानिर्देशों पर आधारित पूर्णतः ऑफलाइन नैदानिक ट्राइएज।"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={copilotMode === "imci" ? "default" : "outline"}
                      onClick={() => setCopilotMode("imci")}
                      className={copilotMode === "imci" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-emerald-300 text-emerald-800"}
                    >
                      <Baby className="h-4 w-4 mr-1.5" />
                      {en ? "Child (IMCI)" : "बाल स्वास्थ्य"}
                    </Button>
                    <Button
                      size="sm"
                      variant={copilotMode === "anc" ? "default" : "outline"}
                      onClick={() => setCopilotMode("anc")}
                      className={copilotMode === "anc" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-emerald-300 text-emerald-800"}
                    >
                      <UserCheck className="h-4 w-4 mr-1.5" />
                      {en ? "Maternal (ANC)" : "मातृ स्वास्थ्य"}
                    </Button>
                  </div>
                </div>

                {/* IMCI Child Assessment Mode */}
                {copilotMode === "imci" && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Clinical Inputs */}
                      <div className="bg-white p-4 rounded-xl border border-emerald-100 space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 border-b pb-2">
                          {en ? "1. General Danger Signs (0-5 Years)" : "1. सामान्य खतरे के लक्षण (0-5 वर्ष)"}
                        </h3>

                        <div className="space-y-2.5">
                          {[
                            { key: "cannotDrinkOrBreastfeed", label: en ? "Unable to drink or breastfeed" : "पीने या स्तनपान करने में असमर्थ" },
                            { key: "vomitsEverything", label: en ? "Vomits everything ingested" : "सब कुछ उल्टी कर देता है" },
                            { key: "convulsions", label: en ? "History of convulsions/fits" : "दौरे या ऐंठन की स्थिति" },
                            { key: "lethargicOrUnconscious", label: en ? "Lethargic or unconscious" : "सुस्त या बेहोश" },
                          ].map((item) => (
                            <label key={item.key} className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={(imciData as any)[item.key]}
                                onChange={(e) => setImciData((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                              />
                              <span>{item.label}</span>
                            </label>
                          ))}
                        </div>

                        <h3 className="text-sm font-bold text-gray-900 border-b pb-2 pt-2">
                          {en ? "2. Respiratory & Diarrhea" : "2. श्वसन एवं दस्त संबंधी लक्षण"}
                        </h3>

                        <div className="space-y-2.5">
                          <label className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={imciData.hasCoughOrDifficultyBreathing}
                              onChange={(e) => setImciData((prev) => ({ ...prev, hasCoughOrDifficultyBreathing: e.target.checked }))}
                              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            <span>{en ? "Has cough or breathing difficulty" : "खांसी या सांस लेने में कठिनाई है"}</span>
                          </label>

                          {imciData.hasCoughOrDifficultyBreathing && (
                            <div className="pl-6 space-y-2">
                              <label className="block text-xs text-gray-600">
                                {en ? `Respiratory Rate: ${imciData.respiratoryRate} breaths/min` : `श्वसन दर: ${imciData.respiratoryRate} सांस/मिनट`}
                                <input
                                  type="range"
                                  min="20"
                                  max="80"
                                  value={imciData.respiratoryRate || 40}
                                  onChange={(e) => setImciData((prev) => ({ ...prev, respiratoryRate: Number(e.target.value) }))}
                                  className="w-full mt-1 accent-emerald-600"
                                />
                              </label>

                              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(imciData.chestIndrawing)}
                                  onChange={(e) => setImciData((prev) => ({ ...prev, chestIndrawing: e.target.checked }))}
                                  className="rounded text-emerald-600 h-3.5 w-3.5"
                                />
                                <span>{en ? "Chest indrawing present" : "छाती का अंदर धंसना"}</span>
                              </label>
                            </div>
                          )}

                          <label className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={imciData.hasDiarrhea}
                              onChange={(e) => setImciData((prev) => ({ ...prev, hasDiarrhea: e.target.checked }))}
                              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            <span>{en ? "Has diarrhea" : "दस्त (डायरिया) है"}</span>
                          </label>

                          {imciData.hasDiarrhea && (
                            <div className="pl-6 space-y-1.5">
                              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(imciData.bloodInStool)}
                                  onChange={(e) => setImciData((prev) => ({ ...prev, bloodInStool: e.target.checked }))}
                                  className="rounded text-emerald-600 h-3.5 w-3.5"
                                />
                                <span>{en ? "Blood in stool (Dysentery)" : "मल में खून (पेचिश)"}</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(imciData.sunkenEyes)}
                                  onChange={(e) => setImciData((prev) => ({ ...prev, sunkenEyes: e.target.checked }))}
                                  className="rounded text-emerald-600 h-3.5 w-3.5"
                                />
                                <span>{en ? "Sunken eyes (Dehydration)" : "धंसी हुई आंखें (निर्जलीकरण)"}</span>
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Triage Output Card */}
                      <div className="space-y-4">
                        <div
                          className={`p-5 rounded-xl border-2 transition-all ${
                            imciResult.urgency === "EMERGENCY_RED"
                              ? "bg-red-50 border-red-300 text-red-950"
                              : imciResult.urgency === "URGENT_YELLOW"
                              ? "bg-amber-50 border-amber-300 text-amber-950"
                              : "bg-emerald-50 border-emerald-300 text-emerald-950"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <Badge
                              className={`text-xs uppercase font-bold px-2.5 py-1 ${
                                imciResult.urgency === "EMERGENCY_RED"
                                  ? "bg-red-600 text-white"
                                  : imciResult.urgency === "URGENT_YELLOW"
                                  ? "bg-amber-600 text-white"
                                  : "bg-emerald-600 text-white"
                              }`}
                            >
                              {imciResult.urgency === "EMERGENCY_RED"
                                ? en ? "Emergency Red (Immediate Referral)" : "आपातकालीन लाल (तुरंत रेफरल)"
                                : imciResult.urgency === "URGENT_YELLOW"
                                ? en ? "Urgent Yellow (PHC/CHC within 24h)" : "गंभीर पीला (24 घंटे में रेफरल)"
                                : en ? "Routine Green (Home Care)" : "सामान्य हरा (घरेलू देखभाल)"}
                            </Badge>

                            {imciResult.requiresImmediateReferral ? (
                              <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4" /> 108 Ambulance
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4" /> ASHA Protocol
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold mb-2">
                            {en ? "Clinical Classifications:" : "नैदानिक वर्गीकरण:"}
                          </h4>
                          <ul className="text-xs space-y-1 mb-4 list-disc list-inside">
                            {(en ? imciResult.classifications : imciResult.hindiClassifications).map((c, i) => (
                              <li key={i} className="font-semibold">{c}</li>
                            ))}
                          </ul>

                          <h4 className="text-sm font-bold mb-2">
                            {en ? "Mandated Action Steps:" : "निर्धारित आवश्यक कदम:"}
                          </h4>
                          <ul className="text-xs space-y-1 list-disc list-inside">
                            {(en ? imciResult.recommendedActions : imciResult.hindiRecommendedActions).map((a, i) => (
                              <li key={i}>{a}</li>
                            ))}
                          </ul>

                          {imciResult.requiresImmediateReferral && (
                            <div className="mt-4 pt-3 border-t border-red-200 flex gap-2">
                              <a
                                href="tel:108"
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg text-center transition-colors"
                              >
                                {en ? "Dial 108 Ambulance" : "108 एम्बुलेंस डायल करें"}
                              </a>
                              <button
                                onClick={() => router.push("/locations")}
                                className="flex-1 bg-white border border-red-300 text-red-700 text-xs font-bold py-2 rounded-lg text-center hover:bg-red-50 transition-colors"
                              >
                                {en ? "Find Nearest Hospital" : "निकटतम अस्पताल देखें"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ANC Maternal Assessment Mode */}
                {copilotMode === "anc" && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Clinical Inputs */}
                      <div className="bg-white p-4 rounded-xl border border-emerald-100 space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 border-b pb-2">
                          {en ? "High-Risk Pregnancy Danger Signs" : "उच्च जोखिम गर्भावस्था के खतरे के संकेत"}
                        </h3>

                        <div className="space-y-2.5">
                          {[
                            { key: "vaginalBleeding", label: en ? "Vaginal bleeding / spotting" : "योनि से रक्तस्राव या खून आना" },
                            { key: "severeHeadacheWithBlurredVision", label: en ? "Severe headache with blurred vision (Pre-eclampsia)" : "धुंधली दृष्टि के साथ तेज सिरदर्द (प्री-एक्लेमप्सिया)" },
                            { key: "swellingFaceAndHands", label: en ? "Puffy swelling in face and hands" : "चेहरे और हाथों में अत्यधिक सूजन" },
                            { key: "highFever", label: en ? "High fever (> 101°F)" : "तेज बुखार (> 101°F)" },
                            { key: "foulSmellingDischarge", label: en ? "Foul-smelling vaginal discharge" : "दुर्गंधयुक्त योनि स्राव" },
                            { key: "reducedFetalMovements", label: en ? "Reduced / absent baby movements" : "गर्भ में शिशु की हलचल कम या बंद" },
                          ].map((item) => (
                            <label key={item.key} className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={(ancData as any)[item.key]}
                                onChange={(e) => setAncData((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                              />
                              <span>{item.label}</span>
                            </label>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                          <div>
                            <label className="text-xs text-gray-600 block mb-1">
                              {en ? "Systolic BP (mmHg)" : "सिस्टोलिक बीपी"}
                            </label>
                            <input
                              type="number"
                              value={ancData.systolicBp || 120}
                              onChange={(e) => setAncData((prev) => ({ ...prev, systolicBp: Number(e.target.value) }))}
                              className="w-full text-xs p-2 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 block mb-1">
                              {en ? "Diastolic BP (mmHg)" : "डायस्टोलिक बीपी"}
                            </label>
                            <input
                              type="number"
                              value={ancData.diastolicBp || 80}
                              onChange={(e) => setAncData((prev) => ({ ...prev, diastolicBp: Number(e.target.value) }))}
                              className="w-full text-xs p-2 border rounded-lg"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Triage Output Card */}
                      <div className="space-y-4">
                        <div
                          className={`p-5 rounded-xl border-2 transition-all ${
                            ancResult.urgency === "EMERGENCY_RED"
                              ? "bg-red-50 border-red-300 text-red-950"
                              : ancResult.urgency === "URGENT_YELLOW"
                              ? "bg-amber-50 border-amber-300 text-amber-950"
                              : "bg-emerald-50 border-emerald-300 text-emerald-950"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <Badge
                              className={`text-xs uppercase font-bold px-2.5 py-1 ${
                                ancResult.urgency === "EMERGENCY_RED"
                                  ? "bg-red-600 text-white"
                                  : ancResult.urgency === "URGENT_YELLOW"
                                  ? "bg-amber-600 text-white"
                                  : "bg-emerald-600 text-white"
                              }`}
                            >
                              {ancResult.urgency === "EMERGENCY_RED"
                                ? en ? "Emergency Red (Hospitalize)" : "आपातकालीन लाल (अस्पताल में भर्ती)"
                                : ancResult.urgency === "URGENT_YELLOW"
                                ? en ? "Urgent Yellow (ANC Clinic)" : "गंभीर पीला (एएनसी क्लीनिक)"
                                : en ? "Routine Green (Normal ANC)" : "सामान्य हरा (नियमित जांच)"}
                            </Badge>

                            {ancResult.requiresImmediateHospitalization ? (
                              <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4" /> FRU / Hospital
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4" /> Safe Pregnancy
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold mb-2">
                            {en ? "Maternal Risk Diagnosis:" : "मातृ जोखिम वर्गीकरण:"}
                          </h4>
                          <ul className="text-xs space-y-1 mb-4 list-disc list-inside">
                            {(en ? ancResult.highRiskCategory : ancResult.hindiHighRiskCategory).map((c, i) => (
                              <li key={i} className="font-semibold">{c}</li>
                            ))}
                          </ul>

                          <h4 className="text-sm font-bold mb-2">
                            {en ? "Referral Directives:" : "रेफरल निर्देश:"}
                          </h4>
                          <ul className="text-xs space-y-1 list-disc list-inside">
                            {(en ? ancResult.recommendations : ancResult.hindiRecommendations).map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>

                          {ancResult.requiresImmediateHospitalization && (
                            <div className="mt-4 pt-3 border-t border-red-200 flex gap-2">
                              <a
                                href="tel:108"
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg text-center transition-colors"
                              >
                                {en ? "Call 108 (Obstetric Ambulance)" : "108 एम्बुलेंस बुलाएं"}
                              </a>
                              <button
                                onClick={() => router.push("/locations")}
                                className="flex-1 bg-white border border-red-300 text-red-700 text-xs font-bold py-2 rounded-lg text-center hover:bg-red-50 transition-colors"
                              >
                                {en ? "Nearest FRU / Hospital" : "निकटतम एफआरयू / अस्पताल"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
