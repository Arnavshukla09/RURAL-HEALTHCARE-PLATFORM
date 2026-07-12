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

    const systemPrompt = `You are RuralHealth AI — a compassionate, knowledgeable health assistant for rural India.

STRICT RULES:
1. ONLY answer questions about health, diseases, symptoms, medications, first aid, and medical care
2. If asked about anything unrelated to health, say: "I can only help with health-related questions. Please ask me about your symptoms, medicines, or health concerns."
3. Always respond in ${language === "hi" ? "Hindi" : "English"}
4. Keep responses concise (max 150 words) but helpful
5. For serious symptoms (chest pain, difficulty breathing, high fever >103°F, severe bleeding), ALWAYS say to call 108 or go to nearest hospital IMMEDIATELY
6. Never diagnose definitively — say "this could be..." or "this may indicate..." and recommend seeing a doctor
7. Be culturally sensitive to rural Indian context
8. Mention free/affordable treatment options: PHC (Primary Health Centre), ASHA workers, Jan Aushadhi stores, 108 ambulance
9. For emergencies, provide first aid steps AND tell them to call 108
10. You can suggest booking a consultation for non-emergency issues`

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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
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
