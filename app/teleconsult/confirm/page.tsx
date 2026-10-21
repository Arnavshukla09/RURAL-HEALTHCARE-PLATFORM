"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Video,
  ArrowRight,
  RotateCcw,
  XCircle,
  ShieldCheck,
  Building2,
  FileText,
  CreditCard,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { triggerAppointmentStatusUpdated } from "@/lib/notifications/notification-engine"

function TeleconsultConfirmContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const roomId = searchParams.get("id") || `room-${Date.now()}`
  const initialAction = searchParams.get("action") || "view"
  const doctorName = searchParams.get("doc") || "Doctor"
  const patientName = searchParams.get("patient") || "Patient"
  const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0]
  const timeStr = searchParams.get("time") || "10:30 AM"
  const fee = parseInt(searchParams.get("fee") || "0", 10)
  const mode = searchParams.get("mode") || "video"
  const lang = searchParams.get("lang") || "en"
  const en = lang === "en"

  const [status, setStatus] = useState<"pending" | "accepted" | "rescheduling" | "declined">(
    initialAction === "accept" ? "accepted" : "pending"
  )
  const [rescheduleSlot, setRescheduleSlot] = useState("Tomorrow at 11:00 AM")
  const [doctorNote, setDoctorNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [confirmedMessage, setConfirmedMessage] = useState("")

  useEffect(() => {
    if (initialAction === "accept" && status === "accepted") {
      // Auto-trigger confirmation notification to patient
      triggerAppointmentStatusUpdated({
        appointmentId: roomId,
        doctorName: doctorName.startsWith("Dr.") ? doctorName : `Dr. ${doctorName}`,
        patientName: patientName,
        date: dateStr,
        newStatus: "scheduled",
      })
      setConfirmedMessage(
        en
          ? `You have accepted this appointment. The patient has been notified with an instant notification.`
          : `आपने इस परामर्श को स्वीकार कर लिया है। मरीज को तुरंत सूचना भेज दी गई है।`
      )
    }
  }, [initialAction, status, doctorName, patientName, dateStr, roomId, en])

  const handleAccept = async () => {
    setSubmitting(true)
    try {
      await triggerAppointmentStatusUpdated({
        appointmentId: roomId,
        doctorName: doctorName.startsWith("Dr.") ? doctorName : `Dr. ${doctorName}`,
        patientName: patientName,
        date: dateStr,
        newStatus: "scheduled",
      })
      setStatus("accepted")
      setConfirmedMessage(
        en
          ? `Appointment successfully confirmed! The patient has received your confirmation alert.`
          : `अपॉइंटमेंट सफलतापूर्वक कन्फर्म! मरीज को आपकी स्वीकृति सूचना मिल गई है।`
      )
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRescheduleSubmit = async () => {
    setSubmitting(true)
    try {
      await triggerAppointmentStatusUpdated({
        appointmentId: roomId,
        doctorName: doctorName.startsWith("Dr.") ? doctorName : `Dr. ${doctorName}`,
        patientName: patientName,
        date: dateStr,
        newStatus: "scheduled",
      })
      setStatus("accepted")
      setConfirmedMessage(
        en
          ? `Reschedule request sent to patient for: ${rescheduleSlot}. Patient can accept or pick another slot.`
          : `मरीज को नया समय (${rescheduleSlot}) भेजा गया है। मरीज इसे स्वीकार कर सकता है।`
      )
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDecline = async () => {
    setSubmitting(true)
    try {
      await triggerAppointmentStatusUpdated({
        appointmentId: roomId,
        doctorName: doctorName.startsWith("Dr.") ? doctorName : `Dr. ${doctorName}`,
        patientName: patientName,
        date: dateStr,
        newStatus: "cancelled",
      })
      setStatus("declined")
      setConfirmedMessage(
        en
          ? `Appointment declined. The patient has been notified to choose another clinician.`
          : `अपॉइंटमेंट अस्वीकार किया गया। मरीज को अन्य डॉक्टर चुनने की सलाह दी गई है।`
      )
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const doctorRoomUrl = `/teleconsult/room?id=${roomId}&name=${encodeURIComponent(doctorName)}&role=doctor&lang=${lang}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-indigo-50/40 p-4 sm:p-6 md:p-8 flex items-center justify-center">
      <Card className="max-w-xl w-full border-2 border-teal-200/80 shadow-2xl rounded-3xl bg-white overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-indigo-800 p-6 text-white text-center">
          <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center mx-auto mb-3 border border-white/20">
            <Stethoscope className="h-8 w-8 text-teal-200" />
          </div>
          <Badge className="bg-white/20 text-white text-[11px] font-bold border-0 mb-2">
            {en ? "Doctor OPD Confirmation Portal" : "डॉक्टर ओपीडी स्वीकृति पोर्टल"}
          </Badge>
          <h1 className="text-xl sm:text-2xl font-black">
            {en ? "Teleconsultation Request" : "टेलीकंसल्टेशन अनुरोध"}
          </h1>
          <p className="text-xs text-teal-100 mt-1">
            {en
              ? "Review patient appointment details, confirm schedule, or suggest alternative time."
              : "मरीज के अपॉइंटमेंट विवरण की समीक्षा करें, समय कन्फर्म करें या नया समय सुझाएं।"}
          </p>
        </div>

        <CardContent className="p-6 space-y-5">
          {/* Patient & Slot Details Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
                  {patientName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">{patientName}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <User className="h-3 w-3 text-slate-400" />
                    <span>{en ? "Patient Booking" : "मरीज बुकिंग"}</span>
                  </p>
                </div>
              </div>
              <Badge className={status === "accepted" ? "bg-emerald-600 text-white" : status === "declined" ? "bg-rose-600 text-white" : "bg-amber-500 text-white"}>
                {status === "accepted" ? (en ? "Confirmed" : "स्वीकृत") : status === "declined" ? (en ? "Declined" : "अस्वीकृत") : (en ? "Awaiting Doctor" : "डॉक्टर स्वीकृति प्रतीक्षित")}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">{en ? "Scheduled Slot:" : "निर्धारित समय:"}</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-teal-600" />
                  <span>{timeStr} on {dateStr}</span>
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">{en ? "Consultation Fee:" : "परामर्श शुल्क:"}</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{fee === 0 ? (en ? "₹0 (Free OPD / PM-JAY)" : "₹0 (मुफ्त सरकारी ओपीडी)") : `₹${fee} (UPI / OPD Counter)`}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Result Notification Banner */}
          {confirmedMessage && (
            <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-start gap-2.5 ${status === "declined" ? "bg-rose-50 text-rose-800 border-rose-200" : "bg-emerald-50 text-emerald-900 border-emerald-200"}`}>
              {status === "declined" ? <XCircle className="h-5 w-5 text-rose-600 shrink-0" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
              <span>{confirmedMessage}</span>
            </div>
          )}

          {/* Status === Pending Actions */}
          {status === "pending" && (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-slate-600 font-medium">
                {en
                  ? "Are you available for this teleconsultation slot?"
                  : "क्या आप इस वीडियो परामर्श समय के लिए उपलब्ध हैं?"}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  onClick={handleAccept}
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>{en ? "Accept Appointment" : "स्वीकार करें"}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setStatus("rescheduling")}
                  className="border-amber-400 text-amber-800 hover:bg-amber-50 font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="h-4 w-4 text-amber-600" />
                  <span>{en ? "Propose Another Time" : "नया समय सुझाएं"}</span>
                </Button>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleDecline}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline"
                >
                  {en ? "Unable to consult? Decline and refer patient" : "उपलब्ध नहीं हैं? अस्वीकार करें"}
                </button>
              </div>
            </div>
          )}

          {/* Status === Rescheduling Form */}
          {status === "rescheduling" && (
            <div className="space-y-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4 text-amber-600" />
                <span>{en ? "Propose Alternative Teleconsultation Time" : "वैकल्पिक परामर्श समय चुनें"}</span>
              </h4>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">
                  {en ? "Choose New Proposed Slot:" : "नया प्रस्तावित समय:"}
                </label>
                <select
                  value={rescheduleSlot}
                  onChange={(e) => setRescheduleSlot(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Today at 02:00 PM">Today at 02:00 PM (आज दोपहर 2:00 बजे)</option>
                  <option value="Today at 04:30 PM">Today at 04:30 PM (आज शाम 4:30 बजे)</option>
                  <option value="Tomorrow at 10:00 AM">Tomorrow at 10:00 AM (कल सुबह 10:00 बजे)</option>
                  <option value="Tomorrow at 11:30 AM">Tomorrow at 11:30 AM (कल सुबह 11:30 बजे)</option>
                  <option value="Day after Tomorrow at 03:00 PM">Day after Tomorrow at 03:00 PM (परसों दोपहर 3:00 बजे)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">
                  {en ? "Doctor Note for Patient (Optional):" : "मरीज के लिए संदेश (वैकल्पिक):"}
                </label>
                <Textarea
                  placeholder={en ? "e.g., In surgery this morning, available in afternoon OPD." : "उदा. सुबह सर्जरी में व्यस्त, दोपहर बाद उपलब्ध।"}
                  value={doctorNote}
                  onChange={(e) => setDoctorNote(e.target.value)}
                  className="text-xs h-16 rounded-xl bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handleRescheduleSubmit}
                  disabled={submitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 rounded-xl flex-1"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  <span>{en ? "Send New Time to Patient" : "मरीज को नया समय भेजें"}</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setStatus("pending")}
                  className="text-xs text-slate-600 h-9"
                >
                  {en ? "Cancel" : "रद्द करें"}
                </Button>
              </div>
            </div>
          )}

          {/* Status === Accepted: Direct Room Button */}
          {status === "accepted" && (
            <div className="space-y-3 pt-2">
              <Button
                onClick={() => router.push(doctorRoomUrl)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm h-11 rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <Video className="h-4 w-4" />
                <span>{en ? "Enter Teleconsultation Room as Doctor" : "डॉक्टर के रूप में वीडियो रूम में प्रवेश करें"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-[11px] text-center text-slate-500">
                {en
                  ? "Room is protected with end-to-end WebRTC encryption. No login or app required."
                  : "रूम एंड-टू-एंड वेबआरटीसी एन्क्रिप्शन से सुरक्षित है। बिना लॉगिन के सीधे जुड़ें।"}
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              {en ? "← Return to Healthcare Home" : "← मुख्य पृष्ठ पर लौटें"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TeleconsultConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      }
    >
      <TeleconsultConfirmContent />
    </Suspense>
  )
}
