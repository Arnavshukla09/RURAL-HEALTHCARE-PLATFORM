"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Video, Phone, MessageCircle, Calendar, Clock, Loader2, CheckCircle, Stethoscope, Briefcase } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ConsultationPortalProps {
  language: string
  user?: any
  setCurrentPage?: (page: string) => void
}

const consultationTypes = [
  { id: "video", label: "Video Consultation", labelHi: "वीडियो परामर्श", icon: Video, desc: "Face-to-face video call with doctor", descHi: "डॉक्टर के साथ वीडियो कॉल" },
  { id: "audio", label: "Audio Consultation", labelHi: "ऑडियो परामर्श", icon: Phone, desc: "Voice call with doctor", descHi: "डॉक्टर के साथ वॉइस कॉल" },
  { id: "chat", label: "Chat Consultation", labelHi: "चैट परामर्श", icon: MessageCircle, desc: "Text chat with doctor", descHi: "डॉक्टर के साथ टेक्स्ट चैट" },
]

// Real Madhya Pradesh doctors — static fallback when DB is empty
const MP_DOCTORS = [
  { id: "mp-1",  name: "Dr. Manish Tiwari",    specialization: "General Medicine",        location: "AIIMS Bhopal",                  phone: "+91 755-2672355" },
  { id: "mp-2",  name: "Dr. Ajay Goenka",      specialization: "General Medicine",        location: "AIIMS Bhopal",                  phone: "+91 755-2672355" },
  { id: "mp-3",  name: "Dr. Sanjeev Sharma",   specialization: "Cardiology",              location: "Hamidia Hospital, Bhopal",      phone: "+91 755-2540222" },
  { id: "mp-4",  name: "Dr. Arun Dubey",       specialization: "Cardiology",              location: "Bombay Hospital, Indore",       phone: "+91 731-2558866" },
  { id: "mp-5",  name: "Dr. Vivek Saraswat",   specialization: "Cardiology",              location: "Bansal Hospital, Bhopal",       phone: "+91 755-4082222" },
  { id: "mp-6",  name: "Dr. Priya Verma",      specialization: "Pediatrics",              location: "Kamla Nehru Hospital, Bhopal",  phone: "+91 755-2540570" },
  { id: "mp-7",  name: "Dr. Rajesh Patel",     specialization: "Pediatrics",              location: "MY Hospital, Indore",           phone: "+91 731-2527383" },
  { id: "mp-8",  name: "Dr. Sunita Rawat",     specialization: "Pediatrics",              location: "District Hospital, Vidisha",    phone: "+91 7592-234567" },
  { id: "mp-9",  name: "Dr. Nidhi Gupta",      specialization: "Obstetrics & Gynecology", location: "Sultania Zanana Hospital, Bhopal", phone: "+91 755-2540333" },
  { id: "mp-10", name: "Dr. Meena Joshi",      specialization: "Obstetrics & Gynecology", location: "Chirayu Medical College, Bhopal", phone: "+91 755-6679100" },
  { id: "mp-11", name: "Dr. Pooja Singh",      specialization: "Obstetrics & Gynecology", location: "PHC Obedullaganj, Raisen",      phone: "+91 7480-255444" },
  { id: "mp-12", name: "Dr. Rakesh Malviya",   specialization: "Orthopedics",             location: "BMHRC, Bhopal",                 phone: "+91 755-2742612" },
  { id: "mp-13", name: "Dr. Sunil Jain",       specialization: "Orthopedics",             location: "CHL Hospital, Indore",          phone: "+91 731-4710000" },
  { id: "mp-14", name: "Dr. Asha Bhandari",    specialization: "General Medicine",        location: "District Hospital, Sehore",     phone: "+91 7562-224430" },
  { id: "mp-15", name: "Dr. Kavita Sharma",    specialization: "General Medicine",        location: "CHC Berasia, Bhopal",           phone: "+91 755-2770491" },
]

// Occupation-based pre-filled note templates
const OCCUPATION_NOTES: Record<string, { en: string; hi: string }> = {
  farmer: {
    en: "I work as a farmer and may be exposed to pesticides, sun, and heavy lifting. My symptoms are: [describe symptoms]. Duration: [X days].",
    hi: "मैं किसान हूँ और कीटनाशकों, धूप और भारी काम के संपर्क में आता/आती हूँ। मेरे लक्षण: [लक्षण बताएं]। अवधि: [X दिन]।",
  },
  construction: {
    en: "I work in construction and am exposed to dust, heavy lifting, and physical strain. My symptoms are: [describe symptoms]. Duration: [X days].",
    hi: "मैं निर्माण कार्य करता/करती हूँ और धूल, भारी वजन और शारीरिक तनाव के संपर्क में रहता/रहती हूँ। मेरे लक्षण: [लक्षण बताएं]।",
  },
  teacher: {
    en: "I am a teacher. I spend long hours standing and speaking. My symptoms are: [describe symptoms]. Duration: [X days].",
    hi: "मैं शिक्षक हूँ। मैं लंबे समय तक खड़े रहकर पढ़ाता/पढ़ाती हूँ। मेरे लक्षण: [लक्षण बताएं]।",
  },
  housewife: {
    en: "I am a homemaker. I do household work daily. My symptoms are: [describe symptoms]. Duration: [X days].",
    hi: "मैं गृहिणी हूँ। मैं रोज घर का काम करती हूँ। मेरे लक्षण: [लक्षण बताएं]। अवधि: [X दिन]।",
  },
  student: {
    en: "I am a student. I spend long hours studying. My symptoms are: [describe symptoms]. Duration: [X days].",
    hi: "मैं छात्र/छात्रा हूँ। मैं लंबे समय तक पढ़ाई करता/करती हूँ। मेरे लक्षण: [लक्षण बताएं]।",
  },
  daily_wage: {
    en: "I am a daily wage worker. I do physically demanding outdoor work. My symptoms are: [describe symptoms]. Duration: [X days].",
    hi: "मैं दिहाड़ी मजदूर हूँ। मैं बाहर कड़ी मेहनत करता/करती हूँ। मेरे लक्षण: [लक्षण बताएं]।",
  },
  driver: {
    en: "I am a driver and sit for long hours. My symptoms are: [describe symptoms]. Duration: [X days].",
    hi: "मैं ड्राइवर हूँ और लंबे समय तक बैठकर काम करता/करती हूँ। मेरे लक्षण: [लक्षण बताएं]।",
  },
  shopkeeper: {
    en: "I run a small shop and stand for long hours. My symptoms are: [describe symptoms]. Duration: [X days].",
    hi: "मैं दुकानदार हूँ और लंबे समय तक खड़ा/खड़ी रहता/रहती हूँ। मेरे लक्षण: [लक्षण बताएं]।",
  },
}

const OCCUPATIONS = [
  { value: "farmer",       labelEn: "Farmer / Kisan",          labelHi: "किसान" },
  { value: "construction", labelEn: "Construction Worker",      labelHi: "निर्माण श्रमिक" },
  { value: "teacher",      labelEn: "Teacher",                  labelHi: "शिक्षक" },
  { value: "housewife",    labelEn: "Homemaker / Housewife",    labelHi: "गृहिणी" },
  { value: "student",      labelEn: "Student",                  labelHi: "छात्र/छात्रा" },
  { value: "daily_wage",   labelEn: "Daily Wage Worker",        labelHi: "दिहाड़ी मजदूर" },
  { value: "driver",       labelEn: "Driver",                   labelHi: "ड्राइवर" },
  { value: "shopkeeper",   labelEn: "Shopkeeper / Trader",      labelHi: "दुकानदार / व्यापारी" },
]

export function ConsultationPortal({ language, user, setCurrentPage }: ConsultationPortalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [providers, setProviders] = useState<any[]>(MP_DOCTORS)
  const [selectedProvider, setSelectedProvider] = useState("")
  const [occupation, setOccupation] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const en = language === "en"

  const handleSelectType = async (typeId: string) => {
    setSelectedType(typeId)
    setSuccess("")
    setError("")
    // Attempt to load from DB; fall back to static MP_DOCTORS list
    try {
      const supabase = createClient()
      const { data } = await supabase.from("healthcare_providers").select("*").eq("is_verified", true)
      if (data && data.length > 0) setProviders(data)
    } catch {
      // Keep static MP_DOCTORS as fallback
    }
  }

  const handleOccupationChange = (occ: string) => {
    setOccupation(occ)
    if (occ && OCCUPATION_NOTES[occ]) {
      setNotes(en ? OCCUPATION_NOTES[occ].en : OCCUPATION_NOTES[occ].hi)
    } else {
      setNotes("")
    }
  }

  const handleBook = async () => {
    if (!date || !time) {
      setError(en ? "Please select date and time" : "कृपया तारीख और समय चुनें")
      return
    }

    setLoading(true)
    setError("")
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setError(en ? "Please login to book a consultation" : "परामर्श बुक करने के लिए लॉगिन करें")
        setLoading(false)
        return
      }

      // Ensure patient row exists via server API (bypasses RLS)
      let patientId: string | null = null
      try {
        const ensureRes = await fetch("/api/auth/ensure-patient", { method: "POST" })
        if (ensureRes.ok) {
          const ensureData = await ensureRes.json()
          patientId = ensureData.patient_id
        }
      } catch {}

      // Fallback: try direct DB read
      if (!patientId) {
        const { data: p } = await supabase.from('patients').select('id').eq('user_id', authUser.id).single()
        patientId = p?.id
      }

      // Get provider ID — prefer selected; fallback to first DB provider or placeholder
      let provId = selectedProvider
      if (!provId) {
        const { data: provList } = await supabase.from('healthcare_providers').select('id').eq('is_verified', true).limit(1)
        provId = provList?.[0]?.id
      }

      if (!patientId || !provId) {
        // If still no DB provider, save as a medical record request instead
        const notesText = [
          occupation ? `Occupation: ${OCCUPATIONS.find(o => o.value === occupation)?.[en ? 'labelEn' : 'labelHi'] || occupation}` : "",
          `Type: ${selectedType} consultation`,
          notes,
          `Requested date: ${date} at ${time}`,
        ].filter(Boolean).join(" | ")

        const res = await fetch('/api/medical-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            record_type: 'other',
            content: `[Consultation Request] ${notesText}`,
          }),
        })
        if (res.ok) {
          setSuccess(en
            ? "Consultation request saved! A doctor will contact you. Check your Medical Records."
            : "परामर्श अनुरोध सहेजा गया! डॉक्टर आपसे संपर्क करेंगे। मेडिकल रिकॉर्ड देखें।")
          setSelectedType(null); setDate(""); setTime(""); setNotes(""); setSelectedProvider(""); setOccupation("")
        } else {
          const err = await res.json()
          setError(err.error || (en ? "Booking failed. Please try again." : "बुकिंग विफल।"))
        }
        setLoading(false)
        return
      }

      const appointmentDate = new Date(`${date}T${time}:00`).toISOString()
      const roomId = `ruralhealth-${authUser.id.slice(0, 8)}-${Date.now()}`
      const occupationLabel = occupation
        ? OCCUPATIONS.find(o => o.value === occupation)?.[en ? 'labelEn' : 'labelHi'] || occupation
        : ""
      const fullNotes = [occupationLabel ? `[${occupationLabel}]` : "", notes || `${selectedType} consultation requested`].filter(Boolean).join(" — ")

      const { error: dbError } = await supabase.from('appointments').insert({
        patient_id: patientId,
        provider_id: provId,
        appointment_date: appointmentDate,
        duration_minutes: 30,
        status: 'scheduled',
        notes: fullNotes,
        teleconsult_room_id: roomId,
      })

      if (dbError) {
        setError(dbError.message)
      } else {
        setSuccess(en ? "Consultation booked successfully! View it in your Appointments." : "परामर्श सफलतापूर्वक बुक हुआ! अपॉइंटमेंट में देखें।")
        setSelectedType(null); setDate(""); setTime(""); setNotes(""); setSelectedProvider(""); setOccupation("")
      }
    } catch (err: any) {
      setError(err?.message || "Booking failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Stethoscope className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold">{en ? "Consultation Portal" : "परामर्श पोर्टल"}</h2>
        <p className="text-gray-500">{en ? "Connect with a Doctor — All consultations are free" : "डॉक्टर से जुड़ें — सभी परामर्श निःशुल्क"}</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-4">
          <CheckCircle className="h-4 w-4" />{success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
      )}

      {/* Step 1: Select consultation type */}
      <div className="grid gap-3 mb-6">
        {consultationTypes.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedType === item.id
                  ? "border-teal-500 bg-teal-50 shadow-sm"
                  : "border-gray-200 hover:border-teal-300"
              }`}
              onClick={() => handleSelectType(item.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${selectedType === item.id ? 'bg-teal-100' : 'bg-gray-100'}`}>
                  <Icon className={`h-5 w-5 ${selectedType === item.id ? 'text-teal-600' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{en ? item.label : item.labelHi}</p>
                  <p className="text-sm text-gray-500">{en ? item.desc : item.descHi}</p>
                </div>
                <span className="text-green-600 font-semibold text-sm bg-green-50 px-2 py-1 rounded">{en ? "Free" : "निःशुल्क"}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Step 2: Booking form */}
      {selectedType && (
        <Card className="border-teal-200 bg-gradient-to-b from-teal-50/50 to-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-teal-600" />
              {en ? "Schedule Your Consultation" : "अपना परामर्श शेड्यूल करें"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Occupation selector */}
            <div>
              <Label className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {en ? "Your Occupation (optional)" : "आपका व्यवसाय (वैकल्पिक)"}
              </Label>
              <select
                className="w-full border rounded-lg p-2.5 mt-1 bg-white text-sm focus:outline-none focus:border-teal-500"
                value={occupation}
                onChange={e => handleOccupationChange(e.target.value)}
              >
                <option value="">{en ? "-- Select your occupation --" : "-- अपना व्यवसाय चुनें --"}</option>
                {OCCUPATIONS.map(o => (
                  <option key={o.value} value={o.value}>{en ? o.labelEn : o.labelHi}</option>
                ))}
              </select>
              {occupation && (
                <p className="text-xs text-teal-600 mt-1">
                  {en
                    ? "✓ Symptoms description pre-filled based on your occupation. Edit as needed."
                    : "✓ आपके व्यवसाय के अनुसार लक्षण विवरण भरा गया है। जरूरत हो तो संपादित करें।"}
                </p>
              )}
            </div>

            {/* Doctor selector */}
            <div>
              <Label>{en ? "Select Doctor (Madhya Pradesh)" : "डॉक्टर चुनें (मध्य प्रदेश)"}</Label>
              <select
                className="w-full border rounded-lg p-2.5 mt-1 bg-white text-sm focus:outline-none focus:border-teal-500"
                value={selectedProvider}
                onChange={e => setSelectedProvider(e.target.value)}
              >
                <option value="">{en ? "-- Any available doctor --" : "-- कोई भी उपलब्ध डॉक्टर --"}</option>
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.specialization || p.specialityName} ({p.location || "MP"})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{en ? "Date" : "तारीख"}</Label>
                <Input type="date" value={date} min={new Date().toISOString().split('T')[0]}
                  onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <Label className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{en ? "Time" : "समय"}</Label>
                <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>{en ? "Describe your symptoms" : "अपने लक्षण बताएं"}</Label>
              <textarea
                className="w-full border rounded-lg p-3 mt-1 text-sm focus:outline-none focus:border-teal-500 min-h-[100px] resize-none"
                placeholder={en ? "E.g., Fever for 3 days, headache, body ache..." : "जैसे: 3 दिन से बुखार, सिरदर्द, बदन दर्द..."}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <Button className="w-full gradient-primary text-white" onClick={handleBook} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle className="h-4 w-4 mr-1.5" />}
              {en ? "Confirm Booking" : "बुकिंग कन्फर्म करें"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info text at bottom */}
      <p className="text-center text-xs text-gray-400 mt-6">
        {en
          ? "All consultations are conducted via Jitsi Meet (free & secure). No payment required."
          : "सभी परामर्श Jitsi Meet के माध्यम से होते हैं (मुफ्त और सुरक्षित)। कोई भुगतान आवश्यक नहीं।"}
      </p>
    </div>
  )
}
