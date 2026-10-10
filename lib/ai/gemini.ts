/**
 * lib/ai/gemini.ts
 *
 * Server-only helper for Google Gemini API communication.
 * - Reads key exclusively from process.env.GEMINI_API_KEY
 * - Sends key securely via x-goog-api-key header (never in URL)
 * - Configurable model chain from process.env.GEMINI_MODELS
 * - 12s timeout per candidate model with AbortController
 * - Halts immediately on 401/403 (invalid / unauthorized key)
 * - Strips thought parts and internal reasoning artifacts
 * - Logs errors server-side only; never returns raw upstream error text to client
 */

export interface GeminiContentPart {
  text?: string
  thought?: boolean
}

export interface GeminiContent {
  role: "user" | "model"
  parts: GeminiContentPart[]
}

export interface GeminiCallResult {
  reply: string | null
  modelUsed: string | null
  fallback: boolean
  reason?: string
}

const DEFAULT_MODELS = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash"]
const MODEL_TIMEOUT_MS = 12000

export async function generateGeminiContent(
  contents: GeminiContent[],
  systemInstruction?: string
): Promise<GeminiCallResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      reply: null,
      modelUsed: null,
      fallback: true,
      reason: "GEMINI_API_KEY is not configured on the server",
    }
  }

  const modelEnv = process.env.GEMINI_MODELS
  const candidateModels = modelEnv
    ? modelEnv.split(",").map((m) => m.trim()).filter(Boolean)
    : DEFAULT_MODELS

  for (const model of candidateModels) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS)

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

      const payload: Record<string, any> = {
        contents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        ],
      }

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        }
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Stop immediately on authentication failure to prevent repeated bad requests
      if (response.status === 401 || response.status === 403) {
        console.error(`Gemini authentication error (${response.status}) on model ${model}`)
        return {
          reply: null,
          modelUsed: null,
          fallback: true,
          reason: "Upstream authentication error",
        }
      }

      if (response.ok) {
        const data = await response.json()
        const candidate = data.candidates?.[0]
        if (candidate?.content?.parts) {
          // Filter out internal thought parts
          const textParts = candidate.content.parts
            .filter((p: GeminiContentPart) => !p.thought && typeof p.text === "string")
            .map((p: GeminiContentPart) => p.text)

          const replyText = textParts.join("").trim()
          if (replyText) {
            return {
              reply: replyText,
              modelUsed: model,
              fallback: false,
            }
          }
        }
      } else {
        const statusText = response.status
        console.warn(`Gemini model ${model} failed with HTTP status ${statusText}`)
      }
    } catch (err: any) {
      clearTimeout(timeoutId)
      if (err.name === "AbortError") {
        console.warn(`Gemini request for model ${model} timed out after ${MODEL_TIMEOUT_MS}ms`)
      } else {
        console.warn(`Gemini request for model ${model} failed:`, err.message || err)
      }
    }
  }

  return {
    reply: null,
    modelUsed: null,
    fallback: true,
    reason: "All Gemini candidate models were exhausted or unreachable",
  }
}
