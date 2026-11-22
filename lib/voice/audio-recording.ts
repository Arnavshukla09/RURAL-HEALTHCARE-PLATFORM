/** Small PCM-WAV recorder; no codec/model download and no microphone without an explicit call. */
export async function startAudioRecording(onComplete: (audio: Blob) => void, onError: () => void, signal?: AbortSignal) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false })
  const stopTracks = () => stream.getTracks().forEach(track => track.stop())
  if (signal?.aborted) { stopTracks(); throw new DOMException("Recording cancelled", "AbortError") }
  let context: AudioContext
  try { context = new AudioContext() }
  catch (error) { stopTracks(); throw error }
  let source: MediaStreamAudioSourceNode | undefined
  let processor: ScriptProcessorNode | undefined
  const abortStartup = () => { stopTracks(); context.close().catch(() => {}) }
  signal?.addEventListener("abort", abortStartup, { once: true })
  try {
    await context.resume()
    if (signal?.aborted) throw new DOMException("Recording cancelled", "AbortError")
    source = context.createMediaStreamSource(stream)
    processor = context.createScriptProcessor(4096, 1, 1)
  } catch (error) {
    signal?.removeEventListener("abort", abortStartup)
    source?.disconnect(); processor?.disconnect(); stopTracks(); context.close().catch(() => {})
    throw error
  }
  signal?.removeEventListener("abort", abortStartup)
  const activeSource = source
  const activeProcessor = processor
  const chunks: Float32Array[] = []
  const rate = context.sampleRate
  const started = Date.now()
  let lastSound = Date.now()
  let finished = false
  let heardSpeech = false
  let timer: ReturnType<typeof setTimeout>
  const cleanup = () => {
    clearTimeout(timer)
    signal?.removeEventListener("abort", cancelRecording)
    activeProcessor.disconnect()
    activeSource.disconnect()
    stopTracks()
    context.close().catch(() => {})
  }
  const finish = (discard = false) => {
    if (finished) return
    finished = true
    cleanup()
    if (discard) return
    const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    if (!length || !heardSpeech) return onError()
    const samples = new Float32Array(length)
    let offset = 0
    for (const chunk of chunks) { samples.set(chunk, offset); offset += chunk.length }
    const targetLength = Math.floor(length * 16000 / rate)
    const buffer = new ArrayBuffer(44 + targetLength * 2)
    const view = new DataView(buffer)
    const write = (position: number, text: string) => [...text].forEach((char, index) => view.setUint8(position + index, char.charCodeAt(0)))
    write(0, "RIFF"); view.setUint32(4, 36 + targetLength * 2, true); write(8, "WAVE")
    write(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
    view.setUint32(24, 16000, true); view.setUint32(28, 32000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true)
    write(36, "data"); view.setUint32(40, targetLength * 2, true)
    for (let index = 0; index < targetLength; index++) {
      const position = index * rate / 16000
      const left = Math.floor(position)
      const fraction = position - left
      const value = Math.max(-1, Math.min(1, samples[left] * (1 - fraction) + (samples[left + 1] ?? samples[left]) * fraction))
      view.setInt16(44 + index * 2, value * (value < 0 ? 32768 : 32767), true)
    }
    onComplete(new Blob([buffer], { type: "audio/wav" }))
  }
  const cancelRecording = () => finish(true)
  signal?.addEventListener("abort", cancelRecording, { once: true })
  activeProcessor.onaudioprocess = (event) => {
    if (finished) return
    const input = event.inputBuffer.getChannelData(0)
    chunks.push(new Float32Array(input))
    const energy = Math.sqrt(input.reduce((sum, value) => sum + value * value, 0) / input.length)
    if (energy > 0.012) { lastSound = Date.now(); heardSpeech = true }
    if (Date.now() - started > 1800 && Date.now() - lastSound > 1200) finish()
  }
  try { activeSource.connect(activeProcessor); activeProcessor.connect(context.destination) }
  catch (error) { finish(true); throw error }
  timer = setTimeout(() => finish(), 20000)
  return { stop: () => finish(), cancel: () => finish(true) }
}
