import { detectControlCommand } from "./control-commands"
import { detectAssistantIntent } from "./intents"
import { normalizeAssistantText } from "./text"

// This restricted channel cannot confirm a write or interpret arbitrary page text.
// The wake name is deliberately never included in controller-generated prompts.
export function parseSpokenInterruption(transcript: string, output: string, language: string): string | null {
  const input = normalizeAssistantText(transcript)
  const spoken = normalizeAssistantText(output)
  if (spoken.includes(input)) return null
  const match = transcript.trim().match(/^(?:rural\s*health|रूरल\s*हेल्थ|রুরাল\s*হেলথ|ரூரல்\s*ஹெல்த்|రూరల్\s*హెల్త్|રૂરલ\s*હેલ્થ|ರೂರೆಲ್\s*ಹೆಲ್ತ್|ਰੂਰਲ\s*ਹੈਲਥ|റൂറൽ\s*ഹെൽത്ത്|رورل\s*ہیلتھ)[,:\s]+(.+)$/iu)
  if (!match) return null
  const request = match[1].trim()
  const command = detectControlCommand(request, language)
  if (command && ["cancelTask", "newRequest", "question"].includes(command.key)) return request
  const intent = detectAssistantIntent(request, language).intent
  return intent === "stop" || intent === "emergency" ? request : null
}
