import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { startAudioRecording } from "@/lib/voice/audio-recording"

describe("Voice recorder microphone lifecycle", () => {
  let stopTrack: ReturnType<typeof vi.fn>
  let resume: ReturnType<typeof vi.fn>
  let close: ReturnType<typeof vi.fn>
  let source: { connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }
  let processor: { connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; onaudioprocess: ((event: any) => void) | null }
  let stream: { getTracks: () => { stop: ReturnType<typeof vi.fn> }[] }
  beforeEach(() => {
    vi.useFakeTimers()
    stopTrack = vi.fn(); resume = vi.fn().mockResolvedValue(undefined); close = vi.fn().mockResolvedValue(undefined)
    source = { connect: vi.fn(), disconnect: vi.fn() }
    processor = { connect: vi.fn(), disconnect: vi.fn(), onaudioprocess: null }
    stream = { getTracks: () => [{ stop: stopTrack }] }
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(stream) } })
    vi.stubGlobal("AudioContext", class {
      sampleRate = 48000
      destination = {}
      resume = resume
      close = close
      createMediaStreamSource = () => source
      createScriptProcessor = () => processor
    })
  })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

  it("releases permission granted after the voice session was stopped", async () => {
    let grant!: (value: MediaStream) => void
    vi.mocked(navigator.mediaDevices.getUserMedia).mockImplementation(() => new Promise(resolve => { grant = resolve }))
    const controller = new AbortController()
    const pending = startAudioRecording(vi.fn(), vi.fn(), controller.signal)
    controller.abort(); grant(stream as unknown as MediaStream)
    await expect(pending).rejects.toMatchObject({ name: "AbortError" })
    expect(stopTrack).toHaveBeenCalledOnce()
    expect(resume).not.toHaveBeenCalled()
  })

  it("releases the microphone when the audio device cannot initialize", async () => {
    resume.mockRejectedValue(new Error("Audio device unavailable"))
    await expect(startAudioRecording(vi.fn(), vi.fn())).rejects.toThrow("Audio device unavailable")
    expect(stopTrack).toHaveBeenCalledOnce()
    expect(close).toHaveBeenCalledOnce()
  })

  it("releases the microphone immediately while audio startup is pending", async () => {
    let ready!: () => void
    resume.mockImplementation(() => new Promise<void>(resolve => { ready = resolve }))
    const controller = new AbortController()
    const pending = startAudioRecording(vi.fn(), vi.fn(), controller.signal)
    await Promise.resolve()
    controller.abort()
    expect(stopTrack).toHaveBeenCalledOnce()
    expect(close).toHaveBeenCalledOnce()
    ready()
    await expect(pending).rejects.toMatchObject({ name: "AbortError" })
  })

  it("cancels without transmitting captured audio or reviving a timeout", async () => {
    const completed = vi.fn(); const error = vi.fn()
    const recording = await startAudioRecording(completed, error)
    processor.onaudioprocess?.({ inputBuffer: { getChannelData: () => new Float32Array(4096).fill(0.1) } })
    recording.cancel(); recording.cancel()
    vi.advanceTimersByTime(30000)
    expect(completed).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    expect(stopTrack).toHaveBeenCalledOnce()
    expect(source.disconnect).toHaveBeenCalledOnce()
    expect(processor.disconnect).toHaveBeenCalledOnce()
  })
})
