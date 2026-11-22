"use client"

import dynamic from "next/dynamic"

const FloatingChat = dynamic(
  () => import("@/components/voice-assistant").then((m) => m.VoiceAssistant),
  { ssr: false }
)

export function FloatingChatClient() {
  return <FloatingChat />
}
