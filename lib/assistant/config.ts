/** Stable assistant contracts. Optional inference is owned infrastructure, never a paid API. */
export const ASSISTANT_CONFIG = Object.freeze({
  protocolVersion: 1,
  voiceServicePort: 8765,
  requestTimeoutMs: 30000,
  maxRecordingSeconds: 20,
  maxAudioBytes: 2 * 1024 * 1024,
  maxSpeechCharacters: 1200,
  sessionKey: "rhcp_assistant_session",
})
