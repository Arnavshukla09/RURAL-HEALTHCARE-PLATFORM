/**
 * lib/chat/normalize.ts
 *
 * Robust text normalization and Hindi/Hinglish token mapper for medical QA.
 */

const HINGLISH_SYNONYMS: Record<string, string> = {
  // Fever
  bukhar: "fever",
  bukhaar: "fever",
  tezbukhar: "high fever",
  "tez bukhar": "high fever",
  tapman: "temperature",
  thand: "chills",
  thandi: "chills",

  // Pain
  dard: "pain",
  "sir dard": "headache",
  sirdard: "headache",
  "sar dard": "headache",
  sardard: "headache",
  "pet dard": "stomach pain",
  petdard: "stomach pain",
  "seene mein dard": "chest pain",
  "chhati mein dard": "chest pain",
  seena: "chest",

  // Gastro
  dast: "diarrhea",
  "loose motion": "diarrhea",
  loosemotion: "diarrhea",
  ulti: "vomiting",
  matli: "nausea",
  kabj: "constipation",
  gas: "bloating",
  afara: "bloating",

  // Respiratory
  khasi: "cough",
  khaansi: "cough",
  zukam: "cold",
  jukam: "cold",
  sardi: "cold",
  saans: "breathing",
  "saans phoolna": "shortness of breath",
  "saans lene me takleef": "shortness of breath",

  // Diet
  tikha: "spicy",
  teekha: "spicy",
  masaledar: "spicy",
  khana: "food",
  bhojan: "diet",
  doodh: "milk",
  dahi: "curd",
  paani: "water",
}

export function normalizeQuery(raw: string): string {
  if (!raw) return ""

  // 1. Lowercase and normalize Devanagari numerals
  let str = raw
    .toLowerCase()
    .replace(/[०-९]/g, (d) => String("०१२३४५६७८९".indexOf(d)))
    .replace(/[।,!?।;:#$%^&*()[\]{}'"]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  // 2. Expand multi-word Hinglish phrases
  for (const [key, replacement] of Object.entries(HINGLISH_SYNONYMS)) {
    if (key.includes(" ")) {
      const regex = new RegExp(`\\b${key}\\b`, "gi")
      str = str.replace(regex, replacement)
    }
  }

  // 3. Tokenize and map single-word synonyms
  const tokens = str.split(" ").map((token) => HINGLISH_SYNONYMS[token] || token)

  return tokens.join(" ")
}

/**
 * Strips raw markdown bold asterisks (**) from text responses to keep
 * chat messages clean and readable without exposing raw markdown syntax.
 */
export function cleanMarkdown(text: string): string {
  if (!text) return ""
  return text
    // Replace **bold** with plain bold text (strip **)
    .replace(/\*\*(.*?)\*\*/g, "$1")
    // Replace stray double asterisks
    .replace(/\*\*/g, "")
    // Normalize any triple asterisks
    .replace(/\*\*\*/g, "")
    .trim()
}

