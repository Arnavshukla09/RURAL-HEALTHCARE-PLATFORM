#!/usr/bin/env node
/** Fail closed unless both local database suites execute with no skipped or failed tests. */
import fs from "node:fs"

const reportPath = process.argv[2] || "vitest-integration-report.json"
const minExpectedTests = Number(process.argv[3] || "29")
const requiredSuites = new Map([
  ["rls-care-relationship.test.ts", 23],
  ["offline-atomic-replay.test.ts", 6],
])

function fail(message) { console.error("Integration verification failed: " + message); process.exit(1) }
if (!Number.isInteger(minExpectedTests) || minExpectedTests < 29) fail("Minimum must include all 29 database and safety cases")
if (!fs.existsSync(reportPath)) fail("JSON report is missing")
let report
try { report = JSON.parse(fs.readFileSync(reportPath, "utf8")) }
catch { fail("JSON report cannot be parsed") }
if (report.numFailedTests !== 0 || report.numPendingTests !== 0) fail("Failed or skipped tests were reported")
if (!Array.isArray(report.testResults)) fail("Test results are missing")

let passed = 0
for (const [filename, minimum] of requiredSuites) {
  const suite = report.testResults.find(item => typeof item.name === "string" && item.name.replace(/\\/g, "/").endsWith("/tests/integration/" + filename))
  if (!suite || !Array.isArray(suite.assertionResults)) fail("Required suite " + filename + " is missing")
  if (suite.assertionResults.some(assertion => assertion.status !== "passed")) fail(filename + " includes failed, skipped or incomplete assertions")
  if (suite.assertionResults.length < minimum) fail(filename + " ran fewer than " + minimum + " required cases")
  passed += suite.assertionResults.length
  console.log(filename + ": " + suite.assertionResults.length + " passed, zero skipped")
}
if (passed < minExpectedTests || report.numPassedTests < minExpectedTests) fail("Fewer than " + minExpectedTests + " cases passed")
console.log("All " + passed + " required integration cases passed against the disposable local database")
