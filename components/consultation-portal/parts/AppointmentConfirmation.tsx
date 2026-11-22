"use client"

/**
 * components/consultation-portal/parts/AppointmentConfirmation.tsx
 *
 * Successful appointment confirmation view with 1-tap dispatch to doctor.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Consultation Subsystem
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  CheckCircle2,
  MapPin,
  Share2,
  Phone,
  Video,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  ArrowRight,
  FileText,
} from "lucide-react"
import { consultationJoinPath } from "../booking-client"
import type { BookingSuccessData } from "../types"
import { getInitials } from "../types"

interface AppointmentConfirmationProps {
  successData: BookingSuccessData
  language: string
  en: boolean
  patientName: string
  notes: string
  onReset: () => void
}

export function AppointmentConfirmation({
  successData,
  language,
  en,
  patientName,
  notes,
  onReset,
}: AppointmentConfirmationProps) {
  const router = useRouter()
  const [copiedLink, setCopiedLink] = useState(false)

  const formattedDate = new Date(successData.date).toLocaleDateString(en ? "en-IN" : "hi-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const patientJoinUrl = consultationJoinPath(successData.appointmentId, language)
  const doctorJoinUrl = `${origin}${patientJoinUrl}`
  const doctorAcceptUrl = `${origin}/doctor/requests`
  const doctorRescheduleUrl = doctorAcceptUrl
  const cleanPhone = (successData.doctor.phone || "").replace(/[^\d+]/g, "")

  const paymentStatusStr = successData.doctor.consultationFee === undefined
    ? "Confirm consultation fees directly with the provider"
    : successData.doctor.consultationFee === 0 ? "No consultation fee listed" : `Listed fee ₹${successData.doctor.consultationFee}; payment not verified`

  const invitationText = en
    ? `🏥 *RURAL HEALTHCARE TELEMEDICINE — NEW APPOINTMENT*\n\nRespected ${
        successData.doctor.name
      },\n\nA patient has requested a teleconsultation:\n👤 *Patient:* ${
        patientName || "Patient"
      }\n📅 *Slot:* ${formattedDate} at ${
        successData.slot
      }\n🩺 *Mode:* ${successData.consultType.toUpperCase()} Call\n💳 *Fee:* ${paymentStatusStr}\n${
        notes ? `📝 *Symptoms:* ${notes}\n` : ""
      }📋 *Review the appointment after signing in:*\n${doctorAcceptUrl}\n\n👉 *Join Video Clinic Room:*\n${doctorJoinUrl}\n\n🔄 *Propose New Time:*\n${doctorRescheduleUrl}\n\nRural Healthcare Platform`
    : `🏥 *ग्रामीण स्वास्थ्य सेवा — नया परामर्श अनुरोध*\n\nआदरणीय ${
        successData.doctor.name
      },\n\nएक मरीज ने आपके साथ परामर्श शेड्यूल किया है:\n👤 *मरीज:* ${
        patientName || "मरीज"
      }\n📅 *समय:* ${formattedDate} समय ${
        successData.slot
      }\n🩺 *माध्यम:* ${successData.consultType.toUpperCase()} वीडियो\n💳 *शुल्क:* ${paymentStatusStr}\n${
        notes ? `📝 *लक्षण:* ${notes}\n` : ""
      }📋 *लॉगिन करके अपॉइंटमेंट की समीक्षा करें:*\n${doctorAcceptUrl}\n\n👉 *वीडियो रूम लिंक:*\n${doctorJoinUrl}\n\n🔄 *समय बदलना चाहते हैं? लिंक:*\n${doctorRescheduleUrl}\n\nग्रामीण स्वास्थ्य सेवा मंच`

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      <Card className="border-2 border-emerald-300 bg-white shadow-lg rounded-3xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
          <div className="h-16 w-16 bg-white/20 backdrop-blur-xs rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-white/40 shadow-xs">
            <CheckCircle2 className="h-9 w-9 text-white" />
          </div>
          <h2 className="text-2xl font-black">{en ? "Appointment Scheduled!" : "अपॉइंटमेंट शेड्यूल हो गया!"}</h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1">
            {en
              ? "Your appointment was saved. Sign in to join during its scheduled consultation window."
              : "आपकी अपॉइंटमेंट सेव हो गई है। निर्धारित समय पर लॉगिन करके जुड़ें।"}
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
                  <span>
                    {successData.doctor.hospitalAffiliation}, {successData.doctor.districtName}
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 text-xs">
              <div>
                <span className="text-gray-400 block text-[11px] font-semibold">
                  {en ? "Date & Time:" : "तारीख व समय:"}
                </span>
                <span className="font-bold text-gray-800">
                  {formattedDate} at {successData.slot}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px] font-semibold">
                  {en ? "Consultation Mode:" : "परामर्श माध्यम:"}
                </span>
                <span className="font-bold text-gray-800 capitalize">
                  {successData.consultType} Call
                </span>
              </div>
            </div>
          </div>

          {/* DOCTOR DELIVERY DISPATCH SECTION */}
          <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-purple-900 flex items-center gap-1.5">
                  <Share2 className="h-4 w-4 text-purple-600" />
                  <span>{en ? "Send Meeting Link to Doctor" : "डॉक्टर को मीटिंग लिंक भेजें"}</span>
                </h4>
                <p className="text-[11px] text-purple-700 mt-0.5 leading-relaxed">
                  {en
                    ? `Dr. ${successData.doctor.name.replace(/^Dr\.\s*/i, "")} is affiliated with ${
                        successData.doctor.hospitalAffiliation
                      }. Share the appointment link; the assigned doctor must sign in to join:`
                    : `डॉक्टर ${successData.doctor.name.replace(/^Dr\.\s*/i, "")} (${
                        successData.doctor.hospitalAffiliation
                      }) को अपॉइंटमेंट लिंक भेजें; जुड़ने के लिए डॉक्टर को लॉगिन करना होगा:`}
                </p>
              </div>
              <Badge className="bg-purple-600 text-white text-[10px] shrink-0 font-bold">
                {en ? "Sign-in Required" : "लॉगिन आवश्यक"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <Button data-voice-control="ui.793195ffdbadd79d"
                size="sm"
                onClick={() =>
                  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(invitationText)}`, "_blank")
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 rounded-xl shadow-xs flex items-center justify-center gap-1.5"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>{en ? "Send via WhatsApp" : "व्हाट्सएप पर भेजें"}</span>
              </Button>

              <Button data-voice-control="ui.a73f9e7c7378b3fb"
                size="sm"
                variant="outline"
                onClick={() => (window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(invitationText)}`)}
                className="border-purple-300 text-purple-800 hover:bg-purple-100/70 font-semibold text-xs h-9 rounded-xl flex items-center justify-center gap-1.5 bg-white"
              >
                <Phone className="h-3.5 w-3.5 text-purple-600" />
                <span>{en ? "Send via Direct SMS" : "एसएमएस द्वारा भेजें"}</span>
              </Button>
            </div>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <Button data-voice-control="ui.97173b2ab64c5534"
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
                <span>
                  {copiedLink ? (en ? "Link Copied!" : "कॉपी हो गया!") : en ? "Copy Doctor Link" : "डॉक्टर लिंक कॉपी"}
                </span>
              </Button>

              {successData.doctor.phone && (
                <a data-voice-control="ui.d12b2ac0fb363b3b"
                  href={`tel:${successData.doctor.phone}`}
                  className="text-xs text-emerald-800 hover:text-emerald-950 flex items-center gap-1 ml-auto font-semibold px-2 py-1 rounded bg-emerald-100/60 hover:bg-emerald-100"
                >
                  <Phone className="h-3 w-3 text-emerald-700" />
                  <span>
                    {en
                      ? `Call OPD Desk: ${successData.doctor.phone}`
                      : `ओपीडी फोन: ${successData.doctor.phone}`}
                  </span>
                </a>
              )}
            </div>

            <div className="pt-2 border-t border-purple-200/80">
              <Button data-voice-control="ui.030aa8bbde7510f0"
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs sm:text-sm h-10 rounded-xl shadow-xs flex items-center justify-center gap-2"
                onClick={() => router.push(patientJoinUrl)}
              >
                <Video className="h-4 w-4" />
                <span>
                  {en ? "Enter Virtual Clinic Room (Patient)" : "वर्चुअल क्लिनिक रूम में प्रवेश करें (मरीज)"}
                </span>
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <Button data-voice-control="ui.62b026786ee0135f"
              variant="outline"
              className="w-full h-10 border-teal-300 text-teal-800 bg-teal-50 hover:bg-teal-100 font-bold rounded-xl shadow-xs flex items-center justify-center gap-2"
              onClick={() => router.push(`/records`)}
            >
              <FileText className="h-4 w-4 text-teal-700" />
              <span>{en ? "Go to My Medical Records" : "मेरे मेडिकल रिकॉर्ड पर जाएं"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button data-voice-control="ui.86710f9ef3f712f1"
              variant="outline"
              className="w-full h-10 border-gray-300 text-gray-800 font-bold rounded-xl shadow-xs flex items-center justify-center gap-2"
              onClick={() => router.push(`/appointments`)}
            >
              <Calendar className="h-4 w-4 text-emerald-700" />
              <span>{en ? "View in My Appointments" : "मेरी अपॉइंटमेंट सूची देखें"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button data-voice-control="ui.5ed40b741ab7604f"
              variant="ghost"
              className="w-full h-9 text-xs font-semibold rounded-xl text-gray-500 hover:text-gray-800"
              onClick={onReset}
            >
              <span>{en ? "Book Another Appointment" : "एक और अपॉइंटमेंट बुक करें"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
