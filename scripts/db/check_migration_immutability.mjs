import fs from 'node:fs';
import path from 'node:path';
import crypto from 'crypto';

const repoRoot = process.cwd();
const manifestPath = path.join(repoRoot, 'supabase', 'migrations.sha256');
const migrationsDir = path.join(repoRoot, 'supabase', 'migrations');

console.log('\n============================================================');
console.log('  🛡️  DATABASE MIGRATION IMMUTABILITY & ORDERING GATE       ');
console.log('============================================================');

if (!fs.existsSync(manifestPath)) {
  console.error(`❌ FATAL: Migration immutability manifest missing at ${manifestPath}`);
  process.exit(1);
}

const manifestContent = fs.readFileSync(manifestPath, 'utf8');
const manifestLines = manifestContent
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'));

if (manifestLines.length === 0) {
  console.error(`❌ FATAL: Migration manifest is empty at ${manifestPath}`);
  process.exit(1);
}

let violations = 0;
const manifestFiles = new Set();
let highestBaselineTimestamp = '';

for (const line of manifestLines) {
  const parts = line.split(/\s+/);
  if (parts.length < 2) {
    console.error(`❌ Invalid manifest line: "${line}"`);
    violations++;
    continue;
  }

  const expectedHash = parts[0].toLowerCase();
  const relPath = parts[1];
  manifestFiles.add(path.basename(relPath));

  const matchTs = path.basename(relPath).match(/^(\d{14})/);
  if (matchTs && matchTs[1] > highestBaselineTimestamp) {
    highestBaselineTimestamp = matchTs[1];
  }

  const absPath = path.join(repoRoot, relPath);
  if (!fs.existsSync(absPath)) {
    console.error(`❌ [IMMUTABILITY VIOLATION] Baseline migration deleted or missing: ${relPath}`);
    violations++;
    continue;
  }

  const fileContent = fs.readFileSync(absPath, 'utf8').replace(/\r\n/g, '\n');
  const actualHash = crypto.createHash('sha256').update(fileContent, 'utf8').digest('hex');

  if (actualHash !== expectedHash) {
    console.error(`❌ [IMMUTABILITY VIOLATION] Baseline migration has been modified in-place:`);
    console.error(`    File:     ${relPath}`);
    console.error(`    Expected: ${expectedHash}`);
    console.error(`    Actual:   ${actualHash}`);
    violations++;
  }
}

// Check that any new migration strictly respects forward-timestamp append-only rules
if (fs.existsSync(migrationsDir)) {
  const allSqlFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'));

  for (const f of allSqlFiles) {
    if (!manifestFiles.has(f)) {
      const match = f.match(/^(\d{14})/);
      if (!match) {
        console.error(`❌ [NAMING VIOLATION] Migration file does not follow standard 14-digit timestamp: ${f}`);
        violations++;
      } else {
        const fileTs = match[1];
        if (fileTs < highestBaselineTimestamp) {
          console.error(
            `❌ [ORDERING VIOLATION] New migration is retroactively timestamped before baseline (${fileTs} < ${highestBaselineTimestamp}): ${f}`
          );
          violations++;
        }
      }
    }
  }
}

if (violations > 0) {
  console.error(`\n❌ FAILED: ${violations} migration immutability violation(s) detected.`);
  console.error('All historical migrations are immutable. Any database modifications MUST be created');
  console.error('as forward-only, append-only migrations with timestamps after the baseline.\n');
  process.exit(1);
}

console.log(`✔ PASS: All ${manifestLines.length} baseline migrations verified against sha256 manifest.`);
console.log(`✔ PASS: Append-only ordering verified (baseline cutoff: ${highestBaselineTimestamp}).\n`);
process.exit(0);
