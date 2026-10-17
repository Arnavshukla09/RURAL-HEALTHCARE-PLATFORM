/**
 * components/helpline-directory/types.ts
 *
 * Types, themes, and critical fast-dial numbers for HelplineDirectory.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Helpline Subsystem
 */

import {
  Filter,
  HeartPulse,
  Shield,
  Users,
  Brain,
  AlertTriangle,
  Building2,
  Flame,
  Sparkles,
} from "lucide-react"
import type { HelplineCategory } from "@/lib/emergency/helplines"

export interface HelplineDirectoryProps {
  language: string
  initialCoords?: { lat: number; lng: number }
}

export const CATEGORY_THEMES: Record<
  HelplineCategory,
  {
    en: string
    hi: string
    icon: any
    badgeBg: string
    badgeText: string
    iconBoxBg: string
    iconBoxColor: string
    cardBorder: string
    cardBg: string
    btnBg: string
  }
> = {
  all: {
    en: "All Services",
    hi: "सभी सेवाएं",
    icon: Filter,
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-800",
    iconBoxBg: "bg-gray-100",
    iconBoxColor: "text-gray-700",
    cardBorder: "border-l-4 border-l-gray-400",
    cardBg: "bg-white",
    btnBg: "bg-gray-800 hover:bg-gray-900",
  },
  medical: {
    en: "Medical & Ambulance",
    hi: "चिकित्सा व एम्बुलेंस",
    icon: HeartPulse,
    badgeBg: "bg-red-50",
    badgeText: "text-red-700 border border-red-200",
    iconBoxBg: "bg-red-100/80",
    iconBoxColor: "text-red-600",
    cardBorder: "border-l-4 border-l-red-500",
    cardBg: "bg-red-50/20",
    btnBg: "bg-red-600 hover:bg-red-700",
  },
  police_fire: {
    en: "Police & Fire Force",
    hi: "पुलिस व अग्निशमन",
    icon: Shield,
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700 border border-blue-200",
    iconBoxBg: "bg-blue-100/80",
    iconBoxColor: "text-blue-700",
    cardBorder: "border-l-4 border-l-blue-600",
    cardBg: "bg-blue-50/20",
    btnBg: "bg-blue-600 hover:bg-blue-700",
  },
  women_child: {
    en: "Women & Child Safety",
    hi: "महिला एवं बाल सुरक्षा",
    icon: Users,
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700 border border-purple-200",
    iconBoxBg: "bg-purple-100/80",
    iconBoxColor: "text-purple-700",
    cardBorder: "border-l-4 border-l-purple-500",
    cardBg: "bg-purple-50/20",
    btnBg: "bg-purple-600 hover:bg-purple-700",
  },
  mental_health: {
    en: "Mental Health Crisis",
    hi: "मानसिक स्वास्थ्य",
    icon: Brain,
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700 border border-emerald-200",
    iconBoxBg: "bg-emerald-100/80",
    iconBoxColor: "text-emerald-700",
    cardBorder: "border-l-4 border-l-emerald-500",
    cardBg: "bg-emerald-50/20",
    btnBg: "bg-emerald-600 hover:bg-emerald-700",
  },
  disaster: {
    en: "Disaster & Flood Relief",
    hi: "आपदा एवं राहत",
    icon: AlertTriangle,
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-800 border border-amber-200",
    iconBoxBg: "bg-amber-100/80",
    iconBoxColor: "text-amber-700",
    cardBorder: "border-l-4 border-l-amber-500",
    cardBg: "bg-amber-50/20",
    btnBg: "bg-amber-600 hover:bg-amber-700",
  },
  governance: {
    en: "CM Helpline & Grievance",
    hi: "सीएम व जन शिकायत",
    icon: Building2,
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-700 border border-sky-200",
    iconBoxBg: "bg-sky-100/80",
    iconBoxColor: "text-sky-700",
    cardBorder: "border-l-4 border-l-sky-500",
    cardBg: "bg-sky-50/20",
    btnBg: "bg-sky-600 hover:bg-sky-700",
  },
}

export const CRITICAL_FAST_DIAL = [
  {
    number: "112",
    serviceEn: "National Emergency (ERSS)",
    serviceHi: "एकीकृत आपातकालीन सेवा (ERSS)",
    category: "Unified Emergency (Police / Fire / Medical)",
    icon: Shield,
    color: "from-blue-600 to-indigo-700",
    pillBg: "bg-blue-600",
    lightBg: "bg-blue-50 border-blue-200 text-blue-900",
  },
  {
    number: "108",
    serviceEn: "Ambulance Emergency",
    serviceHi: "आपातकालीन एम्बुलेंस सेवा",
    category: "Free Emergency Medical Response",
    icon: HeartPulse,
    color: "from-red-600 to-rose-700",
    pillBg: "bg-red-600",
    lightBg: "bg-red-50 border-red-200 text-red-900",
  },
  {
    number: "102",
    serviceEn: "Maternity & Infant Ambulance",
    serviceHi: "मातृ एवं शिशु एम्बुलेंस",
    category: "Janani Shishu Suraksha",
    icon: Users,
    color: "from-rose-500 to-pink-600",
    pillBg: "bg-rose-600",
    lightBg: "bg-rose-50 border-rose-200 text-rose-900",
  },
  {
    number: "101",
    serviceEn: "Fire Brigade Emergency",
    serviceHi: "अग्निशमन सेवा (दमकल)",
    category: "Fire & Rescue Operations",
    icon: Flame,
    color: "from-amber-600 to-orange-700",
    pillBg: "bg-orange-600",
    lightBg: "bg-orange-50 border-orange-200 text-orange-900",
  },
  {
    number: "100",
    serviceEn: "Police Emergency",
    serviceHi: "पुलिस सहायता नियंत्रण",
    category: "State Police Control Room",
    icon: Shield,
    color: "from-indigo-600 to-blue-800",
    pillBg: "bg-indigo-600",
    lightBg: "bg-indigo-50 border-indigo-200 text-indigo-900",
  },
  {
    number: "14416",
    serviceEn: "Tele-MANAS Mental Crisis",
    serviceHi: "टेली-मानस मानसिक स्वास्थ्य",
    category: "24/7 Suicide Prevention Lifeline",
    icon: Brain,
    color: "from-emerald-600 to-teal-700",
    pillBg: "bg-emerald-600",
    lightBg: "bg-emerald-50 border-emerald-200 text-emerald-900",
  },
  {
    number: "1098",
    serviceEn: "Childline (Child in Distress)",
    serviceHi: "चाइल्डलाइन बाल सुरक्षा",
    category: "24/7 Protection & Rescue",
    icon: Users,
    color: "from-purple-600 to-violet-700",
    pillBg: "bg-purple-600",
    lightBg: "bg-purple-50 border-purple-200 text-purple-900",
  },
  {
    number: "181",
    serviceEn: "Women Helpline",
    serviceHi: "महिला सुरक्षा हेल्पलाइन",
    category: "Domestic Abuse & Emergency Aid",
    icon: Sparkles,
    color: "from-fuchsia-600 to-pink-700",
    pillBg: "bg-fuchsia-600",
    lightBg: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-900",
  },
]
