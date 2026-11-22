import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const speech = vi.hoisted(() => ({ speak: vi.fn(), stop: vi.fn() }))
vi.mock("@/lib/ai/speech", () => ({ speak: speech.speak, stopSpeaking: speech.stop, getSpeechLangFromCode: (language: string) => `${language}-IN` }))

import { startEmergencyVoiceLoop, stopEmergencyVoiceLoop, vocalizeEmergencyMessage } from "@/lib/emergency/audio-blackbox"
import { releaseScreenWakeLock, requestScreenWakeLock, toggleHardwareTorch } from "@/lib/emergency/hardware"

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

function media() {
  const video = { stop: vi.fn(), applyConstraints: vi.fn(async () => {}) }
  const other = { stop: vi.fn() }
  const stream = { getVideoTracks: () => [video], getTracks: () => [video, other] }
  return { video, other, stream: stream as unknown as MediaStream }
}

beforeEach(() => {
  vi.useFakeTimers()
  speech.speak.mockReset(); speech.stop.mockReset()
  const target = new EventTarget()
  vi.stubGlobal("window", Object.assign(target, { speechSynthesis: { cancel: vi.fn() } }))
  vi.stubGlobal("navigator", { onLine: true })
})
afterEach(async () => {
  stopEmergencyVoiceLoop(); releaseScreenWakeLock(); await toggleHardwareTorch(false)
  vi.unstubAllGlobals(); vi.useRealTimers()
})

describe("Emergency speech loop cancellation", () => {
  it("cannot resurrect a stopped loop or let an old callback stop its replacement", () => {
    startEmergencyVoiceLoop("First alert", "en")
    const old = speech.speak.mock.calls[0][1]
    stopEmergencyVoiceLoop()
    startEmergencyVoiceLoop("Replacement alert", "hi")
    const replacement = speech.speak.mock.calls[1][1]
    old.onEnd(); old.onError()
    vi.advanceTimersByTime(5000)
    expect(speech.speak).toHaveBeenCalledTimes(2)
    replacement.onEnd()
    vi.advanceTimersByTime(1200)
    expect(speech.speak).toHaveBeenCalledTimes(3)
    expect(speech.speak.mock.calls[2][0]).toBe("Replacement alert")
  })

  it("clears scheduled repetition and delayed native voice discovery when stopped", async () => {
    const actual = await vi.importActual<typeof import("@/lib/ai/speech")>("@/lib/ai/speech")
    const target = new EventTarget()
    const synthesis = { cancel: vi.fn(), getVoices: () => [], speak: vi.fn(), addEventListener: target.addEventListener.bind(target), removeEventListener: target.removeEventListener.bind(target) }
    vi.stubGlobal("window", Object.assign(new EventTarget(), { speechSynthesis: synthesis }))
    vi.stubGlobal("SpeechSynthesisUtterance", class { constructor(public text: string) {} })
    speech.stop.mockImplementation(actual.stopSpeaking)
    speech.speak.mockImplementation(actual.speak)
    startEmergencyVoiceLoop("Pending voice", "en")
    stopEmergencyVoiceLoop()
    target.dispatchEvent(new Event("voiceschanged"))
    vi.advanceTimersByTime(5000)
    expect(synthesis.speak).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it("a one-shot alert replaces the loop rather than allowing its old timer to interrupt", () => {
    startEmergencyVoiceLoop("Loop", "en")
    const old = speech.speak.mock.calls[0][1]
    old.onEnd()
    vocalizeEmergencyMessage("One shot", "en")
    vi.advanceTimersByTime(5000)
    expect(speech.speak).toHaveBeenCalledTimes(2)
    expect(speech.speak.mock.calls[1][0]).toBe("One shot")
    expect(vi.getTimerCount()).toBe(0)
  })

  it("an empty restart stops the preceding loop", () => {
    startEmergencyVoiceLoop("Old alert", "en")
    speech.speak.mock.calls[0][1].onEnd()
    startEmergencyVoiceLoop(" ", "en")
    vi.advanceTimersByTime(5000)
    expect(speech.speak).toHaveBeenCalledTimes(1)
  })
})

describe("Late emergency hardware permissions", () => {
  it("stops every track acquired after torch cancellation", async () => {
    const permission = deferred<MediaStream>()
    const capture = media()
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: vi.fn(() => permission.promise) } })
    const enable = toggleHardwareTorch(true)
    await toggleHardwareTorch(false)
    permission.resolve(capture.stream)
    expect(await enable).toBe(false)
    expect(capture.video.stop).toHaveBeenCalledTimes(1)
    expect(capture.other.stop).toHaveBeenCalledTimes(1)
    expect(capture.video.applyConstraints).not.toHaveBeenCalled()
  })

  it("does not let a late old camera permission replace or stop a newer torch", async () => {
    const first = deferred<MediaStream>(), second = deferred<MediaStream>()
    const oldCapture = media(), newCapture = media()
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise) } })
    const oldEnable = toggleHardwareTorch(true), newEnable = toggleHardwareTorch(true)
    second.resolve(newCapture.stream)
    expect(await newEnable).toBe(true)
    first.resolve(oldCapture.stream)
    expect(await oldEnable).toBe(false)
    expect(oldCapture.video.stop).toHaveBeenCalledTimes(1)
    expect(newCapture.video.stop).not.toHaveBeenCalled()
    await toggleHardwareTorch(false)
    expect(newCapture.video.stop).toHaveBeenCalledTimes(1)
  })

  it("releases a camera immediately even when the torch constraint request is still pending", async () => {
    const applied = deferred<void>()
    const capture = media()
    capture.video.applyConstraints.mockImplementation(() => applied.promise)
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: vi.fn(async () => capture.stream) } })
    const enabling = toggleHardwareTorch(true)
    await Promise.resolve()
    expect(await toggleHardwareTorch(false)).toBe(false)
    expect(capture.video.stop).toHaveBeenCalledTimes(1)
    applied.resolve()
    expect(await enabling).toBe(false)
  })

  it("releases a wake lock returned after cancellation and preserves a newer lock", async () => {
    const first = deferred<any>(), second = deferred<any>()
    const oldLock = { release: vi.fn(async () => {}) }, newLock = { release: vi.fn(async () => {}) }
    vi.stubGlobal("navigator", { wakeLock: { request: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise) } })
    const oldRequest = requestScreenWakeLock()
    releaseScreenWakeLock()
    const newRequest = requestScreenWakeLock()
    second.resolve(newLock)
    expect(await newRequest).toBe(true)
    first.resolve(oldLock)
    expect(await oldRequest).toBe(false)
    expect(oldLock.release).toHaveBeenCalledTimes(1)
    expect(newLock.release).not.toHaveBeenCalled()
    releaseScreenWakeLock()
    expect(newLock.release).toHaveBeenCalledTimes(1)
  })
})
