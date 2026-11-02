/**
 * components/emergency/hooks/use-beacon.ts
 *
 * Hardware beacon state and alarm coordination (torch, siren, strobe, screen wake lock).
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Emergency Subsystem
 */

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
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

interface UseBeaconOptions {
  language: string
}

export function useBeacon({ language }: UseBeaconOptions) {
  const { toast } = useToast()

  const [strobeActive, setStrobeActive] = useState(false)
  const [strobeLightOn, setStrobeLightOn] = useState(false)
  const [sirenActive, setSirenActive] = useState(false)
  const [torchActive, setTorchActive] = useState(false)
  const [voiceLoopActiveState, setVoiceLoopActiveState] = useState(false)

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

    const interval = setInterval(() => {
      setStrobeLightOn((prev) => !prev)
    }, 200)

    return () => clearInterval(interval)
  }, [strobeActive])

  const handleToggleSiren = () => {
    if (sirenActive) {
      stopAudioSiren()
      setSirenActive(false)
    } else {
      startAudioSiren()
      setSirenActive(true)
    }
  }

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
          variant: "destructive",
        })
      }
    }
  }

  const handleStopAllAlarms = useCallback(() => {
    setStrobeActive(false)
    stopAudioSiren()
    setSirenActive(false)
    stopEmergencyVoiceLoop()
    setVoiceLoopActiveState(false)
    toggleHardwareTorch(false)
    setTorchActive(false)
    releaseScreenWakeLock()
  }, [])

  const startBeacon = useCallback((voiceMsg: string) => {
    setStrobeActive(true)
    startAudioSiren()
    setSirenActive(true)
    toggleHardwareTorch(true).then((ok) => {
      if (ok) setTorchActive(true)
    })
    requestScreenWakeLock()
    startEmergencyVoiceLoop(voiceMsg, language === "hi" ? "hi" : "en")
    setVoiceLoopActiveState(true)
  }, [language])

  return {
    strobeActive,
    strobeLightOn,
    sirenActive,
    torchActive,
    voiceLoopActiveState,
    handleToggleSiren,
    handleToggleTorch,
    handleStopAllAlarms,
    startBeacon,
    setStrobeActive,
  }
}
