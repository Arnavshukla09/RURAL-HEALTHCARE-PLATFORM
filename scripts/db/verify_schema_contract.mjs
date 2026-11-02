#!/usr/bin/env node
/**
 * scripts/db/verify_schema_contract.mjs
 *
 * Verifies that a database schema snapshot matches the expected schema contract.
 * Specifically guards against provider foreign key drift (N1), cascading delete flaws (N2),
 * and legacy permissive policy exposure (V1).
 *
 * Usage:
 *   node scripts/db/verify_schema_contract.mjs [path-to-snapshot.json]
 *   If no path is provided, reads from stdin or default snapshot location.
 */

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const contractPath = path.join(repoRoot, 'supabase', 'expected_schema_contract.json');

if (!fs.existsSync(contractPath)) {
  console.error(`❌ FATAL: Contract definition missing at ${contractPath}`);
  process.exit(1);
}

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

// Determine snapshot input
let snapshotData = null;
const argPath = process.argv[2];

if (argPath && fs.existsSync(argPath)) {
  const content = fs.readFileSync(argPath, 'utf8');
  snapshotData = JSON.parse(content);
} else {
  // Check if standard snapshot exists or read stdin
  const defaultSnapshot = path.join(repoRoot, 'docs', 'schema_snapshots', 'production_latest.json');
  if (fs.existsSync(defaultSnapshot)) {
    snapshotData = JSON.parse(fs.readFileSync(defaultSnapshot, 'utf8'));
  } else {
    console.error('❌ Please provide path to schema snapshot JSON or pipe data via stdin.');
    console.error('Usage: node scripts/db/verify_schema_contract.mjs <snapshot.json>');
    process.exit(1);
  }
}

console.log('\n============================================================');
console.log('  🛡️  DATABASE SCHEMA CONTRACT VERIFICATION GATE            ');
console.log('============================================================');

let violations = 0;

// 1. Verify Foreign Keys
console.log('\n[1/3] Verifying Foreign Key Target Tables & Delete Rules...');
const actualFks = snapshotData.foreign_keys || [];

for (const expectedFk of contract.foreign_keys) {
  const match = actualFks.find(
    (fk) =>
      fk.table_name === expectedFk.table_name &&
      fk.column_name === expectedFk.column_name
  );

  if (!match) {
    console.error(
      `  ✖ MISSING FOREIGN KEY: ${expectedFk.table_name}.${expectedFk.column_name} -> ${expectedFk.foreign_table_name}`
    );
    violations++;
    continue;
  }

  if (match.foreign_table_name !== expectedFk.foreign_table_name) {
    console.error(
      `  ✖ FK TARGET DRIFT on ${expectedFk.table_name}.${expectedFk.column_name}:`
    );
    console.error(`     Expected target: ${expectedFk.foreign_table_name}`);
    console.error(`     Actual target:   ${match.foreign_table_name}`);
    violations++;
  } else if (expectedFk.delete_rule && match.delete_rule !== expectedFk.delete_rule) {
    console.error(
      `  ✖ ON DELETE ACTION MISMATCH on ${expectedFk.table_name}.${expectedFk.column_name}:`
    );
    console.error(`     Expected rule: ${expectedFk.delete_rule}`);
    console.error(`     Actual rule:   ${match.delete_rule}`);
    violations++;
  } else {
    console.log(
      `  ✔ ${expectedFk.table_name}.${expectedFk.column_name} -> ${match.foreign_table_name} (${match.delete_rule})`
    );
  }
}

// 2. Verify Disallowed / Legacy Policies
console.log('\n[2/3] Checking for Disallowed / Vulnerable Policies...');
const actualPolicies = snapshotData.policies || [];

for (const disallowed of contract.disallowed_policies || []) {
  const match = actualPolicies.find(
    (p) =>
      p.tablename === disallowed.table_name &&
      p.policyname === disallowed.policy_name
  );

  if (match) {
    console.error(
      `  ✖ DISALLOWED POLICY ACTIVE: "${disallowed.policy_name}" on table "${disallowed.table_name}"`
    );
    violations++;
  } else {
    console.log(`  ✔ Clean: "${disallowed.policy_name}" is NOT active.`);
  }
}

// 3. Verify Required Indexes
console.log('\n[3/3] Checking Required Indexes...');
const actualIndexes = snapshotData.indexes || [];

for (const reqIdx of contract.required_indexes || []) {
  const match = actualIndexes.find(
    (idx) =>
      idx.tablename === reqIdx.table_name &&
      idx.indexname === reqIdx.index_name
  );

  if (!match) {
    console.error(
      `  ✖ MISSING REQUIRED INDEX: "${reqIdx.index_name}" on table "${reqIdx.table_name}"`
    );
    violations++;
  } else {
    console.log(`  ✔ Found: ${reqIdx.table_name}.${reqIdx.index_name}`);
  }
}

console.log('------------------------------------------------------------');
if (violations > 0) {
  console.error(`❌ CONTRACT CHECK FAILED with ${violations} violation(s).\n`);
  process.exit(1);
} else {
  console.log('✔ CONTRACT CHECK PASSED: Schema strictly conforms to contract.\n');
  process.exit(0);
}
