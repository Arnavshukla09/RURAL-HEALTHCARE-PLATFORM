/**
 * lib/emergency/audio-blackbox.ts
 *
 * Offline Emergency Incident Blackbox Audio Recorder & Voice Synthesizer.
 * - Records emergency ambient audio via MediaRecorder API directly to device IndexedDB.
 * - 100% offline, $0 cost, operates without any backend or cloud upload.
 * - Provides SpeechSynthesis vocalizer for patients who cannot speak.
 */

export interface IncidentRecording {
  id: string
  timestamp: number
  durationSeconds: number
  audioBlob: Blob
  coords?: { lat: number; lng: number }
  notes?: string
}

const DB_NAME = "ruralhealth_blackbox_db"
const STORE_NAME = "incident_audio"
const DB_VERSION = 1

function openBlackboxDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      return reject(new Error("IndexedDB not supported"))
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveIncidentAudio(rec: IncidentRecording): Promise<void> {
  try {
    const db = await openBlackboxDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      tx.objectStore(STORE_NAME).put(rec)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.warn("[Blackbox] Could not save incident audio locally:", err)
  }
}

export async function getIncidentRecordings(): Promise<IncidentRecording[]> {
  try {
    const db = await openBlackboxDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const req = tx.objectStore(STORE_NAME).getAll()
      req.onsuccess = () => {
        const sorted = (req.result || []).sort((a, b) => b.timestamp - a.timestamp)
        resolve(sorted)
      }
      req.onerror = () => reject(req.error)
    })
  } catch {
    return []
  }
}

let activeMediaRecorder: MediaRecorder | null = null
let activeAudioStream: MediaStream | null = null
let recordedChunks: Blob[] = []
let recordingStartTime = 0

/**
 * Starts offline audio recording of the emergency incident
 */
export async function startIncidentRecording(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return false
  }

  try {
    activeAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recordedChunks = []
    recordingStartTime = Date.now()

    activeMediaRecorder = new MediaRecorder(activeAudioStream)
    activeMediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data)
      }
    }

    activeMediaRecorder.start(1000) // 1s slices
    return true
  } catch (err) {
    console.warn("[Blackbox] Microphone access denied or unsupported:", err)
    stopIncidentRecording()
    return false
  }
}

/**
 * Stops offline incident recording and saves to local IndexedDB
 */
export async function stopIncidentRecording(coords?: { lat: number; lng: number }): Promise<IncidentRecording | null> {
  const recorder = activeMediaRecorder
  if (!recorder) return null

  return new Promise((resolve) => {
    recorder.onstop = async () => {
      const audioBlob = new Blob(recordedChunks, { type: "audio/webm" })
      const durationSeconds = Math.round((Date.now() - recordingStartTime) / 1000)

      const record: IncidentRecording = {
        id: `inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: recordingStartTime,
        durationSeconds,
        audioBlob,
        coords,
      }

      await saveIncidentAudio(record)

      if (activeAudioStream) {
        activeAudioStream.getTracks().forEach((t) => t.stop())
        activeAudioStream = null
      }
      activeMediaRecorder = null
      recordedChunks = []

      resolve(record)
    }

    try {
      recorder.stop()
    } catch {
      resolve(null)
    }
  })
}

/**
 * Speak aloud an urgent message for patients who cannot speak
 */
export function vocalizeEmergencyMessage(text: string, lang: "en" | "hi" = "hi"): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return

  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === "hi" ? "hi-IN" : "en-IN"
    utterance.rate = 0.95
    utterance.pitch = 1.05
    utterance.volume = 1.0
    window.speechSynthesis.speak(utterance)
  } catch (err) {
    console.warn("[Vocalizer] Speech synthesis failed:", err)
  }
}
