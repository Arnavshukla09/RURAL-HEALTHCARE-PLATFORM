/** Isolated local source mutations, always restored; no database or network operations. */
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
const checks = [
  { name: 'production-demo-claim-bypass', file: 'lib/doctor-claims.ts', before: 'process.env.NODE_ENV === "production" || ', after: '', test: 'tests/unit/doctor-claim-and-booking-lifecycle.test.ts', expected: 'rejects all browser-local demo' },
  { name: 'public-provider-select-all', file: 'app/api/providers/route.ts', before: '.select("id, name, phone, location, specialization, bio, avatar_url, is_verified")', after: '.select("*")', test: 'tests/unit/public-directory-security.test.ts', expected: 'selects explicit public directory' },
  { name: 'foreign-preview-origin', file: 'lib/security/request-origin.ts', before: 'if (supplied.origin === request.origin) return true', after: 'if (supplied.hostname.endsWith(".vercel.app")) return true', test: 'tests/unit/request-origin-security.test.ts', expected: 'allows the request\'s own preview' },
  { name: 'internal-capability-leak', file: 'lib/services/voice-response.ts', before: 'return { available: data.available', after: 'return { ...data, available: data.available', test: 'tests/unit/assistant-voice-proxy.test.ts', expected: 'exposes only canonical capabilities' },
  { name: 'upstream-redirect-follow', file: 'lib/services/assistant-voice.service.ts', before: 'redirect: "error"', after: 'redirect: "follow"', test: 'tests/unit/assistant-voice-proxy.test.ts', expected: 'exposes only canonical capabilities' },
]
const run = test => spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', test, '--reporter=verbose'], { encoding: 'utf8', timeout: 90000, env: { ...process.env, NODE_ENV: 'test' } })
const evidence = []
for (const check of checks) {
  const original = fs.readFileSync(check.file, 'utf8')
  if (!original.includes(check.before)) throw new Error(`Mutation location absent: ${check.name}`)
  let failed
  try { fs.writeFileSync(check.file, original.replace(check.before, check.after)); failed = run(check.test) }
  finally { fs.writeFileSync(check.file, original) }
  const restored = run(check.test)
  const trace = (failed.stdout + failed.stderr).includes(check.expected)
  evidence.push({ mutation: check.name, source: check.file, test: check.test, mutantExit: failed.status, restoredExit: restored.status, expectedFailureObserved: trace })
  if (failed.status === 0 || restored.status !== 0 || !trace) throw new Error(`Mutation proof incomplete: ${check.name}`)
}
fs.mkdirSync('docs/reports', { recursive: true })
fs.writeFileSync('docs/reports/SECURITY_MUTATIONS.json', JSON.stringify({ date: '2026-11-23', scope: 'Isolated behavioral unit mutations; source restored; no secrets/request contents in report', evidence }, null, 2) + '\n')
console.log(JSON.stringify(evidence))
