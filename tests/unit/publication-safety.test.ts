import { describe, expect, it } from "vitest"
import { scanPublicationText } from "../../scripts/ci/publication_safety.mjs"
describe("publication secret protection", () => {
  it("reports metadata only and catches secrets inside documentation or test content", () => {
    const candidate = ["ghp_", "A".repeat(36)].join("")
    const report = scanPublicationText(`Example documentation\napi token: ${candidate}`)
    expect(report).toEqual([{ kind: "provider-token", line: 2 }])
    expect(JSON.stringify(report)).not.toContain(candidate)
  })
  it("rejects deployment identifiers while allowing generic setup examples", () => {
    const host = "https://" + "a".repeat(20) + ".supabase.co"
    expect(scanPublicationText(host)).toHaveLength(1)
    expect(scanPublicationText("https://your-project.supabase.co")).toHaveLength(0)
  })
})
