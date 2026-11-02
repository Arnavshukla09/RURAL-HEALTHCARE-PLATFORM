/**
 * components/consultation-portal/types.ts
 *
 * Types and slot helpers for ConsultationPortal.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Consultation Subsystem
 */

import { Video, Phone, MessageCircle } from "lucide-react"
import type { UserProfile, SymptomResult } from "@/types"
import type { RealDoctor } from "@/lib/data/real-doctors"

export interface ConsultationPortalProps {
  language: string
  user?: UserProfile | null
  symptomResult?: SymptomResult | null
}

export interface BookingSuccessData {
  doctor: RealDoctor
  date: string
  slot: string
  consultType: string
  roomId: string
  paymentMode: string
}

export const SPECIALTY_OPTIONS = [
  { key: "all", labelEn: "All Specialties", labelHi: "सभी विशेषताएं" },
  { key: "general", labelEn: "General Medicine", labelHi: "सामान्य चिकित्सा" },
  { key: "cardiology", labelEn: "Cardiology", labelHi: "हृदय रोग" },
  { key: "pediatrics", labelEn: "Pediatrics", labelHi: "बाल रोग" },
  { key: "gynecology", labelEn: "Obstetrics & Gynecology", labelHi: "स्त्री एवं प्रसूति रोग" },
  { key: "orthopedics", labelEn: "Orthopedics", labelHi: "हड्डी रोग" },
  { key: "neurology", labelEn: "Neurology", labelHi: "न्यूरोलॉजी" },
  { key: "pulmonology", labelEn: "Pulmonology", labelHi: "श्वसन रोग" },
  { key: "oncology", labelEn: "Oncology", labelHi: "कैंसर रोग" },
]

export const CONSULT_TYPES = [
  { id: "video", labelEn: "Video Call", labelHi: "वीडियो कॉल", icon: Video, badgeEn: "Free Teleconsult", badgeHi: "मुफ्त वीडियो" },
  { id: "audio", labelEn: "Audio Call", labelHi: "ऑडियो कॉल", icon: Phone, badgeEn: "Free Phone OPD", badgeHi: "मुफ्त ऑडियो" },
  { id: "chat", labelEn: "Chat & OPD", labelHi: "चैट परामर्श", icon: MessageCircle, badgeEn: "Free Messaging", badgeHi: "मुफ्त चैट" },
]

export const MORNING = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]
export const AFTERNOON = ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30"]
export const EVENING = ["16:00", "16:30", "17:00", "17:30", "18:00", "18:30"]

export function getSlots(doctorId: string, dateStr: string) {
  const dow = new Date(dateStr).getDay() // 0 = Sun
  if (dow === 0) return { morning: [], afternoon: [], evening: [] }

  const seed = (doctorId + dateStr)
    .split("")
    .reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0)

  const mark = (slots: string[]) =>
    slots.map((time, i) => ({ time, available: (seed + i * 17) % 5 !== 0 }))

  return {
    morning: mark(MORNING),
    afternoon: mark(AFTERNOON),
    evening: dow < 6 ? mark(EVENING) : [],
  }
}

export function getNext7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    return d
  })
}

export function toISODate(d: Date) {
  return d.toISOString().split("T")[0]
}

export function getInitials(name: string) {
  return name
    .replace(/^(Dr\.|Dr|Prof\.|Prof)\s+/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}
