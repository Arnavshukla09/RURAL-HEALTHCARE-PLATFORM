import { describe, expect, it } from "vitest"
import { execFileSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"

const suite = (name: string, count: number) => ({ name: `/workspace/tests/integration/${name}`, assertionResults: Array.from({ length: count }, (_, index) => ({ title: `case ${index}`, status: "passed" })) })
const report = () => ({ numPassedTests: 29, numFailedTests: 0, numPendingTests: 0, testResults: [suite("rls-care-relationship.test.ts", 23), suite("offline-atomic-replay.test.ts", 6)] })
function verify(data: unknown) {
  const folder = mkdtempSync(path.join(os.tmpdir(), "rhcp-integration-gate-"))
  const file = path.join(folder, "report.json")
  writeFileSync(file, JSON.stringify(data))
  try {
    return execFileSync(process.execPath, [path.resolve("scripts/ci/verify_integration_tests.mjs"), file, "29"], { encoding: "utf8", stdio: "pipe" })
  } finally { rmSync(folder, { recursive: true, force: true }) }
}
describe("Required database report gate", () => {
  it("accepts both complete suites and Windows result paths", () => {
    const data = report()
    data.testResults[1].name = "C:\\workspace\\tests\\integration\\offline-atomic-replay.test.ts"
    expect(verify(data)).toContain("All 29 required integration cases passed")
  })
  it("rejects a missing atomic suite even when aggregate counts are green", () => {
    const data = report(); data.testResults.pop()
    expect(() => verify(data)).toThrow()
  })
  it("rejects skipped atomic assertions even when aggregate counts hide the skip", () => {
    const data = report(); data.testResults[1].assertionResults[0].status = "pending"
    expect(() => verify(data)).toThrow()
  })
  it("rejects skipped tests in the aggregate report", () => {
    expect(() => verify({ ...report(), numPendingTests: 1 })).toThrow()
  })
})
