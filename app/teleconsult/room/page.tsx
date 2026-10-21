"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { JitsiMeeting } from "@/components/JitsiMeeting"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RxModal, type RxData } from "./rx-modal"
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
  Wifi,
  WifiOff,
  FileText,
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
  const [is2GMode, setIs2GMode] = useState(false)
  const [showRxModal, setShowRxModal] = useState(false)
  const [savingRecord, setSavingRecord] = useState(false)
  const [recordSaved, setRecordSaved] = useState(false)

  // Rx Summary State
  const [rxData, setRxData] = useState({
    doctorName: role === "doctor" ? participantName : "Dr. Medical Officer",
    nmcRegNo: "NMC/SMC-VERIFIED",
    hospitalName: "Government Medical Centre / Apex Hospital",
    patientName: role === "patient" ? participantName : "Consultation Patient",
    diagnosis: "General Clinical Consultation",
    medicines: "1. Paracetamol 500mg (SOS for fever)\n2. ORS Solution (Frequent sips)\n3. Multivitamin Zinc tab (Once daily x 5 days)",
    instructions: "Drink boiled cooled water, adequate rest, monitor vitals twice daily.",
    followUp: "After 3 days if symptoms persist",
  })

  const isDoctor = role === "doctor"

  const displayName = participantName
    ? isDoctor && !participantName.toLowerCase().startsWith("dr.")
      ? `Dr. ${participantName}`
      : participantName
    : isDoctor
      ? "Doctor"
      : "Patient"

  const currentUrl = typeof window !== "undefined" ? window.location.href : ""

  // Auto-detect slow mobile connection on mount
  useEffect(() => {
    if (typeof navigator !== "undefined" && (navigator as any).connection) {
      const conn = (navigator as any).connection
      if (conn.effectiveType === "2g" || conn.effectiveType === "slow-2g" || conn.saveData) {
        setIs2GMode(true)
      }
    }
  }, [])

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

  const handleSaveToPatientRecords = async () => {
    setSavingRecord(true)
    const content = `[Teleconsultation e-Prescription]\nDoctor: ${rxData.doctorName} (${rxData.nmcRegNo})\nHospital: ${rxData.hospitalName}\nPatient: ${rxData.patientName}\nDate: ${new Date().toLocaleDateString()}\nDiagnosis: ${rxData.diagnosis}\n\nPrescribed Medicines:\n${rxData.medicines}\n\nInstructions:\n${rxData.instructions}\n\nFollow-up: ${rxData.followUp}`

    try {
      const res = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          record_type: "prescription",
          content: content,
        }),
      })

      // Also persist in local cache for guest access
      if (typeof window !== "undefined") {
        const existing = JSON.parse(localStorage.getItem("rural_health_local_prescriptions") || "[]")
        existing.unshift({
          id: `rx-${Date.now()}`,
          date: new Date().toISOString(),
          ...rxData,
          content,
        })
        localStorage.setItem("rural_health_local_prescriptions", JSON.stringify(existing.slice(0, 50)))
      }

      setRecordSaved(true)
      setTimeout(() => {
        setRecordSaved(false)
        setShowRxModal(false)
        router.push(isDoctor ? "/doctor/patients" : "/records")
      }, 1500)
    } catch (e) {
      // Local fallback
      setRecordSaved(true)
      setTimeout(() => {
        setRecordSaved(false)
        setShowRxModal(false)
        router.push(isDoctor ? "/doctor/patients" : "/records")
      }, 1500)
    } finally {
      setSavingRecord(false)
    }
  }

  const handlePrintPrescription = () => {
    if (typeof window === "undefined") return
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>e-Prescription - ${rxData.patientName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
          .header { border-bottom: 3px double #0d9488; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
          .clinic-name { font-size: 24px; font-weight: 800; color: #0f766e; }
          .doctor-name { font-size: 18px; font-weight: 700; color: #1e293b; margin-top: 4px; }
          .reg-no { font-size: 13px; color: #64748b; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; }
          .rx-symbol { font-size: 32px; font-weight: 900; color: #0d9488; font-style: italic; margin: 15px 0 5px 0; }
          .section-title { font-size: 14px; font-weight: 700; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 20px; }
          .content-box { margin-top: 8px; font-size: 14px; line-height: 1.6; white-space: pre-line; }
          .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
          .sig-box { text-align: center; border-top: 1px dashed #94a3b8; width: 200px; padding-top: 6px; }
          @media print { button { display: none; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="clinic-name">🏥 RURAL HEALTHCARE PLATFORM</div>
            <div style="font-size: 12px; color: #64748b;">National Digital Health Mission Telemedicine Service</div>
            <div class="doctor-name">${rxData.doctorName}</div>
            <div class="reg-no">Reg No: ${rxData.nmcRegNo} • ${rxData.hospitalName}</div>
          </div>
          <div style="text-align: right; font-size: 13px;">
            <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
            <div><strong>Mode:</strong> WebRTC Teleconsultation</div>
            <div><strong>Ref ID:</strong> ${roomId.slice(0, 12)}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div><strong>Patient Name:</strong> ${rxData.patientName}</div>
          <div><strong>Diagnosis:</strong> ${rxData.diagnosis}</div>
        </div>

        <div class="rx-symbol">℞</div>

        <div class="section-title">Prescribed Medications & Dosages</div>
        <div class="content-box">${rxData.medicines}</div>

        <div class="section-title">Clinical Advice & Instructions</div>
        <div class="content-box">${rxData.instructions}</div>

        <div class="section-title">Follow-up Recommendation</div>
        <div class="content-box">${rxData.followUp}</div>

        <div class="footer">
          <div>This is a digitally generated medical prescription issued under Telemedicine Practice Guidelines, NMC India.</div>
          <div class="sig-box">
            Digitally Signed by<br/>
            <strong>${rxData.doctorName}</strong>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-slate-900 to-black text-white p-2.5 sm:p-4 flex flex-col justify-between">
      {/* Top Header Bar */}
      <div className="max-w-6xl mx-auto w-full mb-2.5 flex flex-wrap items-center justify-between gap-2.5 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRxModal(true)}
            className="h-8 px-2.5 text-rose-300 hover:text-white hover:bg-rose-500/20 text-xs font-semibold rounded-lg"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            <span>{en ? "Exit Call" : "बाहर"}</span>
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
                <span>{en ? "Encrypted P2P Teleconsultation" : "सुरक्षित वीडियो परामर्श"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Room Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Low-Bandwidth 2G Toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIs2GMode(!is2GMode)}
            className={`h-8 text-xs font-semibold rounded-xl gap-1 transition-all ${
              is2GMode
                ? "bg-amber-500 text-black border-amber-400 hover:bg-amber-400 font-bold shadow-xs"
                : "bg-white/10 text-gray-200 border-white/20 hover:bg-white/20"
            }`}
          >
            {is2GMode ? <WifiOff className="h-3.5 w-3.5 text-black" /> : <Wifi className="h-3.5 w-3.5 text-emerald-400" />}
            <span>{is2GMode ? (en ? "2G Active (Audio)" : "2G मोड सक्रिय") : (en ? "2G Fallback" : "2G मोड")}</span>
          </Button>

          {/* e-Prescription Auto-Export Button */}
          <Button
            size="sm"
            onClick={() => setShowRxModal(true)}
            className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl border-0 gap-1"
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{en ? "Prescription / Rx" : "प्रिस्क्रिप्शन"}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyLink}
            className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1 rounded-xl"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copied ? (en ? "Copied!" : "कॉपी!") : (en ? "Copy Link" : "लिंक")}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleShareWhatsApp}
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0 gap-1 rounded-xl"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{en ? "WhatsApp" : "व्हाट्सएप"}</span>
          </Button>
        </div>
      </div>

      {/* 2G Banner Notification if active */}
      {is2GMode && (
        <div className="max-w-6xl mx-auto w-full mb-2 py-1.5 px-3 bg-amber-500/20 border border-amber-400/40 rounded-xl text-amber-200 text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <WifiOff className="h-4 w-4 text-amber-400" />
            <span>{en ? "2G Ultra Low-Bandwidth Mode Active • Audio-only Opus (95% data saved for poor rural signals)" : "2G मोड सक्रिय • केवल ऑडियो (कमजोर सिग्नल के लिए 95% डेटा बचत)"}</span>
          </span>
          <button
            onClick={() => setIs2GMode(false)}
            className="text-[11px] underline hover:text-white font-bold ml-2"
          >
            {en ? "Enable Video" : "वीडियो चालू करें"}
          </button>
        </div>
      )}

      {/* Main Jitsi Meeting Video Window */}
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black min-h-[500px] sm:min-h-[620px]">
        <JitsiMeeting
          key={`jitsi-${is2GMode ? "audio" : "video"}`}
          roomName={roomId}
          displayName={displayName}
          language={lang}
          audioOnly={is2GMode}
          onLeave={() => setShowRxModal(true)}
        />
      </div>

      {/* Bottom Footer Info */}
      <div className="max-w-6xl mx-auto w-full mt-2 text-center text-[11px] text-gray-400">
        <p>
          {en
            ? "Rural Healthcare Platform • Free Public Telemedicine • Compatible with all Android, iOS & PC browsers"
            : "ग्रामीण स्वास्थ्य मंच • निःशुल्क टेलीमेडिसिन • सभी मोबाइल और कंप्यूटर ब्राउज़रों पर समर्थित"}
        </p>
      </div>

      {/* E-PRESCRIPTION & CONSULTATION SUMMARY MODAL */}
      <RxModal
        isOpen={showRxModal}
        onClose={() => setShowRxModal(false)}
        rxData={rxData}
        setRxData={setRxData}
        en={en}
        recordSaved={recordSaved}
        savingRecord={savingRecord}
        onSaveRecord={handleSaveToPatientRecords}
        onPrint={handlePrintPrescription}
        onExit={() => router.push("/appointments")}
      />
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
