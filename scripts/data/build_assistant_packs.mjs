/** Reproducible public language packs. Contains no patient/session information. */
import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import ts from "typescript"

async function catalog(relativePath) {
  const source = await fs.readFile(path.resolve(relativePath), "utf8")
  const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
  if (/^import\s/m.test(output)) throw new Error("Public catalogs must contain only data/type imports")
  return import("data:text/javascript;base64," + Buffer.from(output).toString("base64"))
}

const [{ ASSISTANT_LANGUAGES }, { CORE_PROMPTS }, { WORKFLOW_PROMPTS }, { PRIVACY_PROMPTS }, { INTAKE_PROMPTS }, { OFFLINE_PROMPTS }, { ASSISTANT_PHRASES }, { ASSISTANT_MONTHS, ASSISTANT_EXTRA_NUMBERS }, { SYMPTOM_PHRASES }, { CONTROL_PROMPTS }, { FACILITY_WORDS }, { MEDIA_LABELS }, { PANEL_LABELS }, { MAP_LABELS }] = await Promise.all([
  catalog("lib/assistant/languages.ts"), catalog("lib/assistant/prompt-catalog.ts"), catalog("lib/assistant/workflow-prompt-catalog.ts"),
  catalog("lib/assistant/privacy-prompt-catalog.ts"), catalog("lib/assistant/intake-prompt-catalog.ts"), catalog("lib/assistant/offline-prompt-catalog.ts"), catalog("lib/assistant/phrase-catalog.ts"),
  catalog("lib/assistant/date-catalog.ts"), catalog("lib/assistant/symptom-phrase-catalog.ts"),
  catalog("lib/assistant/control-catalog.ts"), catalog("lib/assistant/facility-control-catalog.ts"), catalog("lib/assistant/media-control-catalog.ts"),
  catalog("lib/assistant/panel-labels.ts"), catalog("lib/assistant/map-labels.ts"),
])
const destination = path.resolve("public/data/assistant")
await fs.mkdir(destination, { recursive: true })
const packs = {}
for (const language of ASSISTANT_LANGUAGES) {
  const code = language.code
  const prompts = { ...CONTROL_PROMPTS[code], ...CORE_PROMPTS[code], ...WORKFLOW_PROMPTS[code], ...PRIVACY_PROMPTS[code], ...INTAKE_PROMPTS[code], ...OFFLINE_PROMPTS[code] }
  const bytes = JSON.stringify({
    version: 1, catalogRevision: 4, language, prompts, phrases: ASSISTANT_PHRASES[code], controller: CONTROL_PROMPTS[code], facilityLabels: FACILITY_WORDS[code], mediaLabels: MEDIA_LABELS[code], panelLabels: PANEL_LABELS[code], mapLabels: MAP_LABELS[code],
    vocabulary: {
      months: ASSISTANT_MONTHS[code], extraNumbers: ASSISTANT_EXTRA_NUMBERS[code], symptoms: SYMPTOM_PHRASES[code],
      intensity: { mild: INTAKE_PROMPTS[code].mild, moderate: INTAKE_PROMPTS[code].moderate, severe: INTAKE_PROMPTS[code].severe },
    },
    runtimeParsing: { module: "lib/assistant/parsing.ts", nativeDigits: true, negation: true, ageMonths: true, temperatureUnits: true, intensitySynonyms: true, scope: "Deterministic rules shipped in the cached application JavaScript; no downloaded speech model implied" },
  }) + "\n"
  await fs.writeFile(path.join(destination, language.code + ".json"), bytes, "utf8")
  packs[language.code] = { url: `/data/assistant/${language.code}.json`, sha256: crypto.createHash("sha256").update(bytes).digest("hex") }
}
await fs.writeFile(path.join(destination, "manifest.json"), JSON.stringify({ version: 1, packs }, null, 2) + "\n")
console.log(`Generated ${ASSISTANT_LANGUAGES.length} public assistant language packs`)
