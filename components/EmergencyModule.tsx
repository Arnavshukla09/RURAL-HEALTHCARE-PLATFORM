"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  Phone,
  MapPin,
  AlertTriangle,
  Truck,
  MessageSquare,
  MessageCircle,
  BookOpen,
  HeartPulse,
  ShieldAlert,
  Smartphone,
  Flashlight,
  X,
  Volume2,
  VolumeX,
  User,
  Users,
  Mic,
  CheckSquare,
  Square,
  Share2,
  CheckCircle2,
  FlaskConical,
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
  startEmergencyVoiceLoop,
  stopEmergencyVoiceLoop,
} from "@/lib/emergency/audio-blackbox"
import { HelplineDirectory } from "./HelplineDirectory"

interface EmergencyModuleProps {
  language: string
}

export function EmergencyModule({ language }: EmergencyModuleProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [profile, setProfile] = useState<EmergencyProfile>(DEFAULT_PROFILE)
  const [editingProfile, setEditingProfile] = useState<EmergencyProfile>(DEFAULT_PROFILE)
  const [isVaultOpen, setIsVaultOpen] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([1, 2, 3])
  const [isTestSmsMode, setIsTestSmsMode] = useState(false)
  const [shakeActive, setShakeActive] = useState(true)
  const [strobeActive, setStrobeActive] = useState(false)
  const [strobeLightOn, setStrobeLightOn] = useState(false)
  const [sirenActive, setSirenActive] = useState(false)
  const [torchActive, setTorchActive] = useState(false)
  const [voiceLoopActiveState, setVoiceLoopActiveState] = useState(false)
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | undefined>()
  const [shakePromptOpen, setShakePromptOpen] = useState(false)
  const [shakeCountdown, setShakeCountdown] = useState(5)

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

  // Strobe beacon timer, wake lock, hardware torch & audio siren + voice loop
  useEffect(() => {
    if (!strobeActive) {
      stopAudioSiren()
      setSirenActive(false)
      stopEmergencyVoiceLoop()
      setVoiceLoopActiveState(false)
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
        navigator.vibrate(120)
      }
    }, 240)

    return () => {
      clearInterval(interval)
      stopAudioSiren()
      stopEmergencyVoiceLoop()
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

  // Get spoken voice message for looping read-aloud
  const getVoiceAlertMessage = () => {
    if (profile.customVoiceAlert && profile.customVoiceAlert.trim()) {
      return profile.customVoiceAlert.trim()
    }
    if (language === "hi") {
      const namePart = profile.fullName ? `मरीज ${profile.fullName}। ` : ""
      const conditionPart = profile.chronicConditions ? `बीमारी: ${profile.chronicConditions}। ` : ""
      return `आपातकाल! तत्काल चिकित्सा सहायता चाहिए! ${namePart}${conditionPart}कृपया 108 एम्बुलेंस बुलाएं!`
    }
    const namePart = profile.fullName ? `Patient ${profile.fullName}. ` : ""
    const conditionPart = profile.chronicConditions ? `Condition: ${profile.chronicConditions}. ` : ""
    return `Emergency medical alert! ${namePart}${conditionPart}Please call 108 ambulance immediately!`
  }

  // Helper to construct structured SOS message with GPS & chronic health info
  const buildCompleteSosMessage = (coordsOverride?: { lat: number; lng: number }) => {
    const coords = coordsOverride || lastCoords
    const lines: string[] = ["🚨 *MEDICAL EMERGENCY DISTRESS ALERT* 🚨"]

    if (profile.fullName) {
      const ageStr = profile.age ? ` (${profile.age} yrs)` : ""
      lines.push(`*Patient:* ${profile.fullName}${ageStr}`)
    }
    if (profile.bloodGroup && profile.bloodGroup !== "Unknown") {
      lines.push(`*Blood Group:* ${profile.bloodGroup}`)
    }
    if (coords) {
      lines.push(`*Live GPS Location:* https://maps.google.com/?q=${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`)
    }
    if (profile.chronicConditions) {
      lines.push(`*Chronic Conditions:* ${profile.chronicConditions}`)
    }
    if (profile.severeAllergies) {
      lines.push(`*Severe Allergies:* ${profile.severeAllergies}`)
    }
    if (profile.currentMedications) {
      lines.push(`*Current Medications:* ${profile.currentMedications}`)
    }
    const contactsList = [profile.primaryEmergencyContact, profile.secondaryEmergencyContact, profile.tertiaryEmergencyContact]
      .filter(Boolean)
      .join(", ")
    if (contactsList) {
      lines.push(`*Emergency Contacts:* ${contactsList}`)
    }
    if (profile.customVoiceAlert) {
      lines.push(`*Alert Note:* ${profile.customVoiceAlert}`)
    }

    lines.push("⚠️ IMMEDIATE MEDICAL ASSISTANCE REQUIRED! Please dispatch ambulance / help!")
    return lines.join("\n")
  }

  // Helper to construct non-emergency test message
  const buildTestSosMessage = () => {
    const coords = lastCoords
    const lines: string[] = ["🧪 *[TEST MESSAGE - NOT AN EMERGENCY]*"]
    lines.push(`Rural Healthcare Platform test verification from: ${profile.fullName || "User"}.`)
    if (coords) {
      lines.push(`Live GPS Link: https://maps.google.com/?q=${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`)
    }
    lines.push("All system checks are normal. Please reply to this message to confirm receipt.")
    return lines.join("\n")
  }

  // Active saved emergency contacts list (up to 3)
  const savedContacts = [
    { id: 1, label: language === "en" ? "Contact 1 (Primary)" : "संपर्क 1 (प्राथमिक)", number: profile.primaryEmergencyContact },
    { id: 2, label: language === "en" ? "Contact 2" : "संपर्क 2", number: profile.secondaryEmergencyContact },
    { id: 3, label: language === "en" ? "Contact 3" : "संपर्क 3", number: profile.tertiaryEmergencyContact || "" },
  ].filter((c) => Boolean(c.number && c.number.trim()))

  // BUTTON 1: Distress SOS to 112
  // Sends complete medical info & live GPS location to 112 dispatch without activating siren/beacon
  const handleTriggerDistressSos = async () => {
    triggerSosVibration()

    const sendSmsTo112 = (coords?: { lat: number; lng: number }) => {
      const body = buildCompleteSosMessage(coords)
      const encoded = encodeURIComponent(body)
      window.location.href = `sms:112?body=${encoded}`
    }

    if (navigator.geolocation) {
      toast({
        title: language === "en" ? "Acquiring GPS for 112 distress dispatch..." : "112 संकट संदेश के लिए जीपीएस प्राप्त कर रहा है...",
      })
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setLastCoords(coords)
          sendSmsTo112(coords)
        },
        () => {
          sendSmsTo112(lastCoords)
        },
        { timeout: 4000, enableHighAccuracy: true }
      )
    } else {
      sendSmsTo112(lastCoords)
    }
  }

  // SHAKE TRIGGER: COMBINATION OF SIREN, BEACON, FLASH, VOICE LOOP & DISTRESS DISPATCH ALL TOGETHER
  const handleTriggerShakeBroadcast = async () => {
    triggerSosVibration()

    // 1. Activate alarms: Strobe beacon, siren, hardware flashlight
    setStrobeActive(true)
    startAudioSiren()
    setSirenActive(true)
    toggleHardwareTorch(true).then((ok) => { if (ok) setTorchActive(true) })
    requestScreenWakeLock()

    // 2. Start continuous looping read-aloud of custom voice message
    const voiceMsg = getVoiceAlertMessage()
    startEmergencyVoiceLoop(voiceMsg, language === "hi" ? "hi" : "en")
    setVoiceLoopActiveState(true)

    // 3. Prepare full distress message with GPS and dispatch to 112 & contacts
    const sendSmsBroadcast = (coords?: { lat: number; lng: number }) => {
      const body = buildCompleteSosMessage(coords)
      const encoded = encodeURIComponent(body)
      
      const numbers = [
        profile.primaryEmergencyContact,
        profile.secondaryEmergencyContact,
        profile.tertiaryEmergencyContact,
      ]
        .filter(Boolean)
        .map((n) => (n as string).trim().replace(/[^\d+]/g, ""))
        .filter(Boolean)

      const targetRecipient = numbers.length > 0 ? numbers.join(",") : "112"
      window.location.href = `sms:${targetRecipient}?body=${encoded}`
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setLastCoords(coords)
          sendSmsBroadcast(coords)
        },
        () => {
          sendSmsBroadcast(lastCoords)
        },
        { timeout: 4000, enableHighAccuracy: true }
      )
    } else {
      sendSmsBroadcast(lastCoords)
    }
  }

  // BUTTON 2: Alert Emergency Contacts
  const handleOpenContactAlert = () => {
    if (savedContacts.length === 0) {
      toast({
        title: language === "en" ? "No emergency contacts saved" : "कोई आपातकालीन संपर्क दर्ज नहीं है",
        description: language === "en" ? "Please save up to 3 emergency contacts in the vault below." : "कृपया नीचे वॉल्ट में 3 आपातकालीन संपर्क तक दर्ज करें।",
        variant: "destructive",
      })
      setIsVaultOpen(true)
      return
    }
    // Select all available contacts by default
    setSelectedContactIds(savedContacts.map((c) => c.id))
    setIsTestSmsMode(false)
    setIsContactModalOpen(true)
  }

  // Toggle selection for a contact in the modal
  const toggleContactSelection = (id: number) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Select/Deselect all contacts
  const toggleSelectAllContacts = () => {
    if (selectedContactIds.length === savedContacts.length) {
      setSelectedContactIds([])
    } else {
      setSelectedContactIds(savedContacts.map((c) => c.id))
    }
  }

  // Send normal SMS to all selected contacts at once
  const sendNormalSmsToSelected = () => {
    const selected = savedContacts.filter((c) => selectedContactIds.includes(c.id))
    if (selected.length === 0) {
      toast({
        title: language === "en" ? "Please select at least 1 contact" : "कृपया कम से कम 1 संपर्क चुनें",
        variant: "destructive",
      })
      return
    }

    const recipients = selected.map((c) => c.number.replace(/[^\d+]/g, "")).filter(Boolean)
    const message = isTestSmsMode ? buildTestSosMessage() : buildCompleteSosMessage()
    window.location.href = `sms:${recipients.join(",")}?body=${encodeURIComponent(message)}`
    setIsContactModalOpen(false)
  }

  // Dispatch via WhatsApp to a single specific contact
  const sendWhatsAppToContact = (rawNumber: string) => {
    const cleaned = rawNumber.replace(/[^0-9]/g, "")
    const targetPhone = cleaned.length === 10 ? `91${cleaned}` : cleaned
    const waBase = targetPhone ? `https://wa.me/${targetPhone}` : "https://wa.me/"
    const message = isTestSmsMode ? buildTestSosMessage() : buildCompleteSosMessage()
    window.open(`${waBase}?text=${encodeURIComponent(message)}`, "_blank")
  }

  // Share to multiple chats/contacts via Native Share Sheet (WhatsApp Multi-Select)
  const shareToAllViaApps = () => {
    const message = isTestSmsMode ? buildTestSosMessage() : buildCompleteSosMessage()
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: isTestSmsMode ? "TEST MESSAGE - Rural Health" : "MEDICAL EMERGENCY SOS",
        text: message,
      }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(message)
      toast({
        title: language === "en" ? "Message copied to clipboard! Paste in WhatsApp." : "संदेश क्लिपबोर्ड में कॉपी हो गया! व्हाट्सएप में पेस्ट करें।",
      })
    }
    setIsContactModalOpen(false)
  }

  // Stop all active alarms (Beacon, Siren, Flashlight, Voice Loop)
  const handleStopAllAlarms = () => {
    setStrobeActive(false)
    stopAudioSiren()
    setSirenActive(false)
    stopEmergencyVoiceLoop()
    setVoiceLoopActiveState(false)
    toggleHardwareTorch(false)
    setTorchActive(false)
    releaseScreenWakeLock()
  }

  const handleSaveProfile = () => {
    const updated = saveEmergencyProfile(editingProfile)
    setProfile(updated)
    setIsVaultOpen(false)
    toast({ 
      title: language === "en" ? "Profile saved successfully!" : "प्रोफ़ाइल सफलतापूर्वक सुरक्षित हो गई!" 
    })
  }

  // Physical Shake Gesture Detection (3 shakes &rarr; opens floating confirmation countdown)
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
            triggerSosVibration()
            setShakePromptOpen(true)
            setShakeCountdown(5)
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
  }, [shakeActive, profile, lastCoords, language])

  // Countdown timer for accidental shake rejection
  useEffect(() => {
    if (!shakePromptOpen) return
    if (shakeCountdown <= 0) {
      setShakePromptOpen(false)
      handleTriggerShakeBroadcast()
      return
    }
    const timer = setTimeout(() => {
      setShakeCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [shakePromptOpen, shakeCountdown])

  const handleCancelShakeDistress = () => {
    setShakePromptOpen(false)
    setShakeCountdown(5)
    toast({
      title: language === "en" ? "Emergency alert cancelled" : "आपातकालीन अलर्ट रद्द किया गया",
      description: language === "en" ? "Accidental shake detected and rejected." : "आकस्मिक झटका रद्द कर दिया गया।",
    })
  }

  const handleConfirmShakeDistress = () => {
    setShakePromptOpen(false)
    setShakeCountdown(5)
    handleTriggerShakeBroadcast()
  }

  const content = {
    en: {
      title: "Emergency Services",
      subtitle: "Get immediate medical assistance",
      call108: "Call 108 — Ambulance",
      distressBtn: "Distress SOS Broadcast (112)",
      distressBtnSub: "Sends full medical info & live GPS location to 112 dispatch",
      contactBtn: "Alert Emergency Contacts (SMS & WhatsApp)",
      contactBtnSub: "Send to up to 3 saved contacts at once or test message",
      beaconBtn: "Night SOS Screen Beacon & Siren",
      beaconBtnSub: "Flashes high-visibility screen beacon, siren, torch & looping voice alert",
      findHospital: "Nearest 24/7 Hospital",
      firstAid: "Visual First-Aid Guide",
      firstAidSub: "Offline step-by-step instructions for CPR, bleeding & fractures",
      shakeHint: "Shake phone 3 times to trigger instant emergency broadcast",
      vaultTitle: "Personal Emergency Vault (Offline)",
      vaultSubtitle: "Chronic health profile & up to 3 contacts transmitted automatically during SOS",
      editVault: "Edit Health Profile",
      fullName: "Full Name",
      age: "Age",
      bloodGroup: "Blood Group",
      chronicConditions: "Chronic Conditions (Diabetes, Heart, Asthma, etc.)",
      medications: "Current Medications",
      allergies: "Known Drug / Food Allergies",
      primaryContact: "Emergency Contact 1 (Primary Mobile)",
      secondaryContact: "Emergency Contact 2 (Mobile Number)",
      tertiaryContact: "Emergency Contact 3 (Mobile Number)",
      customVoiceLabel: "Custom Emergency Voice Alert (Spoken Aloud in Loop)",
      customVoicePlaceholder: "e.g., I have severe heart condition and asthma, please help me immediately!",
      customVoiceHint: "This message will be spoken continuously aloud during Distress SOS alongside the siren.",
      noneRecorded: "None recorded",
      unknown: "Unknown",
      beaconActive: "CRITICAL ALARM ACTIVE",
      stopBeacon: "Stop Alarm, Siren & Voice",
      sirenOn: "Sound Siren",
      sirenOff: "Mute Siren",
      torchOn: "Camera Flash",
      torchOff: "Flash Off",
      contactModalTitle: "Alert Saved Emergency Contacts",
      contactModalDesc: "Select recipients (up to 3) and choose message type:",
      selectAll: "Select All Contacts",
      sendSmsAll: "Send Normal SMS to Selected",
      sendTestSms: "Send Test Message",
      testModeActive: "Test Mode Active (Non-Emergency)",
      emergencyModeActive: "Emergency SOS Mode Active",
      shareWaAll: "Share via WhatsApp / Other Apps",
      waDirect: "WhatsApp",
      helplineTitle: "Government Helplines",
      instructionsTitle: "Emergency Instructions",
      inst1: "Stay calm and assess the situation",
      inst2: "Call emergency services immediately (108 / 112)",
      inst3: "Provide clear location details or landmark",
      inst4: "Follow emergency operator instructions",
      inst5: "Do not move injured person unless in danger",
      cmHelpline: "CM Helpline",
      childHelpline: "Child Helpline",
      police: "Police Helpline- 100",
      fire: "Fire Emergency",
      ambulance: "Ambulance",
      womenHelpline: "Women Helpline",
      ayushman: "Ayushman Bharat Helpline",
      nationalHealth: "National Health Helpline",
    },
    hi: {
      title: "आपातकालीन सेवाएं",
      subtitle: "तत्काल चिकित्सा सहायता प्राप्त करें",
      call108: "108 पर कॉल करें — एम्बुलेंस",
      distressBtn: "संकट एसओएस प्रसारण (112)",
      distressBtnSub: "112 आपातकालीन सेवा को संपूर्ण मेडिकल विवरण व लाइव जीपीएस भेजता है",
      contactBtn: "आपातकालीन संपर्कों को सूचित करें (SMS और WhatsApp)",
      contactBtnSub: "3 संपर्कों को एक साथ संदेश भेजें या टेस्ट संदेश भेजें",
      beaconBtn: "नाईट एसओएस स्क्रीन बीकन और सायरन",
      beaconBtnSub: "फ्लैशिंग बीकन, सायरन, टॉर्च और कस्टम वॉइस अलर्ट लूप चलाता है",
      findHospital: "निकटतम 24/7 अस्पताल",
      firstAid: "प्राथमिक चिकित्सा मार्गदर्शिका",
      firstAidSub: "सीपीआर, रक्तस्राव और फ्रैक्चर के लिए ऑफ़लाइन निर्देश",
      shakeHint: "तत्काल आपातकालीन अलर्ट के लिए फोन को 3 बार हिलाएं",
      vaultTitle: "व्यक्तिगत आपातकालीन वॉल्ट (ऑफ़लाइन)",
      vaultSubtitle: "एसओएस के दौरान क्रोनिक स्वास्थ्य प्रोफाइल और 3 संपर्क स्वचालित रूप से भेजे जाते हैं",
      editVault: "स्वास्थ्य प्रोफाइल संपादित करें",
      fullName: "पूरा नाम",
      age: "आयु",
      bloodGroup: "रक्त समूह (Blood Group)",
      chronicConditions: "पुरानी बीमारियां (मधुमेह, हृदय, अस्थमा आदि)",
      medications: "वर्तमान दवाइयां",
      allergies: "गंभीर एलर्जी (दवा / भोजन)",
      primaryContact: "आपातकालीन संपर्क 1 (प्राथमिक मोबाइल)",
      secondaryContact: "आपातकालीन संपर्क 2 (मोबाइल नंबर)",
      tertiaryContact: "आपातकालीन संपर्क 3 (मोबाइल नंबर)",
      customVoiceLabel: "कस्टम आपातकालीन वॉइस संदेश (लूप में बोलेगा)",
      customVoicePlaceholder: "उदा. मुझे दिल की बीमारी और अस्थमा है, कृपया तुरंत मदद करें!",
      customVoiceHint: "संकट एसओएस के दौरान यह संदेश सायरन के साथ लगातार लूप में बोला जाएगा।",
      noneRecorded: "कोई दर्ज नहीं",
      unknown: "अज्ञात",
      beaconActive: "गंभीर आपातकालीन अलार्म सक्रिय",
      stopBeacon: "अलार्म, सायरन व आवाज़ बंद करें",
      sirenOn: "सायरन बजाएं",
      sirenOff: "सायरन बंद करें",
      torchOn: "कैमरा फ्लैश",
      torchOff: "फ्लैश बंद",
      contactModalTitle: "आपातकालीन संपर्कों को संदेश भेजें",
      contactModalDesc: "प्राप्तकर्ता चुनें (3 तक) और संदेश का प्रकार चुनें:",
      selectAll: "सभी संपर्क चुनें",
      sendSmsAll: "चयनित संपर्कों को सामान्य SMS भेजें",
      sendTestSms: "टेस्ट संदेश भेजें",
      testModeActive: "टेस्ट मोड सक्रिय (गैर-आपातकालीन)",
      emergencyModeActive: "आपातकालीन एसओएस मोड सक्रिय",
      shareWaAll: "WhatsApp व अन्य ऐप्स पर साझा करें",
      waDirect: "व्हाट्सएप",
      helplineTitle: "सरकारी हेल्पलाइन",
      instructionsTitle: "आपातकालीन निर्देश",
      inst1: "शांत रहें और स्थिति का आकलन करें",
      inst2: "तुरंत आपातकालीन सेवाओं को कॉल करें (108 / 112)",
      inst3: "सटीक स्थान या निकटतम पहचान चिह्न बताएं",
      inst4: "ऑपरेटर के निर्देशों का पालन करें",
      inst5: "खतरे के बिना घायल व्यक्ति को न हिलाएं",
      cmHelpline: "सीएम हेल्पलाइन",
      childHelpline: "चाइल्ड हेल्पलाइन",
      police: "पुलिस हेल्पलाइन- 100",
      fire: "अग्निशमन आपातकाल",
      ambulance: "एम्बुलेंस",
      womenHelpline: "महिला हेल्पलाइन",
      ayushman: "आयुushman भारत हेल्पलाइन",
      nationalHealth: "राष्ट्रीय स्वास्थ्य हेल्पलाइन",
    },
  }

  const t = content[language as keyof typeof content] || content.en

  return (
    <div className="min-h-screen bg-red-50 text-gray-900 p-3 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5 overflow-hidden">
        
        {/* Top Header: Title & Subtitle */}
        <div className="pt-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-red-700">
            {t.title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
            {t.subtitle}
          </p>
        </div>

        {/* Shake Detection Banner */}
        <div className="flex items-center justify-between p-3 border rounded-xl text-xs sm:text-sm shadow-sm gap-2 bg-red-100/90 border-red-300 text-red-900">
          <div className="flex items-center gap-2 min-w-0">
            <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 animate-pulse flex-shrink-0" />
            <span className="font-medium truncate">{t.shakeHint}</span>
          </div>
          <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 bg-red-200 text-red-800">
            {shakeActive ? "Active" : "Off"}
          </span>
        </div>

        {/* Primary Actions Card */}
        <Card className="border-2 border-red-200 bg-white shadow-sm overflow-hidden">
          <CardContent className="p-4 sm:p-5 space-y-3.5">
            
            {/* 1. Giant Call 108 Ambulance Button */}
            <Button
              onClick={() => { window.location.href = "tel:108" }}
              className="w-full min-h-[4.5rem] py-3 px-4 text-xl sm:text-2xl bg-red-600 hover:bg-red-700 animate-pulse font-black text-white rounded-xl shadow-md whitespace-normal leading-tight flex items-center justify-center text-center"
            >
              <Phone className="mr-2.5 h-7 w-7 flex-shrink-0" />
              <span>{t.call108}</span>
            </Button>

            {/* 2. BUTTON 1: Distress SOS to 112 (Sends SMS with full medical info & GPS, no siren) */}
            <div className="space-y-1">
              <Button
                onClick={handleTriggerDistressSos}
                className="w-full min-h-[3.75rem] py-3 px-4 text-sm sm:text-base bg-red-950 hover:bg-black font-extrabold text-white rounded-xl shadow-md flex items-center justify-center text-center gap-2"
              >
                <ShieldAlert className="h-5 w-5 text-red-400 flex-shrink-0" />
                <span>{t.distressBtn}</span>
              </Button>
              <p className="text-[11px] text-gray-500 text-center leading-tight">
                {t.distressBtnSub}
              </p>
            </div>

            {/* 3. BUTTON 2: Alert Emergency Contacts (Sends to up to 3 contacts at once, normal SMS & test) */}
            <div className="space-y-1">
              <Button
                onClick={handleOpenContactAlert}
                className="w-full min-h-[3.75rem] py-3 px-4 text-sm sm:text-base bg-amber-600 hover:bg-amber-700 font-extrabold text-white rounded-xl shadow-md flex items-center justify-center text-center gap-2"
              >
                <Users className="h-5 w-5 flex-shrink-0" />
                <span>{t.contactBtn}</span>
              </Button>
              <p className="text-[11px] text-gray-500 text-center leading-tight">
                {t.contactBtnSub}
              </p>
            </div>

            {/* 4. Night SOS Screen Beacon & Siren Button (With looping voice alert) */}
            <Button
              variant="outline"
              className="w-full min-h-[3.75rem] py-3 px-3.5 flex items-center justify-start gap-3 font-semibold rounded-xl text-left bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
              onClick={() => {
                setStrobeActive(true)
                startAudioSiren()
                setSirenActive(true)
                const voiceMsg = getVoiceAlertMessage()
                startEmergencyVoiceLoop(voiceMsg, language === "hi" ? "hi" : "en")
                setVoiceLoopActiveState(true)
              }}
            >
              <Flashlight className="h-6 w-6 text-amber-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold truncate">{t.beaconBtn}</div>
                <div className="text-[11px] text-amber-700/90 font-normal line-clamp-1">{t.beaconBtnSub}</div>
              </div>
            </Button>

            {/* 5. Nearest Hospital Navigation */}
            <Button
              variant="outline"
              className="w-full min-h-[3.25rem] py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl border-gray-200 hover:bg-gray-50 flex items-center justify-center"
              onClick={() => router.push("/locations")}
            >
              <MapPin className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
              <span>{t.findHospital}</span>
            </Button>

            {/* 6. Visual First-Aid Guide */}
            <Button
              variant="outline"
              className="w-full min-h-[3.75rem] py-2.5 px-3.5 rounded-xl text-center bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              onClick={() => router.push("/health-info")}
            >
              <div className="flex flex-col items-center">
                <span className="flex items-center text-xs sm:text-sm font-bold">
                  <BookOpen className="mr-2 h-4 w-4 flex-shrink-0" /> {t.firstAid}
                </span>
                <span className="text-[11px] text-blue-600/90 font-normal mt-0.5">{t.firstAidSub}</span>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* ============================================================== */}
        {/* PERSONAL EMERGENCY VAULT (OFFLINE) WITH UP TO 3 CONTACTS       */}
        {/* ============================================================== */}
        <Card className="border-red-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="flex items-center text-red-700 text-base sm:text-lg">
                <HeartPulse className="h-5 w-5 mr-2 text-red-600 flex-shrink-0" />
                {t.vaultTitle}
              </CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">{t.vaultSubtitle}</p>
            </div>
            
            <Dialog open={isVaultOpen} onOpenChange={setIsVaultOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold">
                  {t.editVault}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-red-700 flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-red-600" />
                    {t.vaultTitle}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-3.5 py-2 text-xs sm:text-sm">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">{t.fullName}</label>
                      <Input
                        value={editingProfile.fullName}
                        onChange={(e) => setEditingProfile({ ...editingProfile, fullName: e.target.value })}
                        placeholder="Ramesh Kumar"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">{t.age}</label>
                      <Input
                        value={editingProfile.age}
                        onChange={(e) => setEditingProfile({ ...editingProfile, age: e.target.value })}
                        placeholder="45"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">{t.bloodGroup}</label>
                    <select
                      className="w-full border rounded-md p-2 text-xs sm:text-sm bg-white"
                      value={editingProfile.bloodGroup}
                      onChange={(e) => setEditingProfile({ ...editingProfile, bloodGroup: e.target.value })}
                    >
                      {["Unknown", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  {/* UP TO 3 EMERGENCY CONTACTS */}
                  <div className="space-y-2 p-3 bg-red-50/60 border border-red-200 rounded-xl">
                    <span className="text-xs font-bold text-red-900 block flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-red-600" />
                      {language === "en" ? "Emergency Contacts (Up to 3 People)" : "आपातकालीन संपर्क (अधिकतम 3 लोग)"}
                    </span>

                    <div>
                      <label className="text-[11px] font-semibold text-gray-700 block mb-1">{t.primaryContact}</label>
                      <Input
                        value={editingProfile.primaryEmergencyContact}
                        onChange={(e) => setEditingProfile({ ...editingProfile, primaryEmergencyContact: e.target.value })}
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-gray-700 block mb-1">{t.secondaryContact}</label>
                      <Input
                        value={editingProfile.secondaryEmergencyContact}
                        onChange={(e) => setEditingProfile({ ...editingProfile, secondaryEmergencyContact: e.target.value })}
                        placeholder="+91 91234 56789"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-gray-700 block mb-1">{t.tertiaryContact}</label>
                      <Input
                        value={editingProfile.tertiaryEmergencyContact || ""}
                        onChange={(e) => setEditingProfile({ ...editingProfile, tertiaryEmergencyContact: e.target.value })}
                        placeholder="+91 99887 76655"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">{t.chronicConditions}</label>
                    <Input
                      value={editingProfile.chronicConditions}
                      onChange={(e) => setEditingProfile({ ...editingProfile, chronicConditions: e.target.value })}
                      placeholder="Diabetes Type 2, Hypertension, Heart Patient"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">{t.allergies}</label>
                    <Input
                      value={editingProfile.severeAllergies}
                      onChange={(e) => setEditingProfile({ ...editingProfile, severeAllergies: e.target.value })}
                      placeholder="Penicillin, Sulfa drugs, Peanuts"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">{t.medications}</label>
                    <Input
                      value={editingProfile.currentMedications}
                      onChange={(e) => setEditingProfile({ ...editingProfile, currentMedications: e.target.value })}
                      placeholder="Metformin 500mg, Telmisartan 40mg"
                    />
                  </div>

                  {/* USER-DEFINED CUSTOM VOICE ALERT (Spoken Aloud in Loop During Distress) */}
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5">
                    <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Mic className="h-4 w-4 text-amber-700" />
                      {t.customVoiceLabel}
                    </label>
                    <Input
                      value={editingProfile.customVoiceAlert || ""}
                      onChange={(e) => setEditingProfile({ ...editingProfile, customVoiceAlert: e.target.value })}
                      placeholder={t.customVoicePlaceholder}
                      className="bg-white border-amber-300 text-xs sm:text-sm"
                    />
                    <p className="text-[11px] text-amber-800 leading-tight">
                      {t.customVoiceHint}
                    </p>
                  </div>

                  <Button onClick={handleSaveProfile} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold">
                    {language === "en" ? "Save Emergency Profile" : "आपातकालीन प्रोफाइल सुरक्षित करें"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <span className="text-gray-500 block text-[11px]">{t.fullName}</span>
                <span className="font-semibold text-gray-900">{profile.fullName || t.noneRecorded}</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <span className="text-gray-500 block text-[11px]">{t.bloodGroup}</span>
                <span className={`font-black ${profile.bloodGroup && profile.bloodGroup !== "Unknown" ? "text-red-700" : "text-gray-600"}`}>
                  {profile.bloodGroup || t.unknown}
                </span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <span className="text-gray-500 block text-[11px]">{t.chronicConditions}</span>
                <span className="font-medium text-gray-900">{profile.chronicConditions || t.noneRecorded}</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <span className="text-gray-500 block text-[11px]">{t.allergies}</span>
                <span className="font-medium text-red-600">{profile.severeAllergies || t.noneRecorded}</span>
              </div>
              
              {/* SAVED CONTACTS DISPLAY */}
              <div className="p-2.5 bg-gray-50 rounded-lg sm:col-span-2 space-y-1">
                <span className="text-gray-500 block text-[11px] font-semibold">
                  {language === "en" ? "Emergency Contacts (Up to 3):" : "आपातकालीन संपर्क (3 तक):"}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px]">
                  <div className="bg-white p-1.5 rounded border border-gray-200">
                    <span className="text-gray-400 block text-[10px]">#1 Primary</span>
                    <span className="font-semibold text-gray-900">{profile.primaryEmergencyContact || t.noneRecorded}</span>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-gray-200">
                    <span className="text-gray-400 block text-[10px]">#2 Secondary</span>
                    <span className="font-semibold text-gray-900">{profile.secondaryEmergencyContact || t.noneRecorded}</span>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-gray-200">
                    <span className="text-gray-400 block text-[10px]">#3 Tertiary</span>
                    <span className="font-semibold text-gray-900">{profile.tertiaryEmergencyContact || t.noneRecorded}</span>
                  </div>
                </div>
              </div>

              {profile.customVoiceAlert && (
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg sm:col-span-2">
                  <span className="text-amber-800 font-semibold block text-[11px] flex items-center gap-1">
                    <Mic className="h-3 w-3 text-amber-600" />
                    {t.customVoiceLabel}
                  </span>
                  <span className="font-medium text-amber-950 italic">"{profile.customVoiceAlert}"</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* DIALOG: Choose Contacts, Multi-Send Normal SMS & Test Mode */}
        <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-amber-700 flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-600" />
                {t.contactModalTitle}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3.5 py-1 text-xs sm:text-sm">
              <p className="text-xs text-gray-600">
                {t.contactModalDesc}
              </p>

              {/* Mode Selector Toggle: Emergency SOS vs Test Message */}
              <div className="flex items-center justify-between p-2 rounded-xl border bg-gray-50">
                <div className="flex items-center gap-2">
                  {isTestSmsMode ? (
                    <FlaskConical className="h-4 w-4 text-purple-600" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-xs font-bold ${isTestSmsMode ? "text-purple-700" : "text-red-700"}`}>
                    {isTestSmsMode ? t.testModeActive : t.emergencyModeActive}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTestSmsMode(!isTestSmsMode)}
                  className={`text-[11px] font-bold py-1 px-2.5 h-auto rounded-lg border ${
                    isTestSmsMode 
                      ? "border-red-400 text-red-700 bg-red-50 hover:bg-red-100" 
                      : "border-purple-400 text-purple-700 bg-purple-50 hover:bg-purple-100"
                  }`}
                >
                  {isTestSmsMode ? (language === "en" ? "Switch to SOS" : "एसओएस पर बदलें") : (language === "en" ? "Switch to Test" : "टेस्ट पर बदलें")}
                </Button>
              </div>

              {/* Contact Selection Checkboxes (Up to 3) */}
              <div className="space-y-2 p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                <div className="flex items-center justify-between pb-1 border-b border-amber-200/60">
                  <span className="text-[11px] font-bold text-amber-900">
                    {language === "en" ? "Select Recipients:" : "प्राप्तकर्ता चुनें:"}
                  </span>
                  <button
                    onClick={toggleSelectAllContacts}
                    className="text-[11px] font-semibold text-amber-800 underline hover:text-amber-950"
                  >
                    {selectedContactIds.length === savedContacts.length
                      ? (language === "en" ? "Deselect All" : "सभी हटाएं")
                      : (language === "en" ? "Select All (3)" : "सभी चुनें (3)")}
                  </button>
                </div>

                {savedContacts.map((contact) => {
                  const isSelected = selectedContactIds.includes(contact.id)
                  return (
                    <div
                      key={contact.id}
                      onClick={() => toggleContactSelection(contact.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${
                        isSelected 
                          ? "bg-amber-100/90 border-amber-400 text-amber-950" 
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-amber-700 flex-shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold text-xs block">{contact.label}</span>
                          <span className="font-mono text-[11px]">{contact.number}</span>
                        </div>
                      </div>

                      {/* 1-Tap Direct WhatsApp for this contact */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          sendWhatsAppToContact(contact.number)
                        }}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-1 rounded-md flex items-center gap-1"
                        title="Direct WhatsApp"
                      >
                        <MessageCircle className="h-3 w-3" />
                        <span>{t.waDirect}</span>
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Action Buttons: 1-Tap Normal SMS to All Selected */}
              <div className="space-y-2 pt-1">
                <Button
                  onClick={sendNormalSmsToSelected}
                  className={`w-full font-bold py-3 flex items-center justify-center gap-2 text-xs sm:text-sm rounded-xl shadow ${
                    isTestSmsMode 
                      ? "bg-purple-700 hover:bg-purple-800 text-white" 
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>
                    {isTestSmsMode 
                      ? `${t.sendTestSms} (${selectedContactIds.length})` 
                      : `${t.sendSmsAll} (${selectedContactIds.length})`}
                  </span>
                </Button>

                {/* Broadcast to multiple chats via Native WhatsApp Share */}
                <Button
                  onClick={shareToAllViaApps}
                  variant="outline"
                  className="w-full border-2 border-emerald-600 text-emerald-800 hover:bg-emerald-50 font-bold py-2.5 flex items-center justify-center gap-2 text-xs rounded-xl"
                >
                  <Share2 className="h-4 w-4 text-emerald-600" />
                  <span>{t.shareWaAll}</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ============================================================== */}
        {/* NATIONAL & STATE-WISE EMERGENCY HELPLINES DIRECTORY           */}
        {/* ============================================================== */}
        <HelplineDirectory language={language} initialCoords={lastCoords} />

        {/* Emergency First-Response Instructions */}
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center text-red-800">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-600 flex-shrink-0" />
              {t.instructionsTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[t.inst1, t.inst2, t.inst3, t.inst4, t.inst5].map((text, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-red-50/50 border border-red-100">
                  <span className="h-5 w-5 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs sm:text-sm text-gray-700 leading-snug">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ============================================================== */}
        {/* FULLSCREEN FLASHING STROBE BEACON WITH SIREN & VOICE CONTROLS */}
        {/* ============================================================== */}
        {strobeActive && (
          <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center transition-colors duration-100 ${
            strobeLightOn ? "bg-red-600 text-white" : "bg-black text-yellow-300"
          }`}>
            <div className="max-w-md w-full space-y-6">
              <div className="space-y-2">
                <Flashlight className="h-16 w-16 mx-auto animate-bounce text-yellow-300" />
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider">
                  {t.beaconActive}
                </h2>
                <p className="text-xs sm:text-sm opacity-90 max-w-sm mx-auto">
                  {language === "en"
                    ? "Audio siren, flashlight, and voice announcement are active. Display is kept at maximum visibility."
                    : "सायरन, फ्लैशलाइट और आवाज़ सक्रिय हैं। डिस्प्ले अधिकतम चमक पर चल रहा है।"}
                </p>
                {voiceLoopActiveState && (
                  <p className="text-xs bg-black/40 text-yellow-300 p-2 rounded-lg font-mono italic">
                    "{getVoiceAlertMessage()}"
                  </p>
                )}
              </div>

              {/* Hardware Toggles: Siren & Camera LED Flashlight */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleToggleSiren}
                  className={`font-bold py-3 text-xs sm:text-sm rounded-xl ${
                    sirenActive ? "bg-yellow-400 text-black hover:bg-yellow-300" : "bg-gray-800 text-white"
                  }`}
                >
                  {sirenActive ? <Volume2 className="mr-1.5 h-4 w-4" /> : <VolumeX className="mr-1.5 h-4 w-4" />}
                  <span>{sirenActive ? t.sirenOff : t.sirenOn}</span>
                </Button>

                <Button
                  onClick={handleToggleTorch}
                  className={`font-bold py-3 text-xs sm:text-sm rounded-xl ${
                    torchActive ? "bg-yellow-400 text-black hover:bg-yellow-300" : "bg-gray-800 text-white"
                  }`}
                >
                  <Flashlight className="mr-1.5 h-4 w-4" />
                  <span>{torchActive ? t.torchOff : t.torchOn}</span>
                </Button>
              </div>

              {/* Dismiss / Stop Everything Button */}
              <Button
                onClick={handleStopAllAlarms}
                className="w-full bg-white text-black hover:bg-gray-200 font-black text-lg py-4 rounded-xl shadow-2xl"
              >
                <X className="mr-2 h-6 w-6 text-red-600" />
                <span>{t.stopBeacon}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Floating Shake-to-SOS Confirmation Modal / Prompt */}
        {shakePromptOpen && (
          <div className="fixed inset-x-0 bottom-4 sm:bottom-6 z-50 px-4 flex justify-center animate-bounce-short">
            <div className="max-w-md w-full bg-red-950 text-white border-2 border-red-500 rounded-2xl p-4 shadow-2xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="h-6 w-6 text-red-400 animate-pulse flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {language === "en" ? "Shake Detected: Emergency Distress?" : "फोन झटका पहचाना गया: आपातकालीन अलर्ट?"}
                    </h4>
                    <p className="text-xs text-red-200 mt-0.5">
                      {language === "en" 
                        ? `Initiating Siren, Beacon & SOS Broadcast in ${shakeCountdown}s...` 
                        : `${shakeCountdown} सेकंड में सायरन, बीकन व एसओएस अलर्ट शुरू हो रहा है...`}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-black bg-red-800 text-white rounded-full h-7 w-7 flex items-center justify-center border border-red-400">
                  {shakeCountdown}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  onClick={handleCancelShakeDistress}
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 border-white/40 text-white font-bold text-xs py-2 h-auto rounded-xl"
                >
                  {language === "en" ? "Cancel (Accidental)" : "रद्द करें (गलती से हुआ)"}
                </Button>
                <Button
                  onClick={handleConfirmShakeDistress}
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2 h-auto rounded-xl shadow"
                >
                  {language === "en" ? "Send Now" : "अभी भेजें"}
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
