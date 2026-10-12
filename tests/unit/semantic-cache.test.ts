import { describe, it, expect, beforeEach } from "vitest"
import {
  extractMedicalConcepts,
  getCanonicalConceptKey,
  calculateSemanticSimilarity,
  saveToSemanticMemory,
  findSemanticMatchInMemory,
} from "@/lib/ai/semantic-matcher"

describe("Option 1: Semantic Caching Layer", () => {
  it("extracts identical canonical medical concepts from English and Hinglish phrases", () => {
    const enTokens = extractMedicalConcepts("I have high fever and severe chills")
    const hiTokens = extractMedicalConcepts("mujhe tez bukhar aur thand lag rahi hai")

    expect(enTokens).toContain("fever")
    expect(enTokens).toContain("chills")

    expect(hiTokens).toContain("fever")
    expect(hiTokens).toContain("chills")
  })

  it("produces identical canonical concept keys for rephrased queries with same meaning", () => {
    const key1 = getCanonicalConceptKey("I have fever and chills")
    const key2 = getCanonicalConceptKey("High temperature with shivering")

    expect(key1).toBeTruthy()
    expect(key1).toBe(key2)
  })

  it("calculates high similarity (>= 0.70) for paraphrased symptom inquiries", () => {
    const tokensA = ["fever", "cough", "cold"]
    const tokensB = ["fever", "cough", "cold", "throat"]
    const score = calculateSemanticSimilarity(tokensA, tokensB)

    expect(score).toBeGreaterThanOrEqual(0.70)
  })

  it("serves cached bilingual response when rephrased query is asked", () => {
    const originalQuery = "I have severe fever and chills"
    const cachedResponse = {
      replyEn: "Stay hydrated with ORS, rest, and monitor your temperature.",
      replyHi: "ओआरएस से शरीर में पानी की कमी न होने दें, आराम करें और तापमान मापें।",
      cachedAt: Date.now(),
      model: "gemini-2.5-flash",
    }

    saveToSemanticMemory(originalQuery, cachedResponse)

    // Different sentence with identical meaning
    const rephrasedQuery = "High temperature and shivering"
    const result = findSemanticMatchInMemory(rephrasedQuery)

    expect(result.match).not.toBeNull()
    expect(result.match?.replyEn).toBe(cachedResponse.replyEn)
    expect(result.match?.replyHi).toBe(cachedResponse.replyHi)
    expect(result.confidence).toBeGreaterThanOrEqual(0.70)
  })

  it("does not match completely unrelated medical queries", () => {
    const result = findSemanticMatchInMemory("severe knee pain and fracture")
    expect(result.match).toBeNull()
  })
})
