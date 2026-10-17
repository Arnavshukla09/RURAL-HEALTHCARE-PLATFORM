import React from "react"
import {
  Baby,
  Heart,
  Users,
  Accessibility,
  Activity,
  Dna,
  Stethoscope,
  Brain,
  ShieldCheck,
  Zap,
  Building2,
} from "lucide-react"
import type { SchemeCategory } from "@/lib/schemes/health-schemes"

/**
 * components/government-schemes/types.tsx
 *
 * Types and category icon helper for GovernmentSchemes.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Schemes Subsystem
 */

export interface GovernmentSchemesProps {
  language: string
}

export function getCategoryIcon(key: SchemeCategory, className: string = "h-5 w-5") {
  switch (key) {
    case "kids":
      return <Baby className={className} />
    case "females":
      return <Heart className={className} />
    case "elderly":
      return <Users className={className} />
    case "disability":
      return <Accessibility className={className} />
    case "cancer":
      return <Activity className={className} />
    case "rare_disease":
      return <Dna className={className} />
    case "kidney":
      return <Activity className={className} />
    case "tb":
      return <Stethoscope className={className} />
    case "mental_health":
      return <Brain className={className} />
    case "poverty_upliftment":
      return <ShieldCheck className={className} />
    case "emergency_trauma":
      return <Zap className={className} />
    default:
      return <Building2 className={className} />
  }
}
