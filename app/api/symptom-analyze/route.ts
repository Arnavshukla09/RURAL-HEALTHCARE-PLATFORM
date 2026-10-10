import { type NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { triageOffline } from "@/lib/offline/offline-ai"
import { generateGeminiContent } from "@/lib/ai/gemini"

export async function POST(request: NextRequest) {
  try {
    const forwardedHeader = request.headers.get("x-forwarded-for")
    const clientIp = forwardedHeader ? forwardedHeader.split(",")[0].trim() : "127.0.0.1"

    if (!(await rateLimit(clientIp))) {
      return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 })
    }

    const body = await request.json()
    const {
      age = "unknown",
      gender = "unknown",
      temperature = "",
      tempUnit = "F",
      daysSick = "1",
      bodyPart = "general",
      symptoms = [],
      language = "en",
    } = body

    const sanitizedSymptoms = Array.isArray(symptoms)
      ? symptoms.map((s) => String(s).trim().slice(0, 100)).filter(Boolean)
      : []

    const lang = language === "hi" ? "hi" : "en"

    const prompt = `You are an expert clinical triage assistant for rural Indian primary healthcare.
Analyze the following patient report and return STRICTLY a JSON object with this exact schema:
{
  "urgency": "low" | "medium" | "high" | "emergency",
  "specialistNeeded": "string",
  "immediateActions": ["string", "string"],
  "homeCare": ["string", "string"],
  "whenToGoToHospital": "string"
}

Patient Information:
- Age: ${String(age).slice(0, 10)}
- Gender: ${String(gender).slice(0, 10)}
- Temperature: ${String(temperature).slice(0, 10)}°${String(tempUnit).slice(0, 2)}
- Duration: ${String(daysSick).slice(0, 10)} days
- Body Part: ${String(bodyPart).slice(0, 30)}
- Reported Symptoms: ${sanitizedSymptoms.join(", ")}
- Language: ${lang}

Rules:
1. Do not invent diagnoses or percentages.
2. If severe emergency red flags exist, urgency must be "emergency" or "high".
3. Provide practical rural home care (ORS, hydration, light khichdi).
4. Output strictly the JSON object and no surrounding text or markdown.`

    const geminiResult = await generateGeminiContent([{ role: "user", parts: [{ text: prompt }] }])

    if (geminiResult.reply && !geminiResult.fallback) {
      const cleaned = geminiResult.reply
        .replace(/```json\n?/gi, "")
        .replace(/```\n?/g, "")
        .trim()

      const firstBrace = cleaned.indexOf("{")
      const lastBrace = cleaned.lastIndexOf("}")

      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          const parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1))
          return NextResponse.json(parsed)
        } catch {
          // Fall through to deterministic triage on JSON parse failure
        }
      }
    }

    // Deterministic safe fallback using offline triage
    const offlineTriage = triageOffline(sanitizedSymptoms, lang)
    return NextResponse.json({
      urgency: offlineTriage.urgency,
      specialistNeeded: offlineTriage.referTo === "108" ? "Emergency / Ambulance" : "General Physician / Medical Officer",
      immediateActions: offlineTriage.immediateActions,
      homeCare: offlineTriage.homeCare,
      whenToGoToHospital: offlineTriage.whenToGoToHospital,
      fallback: true
    })
  } catch (error: any) {
    console.error("Symptom analyze server error:", error)
    const offlineTriage = triageOffline([], "en")
    return NextResponse.json({
      urgency: offlineTriage.urgency,
      specialistNeeded: "Medical Officer",
      immediateActions: offlineTriage.immediateActions,
      homeCare: offlineTriage.homeCare,
      whenToGoToHospital: offlineTriage.whenToGoToHospital,
      fallback: true
    })
  }
}
