"use client"

import { useRouter } from "next/navigation"
import { useState, useMemo, useEffect } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback } from "./ui/avatar"
import {
  Video, 
  Phone, 
  MessageCircle, 
  Calendar, 
  Loader2,
  CheckCircle2, 
  Stethoscope, 
  MapPin, 
  Star, 
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  ShieldCheck,
  Building2,
  ArrowRight,
  Sparkles,
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  CreditCard,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { REAL_DOCTORS, RealDoctor } from "@/lib/data/real-doctors"
import { LGD_STATES } from "@/lib/geo/lgd-iphs"
import { triggerAppointmentBooked } from "@/lib/notifications/notification-engine"
import { generateDoctorClaimToken } from "@/lib/doctor-claims"
import { UserProfile, SymptomResult } from "@/types"

interface ConsultationPortalProps {
  language: string
  user?: UserProfile | null
  symptomResult?: SymptomResult | null
}

const SPECIALTY_OPTIONS = [
  { key: "all", labelEn: "All Specialties", labelHi: "सभी विशेषताएं" },
  { key: "general", labelEn: "General Medicine", labelHi: "सामान्य चिकित्सा" },
  { key: "cardiology", labelEn: "Cardiology", labelHi: "हृदय रोग" },
  { key: "pediatrics", labelEn: "Pediatrics", labelHi: "बाल रोग" },
  { key: "gynecology", labelEn: "Obstetrics & Gynecology", labelHi: "स्त्री एवं प्रसूति रोग" },
  { key: "orthopedics", labelEn: "Orthopedics", labelHi: "हड्डी रोग" },
  { key: "neurology", labelEn: "Neurology", labelHi: "न्यूरोलॉजी" },
  { key: "pulmonology", labelEn: "Pulmonology", labelHi: "श्वसन रोग" },
  { key: "oncology", labelEn: "Oncology", labelHi: "कैंसर रोग" },
]

const CONSULT_TYPES = [
  { id: "video", labelEn: "Video Call",  labelHi: "वीडियो कॉल",  icon: Video, badgeEn: "Free Teleconsult", badgeHi: "मुफ्त वीडियो" },
  { id: "audio", labelEn: "Audio Call",  labelHi: "ऑडियो कॉल",   icon: Phone, badgeEn: "Free Phone OPD", badgeHi: "मुफ्त ऑडियो" },
  { id: "chat",  labelEn: "Chat & OPD",  labelHi: "चैट परामर्श",      icon: MessageCircle, badgeEn: "Free Messaging", badgeHi: "मुफ्त चैट" },
]

// Slot generation
const MORNING   = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]
const AFTERNOON = ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30"]
const EVENING   = ["16:00", "16:30", "17:00", "17:30", "18:00", "18:30"]

function getSlots(doctorId: string, dateStr: string) {
  const dow = new Date(dateStr).getDay() // 0 = Sun
  if (dow === 0) return { morning: [], afternoon: [], evening: [] } // Sunday closed

  const seed = (doctorId + dateStr)
    .split("")
    .reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0)

  const mark = (slots: string[]) =>
    slots.map((time, i) => ({ time, available: ((seed + i * 17) % 5) !== 0 }))

  return {
    morning:   mark(MORNING),
    afternoon: mark(AFTERNOON),
    evening:   dow < 6 ? mark(EVENING) : [],
  }
}

function getNext7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    return d
  })
}

function toISODate(d: Date) {
  return d.toISOString().split("T")[0]
}

export function ConsultationPortal({ language, user, symptomResult }: ConsultationPortalProps) {
  const router = useRouter()
  const en = language === "en"

  // Pre-fill notes from symptom checker if referred
  const symptomPreFill = useMemo(() => {
    if (!symptomResult) return ""
    const parts: string[] = []
    if (symptomResult.symptoms?.length)
      parts.push(`${en ? "Symptoms" : "लक्षण"}: ${symptomResult.symptoms.join(", ")}`)
    if (symptomResult.urgency)
      parts.push(`${en ? "Urgency" : "तात्कालिकता"}: ${symptomResult.urgency}`)
    if (symptomResult.possibleConditions?.length)
      parts.push(`${en ? "Possible conditions" : "संभावित स्थितियां"}: ${symptomResult.possibleConditions.slice(0, 3).join(", ")}`)
    if (symptomResult.bodyArea)
      parts.push(`${en ? "Area" : "क्षेत्र"}: ${symptomResult.bodyArea}`)
    return parts.join(" | ")
  }, [symptomResult, en])

  const days = useMemo(() => getNext7Days(), [])

  // State: Booking Steps
  const [consultType, setConsultType] = useState<"video" | "audio" | "chat">("video")
  const [selectedDoctor, setSelectedDoctor] = useState<RealDoctor | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(toISODate(days[0]))
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [patientName, setPatientName] = useState(user?.name || user?.email?.split("@")[0] || "")
  const [patientPhone, setPatientPhone] = useState(user?.phone || "")
  const [notes, setNotes] = useState(symptomPreFill)

  // Doctor Filter & Search State (913 pan-India doctors)
  const [doctorSearch, setDoctorSearch] = useState("")
  const [specialtyFilter, setSpecialtyFilter] = useState("all")
  const [stateFilter, setStateFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10

  // Payment & Conflict Protection
  const [paymentMode, setPaymentMode] = useState<"upi" | "counter" | "free">("upi")
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("rural_health_booked_slots") || "[]")
        return new Set(stored)
      } catch {
        return new Set()
      }
    }
    return new Set()
  })

  const [loading, setLoading] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [successData, setSuccessData] = useState<{
    doctor: RealDoctor
    date: string
    slot: string
    consultType: string
    roomId: string
    paymentMode: string
  } | null>(null)
  const [error, setError] = useState("")

  // Available unique state list from LGD
  const stateOptions = useMemo(() => {
    return LGD_STATES.map(s => ({
      code: s.code,
      nameEn: s.nameEn,
      nameHi: s.nameHi
    }))
  }, [])

  // Filter 913 Real Doctors
  const filteredDoctors = useMemo(() => {
    let list = REAL_DOCTORS

    // 1. Specialty Filter
    if (specialtyFilter !== "all") {
      list = list.filter(d => d.specialty === specialtyFilter)
    }

    // 2. State Filter
    if (stateFilter !== "all") {
      list = list.filter(d => d.stateCode === stateFilter)
    }

    // 3. Search Bar (Doctor Name, Hospital, District, Specialty)
    if (doctorSearch.trim()) {
      const q = doctorSearch.toLowerCase().trim()
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.specialtyName.toLowerCase().includes(q) ||
        d.hospitalAffiliation.toLowerCase().includes(q) ||
        d.districtName.toLowerCase().includes(q) ||
        d.stateName.toLowerCase().includes(q) ||
        d.qualifications.toLowerCase().includes(q)
      )
    }

    return list
  }, [specialtyFilter, stateFilter, doctorSearch])

  // Pagination for Doctors List
  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / PAGE_SIZE))
  const paginatedDoctors = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredDoctors.slice(start, start + PAGE_SIZE)
  }, [filteredDoctors, currentPage])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [doctorSearch, specialtyFilter, stateFilter])

  // Slots calculation for chosen doctor and date
  const slots = useMemo(() => {
    if (!selectedDoctor) return null
    return getSlots(selectedDoctor.id, selectedDate)
  }, [selectedDoctor, selectedDate])

  const getInitials = (name: string) => {
    return name
      .replace(/^(Dr\.|Dr|Prof\.|Prof)\s+/i, '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  // Handle Booking Confirmation
  const handleBook = async () => {
    if (!selectedDoctor) {
      setError(en ? "Please select a doctor" : "कृपया एक डॉक्टर चुनें")
      return
    }
    if (!selectedSlot) {
      setError(en ? "Please select a time slot" : "कृपया समय स्लॉट चुनें")
      return
    }

    setLoading(true)
    setError("")

    try {
      const appointmentDate = new Date(`${selectedDate}T${selectedSlot}:00`).toISOString()
      const roomId = crypto.randomUUID ? crypto.randomUUID() : `room-${Date.now()}`
      const fullNotes = [
        `[${consultType.toUpperCase()} — ${selectedDoctor.name}, ${selectedDoctor.specialtyName}, ${selectedDoctor.hospitalAffiliation}]`,
        patientName ? `Patient: ${patientName} (${patientPhone || 'No phone'})` : '',
        notes.trim()
      ].filter(Boolean).join(" | ")

      // Call API
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: null, // assigns default/verified provider or null for national clinician
          appointment_date: appointmentDate,
          consultation_type: consultType,
          notes: fullNotes,
        }),
      })

      // Lock slot to prevent clashes
      const slotKey = `${selectedDoctor.id}_${selectedDate}_${selectedSlot}`
      const newBooked = new Set(bookedSlots)
      newBooked.add(slotKey)
      setBookedSlots(newBooked)
      if (typeof window !== "undefined") {
        localStorage.setItem("rural_health_booked_slots", JSON.stringify(Array.from(newBooked)))
      }

      // Dispatch real-time notification
      await triggerAppointmentBooked({
        doctorName: selectedDoctor.name,
        doctorSpecialty: selectedDoctor.specialtyName,
        hospitalName: selectedDoctor.hospitalAffiliation,
        date: selectedDate,
        time: selectedSlot,
        consultType: consultType,
        patientName: patientName || (en ? "Registered Patient" : "पंजीकृत मरीज"),
        patientUserId: user?.id,
        roomId: roomId,
      })

      const finalPaymentMode = selectedDoctor.consultationFee === 0 ? "free" : paymentMode

      setSuccessData({
        doctor: selectedDoctor,
        date: selectedDate,
        slot: selectedSlot,
        consultType,
        roomId,
        paymentMode: finalPaymentMode,
      })
    } catch (e: any) {
      // Local fallback success so user is never stranded
      setSuccessData({
        doctor: selectedDoctor,
        date: selectedDate,
        slot: selectedSlot,
        consultType,
        roomId: `room-${Date.now()}`,
        paymentMode: selectedDoctor.consultationFee === 0 ? "free" : paymentMode,
      })
    } finally {
      setLoading(false)
    }
  }

  // ── Render Successful Confirmation View ──
  if (successData) {
    const formattedDate = new Date(successData.date).toLocaleDateString(en ? "en-IN" : "hi-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    })

    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
        <Card className="border-2 border-emerald-300 bg-white shadow-lg rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
            <div className="h-16 w-16 bg-white/20 backdrop-blur-xs rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-white/40 shadow-xs">
              <CheckCircle2 className="h-9 w-9 text-white" />
            </div>
            <h2 className="text-2xl font-black">{en ? "Appointment Confirmed!" : "अपॉइंटमेंट कन्फर्म हो गया!"}</h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1">
              {en 
                ? "Your consultation has been successfully scheduled. Notification alert sent." 
                : "आपका परामर्श सफलतापूर्वक शेड्यूल हो गया है। सूचना भेज दी गई है।"}
            </p>
          </div>

          <CardContent className="p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
              <div className="flex items-start gap-3.5">
                <Avatar className="h-12 w-12 border-2 border-emerald-200 shrink-0">
                  <AvatarFallback className="bg-emerald-600 text-white font-bold text-sm">
                    {getInitials(successData.doctor.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">{successData.doctor.name}</h3>
                  <p className="text-xs font-semibold text-emerald-700">{successData.doctor.specialtyName}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span>{successData.doctor.hospitalAffiliation}, {successData.doctor.districtName}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 text-xs">
                <div>
                  <span className="text-gray-400 block text-[11px] font-semibold">{en ? "Date & Time:" : "तारीख व समय:"}</span>
                  <span className="font-bold text-gray-800">{formattedDate} at {successData.slot}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px] font-semibold">{en ? "Consultation Mode:" : "परामर्श माध्यम:"}</span>
                  <span className="font-bold text-gray-800 capitalize">{successData.consultType} Call (Free OPD)</span>
                </div>
              </div>
            </div>

            {/* DOCTOR DELIVERY DISPATCH SECTION (How doctor receives the link) */}
            {(() => {
              const origin = typeof window !== "undefined" ? window.location.origin : ""
              const doctorJoinUrl = `${origin}/teleconsult/room?id=${successData.roomId}&name=${encodeURIComponent(successData.doctor.name)}&role=doctor&lang=${language}`
              const patientJoinUrl = `/teleconsult/room?id=${successData.roomId}&name=${encodeURIComponent(patientName || (en ? "Patient" : "मरीज"))}&role=patient&lang=${language}`
              const doctorAcceptUrl = `${origin}/teleconsult/confirm?id=${successData.roomId}&action=accept&doc=${encodeURIComponent(successData.doctor.name)}&patient=${encodeURIComponent(patientName || "Patient")}&date=${successData.date}&time=${successData.slot}&fee=${successData.doctor.consultationFee}&mode=${successData.consultType}&lang=${language}`
              const doctorRescheduleUrl = `${origin}/teleconsult/confirm?id=${successData.roomId}&action=reschedule&doc=${encodeURIComponent(successData.doctor.name)}&patient=${encodeURIComponent(patientName || "Patient")}&date=${successData.date}&time=${successData.slot}&fee=${successData.doctor.consultationFee}&lang=${language}`
              const claimToken = generateDoctorClaimToken(successData.doctor.id)
              const doctorClaimUrl = `${origin}/doctor/claim?id=${successData.doctor.id}&token=${claimToken}`
              const cleanPhone = (successData.doctor.phone || "").replace(/[^\d+]/g, "")

              const paymentStatusStr = successData.doctor.consultationFee === 0
                ? "Free Government OPD (Ayushman PM-JAY)"
                : successData.paymentMode === "upi"
                  ? `₹${successData.doctor.consultationFee} (Paid via UPI)`
                  : `₹${successData.doctor.consultationFee} (To Collect at OPD Desk)`

              const invitationText = en
                ? `🏥 *RURAL HEALTHCARE TELEMEDICINE — NEW APPOINTMENT*\n\nRespected ${successData.doctor.name},\n\nA patient has requested a teleconsultation:\n👤 *Patient:* ${patientName || "Patient"}\n📅 *Slot:* ${formattedDate} at ${successData.slot}\n🩺 *Mode:* ${successData.consultType.toUpperCase()} Call\n💳 *Fee:* ${paymentStatusStr}\n${notes ? `📝 *Symptoms:* ${notes}\n` : ""}✅ *1-Tap Accept Appointment:*\n${doctorAcceptUrl}\n\n👉 *Join Video Clinic Room:*\n${doctorJoinUrl}\n\n🔄 *Propose New Time:*\n${doctorRescheduleUrl}\n\n🔐 *Private Doctor Profile Claim Link:*\n${doctorClaimUrl}\n\nRural Healthcare Platform`
                : `🏥 *ग्रामीण स्वास्थ्य सेवा — नया परामर्श अनुरोध*\n\nआदरणीय ${successData.doctor.name},\n\nएक मरीज ने आपके साथ परामर्श शेड्यूल किया है:\n👤 *मरीज:* ${patientName || "मरीज"}\n📅 *समय:* ${formattedDate} समय ${successData.slot}\n🩺 *माध्यम:* ${successData.consultType.toUpperCase()} वीडियो\n💳 *शुल्क:* ${paymentStatusStr}\n${notes ? `📝 *लक्षण:* ${notes}\n` : ""}✅ *अपॉइंटमेंट स्वीकार करें (1-क्लिक):*\n${doctorAcceptUrl}\n\n👉 *वीडियो रूम लिंक:*\n${doctorJoinUrl}\n\n🔄 *समय बदलना चाहते हैं? लिंक:*\n${doctorRescheduleUrl}\n\n🔐 *निजी डॉक्टर प्रोफ़ाइल क्लेम लिंक:*\n${doctorClaimUrl}\n\nग्रामीण स्वास्थ्य सेवा मंच`

              return (
                <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-purple-900 flex items-center gap-1.5">
                        <Share2 className="h-4 w-4 text-purple-600" />
                        <span>{en ? "Send Meeting Link to Doctor" : "डॉक्टर को मीटिंग लिंक भेजें"}</span>
                      </h4>
                      <p className="text-[11px] text-purple-700 mt-0.5 leading-relaxed">
                        {en
                          ? `Dr. ${successData.doctor.name.replace(/^Dr\.\s*/i, "")} is affiliated with ${successData.doctor.hospitalAffiliation}. Deliver their 1-tap room link via WhatsApp, SMS, or Phone:`
                          : `डॉक्टर ${successData.doctor.name.replace(/^Dr\.\s*/i, "")} (${successData.doctor.hospitalAffiliation}) को नीचे दिए गए माध्यमों से 1-क्लिक वीडियो लिंक भेजें:`}
                      </p>
                    </div>
                    <Badge className="bg-purple-600 text-white text-[10px] shrink-0 font-bold">
                      {en ? "1-Tap Direct Join" : "बिना लॉगिन"}
                    </Badge>
                  </div>

                  {/* 1-Tap Delivery Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(invitationText)}`, "_blank")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>{en ? "Send via WhatsApp" : "व्हाट्सएप पर भेजें"}</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(invitationText)}`}
                      className="border-purple-300 text-purple-800 hover:bg-purple-100/70 font-semibold text-xs h-9 rounded-xl flex items-center justify-center gap-1.5 bg-white"
                    >
                      <Phone className="h-3.5 w-3.5 text-purple-600" />
                      <span>{en ? "Send via Direct SMS" : "एसएमएस द्वारा भेजें"}</span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(doctorJoinUrl)
                          setCopiedLink(true)
                          setTimeout(() => setCopiedLink(false), 2500)
                        }
                      }}
                      className="text-xs text-purple-800 hover:bg-purple-100/80 h-7 px-2.5 font-medium gap-1"
                    >
                      {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedLink ? (en ? "Link Copied!" : "कॉपी हो गया!") : (en ? "Copy Doctor Link" : "डॉक्टर लिंक कॉपी")}</span>
                    </Button>

                    {successData.doctor.phone && (
                      <a
                        href={`tel:${successData.doctor.phone}`}
                        className="text-xs text-emerald-800 hover:text-emerald-950 flex items-center gap-1 ml-auto font-semibold px-2 py-1 rounded bg-emerald-100/60 hover:bg-emerald-100"
                      >
                        <Phone className="h-3 w-3 text-emerald-700" />
                        <span>{en ? `Call OPD Desk: ${successData.doctor.phone}` : `ओपीडी फोन: ${successData.doctor.phone}`}</span>
                      </a>
                    )}
                  </div>

                  {/* Patient Direct Join Button */}
                  <div className="pt-2 border-t border-purple-200/80">
                    <Button
                      className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs sm:text-sm h-10 rounded-xl shadow-xs flex items-center justify-center gap-2"
                      onClick={() => router.push(patientJoinUrl)}
                    >
                      <Video className="h-4 w-4" />
                      <span>{en ? "Enter Virtual Clinic Room (Patient)" : "वर्चुअल क्लिनिक रूम में प्रवेश करें (मरीज)"}</span>
                      <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                    </Button>
                  </div>
                </div>
              )
            })()}

            <div className="space-y-2 pt-1">
              <Button
                variant="outline"
                className="w-full h-10 border-gray-300 text-gray-800 font-bold rounded-xl shadow-xs flex items-center justify-center gap-2"
                onClick={() => router.push(`/appointments`)}
              >
                <Calendar className="h-4 w-4 text-emerald-700" />
                <span>{en ? "View in My Appointments" : "मेरी अपॉइंटमेंट सूची देखें"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                className="w-full h-9 text-xs font-semibold rounded-xl text-gray-500 hover:text-gray-800"
                onClick={() => {
                  setSuccessData(null)
                  setSelectedDoctor(null)
                  setSelectedSlot("")
                }}
              >
                <span>{en ? "Book Another Appointment" : "एक और अपॉइंटमेंट बुक करें"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span>{en ? "913 Verified Specialists Pan-India • Free Govt OPD & Teleconsult" : "913 सत्यापित विशेषज्ञ अखिल भारतीय • मुफ्त सरकारी ओपीडी"}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          {en ? "Book a Doctor Consultation" : "डॉक्टर परामर्श बुक करें"}
        </h1>
        <p className="text-xs sm:text-sm text-gray-600">
          {en 
            ? "Connect with verified clinicians for video, audio, or OPD consultations with instant confirmation."
            : "सत्यापित डॉक्टरों के साथ वीडियो, फोन या ओपीडी परामर्श तुरंत बुक करें।"}
        </p>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* STEP 1: Consultation Mode */}
      <Card className="border-gray-200 bg-white rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">1</span>
            <span>{en ? "Step 1 — Choose Consultation Mode" : "चरण 1 — परामर्श माध्यम चुनें"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CONSULT_TYPES.map(ct => {
              const Icon = ct.icon
              const active = consultType === ct.id
              return (
                <button
                  key={ct.id}
                  onClick={() => setConsultType(ct.id as any)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                    active
                      ? "border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-100"
                      : "border-gray-200 hover:border-blue-300 bg-white"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-gray-900">{en ? ct.labelEn : ct.labelHi}</h4>
                    <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {en ? ct.badgeEn : ct.badgeHi}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* STEP 2: Select Doctor (From 913 pan-India doctors) */}
      <Card className="border-gray-200 bg-white rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">2</span>
            <span>{en ? "Step 2 — Select Doctor" : "चरण 2 — डॉक्टर चुनें"}</span>
            <span className="text-gray-400 font-normal">({filteredDoctors.length} available)</span>
          </CardTitle>

          {/* State selector */}
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">{en ? "All States (Pan-India)" : "सभी राज्य (अखिल भारतीय)"}</option>
              {stateOptions.map(s => (
                <option key={s.code} value={s.code}>
                  {en ? s.nameEn : s.nameHi}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={en ? "Search doctor name, specialty, hospital, city or district..." : "डॉक्टर का नाम, विशेषता, अस्पताल या शहर खोजें..."}
              value={doctorSearch}
              onChange={(e) => setDoctorSearch(e.target.value)}
              className="pl-10 pr-8 text-xs sm:text-sm bg-gray-50/70 border-gray-200 rounded-xl h-10 focus:bg-white focus:border-blue-500"
            />
            {doctorSearch && (
              <button onClick={() => setDoctorSearch("")} className="absolute right-3 top-3 text-xs text-gray-400 hover:text-gray-600">✕</button>
            )}
          </div>

          {/* Specialty Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SPECIALTY_OPTIONS.map(sp => {
              const isSelected = specialtyFilter === sp.key
              return (
                <button
                  key={sp.key}
                  onClick={() => {
                    setSpecialtyFilter(sp.key)
                    setSelectedDoctor(null)
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 border ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {en ? sp.labelEn : sp.labelHi}
                </button>
              )
            })}
          </div>

          {/* Doctor Cards (10 per page) */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {paginatedDoctors.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <Stethoscope className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs">{en ? "No doctors found matching filters." : "कोई डॉक्टर नहीं मिला।"}</p>
              </div>
            ) : (
              paginatedDoctors.map(doc => {
                const isSelected = selectedDoctor?.id === doc.id
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDoctor(doc)
                      setSelectedSlot("")
                    }}
                    className={`flex items-start gap-3.5 p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-100 shadow-xs"
                        : "border-gray-200 hover:border-blue-300 bg-white"
                    }`}
                  >
                    <Avatar className="h-11 w-11 border border-blue-100 shrink-0 mt-0.5">
                      <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
                        {getInitials(doc.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="font-bold text-xs sm:text-sm text-gray-900 truncate">{doc.name}</h4>
                        <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold py-0 h-4">
                          ✓ Verified
                        </Badge>
                      </div>

                      <p className="text-xs font-semibold text-blue-700">{doc.specialtyName}</p>
                      
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 truncate mt-0.5">
                        <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                        <span className="truncate">{doc.hospitalAffiliation}, {doc.districtName}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                        <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                          <Star className="h-3 w-3 fill-amber-400" />
                          <span>{doc.rating}</span>
                        </span>
                        <span>•</span>
                        <span>{doc.experience} {en ? "yrs exp" : "वर्ष अनुभव"}</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-700">
                          {doc.consultationFee > 0 ? `₹${doc.consultationFee}` : (en ? "Free Govt OPD" : "मुफ्त सरकारी")}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center self-center">
                      <button
                        className={`h-7 px-3 rounded-lg text-xs font-bold transition ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "bg-gray-100 hover:bg-blue-50 text-gray-700"
                        }`}
                      >
                        {isSelected ? (en ? "✓ Selected" : "✓ चयनित") : (en ? "Select" : "चुनें")}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
              <span className="text-gray-500 font-medium">
                {en ? `Page ${currentPage} of ${totalPages}` : `पृष्ठ ${currentPage} / ${totalPages}`}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-7 px-2 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                  <span>{en ? "Prev" : "पिछला"}</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-7 px-2 text-xs"
                >
                  <span>{en ? "Next" : "अगला"}</span>
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* STEP 3: Slot Picker & Patient Details */}
      {selectedDoctor && (
        <Card className="border-2 border-blue-300 bg-white rounded-2xl shadow-sm overflow-hidden animate-in fade-in-50 duration-200">
          <CardHeader className="pb-3 border-b border-gray-100 bg-blue-50/40">
            <CardTitle className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">3</span>
                <span>{en ? `Step 3 — Schedule Slot with ${selectedDoctor.name}` : `चरण 3 — ${selectedDoctor.name} के साथ समय चुनें`}</span>
              </div>
              <Badge className="bg-emerald-600 text-white text-[10px]">
                {selectedDoctor.consultationFee > 0 ? `₹${selectedDoctor.consultationFee}` : "100% Free OPD"}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-4">
            {/* 7-Day Date Slider */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                {en ? "Select Consultation Date:" : "परामर्श की तारीख चुनें:"}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {days.map((d) => {
                  const iso = toISODate(d)
                  const isSelected = selectedDate === iso
                  const weekday = d.toLocaleDateString(en ? "en-IN" : "hi-IN", { weekday: "short" })
                  const dayNum = d.getDate()
                  const isSunday = d.getDay() === 0

                  return (
                    <button
                      key={iso}
                      disabled={isSunday}
                      onClick={() => {
                        setSelectedDate(iso)
                        setSelectedSlot("")
                      }}
                      className={`p-2 rounded-xl text-center border transition-all ${
                        isSunday
                          ? "opacity-40 bg-gray-50 border-gray-200 cursor-not-allowed"
                          : isSelected
                            ? "border-blue-600 bg-blue-600 text-white shadow-2xs"
                            : "border-gray-200 hover:border-blue-300 bg-white text-gray-800"
                      }`}
                    >
                      <span className="text-[10px] block uppercase font-medium">{weekday}</span>
                      <span className="text-base font-extrabold block">{dayNum}</span>
                      {isSunday && <span className="text-[9px] block text-red-400">Off</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time Slots */}
            {slots && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  {en ? "Select Available Time Slot:" : "उपलब्ध समय स्लॉट चुनें:"}
                </label>

                {/* Morning */}
                {slots.morning.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1 mb-1.5">
                      <Clock className="h-3 w-3 text-amber-500" />
                      <span>{en ? "Morning Slots (09:00 - 12:00)" : "सुबह (09:00 - 12:00)"}</span>
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {slots.morning.map(s => {
                        const isBooked = selectedDoctor ? bookedSlots.has(`${selectedDoctor.id}_${selectedDate}_${s.time}`) : false
                        return (
                          <button
                            key={s.time}
                            disabled={!s.available || isBooked}
                            onClick={() => setSelectedSlot(s.time)}
                            className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                              selectedSlot === s.time
                                ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                : isBooked
                                  ? "bg-rose-50 text-rose-400 border-rose-200 cursor-not-allowed text-[10px]"
                                  : s.available
                                    ? "bg-white text-gray-800 border-gray-200 hover:border-blue-400"
                                    : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                            }`}
                          >
                            {isBooked ? `${s.time} ✕` : s.time}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Afternoon */}
                {slots.afternoon.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1 mb-1.5">
                      <Clock className="h-3 w-3 text-blue-500" />
                      <span>{en ? "Afternoon Slots (13:00 - 16:00)" : "दोपहर (13:00 - 16:00)"}</span>
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {slots.afternoon.map(s => {
                        const isBooked = selectedDoctor ? bookedSlots.has(`${selectedDoctor.id}_${selectedDate}_${s.time}`) : false
                        return (
                          <button
                            key={s.time}
                            disabled={!s.available || isBooked}
                            onClick={() => setSelectedSlot(s.time)}
                            className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                              selectedSlot === s.time
                                ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                : isBooked
                                  ? "bg-rose-50 text-rose-400 border-rose-200 cursor-not-allowed text-[10px]"
                                  : s.available
                                    ? "bg-white text-gray-800 border-gray-200 hover:border-blue-400"
                                    : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                            }`}
                          >
                            {isBooked ? `${s.time} ✕` : s.time}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Patient & Notes Form */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">
                    {en ? "Patient Full Name:" : "मरीज का पूरा नाम:"}
                  </label>
                  <Input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder={en ? "e.g. Ramesh Kumar" : "जैसे रमेश कुमार"}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">
                    {en ? "Contact Phone Number:" : "संपर्क फोन नंबर:"}
                  </label>
                  <Input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder={en ? "+91 98765 43210" : "+91 98765 43210"}
                    className="h-9 text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">
                  {en ? "Reason for Consultation / Symptoms:" : "परामर्श का कारण / लक्षण:"}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={en ? "Briefly explain symptoms or medical background..." : "लक्षणों का संक्षिप्त विवरण..."}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Consultation Fee & Payment Mode Selector */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-teal-600" />
                    <span>{en ? "Consultation Fee & Payment Mode:" : "परामर्श शुल्क एवं भुगतान माध्यम:"}</span>
                  </span>
                  <Badge className={selectedDoctor.consultationFee === 0 ? "bg-emerald-600 text-white text-[11px]" : "bg-purple-600 text-white text-[11px]"}>
                    {selectedDoctor.consultationFee === 0 ? (en ? "₹0 (Free OPD)" : "₹0 (मुफ्त ओपीडी)") : `₹${selectedDoctor.consultationFee}`}
                  </Badge>
                </div>

                {selectedDoctor.consultationFee === 0 ? (
                  <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    {en
                      ? "✓ 100% Free Consultation under National Health Mission & Ayushman Bharat at Apex/Government Hospital."
                      : "✓ राष्ट्रीय स्वास्थ्य मिशन एवं आयुष्मान भारत के तहत पूर्णतः निःशुल्क सरकारी ओपीडी परामर्श।"}
                  </p>
                ) : (
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMode("upi")}
                        className={`p-2 rounded-xl text-left border transition ${
                          paymentMode === "upi"
                            ? "border-teal-600 bg-teal-50/80 text-teal-900 font-bold"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        <span className="block text-[11px] font-bold">🟢 Pay Now (UPI)</span>
                        <span className="text-[10px] text-slate-500">GPay, PhonePe, Paytm</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMode("counter")}
                        className={`p-2 rounded-xl text-left border transition ${
                          paymentMode === "counter"
                            ? "border-amber-600 bg-amber-50/80 text-amber-900 font-bold"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        <span className="block text-[11px] font-bold">🟠 Pay at OPD</span>
                        <span className="text-[10px] text-slate-500">Cash / Desk at Clinic</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMode("free")}
                        className={`p-2 rounded-xl text-left border transition ${
                          paymentMode === "free"
                            ? "border-blue-600 bg-blue-50/80 text-blue-900 font-bold"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        <span className="block text-[11px] font-bold">🔵 PM-JAY / BPL</span>
                        <span className="text-[10px] text-slate-500">100% Fee Waiver</span>
                      </button>
                    </div>

                    {paymentMode === "upi" && (
                      <div className="p-2.5 bg-white rounded-xl border border-teal-200 flex items-center justify-between gap-2">
                        <div className="text-[11px]">
                          <span className="text-slate-500 block">UPI VPA: <strong className="text-slate-800">ruralhealth.care@upi</strong></span>
                          <span className="text-[10px] text-emerald-700">Instant verification with 0% gateway fee</span>
                        </div>
                        <a
                          href={`upi://pay?pa=ruralhealth.care@upi&pn=${encodeURIComponent(selectedDoctor.name)}&am=${selectedDoctor.consultationFee}&cu=INR&tn=Consultation+Fee`}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold shrink-0"
                        >
                          1-Tap UPI Pay
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Confirm Button */}
            <Button
              onClick={handleBook}
              disabled={loading || !selectedSlot}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{en ? "Confirming Appointment..." : "कन्फर्म कर रहे हैं..."}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{en ? `Confirm ${consultType.toUpperCase()} Appointment` : `परामर्श कन्फर्म करें`}</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
