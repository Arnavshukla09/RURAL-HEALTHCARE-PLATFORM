import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const patterns = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['provider-token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|hf_[A-Za-z0-9]{24,}|sk-(?:proj-)?[A-Za-z0-9_-]{30,}|sb_secret_[A-Za-z0-9_-]{20,})\b/g],
  ['aws-access-key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ['credential-url', /https?:\/\/[^\s/@:]+:[^\s/@]+@[^\s/]+/g],
  ['deployment-id', /https:\/\/[a-z0-9]{20}\.supabase\.co/gi],
]
export function scanPublicationText(source) {
  const findings = []
  for (const [kind, pattern] of patterns) {
    pattern.lastIndex = 0
    for (const match of source.matchAll(pattern)) {
      const context = source.slice(Math.max(0, match.index - 80), match.index + match[0].length + 80)
      if (kind === 'credential-url' && /example|placeholder|user:pass/.test(context)) continue
      findings.push({ kind, line: source.slice(0, match.index).split('\n').length })
    }
  }
  const jwts = /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/g
  for (const match of source.matchAll(jwts)) {
    try {
      const payload = JSON.parse(Buffer.from(match[0].split('.')[1], 'base64url').toString('utf8'))
      if (payload.iss === 'supabase' || payload.role === 'service_role' || payload.ref) findings.push({ kind: 'supabase-jwt', line: source.slice(0, match.index).split('\n').length })
    } catch {}
  }
  return findings
}

function collectFiles() {
  const tracked = execFileSync('git', ['-c', 'core.fsmonitor=false', 'ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean)
  const changed = execFileSync('git', ['-c', 'core.fsmonitor=false', 'ls-files', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean)
  return [...new Set([...tracked, ...changed])].filter(file => /\.(?:tsx?|m?js|cjs|json|md|ya?ml|toml|py|sql|txt)$/.test(file) || file === '.env.example')
}
export function checkPublication() {
  const findings = [], files = collectFiles()
  for (const file of files) {
    if (!fs.existsSync(file) || fs.statSync(file).size > 12 * 1024 * 1024) continue
    for (const finding of scanPublicationText(fs.readFileSync(file, 'utf8'))) findings.push({ file, ...finding })
  }
  // Never print matched text, hashes of secrets, private paths or environment values.
  return { scope: 'Tracked and non-ignored source/docs; excludes ignored environment, models, builds and scratch', files: files.length, findings }
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('scripts/ci/publication_safety.mjs')) {
  const report = checkPublication()
  if (process.argv.includes('--report')) { fs.mkdirSync('docs/reports', { recursive: true }); fs.writeFileSync('docs/reports/PUBLICATION_SAFETY.json', JSON.stringify(report, null, 2) + '\n') }
  console.log(JSON.stringify({ files: report.files, findingCount: report.findings.length, findings: report.findings }))
  if (report.findings.length) process.exitCode = 1
}
