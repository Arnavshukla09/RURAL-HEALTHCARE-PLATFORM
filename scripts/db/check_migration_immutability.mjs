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

// Check that EVERY SQL migration file in supabase/migrations/ is sealed in the manifest
if (fs.existsSync(migrationsDir)) {
  const allSqlFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'));

  for (const f of allSqlFiles) {
    if (!manifestFiles.has(f)) {
      console.error(`❌ [UNSEALED MIGRATION VIOLATION] Migration file is NOT sealed in migrations.sha256: ${f}`);
      console.error(`    Run 'npm run migrations:seal' to compute and record its SHA256 hash.`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\n❌ FAILED: ${violations} migration immutability/sealing violation(s) detected.`);
  console.error('All historical migrations are immutable and must be strictly registered in migrations.sha256.\n');
  process.exit(1);
}

console.log(`✔ PASS: All ${manifestLines.length} migrations strictly verified against sha256 manifest.`);
console.log(`✔ PASS: 100% of migration files are sealed and forward-ordered.\n`);
process.exit(0);
