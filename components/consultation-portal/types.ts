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
  appointmentId: string
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

export function getNext7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    return d
  })
}

export function toISODate(d: Date) {
  return new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 10)
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
