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

  useEffect(() => {
    const loaded = getEmergencyProfile()
    setProfile(loaded)
    setEditingProfile(loaded)
  }, [])

  // Strobe beacon timer and vibration
  useEffect(() => {
    if (!strobeActive) return

    let wakeLock: any = null
    if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
      try {
        (navigator as any).wakeLock.request("screen").then((wl: any) => {
          wakeLock = wl
        }).catch(() => {})
      } catch {}
    }

    const interval = setInterval(() => {
      setStrobeLightOn((prev) => !prev)
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(100)
      }
    }, 250)

    return () => {
      clearInterval(interval)
      if (wakeLock) {
        try { wakeLock.release() } catch {}
      }
    }
  }, [strobeActive])

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
    <div className="min-h-screen bg-red-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Shake Detection Banner */}
        <div className="flex items-center justify-between p-3.5 bg-red-100/90 border border-red-300 rounded-lg text-sm text-red-900 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Smartphone className="h-5 w-5 text-red-600 animate-pulse" />
            <span className="font-medium">{t.shakeHint}</span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-red-200 text-red-800 rounded-full">
            {shakeActive ? "SOS Sensor Active" : "Sensor Off"}
          </span>
        </div>

        {/* Main Emergency Call */}
        <Card className="border-red-200 bg-white shadow-sm">
          <CardContent className="p-6 space-y-5">
            <Button
              onClick={() => window.open("tel:108")}
              className="w-full h-20 text-2xl bg-red-600 hover:bg-red-700 animate-pulse font-bold"
            >
              <Phone className="mr-2 h-7 w-7" />
              {t.call108}
            </Button>

            {/* Broadcast SOS with Chronic Information */}
            <Button
              onClick={() => triggerSosBroadcast("button")}
              className="w-full h-14 text-base bg-red-950 hover:bg-black text-white font-semibold flex items-center justify-center gap-2 shadow"
            >
              <ShieldAlert className="h-5 w-5 text-red-400" />
              {t.sosBroadcast}
            </Button>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => window.open("sms:112?body=EMERGENCY! I need immediate medical assistance at my location.")}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                {t.smsFallback}
              </Button>
              <Button
                variant="outline"
                className="w-full border-green-200 text-green-600 hover:bg-green-50"
                onClick={shareLocationViaWhatsApp}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                {t.waFallback}
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Button
                size="lg"
                variant="outline"
                className="h-20 bg-transparent"
                onClick={() => router.push("/locations")}
              >
                <MapPin className="mr-2 h-5 w-5" />
                {t.findHospital}
              </Button>
              <Button size="lg" variant="outline" className="h-20 bg-transparent"
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
                <Share2 className="mr-2 h-5 w-5" />
                {t.shareLocation}
              </Button>
            </div>

            <Button
              size="lg"
              variant="outline"
              className="w-full h-16 bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 mt-2 flex items-center justify-center gap-3 font-semibold shadow-sm"
              onClick={() => setStrobeActive(true)}
            >
              <Flashlight className="h-6 w-6 text-amber-600 animate-bounce" />
              <div className="text-left">
                <div className="text-sm font-bold">{t.strobeBeacon}</div>
                <div className="text-xs text-amber-700 font-normal">{t.strobeDesc}</div>
              </div>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-full h-20 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 mt-2"
              onClick={() => router.push("/health-info")}
            >
              <div className="flex flex-col items-center">
                <span className="flex items-center text-lg font-semibold"><BookOpen className="mr-2 h-5 w-5" /> {t.firstAid}</span>
                <span className="text-xs text-blue-500 font-normal mt-1">{t.firstAidSub}</span>
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

        {/* Fullscreen High-Contrast Emergency Strobe Beacon Modal */}
        {strobeActive && (
          <div
            className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-6 transition-colors duration-100 ${
              strobeLightOn ? "bg-red-600 text-white" : "bg-white text-red-600"
            }`}
          >
            <div className="w-full flex justify-between items-center pt-2">
              <span className="text-sm font-bold tracking-widest uppercase">
                {t.beaconActive}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStrobeActive(false)}
                className={`border-2 font-bold ${
                  strobeLightOn
                    ? "bg-white text-red-600 border-white hover:bg-gray-100"
                    : "bg-red-600 text-white border-red-600 hover:bg-red-700"
                }`}
              >
                <X className="h-5 w-5 mr-1" />
                {t.stopBeacon}
              </Button>
            </div>

            <div className="text-center my-auto space-y-6">
              <div className="text-7xl sm:text-9xl font-black tracking-tight animate-bounce">
                SOS 108
              </div>
              <p className="text-xl sm:text-3xl font-extrabold max-w-xl mx-auto uppercase">
                {language === "en"
                  ? "EMERGENCY IN PROGRESS — AMBULANCE NEEDED"
                  : "आपातकालीन स्थिति — तत्काल एम्बुलेंस 108 की आवश्यकता"}
              </p>
              {profile.fullName && (
                <div className={`p-4 rounded-xl text-lg font-bold border-2 max-w-md mx-auto ${
                  strobeLightOn ? "bg-red-700 border-white text-white" : "bg-red-50 border-red-600 text-red-900"
                }`}>
                  <div>{profile.fullName} {profile.age ? `(${profile.age} yrs)` : ""}</div>
                  {profile.bloodGroup && <div className="text-sm mt-1">Blood: {profile.bloodGroup}</div>}
                  {profile.chronicConditions && <div className="text-xs mt-1 font-medium">{profile.chronicConditions}</div>}
                </div>
              )}
            </div>

            <div className="w-full max-w-md pb-4 flex gap-3">
              <Button
                size="lg"
                onClick={() => window.open("tel:108")}
                className={`w-full h-16 text-xl font-bold ${
                  strobeLightOn
                    ? "bg-white text-red-700 hover:bg-gray-100"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                <Phone className="h-6 w-6 mr-2" />
                108 AMBULANCE
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
