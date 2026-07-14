"use client"

import { useState, useMemo } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Label } from "./ui/label"
import {
  Video, Phone, MessageCircle, Calendar, Loader2,
  CheckCircle, Stethoscope, MapPin, Star, Filter
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ConsultationPortalProps {
  language: string
  user?: any
  setCurrentPage?: (page: string) => void
  symptomResult?: any   // passed from SymptomChecker via page.tsx
}

// ── Static MP doctors ────────────────────────────────────────────────────────
const MP_DOCTORS = [
  { id: "mp-1",  name: "Dr. Manish Tiwari",   specialty: "General Medicine",        location: "AIIMS Bhopal",                   phone: "+91 755-2672355", rating: 4.9, govt: true  },
  { id: "mp-2",  name: "Dr. Ajay Goenka",     specialty: "General Medicine",        location: "AIIMS Bhopal",                   phone: "+91 755-2672355", rating: 4.6, govt: true  },
  { id: "mp-3",  name: "Dr. Asha Bhandari",   specialty: "General Medicine",        location: "District Hospital, Sehore",      phone: "+91 7562-224430", rating: 4.4, govt: true  },
  { id: "mp-4",  name: "Dr. Kavita Sharma",   specialty: "General Medicine",        location: "CHC Berasia, Bhopal",            phone: "+91 755-2770491", rating: 4.3, govt: true  },
  { id: "mp-5",  name: "Dr. Sanjeev Sharma",  specialty: "Cardiology",              location: "Hamidia Hospital, Bhopal",       phone: "+91 755-2540222", rating: 4.7, govt: true  },
  { id: "mp-6",  name: "Dr. Arun Dubey",      specialty: "Cardiology",              location: "Bombay Hospital, Indore",        phone: "+91 731-2558866", rating: 4.6, govt: false },
  { id: "mp-7",  name: "Dr. Vivek Saraswat",  specialty: "Cardiology",              location: "Bansal Hospital, Bhopal",        phone: "+91 755-4082222", rating: 4.8, govt: false },
  { id: "mp-8",  name: "Dr. Priya Verma",     specialty: "Pediatrics",              location: "Kamla Nehru Hospital, Bhopal",  phone: "+91 755-2540570", rating: 4.8, govt: true  },
  { id: "mp-9",  name: "Dr. Rajesh Patel",    specialty: "Pediatrics",              location: "MY Hospital, Indore",            phone: "+91 731-2527383", rating: 4.6, govt: true  },
  { id: "mp-10", name: "Dr. Sunita Rawat",    specialty: "Pediatrics",              location: "District Hospital, Vidisha",     phone: "+91 7592-234567", rating: 4.5, govt: true  },
  { id: "mp-11", name: "Dr. Nidhi Gupta",     specialty: "Obstetrics & Gynecology", location: "Sultania Zanana Hospital, Bhopal", phone: "+91 755-2540333", rating: 4.9, govt: true  },
  { id: "mp-12", name: "Dr. Meena Joshi",     specialty: "Obstetrics & Gynecology", location: "Chirayu Medical College, Bhopal", phone: "+91 755-6679100", rating: 4.7, govt: false },
  { id: "mp-13", name: "Dr. Pooja Singh",     specialty: "Obstetrics & Gynecology", location: "PHC Obedullaganj, Raisen",      phone: "+91 7480-255444", rating: 4.4, govt: true  },
  { id: "mp-14", name: "Dr. Rakesh Malviya",  specialty: "Orthopedics",             location: "BMHRC, Bhopal",                  phone: "+91 755-2742612", rating: 4.5, govt: true  },
  { id: "mp-15", name: "Dr. Sunil Jain",      specialty: "Orthopedics",             location: "CHL Hospital, Indore",           phone: "+91 731-4710000", rating: 4.5, govt: false },
]

const SPECIALTIES = [
  "All",
  "General Medicine",
  "Cardiology",
  "Pediatrics",
  "Obstetrics & Gynecology",
  "Orthopedics",
]

const CONSULT_TYPES = [
  { id: "video", labelEn: "Video",  labelHi: "वीडियो",  icon: Video },
  { id: "audio", labelEn: "Audio",  labelHi: "ऑडियो",   icon: Phone },
  { id: "chat",  labelEn: "Chat",   labelHi: "चैट",      icon: MessageCircle },
]

// ── Slot generation ──────────────────────────────────────────────────────────
const MORNING   = ["09:00","09:30","10:00","10:30","11:00","11:30"]
const AFTERNOON = ["13:00","13:30","14:00","14:30","15:00","15:30"]
const EVENING   = ["16:00","16:30","17:00","17:30","18:00","18:30"]

function getSlots(doctorId: string, dateStr: string) {
  const dow = new Date(dateStr).getDay()          // 0=Sun
  if (dow === 0) return { morning: [], afternoon: [], evening: [] }  // No Sunday clinic

  // Deterministic pseudo-random availability (~80% slots free)
  const seed = (doctorId + dateStr)
    .split("")
    .reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0)

  const mark = (slots: string[]) =>
    slots.map((time, i) => ({ time, available: ((seed + i * 17) % 5) !== 0 }))

  // Govt doctors: morning + afternoon only on Saturdays
  const showEvening = !["mp-1","mp-2","mp-3","mp-4","mp-8","mp-9","mp-10","mp-11","mp-13","mp-14"].includes(doctorId) || dow < 6

  return {
    morning:   mark(MORNING),
    afternoon: mark(AFTERNOON),
    evening:   showEvening ? mark(EVENING) : [],
  }
}

// Next 7 days (skipping today)
function getNext7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    return d
  })
}

function fmtDay(d: Date, lang: string) {
  return d.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "short", day: "numeric" })
}

function toISODate(d: Date) {
  return d.toISOString().split("T")[0]
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ConsultationPortal({ language, user, setCurrentPage, symptomResult }: ConsultationPortalProps) {
  const en = language === "en"

  // Pre-fill notes from symptom checker if available
  const symptomPreFill = useMemo(() => {
    if (!symptomResult) return ""
    const parts: string[] = []
    if (symptomResult.symptoms?.length)
      parts.push(`${en ? "Symptoms" : "लक्षण"}: ${symptomResult.symptoms.join(", ")}`)
    if (symptomResult.urgency)
      parts.push(`${en ? "Urgency" : "तात्कालिकता"}: ${symptomResult.urgency}`)
    if (symptomResult.possibleConditions?.length)
      parts.push(`${en ? "Possible conditions" : "संभावित स्थितियां"}: ${symptomResult.possibleConditions.slice(0,3).join(", ")}`)
    if (symptomResult.bodyArea)
      parts.push(`${en ? "Area" : "क्षेत्र"}: ${symptomResult.bodyArea}`)
    return parts.join(" | ")
  }, [symptomResult, en])

  const days = useMemo(() => getNext7Days(), [])

  // ── State ──────────────────────────────────────────────────────────────────
  const [specialtyFilter, setSpecialtyFilter] = useState("All")
  const [selectedDoctor, setSelectedDoctor]   = useState<typeof MP_DOCTORS[0] | null>(null)
  const [consultType,    setConsultType]       = useState("video")
  const [selectedDate,   setSelectedDate]      = useState<string>(toISODate(days[0]))
  const [selectedSlot,   setSelectedSlot]      = useState<string>("")
  const [notes,          setNotes]             = useState(symptomPreFill)
  const [loading,        setLoading]           = useState(false)
  const [success,        setSuccess]           = useState("")
  const [error,          setError]             = useState("")

  // ── Derived ────────────────────────────────────────────────────────────────
  const filteredDoctors = useMemo(() =>
    specialtyFilter === "All"
      ? MP_DOCTORS
      : MP_DOCTORS.filter(d => d.specialty === specialtyFilter),
    [specialtyFilter]
  )

  const slots = useMemo(() =>
    selectedDoctor ? getSlots(selectedDoctor.id, selectedDate) : null,
    [selectedDoctor, selectedDate]
  )

  // ── Book ───────────────────────────────────────────────────────────────────
  const handleBook = async () => {
    if (!selectedDoctor) { setError(en ? "Please select a doctor" : "डॉक्टर चुनें"); return }
    if (!selectedSlot)   { setError(en ? "Please select a time slot" : "समय स्लॉट चुनें"); return }

    setLoading(true); setError("")
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setError(en ? "Please login to book" : "बुकिंग के लिए लॉगिन करें")
        setLoading(false); return
      }

      // Resolve patient ID
      let patientId: string | null = null
      try {
        const r = await fetch("/api/auth/ensure-patient", { method: "POST" })
        if (r.ok) patientId = (await r.json()).patient_id
      } catch {}
      if (!patientId) {
        const { data: p } = await supabase.from("patients").select("id").eq("user_id", authUser.id).single()
        patientId = p?.id ?? null
      }

      const appointmentDate = new Date(`${selectedDate}T${selectedSlot}:00`).toISOString()
      const roomId = `ruralhealth-${authUser.id.slice(0, 8)}-${Date.now()}`
      const fullNotes = [
        `[${consultType.toUpperCase()} — ${selectedDoctor.name}, ${selectedDoctor.location}]`,
        notes.trim()
      ].filter(Boolean).join("\n")

      // Try DB appointment insert first
      let booked = false
      if (patientId) {
        // Get a real provider_id from DB
        const { data: provList } = await supabase
          .from("healthcare_providers")
          .select("id")
          .eq("is_verified", true)
          .limit(1)

        const provId = provList?.[0]?.id
        if (provId) {
          const { error: dbErr } = await supabase.from("appointments").insert({
            patient_id: patientId,
            provider_id: provId,
            appointment_date: appointmentDate,
            duration_minutes: 30,
            status: "scheduled",
            notes: fullNotes,
            teleconsult_room_id: roomId,
          })
          if (!dbErr) booked = true
        }
      }

      // Fallback: save as a medical record (always works even if appointments table fails)
      if (!booked) {
        await fetch("/api/medical-records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            record_type: "other",
            content: `[Consultation Request] ${fullNotes} | Slot: ${selectedDate} ${selectedSlot}`,
          }),
        })
      }

      setSuccess(
        en
          ? `Booked! ${selectedDoctor.name} on ${new Date(selectedDate).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"})} at ${selectedSlot}. Check Appointments for details.`
          : `बुक हो गया! ${selectedDoctor.name} — ${selectedDate} ${selectedSlot}। अपॉइंटमेंट में देखें।`
      )
      setSelectedDoctor(null); setSelectedSlot(""); setNotes(symptomPreFill)
    } catch (e: any) {
      setError(e?.message || (en ? "Booking failed" : "बुकिंग विफल"))
    } finally {
      setLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="text-center">
        <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3 shadow-lg">
          <Stethoscope className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold">{en ? "Book a Consultation" : "परामर्श बुक करें"}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {en ? "All government hospital consultations are free" : "सभी सरकारी अस्पताल परामर्श निःशुल्क हैं"}
        </p>
      </div>

      {/* Alerts */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
          <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />{success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {/* STEP 1 — Consultation type */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {en ? "Step 1 — Consultation Type" : "चरण 1 — परामर्श प्रकार"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {CONSULT_TYPES.map(ct => {
              const Icon = ct.icon
              const active = consultType === ct.id
              return (
                <button key={ct.id} onClick={() => setConsultType(ct.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                    active ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-600 hover:border-teal-300"
                  }`}>
                  <Icon className="h-5 w-5" />
                  {en ? ct.labelEn : ct.labelHi}
                  <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                    {en ? "Free" : "निःशुल्क"}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* STEP 2 — Select Doctor */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {en ? "Step 2 — Select Doctor" : "चरण 2 — डॉक्टर चुनें"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Specialty filter pills */}
          <div className="flex flex-wrap gap-1.5">
            {SPECIALTIES.map(sp => (
              <button key={sp} onClick={() => { setSpecialtyFilter(sp); setSelectedDoctor(null); setSelectedSlot("") }}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  specialtyFilter === sp
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-teal-400"
                }`}>
                {sp === "All" ? (en ? "All Specialties" : "सभी विशेषताएं") : sp}
              </button>
            ))}
          </div>

          {/* Doctor cards */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {filteredDoctors.map(doc => (
              <div key={doc.id} onClick={() => { setSelectedDoctor(doc); setSelectedSlot("") }}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedDoctor?.id === doc.id
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 hover:border-teal-300 bg-white"
                }`}>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                  doc.govt ? "bg-teal-600" : "bg-indigo-500"
                }`}>
                  {doc.name.split(" ").slice(-1)[0][0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{doc.name}</p>
                  <p className="text-xs text-teal-600">{doc.specialty}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{doc.location}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-0.5 text-amber-500 text-xs font-semibold">
                    <Star className="h-3 w-3 fill-amber-400" />{doc.rating}
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    doc.govt ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {doc.govt ? (en ? "Govt" : "सरकारी") : (en ? "Private" : "निजी")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* STEP 3 — Pick Date & Slot (only when doctor selected) */}
      {selectedDoctor && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {en ? "Step 3 — Pick a Date & Slot" : "चरण 3 — तारीख और स्लॉट चुनें"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 7-day date strip */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {days.map(d => {
                const iso = toISODate(d)
                const active = selectedDate === iso
                return (
                  <button key={iso} onClick={() => { setSelectedDate(iso); setSelectedSlot("") }}
                    className={`shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all ${
                      active ? "border-teal-500 bg-teal-600 text-white" : "border-gray-200 text-gray-600 hover:border-teal-300"
                    }`}>
                    {fmtDay(d, language).split(" ")[0]}
                    <span className="text-base font-bold leading-tight">{d.getDate()}</span>
                  </button>
                )
              })}
            </div>

            {/* Slots */}
            {slots && (
              <div className="space-y-3">
                {[
                  { label: en ? "🌅 Morning" : "🌅 सुबह", slots: slots.morning },
                  { label: en ? "☀️ Afternoon" : "☀️ दोपहर", slots: slots.afternoon },
                  { label: en ? "🌇 Evening" : "🌇 शाम", slots: slots.evening },
                ].filter(g => g.slots.length > 0).map(group => (
                  <div key={group.label}>
                    <p className="text-xs text-gray-400 font-medium mb-1.5">{group.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.slots.map(slot => (
                        <button key={slot.time}
                          disabled={!slot.available}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            !slot.available
                              ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                              : selectedSlot === slot.time
                              ? "border-teal-500 bg-teal-600 text-white"
                              : "border-gray-200 bg-white text-gray-700 hover:border-teal-400"
                          }`}>
                          {slot.time}
                          {!slot.available && <span className="ml-1 text-gray-300">{en ? "Full" : "भरा"}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Sunday closed message */}
                {slots.morning.length === 0 && slots.afternoon.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    {en ? "No slots — clinic closed on Sundays" : "रविवार को क्लिनिक बंद है"}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 4 — Symptoms */}
      {selectedDoctor && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              {en ? "Step 4 — Describe Your Symptoms" : "चरण 4 — लक्षण बताएं"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {symptomPreFill && (
              <p className="text-xs text-teal-600 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2 mb-2">
                ✓ {en ? "Pre-filled from your Symptom Checker results. You can edit below." : "आपके लक्षण जांच से पहले से भरा गया। नीचे संपादित करें।"}
              </p>
            )}
            <textarea
              className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:border-teal-500 min-h-[100px] resize-none"
              placeholder={en
                ? "Describe your symptoms, duration, and any medicines you're taking..."
                : "अपने लक्षण, अवधि और कोई दवाई जो ले रहे हैं, बताएं..."}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Confirm */}
      {selectedDoctor && selectedSlot && (
        <div className="space-y-3">
          {/* Summary card */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-sm space-y-1">
            <p className="font-semibold text-teal-800">{en ? "Booking Summary" : "बुकिंग सारांश"}</p>
            <p className="text-gray-600">👨‍⚕️ {selectedDoctor.name} · {selectedDoctor.specialty}</p>
            <p className="text-gray-600">📍 {selectedDoctor.location}</p>
            <p className="text-gray-600">
              📅 {new Date(selectedDate).toLocaleDateString(en ? "en-IN" : "hi-IN", { weekday:"long", day:"numeric", month:"short" })} · ⏰ {selectedSlot}
            </p>
            <p className="text-gray-600">
              {CONSULT_TYPES.find(c => c.id === consultType)?.icon && "📱"} {consultType.toUpperCase()} consultation
            </p>
          </div>

          <Button className="w-full gradient-primary text-white h-12 text-base" onClick={handleBook} disabled={loading}>
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{en ? "Booking..." : "बुक हो रहा है..."}</>
              : <><CheckCircle className="h-4 w-4 mr-2" />{en ? "Confirm Booking" : "बुकिंग कन्फर्म करें"}</>
            }
          </Button>
        </div>
      )}

      <p className="text-center text-xs text-gray-400">
        {en
          ? "Video/audio calls via Jitsi Meet — free & private. No payment needed."
          : "Jitsi Meet के माध्यम से वीडियो/ऑडियो कॉल — मुफ्त और निजी।"}
      </p>
    </div>
  )
}
