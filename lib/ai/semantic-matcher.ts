/**
 * lib/ai/semantic-matcher.ts
 *
 * Ultra-fast in-memory and Redis-backed semantic query normalizer & similarity matcher.
 * Provides Option 1 semantic caching: catches rephrased queries with identical medical meaning
 * (e.g. "I have fever and chills" vs "High temperature with shivering" vs "mujhe bukhar aur thand lag rahi hai")
 * and serves the cached bilingual response in < 2ms without querying Gemini LLM or burning quota.
 */

import { normalizeQuery } from "@/lib/chat/normalize"
import { CachedAIResponse } from "@/lib/cache/response-cache"

// Standardized canonical concept map
const MEDICAL_CONCEPT_MAPPINGS: Record<string, string> = {
  // Fever & Chills
  fever: "fever",
  bukhar: "fever",
  bukhaar: "fever",
  temperature: "fever",
  tapman: "fever",
  pyrexia: "fever",
  shivering: "chills",
  shiver: "chills",
  chills: "chills",
  chill: "chills",
  thand: "chills",
  thandi: "chills",
  rigors: "chills",

  // Pain & Aches
  pain: "pain",
  dard: "pain",
  ache: "pain",
  headache: "headache",
  sirdard: "headache",
  "sir dard": "headache",
  sardard: "headache",
  "sar dard": "headache",
  migraine: "headache",
  stomach: "stomach",
  belly: "stomach",
  abdomen: "stomach",
  abdominal: "stomach",
  pet: "stomach",
  petdard: "stomach_pain",
  "stomach pain": "stomach_pain",
  "pet dard": "stomach_pain",
  "chest pain": "chest_pain",
  "seene me dard": "chest_pain",
  "seene mein dard": "chest_pain",
  "chhati me dard": "chest_pain",
  "chhati mein dard": "chest_pain",

  // Respiratory
  cough: "cough",
  khasi: "cough",
  khaansi: "cough",
  cold: "cold",
  zukam: "cold",
  jukam: "cold",
  sardi: "cold",
  phlegm: "mucus",
  balgam: "mucus",
  mucus: "mucus",
  sore: "sore",
  gala: "throat",
  throat: "throat",
  breathing: "breath",
  breathlessness: "dyspnea",
  "shortness of breath": "dyspnea",
  "saans phoolna": "dyspnea",
  asthma: "asthma",
  dama: "asthma",

  // Gastrointestinal
  diarrhea: "diarrhea",
  dast: "diarrhea",
  "loose motion": "diarrhea",
  loosemotion: "diarrhea",
  vomit: "vomit",
  vomiting: "vomit",
  ulti: "vomit",
  nausea: "nausea",
  matli: "nausea",
  constipation: "constipation",
  kabj: "constipation",
  acidity: "acidity",
  gas: "acidity",
  bloating: "acidity",
  afara: "acidity",

  // Chronic & Systemic
  diabetes: "diabetes",
  sugar: "diabetes",
  madhumeh: "diabetes",
  hypertension: "hypertension",
  bp: "hypertension",
  "high bp": "hypertension",
  pressure: "hypertension",
  infection: "infection",
  sankraman: "infection",
  weakness: "fatigue",
  kamzori: "fatigue",
  fatigue: "fatigue",
  tiredness: "fatigue",
   चक्कर: "dizziness",
  dizziness: "dizziness",
  giddiness: "dizziness",
  chakkar: "dizziness",
  rash: "rash",
  itching: "itching",
  khujli: "itching",
  allergy: "allergy",
  burn: "burn",
  jalna: "burn",
  cut: "wound",
  chot: "wound",
  injury: "wound",
  wound: "wound",
}

const STOP_WORDS = new Set([
  "i", "me", "my", "myself", "we", "our", "you", "your", "he", "she", "they",
  "have", "has", "had", "having", "am", "is", "are", "was", "were", "be", "been",
  "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", "while",
  "of", "at", "by", "for", "with", "about", "against", "between", "into", "through",
  "during", "before", "after", "above", "below", "to", "from", "up", "down", "in",
  "out", "on", "off", "over", "under", "again", "further", "then", "once", "here",
  "there", "when", "where", "why", "how", "all", "any", "both", "each", "few",
  "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own",
  "same", "so", "than", "too", "very", "can", "will", "just", "should", "now",
  "high", "low", "severe", "mild", "tez", "bahut", "heavy", "slight", "bad", "extreme",
  "feel", "feeling", "got", "getting", "having", "suffer", "suffering",
  "mujhe", "mera", "meri", "mere", "hum", "humein", "hai", "hain", "tha", "thi",
  "the", "ho", "raha", "rahi", "rahe", "lag", "aa", "kya", "kare", "karna", "chahiye",
  "please", "help", "doctor", "dr", "tell", "batao", "batayein", "bataiye"
])

/**
 * Extracts normalized canonical medical tokens from freeform English/Hindi/Hinglish text.
 */
export function extractMedicalConcepts(rawQuery: string): string[] {
  if (!rawQuery) return []

  const normalized = normalizeQuery(rawQuery).toLowerCase()
  const tokens = normalized
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))

  const concepts = new Set<string>()

  // 1. Multi-word phrase matches
  for (const [phrase, canonical] of Object.entries(MEDICAL_CONCEPT_MAPPINGS)) {
    if (phrase.includes(" ") && normalized.includes(phrase)) {
      concepts.add(canonical)
    }
  }

  // 2. Single token matches
  for (const token of tokens) {
    if (MEDICAL_CONCEPT_MAPPINGS[token]) {
      concepts.add(MEDICAL_CONCEPT_MAPPINGS[token])
    } else {
      concepts.add(token)
    }
  }

  return Array.from(concepts).sort()
}

/**
 * Creates a deterministic canonical concept key for fast indexed lookup.
 * Example: "I have fever and chills" -> "rhp:sem:v1:chills+fever"
 * Example: "High temperature with shivering" -> "rhp:sem:v1:chills+fever"
 */
export function getCanonicalConceptKey(rawQuery: string): string | null {
  const concepts = extractMedicalConcepts(rawQuery)
  if (concepts.length === 0) return null
  return `rhp:sem:v1:${concepts.join("+")}`
}

/**
 * Calculate Jaccard-Dice hybrid similarity between two token sets.
 * Returns a score between 0.0 and 1.0.
 */
export function calculateSemanticSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0
  const setB = new Set(tokensB)
  let intersection = 0
  for (const t of tokensA) {
    if (setB.has(t)) intersection++
  }
  return (2 * intersection) / (tokensA.length + tokensB.length)
}

/**
 * In-memory LRU Semantic Cache Store (active within the serverless instance lifespan)
 */
interface SemanticCacheEntry {
  canonicalKey: string
  concepts: string[]
  response: CachedAIResponse
  lastAccessed: number
}

const IN_MEMORY_SEMANTIC_CACHE = new Map<string, SemanticCacheEntry>()
const MAX_IN_MEMORY_ENTRIES = 200
const SIMILARITY_THRESHOLD = 0.70

/**
 * Match a query against stored semantic representations.
 * Checks:
 * 1. Exact canonical concept key match (O(1)).
 * 2. Token overlap similarity >= 0.70 against recent concepts.
 */
export function findSemanticMatchInMemory(query: string): { match: CachedAIResponse | null; confidence: number } {
  const concepts = extractMedicalConcepts(query)
  if (concepts.length === 0) return { match: null, confidence: 0 }

  const canonicalKey = `rhp:sem:v1:${concepts.join("+")}`

  // 1. Direct canonical hit
  if (IN_MEMORY_SEMANTIC_CACHE.has(canonicalKey)) {
    const entry = IN_MEMORY_SEMANTIC_CACHE.get(canonicalKey)!
    entry.lastAccessed = Date.now()
    return { match: entry.response, confidence: 1.0 }
  }

  // 2. Similarity scan over stored concepts
  let bestScore = 0
  let bestEntry: SemanticCacheEntry | null = null

  for (const entry of IN_MEMORY_SEMANTIC_CACHE.values()) {
    const score = calculateSemanticSimilarity(concepts, entry.concepts)
    if (score > bestScore) {
      bestScore = score
      bestEntry = entry
    }
  }

  if (bestEntry && bestScore >= SIMILARITY_THRESHOLD) {
    bestEntry.lastAccessed = Date.now()
    return { match: bestEntry.response, confidence: bestScore }
  }

  return { match: null, confidence: bestScore }
}

/**
 * Save an AI response to the semantic cache.
 */
export function saveToSemanticMemory(query: string, response: CachedAIResponse): void {
  const concepts = extractMedicalConcepts(query)
  if (concepts.length === 0) return

  const canonicalKey = `rhp:sem:v1:${concepts.join("+")}`

  if (IN_MEMORY_SEMANTIC_CACHE.size >= MAX_IN_MEMORY_ENTRIES) {
    // Evict oldest accessed entry
    let oldestKey: string | null = null
    let oldestTime = Infinity
    for (const [k, v] of IN_MEMORY_SEMANTIC_CACHE.entries()) {
      if (v.lastAccessed < oldestTime) {
        oldestTime = v.lastAccessed
        oldestKey = k
      }
    }
    if (oldestKey) IN_MEMORY_SEMANTIC_CACHE.delete(oldestKey)
  }

  IN_MEMORY_SEMANTIC_CACHE.set(canonicalKey, {
    canonicalKey,
    concepts,
    response,
    lastAccessed: Date.now()
  })
}
