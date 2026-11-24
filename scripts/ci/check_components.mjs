#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { inspectSource } from './component-checks.mjs'

const started = Date.now()
const checks = [
  ['Source imports, exports and module limits', () => {
    const report = inspectSource()
    console.log(JSON.stringify(report, null, 2))
    if (report.findings.length) throw new Error('Source structure checks failed')
  }],
  ['TypeScript', 'npm run typecheck'],
  ['ESLint', 'npm run lint'],
  ['Unit tests', 'npm run test:unit'],
  ['Migration integrity', 'npm run check:migrations'],
  ['Unused files and dependencies', 'npm run knip'],
]

const failures = []
for (const [name, action] of checks) {
  console.log(`\nChecking ${name}...`)
  try {
    if (typeof action === 'function') action()
    else execSync(action, { cwd: process.cwd(), stdio: 'inherit' })
    console.log(`PASS: ${name}`)
  } catch {
    failures.push(name)
    console.error(`FAIL: ${name}`)
  }
}

console.log(`\nQuality checks finished in ${((Date.now() - started) / 1000).toFixed(1)}s.`)
if (failures.length) {
  console.error(`Failed checks: ${failures.join(', ')}`)
  process.exitCode = 1
} else {
  console.log('All checks passed. Production build and live workflow verification are separate.')
}
