"use client"

/**
 * components/consultation-portal/parts/BookingFormStep.tsx
 *
 * Step 3: Date slider, time slots, patient info, UPI/Counter payment, submit button.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Consultation Subsystem
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Clock, CreditCard, Loader2, CheckCircle2 } from "lucide-react"
import type { RealDoctor } from "@/lib/data/real-doctors"
import { toISODate } from "../types"

interface BookingFormStepProps {
  en: boolean
  selectedDoctor: RealDoctor
  days: Date[]
  selectedDate: string
  setSelectedDate: (date: string) => void
  selectedSlot: string
  setSelectedSlot: (slot: string) => void
  slots: {
    morning: { time: string; available: boolean }[]
    afternoon: { time: string; available: boolean }[]
    evening: { time: string; available: boolean }[]
  } | null
  bookedSlots: Set<string>
  patientName: string
  setPatientName: (name: string) => void
  patientPhone: string
  setPatientPhone: (phone: string) => void
  notes: string
  setNotes: (notes: string) => void
  paymentMode: "upi" | "counter" | "free"
  setPaymentMode: (mode: "upi" | "counter" | "free") => void
  loading: boolean
  consultType: string
  onBook: () => void
}

export function BookingFormStep({
  en,
  selectedDoctor,
  days,
  selectedDate,
  setSelectedDate,
  selectedSlot,
  setSelectedSlot,
  slots,
  bookedSlots,
  patientName,
  setPatientName,
  patientPhone,
  setPatientPhone,
  notes,
  setNotes,
  paymentMode,
  setPaymentMode,
  loading,
  consultType,
  onBook,
}: BookingFormStepProps) {
  return (
    <Card className="border-2 border-blue-300 bg-white rounded-2xl shadow-sm overflow-hidden animate-in fade-in-50 duration-200">
      <CardHeader className="pb-3 border-b border-gray-100 bg-blue-50/40">
        <CardTitle className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
              3
            </span>
            <span>
              {en
                ? `Step 3 — Schedule Slot with ${selectedDoctor.name}`
                : `चरण 3 — ${selectedDoctor.name} के साथ समय चुनें`}
            </span>
          </div>
          <Badge className="bg-emerald-600 text-white text-[10px]">
            {(selectedDoctor.consultationFee ?? 0) > 0 ? `₹${selectedDoctor.consultationFee}` : "100% Free OPD"}
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
                  {slots.morning.map((s) => {
                    const isBooked = bookedSlots.has(`${selectedDoctor.id}_${selectedDate}_${s.time}`)
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
                  {slots.afternoon.map((s) => {
                    const isBooked = bookedSlots.has(`${selectedDoctor.id}_${selectedDate}_${s.time}`)
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
                placeholder="+91 98765 43210"
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
              <Badge
                className={
                  selectedDoctor.consultationFee === 0
                    ? "bg-emerald-600 text-white text-[11px]"
                    : "bg-purple-600 text-white text-[11px]"
                }
              >
                {selectedDoctor.consultationFee === 0
                  ? en
                    ? "₹0 (Free OPD)"
                    : "₹0 (मुफ्त ओपीडी)"
                  : `₹${selectedDoctor.consultationFee}`}
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
                      <span className="text-slate-500 block">
                        UPI VPA: <strong className="text-slate-800">ruralhealth.care@upi</strong>
                      </span>
                      <span className="text-[10px] text-emerald-700">Instant verification with 0% gateway fee</span>
                    </div>
                    <a
                      href={`upi://pay?pa=ruralhealth.care@upi&pn=${encodeURIComponent(
                        selectedDoctor.name
                      )}&am=${selectedDoctor.consultationFee}&cu=INR&tn=Consultation+Fee`}
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
          onClick={onBook}
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
              <span>{en ? `Confirm ${consultType.toUpperCase()} Appointment` : "परामर्श कन्फर्म करें"}</span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
