import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { message, imageBase64, language, history } = await req.json()
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    const systemPrompt = `You are a medical AI assistant for a rural healthcare platform in India. Analyze symptoms, images of skin conditions/wounds/rashes, and provide:
1. Possible conditions with likelihood
2. Severity: mild, moderate, severe, or emergency
3. Recommended specialist
4. First-aid steps
5. Red flags
Always recommend professional consultation. Respond in ${language === "hi" ? "Hindi" : "English"}.
Return JSON: { "response": "text", "severity": "mild|moderate|severe|emergency", "conditions": [], "specialist": "type" }`

    const parts: any[] = [{ text: systemPrompt }]
    if (history?.length) history.forEach((m: any) => parts.push({ text: `${m.role === "user" ? "Patient" : "AI"}: ${m.content}` }))
    parts.push({ text: `Patient: ${message}` })
    if (imageBase64) parts.push({ inlineData: { mimeType: "image/jpeg", data: imageBase64 } })

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } }),
    })

    if (!res.ok) return NextResponse.json({ error: "AI service error" }, { status: 500 })
    const data = await res.json()
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return NextResponse.json({ response: parsed.response || aiText, severity: parsed.severity || "moderate", conditions: parsed.conditions || [], specialist: parsed.specialist || "General Physician" })
      }
    } catch {}

    return NextResponse.json({ response: aiText, severity: "moderate", conditions: [], specialist: "General Physician" })
  } catch (error) {
    console.error("AI chat error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
