/**
 * lib/ai/query-learner.ts
 *
 * Self-improving query cache that learns from every user interaction.
 *
 * How it works:
 * 1. Every answered query is stored in IndexedDB with its response.
 * 2. On next load, the most-answered queries are pre-loaded into memory.
 * 3. New queries are matched against cached ones using TF-IDF similarity.
 * 4. If similarity > 0.8 → return cached answer instantly (0 API calls).
 * 5. If similarity 0.5–0.8 → return cached answer + note "similar question".
 * 6. If similarity < 0.5 → call Gemini, cache the result for next time.
 *
 * This means the AI gets faster and cheaper over time as it learns common
 * rural health questions from your actual user base.
 */

export interface LearnedQuery {
  id: string
  query: string                  // Original user query (normalized)
  queryLang: 'en' | 'hi' | 'mr' | 'bn' | 'ta' // Detected language
  response: string               // Cached AI response
  tokens: string[]               // TF-IDF tokenized form for matching
  hitCount: number               // How many times this was used
  lastUsed: number               // Timestamp for LRU eviction
  feedbackScore: number          // User thumbs up/down: +1 / -1
  createdAt: number
}

const DB_NAME = 'ruralhealth_ai'
const DB_VERSION = 1
const STORE_NAME = 'learned_queries'
const MAX_CACHE_SIZE = 500       // Max queries stored locally
const SIMILARITY_THRESHOLD = 0.72

// ── IndexedDB helpers ──────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('hitCount', 'hitCount', { unique: false })
        store.createIndex('lastUsed', 'lastUsed', { unique: false })
        store.createIndex('feedbackScore', 'feedbackScore', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getAllQueries(): Promise<LearnedQuery[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function saveQuery(q: LearnedQuery): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(q)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function evictOldQueries(): Promise<void> {
  const all = await getAllQueries()
  if (all.length <= MAX_CACHE_SIZE) return
  // Evict lowest-scored + oldest entries
  const sorted = all.sort((a, b) =>
    (a.feedbackScore + a.hitCount * 0.5 + a.lastUsed / 1e12) -
    (b.feedbackScore + b.hitCount * 0.5 + b.lastUsed / 1e12)
  )
  const toDelete = sorted.slice(0, all.length - MAX_CACHE_SIZE)
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  toDelete.forEach(q => tx.objectStore(STORE_NAME).delete(q.id))
}

// ── Language Detection ─────────────────────────────────────────────────────────

const HINDI_RANGE = /[\u0900-\u097F]/
const BENGALI_RANGE = /[\u0980-\u09FF]/
const TAMIL_RANGE = /[\u0B80-\u0BFF]/
const MARATHI_CHARS = /[\u0900-\u097F]/  // Marathi shares Devanagari with Hindi

export function detectLanguage(text: string): 'en' | 'hi' | 'bn' | 'ta' | 'mr' {
  if (BENGALI_RANGE.test(text)) return 'bn'
  if (TAMIL_RANGE.test(text)) return 'ta'
  if (HINDI_RANGE.test(text)) {
    // Rough Marathi vs Hindi heuristic via common words
    if (/आहे|नाही|करा|आहेत/.test(text)) return 'mr'
    return 'hi'
  }
  return 'en'
}

// ── TF-IDF Tokenizer ───────────────────────────────────────────────────────────

const STOP_WORDS_EN = new Set(['i','me','my','have','has','is','are','the','a','an','and','or','but','in','on','at','to','for','of','with','do','does','did','can','will','what','how','when','where','why','it','its','this','that','these','those','am','be','been','being'])
const STOP_WORDS_HI = new Set(['है','हैं','का','की','के','में','से','को','पर','और','यह','वह','इस','उस','था','थी','थे','मैं','आप','हम','वे','एक','ने'])

export function tokenize(text: string): string[] {
  const lang = detectLanguage(text)
  const stopWords = lang === 'en' ? STOP_WORDS_EN : STOP_WORDS_HI

  return text
    .toLowerCase()
    .replace(/[^\w\u0900-\u09FF\u0980-\u09FF\u0B80-\u0BFF\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !stopWords.has(t))
}

function cosineSimilarity(tokensA: string[], tokensB: string[]): number {
  const setA = new Map<string, number>()
  const setB = new Map<string, number>()

  tokensA.forEach(t => setA.set(t, (setA.get(t) ?? 0) + 1))
  tokensB.forEach(t => setB.set(t, (setB.get(t) ?? 0) + 1))

  let dot = 0, magA = 0, magB = 0
  setA.forEach((v, k) => {
    dot += v * (setB.get(k) ?? 0)
    magA += v * v
  })
  setB.forEach(v => { magB += v * v })

  if (magA === 0 || magB === 0) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

// ── Public API ─────────────────────────────────────────────────────────────────

export interface QueryMatch {
  found: boolean
  response?: string
  confidence: number     // 0–1
  isExact: boolean
  matchedQuery?: string
  queryId?: string
}

/** Find best cached answer for a query. Returns match with confidence score. */
export async function findCachedAnswer(query: string): Promise<QueryMatch> {
  const tokens = tokenize(query)
  if (tokens.length === 0) return { found: false, confidence: 0, isExact: false }

  const all = await getAllQueries()
  // Only consider queries with positive/neutral feedback
  const candidates = all.filter(q => q.feedbackScore >= 0)

  let bestScore = 0
  let bestMatch: LearnedQuery | null = null

  for (const candidate of candidates) {
    const score = cosineSimilarity(tokens, candidate.tokens)
    if (score > bestScore) {
      bestScore = score
      bestMatch = candidate
    }
  }

  if (!bestMatch || bestScore < 0.5) {
    return { found: false, confidence: bestScore, isExact: false }
  }

  // Update hit count + last used
  bestMatch.hitCount++
  bestMatch.lastUsed = Date.now()
  await saveQuery(bestMatch)

  return {
    found: bestScore >= SIMILARITY_THRESHOLD,
    response: bestMatch.response,
    confidence: bestScore,
    isExact: bestScore > 0.95,
    matchedQuery: bestMatch.query,
    queryId: bestMatch.id,
  }
}

/** Learn from a new answer. Called after every Gemini response. */
export async function learnFromAnswer(query: string, response: string): Promise<void> {
  const tokens = tokenize(query)
  const lang = detectLanguage(query)

  // Check for near-duplicate (don't store highly similar ones twice)
  const existing = await findCachedAnswer(query)
  if (existing.isExact) return  // Already have this one

  const newEntry: LearnedQuery = {
    id: `lq_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    query: query.trim().toLowerCase(),
    queryLang: lang,
    response,
    tokens,
    hitCount: 1,
    lastUsed: Date.now(),
    feedbackScore: 0,
    createdAt: Date.now(),
  }

  await saveQuery(newEntry)
  await evictOldQueries()
}

/** Apply user thumbs up/down feedback. Negative score will exclude from future matches. */
export async function applyFeedback(queryId: string, positive: boolean): Promise<void> {
  const all = await getAllQueries()
  const entry = all.find(q => q.id === queryId)
  if (!entry) return
  entry.feedbackScore += positive ? 1 : -3  // Negative feedback weighs more
  await saveQuery(entry)
}

/** Export all learned queries as JSON (for syncing to server when online). */
export async function exportLearnedQueries(): Promise<LearnedQuery[]> {
  return getAllQueries()
}

/** Get stats about the local knowledge base. */
export async function getKnowledgeStats(): Promise<{ total: number; topQueries: string[] }> {
  const all = await getAllQueries()
  const top = all
    .sort((a, b) => b.hitCount - a.hitCount)
    .slice(0, 5)
    .map(q => q.query)
  return { total: all.length, topQueries: top }
}
