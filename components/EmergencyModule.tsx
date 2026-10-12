"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  Phone,
  MapPin,
  Share2,
  AlertTriangle,
  Truck,
  MessageSquare,
  MessageCircle,
  BookOpen,
  HeartPulse,
  Activity,
  UserCheck,
  ShieldAlert,
  Smartphone,
  Flashlight,
  X,
  Volume2,
  VolumeX,
  Contrast,
  Mic,
  MicOff,
  FileText,
  BadgeAlert,
  Check,
  Send,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  getEmergencyProfile,
  saveEmergencyProfile,
  triggerSosVibration,
  dispatchSmsSos,
  DEFAULT_PROFILE,
  EmergencyProfile,
} from "@/lib/emergency/vault"
import {
  toggleHardwareTorch,
  startAudioSiren,
  stopAudioSiren,
  requestScreenWakeLock,
  releaseScreenWakeLock,
} from "@/lib/emergency/hardware"
import {
  startIncidentRecording,
  stopIncidentRecording,
  vocalizeEmergencyMessage,
} from "@/lib/emergency/audio-blackbox"

interface EmergencyModuleProps {
  language: string
}

export function EmergencyModule({ language }: EmergencyModuleProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [profile, setProfile] = useState<EmergencyProfile>(DEFAULT_PROFILE)
  const [editingProfile, setEditingProfile] = useState<EmergencyProfile>(DEFAULT_PROFILE)
  const [isVaultOpen, setIsVaultOpen] = useState(false)
  const [isDistressModalOpen, setIsDistressModalOpen] = useState(false)
  const [isMedicalPassOpen, setIsMedicalPassOpen] = useState(false)
  const [shakeActive, setShakeActive] = useState(true)
  const [strobeActive, setStrobeActive] = useState(false)
  const [strobeLightOn, setStrobeLightOn] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [sirenActive, setSirenActive] = useState(false)
  const [torchActive, setTorchActive] = useState(false)
  const [isRecordingIncident, setIsRecordingIncident] = useState(false)
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | undefined>()

  useEffect(() => {
    const loaded = getEmergencyProfile()
    setProfile(loaded)
    setEditingProfile(loaded)

    // Pre-cache GPS if permission granted
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLastCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 4000, enableHighAccuracy: true }
      )
    }
  }, [])

  // Strobe beacon timer, wake lock, hardware torch & audio siren
  useEffect(() => {
    if (!strobeActive) {
      stopAudioSiren()
      setSirenActive(false)
      toggleHardwareTorch(false)
      setTorchActive(false)
      releaseScreenWakeLock()
      if (isRecordingIncident) {
        stopIncidentRecording(lastCoords)
        setIsRecordingIncident(false)
      }
      return
    }

    // Keep screen awake at full brightness
    requestScreenWakeLock()

    const interval = setInterval(() => {
      setStrobeLightOn((prev) => !prev)
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(120)
      }
    }, 240)

    return () => {
      clearInterval(interval)
      stopAudioSiren()
      toggleHardwareTorch(false)
      releaseScreenWakeLock()
    }
  }, [strobeActive])

  // Siren toggle handler
  const handleToggleSiren = () => {
    if (sirenActive) {
      stopAudioSiren()
      setSirenActive(false)
    } else {
      const started = startAudioSiren()
      if (started) setSirenActive(true)
      else toast({ title: language === "en" ? "Audio siren unavailable" : "ऑडियो सायरन अनुपलब्ध", variant: "destructive" })
    }
  }

  // Hardware LED Torch toggle handler
  const handleToggleTorch = async () => {
    if (torchActive) {
      await toggleHardwareTorch(false)
      setTorchActive(false)
    } else {
      const enabled = await toggleHardwareTorch(true)
      if (enabled) {
        setTorchActive(true)
        toast({ title: language === "en" ? "Camera LED Flashlight Active" : "कैमरा एलईडी फ्लैशलाइट सक्रिय" })
      } else {
        toast({ 
          title: language === "en" ? "Camera flash permission needed or unsupported" : "कैमरा फ्लैश अनुमति आवश्यक या असमर्थित", 
          variant: "destructive" 
        })
      }
    }
  }

  // Incident audio recording toggle
  const handleToggleIncidentRecording = async () => {
    if (isRecordingIncident) {
      const saved = await stopIncidentRecording(lastCoords)
      setIsRecordingIncident(false)
      if (saved) {
        toast({
          title: language === "en"
            ? `Offline audio incident saved (${saved.durationSeconds}s)`
            : `ऑफ़लाइन ऑडियो रिकॉर्डिंग फोन में सुरक्षित (${saved.durationSeconds}s)`,
        })
      }
    } else {
      const started = await startIncidentRecording()
      if (started) {
        setIsRecordingIncident(true)
        toast({
          title: language === "en" ? "Recording emergency audio locally..." : "घटना की ऑडियो रिकॉर्डिंग शुरू हो गई...",
        })
      } else {
        toast({
          title: language === "en" ? "Microphone permission required" : "माइक्रोफ़ोन अनुमति आवश्यक है",
          variant: "destructive",
        })
      }
    }
  }

  // Critical SOS Mode: Automatically enables all alarms at once and dials 108
  const launchCriticalSosWithAlarms = async () => {
    setStrobeActive(true)
    startAudioSiren()
    setSirenActive(true)
    const torchOn = await toggleHardwareTorch(true)
    if (torchOn) setTorchActive(true)
    requestScreenWakeLock()

    // Auto-record incident audio
    startIncidentRecording().then((ok) => {
      if (ok) setIsRecordingIncident(true)
    })

    // Dial 108
    window.location.href = "tel:108"
  }

  const content = {
    en: {
      title: "Emergency Services",
      subtitle: "Get immediate medical assistance",
      call108: "Call 108 — Ambulance",
      call108Sub: "Auto-launches siren, flashlight beacon & calls 108 immediately",
      alarmOnly: "Launch Siren & Beacon Only",
      sendDistressTitle: "Send Distress Alert (WhatsApp & SMS)",
      sendDistressSub: "Transmits live GPS & chronic health info in 1 tap",
      medicalPassTitle: "Paramedic Medical Pass (On Screen)",
      medicalPassSub: "Flashes critical health profile & contacts for first responders",
      cannotSpeakTitle: "Cannot Speak? Tap to vocalize aloud:",
      cannotSpeak1: "Call 108 ambulance now!",
      cannotSpeak2: "Severe chest pain emergency!",
      cannotSpeak3: "I have diabetes, I feel faint!",
      findHospital: "Nearest 24/7 Hospital",
      firstAid: "Visual First-Aid Guide",
      recordAudio: "Record Incident Audio",
      stopRecordAudio: "Stop & Save Recording",
      helplineTitle: "Government Helplines",
      ambulance: "Ambulance",
      police: "Police Helpline- 100",
      fire: "Fire Emergency",
      cmHelpline: "CM Helpline",
      childHelpline: "Child Helpline",
      womenHelpline: "Women Helpline",
      ayushman: "Ayushman Bharat Helpline",
      nationalHealth: "National Health Helpline",
      vaultTitle: "Emergency Health Vault (Offline)",
      editVault: "Edit Health Profile",
      fullName: "Full Name",
      age: "Age",
      bloodGroup: "Blood Group",
      chronicConditions: "Chronic Conditions",
      medications: "Current Medications",
      allergies: "Known Drug / Food Allergies",
      primaryContact: "Primary Emergency Contact",
      secondaryContact: "Secondary Emergency Contact",
      shakeDetected: "Phone shake detected! Initiating SOS...",
      shakeHint: "Shake phone 3 times to trigger instant emergency broadcast",
      noneRecorded: "None recorded",
      savedSuccess: "Emergency profile saved locally on this device!",
      beaconActive: "CRITICAL ALARM ACTIVE",
      stopBeacon: "Stop Alarm",
      highContrastToggle: "High Contrast (Sunlight)",
      sirenOn: "Sound Siren",
      sirenOff: "Mute Siren",
      torchOn: "Camera Flash",
      torchOff: "Flash Off",
      distressModalTitle: "Transmit Emergency Distress Alert",
      distressViaWa: "Send via WhatsApp",
      distressViaSms: "Send via SMS (Offline 112)",
      distressViaShare: "Share via Other Apps",
      medicalPassHeader: "PARAMEDIC EMERGENCY MEDICAL PASS",
      medicalPassClose: "Close Pass",
    },
    hi: {
      title: "आपातकालीन सेवाएं",
      subtitle: "तत्काल चिकित्सा सहायता प्राप्त करें",
      call108: "108 पर कॉल करें — एम्बुलेंस",
      call108Sub: "सायरन, फ्लैशलाइट बीकन चालू कर तुरंत 108 डायल करता है",
      alarmOnly: "केवल सायरन और बीकन शुरू करें",
      sendDistressTitle: "संकट संदेश भेजें (व्हाट्सएप और एसएमएस)",
      sendDistressSub: "लाइव जीपीएस और पुरानी बीमारी विवरण 1-टैप में भेजता है",
      medicalPassTitle: "पैरामेडिक स्वास्थ्य पास (स्क्रीन पर दिखाएं)",
      medicalPassSub: "स्वास्थ्य कार्यकर्ताओं के लिए रक्त समूह व गंभीर बीमारियों का दृश्य पास",
      cannotSpeakTitle: "बोलने में असमर्थ? आवाज़ निकालने के लिए टैप करें:",
      cannotSpeak1: "तुरंत 108 एम्बुलेंस बुलाएं!",
      cannotSpeak2: "सीने में तेज दर्द हो रहा है!",
      cannotSpeak3: "मुझे शुगर है, चक्कर आ रहे हैं!",
      findHospital: "निकटतम 24/7 अस्पताल",
      firstAid: "प्राथमिक चिकित्सा मार्गदर्शिका",
      recordAudio: "घटना की ऑडियो रिकॉर्ड करें",
      stopRecordAudio: "रिकॉर्डिंग रोकें व सुरक्षित करें",
      helplineTitle: "सरकारी हेल्पलाइन",
      ambulance: "एम्बुलेंस",
      police: "पुलिस हेल्पलाइन- 100",
      fire: "अग्निशमन आपातकाल",
      cmHelpline: "सीएम हेल्पलाइन",
      childHelpline: "चाइल्ड हेल्पलाइन",
      womenHelpline: "महिला हेल्पलाइन",
      ayushman: "आयुष्मान भारत हेल्पलाइन",
      nationalHealth: "राष्ट्रीय स्वास्थ्य हेल्पलाइन",
      vaultTitle: "व्यक्तिगत आपातकालीन वॉल्ट (ऑफ़लाइन)",
      editVault: "स्वास्थ्य प्रोफाइल संपादित करें",
      fullName: "पूरा नाम",
      age: "आयु",
      bloodGroup: "रक्त समूह (Blood Group)",
      chronicConditions: "पुरानी बीमारियां",
      medications: "वर्तमान दवाइयां",
      allergies: "गंभीर एलर्जी (दवा/भोजन)",
      primaryContact: "प्राथमिक आपातकालीन संपर्क",
      secondaryContact: "द्वितीयक आपातकालीन संपर्क",
      shakeDetected: "फोन झटका पहचाना गया! एसओएस शुरू हो रहा है...",
      shakeHint: "तत्काल आपातकालीन अलर्ट के लिए फोन को 3 बार हिलाएं",
      noneRecorded: "कोई दर्ज नहीं",
      savedSuccess: "आपातकालीन प्रोफाइल इस डिवाइस पर सुरक्षित कर दी गई!",
      beaconActive: "गंभीर आपातकालीन अलार्म सक्रिय",
      stopBeacon: "अलार्म बंद करें",
      highContrastToggle: "उच्च कंट्रास्ट (तेज़ धूप)",
      sirenOn: "सायरन बजाएं",
      sirenOff: "सायरन बंद करें",
      torchOn: "कैमरा फ्लैश चालू",
      torchOff: "फ्लैश बंद करें",
      distressModalTitle: "संकटकालीन एसओएस अलर्ट भेजें",
      distressViaWa: "व्हाट्सएप द्वारा भेजें",
      distressViaSms: "एसएमएस द्वारा भेजें (ऑफ़लाइन 112)",
      distressViaShare: "अन्य ऐप्स पर साझा करें",
      medicalPassHeader: "पैरामेडिक आपातकालीन स्वास्थ्य पास",
      medicalPassClose: "पास बंद करें",
    },
  }

  const t = content[language as keyof typeof content] || content.en

  // Physical Shake Gesture Detection
  useEffect(() => {
    if (!shakeActive || typeof window === "undefined") return

    let lastTime = 0
    let shakeCount = 0
    let lastX = 0
    let lastY = 0
    let lastZ = 0

    const handleMotion = (event: DeviceMotionEvent) => {
      const current = event.accelerationIncludingGravity
      if (!current || current.x === null || current.y === null || current.z === null) return

      const now = performance.now()
      if (now - lastTime > 150) {
        const diffTime = now - lastTime
        lastTime = now

        const delta = Math.abs(current.x + current.y + current.z - lastX - lastY - lastZ)
        const speed = (delta / diffTime) * 10000

        if (speed > 850) {
          shakeCount++
          if (shakeCount >= 3) {
            shakeCount = 0
            triggerSosBroadcast("shake")
          }
        } else if (now - lastTime > 2500) {
          shakeCount = 0
        }

        lastX = current.x
        lastY = current.y
        lastZ = current.z
      }
    }

    window.addEventListener("devicemotion", handleMotion)
    return () => window.removeEventListener("devicemotion", handleMotion)
  }, [shakeActive, profile])

  const triggerSosBroadcast = (source: "button" | "shake") => {
    triggerSosVibration()

    if (source === "shake") {
      toast({
        title: t.shakeDetected,
        variant: "destructive",
      })
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setLastCoords(coords)
          const smsUrl = dispatchSmsSos(profile, coords)
          window.location.href = smsUrl
        },
        () => {
          const smsUrl = dispatchSmsSos(profile)
          window.location.href = smsUrl
        },
        { timeout: 5000, enableHighAccuracy: true }
      )
    } else {
      const smsUrl = dispatchSmsSos(profile)
      window.location.href = smsUrl
    }
  }

  const buildDistressMessage = (mapUrl?: string) => {
    let msg = "🚨 *MEDICAL EMERGENCY SOS ALERT* 🚨\n"
    if (profile.fullName) msg += `*Patient:* ${profile.fullName}${profile.age ? ` (${profile.age} yrs)` : ""}\n`
    if (profile.bloodGroup) msg += `*Blood Group:* ${profile.bloodGroup}\n`
    if (profile.chronicConditions) msg += `*Chronic Conditions:* ${profile.chronicConditions}\n`
    if (profile.currentMedications) msg += `*Medications:* ${profile.currentMedications}\n`
    if (profile.severeAllergies) msg += `*Allergies:* ${profile.severeAllergies}\n`
    if (mapUrl) msg += `*Live Location:* ${mapUrl}\n`
    else if (lastCoords) msg += `*Live Location:* https://maps.google.com/?q=${lastCoords.lat},${lastCoords.lng}\n`
    msg += "\nImmediate medical assistance or ambulance (108) required!"
    return msg
  }

  const sendDistressWhatsApp = () => {
    const contactParam = (profile.primaryEmergencyContact || "").replace(/[^0-9]/g, "")
    const targetPhone = contactParam ? (contactParam.length === 10 ? `91${contactParam}` : contactParam) : ""
    const waBase = targetPhone ? `https://wa.me/${targetPhone}` : "https://wa.me/"
    window.open(`${waBase}?text=${encodeURIComponent(buildDistressMessage())}`)
    setIsDistressModalOpen(false)
  }

  const sendDistressSms = () => {
    triggerSosBroadcast("button")
    setIsDistressModalOpen(false)
  }

  const shareDistressNative = () => {
    const text = buildDistressMessage()
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: "MEDICAL EMERGENCY SOS",
        text,
      }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(text)
      toast({ title: language === "en" ? "Distress message copied to clipboard" : "संदेश क्लिपबोर्ड में कॉपी किया गया" })
    }
    setIsDistressModalOpen(false)
  }

  const handleSaveProfile = () => {
    const updated = saveEmergencyProfile(editingProfile)
    setProfile(updated)
    setIsVaultOpen(false)
    toast({ title: t.savedSuccess })
  }

  const emergencyNumbers = [
    { service: t.cmHelpline, number: "181", icon: Phone, color: "gray" },
    { service: t.childHelpline, number: "1098", icon: Phone, color: "gray" },
    { service: t.police, number: "100", icon: AlertTriangle, color: "blue" },
    { service: t.fire, number: "101", icon: AlertTriangle, color: "orange" },
    { service: t.ambulance, number: "108", icon: Truck, color: "red" },
    { service: t.womenHelpline, number: "1090", icon: Phone, color: "gray" },
    { service: t.ayushman, number: "18002332085", icon: Phone, color: "teal" },
    { service: t.nationalHealth, number: "18001801104", icon: Phone, color: "teal" },
  ]

  return (
    <div className={`min-h-screen transition-colors duration-200 p-3 sm:p-6 ${
      highContrast 
        ? "bg-black text-yellow-300 contrast-125" 
        : "bg-red-50 text-gray-900"
    }`}>
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5 overflow-hidden">
        
        {/* Top Header Row with Sunlight High-Contrast Switch */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${
              highContrast ? "text-yellow-400" : "text-red-700"
            }`}>
              {t.title}
            </h1>
            <p className={`text-xs sm:text-sm mt-0.5 ${
              highContrast ? "text-yellow-200" : "text-gray-600"
            }`}>
              {t.subtitle}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setHighContrast(!highContrast)}
            className={`border-2 font-bold px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0 ${
              highContrast
                ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-300"
                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
            }`}
          >
            <Contrast className="h-4 w-4" />
            <span className="hidden sm:inline">{t.highContrastToggle}</span>
            <span className="sm:hidden">Sunlight</span>
          </Button>
        </div>

        {/* Shake Detection Banner */}
        <div className={`flex items-center justify-between p-3 border rounded-xl text-xs sm:text-sm shadow-sm gap-2 ${
          highContrast
            ? "bg-yellow-950/60 border-yellow-500 text-yellow-200"
            : "bg-red-100/90 border-red-300 text-red-900"
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 animate-pulse flex-shrink-0" />
            <span className="font-medium truncate">{t.shakeHint}</span>
          </div>
          <span className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
            highContrast ? "bg-yellow-400 text-black" : "bg-red-200 text-red-800"
          }`}>
            {shakeActive ? "Active" : "Off"}
          </span>
        </div>

        {/* ============================================================== */}
        {/* SEVERITY LEVEL 1: CRITICAL LIFE THREAT (108 CALL & AUTO-ALARM) */}
        {/* ============================================================== */}
        <Card className={`border-2 shadow-md overflow-hidden ${
          highContrast ? "bg-black border-yellow-400 text-yellow-300" : "border-red-400 bg-white"
        }`}>
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-600 text-white">
                Level 1: Critical Emergency
              </span>
              <span className="text-xs text-red-600 font-semibold">
                Auto-Enables Siren & Torch
              </span>
            </div>

            <Button
              onClick={launchCriticalSosWithAlarms}
              className="w-full min-h-[4.5rem] py-3 px-4 text-xl sm:text-2xl bg-red-600 hover:bg-red-700 animate-pulse font-black text-white rounded-xl shadow-lg whitespace-normal leading-tight flex items-center justify-center text-center"
            >
              <Phone className="mr-2.5 h-7 w-7 flex-shrink-0 animate-bounce" />
              <span>{t.call108}</span>
            </Button>

            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStrobeActive(true)}
                className={`flex-1 text-xs font-bold py-2 border rounded-lg ${
                  highContrast 
                    ? "border-yellow-400 text-yellow-300 bg-black hover:bg-yellow-950" 
                    : "border-red-200 text-red-700 hover:bg-red-50 bg-white"
                }`}
              >
                <Flashlight className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
                <span>{t.alarmOnly}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleIncidentRecording}
                className={`flex-1 text-xs font-bold py-2 border rounded-lg ${
                  isRecordingIncident
                    ? "bg-red-600 text-white border-red-600 animate-pulse"
                    : highContrast
                    ? "border-yellow-400 text-yellow-300 bg-black hover:bg-yellow-950"
                    : "border-gray-300 text-gray-800 hover:bg-gray-100 bg-white"
                }`}
              >
                {isRecordingIncident ? <MicOff className="h-3.5 w-3.5 mr-1.5" /> : <Mic className="h-3.5 w-3.5 mr-1.5 text-red-600" />}
                <span>{isRecordingIncident ? t.stopRecordAudio : t.recordAudio}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ============================================================== */}
        {/* SEVERITY LEVEL 2: UNIFIED DISTRESS ALERT (WHATSAPP + SMS + GPS) */}
        {/* ============================================================== */}
        <Card className={`border-2 shadow-sm ${
          highContrast ? "bg-black border-yellow-400 text-yellow-300" : "border-amber-300 bg-amber-50/60"
        }`}>
          <CardContent className="p-4 sm:p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-600 text-white">
                Level 2: Distress Broadcast
              </span>
              <span className="text-xs text-amber-800 font-semibold">
                WhatsApp + SMS + GPS
              </span>
            </div>

            <Button
              onClick={() => setIsDistressModalOpen(true)}
              className="w-full min-h-[3.75rem] py-3 px-4 text-base sm:text-lg bg-amber-600 hover:bg-amber-700 font-extrabold text-white rounded-xl shadow-md flex items-center justify-center text-center gap-2"
            >
              <Send className="h-5 w-5 flex-shrink-0" />
              <span>{t.sendDistressTitle}</span>
            </Button>
            <p className="text-[11px] text-amber-800 text-center leading-tight">
              {t.sendDistressSub}
            </p>
          </CardContent>
        </Card>

        {/* ============================================================== */}
        {/* PARAMEDIC DIRECT MEDICAL PASS (FLASHES ON PHONE FOR WORKERS) */}
        {/* ============================================================== */}
        <Card className={`border-2 shadow-sm cursor-pointer hover:border-red-500 transition-all ${
          highContrast ? "bg-black border-yellow-400 text-yellow-300" : "border-blue-200 bg-white"
        }`} onClick={() => setIsMedicalPassOpen(true)}>
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-blue-100 rounded-xl text-blue-700 flex-shrink-0">
                <FileText className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-sm sm:text-base text-gray-900 truncate">
                  {t.medicalPassTitle}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-1">
                  {t.medicalPassSub}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg flex-shrink-0">
              Open Pass →
            </span>
          </CardContent>
        </Card>

        {/* ============================================================== */}
        {/* "CANNOT SPEAK?" RAPID VOCALIZER BUTTONS (SPEECH SYNTHESIS)     */}
        {/* ============================================================== */}
        <div className={`p-3.5 border rounded-xl space-y-2 ${
          highContrast ? "bg-black border-yellow-400" : "bg-purple-50/80 border-purple-200"
        }`}>
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-purple-700 flex-shrink-0" />
            <span className="text-xs font-black text-purple-900 uppercase tracking-wide">
              {t.cannotSpeakTitle}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => vocalizeEmergencyMessage(t.cannotSpeak1, language === "en" ? "en" : "hi")}
              className="text-xs font-bold py-2 bg-white hover:bg-purple-100 border-purple-300 text-purple-900 rounded-lg whitespace-normal leading-tight text-center"
            >
              📢 {t.cannotSpeak1}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => vocalizeEmergencyMessage(t.cannotSpeak2, language === "en" ? "en" : "hi")}
              className="text-xs font-bold py-2 bg-white hover:bg-purple-100 border-purple-300 text-purple-900 rounded-lg whitespace-normal leading-tight text-center"
            >
              📢 {t.cannotSpeak2}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => vocalizeEmergencyMessage(t.cannotSpeak3, language === "en" ? "en" : "hi")}
              className="text-xs font-bold py-2 bg-white hover:bg-purple-100 border-purple-300 text-purple-900 rounded-lg whitespace-normal leading-tight text-center"
            >
              📢 {t.cannotSpeak3}
            </Button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SEVERITY LEVEL 3: URGENT CARE & NAVIGATION (HOSPITAL + FIRST AID)*/}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            size="lg"
            variant="outline"
            className={`min-h-[4rem] py-3 px-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-sm ${
              highContrast 
                ? "border-yellow-400 text-yellow-300 bg-black hover:bg-yellow-950" 
                : "bg-white border-gray-200 hover:bg-gray-50 text-gray-800"
            }`}
            onClick={() => router.push("/locations")}
          >
            <MapPin className="h-5 w-5 text-red-500 flex-shrink-0" />
            <span>{t.findHospital}</span>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className={`min-h-[4rem] py-3 px-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-sm ${
              highContrast 
                ? "border-yellow-400 text-yellow-300 bg-black hover:bg-yellow-950" 
                : "bg-white border-gray-200 hover:bg-gray-50 text-blue-700"
            }`}
            onClick={() => router.push("/health-info")}
          >
            <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <span>{t.firstAid}</span>
          </Button>
        </div>

        {/* ============================================================== */}
        {/* HELPLINE NUMBERS                                               */}
        {/* ============================================================== */}
        <Card className={`border shadow-sm ${highContrast ? "bg-black border-yellow-400 text-yellow-300" : "bg-white"}`}>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-bold flex items-center">
              <Phone className="h-4 w-4 mr-2 text-primary" />
              {t.helplineTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {emergencyNumbers.map((c, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => window.open(`tel:${c.number}`)}
                className="flex items-center justify-between px-2.5 py-2 text-xs font-bold rounded-lg border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
              >
                <span className="truncate">{c.service}</span>
                <span className="text-red-600 ml-1">{c.number}</span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* ============================================================== */}
        {/* PERSONAL EMERGENCY HEALTH VAULT (OFFLINE)                      */}
        {/* ============================================================== */}
        <div className="flex items-center justify-between p-3.5 bg-white border border-gray-200 rounded-xl shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <HeartPulse className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-gray-900 block truncate">{t.vaultTitle}</span>
              <span className="text-[11px] text-gray-500 block truncate">
                {profile.fullName ? `${profile.fullName} (${profile.bloodGroup || "No blood group"})` : "No profile saved yet"}
              </span>
            </div>
          </div>
          <Dialog open={isVaultOpen} onOpenChange={setIsVaultOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs font-bold border-red-200 text-red-700 hover:bg-red-50 flex-shrink-0">
                {t.editVault}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-red-700 flex items-center">
                  <HeartPulse className="mr-2 h-5 w-5" />
                  {t.editVault}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3.5 py-2 text-sm">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.fullName}</label>
                  <Input
                    value={editingProfile.fullName}
                    onChange={(e) => setEditingProfile({ ...editingProfile, fullName: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.age}</label>
                    <Input
                      value={editingProfile.age}
                      onChange={(e) => setEditingProfile({ ...editingProfile, age: e.target.value })}
                      placeholder="e.g. 52"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.bloodGroup}</label>
                    <Input
                      value={editingProfile.bloodGroup}
                      onChange={(e) => setEditingProfile({ ...editingProfile, bloodGroup: e.target.value })}
                      placeholder="e.g. O+, B+, AB-"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.chronicConditions}</label>
                  <Input
                    value={editingProfile.chronicConditions}
                    onChange={(e) => setEditingProfile({ ...editingProfile, chronicConditions: e.target.value })}
                    placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.allergies}</label>
                  <Input
                    value={editingProfile.severeAllergies}
                    onChange={(e) => setEditingProfile({ ...editingProfile, severeAllergies: e.target.value })}
                    placeholder="e.g. Penicillin, Sulfa"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.medications}</label>
                  <Input
                    value={editingProfile.currentMedications}
                    onChange={(e) => setEditingProfile({ ...editingProfile, currentMedications: e.target.value })}
                    placeholder="e.g. Metformin 500mg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.primaryContact}</label>
                  <Input
                    value={editingProfile.primaryEmergencyContact}
                    onChange={(e) => setEditingProfile({ ...editingProfile, primaryEmergencyContact: e.target.value })}
                    placeholder="e.g. 9876543210"
                  />
                </div>
                <Button onClick={handleSaveProfile} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold">
                  Save to Phone
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* ============================================================== */}
        {/* UNIFIED DISTRESS ALERT DIALOG (WHATSAPP + SMS COMBINED)        */}
        {/* ============================================================== */}
        <Dialog open={isDistressModalOpen} onOpenChange={setIsDistressModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-amber-700 flex items-center">
                <Send className="mr-2 h-5 w-5" />
                {t.distressModalTitle}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3.5 py-2">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-1">
                <div className="font-bold text-gray-800">Preview of Emergency Broadcast Packet:</div>
                <div className="text-gray-600 font-mono text-[11px] leading-tight break-words">
                  {buildDistressMessage()}
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={sendDistressWhatsApp}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>{t.distressViaWa}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={sendDistressSms}
                  className="w-full h-12 border-red-300 text-red-700 hover:bg-red-50 font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-5 w-5 text-red-600" />
                  <span>{t.distressViaSms}</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={shareDistressNative}
                  className="w-full text-xs text-gray-600 hover:bg-gray-100 font-medium"
                >
                  <Share2 className="h-4 w-4 mr-1.5" />
                  <span>{t.distressViaShare}</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ============================================================== */}
        {/* PARAMEDIC DIRECT MEDICAL PASS MODAL (FLASHED FOR WORKERS)     */}
        {/* ============================================================== */}
        {isMedicalPassOpen && (
          <div className="fixed inset-0 z-50 h-[100dvh] w-full bg-black text-yellow-300 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto">
            <div className="flex items-center justify-between border-b border-yellow-500 pb-3">
              <span className="text-xs sm:text-sm font-black tracking-widest uppercase">
                {t.medicalPassHeader}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMedicalPassOpen(false)}
                className="bg-yellow-400 text-black border-yellow-400 font-bold text-xs"
              >
                <X className="h-4 w-4 mr-1" />
                {t.medicalPassClose}
              </Button>
            </div>

            <div className="my-auto py-4 space-y-4 max-w-lg mx-auto w-full text-center">
              {/* Giant Blood Group */}
              <div className="p-4 bg-yellow-400 text-black rounded-2xl shadow-xl">
                <span className="text-xs font-black uppercase tracking-wider block">BLOOD GROUP</span>
                <span className="text-6xl sm:text-7xl font-black block leading-none my-1">
                  {profile.bloodGroup || "UNKNOWN"}
                </span>
              </div>

              {/* Patient Name & Age */}
              <div className="border-2 border-yellow-400 rounded-xl p-4 bg-yellow-950/40 text-left space-y-2">
                <div>
                  <span className="text-[11px] text-yellow-400/80 uppercase font-bold block">Patient Name</span>
                  <span className="text-xl sm:text-2xl font-black text-yellow-300 block">
                    {profile.fullName || "Name Not Specified"} {profile.age ? `(${profile.age} yrs)` : ""}
                  </span>
                </div>

                {profile.chronicConditions && (
                  <div>
                    <span className="text-[11px] text-yellow-400/80 uppercase font-bold block">Chronic Conditions</span>
                    <span className="text-base font-extrabold text-white block">
                      {profile.chronicConditions}
                    </span>
                  </div>
                )}

                {profile.severeAllergies && (
                  <div>
                    <span className="text-[11px] text-red-400 uppercase font-bold block">Severe Allergies</span>
                    <span className="text-base font-extrabold text-red-300 block">
                      ⚠️ {profile.severeAllergies}
                    </span>
                  </div>
                )}

                {profile.currentMedications && (
                  <div>
                    <span className="text-[11px] text-yellow-400/80 uppercase font-bold block">Current Medications</span>
                    <span className="text-sm font-bold text-yellow-200 block">
                      {profile.currentMedications}
                    </span>
                  </div>
                )}

                {profile.primaryEmergencyContact && (
                  <div className="pt-2 border-t border-yellow-500/50 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-yellow-400/80 uppercase font-bold block">Emergency Family Phone</span>
                      <span className="text-base font-black text-white">{profile.primaryEmergencyContact}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => window.open(`tel:${profile.primaryEmergencyContact}`)}
                      className="bg-yellow-400 text-black font-black hover:bg-yellow-300"
                    >
                      <Phone className="h-4 w-4 mr-1" /> Call
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Button
              size="lg"
              onClick={() => setIsMedicalPassOpen(false)}
              className="w-full h-14 bg-yellow-400 text-black hover:bg-yellow-300 font-black text-base rounded-xl"
            >
              Done / वापस जाएं
            </Button>
          </div>
        )}

        {/* ============================================================== */}
        {/* FULLSCREEN CRITICAL EMERGENCY BEACON & ALARM MODAL             */}
        {/* ============================================================== */}
        {strobeActive && (
          <div
            className={`fixed inset-0 z-50 h-[100dvh] w-full max-w-full overflow-y-auto overflow-x-hidden flex flex-col justify-between p-3 sm:p-6 transition-colors duration-150 ${
              strobeLightOn ? "bg-red-600 text-white" : "bg-white text-red-600"
            }`}
          >
            {/* Top Bar with Status and Stop Button */}
            <div className="w-full flex items-center justify-between gap-2 pt-1 pb-2 flex-shrink-0">
              <span className="text-[11px] sm:text-xs font-black tracking-widest uppercase px-2.5 py-1 rounded bg-black/25 text-white truncate shadow-sm">
                {t.beaconActive}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStrobeActive(false)}
                className={`border-2 font-black text-xs px-3 py-1 rounded-lg shadow-sm flex items-center ${
                  strobeLightOn
                    ? "bg-white text-red-600 border-white hover:bg-gray-100"
                    : "bg-red-600 text-white border-red-600 hover:bg-red-700"
                }`}
              >
                <X className="h-4 w-4 mr-1 flex-shrink-0" />
                <span>{t.stopBeacon}</span>
              </Button>
            </div>

            {/* Central Visual Flash and Emergency Banner */}
            <div className="w-full my-auto py-2 sm:py-4 flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 max-w-md mx-auto">
              <div className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none animate-pulse select-none">
                SOS 108
              </div>
              <p className="text-xs sm:text-base md:text-lg font-black max-w-sm mx-auto uppercase leading-snug px-2 break-words">
                {language === "en"
                  ? "EMERGENCY IN PROGRESS — AMBULANCE NEEDED"
                  : "आपातकालीन स्थिति — तत्काल एम्बुलेंस 108 की आवश्यकता"}
              </p>

              {/* Hardware Controls Panel (Audio Siren, Flashlight Torch & Voice Blackbox) */}
              <div className="w-full flex flex-wrap items-center justify-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handleToggleSiren}
                  className={`border-2 text-xs font-black px-3 py-1.5 rounded-lg transition-transform active:scale-95 shadow-sm flex items-center ${
                    sirenActive
                      ? "bg-yellow-400 text-black border-yellow-400 animate-pulse"
                      : strobeLightOn
                      ? "bg-black/40 text-white border-white/40 hover:bg-black/60"
                      : "bg-red-700 text-white border-red-800 hover:bg-red-800"
                  }`}
                >
                  {sirenActive ? <Volume2 className="h-4 w-4 mr-1.5 flex-shrink-0" /> : <VolumeX className="h-4 w-4 mr-1.5 flex-shrink-0" />}
                  <span>{sirenActive ? t.sirenOff : t.sirenOn}</span>
                </Button>

                <Button
                  size="sm"
                  onClick={handleToggleTorch}
                  className={`border-2 text-xs font-black px-3 py-1.5 rounded-lg transition-transform active:scale-95 shadow-sm flex items-center ${
                    torchActive
                      ? "bg-yellow-400 text-black border-yellow-400 animate-pulse"
                      : strobeLightOn
                      ? "bg-black/40 text-white border-white/40 hover:bg-black/60"
                      : "bg-red-700 text-white border-red-800 hover:bg-red-800"
                  }`}
                >
                  <Flashlight className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  <span>{torchActive ? t.torchOff : t.torchOn}</span>
                </Button>

                <Button
                  size="sm"
                  onClick={handleToggleIncidentRecording}
                  className={`border-2 text-xs font-black px-3 py-1.5 rounded-lg transition-transform active:scale-95 shadow-sm flex items-center ${
                    isRecordingIncident
                      ? "bg-red-700 text-white border-white animate-pulse"
                      : strobeLightOn
                      ? "bg-black/40 text-white border-white/40 hover:bg-black/60"
                      : "bg-red-700 text-white border-red-800 hover:bg-red-800"
                  }`}
                >
                  {isRecordingIncident ? <MicOff className="h-4 w-4 mr-1.5 flex-shrink-0" /> : <Mic className="h-4 w-4 mr-1.5 flex-shrink-0" />}
                  <span>{isRecordingIncident ? t.stopRecordAudio : t.recordAudio}</span>
                </Button>
              </div>

              {/* Patient Profile Card (Offline Vault) */}
              {profile.fullName && (
                <div className={`p-3 rounded-xl text-xs sm:text-sm font-bold border-2 max-w-sm w-full mx-auto break-words text-left shadow-sm ${
                  strobeLightOn 
                    ? "bg-red-700 border-white text-white" 
                    : "bg-red-50 border-red-600 text-red-950"
                }`}>
                  <div className="font-black text-sm">{profile.fullName} {profile.age ? `(${profile.age} yrs)` : ""}</div>
                  {profile.bloodGroup && <div className="text-xs mt-0.5 opacity-90">Blood Group: {profile.bloodGroup}</div>}
                  {profile.chronicConditions && <div className="text-[11px] mt-0.5 line-clamp-2 opacity-90">{profile.chronicConditions}</div>}
                </div>
              )}
            </div>

            {/* Bottom 108 Call Action */}
            <div className="w-full max-w-md mx-auto pt-2 pb-1 flex-shrink-0">
              <Button
                size="lg"
                onClick={() => window.open("tel:108")}
                className={`w-full min-h-[3.5rem] sm:min-h-[4rem] text-base sm:text-xl font-black rounded-xl shadow-lg flex items-center justify-center gap-2 ${
                  strobeLightOn
                    ? "bg-white text-red-700 hover:bg-gray-100"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                <Phone className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 animate-bounce" />
                <span>108 AMBULANCE</span>
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
