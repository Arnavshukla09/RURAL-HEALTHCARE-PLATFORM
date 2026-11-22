import type { AssistantProvider, PreparedAction } from "@/lib/assistant/client-actions"
export type AssistantStage = "idle" | "symptoms-age" | "symptoms-duration" | "symptoms-intensity" | "symptoms-temperature" | "symptoms-unit" | "symptoms-input" | "book-provider" | "book-mode" | "book-date" | "book-slot" | "book-confirm" | "cancel-confirm" | "records-confirm" | "facility-location"
export interface AssistantMessage { id: number; role: "user" | "assistant"; content: string; emergency?: boolean }
export interface AssistantChoice { id: string; label: string; detail?: string; value: string; kind?: "option" | "cancel" | "join" | "route" | "location" }
export interface AssistantDraft { age?: number; duration?: number; intensity?: "mild" | "moderate" | "severe"; temperature?: string; tempUnit?: string; provider?: AssistantProvider; consultationType?: "video" | "audio" | "chat"; date?: string; appointmentDate?: string; symptoms?: string[] }
export interface AssistantWorkflowState { stage: AssistantStage; draft: AssistantDraft; prepared: PreparedAction | null }
export type VoiceStatus = "idle" | "listening" | "thinking" | "speaking"
