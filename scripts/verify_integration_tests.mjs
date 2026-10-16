#!/usr/bin/env node
/**
 * scripts/verify_integration_tests.mjs
 *
 * Verifies that the live database integration suite actually executed
 * real tests against the database and did not skip tests silently.
 *
 * Exits with code 1 if:
 * - The test report does not exist or cannot be parsed.
 * - numPassedTests < minExpected (default: 12).
 * - numSkippedTests > 0.
 * - numFailedTests > 0.
 */

import fs from "node:fs";
import path from "node:path";

const reportPath = process.argv[2] || "vitest-integration-report.json";
const minExpectedTests = parseInt(process.argv[3] || "12", 10);

console.log(`\n============================================================`);
console.log(`  🛡️  INTEGRATION TEST VERIFICATION GATE                     `);
console.log(`============================================================`);
console.log(`Report target: ${reportPath}`);
console.log(`Minimum expected passed tests: ${minExpectedTests}`);

if (!fs.existsSync(reportPath)) {
  console.error(`\n❌ ERROR: Test report file not found at: ${reportPath}`);
  console.error(`Vitest did not produce the expected JSON output.\n`);
  process.exit(1);
}

let report;
try {
  const content = fs.readFileSync(reportPath, "utf8");
  report = JSON.parse(content);
} catch (err) {
  console.error(`\n❌ ERROR: Failed to parse test report JSON:`, err.message);
  process.exit(1);
}

const numTotal = report.numTotalTests ?? 0;
const numPassed = report.numPassedTests ?? 0;
const numFailed = report.numFailedTests ?? 0;
const numPending = report.numPendingTests ?? 0; // pending / skipped in jest/vitest JSON format

console.log(`Summary: Total: ${numTotal} | Passed: ${numPassed} | Failed: ${numFailed} | Skipped/Pending: ${numPending}`);

// Search specifically for integration test files
const testResults = report.testResults || [];
let liveSuiteFound = false;
let liveSkipped = 0;
let livePassed = 0;
let liveFailed = 0;

for (const suite of testResults) {
  const normalizedPath = suite.name.replace(/\\/g, "/");
  if (normalizedPath.includes("tests/integration/rls-care-relationship.test")) {
    liveSuiteFound = true;
    for (const assertion of suite.assertionResults || []) {
      if (assertion.status === "passed") livePassed++;
      else if (assertion.status === "failed") liveFailed++;
      else if (assertion.status === "skipped" || assertion.status === "pending" || assertion.status === "todo") {
        liveSkipped++;
        console.warn(`  ⚠️ Skipped test: "${assertion.title}"`);
      }
    }
  }
}

if (!liveSuiteFound) {
  console.error(`\n❌ ERROR: Live RLS integration test suite ('tests/integration/rls-care-relationship.test.ts') was not found in results!`);
  process.exit(1);
}

console.log(`Live Suite Details: ${livePassed} passed, ${liveSkipped} skipped, ${liveFailed} failed.`);

if (liveFailed > 0 || numFailed > 0) {
  console.error(`\n❌ ERROR: Integration tests failed (${liveFailed} live failed, ${numFailed} total failed).`);
  process.exit(1);
}

if (liveSkipped > 0) {
  console.error(`\n❌ ERROR: Live database tests were skipped (${liveSkipped} skipped tests detected)!`);
  console.error(`In live CI mode (REQUIRE_DB=1), skipping tests is strictly prohibited.`);
  process.exit(1);
}

if (livePassed < minExpectedTests) {
  console.error(`\n❌ ERROR: Insufficient tests executed. Expected at least ${minExpectedTests}, but only ${livePassed} passed.`);
  process.exit(1);
}

console.log(`\n✔ PASS: All ${livePassed} live integration tests executed cleanly against database (0 skipped).\n`);
process.exit(0);
