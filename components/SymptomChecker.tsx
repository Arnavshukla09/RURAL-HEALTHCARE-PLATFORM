"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, CheckCircle,
  Brain, Eye, Ear, Heart, Wind, Droplet, Thermometer, User,
  Loader2, Stethoscope, Home, MapPin, Send, Bot
} from "lucide-react"

interface SymptomCheckerProps {
  setCurrentPage: (page: string) => void
  language: string
}

// ── Expanded body-part symptom database ────────────────────────
const SYMPTOM_DB: Record<string, string[]> = {
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

const BODY_PARTS = [
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

// Hindi translations for symptoms (best-effort)
const SYMPTOM_HI: Record<string, string> = {
  "Severe headache": "तेज सिरदर्द", "Mild headache": "हल्का सिरदर्द", "Dizziness/vertigo": "चक्कर/वर्टिगो",
  "Fainting": "बेहोशी", "Confusion": "भ्रम", "Chest pain": "सीने में दर्द", "Shortness of breath": "सांस की तकलीफ",
  "High fever (>103°F)": "तेज बुखार (>103°F)", "Low fever (99–102°F)": "हल्का बुखार", "Chills/shivering": "ठंड/कंपकंपी",
  "Fatigue/exhaustion": "थकान", "Nausea": "मतली", "Vomiting": "उल्टी", "Diarrhea": "दस्त",
  "Severe abdominal pain": "तेज पेट दर्द", "Mild stomach ache": "हल्का पेट दर्द", "Cough with blood": "खून वाली खांसी",
  "Wheezing": "घर्र-घर्र की आवाज", "Sore throat": "गले में दर्द", "Rash/itching": "दाने/खुजली",
  "Burning urination": "पेशाब में जलन", "Leg pain": "पैर दर्द", "Lower back pain": "कमर दर्द",
  "Unexplained weight loss": "अकारण वजन घटना", "Night sweats": "रात में पसीना",
}

// Urgency colour mapping
const URGENCY_STYLES: Record<string, { bg: string; border: string; icon: string; iconClass: string }> = {
  emergency: { bg: "bg-red-50", border: "border-red-400", icon: "🚨", iconClass: "text-red-600" },
  high:      { bg: "bg-orange-50", border: "border-orange-400", icon: "⚠️", iconClass: "text-orange-600" },
  medium:    { bg: "bg-yellow-50", border: "border-yellow-400", icon: "🩺", iconClass: "text-yellow-600" },
  low:       { bg: "bg-green-50", border: "border-green-400", icon: "✅", iconClass: "text-green-600" },
}

export function SymptomChecker({ setCurrentPage, language }: SymptomCheckerProps) {
  const en = language === "en"

  // Step state
  const [step, setStep] = useState(1)
  const [patientInfo, setPatientInfo] = useState({ age: "", gender: "male", temperature: "", tempUnit: "F", daysSick: "1" })
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null)
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [aiResult, setAiResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Inline chat state
  const [chatInput, setChatInput] = useState("")
  const [chatMessages, setChatMessages] = useState<{role: "user" | "assistant", content: string}[]>([])
  const [chatLoading, setChatLoading] = useState(false)

  const symptomList = selectedBodyPart ? SYMPTOM_DB[selectedBodyPart] || [] : []

  const toggleSymptom = (s: string) =>
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const handleAnalyze = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/symptom-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: patientInfo.age || "unknown",
          gender: patientInfo.gender,
          temperature: patientInfo.temperature,
          tempUnit: patientInfo.tempUnit,
          daysSick: patientInfo.daysSick,
          bodyPart: selectedBodyPart,
          symptoms: selectedSymptoms,
          language,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAiResult(data)
      setStep(4)
      
      const promptText = en 
        ? `My symptoms are: ${selectedSymptoms.join(", ")}. Temperature: ${patientInfo.temperature ? patientInfo.temperature + "°" + patientInfo.tempUnit : 'normal'}. Duration: ${patientInfo.daysSick} days. The analysis urgency is '${data.urgency}'. What are the best home remedies, and what exact steps should I take based on this severity?`
        : `मेरे लक्षण हैं: ${selectedSymptoms.map(s => SYMPTOM_HI[s] || s).join(", ")}। तापमान: ${patientInfo.temperature ? patientInfo.temperature + "°" + patientInfo.tempUnit : 'सामान्य'}। अवधि: ${patientInfo.daysSick} दिन। विश्लेषण की गंभीरता '${data.urgency === 'emergency' ? 'आपातकालीन' : data.urgency === 'high' ? 'उच्च' : data.urgency === 'medium' ? 'मध्यम' : 'कम'}' है। सबसे अच्छे घरेलू उपचार क्या हैं, और मुझे क्या कदम उठाने चाहिए?`
      
      setChatInput(promptText)
    } catch (e: any) {
      setError(e.message || "Analysis failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }


  const reset = () => {
    setStep(1); setSelectedBodyPart(null); setSelectedSymptoms([])
    setAiResult(null); setError(""); setPatientInfo({ age: "", gender: "male", temperature: "", tempUnit: "F", daysSick: "1" })
    setChatMessages([]); setChatInput("")
  }

  const handleChat = async () => {
    const text = chatInput.trim()
    if (!text || chatLoading) return

    const userMsg = { role: "user" as const, content: text }
    const newHistory = [...chatMessages, userMsg]
    setChatMessages(newHistory)
    setChatInput("")
    setChatLoading(true)

    const apiMessage = chatMessages.length === 0
      ? `Context: My symptom analysis result was: ${JSON.stringify({ urgency: aiResult?.urgency, conditions: aiResult?.possibleConditions })}. Please answer my follow up question: ${text}`
      : text

    const apiHistory = chatMessages.map((msg, i) => 
      i === 0 ? { ...msg, content: `Context: My symptom analysis result was: ${JSON.stringify({ urgency: aiResult?.urgency, conditions: aiResult?.possibleConditions })}. Please answer my follow up question: ${msg.content}` } : msg
    )

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: apiMessage,
          history: apiHistory,
          language,
        }),
      })

      if (!response.ok) throw new Error("API error")
      const data = await response.json()
      setChatMessages(prev => [...prev, { role: "assistant", content: data.reply }])
    } catch {
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: en ? "Connection error. Please try again." : "कनेक्शन त्रुटि। कृपया पुनः प्रयास करें।"
      }])
    } finally {
      setChatLoading(false)
    }
  }

  const urgencyStyle = aiResult ? URGENCY_STYLES[aiResult.urgency] || URGENCY_STYLES.low : URGENCY_STYLES.low

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-background p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">{en ? "Symptom Checker" : "लक्षण जांचकर्ता"}</h1>
          <p className="text-muted-foreground text-sm mt-1">{en ? "AI-powered health assessment" : "AI-संचालित स्वास्थ्य मूल्यांकन"}</p>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`flex items-center ${s < 4 ? "flex-1 max-w-16" : ""}`}>
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s <= step ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-500"
                }`}>{s}</div>
                {s < 4 && <div className={`flex-1 h-1 mx-1 rounded ${s < step ? "bg-teal-600" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-8 text-xs text-muted-foreground mt-1">
            {[
              en ? "Info" : "जानकारी",
              en ? "Body Part" : "अंग",
              en ? "Symptoms" : "लक्षण",
              en ? "AI Analysis" : "विश्लेषण"
            ].map((l, i) => <span key={i}>{l}</span>)}
          </div>
        </div>

        {/* ── STEP 1: Patient Info ── */}
        {step === 1 && (
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-teal-600" />{en ? "Tell us about yourself" : "अपने बारे में बताएं"}</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">{en ? "Age" : "उम्र"}</label>
                  <input type="number" min="1" max="120"
                    value={patientInfo.age}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === "" || Number(val) > 0) {
                        setPatientInfo(p => ({ ...p, age: val }));
                      }
                    }}
                    placeholder={en ? "e.g. 35" : "जैसे 35"}
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">{en ? "Gender" : "लिंग"}</label>
                  <select value={patientInfo.gender}
                    onChange={e => setPatientInfo(p => ({ ...p, gender: e.target.value }))}
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:border-teal-500 bg-white">
                    <option value="male">{en ? "Male" : "पुरुष"}</option>
                    <option value="female">{en ? "Female" : "महिला"}</option>
                    <option value="other">{en ? "Other" : "अन्य"}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium block">{en ? "Temperature" : "तापमान"}</label>
                    <div className="flex gap-1 text-xs">
                      <button type="button" onClick={() => setPatientInfo(p => ({...p, tempUnit: 'C'}))} className={`px-2 rounded ${patientInfo.tempUnit === 'C' ? 'bg-teal-600 text-white' : 'bg-gray-200'}`}>°C</button>
                      <button type="button" onClick={() => setPatientInfo(p => ({...p, tempUnit: 'F'}))} className={`px-2 rounded ${patientInfo.tempUnit === 'F' ? 'bg-teal-600 text-white' : 'bg-gray-200'}`}>°F</button>
                    </div>
                  </div>
                  <input type="number" step="0.1"
                    value={patientInfo.temperature}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === "" || Number(val) > 0) {
                        setPatientInfo(p => ({ ...p, temperature: val }));
                      }
                    }}
                    placeholder={patientInfo.tempUnit === "F" ? (en ? "e.g. 101.5" : "जैसे 101.5") : (en ? "e.g. 38.5" : "जैसे 38.5")}
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">{en ? "How many days sick?" : "कितने दिनों से बीमार?"}</label>
                  <select value={patientInfo.daysSick}
                    onChange={e => setPatientInfo(p => ({ ...p, daysSick: e.target.value }))}
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:border-teal-500 bg-white">
                    {["1", "2", "3", "4-7", "7-14", "14+"].map(d => <option key={d} value={d}>{d} {en ? "day(s)" : "दिन"}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} className="gradient-primary text-white">
                  {en ? "Next" : "अगला"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── STEP 2: Body Part ── */}
        {step === 2 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">{en ? "Where does it hurt?" : "दर्द कहाँ है?"}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {BODY_PARTS.map(part => {
                  const Icon = part.icon
                  const sel = selectedBodyPart === part.id
                  return (
                    <button key={part.id} onClick={() => setSelectedBodyPart(part.id)}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all hover:shadow-md ${
                        sel ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white hover:border-teal-300"
                      }`}>
                      <Icon className={`h-7 w-7 ${sel ? "text-teal-600" : "text-gray-400"}`} />
                      <span className="text-xs font-medium text-center leading-tight">{en ? part.label : part.labelHi}</span>
                    </button>
                  )
                })}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" />{en ? "Back" : "पीछे"}</Button>
                <Button onClick={() => setStep(3)} disabled={!selectedBodyPart} className="gradient-primary text-white">
                  {en ? "Next" : "अगला"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── STEP 3: Symptoms ── */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{en ? "Select your symptoms" : "अपने लक्षण चुनें"}</CardTitle>
                <Badge variant="outline">{selectedSymptoms.length} {en ? "selected" : "चयनित"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{en ? "Select all that apply" : "जो भी लागू हो चुनें"}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {symptomList.map(symptom => {
                  const sel = selectedSymptoms.includes(symptom)
                  const label = !en && SYMPTOM_HI[symptom] ? SYMPTOM_HI[symptom] : symptom
                  return (
                    <button key={symptom} onClick={() => toggleSymptom(symptom)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left text-sm transition-all ${
                        sel ? "border-teal-500 bg-teal-50 text-teal-800" : "border-gray-200 bg-white hover:border-teal-300"
                      }`}>
                      {sel ? <CheckCircle className="h-4 w-4 text-teal-600 flex-shrink-0" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />}
                      {label}
                    </button>
                  )
                })}
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="mr-2 h-4 w-4" />{en ? "Back" : "पीछे"}</Button>
                <Button onClick={handleAnalyze} disabled={selectedSymptoms.length === 0 || loading} className="gradient-primary text-white">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{en ? "Analyzing..." : "विश्लेषण..."}</> : <>{en ? "Get AI Analysis" : "AI विश्लेषण"} <Stethoscope className="ml-2 h-4 w-4" /></>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── STEP 4: AI Result ── */}
        {step === 4 && aiResult && (
          <div className="space-y-4">
            {/* Urgency card */}
            <Card className={`border-2 ${urgencyStyle.border} ${urgencyStyle.bg}`}>
              <CardContent className="pt-5">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-3xl">{urgencyStyle.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold">
                      {aiResult.urgency === "emergency" ? (en ? "🚨 Seek Emergency Care NOW" : "🚨 तुरंत आपातकालीन देखभाल लें") :
                       aiResult.urgency === "high"      ? (en ? "⚠️ See a Doctor Today" : "⚠️ आज डॉक्टर से मिलें") :
                       aiResult.urgency === "medium"    ? (en ? "Book a Consultation" : "परामर्श बुक करें") :
                       (en ? "Home Care Recommended" : "घरेलू देखभाल अनुशंसित")}
                    </h2>
                    {aiResult.specialistNeeded && (
                      <p className="text-sm mt-1 font-medium opacity-80">
                        {en ? `Specialist: ${aiResult.specialistNeeded}` : `विशेषज्ञ: ${aiResult.specialistNeeded}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Inline Chat Interface */}
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Bot className="h-5 w-5 text-teal-600" />
                    {en ? "Discuss your symptoms with AI" : "AI के साथ अपने लक्षणों पर चर्चा करें"}
                  </h3>
                  
                  <div className="bg-gray-50 rounded-xl p-3 h-64 overflow-y-auto mb-3 flex flex-col gap-3">
                    {chatMessages.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center mt-auto mb-auto">
                        {en ? "Ask any questions about your condition, home remedies, or next steps." : "अपनी स्थिति, घरेलू उपचार, या अगले कदमों के बारे में कोई भी प्रश्न पूछें।"}
                      </p>
                    ) : (
                      chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`whitespace-pre-wrap max-w-[85%] rounded-xl px-3 py-2 text-sm ${msg.role === "user" ? "bg-teal-600 text-white rounded-tr-none" : "bg-white border rounded-tl-none text-gray-800 shadow-sm"}`}>
                            {msg.content}
                          </div>
                        </div>
                      ))
                    )}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border rounded-xl rounded-tl-none px-3 py-2 shadow-sm">
                          <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleChat()}
                      placeholder={en ? "Type your question..." : "अपना प्रश्न टाइप करें..."}
                      className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                    />
                    <Button onClick={handleChat} disabled={!chatInput.trim() || chatLoading} className="gradient-primary text-white">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(aiResult.urgency === "emergency" || aiResult.urgency === "high") && (
                <Button variant="destructive" size="lg" className="w-full" onClick={() => window.open("tel:108")}>
                  <AlertTriangle className="mr-2 h-4 w-4" />{en ? "Call Emergency 108" : "आपातकाल 108 पर कॉल करें"}
                </Button>
              )}
              <Button size="lg" className="w-full gradient-primary text-white" onClick={() => setCurrentPage("consultation")}>
                <Stethoscope className="mr-2 h-4 w-4" />{en ? "Book Consultation" : "परामर्श बुक करें"}
              </Button>
              <Button variant="outline" size="lg" onClick={() => setCurrentPage("locations")}>
                <MapPin className="mr-2 h-4 w-4" />{en ? "Find Nearest Hospital" : "निकटतम अस्पताल खोजें"}
              </Button>
              <Button variant="ghost" size="sm" onClick={reset} className="col-span-full">
                <Home className="mr-2 h-4 w-4" />{en ? "Check Again" : "फिर से जांचें"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
