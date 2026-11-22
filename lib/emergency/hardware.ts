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
let activeTorchStream: MediaStream | null = null
let torchGeneration = 0
let activeAudioCtx: AudioContext | null = null
let activeOscillator: OscillatorNode | null = null
let activeGainNode: GainNode | null = null
let sirenInterval: any = null
let activeWakeLock: any = null
let wakeLockGeneration = 0

/**
 * Toggle physical rear camera LED torch (flashlight).
 * Supported in Android Chrome/Edge/Samsung Internet PWAs.
 * Fails gracefully if permission is denied or device has no camera flash.
 */
export async function toggleHardwareTorch(turnOn: boolean): Promise<boolean> {
  const generation = ++torchGeneration
  if (!turnOn) {
    const track = activeTorchTrack
    const stream = activeTorchStream
    activeTorchTrack = null
    activeTorchStream = null
    if (track) try { Promise.resolve(track.applyConstraints({ advanced: [{ torch: false } as MediaTrackConstraintSet] })).catch(() => {}) } catch {}
    stream?.getTracks().forEach((item) => item.stop())
    if (!stream) track?.stop()
    return false
  }
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return false
  }

  let acquired: MediaStream | null = null
  try {
    if (!activeTorchTrack) {
      acquired = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      if (generation !== torchGeneration) { acquired.getTracks().forEach((track) => track.stop()); return false }
      activeTorchStream = acquired
      activeTorchTrack = acquired.getVideoTracks()[0] || null
    }
    const track = activeTorchTrack
    if (!track) { acquired?.getTracks().forEach((item) => item.stop()); activeTorchStream = null; return false }
    await track.applyConstraints({ advanced: [{ torch: true } as MediaTrackConstraintSet] })
    return generation === torchGeneration && activeTorchTrack === track
  } catch (err) {
    console.warn("[HardwareTorch] Torch not supported or permission denied:", err)
    if (generation === torchGeneration) {
      activeTorchStream?.getTracks().forEach((track) => track.stop())
      if (!activeTorchStream) activeTorchTrack?.stop()
      activeTorchTrack = null
      activeTorchStream = null
    } else if (acquired && acquired !== activeTorchStream) acquired.getTracks().forEach((track) => track.stop())
    return false
  }
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
    try { activeAudioCtx.close().catch(() => {}) } catch {}
    activeAudioCtx = null
  }
}

/**
 * Request Screen Wake Lock so phone screen doesn't dim or turn off during emergency
 */
export async function requestScreenWakeLock(): Promise<boolean> {
  releaseScreenWakeLock()
  const generation = ++wakeLockGeneration
  if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return false

  try {
    const lock = await (navigator as any).wakeLock.request("screen")
    if (generation !== wakeLockGeneration) { await lock.release(); return false }
    activeWakeLock = lock
    return true
  } catch {
    return false
  }
}

/**
 * Release active screen wake lock
 */
export function releaseScreenWakeLock(): void {
  wakeLockGeneration++
  if (activeWakeLock) {
    try {
      Promise.resolve(activeWakeLock.release()).catch(() => {})
    } catch {}
    activeWakeLock = null
  }
}
