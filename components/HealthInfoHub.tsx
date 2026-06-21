"use client"
import { useState } from "react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Search, Syringe, Heart, Shield, BookOpen, AlertTriangle } from "lucide-react"

interface HealthInfoHubProps {
  language: string
  symptomResult?: any | null
  setCurrentPage?: (page: string) => void
}

export function HealthInfoHub({ language, symptomResult, setCurrentPage }: HealthInfoHubProps) {
  const en = language === "en"
  const hasRelevantDiseases = (symptomResult?.relevantDiseases?.length ?? 0) > 0
  const [tab, setTab] = useState<"vaccines" | "firstaid" | "diseases" | "awareness">(
    hasRelevantDiseases ? "diseases" : "vaccines"
  )
  const [search, setSearch] = useState("")

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
    { icon: "🩹", title: "Cuts & Wounds", hi: "कट और घाव", steps: ["Clean wound with clean water", "Apply pressure to stop bleeding", "Cover with clean cloth/bandage", "Seek medical help if deep"] },
    { icon: "🔥", title: "Burns", hi: "जलना", steps: ["Cool with running water 10+ min", "Do NOT use ice or butter", "Cover loosely with clean cloth", "Seek help for large burns"] },
    { icon: "🐍", title: "Snake Bite", hi: "सांप काटना", steps: ["Keep patient still and calm", "Keep bite below heart level", "Remove jewelry near bite", "Rush to hospital — call 108"] },
    { icon: "😮", title: "Choking", hi: "गला घुटना", steps: ["Encourage coughing", "5 back blows between shoulders", "5 abdominal thrusts", "Call 108 if not resolved"] },
    { icon: "❤️", title: "Heart Attack", hi: "दिल का दौरा", steps: ["Call 108 immediately", "Sit/lie comfortably", "Loosen tight clothing", "Give aspirin if conscious"] },
    { icon: "🌡️", title: "High Fever", hi: "तेज बुखार", steps: ["Give paracetamol as directed", "Keep patient hydrated", "Wet cloth on forehead", "Seek help if >103°F"] },
    { icon: "💧", title: "Dehydration", hi: "निर्जलीकरण", steps: ["Give ORS solution", "Small sips frequently", "Continue breastfeeding (infants)", "Seek help if no urine for 6 hrs"] },
    { icon: "⚡", title: "Electric Shock", hi: "बिजली का झटका", steps: ["Switch off power source first", "Do NOT touch with bare hands", "Check breathing/pulse", "Start CPR if needed, call 108"] },
  ]

  const diseases = [
    { icon: "🦟", name: "Malaria", hi: "मलेरिया", symptoms: "Fever, chills, sweating, headache, body aches", prevention: "Mosquito nets, repellent, drain stagnant water", severity: "moderate" },
    { icon: "🦟", name: "Dengue", hi: "डेंगू", symptoms: "High fever, severe headache, joint/muscle pain, rash", prevention: "Remove stagnant water, use repellent, wear long sleeves", severity: "severe" },
    { icon: "🫁", name: "Tuberculosis", hi: "क्षय रोग", symptoms: "Persistent cough >2 weeks, weight loss, night sweats", prevention: "BCG vaccine, ventilation, avoid close contact", severity: "severe" },
    { icon: "💧", name: "Typhoid", hi: "टाइफाइड", symptoms: "Sustained fever, weakness, stomach pain, headache", prevention: "Clean water, hygienic food, handwashing", severity: "moderate" },
    { icon: "🫁", name: "Pneumonia", hi: "निमोनिया", symptoms: "Cough, fever, difficulty breathing, chest pain", prevention: "Vaccination, nutrition, avoid smoking", severity: "severe" },
    { icon: "🩸", name: "Anemia", hi: "एनीमिया", symptoms: "Fatigue, weakness, pale skin, breathlessness", prevention: "Iron-rich foods, supplements, treat infections", severity: "moderate" },

    { icon: "🫀", name: "Hypertension", hi: "उच्च रक्तचाप", symptoms: "Headache, dizziness, blurred vision, often no symptoms", prevention: "Reduce salt, exercise, maintain healthy weight", severity: "moderate" },
    { icon: "🍬", name: "Diabetes", hi: "मधुमेह", symptoms: "Frequent urination, excessive thirst, fatigue, weight loss", prevention: "Healthy diet, exercise, regular checkups", severity: "severe" },
    { icon: "❤️", name: "Heart Disease", hi: "हृदय रोग", symptoms: "Chest pain, shortness of breath, fatigue", prevention: "Healthy lifestyle, avoid smoking, regular exercise", severity: "severe" },
    { icon: "🧠", name: "Stroke", hi: "स्ट्रोक", symptoms: "Sudden weakness, facial droop, speech difficulty", prevention: "Control blood pressure, healthy lifestyle", severity: "critical" },
    { icon: "🦠", name: "COVID-19", hi: "कोविड-19", symptoms: "Fever, cough, loss of taste, breathing difficulty", prevention: "Vaccination, hand hygiene, masks when needed", severity: "severe" },
    { icon: "🤧", name: "Influenza", hi: "फ्लू", symptoms: "Fever, cough, sore throat, body aches", prevention: "Vaccination, handwashing, avoid close contact", severity: "moderate" },
    { icon: "💩", name: "Cholera", hi: "हैजा", symptoms: "Severe diarrhea, dehydration, vomiting", prevention: "Safe water, sanitation, handwashing", severity: "critical" },
    { icon: "🧫", name: "Hepatitis B", hi: "हेपेटाइटिस बी", symptoms: "Jaundice, fatigue, abdominal pain", prevention: "Vaccination, safe injections, screened blood", severity: "severe" },
    { icon: "🫀", name: "Asthma", hi: "अस्थमा", symptoms: "Wheezing, shortness of breath, chest tightness", prevention: "Avoid triggers, regular medication", severity: "moderate" },
    { icon: "🌬️", name: "COPD", hi: "सीओपीडी", symptoms: "Chronic cough, breathlessness, mucus production", prevention: "Avoid smoking and air pollution", severity: "severe" },
    { icon: "👁️", name: "Cataract", hi: "मोतियाबिंद", symptoms: "Blurred vision, sensitivity to light", prevention: "Eye protection, regular eye checkups", severity: "moderate" },
    { icon: "🦴", name: "Osteoporosis", hi: "ऑस्टियोपोरोसिस", symptoms: "Bone weakness, fractures, back pain", prevention: "Calcium, vitamin D, exercise", severity: "moderate" },
    { icon: "🦴", name: "Arthritis", hi: "गठिया", symptoms: "Joint pain, stiffness, swelling", prevention: "Healthy weight, exercise, injury prevention", severity: "moderate" },
    { icon: "🩹", name: "Leprosy", hi: "कुष्ठ रोग", symptoms: "Skin patches, numbness, muscle weakness", prevention: "Early diagnosis and treatment", severity: "moderate" },
    { icon: "🦟", name: "Chikungunya", hi: "चिकनगुनिया", symptoms: "High fever, severe joint pain, rash", prevention: "Mosquito control and repellents", severity: "moderate" },
    { icon: "🤢", name: "Diarrheal Disease", hi: "दस्त", symptoms: "Loose stools, dehydration, abdominal cramps", prevention: "Clean water, sanitation, handwashing", severity: "moderate" },
    { icon: "🧒", name: "Measles", hi: "खसरा", symptoms: "Fever, rash, cough, red eyes", prevention: "MMR vaccination", severity: "severe" },
    { icon: "👂", name: "Ear Infection", hi: "कान का संक्रमण", symptoms: "Ear pain, hearing difficulty, fever", prevention: "Good hygiene, timely treatment", severity: "mild" },
    { icon: "🧴", name: "Skin Infection", hi: "त्वचा संक्रमण", symptoms: "Redness, itching, swelling, pus", prevention: "Personal hygiene, clean clothing", severity: "mild" },
    { icon: "🦠", name: "HIV/AIDS", hi: "एचआईवी/एड्स", symptoms: "Weight loss, recurrent infections, fever", prevention: "Safe sex, screened blood, sterile needles", severity: "severe" },
    { icon: "🧒", name: "Polio", hi: "पोलियो", symptoms: "Fever, muscle weakness, paralysis", prevention: "Polio vaccination", severity: "critical" },
    { icon: "🩺", name: "Kidney Disease", hi: "गुर्दा रोग", symptoms: "Swelling, fatigue, reduced urine output", prevention: "Control diabetes and blood pressure", severity: "severe" },
    { icon: "🫀", name: "Liver Disease", hi: "यकृत रोग", symptoms: "Jaundice, fatigue, abdominal swelling", prevention: "Avoid alcohol misuse, vaccination", severity: "severe" },
    { icon: "🧠", name: "Epilepsy", hi: "मिर्गी", symptoms: "Seizures, loss of consciousness", prevention: "Medication adherence and medical care", severity: "moderate" },
    { icon: "🦷", name: "Dental Caries", hi: "दंत क्षय", symptoms: "Tooth pain, cavities, sensitivity", prevention: "Brushing, flossing, dental checkups", severity: "mild" }
  ]

  const sevColors: Record<string, string> = { mild: "bg-green-100 text-green-700", moderate: "bg-amber-100 text-amber-700", severe: "bg-red-100 text-red-700" }
  const tabs = [
    { key: "vaccines", icon: Syringe, label: en ? "Vaccination" : "टीकाकरण" },
    { key: "firstaid", icon: Heart, label: en ? "First Aid" : "प्राथमिक उपचार" },
    { key: "diseases", icon: Shield, label: en ? "Diseases" : "बीमारियां" },
    { key: "awareness", icon: BookOpen, label: en ? "Awareness" : "जागरूकता" },
  ]

  // If no symptom result, show gate screen
  if (!symptomResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm animate-fade-in">
          <div className="text-6xl mb-4">🩺</div>
          <h2 className="text-xl font-bold mb-2">{en ? "Check Your Symptoms First" : "पहले लक्षण जांचें"}</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {en
              ? "Health information is personalized based on your symptom check. Please complete the symptom checker to get relevant information."
              : "स्वास्थ्य जानकारी आपके लक्षणों के आधार पर व्यक्तिगत होती है। प्रासंगिक जानकारी पाने के लिए पहले लक्षण जांचें।"}
          </p>
          {setCurrentPage && (
            <button onClick={() => setCurrentPage("symptom-checker")}
              className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
              {en ? "Start Symptom Checker" : "लक्षण जांचकर्ता शुरू करें"}
            </button>
          )}
        </div>
      </div>
    )
  }

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
                    {f.steps.map((s, i) => <li key={i} className="text-sm text-muted-foreground">{s}</li>)}
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
                  <p className="text-sm text-muted-foreground mb-1"><strong>Symptoms:</strong> {d.symptoms}</p>
                  <p className="text-sm text-green-700"><strong>Prevention:</strong> {d.prevention}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Awareness Tab */}
        {tab === "awareness" && (
          <div className="grid md:grid-cols-2 gap-4">
            {[{ icon: "🚰", title: "Clean Water", hi: "स्वच्छ पानी", body: "Always boil or filter drinking water. Use ORS for diarrhea. Wash hands before eating." },
              { icon: "🥗", title: "Nutrition", hi: "पोषण", body: "Eat iron-rich foods (spinach, beans). Include fruits daily. Breastfeed infants for 6 months." },
              { icon: "🤱", title: "Maternal Health", hi: "मातृ स्वास्थ्य", body: "4+ ANC checkups during pregnancy. Institutional delivery recommended. Take iron & folic acid." },
              { icon: "👶", title: "Child Health", hi: "बाल स्वास्थ्य", body: "Complete all vaccinations. Monitor growth with weight chart. Seek help for fever in infants." },
              { icon: "🧼", title: "Hygiene", hi: "स्वच्छता", body: "Wash hands with soap 20+ seconds. Use clean toilets. Keep surroundings clean." },
              { icon: "🩺", title: "Regular Checkups", hi: "नियमित जांच", body: "Annual health checkup for adults. BP & sugar test after 40." },
            ].filter(a => a.title.toLowerCase().includes(search.toLowerCase())).map(a => (
              <Card key={a.title} className="hover-lift"><CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2"><span className="text-2xl">{a.icon}</span><h3 className="font-semibold">{en ? a.title : a.hi}</h3></div>
                <p className="text-sm text-muted-foreground">{a.body}</p>
              </CardContent></Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
