import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkRateLimit, rateLimitResponse, clientKey } from "@/lib/rate-limit"
import { composeResponse } from "@/lib/symptoms/compose"
import { findSymptomByIdOrName } from "@/lib/symptoms/catalog"
import { detectTier0Emergency } from "@/lib/chat/emergency"
import { generateGeminiContent } from "@/lib/ai/gemini"
import { isLoadTest, stubDelay } from "@/lib/loadtest"
import { executeWithAiGateway } from "@/lib/ai/gateway"
import { getAssistantTriageReply } from "@/lib/assistant/prompts"
import { ASSISTANT_PHRASES } from "@/lib/assistant/phrase-catalog"

const IntakeSchema = z.object({
  age: z.union([z.string().max(12), z.number().min(0).max(120)]).optional(),
  gender: z.string().max(20).optional(),
  temperature: z.union([z.string().max(12), z.number()]).optional(),
  tempUnit: z.enum(["C", "F"]).default("F"),
  daysSick: z.union([z.string().max(12), z.number().min(0).max(365)]).optional(),
  intensity: z.enum(["mild", "moderate", "severe"]).default("moderate"),
  bodyPart: z.string().max(30).optional(),
  symptoms: z.array(z.string().trim().min(1).max(100)).min(1).max(32),
  language: z.enum(["en", "hi", "mr", "bn", "te", "ta", "gu", "kn", "pa", "or", "ml", "as", "ur"]).default("en"),
})
const ResultSchema = z.object({
  urgency: z.enum(["low", "medium", "high", "emergency"]),
  specialistNeeded: z.string().trim().min(1).max(200),
  immediateActions: z.array(z.string().min(1).max(500)).min(1).max(8),
  homeCare: z.array(z.string().min(1).max(500)).max(8),
  whenToGoToHospital: z.string().min(1).max(1000),
})
const severityRank = { low: 0, medium: 1, high: 2, emergency: 3 }

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, "ai")
  if (!rl.success) return rateLimitResponse(rl)
  let raw: unknown
  try { raw = await request.json() } catch {
    return NextResponse.json({ error: "Invalid JSON intake", code: "VALIDATION_ERROR" }, { status: 400 })
  }
  const intake = IntakeSchema.safeParse(raw)
  if (!intake.success) return NextResponse.json({ error: "Invalid symptom intake", code: "VALIDATION_ERROR", details: intake.error.flatten() }, { status: 400 })

  const body = intake.data
  const symptoms = body.symptoms.map((symptom) => findSymptomByIdOrName(symptom)?.en ?? symptom)
  const composed = composeResponse({
    symptoms, intensity: body.intensity, temperature: String(body.temperature ?? ""),
    tempUnit: body.tempUnit, daysSick: String(body.daysSick ?? "1"),
    age: String(body.age ?? ""), gender: body.gender,
  }, body.language)
  const emergency = detectTier0Emergency(symptoms.join("; "), body.language)
  const explicitEmergency = ASSISTANT_PHRASES[body.language].emergency.some((phrase) => body.symptoms.join("; ").toLowerCase().includes(phrase.toLowerCase()))
  if (emergency || explicitEmergency || composed.urgency === "emergency") {
    const safety = emergency?.reply ?? getAssistantTriageReply(body.language, "emergency")
    return NextResponse.json({
      urgency: "emergency", specialistNeeded: "Emergency / Ambulance",
      immediateActions: [safety], homeCare: [], whenToGoToHospital: safety,
      hotline: emergency?.hotline ?? "108", fallback: false, source: "deterministic-emergency",
      language: body.language, reply: safety,
    }, { headers: { "Cache-Control": "no-store" } })
  }

  const local = {
    urgency: composed.urgency, specialistNeeded: composed.specialistNeeded,
    immediateActions: [getAssistantTriageReply(body.language, composed.urgency), ...(body.language === "en" || body.language === "hi" ? composed.immediateActions : [])],
    homeCare: body.language === "en" || body.language === "hi" ? composed.homeCare : [],
    whenToGoToHospital: getAssistantTriageReply(body.language, composed.urgency),
    language: body.language, reply: getAssistantTriageReply(body.language, composed.urgency),
  }
  // Severe intake and upstream failure always retain deterministic advice.
  if (local.urgency === "high") return NextResponse.json({ ...local, fallback: false, source: "deterministic-triage" })
  if (isLoadTest(request)) {
    await stubDelay()
    return NextResponse.json({ ...local, fallback: false, source: "deterministic-triage" })
  }
  try {
    const prompt = `Provide supplementary triage for a rural Indian patient. Return JSON only with urgency (low|medium|high|emergency), specialistNeeded (string), immediateActions (string[]), homeCare (string[]), whenToGoToHospital (string).
Do not prescribe medication doses or invent diagnoses. Never reduce this deterministic urgency: ${local.urgency}.
Age: ${String(body.age ?? "unknown")}; duration: ${String(body.daysSick ?? "1")}; temperature: ${String(body.temperature ?? "")}${body.tempUnit}; symptoms: ${symptoms.join(", ")}.`
    const result = await executeWithAiGateway(clientKey(request), () => generateGeminiContent([{ role: "user", parts: [{ text: prompt }] }]))
    if (result.reply && !result.fallback) {
      const cleaned = result.reply.replace(/^```json\s*|^```\s*|\s*```$/gi, "").trim()
      const model = ResultSchema.safeParse(JSON.parse(cleaned))
      if (model.success) {
        const urgency = severityRank[model.data.urgency] > severityRank[local.urgency] ? model.data.urgency : local.urgency
        // The model may raise urgency; it cannot replace reviewed safety instructions.
        const raised = severityRank[urgency] > severityRank[local.urgency] ? getAssistantTriageReply(body.language, urgency) : undefined
        return NextResponse.json({
          ...local, urgency, specialistNeeded: model.data.specialistNeeded, reply: raised ?? local.reply,
          immediateActions: raised ? [raised, ...local.immediateActions] : local.immediateActions,
          whenToGoToHospital: raised ?? local.whenToGoToHospital,
          homeCare: urgency === "emergency" ? [] : local.homeCare,
          fallback: false, source: "safety-gated-triage",
        })
      }
    }
  } catch (error) {
    console.warn("[symptom-analyze] Using deterministic intake result:", error instanceof Error ? error.name : "Upstream failure")
  }
  return NextResponse.json({ ...local, fallback: true, source: "deterministic-triage" })
}
