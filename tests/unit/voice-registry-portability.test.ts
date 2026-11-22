import { describe, expect, it } from "vitest"
import { sameVoiceRegistrations } from "../../scripts/data/voice_registry_compare.mjs"
import registrations from "@/lib/assistant/registered-controls.json"

describe("cross-platform voice coverage gate", () => {
  it("accepts identical targets when Linux/Windows directory and property order differ", () => {
    const reversed = Object.fromEntries(Object.entries(registrations).reverse().map(([id, entry]) => [id, Object.fromEntries(Object.entries(entry).reverse())]))
    expect(JSON.stringify(reversed)).not.toBe(JSON.stringify(registrations)) // Reproduces the former comparison failure.
    expect(sameVoiceRegistrations(registrations, reversed)).toBe(true)
  })
  it("ignores source line movement while preserving stable target identity", () => {
    const moved = Object.fromEntries(Object.entries(registrations).map(([id, entry]) => [id, { ...entry, line: entry.line + 50 }]))
    expect(sameVoiceRegistrations(registrations, moved)).toBe(true)
    const missing = { ...moved }; delete missing[Object.keys(missing)[0]]
    expect(sameVoiceRegistrations(registrations, missing)).toBe(false)
  })
  it("still rejects changed security, disposition and source properties", () => {
    const id = Object.keys(registrations)[0] as keyof typeof registrations
    const entry = registrations[id]
    for (const change of [{ policy: "local" }, { secure: !entry.secure }, { file: "components/Other.tsx" }]) {
      expect(sameVoiceRegistrations(registrations, { ...registrations, [id]: { ...entry, ...change } })).toBe(false)
    }
  })
})
