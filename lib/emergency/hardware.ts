/**
 * lib/emergency/hardware.ts
 *
 * Direct Hardware & Browser API controllers for emergency mobile scenarios:
 * 1. Physical Hardware Torch / Camera LED Flash (Android PWA MediaStreamTrack)
 * 2. Web Audio API synthesized Emergency Siren (Zero-byte offline sound generator)
 * 3. Screen Wake Lock (Keeps display at full brightness without sleep)
 * 4. Rhythmic Morse SOS Vibration
 */

let activeTorchTrack: MediaStreamTrack | null = null
let activeAudioCtx: AudioContext | null = null
let activeOscillator: OscillatorNode | null = null
let activeGainNode: GainNode | null = null
let sirenInterval: any = null
let activeWakeLock: any = null

/**
 * Toggle physical rear camera LED torch (flashlight).
 * Supported in Android Chrome/Edge/Samsung Internet PWAs.
 * Fails gracefully if permission is denied or device has no camera flash.
 */
export async function toggleHardwareTorch(turnOn: boolean): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return false
  }

  try {
    if (turnOn) {
      if (!activeTorchTrack) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        })
        activeTorchTrack = stream.getVideoTracks()[0] || null
      }

      if (activeTorchTrack) {
        // Apply torch constraint
        const capabilities = (activeTorchTrack as any).getCapabilities?.() || {}
        if ("torch" in capabilities || (activeTorchTrack as any).applyConstraints) {
          await (activeTorchTrack as any).applyConstraints({
            advanced: [{ torch: true }]
          })
          return true
        }
      }
    } else {
      if (activeTorchTrack) {
        try {
          await (activeTorchTrack as any).applyConstraints({
            advanced: [{ torch: false }]
          })
        } catch {}
        activeTorchTrack.stop()
        activeTorchTrack = null
      }
      return false
    }
  } catch (err) {
    console.warn("[HardwareTorch] Torch not supported or permission denied:", err)
    if (activeTorchTrack) {
      activeTorchTrack.stop()
      activeTorchTrack = null
    }
    return false
  }

  return false
}

/**
 * Synthesizes a loud, piercing emergency siren via Web Audio API.
 * Uses 0 bytes of external assets, operates 100% offline.
 */
export function startAudioSiren(): boolean {
  if (typeof window === "undefined") return false
  if (activeAudioCtx) return true // Already running

  try {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtxClass) return false

    activeAudioCtx = new AudioCtxClass()

    if (activeAudioCtx.state === "suspended") {
      activeAudioCtx.resume().catch(() => {})
    }

    activeOscillator = activeAudioCtx.createOscillator()
    activeGainNode = activeAudioCtx.createGain()

    // Sawtooth wave sounds sharp and piercing like an emergency beacon
    activeOscillator.type = "sawtooth"
    activeOscillator.frequency.setValueAtTime(650, activeAudioCtx.currentTime)

    // Volume modulation
    activeGainNode.gain.setValueAtTime(0.85, activeAudioCtx.currentTime)

    activeOscillator.connect(activeGainNode)
    activeGainNode.connect(activeAudioCtx.destination)

    activeOscillator.start()

    // Alternate frequency between 650Hz and 1150Hz ("wee-woo" siren)
    let pitchUp = true
    sirenInterval = setInterval(() => {
      if (!activeOscillator || !activeAudioCtx) return
      pitchUp = !pitchUp
      const targetFreq = pitchUp ? 1150 : 650
      try {
        activeOscillator.frequency.linearRampToValueAtTime(
          targetFreq,
          activeAudioCtx.currentTime + 0.25
        )
      } catch {}
    }, 280)

    return true
  } catch (err) {
    console.warn("[AudioSiren] Could not initialize Web Audio siren:", err)
    stopAudioSiren()
    return false
  }
}

/**
 * Stop active audio siren
 */
export function stopAudioSiren(): void {
  if (sirenInterval) {
    clearInterval(sirenInterval)
    sirenInterval = null
  }
  if (activeOscillator) {
    try {
      activeOscillator.stop()
      activeOscillator.disconnect()
    } catch {}
    activeOscillator = null
  }
  if (activeGainNode) {
    try { activeGainNode.disconnect() } catch {}
    activeGainNode = null
  }
  if (activeAudioCtx) {
    try { activeAudioCtx.close() } catch {}
    activeAudioCtx = null
  }
}

/**
 * Request Screen Wake Lock so phone screen doesn't dim or turn off during emergency
 */
export async function requestScreenWakeLock(): Promise<boolean> {
  if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return false

  try {
    activeWakeLock = await (navigator as any).wakeLock.request("screen")
    return true
  } catch {
    return false
  }
}

/**
 * Release active screen wake lock
 */
export function releaseScreenWakeLock(): void {
  if (activeWakeLock) {
    try {
      activeWakeLock.release()
    } catch {}
    activeWakeLock = null
  }
}
