"use client"

import dynamic from "next/dynamic"

const FloatingChat = dynamic(
  () => import("@/components/FloatingChat").then((m) => m.FloatingChat),
  { ssr: false }
)

export function FloatingChatClient() {
  return <FloatingChat />
}
