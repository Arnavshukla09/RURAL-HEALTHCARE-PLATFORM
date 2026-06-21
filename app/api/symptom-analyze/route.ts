import { type NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { age, gender, temperature, daysSick, bodyPart, symptoms, language } = body

    if (!symptoms || symptoms.length === 0) {
      return NextResponse.json({ error: "No symptoms provided" }, { status: 400 })
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      // Fallback: rule-based triage when no key configured
      return NextResponse.json(buildFallback(symptoms, language))
    }

    const lang = language === "hi" ? "Hindi and English" : "English"
    const prompt = `You are a medical assistant for rural India. A patient needs health guidance.

Patient Details:
- Age: ${age || "unknown"}
- Gender: ${gender || "unknown"}
- Temperature: ${temperature ? temperature + "°F" : "not measured"}
- Duration of symptoms: ${daysSick} day(s)
- Body part affected: ${bodyPart || "general"}
- Reported symptoms: ${symptoms.join(", ")}

Analyze these symptoms and respond ONLY with valid JSON (no markdown, no code blocks) in this exact format:
{
  "urgency": "low|medium|high|emergency",
  "possibleConditions": [
    {"name": "Condition Name", "probability": "60%", "description": "brief description"}
  ],
  "immediateActions": ["action 1", "action 2", "action 3"],
  "homeCare": ["tip 1", "tip 2", "tip 3"],
  "whenToGoToHospital": "describe when to seek emergency care",
  "specialistNeeded": "General Physician|Cardiologist|Pediatrician|etc",
  "relevantDiseases": ["malaria", "dengue", "typhoid"],
  "language": "${lang}"
}

Rules:
- urgency=emergency: chest pain + breathing, unconsciousness, severe bleeding, stroke symptoms
- urgency=high: high fever + 3+ symptoms, severe pain, rapid deterioration
- urgency=medium: moderate symptoms persisting 2+ days, requires doctor visit
- urgency=low: mild symptoms, manageable at home
- possibleConditions: 2-4 most likely conditions given the symptoms in rural Indian context
- relevantDiseases: list 1-3 disease keys for health education (use lowercase English names)
- Keep responses culturally appropriate for rural India
- ${language === "hi" ? "Provide immediateActions and homeCare in Hindi" : "Provide responses in English"}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 800,
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error("Gemini API error:", errText)
      return NextResponse.json(buildFallback(symptoms, language))
    }

    const geminiData = await response.json()
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ""

    // Strip markdown code fences if present
    const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

    try {
      const parsed = JSON.parse(cleaned)
      return NextResponse.json(parsed)
    } catch {
      // JSON parse failed — return fallback
      return NextResponse.json(buildFallback(symptoms, language))
    }
  } catch (error: any) {
    console.error("Symptom analyze error:", error)
    return NextResponse.json({ error: error.message || "Analysis failed" }, { status: 500 })
  }
}

// Rule-based fallback when Gemini API key is not set or fails
function buildFallback(symptoms: string[], language: string) {
  const en = language !== "hi"
  const highRisk = symptoms.some(s =>
    ["Chest pain", "Shortness of breath", "Cough with blood", "Fainting", "Severe headache"].includes(s)
  )
  const medRisk = symptoms.length >= 3

  const urgency = highRisk ? "high" : medRisk ? "medium" : "low"

  return {
    urgency,
    possibleConditions: [
      { name: en ? "Viral Infection" : "वायरल संक्रमण", probability: "50%", description: en ? "Common viral illness" : "सामान्य वायरल बीमारी" },
      { name: en ? "Bacterial Infection" : "बैक्टीरियल संक्रमण", probability: "30%", description: en ? "May require antibiotics" : "एंटीबायोटिक की आवश्यकता हो सकती है" },
    ],
    immediateActions: en
      ? ["Rest and stay hydrated", "Monitor temperature every 4 hours", "Avoid self-medication without guidance"]
      : ["आराम करें और पानी पिएं", "हर 4 घंटे में बुखार मापें", "बिना सलाह के दवा न लें"],
    homeCare: en
      ? ["Drink ORS if experiencing diarrhea", "Use wet cloth for high fever", "Eat light, easily digestible food"]
      : ["दस्त होने पर ORS पिएं", "तेज बुखार के लिए गीला कपड़ा लगाएं", "हल्का भोजन करें"],
    whenToGoToHospital: en
      ? "Go to hospital if fever exceeds 103°F, difficulty breathing, or symptoms worsen after 2 days."
      : "अगर बुखार 103°F से ज्यादा हो, सांस लेने में तकलीफ हो, या 2 दिन बाद भी लक्षण बिगड़ें तो अस्पताल जाएं।",
    specialistNeeded: "General Physician",
    relevantDiseases: ["malaria", "dengue", "typhoid"],
  }
}
