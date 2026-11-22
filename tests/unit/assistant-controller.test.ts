import { describe, expect, it } from "vitest"
import { ASSISTANT_LANGUAGES } from "@/lib/assistant/languages"
import { CONTROL_KEYS, CONTROL_PROMPTS } from "@/lib/assistant/control-catalog"
import { MEDIA_LABELS } from "@/lib/assistant/media-control-catalog"
import { FACILITY_WORDS } from "@/lib/assistant/facility-control-catalog"
import { detectControlCommand } from "@/lib/assistant/control-commands"
import { detectAssistantIntent } from "@/lib/assistant/intents"
import { AssistantTaskLifetime } from "@/lib/assistant/task-lifetime"
import registrations from "@/lib/assistant/registered-controls.json"
import { parseSpokenInterruption } from "@/lib/assistant/interruption"

describe("website controller", () => {
  it("restricts spoken barge-in to wake-prefixed interruption, ignores echo and never accepts confirmations", () => {
    expect(parseSpokenInterruption("RuralHealth cancel task", "Choose a doctor", "en")).toBe("cancel task")
    expect(parseSpokenInterruption("RuralHealth new request health information", "Choose a doctor", "en")).toBe("new request health information")
    expect(parseSpokenInterruption("रूरल हेल्थ कार्य रद्द करो", "डॉक्टर चुनें", "hi")).toBe("कार्य रद्द करो")
    expect(parseSpokenInterruption("cancel task", "Choose a doctor", "en")).toBeNull()
    expect(parseSpokenInterruption("RuralHealth yes", "Choose a doctor", "en")).toBeNull()
    expect(parseSpokenInterruption("RuralHealth book appointment", "Choose a doctor", "en")).toBeNull()
    expect(parseSpokenInterruption("RuralHealth cancel task", "A record says RuralHealth cancel task", "en")).toBeNull()
  })
  it("ships complete native controller catalogs and commands for every advertised language", () => {
    for (const { code } of ASSISTANT_LANGUAGES) {
      expect(Object.keys(CONTROL_PROMPTS[code])).toEqual([...CONTROL_KEYS])
      expect(Object.values(CONTROL_PROMPTS[code]).every(value => typeof value === "string" && value.length > 0)).toBe(true)
      expect(MEDIA_LABELS[code]).toHaveLength(12)
      expect(FACILITY_WORDS[code]).toHaveLength(6)
      for (const key of ["increaseFont", "decreaseFont", "contrastOn", "contrastOff", "cancelTask", "options", "question", "nextField"] as const) expect(detectControlCommand(CONTROL_PROMPTS[code][key], code)?.key).toBe(key)
      expect(detectControlCommand(CONTROL_PROMPTS[code].question + " 123", code)?.rest).toBe("123")
      expect(parseSpokenInterruption(`RuralHealth ${CONTROL_PROMPTS[code].cancelTask}`, "Choose a doctor", code)).toBe(CONTROL_PROMPTS[code].cancelTask)
    }
    expect(detectControlCommand("Increase the font size.", "en")).toEqual({ key: "increaseFont", rest: "" })
    expect(detectControlCommand("Cancel task.", "en")).toEqual({ key: "cancelTask", rest: "" })
    expect(detectControlCommand("cancel appointment", "en")).toBeNull()
    expect(detectAssistantIntent("cancel appointment", "en").intent).toBe("cancel_appointment")
  })
  it("aborts old reads and rejects late completion ownership without aborting a separately dispatched mutation", async () => {
    const lifetime = new AssistantTaskLifetime()
    const original = lifetime.generation, readSignal = lifetime.controller.signal
    const mutation = Promise.resolve({ status: "scheduled" })
    lifetime.replace()
    expect(readSignal.aborted).toBe(true)
    expect(lifetime.owns(original)).toBe(false)
    expect(lifetime.owns(lifetime.generation)).toBe(true)
    expect(await mutation).toEqual({ status: "scheduled" })
  })
  it("has explicit dispositions for secure fields and source controls instead of model-generated selectors", () => {
    expect(Object.keys(registrations).length).toBeGreaterThan(476)
    for (const [id, control] of Object.entries(registrations)) {
      expect(id).toMatch(/^ui\.[a-f0-9]{16}$/)
      expect(["field", "container", "confirm", "handoff", "local", "link", "assistant"]).toContain(control.policy)
      if (control.secure) expect(control.policy).toBe("handoff")
    }
  })
})
