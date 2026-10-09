import { type NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { answerMedicalQuery } from "@/lib/ai/medical-brain"

/**
 * POST /api/ai-chat
 * Server-side Gemini chat for the floating health assistant.
 * Keeps the API key server-side (never exposed to client).
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"
    if (!(await rateLimit(ip))) {
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

    // Provide a few-shot example to force the model to mimic the exact output format
    // without outputting any rule evaluations or checklists.
    const contents: any[] = [
      { 
        role: "user", 
        parts: [{ text: systemPrompt + "\n\nUser: My symptoms are: Headache, fever 101F, duration 2 days. Urgency: medium. What should I do?" }] 
      },
      { 
        role: "model", 
        parts: [{ text: "This could be a viral infection.\n\n• Drink plenty of water and rest.\n• Take a light diet.\n• Visit your nearest Primary Health Centre (PHC) or speak with your local ASHA worker for a proper check-up.\n• If your fever rises above 103°F or you experience severe pain, call 108 immediately." }] 
      },
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

    // Try models in order of speed and availability
    const candidateModels = [
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash-8b",
      "gemini-2.0-flash-lite",
      "gemini-1.5-pro",
    ]

    let reply: string | null = null
    let lastErrorDetails = ""

    for (const model of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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

        if (response.ok) {
          const data = await response.json()
          reply = data.candidates?.[0]?.content?.parts?.[0]?.text || null
          if (reply) break
        } else {
          lastErrorDetails = await response.text()
          console.warn(`Model ${model} failed (${response.status}):`, lastErrorDetails)
        }
      } catch (err: any) {
        lastErrorDetails = err.message || String(err)
        console.warn(`Model ${model} fetch exception:`, lastErrorDetails)
      }
    }

    if (!reply) {
      // 1. Try Clinical Medical Brain first for domain-specific medical answering
      const clinicalReply = answerMedicalQuery(message, language)

      const fallbackReply =
        clinicalReply ||
        (language === "hi"
          ? "नमस्ते! यदि आपको तेज बुखार, सांस लेने में तकलीफ या गंभीर लक्षण हैं, तो तुरंत नजदीकी स्वास्थ्य केंद्र (PHC) या 108 पर संपर्क करें। सामान्य लक्षणों के लिए पर्याप्त आराम करें, ओआरएस या हल्का भोजन लें।"
          : "Hello! For your health and safety: If you are experiencing high fever, chest pain, or severe difficulty breathing, please consult your nearest Primary Health Centre (PHC) or call 108 immediately. For mild symptoms, rest adequately, hydrate with ORS, and take light bland meals.")

      return NextResponse.json({
        reply: fallbackReply,
        fallback: true,
        details: lastErrorDetails,
      })
    }

    return NextResponse.json({ reply })
  } catch (error: any) {
    console.error("AI chat error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
