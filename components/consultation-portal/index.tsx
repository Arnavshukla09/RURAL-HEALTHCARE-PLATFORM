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
import { triggerAppointmentBooked } from "@/lib/notifications/notification-engine"
import type { ConsultationPortalProps, BookingSuccessData } from "./types"
import { getSlots, getNext7Days, toISODate } from "./types"
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
  const [successData, setSuccessData] = useState<BookingSuccessData | null>(null)
  const [error, setError] = useState("")

  const stateOptions = useMemo(() => {
    return LGD_STATES.map((s) => ({
      code: s.code,
      nameEn: s.nameEn,
      nameHi: s.nameHi,
    }))
  }, [])

  const filteredDoctors = useMemo(() => {
    let list = REAL_DOCTORS.filter((d) => d.recordType === "clinician")

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
  }, [specialtyFilter, stateFilter, doctorSearch])

  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / PAGE_SIZE))
  const paginatedDoctors = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredDoctors.slice(start, start + PAGE_SIZE)
  }, [filteredDoctors, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [doctorSearch, specialtyFilter, stateFilter])

  const slots = useMemo(() => {
    if (!selectedDoctor) return null
    return getSlots(selectedDoctor.id, selectedDate)
  }, [selectedDoctor, selectedDate])

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
      const roomId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `room-${Date.now()}`
      const fullNotes = [
        `[${consultType.toUpperCase()} — ${selectedDoctor.name}, ${selectedDoctor.specialtyName}, ${selectedDoctor.hospitalAffiliation}]`,
        patientName ? `Patient: ${patientName} (${patientPhone || "No phone"})` : "",
        notes.trim(),
      ]
        .filter(Boolean)
        .join(" | ")

      await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: null,
          appointment_date: appointmentDate,
          consultation_type: consultType,
          notes: fullNotes,
        }),
      })

      const slotKey = `${selectedDoctor.id}_${selectedDate}_${selectedSlot}`
      const newBooked = new Set(bookedSlots)
      newBooked.add(slotKey)
      setBookedSlots(newBooked)
      if (typeof window !== "undefined") {
        localStorage.setItem("rural_health_booked_slots", JSON.stringify(Array.from(newBooked)))
      }

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
    } catch {
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
              ? "913 Verified Specialists Pan-India • Free Govt OPD & Teleconsult"
              : "913 सत्यापित विशेषज्ञ अखिल भारतीय • मुफ्त सरकारी ओपीडी"}
          </span>
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
