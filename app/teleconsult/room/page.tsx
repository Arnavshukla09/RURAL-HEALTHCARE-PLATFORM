"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { JitsiMeeting } from "@/components/JitsiMeeting"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Video,
  ShieldCheck,
  User,
  Stethoscope,
  Share2,
  Copy,
  Check,
  PhoneCall,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react"

function TeleconsultRoomContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const roomId = searchParams.get("id") || ""
  const participantName = searchParams.get("name") || ""
  const role = searchParams.get("role") || "patient"
  const lang = searchParams.get("lang") || "en"
  const en = lang === "en"

  const [copied, setCopied] = useState(false)
  const isDoctor = role === "doctor"

  const displayName = participantName 
    ? (isDoctor && !participantName.toLowerCase().startsWith("dr.") ? `Dr. ${participantName}` : participantName)
    : isDoctor ? "Doctor" : "Patient"

  const currentUrl = typeof window !== "undefined" ? window.location.href : ""

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleShareWhatsApp = () => {
    const text = en
      ? `Teleconsultation Meeting Link for ${displayName}:\n${currentUrl}\n(No app or login needed — click to join)`
      : `${displayName} के लिए वीडियो परामर्श लिंक:\n${currentUrl}\n(किसी ऐप या लॉगिन की आवश्यकता नहीं — सीधे जुड़ें)`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
  }

  if (!roomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-red-200 bg-white shadow-xl rounded-3xl p-6 text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <Video className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {en ? "No Consultation Room Specified" : "कोई परामर्श रूम निर्दिष्ट नहीं है"}
          </h2>
          <p className="text-xs text-gray-600">
            {en
              ? "A valid room ID is required to join a teleconsultation. Please check your appointment link or book a new consultation."
              : "वीडियो परामर्श में जुड़ने के लिए एक मान्य रूम आईडी आवश्यक है। कृपया अपना अपॉइंटमेंट लिंक देखें या नया परामर्श बुक करें।"}
          </p>
          <Button
            onClick={() => router.push("/consultation")}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl"
          >
            {en ? "Go to Consultation Portal" : "परामर्श पोर्टल पर जाएं"}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-slate-900 to-black text-white p-3 sm:p-5 flex flex-col justify-between">
      {/* Top Header Bar */}
      <div className="max-w-6xl mx-auto w-full mb-3 flex flex-wrap items-center justify-between gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="h-8 px-2 text-gray-300 hover:text-white hover:bg-white/10 text-xs"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>{en ? "Exit" : "बाहर"}</span>
          </Button>

          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isDoctor ? "bg-purple-600 text-white" : "bg-emerald-600 text-white"}`}>
              {isDoctor ? <Stethoscope className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white leading-tight flex items-center gap-1.5">
                <span>{displayName}</span>
                <Badge className={isDoctor ? "bg-purple-500/30 text-purple-200 border-purple-400/40 text-[10px]" : "bg-emerald-500/30 text-emerald-200 border-emerald-400/40 text-[10px]"}>
                  {isDoctor ? (en ? "Clinician / Doctor" : "चिकित्सक / डॉक्टर") : (en ? "Patient" : "मरीज")}
                </Badge>
              </p>
              <p className="text-[10px] text-gray-300 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                <span>{en ? "Secure WebRTC Teleconsultation • Zero-Install" : "सुरक्षित वीडियो परामर्श • बिना किसी ऐप के"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Room Tools */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyLink}
            className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? (en ? "Copied!" : "कॉपी हो गया!") : (en ? "Copy Link" : "लिंक कॉपी")}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleShareWhatsApp}
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0 gap-1"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{en ? "WhatsApp Link" : "व्हाट्सएप लिंक"}</span>
          </Button>
        </div>
      </div>

      {/* Main Jitsi Meeting Video Window */}
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black min-h-[550px] sm:min-h-[650px]">
        <JitsiMeeting
          roomName={roomId}
          displayName={displayName}
          language={lang}
          onLeave={() => router.push("/")}
        />
      </div>

      {/* Bottom Footer Info */}
      <div className="max-w-6xl mx-auto w-full mt-3 text-center text-[11px] text-gray-400">
        <p>
          {en
            ? "Rural Healthcare Platform • Free Public Telemedicine • Compatible with all Android, iOS & PC browsers"
            : "ग्रामीण स्वास्थ्य मंच • निःशुल्क टेलीमेडिसिन • सभी मोबाइल और कंप्यूटर ब्राउज़रों पर समर्थित"}
        </p>
      </div>
    </div>
  )
}

export default function TeleconsultRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-teal-400" />
            <p className="text-sm">Connecting to Teleconsultation Clinic...</p>
          </div>
        </div>
      }
    >
      <TeleconsultRoomContent />
    </Suspense>
  )
}
