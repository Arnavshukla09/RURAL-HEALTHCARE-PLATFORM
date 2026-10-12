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
  Radio,
  X,
  Volume2,
  VolumeX,
  Sun,
  Contrast,
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

interface EmergencyModuleProps {
  language: string
}

export function EmergencyModule({ language }: EmergencyModuleProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [profile, setProfile] = useState<EmergencyProfile>(DEFAULT_PROFILE)
  const [editingProfile, setEditingProfile] = useState<EmergencyProfile>(DEFAULT_PROFILE)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [shakeActive, setShakeActive] = useState(true)
  const [strobeActive, setStrobeActive] = useState(false)
  const [strobeLightOn, setStrobeLightOn] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [sirenActive, setSirenActive] = useState(false)
  const [torchActive, setTorchActive] = useState(false)

  useEffect(() => {
    const loaded = getEmergencyProfile()
    setProfile(loaded)
    setEditingProfile(loaded)
  }, [])

  // Strobe beacon timer, wake lock, hardware torch & audio siren
  useEffect(() => {
    if (!strobeActive) {
      stopAudioSiren()
      setSirenActive(false)
      toggleHardwareTorch(false)
      setTorchActive(false)
      releaseScreenWakeLock()
      return
    }

    // Keep screen awake at full brightness
    requestScreenWakeLock()

    const interval = setInterval(() => {
      setStrobeLightOn((prev) => !prev)
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(100)
      }
    }, 250)

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

  const content = {
    en: {
      title: "Emergency Services",
      subtitle: "Get immediate medical assistance",
      call108: "Call 108 - Ambulance",
      findHospital: "Find Nearest Hospital",
      shareLocation: "Share My Location",
      emergencyContacts: "Helpline",
      ambulance: "Ambulance",
      police: "Police Helpline- DIAL100",
      fire: "Fire Emergency",
      cmHelpline: "CM Helpline",
      childHelpline: "Child Helpline",
      womenHelpline: "Women Helpline",
      ayushman: "Ayushman Bharat Helpline",
      nationalHealth: "National Health Helpline (NHP)",
      instructions: "Emergency Instructions",
      steps: [
        "Stay calm and assess the situation",
        "Call emergency services immediately",
        "Provide clear location details",
        "Follow operator instructions",
        "Do not move injured person unless necessary",
      ],
      smsFallback: "SMS Emergency SOS",
      waFallback: "WhatsApp SOS",
      firstAid: "First-Aid Guide",
      firstAidSub: "Tap any card for full step-by-step instructions →",
      vaultTitle: "Personal Emergency Vault (Offline)",
      vaultSubtitle: "Chronic health profile & contacts transmitted automatically during SOS",
      editVault: "Edit Health Profile",
      saveVault: "Save to Phone (Offline)",
      fullName: "Full Name",
      age: "Age",
      bloodGroup: "Blood Group",
      chronicConditions: "Chronic Conditions (Diabetes, Heart, Asthma, etc.)",
      medications: "Current Daily Medications",
      allergies: "Known Drug / Food Allergies",
      primaryContact: "Primary Emergency Contact (Mobile Number)",
      secondaryContact: "Secondary Emergency Contact (Mobile Number)",
      sosBroadcast: "Broadcast Medical SOS with Health Profile",
      shakeDetected: "Vigorous phone shake detected! Initiating SOS...",
      shakeHint: "Shake phone 3 times to trigger instant emergency broadcast",
      noneRecorded: "None recorded",
      savedSuccess: "Emergency profile saved locally on this device!",
      strobeBeacon: "Night SOS Screen Beacon & Siren",
      strobeDesc: "Flashes high-visibility screen beacon & vibrates to guide ambulances in dark village roads",
      stopBeacon: "Stop Beacon",
      beaconActive: "EMERGENCY BEACON ACTIVE",
      waVaultShare: "WhatsApp SOS + Health Summary",
      highContrastToggle: "High Contrast (Sunlight)",
      sirenOn: "Sound Siren",
      sirenOff: "Mute Siren",
      torchOn: "Camera LED Flash",
      torchOff: "Turn Flash Off",
    },
    hi: {
      title: "आपातकालीन सेवाएं",
      subtitle: "तत्काल चिकित्सा सहायता प्राप्त करें",
      call108: "108 पर कॉल करें - एम्बुलेंस",
      findHospital: "निकटतम अस्पताल खोजें",
      shareLocation: "मेरा स्थान साझा करें",
      emergencyContacts: "हेल्पलाइन",
      ambulance: "एम्बुलेंस",
      police: "पुलिस हेल्पलाइन- 100",
      fire: "अग्निशमन आपातकाल",
      cmHelpline: "सीएम हेल्पलाइन",
      childHelpline: "चाइल्ड हेल्पलाइन",
      womenHelpline: "महिला हेल्पलाइन",
      ayushman: "आयुष्मान भारत हेल्पलाइन",
      nationalHealth: "राष्ट्रीय स्वास्थ्य हेल्पलाइन",
      instructions: "आपातकालीन निर्देश",
      steps: [
        "शांत रहें और स्थिति का आकलन करें",
        "आपातकालीन सेवाओं को तुरंत कॉल करें",
        "स्पष्ट स्थान विवरण प्रदान करें",
        "ऑपरेटर के निर्देशों का पालन करें",
        "आवश्यक न होने पर घायल व्यक्ति को न हिलाएं",
      ],
      smsFallback: "एसएमएस आपातकालीन एसओएस",
      waFallback: "व्हाट्सएप एसओएस",
      firstAid: "प्राथमिक चिकित्सा दृश्य मार्गदर्शिका",
      firstAidSub: "पूर्ण चरण-दर-चरण निर्देश के लिए किसी कार्ड पर टैप करें →",
      vaultTitle: "व्यक्तिगत आपातकालीन वॉल्ट (ऑफ़लाइन)",
      vaultSubtitle: "एसओएस के दौरान पुरानी बीमारियां व संपर्क विवरण स्वतः भेजे जाएंगे",
      editVault: "स्वास्थ्य प्रोफाइल संपादित करें",
      saveVault: "फोन में सुरक्षित करें (ऑफ़लाइन)",
      fullName: "पूरा नाम",
      age: "आयु",
      bloodGroup: "रक्त समूह (Blood Group)",
      chronicConditions: "पुरानी बीमारियां (मधुमेह, हृदय, दमा, आदि)",
      medications: "वर्तमान दवाइयां",
      allergies: "गंभीर एलर्जी (दवा/भोजन)",
      primaryContact: "प्राथमिक आपातकालीन संपर्क (मोबाइल नंबर)",
      secondaryContact: "द्वितीयक आपातकालीन संपर्क (मोबाइल नंबर)",
      sosBroadcast: "स्वास्थ्य विवरण सहित आपातकालीन एसओएस भेजें",
      shakeDetected: "फोन झटका पहचाना गया! एसओएस शुरू हो रहा है...",
      shakeHint: "तत्काल आपातकालीन अलर्ट के लिए फोन को 3 बार हिलाएं",
      noneRecorded: "कोई दर्ज नहीं",
      savedSuccess: "आपातकालीन प्रोफाइल इस डिवाइस पर सुरक्षित कर दी गई!",
      strobeBeacon: "नाइट एसओएस स्क्रीन बीकन और सायरन",
      strobeDesc: "अंधेरे ग्रामीण रास्तों पर एम्बुलेंस को आकर्षित करने के लिए तेज चमकती स्क्रीन व कम्पन",
      stopBeacon: "बीकन बंद करें",
      beaconActive: "आपातकालीन बीकन सक्रिय",
      waVaultShare: "व्हाट्सएप एसओएस + स्वास्थ्य सारांश",
      highContrastToggle: "उच्च कंट्रास्ट (तेज़ धूप)",
      sirenOn: "सायरन बजाएं",
      sirenOff: "सायरन बंद करें",
      torchOn: "कैमरा एलईडी फ्लैश",
      torchOff: "फ्लैश बंद करें",
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

  const handleSaveProfile = () => {
    const updated = saveEmergencyProfile(editingProfile)
    setProfile(updated)
    setIsDialogOpen(false)
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

  const shareLocationViaWhatsApp = () => {
    const contactParam = (profile.primaryEmergencyContact || "").replace(/[^0-9]/g, "")
    const targetPhone = contactParam ? (contactParam.length === 10 ? `91${contactParam}` : contactParam) : ""
    const waBase = targetPhone ? `https://wa.me/${targetPhone}` : "https://wa.me/"

    const buildMsg = (mapUrl?: string) => {
      let msg = "🚨 *MEDICAL EMERGENCY SOS ALERT* 🚨\n"
      if (profile.fullName) msg += `*Patient:* ${profile.fullName}${profile.age ? ` (Age: ${profile.age})` : ""}\n`
      if (profile.bloodGroup) msg += `*Blood Group:* ${profile.bloodGroup}\n`
      if (profile.chronicConditions) msg += `*Chronic Conditions:* ${profile.chronicConditions}\n`
      if (profile.currentMedications) msg += `*Medications:* ${profile.currentMedications}\n`
      if (profile.severeAllergies) msg += `*Allergies:* ${profile.severeAllergies}\n`
      if (mapUrl) msg += `*Live Location:* ${mapUrl}\n`
      msg += "\nImmediate medical assistance or ambulance (108) required!"
      return msg
    }

    if (!navigator.geolocation) {
      window.open(`${waBase}?text=${encodeURIComponent(buildMsg())}`);
      return;
    }
    toast({ title: language === 'en' ? 'Fetching location...' : 'लोकेशन प्राप्त कर रहा है...' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const url = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
        window.open(`${waBase}?text=${encodeURIComponent(buildMsg(url))}`);
      },
      () => {
        window.open(`${waBase}?text=${encodeURIComponent(buildMsg())}`);
        toast({ title: language === 'en' ? 'Could not fetch location (sent without GPS)' : 'लोकेशन नहीं मिला (बिना GPS भेजा गया)', variant: "destructive" });
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 p-3 sm:p-6 ${
      highContrast 
        ? "bg-black text-yellow-300 contrast-125" 
        : "bg-red-50 text-gray-900"
    }`}>
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 overflow-hidden">
        
        {/* Title and High-Contrast Accessibility Switch */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${
              highContrast ? "text-yellow-400" : "text-red-600"
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
            className={`border-2 font-bold px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1.5 ${
              highContrast
                ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-300"
                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
            }`}
          >
            <Contrast className="h-4 w-4" />
            <span>{t.highContrastToggle}</span>
          </Button>
        </div>

        {/* Shake Detection Banner */}
        <div className={`flex items-center justify-between p-3 sm:p-3.5 border rounded-xl text-xs sm:text-sm shadow-sm gap-2 ${
          highContrast
            ? "bg-yellow-950/60 border-yellow-500 text-yellow-200"
            : "bg-red-100/90 border-red-300 text-red-900"
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 animate-pulse flex-shrink-0" />
            <span className="font-medium truncate">{t.shakeHint}</span>
          </div>
          <span className={`text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full flex-shrink-0 ${
            highContrast ? "bg-yellow-400 text-black" : "bg-red-200 text-red-800"
          }`}>
            {shakeActive ? "Active" : "Off"}
          </span>
        </div>

        {/* Main Emergency Call */}
        <Card className={`border-2 shadow-sm ${
          highContrast ? "bg-black border-yellow-400 text-yellow-300" : "border-red-200 bg-white"
        }`}>
          <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            <Button
              onClick={() => window.open("tel:108")}
              className="w-full min-h-[4.5rem] py-3 px-4 text-xl sm:text-2xl bg-red-600 hover:bg-red-700 animate-pulse font-black text-white rounded-xl shadow-md whitespace-normal leading-tight flex items-center justify-center text-center"
            >
              <Phone className="mr-2 h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0" />
              <span>{t.call108}</span>
            </Button>

            {/* Broadcast SOS with Chronic Information */}
            <Button
              onClick={() => triggerSosBroadcast("button")}
              className={`w-full min-h-[3.25rem] py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow rounded-xl whitespace-normal leading-tight text-center ${
                highContrast 
                  ? "bg-yellow-400 text-black hover:bg-yellow-300"
                  : "bg-red-950 hover:bg-black text-white"
              }`}
            >
              <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0" />
              <span>{t.sosBroadcast}</span>
            </Button>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className={`w-full min-h-[3rem] py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl whitespace-normal leading-tight ${
                  highContrast 
                    ? "border-yellow-400 text-yellow-300 bg-black hover:bg-yellow-950" 
                    : "border-red-200 text-red-600 hover:bg-red-50 bg-white"
                }`}
                onClick={() => window.open("sms:112?body=EMERGENCY! I need immediate medical assistance at my location.")}
              >
                <MessageSquare className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{t.smsFallback}</span>
              </Button>
              <Button
                variant="outline"
                className={`w-full min-h-[3rem] py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl whitespace-normal leading-tight ${
                  highContrast 
                    ? "border-green-400 text-green-300 bg-black hover:bg-green-950" 
                    : "border-green-200 text-green-600 hover:bg-green-50 bg-white"
                }`}
                onClick={shareLocationViaWhatsApp}
              >
                <MessageCircle className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{t.waFallback}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                size="lg"
                variant="outline"
                className={`min-h-[3.5rem] sm:min-h-[4.5rem] py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl whitespace-normal leading-tight ${
                  highContrast 
                    ? "border-yellow-400 text-yellow-300 bg-black hover:bg-yellow-950" 
                    : "bg-transparent border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => router.push("/locations")}
              >
                <MapPin className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-red-500" />
                <span>{t.findHospital}</span>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className={`min-h-[3.5rem] sm:min-h-[4.5rem] py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl whitespace-normal leading-tight ${
                  highContrast 
                    ? "border-yellow-400 text-yellow-300 bg-black hover:bg-yellow-950" 
                    : "bg-transparent border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => {
                  if (!navigator.geolocation) {
                    toast({ title: language === 'en' ? 'Geolocation not supported by your browser' : 'आपका ब्राउज़र लोकेशन सपोर्ट नहीं करता', variant: "destructive" })
                    return
                  }
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const url = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`
                      navigator.clipboard.writeText(url).then(() => {
                        toast({ title: language === 'en' ? 'Location link copied to clipboard! Share it with emergency contacts.' : 'लोकेशन लिंक कॉपी हो गया! आपातकालीन संपर्कों के साथ साझा करें।' })
                      }).catch(() => {
                        prompt(language === 'en' ? 'Copy this location link:' : 'यह लिंक कॉपी करें:', url)
                      })
                    },
                    () => toast({ title: language === 'en' ? 'Location access denied' : 'लोकेशन अनुमति अस्वीकृत', variant: "destructive" })
                  )
                }}
              >
                <Share2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-blue-500" />
                <span>{t.shareLocation}</span>
              </Button>
            </div>

            <Button
              size="lg"
              variant="outline"
              className={`w-full min-h-[4rem] py-3 px-3.5 mt-2 flex items-center justify-start gap-3 font-semibold shadow-sm rounded-xl text-left ${
                highContrast 
                  ? "bg-black border-2 border-yellow-400 text-yellow-300 hover:bg-yellow-950" 
                  : "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
              }`}
              onClick={() => setStrobeActive(true)}
            >
              <Flashlight className="h-6 w-6 text-amber-600 animate-bounce flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold truncate">{t.strobeBeacon}</div>
                <div className="text-[11px] sm:text-xs text-amber-700/90 font-normal line-clamp-1">{t.strobeDesc}</div>
              </div>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className={`w-full min-h-[4rem] py-3 px-3.5 mt-2 rounded-xl text-center ${
                highContrast 
                  ? "bg-black border-2 border-yellow-400 text-yellow-300 hover:bg-yellow-950" 
                  : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              }`}
              onClick={() => router.push("/health-info")}
            >
              <div className="flex flex-col items-center">
                <span className="flex items-center text-sm sm:text-base font-bold"><BookOpen className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> {t.firstAid}</span>
                <span className="text-[11px] sm:text-xs text-blue-500 font-normal mt-0.5">{t.firstAidSub}</span>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Personal Emergency Vault (Offline) */}
        <Card className="border-red-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="flex items-center text-red-700 text-lg">
                <HeartPulse className="h-5 w-5 mr-2 text-red-600" />
                {t.vaultTitle}
              </CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">{t.vaultSubtitle}</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50">
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
                      placeholder="e.g. Penicillin, Sulfa, Peanuts"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.medications}</label>
                    <Input
                      value={editingProfile.currentMedications}
                      onChange={(e) => setEditingProfile({ ...editingProfile, currentMedications: e.target.value })}
                      placeholder="e.g. Metformin 500mg, Inhaler"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.primaryContact}</label>
                    <Input
                      value={editingProfile.primaryEmergencyContact}
                      onChange={(e) => setEditingProfile({ ...editingProfile, primaryEmergencyContact: e.target.value })}
                      placeholder="e.g. +91 9876543210"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">{t.secondaryContact}</label>
                    <Input
                      value={editingProfile.secondaryEmergencyContact}
                      onChange={(e) => setEditingProfile({ ...editingProfile, secondaryEmergencyContact: e.target.value })}
                      placeholder="e.g. +91 9123456789"
                    />
                  </div>
                  <Button
                    onClick={handleSaveProfile}
                    className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold"
                  >
                    {t.saveVault}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                <span className="text-xs text-gray-500 block mb-0.5">{t.fullName}</span>
                <span className="font-semibold text-gray-900 truncate block">{profile.fullName || t.noneRecorded}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                <span className="text-xs text-gray-500 block mb-0.5">{t.bloodGroup}</span>
                <span className="font-bold text-red-600 block">{profile.bloodGroup || "Unknown"}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-md border border-gray-100 col-span-2">
                <span className="text-xs text-gray-500 block mb-0.5">{t.chronicConditions}</span>
                <span className="font-medium text-amber-800 line-clamp-1 block">{profile.chronicConditions || t.noneRecorded}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-md border border-gray-100 col-span-2">
                <span className="text-xs text-gray-500 block mb-0.5">{t.allergies}</span>
                <span className="font-medium text-red-700 line-clamp-1 block">{profile.severeAllergies || t.noneRecorded}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-md border border-gray-100 col-span-2">
                <span className="text-xs text-gray-500 block mb-0.5">{t.primaryContact}</span>
                <span className="font-medium text-gray-900 truncate block">{profile.primaryEmergencyContact || t.noneRecorded}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Emergency Contacts */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-primary" />
                {t.emergencyContacts}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {emergencyNumbers.map((contact, idx) => {
                const Icon = contact.icon
                return (
                  <div
                    key={idx}
                    onClick={() => window.open(`tel:${contact.number}`)}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-6 w-6 text-${contact.color}-600`} />
                      <span className="font-medium">{contact.service}</span>
                    </div>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); window.open(`tel:${contact.number}`); }} className="font-bold">
                      {contact.number}
                    </Button>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Emergency Instructions */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-primary" />
                {t.instructions}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {t.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Fullscreen High-Contrast Emergency Strobe Beacon Modal (100% Mobile Safe) */}
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

              {/* Hardware Controls Panel (Audio Siren & Camera LED Flash) */}
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
