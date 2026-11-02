"use client"

/**
 * components/emergency/index.tsx
 *
 * Emergency Services, Personal Emergency Vault, and Lifeline Helplines module.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Emergency Subsystem
 */

import { useState, useEffect, useCallback } from "react"
import { Smartphone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  getEmergencyProfile,
  saveEmergencyProfile,
  triggerSosVibration,
  DEFAULT_PROFILE,
  EmergencyProfile,
} from "@/lib/emergency/vault"
import { HelplineDirectory } from "@/components/HelplineDirectory"
import { triggerEmergencyAlert } from "@/lib/notifications/notification-engine"
import type { EmergencyModuleProps } from "./types"
import { EMERGENCY_CONTENT } from "./content"
import { EmergencyVaultModal } from "./parts/EmergencyVaultModal"
import { EmergencyContactsModal } from "./parts/EmergencyContactsModal"
import { StrobeBeaconOverlay } from "./parts/StrobeBeaconOverlay"
import { ShakeDistressPrompt } from "./parts/ShakeDistressPrompt"
import { EmergencyPrimaryActions } from "./parts/EmergencyPrimaryActions"
import { EmergencyVaultSummary } from "./parts/EmergencyVaultSummary"
import { FirstResponseInstructions } from "./parts/FirstResponseInstructions"
import {
  getVoiceAlertMessage,
  buildCompleteSosMessage,
  buildTestSosMessage,
} from "./helpers"
import { useShakeSos } from "./hooks/use-shake-sos"
import { useBeacon } from "./hooks/use-beacon"

export function EmergencyModule({ language }: EmergencyModuleProps) {
  const { toast } = useToast()

  const [profile, setProfile] = useState<EmergencyProfile>(DEFAULT_PROFILE)
  const [editingProfile, setEditingProfile] = useState<EmergencyProfile>(DEFAULT_PROFILE)
  const [isVaultOpen, setIsVaultOpen] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([1, 2, 3])
  const [isTestSmsMode, setIsTestSmsMode] = useState(false)
  const [shakeActive] = useState(true)
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | undefined>()

  const {
    strobeActive,
    strobeLightOn,
    sirenActive,
    torchActive,
    voiceLoopActiveState,
    handleToggleSiren,
    handleToggleTorch,
    handleStopAllAlarms,
    startBeacon,
  } = useBeacon({ language })

  useEffect(() => {
    const loaded = getEmergencyProfile()
    setProfile(loaded)
    setEditingProfile(loaded)

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLastCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 4000, enableHighAccuracy: true }
      )
    }
  }, [])

  const savedContacts = [
    { id: 1, label: language === "en" ? "Contact 1 (Primary)" : "संपर्क 1 (प्राथमिक)", number: profile.primaryEmergencyContact },
    { id: 2, label: language === "en" ? "Contact 2" : "संपर्क 2", number: profile.secondaryEmergencyContact },
    { id: 3, label: language === "en" ? "Contact 3" : "संपर्क 3", number: profile.tertiaryEmergencyContact || "" },
  ].filter((c) => Boolean(c.number && c.number.trim()))

  const handleTriggerDistressSos = async () => {
    triggerSosVibration()

    const sendSmsTo112 = (coords?: { lat: number; lng: number }) => {
      const body = buildCompleteSosMessage(profile, coords)
      const encoded = encodeURIComponent(body)
      triggerEmergencyAlert({
        coords,
        locationText: profile.fullName ? `${profile.fullName} (112 Distress Call)` : "112 Emergency Distress",
      })
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

  const handleTriggerShakeBroadcast = useCallback(async () => {
    triggerSosVibration()
    const voiceMsg = getVoiceAlertMessage(profile, language)
    startBeacon(voiceMsg)

    const sendSmsBroadcast = (coords?: { lat: number; lng: number }) => {
      const body = buildCompleteSosMessage(profile, coords)
      const encoded = encodeURIComponent(body)
      triggerEmergencyAlert({
        coords,
        locationText: profile.fullName ? `${profile.fullName} (SOS Beacon Broadcast)` : "Emergency SOS Beacon Broadcast",
      })

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
  }, [profile, language, lastCoords, startBeacon])

  const { shakePromptOpen, shakeCountdown, cancelShake, confirmShake } = useShakeSos({
    enabled: shakeActive,
    onTrigger: handleTriggerShakeBroadcast,
  })

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
    setSelectedContactIds(savedContacts.map((c) => c.id))
    setIsTestSmsMode(false)
    setIsContactModalOpen(true)
  }

  const toggleContactSelection = (id: number) => {
    setSelectedContactIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleSelectAllContacts = () => {
    if (selectedContactIds.length === savedContacts.length) {
      setSelectedContactIds([])
    } else {
      setSelectedContactIds(savedContacts.map((c) => c.id))
    }
  }

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
    const message = isTestSmsMode ? buildTestSosMessage(profile, lastCoords) : buildCompleteSosMessage(profile, lastCoords)
    window.location.href = `sms:${recipients.join(",")}?body=${encodeURIComponent(message)}`
    setIsContactModalOpen(false)
  }

  const sendWhatsAppToContact = (rawNumber: string) => {
    const cleaned = rawNumber.replace(/[^0-9]/g, "")
    const targetPhone = cleaned.length === 10 ? `91${cleaned}` : cleaned
    const waBase = targetPhone ? `https://wa.me/${targetPhone}` : "https://wa.me/"
    const message = isTestSmsMode ? buildTestSosMessage(profile, lastCoords) : buildCompleteSosMessage(profile, lastCoords)
    window.open(`${waBase}?text=${encodeURIComponent(message)}`, "_blank")
  }

  const shareToAllViaApps = () => {
    const message = isTestSmsMode ? buildTestSosMessage(profile, lastCoords) : buildCompleteSosMessage(profile, lastCoords)
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

  const handleSaveProfile = () => {
    const updated = saveEmergencyProfile(editingProfile)
    setProfile(updated)
    setIsVaultOpen(false)
    toast({
      title: language === "en" ? "Profile saved successfully!" : "प्रोफ़ाइल सफलतापूर्वक सुरक्षित हो गई!",
    })
  }

  const t = EMERGENCY_CONTENT[language as keyof typeof EMERGENCY_CONTENT] || EMERGENCY_CONTENT.en

  return (
    <div className="min-h-screen bg-red-50 text-gray-900 p-3 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5 overflow-hidden">
        {/* Top Header */}
        <div className="pt-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-red-700">{t.title}</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">{t.subtitle}</p>
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
        <EmergencyPrimaryActions
          language={language}
          t={t}
          onTriggerDistressSos={handleTriggerDistressSos}
          onOpenContactAlert={handleOpenContactAlert}
          onStartBeacon={() => {
            const voiceMsg = getVoiceAlertMessage(profile, language)
            startBeacon(voiceMsg)
          }}
        />

        {/* Personal Emergency Vault Card */}
        <EmergencyVaultSummary
          profile={profile}
          language={language}
          t={t}
          onOpenVault={() => setIsVaultOpen(true)}
        />

        {/* Emergency Vault Dialog */}
        <EmergencyVaultModal
          isOpen={isVaultOpen}
          onOpenChange={setIsVaultOpen}
          editingProfile={editingProfile}
          setEditingProfile={setEditingProfile}
          onSave={handleSaveProfile}
          language={language}
          t={t}
        />

        {/* Contacts Dispatch Dialog */}
        <EmergencyContactsModal
          isOpen={isContactModalOpen}
          onOpenChange={setIsContactModalOpen}
          savedContacts={savedContacts}
          selectedContactIds={selectedContactIds}
          isTestSmsMode={isTestSmsMode}
          setIsTestSmsMode={setIsTestSmsMode}
          onToggleContactSelection={toggleContactSelection}
          onToggleSelectAll={toggleSelectAllContacts}
          onSendNormalSms={sendNormalSmsToSelected}
          onSendWhatsApp={sendWhatsAppToContact}
          onShareViaApps={shareToAllViaApps}
          language={language}
          t={t}
        />

        {/* National & State Helplines Directory */}
        <HelplineDirectory language={language} initialCoords={lastCoords} />

        {/* First-Response Instructions */}
        <FirstResponseInstructions t={t} />

        {/* Fullscreen Strobe Beacon Overlay */}
        {strobeActive && (
          <StrobeBeaconOverlay
            strobeLightOn={strobeLightOn}
            sirenActive={sirenActive}
            torchActive={torchActive}
            voiceLoopActiveState={voiceLoopActiveState}
            voiceAlertMessage={getVoiceAlertMessage(profile, language)}
            onToggleSiren={handleToggleSiren}
            onToggleTorch={handleToggleTorch}
            onStopAllAlarms={handleStopAllAlarms}
            language={language}
            t={t}
          />
        )}

        {/* Shake-to-SOS Prompt */}
        <ShakeDistressPrompt
          isOpen={shakePromptOpen}
          shakeCountdown={shakeCountdown}
          onCancel={() => {
            cancelShake()
            toast({
              title: language === "en" ? "Emergency alert cancelled" : "आपातकालीन अलर्ट रद्द किया गया",
              description: language === "en" ? "Accidental shake detected and rejected." : "आकस्मिक झटका रद्द कर दिया गया।",
            })
          }}
          onConfirm={confirmShake}
          language={language}
        />
      </div>
    </div>
  )
}

export default EmergencyModule
