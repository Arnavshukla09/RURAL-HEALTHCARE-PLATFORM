/**
 * components/emergency/hooks/use-beacon.ts
 *
 * Hardware beacon state and alarm coordination (torch, siren, strobe, screen wake lock).
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Emergency Subsystem
 */

import { useState, useEffect, useCallback, useRef } from "react"
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
  const mounted = useRef(true)
  const generation = useRef(0)
  const torchGeneration = useRef(0)
  const releaseResources = useCallback(() => {
    generation.current++
    torchGeneration.current++
    stopAudioSiren()
    stopEmergencyVoiceLoop()
    toggleHardwareTorch(false).catch(() => {})
    releaseScreenWakeLock()
  }, [])
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; releaseResources() }
  }, [releaseResources])
  useEffect(() => {
    const handler = (event: Event) => { if (mounted.current) setVoiceLoopActiveState(Boolean((event as CustomEvent).detail?.active)) }
    window.addEventListener("rhcp:emergency-beacon", handler)
    return () => window.removeEventListener("rhcp:emergency-beacon", handler)
  }, [])

  useEffect(() => {
    if (!strobeActive) {
      releaseResources()
      setSirenActive(false)
      setVoiceLoopActiveState(false)
      setTorchActive(false)
      return
    }

    const interval = setInterval(() => {
      setStrobeLightOn((prev) => !prev)
    }, 200)

    return () => { clearInterval(interval); releaseResources() }
  }, [strobeActive, releaseResources])

  const handleToggleSiren = () => {
    if (sirenActive) {
      stopAudioSiren()
      setSirenActive(false)
    } else {
      setSirenActive(startAudioSiren())
    }
  }

  const handleToggleTorch = async () => {
    const currentGeneration = generation.current
    const currentTorchGeneration = ++torchGeneration.current
    if (torchActive) {
      await toggleHardwareTorch(false)
      if (mounted.current && currentGeneration === generation.current && currentTorchGeneration === torchGeneration.current) setTorchActive(false)
    } else {
      const enabled = await toggleHardwareTorch(true)
      if (!mounted.current || currentGeneration !== generation.current || currentTorchGeneration !== torchGeneration.current) return
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
    releaseResources()
    setStrobeActive(false)
    setStrobeLightOn(false)
    setSirenActive(false)
    setVoiceLoopActiveState(false)
    setTorchActive(false)
  }, [releaseResources])

  useEffect(() => { handleStopAllAlarms() }, [language, handleStopAllAlarms])

  const startBeacon = useCallback((voiceMsg: string) => {
    if (!mounted.current) return
    releaseResources()
    const currentGeneration = generation.current
    setStrobeActive(true)
    setSirenActive(startAudioSiren())
    toggleHardwareTorch(true).then((ok) => {
      if (ok && mounted.current && currentGeneration === generation.current) setTorchActive(true)
    }).catch(() => {})
    requestScreenWakeLock().catch(() => {})
    startEmergencyVoiceLoop(voiceMsg, language)
  }, [language, releaseResources])

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
