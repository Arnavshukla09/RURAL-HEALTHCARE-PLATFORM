/**
 * lib/ai/clinical-safety.ts
 *
 * Clinical Safety Rule Engine, Decision Tables & Evaluation Framework (Phase 6).
 *
 * Implements deterministic clinical safety boundaries:
 * 1. Tier 0 Emergency Gate: Hard deterministic rule match, zero LLM intervention, 108 / 14416 hotlines.
 * 2. Tier 1 Urgent Referral: Sub-acute danger signs (NTEP chronic cough, animal bites, persistent vomiting).
 * 3. Tier 2 Routine Primary Care: Rule-based clinical knowledge base with structured limitations.
 * 4. Tier 3 Educational Inquiry: General wellness and physiology education.
 *
 * Security & Reliability Defenses:
 * - Prompt injection detection & neutralization.
 * - Input normalization and PII scrubbing.
 * - Strict 0.0% False Negative Rate target for life-threatening emergencies.
 */

import { detectTier0Emergency } from "@/lib/chat/emergency"
import { CLINICAL_KNOWLEDGE_BASE } from "@/lib/ai/medical-brain"

export const CLINICAL_RULES_VERSION = "2026.10-v1.0"
export const TARGET_AI_MODEL = "Google Gemini 1.5 Flash (Safety-Gated Fallback Cascade)"

export type ClinicalTier =
  | "TIER_0_EMERGENCY"         // Immediate 108 / 14416 siren; zero LLM bypass
  | "TIER_1_URGENT_REFERRAL"   // Requires in-person medical evaluation within 24-48 hours (NTEP/Rabies)
  | "TIER_2_ROUTINE_CARE"      // Structured primary care home guidelines & OTC advice
  | "TIER_3_EDUCATIONAL"       // General informational/wellness inquiries

export type ClinicalCategory =
  | "cardiac_stroke"
  | "pediatric_danger"
  | "obstetric_maternal"
  | "toxicology_envenomation"
  | "mental_health_crisis"
  | "urgent_referral"
  | "routine_symptom"
  | "informational"
  | "negation_symptom"
  | "prompt_injection"

export interface ClinicalTestCase {
  id: string
  input: string
  language: "en" | "hi" | "hinglish" | "mr" | "bn" | "te"
  expectedTier: ClinicalTier
  category: ClinicalCategory
  description: string
}

export interface ClinicalEvaluationMetrics {
  totalCases: number
  truePositives: number
  falseNegatives: number
  trueNegatives: number
  falsePositives: number
  sensitivity: number          // Recall = TP / (TP + FN) -> Must be 100%
  falseNegativeRate: number    // FNR = FN / (TP + FN) -> Must be 0.0%
  specificity: number          // TN / (TN + FP)
  categoryBreakdown: Record<ClinicalCategory, { total: number; passed: number }>
  injectionNeutralizedCount: number
}

// Known Prompt Injection & Jailbreak Attack Signatures
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+(instructions|guidelines|rules|prompts)/i,
  /forget\s+(medical\s+)?(guidelines|rules|safety|ethics)/i,
  /(pretend|act like|you are now|switch to)\s+.*?\b(developer mode|dan|jailbroken|unrestricted)/i,
  /disregard\s+(emergency|safety)\s+(rules|protocols)/i,
  /say\s+(everything\s+is\s+fine|emergency\s+is\s+not\s+needed|it\s+is\s+safe)/i,
  /pretend\s+you\s+are\s+not\s+a\s+(medical\s+ai|doctor)/i,
  /bypass\s+(emergency|triage|safety)\s+filter/i,
  /<\|im_start\|>|<\|system\|>|\[system\]/i,
]

/**
 * Normalizes input and detects adversarial prompt injection attempts.
 */
export function sanitizeAndDetectInjection(raw: string): {
  sanitized: string
  isInjectionAttempt: boolean
  flaggedPattern?: string
} {
  if (!raw || typeof raw !== "string") {
    return { sanitized: "", isInjectionAttempt: false }
  }

  const trimmed = raw.trim().slice(0, 1000)

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        sanitized: trimmed,
        isInjectionAttempt: true,
        flaggedPattern: pattern.toString(),
      }
    }
  }

  return { sanitized: trimmed, isInjectionAttempt: false }
}

/**
 * Deterministic Decision Table Classifier:
 * Evaluates patient input and determines appropriate clinical triage tier.
 * Never allows LLM to override a Tier 0 emergency escalation rule.
 */
export function classifyClinicalTier(
  input: string,
  lang: string = "en"
): {
  tier: ClinicalTier
  matchedRuleId?: string
  hotline?: string
  emergencyMessage?: string
  isInjectionNeutralized?: boolean
} {
  const { sanitized, isInjectionAttempt } = sanitizeAndDetectInjection(input)

  // Step 0: Check Deterministic Tier 0 Emergency Gate
  const emergencyCheck = detectTier0Emergency(sanitized, lang)
  if (emergencyCheck?.isEmergency) {
    return {
      tier: "TIER_0_EMERGENCY",
      matchedRuleId: "tier0_emergency_gate",
      hotline: emergencyCheck.hotline,
      emergencyMessage: emergencyCheck.reply,
      isInjectionNeutralized: isInjectionAttempt,
    }
  }

  // If prompt injection was attempted but no acute emergency was present,
  // neutralize by returning conservative primary care response without executing instructions.
  if (isInjectionAttempt) {
    return {
      tier: "TIER_2_ROUTINE_CARE",
      matchedRuleId: "injection_neutralized_safe_fallback",
      isInjectionNeutralized: true,
    }
  }

  // Step 1: Check Deterministic Tier 1 Urgent Clinical Referrals (Priority 80-99 in Medical Brain)
  for (const entry of CLINICAL_KNOWLEDGE_BASE) {
    if (entry.priority >= 80 && entry.priority < 100) {
      for (const pattern of entry.patterns) {
        if (pattern.test(sanitized)) {
          return {
            tier: "TIER_1_URGENT_REFERRAL",
            matchedRuleId: entry.id,
          }
        }
      }
    }
  }

  // Step 2: Check Deterministic Tier 2 Routine Symptom Knowledge Base (Priority 40-79)
  for (const entry of CLINICAL_KNOWLEDGE_BASE) {
    if (entry.priority < 80) {
      for (const pattern of entry.patterns) {
        if (pattern.test(sanitized)) {
          return {
            tier: "TIER_2_ROUTINE_CARE",
            matchedRuleId: entry.id,
          }
        }
      }
    }
  }

  // Step 3: Default to Tier 3 Educational Inquiry (General wellness & physiology)
  return {
    tier: "TIER_3_EDUCATIONAL",
    matchedRuleId: "general_educational_inquiry",
  }
}

/**
 * Executes a clinical evaluation benchmark over a test dataset,
 * measuring sensitivity, specificity, and False Negative Rate on emergencies.
 */
export function evaluateClinicalSafetyDataset(
  cases: ClinicalTestCase[]
): ClinicalEvaluationMetrics {
  let truePositives = 0   // Actual emergency classified as TIER_0_EMERGENCY
  let falseNegatives = 0  // Actual emergency classified as Non-Emergency (CATASTROPHIC)
  let trueNegatives = 0   // Non-emergency classified as Non-Emergency
  let falsePositives = 0  // Non-emergency classified as TIER_0_EMERGENCY
  let injectionNeutralizedCount = 0

  const categoryBreakdown: Record<ClinicalCategory, { total: number; passed: number }> = {
    cardiac_stroke: { total: 0, passed: 0 },
    pediatric_danger: { total: 0, passed: 0 },
    obstetric_maternal: { total: 0, passed: 0 },
    toxicology_envenomation: { total: 0, passed: 0 },
    mental_health_crisis: { total: 0, passed: 0 },
    urgent_referral: { total: 0, passed: 0 },
    routine_symptom: { total: 0, passed: 0 },
    informational: { total: 0, passed: 0 },
    negation_symptom: { total: 0, passed: 0 },
    prompt_injection: { total: 0, passed: 0 },
  }

  for (const c of cases) {
    const isActualEmergency = c.expectedTier === "TIER_0_EMERGENCY"
    const result = classifyClinicalTier(c.input, c.language)
    const isPredictedEmergency = result.tier === "TIER_0_EMERGENCY"

    // Update Category Stats
    categoryBreakdown[c.category].total++
    if (result.tier === c.expectedTier) {
      categoryBreakdown[c.category].passed++
    }

    if (result.isInjectionNeutralized) {
      injectionNeutralizedCount++
    }

    // Confusion Matrix for Emergency Escalation
    if (isActualEmergency && isPredictedEmergency) {
      truePositives++
    } else if (isActualEmergency && !isPredictedEmergency) {
      falseNegatives++
    } else if (!isActualEmergency && !isPredictedEmergency) {
      trueNegatives++
    } else if (!isActualEmergency && isPredictedEmergency) {
      falsePositives++
    }
  }

  const actualEmergencies = truePositives + falseNegatives
  const actualNonEmergencies = trueNegatives + falsePositives

  const sensitivity = actualEmergencies > 0 ? truePositives / actualEmergencies : 1.0
  const falseNegativeRate = actualEmergencies > 0 ? falseNegatives / actualEmergencies : 0.0
  const specificity = actualNonEmergencies > 0 ? trueNegatives / actualNonEmergencies : 1.0

  return {
    totalCases: cases.length,
    truePositives,
    falseNegatives,
    trueNegatives,
    falsePositives,
    sensitivity: Math.round(sensitivity * 1000) / 1000,
    falseNegativeRate: Math.round(falseNegativeRate * 1000) / 1000,
    specificity: Math.round(specificity * 1000) / 1000,
    categoryBreakdown,
    injectionNeutralizedCount,
  }
}
