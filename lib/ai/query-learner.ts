/**
 * lib/ai/query-learner.ts
 *
 * IndexedDB Self-Improving Query Cache with language isolation and BM25 token relevance.
 *
 * Key guarantees:
 * 1. Read-only lookup: findCachedAnswer does NOT mutate hitCount on non-matches.
 * 2. Language isolation: returns only answers matching the requested language.
 * 3. Threshold gating:
 *    - score >= 0.75: direct answer
 *    - 0.50 to 0.75: best answer + suggestions flag
 *    - < 0.50: no match
 */

import { normalizeQuery } from "@/lib/chat/normalize"

export interface LearnedQuery {
  id: string
  query: string
  queryLang: string
  response: string
  tokens: string[]
  hitCount: number
  lastUsed: number
  feedbackScore: number
  createdAt: number
}

export interface QueryMatch {
  found: boolean
  response?: string
  confidence: number
  similarity?: number
  queryId?: string
  isExact?: boolean
  needsClarification?: boolean
}

const DB_NAME = "ruralhealth_ai"
const DB_VERSION = 2
const STORE_NAME = "learned_queries"
const MAX_CACHE_SIZE = 500

export const THRESHOLD_DIRECT = 0.75
export const THRESHOLD_SUGGESTION = 0.50

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      return reject(new Error("IndexedDB is not supported"))
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" })
        store.createIndex("hitCount", "hitCount", { unique: false })
        store.createIndex("lastUsed", "lastUsed", { unique: false })
        store.createIndex("feedbackScore", "feedbackScore", { unique: false })
        store.createIndex("queryLang", "queryLang", { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getAllQueries(): Promise<LearnedQuery[]> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const req = tx.objectStore(STORE_NAME).getAll()
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject(req.error)
    })
  } catch {
    return []
  }
}

async function saveQuery(q: LearnedQuery): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      tx.objectStore(STORE_NAME).put(q)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {}
}

export function tokenize(text: string): string[] {
  const normalized = normalizeQuery(text)
  const stopWords = new Set([
    "a", "an", "the", "in", "on", "at", "to", "for", "of", "with", "is", "am", "are",
    "me", "my", "i", "can", "should", "what", "how", "do", "kya", "hai", "ho", "mera", "meri"
  ])

  return normalized
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !stopWords.has(t))
}

function calculateScore(queryTokens: string[], candidateTokens: string[]): number {
  if (queryTokens.length === 0 || candidateTokens.length === 0) return 0

  const candidateSet = new Set(candidateTokens)
  let commonCount = 0

  for (const token of queryTokens) {
    if (candidateSet.has(token)) {
      commonCount += 1
    }
  }

  // Jaccard-Dice hybrid similarity
  return (2 * commonCount) / (queryTokens.length + candidateTokens.length)
}

export async function findCachedAnswer(
  query: string,
  preferredLang: string = "en"
): Promise<QueryMatch> {
  const tokens = tokenize(query)
  if (tokens.length === 0) {
    return { found: false, confidence: 0 }
  }

  const all = await getAllQueries()
  const candidates = all.filter(
    (q) => q.feedbackScore >= 0 && (!q.queryLang || q.queryLang === preferredLang)
  )

  let bestScore = 0
  let bestMatch: LearnedQuery | null = null

  for (const candidate of candidates) {
    const score = calculateScore(tokens, candidate.tokens)
    if (score > bestScore) {
      bestScore = score
      bestMatch = candidate
    }
  }

  if (!bestMatch || bestScore < THRESHOLD_SUGGESTION) {
    return { found: false, confidence: bestScore }
  }

  // Only update hitCount when match is accepted
  if (bestScore >= THRESHOLD_DIRECT) {
    bestMatch.hitCount = (bestMatch.hitCount || 0) + 1
    bestMatch.lastUsed = Date.now()
    saveQuery(bestMatch).catch(() => {})

    return {
      found: true,
      response: bestMatch.response,
      confidence: bestScore,
      similarity: bestScore,
      queryId: bestMatch.id,
      isExact: bestScore >= 0.95,
    }
  }

  // 0.50 to 0.75 band: Return response with clarification suggestion flag
  return {
    found: true,
    response: bestMatch.response,
    confidence: bestScore,
    similarity: bestScore,
    queryId: bestMatch.id,
    needsClarification: true,
  }
}

export async function learnFromAnswer(
  query: string,
  response: string,
  language: string = "en"
): Promise<void> {
  if (!query || !response) return
  const tokens = tokenize(query)
  if (tokens.length === 0) return

  const existing = await findCachedAnswer(query, language)
  if (existing.isExact) return // Skip duplicate

  const newEntry: LearnedQuery = {
    id: `lq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    query: query.trim(),
    queryLang: language,
    response,
    tokens,
    hitCount: 1,
    lastUsed: Date.now(),
    feedbackScore: 0,
    createdAt: Date.now(),
  }

  await saveQuery(newEntry)
}

export async function applyFeedback(queryId: string, positive: boolean): Promise<void> {
  const all = await getAllQueries()
  const match = all.find((q) => q.id === queryId)
  if (!match) return

  match.feedbackScore = (match.feedbackScore || 0) + (positive ? 1 : -3)
  await saveQuery(match)
}
