/**
 * components/emergency/hooks/use-shake-sos.ts
 *
 * Hardware accelerometer shake-to-distress detector and countdown hook.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Emergency Subsystem
 */

import { useState, useEffect } from "react"
import { triggerSosVibration } from "@/lib/emergency/vault"

interface UseShakeSosOptions {
  enabled: boolean
  onTrigger: () => void
}

export function useShakeSos({ enabled, onTrigger }: UseShakeSosOptions) {
  const [shakePromptOpen, setShakePromptOpen] = useState(false)
  const [shakeCountdown, setShakeCountdown] = useState(5)

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return

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
  }, [enabled])

  useEffect(() => {
    if (!shakePromptOpen) return
    if (shakeCountdown <= 0) {
      setShakePromptOpen(false)
      onTrigger()
      return
    }
    const timer = setTimeout(() => {
      setShakeCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [shakePromptOpen, shakeCountdown, onTrigger])

  const cancelShake = () => {
    setShakePromptOpen(false)
    setShakeCountdown(5)
  }

  const confirmShake = () => {
    setShakePromptOpen(false)
    setShakeCountdown(5)
    onTrigger()
  }

  return {
    shakePromptOpen,
    shakeCountdown,
    cancelShake,
    confirmShake,
  }
}
