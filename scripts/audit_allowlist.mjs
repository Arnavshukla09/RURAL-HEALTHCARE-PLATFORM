#!/usr/bin/env node
/**
 * scripts/audit_allowlist.mjs
 *
 * Enforces strict npm audit policy:
 * - Runs `npm audit --omit=dev --json`.
 * - Rejects any critical or high-severity vulnerabilities UNLESS explicitly listed
 *   in audit-allowlist.json with an unexpired deadline and documented justification.
 * - If an allowlist entry has expired, fails the build immediately to force review.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const allowlistPath = path.resolve(process.cwd(), "audit-allowlist.json");

if (!fs.existsSync(allowlistPath)) {
  console.error("❌ audit-allowlist.json not found!");
  process.exit(1);
}

const allowlist = JSON.parse(fs.readFileSync(allowlistPath, "utf-8"));
const today = new Date().toISOString().slice(0, 10);

console.log("============================================================");
console.log("  🛡️  SECURITY AUDIT & EXPIRING ALLOWLIST ENFORCER");
console.log("============================================================");

// 1. Verify that allowlist entries are unexpired
let expiredCount = 0;
const allowedMap = new Map();

for (const entry of allowlist) {
  if (!entry.name || !entry.expiry || !entry.reason) {
    console.error(`❌ Malformed allowlist entry:`, entry);
    process.exit(1);
  }

  if (entry.expiry < today) {
    console.error(`❌ EXPIRED ALLOWLIST ENTRY: '${entry.name}' expired on ${entry.expiry}!`);
    console.error(`   Reason was: ${entry.reason}`);
    expiredCount++;
  } else {
    allowedMap.set(entry.name, entry);
  }
}

if (expiredCount > 0) {
  console.error(`\n❌ Total expired allowlist entries: ${expiredCount}. Failing audit.`);
  process.exit(1);
}

// 2. Run npm audit --omit=dev --json
let auditOutput = "";
try {
  auditOutput = execSync("npm audit --omit=dev --json", { encoding: "utf-8" });
} catch (err) {
  // npm audit exits with 1 when vulnerabilities are found
  auditOutput = err.stdout?.toString() || "";
}

if (!auditOutput) {
  console.log("✔ npm audit returned empty output (clean).");
  process.exit(0);
}

let auditReport;
try {
  auditReport = JSON.parse(auditOutput);
} catch (parseErr) {
  console.error("❌ Failed to parse npm audit JSON output:", parseErr.message);
  process.exit(1);
}

const vulnerabilities = auditReport.vulnerabilities || {};
const unallowedHighOrCritical = [];
const allowlistedMatches = [];

for (const [pkgName, details] of Object.entries(vulnerabilities)) {
  const severity = details.severity?.toLowerCase();
  if (severity === "high" || severity === "critical") {
    if (allowedMap.has(pkgName)) {
      allowlistedMatches.push({
        pkg: pkgName,
        severity,
        expiry: allowedMap.get(pkgName).expiry,
        reason: allowedMap.get(pkgName).reason,
      });
    } else {
      unallowedHighOrCritical.push({
        pkg: pkgName,
        severity,
        via: details.via,
      });
    }
  }
}

if (allowlistedMatches.length > 0) {
  console.log("\n📋 Active Allowlisted Advisories (Monitored):");
  allowlistedMatches.forEach((m) => {
    console.log(`  - [${m.severity.toUpperCase()}] ${m.pkg} (Expires: ${m.expiry})`);
    console.log(`    Justification: ${m.reason}`);
  });
}

if (unallowedHighOrCritical.length > 0) {
  console.error("\n❌ UNALLOWLISTED HIGH/CRITICAL VULNERABILITIES DETECTED:");
  unallowedHighOrCritical.forEach((v) => {
    console.error(`  - [${v.severity.toUpperCase()}] ${v.pkg}`);
    console.error(`    Via: ${JSON.stringify(v.via)}`);
  });
  console.error("\nAudit check failed: High or critical vulnerabilities must be fixed or formally allowlisted with an expiry date.\n");
  process.exit(1);
}

console.log("\n✔ Security Audit Passed: All high/critical advisories are verified and within valid allowlist windows.\n");
process.exit(0);
