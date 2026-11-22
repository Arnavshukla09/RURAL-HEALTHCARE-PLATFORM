"use client"

/**
 * components/consultation-portal/index.tsx
 *
 * Telemedicine & In-Person Doctor Consultation Portal.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Consultation Subsystem
 */

import { useState, useMemo, useEffect } from "react"
import { Sparkles, X } from "lucide-react"
import { REAL_DOCTORS, RealDoctor } from "@/lib/data/real-doctors"
import { LGD_STATES } from "@/lib/geo/lgd-iphs"
import { createClient } from "@/lib/supabase/client"
import { triggerAppointmentBooked } from "@/lib/notifications/notification-engine"
import type { ConsultationPortalProps, BookingSuccessData } from "./types"
import { getNext7Days, toISODate } from "./types"
import { bookVerifiedConsultation } from "./booking-client"
import { assistantAction, type AssistantSlot } from "@/lib/assistant/client-actions"
import { ConsultationModeStep } from "./parts/ConsultationModeStep"
import { DoctorSelectionStep } from "./parts/DoctorSelectionStep"
import { BookingFormStep } from "./parts/BookingFormStep"
import { AppointmentConfirmation } from "./parts/AppointmentConfirmation"

export function ConsultationPortal({ language, user, symptomResult }: ConsultationPortalProps) {
  const en = language === "en"

  const symptomPreFill = useMemo(() => {
    if (!symptomResult) return ""
    const parts: string[] = []
    if (symptomResult.symptoms?.length)
      parts.push(`${en ? "Symptoms" : "लक्षण"}: ${symptomResult.symptoms.join(", ")}`)
    if (symptomResult.urgency)
      parts.push(`${en ? "Urgency" : "तात्कालिकता"}: ${symptomResult.urgency}`)
    if (symptomResult.possibleConditions?.length)
      parts.push(
        `${en ? "Possible conditions" : "संभावित स्थितियां"}: ${symptomResult.possibleConditions
          .slice(0, 3)
          .join(", ")}`
      )
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

  // Doctor Filter & Search State
  const [doctorSearch, setDoctorSearch] = useState("")
  const [specialtyFilter, setSpecialtyFilter] = useState("all")
  const [stateFilter, setStateFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10

  // Payment & Conflict Protection
  const [paymentMode, setPaymentMode] = useState<"upi" | "counter" | "free">("upi")
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set())
  const [serverSlots, setServerSlots] = useState<AssistantSlot[]>([])

  const [loading, setLoading] = useState(false)
  const [successData, setSuccessData] = useState<BookingSuccessData | null>(null)
  const [error, setError] = useState("")
  const [dbProviders, setDbProviders] = useState<any[]>([])

  useEffect(() => {
    let active = true
    const fetchDbProviders = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from("healthcare_providers")
          .select("id, name, specialization, location, phone, email, is_verified, user_id")
          .eq("is_verified", true)
        if (active && data) {
          setDbProviders(data)
        }
      } catch (e) {
        console.warn("[ConsultationPortal] DB providers fetch error:", e)
      }
    }
    fetchDbProviders()
    return () => {
      active = false
    }
  }, [])

  const stateOptions = useMemo(() => {
    return LGD_STATES.map((s) => ({
      code: s.code,
      nameEn: s.nameEn,
      nameHi: s.nameHi,
    }))
  }, [])

  const filteredDoctors = useMemo(() => {
    let list: RealDoctor[] = dbProviders.filter((provider) => provider.id && provider.name).map((provider) => {
      const registry = REAL_DOCTORS.find((doctor) => doctor.providerId === provider.id)
      return {
        ...registry, id: provider.id, providerId: provider.id, name: provider.name,
        specialty: registry?.specialty || "general", specialtyName: provider.specialization || "",
        hospitalAffiliation: provider.location || registry?.hospitalAffiliation || "",
        stateCode: registry?.stateCode || "", stateName: registry?.stateName || "",
        districtName: registry?.districtName || "", location: provider.location || "",
        phone: provider.phone || "", verified: true, verificationStatus: "source_confirmed",
        recordType: "clinician", sourceName: "Registered platform provider",
        lat: registry?.lat || 0, lon: registry?.lon || 0, available: true, bio: registry?.bio || "",
      }
    })

    if (specialtyFilter !== "all") {
      list = list.filter((d) => d.specialty === specialtyFilter)
    }

    if (stateFilter !== "all") {
      list = list.filter((d) => d.stateCode === stateFilter)
    }

    if (doctorSearch.trim()) {
      const q = doctorSearch.toLowerCase().trim()
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialtyName.toLowerCase().includes(q) ||
          d.hospitalAffiliation.toLowerCase().includes(q) ||
          d.districtName.toLowerCase().includes(q) ||
          d.stateName.toLowerCase().includes(q) ||
          (d.qualifications ? d.qualifications.toLowerCase().includes(q) : false)
      )
    }

    return list
  }, [specialtyFilter, stateFilter, doctorSearch, dbProviders])

  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / PAGE_SIZE))
  const paginatedDoctors = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredDoctors.slice(start, start + PAGE_SIZE)
  }, [filteredDoctors, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [doctorSearch, specialtyFilter, stateFilter])

  useEffect(() => {
    let active = true
    setServerSlots([])
    setSelectedSlot("")
    if (selectedDoctor?.providerId) {
      assistantAction<{ slots: AssistantSlot[] }>("appointments.slots", { providerId: selectedDoctor.providerId, date: selectedDate })
        .then((result) => { if (active) setServerSlots(result.slots) })
        .catch(() => { if (active) setError(en ? "Unable to check appointment slots. Try again when connected." : "समय उपलब्धता जांच नहीं हो सकी। कनेक्शन मिलने पर फिर प्रयास करें।") })
    }
    return () => { active = false }
  }, [selectedDoctor?.providerId, selectedDate, en])

  const slots = useMemo(() => {
    if (!selectedDoctor) return null
    const mapped = serverSlots.map((slot) => {
      const india = new Date(Date.parse(slot.appointmentDate) + 330 * 60000)
      return { time: `${String(india.getUTCHours()).padStart(2, "0")}:${String(india.getUTCMinutes()).padStart(2, "0")}`, available: slot.available }
    })
    return { morning: mapped.filter((slot) => slot.time < "12:00"), afternoon: mapped.filter((slot) => slot.time >= "12:00"), evening: [] }
  }, [selectedDoctor, serverSlots])

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
      if (!selectedDoctor.providerId || !dbProviders.some((provider) => provider.id === selectedDoctor.providerId)) {
        throw new Error(en ? "This clinician is not registered for platform booking. Choose a registered provider." : "यह डॉक्टर मंच पर बुकिंग के लिए पंजीकृत नहीं है। पंजीकृत डॉक्टर चुनें।")
      }
      const appointmentDate = new Date(`${selectedDate}T${selectedSlot}:00+05:30`).toISOString()
      const fullNotes = [patientName ? `Patient: ${patientName}` : "", patientPhone ? `Contact: ${patientPhone}` : "", notes.trim()].filter(Boolean).join(" | ")
      const appointment = await bookVerifiedConsultation({ provider_id: selectedDoctor.providerId, appointment_date: appointmentDate, consultation_type: consultType, notes: fullNotes })
      const slotKey = `${selectedDoctor.id}_${selectedDate}_${selectedSlot}`
      setBookedSlots((previous) => new Set([...previous, slotKey]))
      triggerAppointmentBooked({
        appointmentId: appointment.id, doctorName: selectedDoctor.name,
        doctorSpecialty: selectedDoctor.specialtyName, hospitalName: selectedDoctor.hospitalAffiliation,
        date: selectedDate, time: selectedSlot, consultType, patientName: patientName || user?.name || "",
        patientUserId: user?.id, roomId: appointment.teleconsult_room_id,
      }).catch(() => {})
      setSuccessData({ doctor: selectedDoctor, date: selectedDate, slot: selectedSlot, consultType: appointment.consultation_type, appointmentId: appointment.id, roomId: appointment.teleconsult_room_id, paymentMode: selectedDoctor.consultationFee === 0 ? "free" : paymentMode })
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : en ? "Booking was not confirmed. Check My Appointments before retrying." : "बुकिंग की पुष्टि नहीं हुई। फिर प्रयास से पहले मेरी अपॉइंटमेंट देखें।")
    } finally {
      setLoading(false)
    }
  }

  if (successData) {
    return (
      <AppointmentConfirmation
        successData={successData}
        language={language}
        en={en}
        patientName={patientName}
        notes={notes}
        onReset={() => {
          setSuccessData(null)
          setSelectedDoctor(null)
          setSelectedSlot("")
        }}
      />
    )
  }

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span>
            {en
              ? `${dbProviders.length} Registered Providers • Consultation Requests`
              : `${dbProviders.length} पंजीकृत डॉक्टर • परामर्श अनुरोध`}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          {en ? "Book a Doctor Consultation" : "डॉक्टर परामर्श बुक करें"}
        </h1>
        <p className="text-xs sm:text-sm text-gray-600">
          {en
            ? "Choose a registered clinician and an available platform slot. Clinic schedules and fees should be confirmed with the provider."
            : "पंजीकृत डॉक्टर और मंच पर उपलब्ध समय चुनें। क्लिनिक का समय और शुल्क डॉक्टर से पुष्टि करें।"}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <ConsultationModeStep
        en={en}
        consultType={consultType}
        setConsultType={setConsultType}
      />

      <DoctorSelectionStep
        en={en}
        filteredDoctors={filteredDoctors}
        paginatedDoctors={paginatedDoctors}
        selectedDoctor={selectedDoctor}
        setSelectedDoctor={setSelectedDoctor}
        setSelectedSlot={setSelectedSlot}
        stateFilter={stateFilter}
        setStateFilter={setStateFilter}
        stateOptions={stateOptions}
        doctorSearch={doctorSearch}
        setDoctorSearch={setDoctorSearch}
        specialtyFilter={specialtyFilter}
        setSpecialtyFilter={setSpecialtyFilter}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />

      {selectedDoctor && (
        <BookingFormStep
          en={en}
          selectedDoctor={selectedDoctor}
          days={days}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedSlot={selectedSlot}
          setSelectedSlot={setSelectedSlot}
          slots={slots}
          bookedSlots={bookedSlots}
          patientName={patientName}
          setPatientName={setPatientName}
          patientPhone={patientPhone}
          setPatientPhone={setPatientPhone}
          notes={notes}
          setNotes={setNotes}
          paymentMode={paymentMode}
          setPaymentMode={setPaymentMode}
          loading={loading}
          consultType={consultType}
          onBook={handleBook}
        />
      )}
    </div>
  )
}

export default ConsultationPortal
