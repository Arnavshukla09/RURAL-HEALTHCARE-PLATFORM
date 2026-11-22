"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { JitsiMeeting } from "@/components/JitsiMeeting"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { RxModal, type RxData } from "./rx-modal"
import { EMPTY_RX, loadAuthorizedRoom, renderConsultationPrint, saveConsultationRecord, type AuthorizedRoom } from "./room-client"
import { consultationJoinPath } from "@/components/consultation-portal/booking-client"
import { getAssistantLanguage } from "@/lib/assistant/languages"
import { ArrowLeft, Check, Copy, FileText, Loader2, Share2, ShieldCheck, Stethoscope, User, Video, Wifi, WifiOff } from "lucide-react"

function TeleconsultRoomContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const appointmentId = searchParams.get("appointmentId") || ""
  const lang = getAssistantLanguage(searchParams.get("lang")).code
  const en = lang === "en"
  const [room, setRoom] = useState<AuthorizedRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessError, setAccessError] = useState("")
  const [recordError, setRecordError] = useState("")
  const [copied, setCopied] = useState(false)
  const [is2GMode, setIs2GMode] = useState(false)
  const [showRxModal, setShowRxModal] = useState(false)
  const [savingRecord, setSavingRecord] = useState(false)
  const [recordSaved, setRecordSaved] = useState(false)
  const [rxData, setRxData] = useState<RxData>({ ...EMPTY_RX })

  useEffect(() => {
    const controller = new AbortController()
    setRoom(null); setAccessError(""); setLoading(true); setRxData({ ...EMPTY_RX }); setRecordSaved(false)
    loadAuthorizedRoom(appointmentId, controller.signal).then((authorized) => {
      if (controller.signal.aborted) return
      setRoom(authorized)
      setRxData({ ...EMPTY_RX, doctorName: authorized.doctorName, hospitalName: authorized.facilityName, patientName: authorized.patientName })
    }).catch((error) => {
      if (!controller.signal.aborted) setAccessError(error instanceof Error ? error.message : "Unable to authorize this appointment")
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [appointmentId])

  useEffect(() => {
    const connection = (navigator as any).connection
    if (connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g" || connection?.saveData) setIs2GMode(true)
  }, [])

  const activeRoom = room?.appointmentId === appointmentId ? room : null
  const isDoctor = activeRoom?.participantRole === "doctor"
  const currentUrl = typeof window === "undefined" ? "" : `${window.location.origin}${consultationJoinPath(appointmentId, lang)}`
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(currentUrl); setCopied(true); setTimeout(() => setCopied(false), 2500) } catch { setAccessError(en ? "Unable to copy the appointment link" : "अपॉइंटमेंट लिंक कॉपी नहीं हो सका") }
  }
  const saveRecord = async () => {
    if (!activeRoom) return
    setSavingRecord(true); setRecordError(""); setRecordSaved(false)
    try { await saveConsultationRecord(activeRoom, rxData); setRecordSaved(true) }
    catch (error) { setRecordError(error instanceof Error ? error.message : "The record was not saved") }
    finally { setSavingRecord(false) }
  }
  const printRecord = () => {
    if (!activeRoom) return
    const popup = window.open("", "_blank")
    if (!popup) { setRecordError(en ? "Allow the print window to open" : "प्रिंट विंडो खोलने की अनुमति दें"); return }
    popup.opener = null
    renderConsultationPrint(popup.document, activeRoom, rxData)
    popup.focus(); popup.print()
  }

  if (loading || !activeRoom) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="max-w-md w-full text-center"><CardContent className="p-6 space-y-4">
        {loading ? <Loader2 className="h-8 w-8 animate-spin mx-auto text-teal-600" /> : <Video className="h-8 w-8 mx-auto text-red-600" />}
        <h1 className="text-lg font-bold">{loading ? (en ? "Checking appointment access…" : "अपॉइंटमेंट प्रवेश जांच जारी है…") : (en ? "Unable to join consultation" : "परामर्श में प्रवेश नहीं हो सका")}</h1>
        {!loading && <p role="alert" className="text-sm text-red-700">{accessError}</p>}
        <Button onClick={() => router.push("/appointments")}>{en ? "My Appointments" : "मेरी अपॉइंटमेंट"}</Button>
      </CardContent></Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white p-3 sm:p-4 flex flex-col gap-3">
      <header className="max-w-6xl mx-auto w-full flex flex-wrap justify-between gap-3 bg-white/10 p-3 rounded-2xl">
        <div className="flex gap-3 items-center">
          <Button variant="ghost" size="sm" onClick={() => setShowRxModal(true)}><ArrowLeft className="h-4 w-4 mr-1" />{en ? "Exit" : "बाहर"}</Button>
          {isDoctor ? <Stethoscope className="h-5 w-5 text-teal-300" /> : <User className="h-5 w-5 text-teal-300" />}
          <div><p className="font-bold text-sm">{activeRoom.participantName}</p><p className="text-xs text-teal-200 flex gap-1 items-center"><ShieldCheck className="h-3 w-3" />{en ? "Appointment access verified" : "अपॉइंटमेंट प्रवेश सत्यापित"}</p></div>
          <Badge>{isDoctor ? (en ? "Clinician" : "चिकित्सक") : (en ? "Patient" : "मरीज")}</Badge>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" className="text-slate-900" onClick={() => setIs2GMode(!is2GMode)}>{is2GMode ? <WifiOff className="h-4 w-4 mr-1" /> : <Wifi className="h-4 w-4 mr-1" />}{is2GMode ? (en ? "Audio mode" : "आवाज मोड") : (en ? "Use audio" : "आवाज प्रयोग करें")}</Button>
          <Button size="sm" onClick={() => setShowRxModal(true)}><FileText className="h-4 w-4 mr-1" />{isDoctor ? (en ? "Consultation record" : "परामर्श रिकॉर्ड") : (en ? "My notes" : "मेरे नोट")}</Button>
          <Button size="sm" onClick={copyLink}>{copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}{en ? "Copy link" : "लिंक कॉपी"}</Button>
          <Button size="sm" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Consultation appointment: ${currentUrl}\nThe assigned participants must sign in to join.`)}`, "_blank", "noopener,noreferrer")}><Share2 className="h-4 w-4 mr-1" />WhatsApp</Button>
        </div>
      </header>
      {accessError && <p role="alert" className="text-amber-200 max-w-6xl mx-auto">{accessError}</p>}
      {is2GMode && <p className="max-w-6xl mx-auto w-full text-sm text-amber-200">{en ? "Audio mode uses less data. Network connectivity is still required." : "आवाज मोड कम डेटा उपयोग करता है। नेटवर्क कनेक्शन आवश्यक है।"}</p>}
      <div className="max-w-6xl mx-auto w-full flex-1 rounded-2xl overflow-hidden min-h-[500px] bg-black">
        <JitsiMeeting key={`${activeRoom.appointmentId}-${is2GMode}`} roomName={activeRoom.roomId} displayName={activeRoom.participantName} domain={activeRoom.domain} jwt={activeRoom.token} language={lang} audioOnly={is2GMode} onLeave={() => setShowRxModal(true)} />
      </div>
      <RxModal isOpen={showRxModal} onClose={() => setShowRxModal(false)} rxData={rxData} setRxData={setRxData} en={en} clinician={isDoctor} recordError={recordError} recordSaved={recordSaved} savingRecord={savingRecord} onSaveRecord={saveRecord} onPrint={printRecord} onExit={() => router.push(isDoctor ? "/doctor/dashboard" : "/appointments")} />
    </div>
  )
}

export default function TeleconsultRoomPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}><TeleconsultRoomContent /></Suspense>
}
