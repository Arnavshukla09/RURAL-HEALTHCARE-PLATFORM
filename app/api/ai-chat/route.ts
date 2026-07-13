import { type NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

/**
 * POST /api/ai-chat
 * Server-side Gemini chat for the floating health assistant.
 * Keeps the API key server-side (never exposed to client).
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"
    if (!rateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await request.json()
    const { message, history, language } = body

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 })
    }

    const systemPrompt = `You are RuralHealth AI, a health assistant for rural India speaking directly to a patient.

CRITICAL INSTRUCTIONS - READ CAREFULLY:
- You must reply DIRECTLY to the patient.
- DO NOT generate a chain of thought.
- DO NOT echo the prompt.
- DO NOT list rules, constraints, or internal checks.
- If you output any reasoning steps or bullet points analyzing the prompt, you will fail your core directive.
- Start your response IMMEDIATELY with the helpful advice for the patient.

Guidelines for your medical advice:
1. Only answer health-related questions.
2. Always respond in ${language === "hi" ? "Hindi" : "English"} and keep it under 150 words.
3. Use plain text and standard bullet points (•). DO NOT use markdown bolding (**).
4. Never diagnose definitively. Use "this could be".
5. For serious symptoms, tell them to call 108 or go to the hospital immediately.
6. Mention free/affordable options: PHC, ASHA workers, Jan Aushadhi stores, 108 ambulance.`

    // Build conversation contents
    const contents: any[] = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Understood. I am RuralHealth AI, a health-only assistant for rural India. I will only answer health questions." }] },
    ]

    // Add conversation history (last 8 messages)
    if (Array.isArray(history)) {
      for (const msg of history.slice(-8)) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        })
      }
    }

    // Add current message
    contents.push({ role: "user", parts: [{ text: message }] })

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: 2000 },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
          ],
        }),
      }
    )

    if (!response.ok) {
      const errBody = await response.text()
      console.error("Gemini API error:", response.status, errBody)
      return NextResponse.json({ error: "AI service error" }, { status: 502 })
    }

    const data = await response.json()
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      (language === "hi"
        ? "क्षमा करें, मैं अभी जवाब नहीं दे पा रहा। कृपया पुनः प्रयास करें।"
        : "Sorry, I couldn't process that. Please try again.")

    return NextResponse.json({ reply })
  } catch (error: any) {
    console.error("AI chat error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
