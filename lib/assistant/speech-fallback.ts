import type { SpeechCapabilities } from "@/lib/ai/speech"
export function canUseDeviceRecognition(capabilities: SpeechCapabilities, online: boolean) {
  return capabilities.recognitionSupported && (online || capabilities.recognitionOffline === "available")
}
export function canUseOwnedSynthesis(service: { available: boolean; ttsLanguages: string[] }, language: string, online: boolean) {
  return online && service.available && service.ttsLanguages.includes(language)
}
