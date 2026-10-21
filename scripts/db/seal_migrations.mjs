#!/usr/bin/env node
/**
 * scripts/db/seal_migrations.mjs
 *
 * Scans all migration files in supabase/migrations/ and ensures every file
 * has an exact SHA-256 hash appended to supabase/migrations.sha256.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'crypto';

const repoRoot = process.cwd();
const manifestPath = path.join(repoRoot, 'supabase', 'migrations.sha256');
const migrationsDir = path.join(repoRoot, 'supabase', 'migrations');

if (!fs.existsSync(manifestPath)) {
  console.error('❌ Missing manifest file:', manifestPath);
  process.exit(1);
}

const existingContent = fs.readFileSync(manifestPath, 'utf8');
const manifestFiles = new Set(
  existingContent
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => path.basename(l.split(/\s+/)[1]))
);

const allFiles = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

let appended = 0;
let newContent = existingContent.trimEnd() + '\n';

for (const file of allFiles) {
  if (!manifestFiles.has(file)) {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
    const hash = crypto.createHash('sha256').update(content, 'utf8').digest('hex');
    const line = `${hash}  supabase/migrations/${file}\n`;
    newContent += line;
    console.log(`✔ Sealed ${file} -> ${hash}`);
    appended++;
  }
}

if (appended > 0) {
  fs.writeFileSync(manifestPath, newContent, 'utf8');
  console.log(`\n🎉 Successfully sealed ${appended} new migration(s) into migrations.sha256.`);
} else {
  console.log('\n✔ All migrations already sealed.');
}
