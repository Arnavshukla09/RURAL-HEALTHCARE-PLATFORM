import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { normalizeQuery } from "@/lib/chat/normalize"

const ChatCacheSchema = z.object({
  question: z.string().min(3).max(500),
  answer: z.string().min(5).max(3000),
  lang: z.enum(["en", "hi"]).default("en"),
})

// PII patterns: phone numbers, 12-digit Aadhaar-like numbers, emails, name declarations
const PII_PATTERNS = [
  /\b[6-9]\d{9}\b/, // Indian mobile numbers
  /\b\d{4}\s?\d{4}\s?\d{4}\b/, // 12-digit Aadhaar-like numbers
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, // Email addresses
  /\b(my name is|mera naam hai)\s+[A-Za-z\u0900-\u097F]+/i, // Direct name declaration
]

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = ChatCacheSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 })
    }

    const { question, answer, lang } = parsed.data

    // Reject any submission containing potential PII
    for (const pattern of PII_PATTERNS) {
      if (pattern.test(question)) {
        return NextResponse.json(
          { error: "Submission rejected: Personal identifiable information (PII) detected." },
          { status: 422 }
        )
      }
    }

    const normalized = normalizeQuery(question)

    const { error } = await supabase.from("chat_cache").insert({
      question,
      normalized_question: normalized,
      lang,
      answer,
      source: "gemini",
      status: "pending",
    })

    if (error) {
      // Gracefully handle if table does not yet exist
      console.warn("[/api/chat-cache] Supabase insert skipped:", error.message)
      return NextResponse.json({ success: false, reason: "table_unavailable" }, { status: 200 })
    }

    return NextResponse.json({ success: true, status: "pending" })
  } catch (err: any) {
    console.error("[/api/chat-cache] Exception:", err)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
