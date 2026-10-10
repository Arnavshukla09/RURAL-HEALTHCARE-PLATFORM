/**
 * lib/chat/types.ts
 * Core types for the unified multi-tier chatbot router.
 */

export type ChatTier = 0 | 1 | 2 | "2b" | 3

export type Lang = "en" | "hi"

export interface NavButton {
  label: string
  page?: string
  action?: string
}

export interface ChatResult {
  reply: string
  tier: ChatTier
  confidence: number
  suggestions?: string[]
  navButtons?: NavButton[]
  queryId?: string
  fallback?: boolean
  emergency?: boolean
  source?: string
}

export interface RouteChatInput {
  message: string
  language: string
  history?: { role: "user" | "assistant" | "model"; content: string }[]
  symptomContext?: string[]
}
