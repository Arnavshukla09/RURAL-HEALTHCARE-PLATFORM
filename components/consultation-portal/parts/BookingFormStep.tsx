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
            {selectedDoctor.consultationFee === undefined ? (en ? "Ask provider about fees" : "शुल्क डॉक्टर से पूछें") : `₹${selectedDoctor.consultationFee}`}
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
                  <span>{en ? "Afternoon Slots (12:00 - 16:30)" : "दोपहर (13:00 - 16:00)"}</span>
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

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            {en ? "This platform does not collect consultation payments. Confirm the clinic's fee and payment details directly with the provider." : "यह मंच परामर्श भुगतान नहीं लेता। क्लिनिक का शुल्क और भुगतान विवरण डॉक्टर से पुष्टि करें।"}
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
