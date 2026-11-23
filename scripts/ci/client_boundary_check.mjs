import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const files = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : /\.(tsx?|mjs)$/.test(entry.name) ? [path.join(dir, entry.name)] : [])
const graph = new Map()
const resolve = (file, spec) => {
  const base = spec.startsWith('@/') ? path.resolve(spec.slice(2)) : spec.startsWith('.') ? path.resolve(path.dirname(file), spec) : null
  return base && [base + '.ts', base + '.tsx', base + '.mjs', path.join(base, 'index.ts'), path.join(base, 'index.tsx')].find(file => fs.existsSync(file))
}
const all = [...files('app'), ...files('components'), ...files('lib')].map(file => path.resolve(file))
for (const file of all) {
  const source = fs.readFileSync(file, 'utf8'), imports = []
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier) && !node.isTypeOnly && !(node.importClause?.isTypeOnly)) { const target = resolve(file, node.moduleSpecifier.text); if (target) imports.push(target) }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(node.arguments[0])) { const target = resolve(file, node.arguments[0].text); if (target) imports.push(target) }
    ts.forEachChild(node, visit)
  }
  visit(tree); graph.set(file, { source, imports })
}
const entries = all.filter(file => /^\s*["']use client["']/m.test(graph.get(file).source))
const findings = [], seen = new Set(), pending = [...entries]
while (pending.length) {
  const file = pending.pop(); if (seen.has(file)) continue; seen.add(file)
  const value = graph.get(file); if (!value) continue
  const relative = path.relative(process.cwd(), file).replaceAll('\\', '/')
  if (relative.startsWith('lib/services/') || relative === 'lib/supabase/admin.ts' || relative.startsWith('app/api/')) findings.push({ file: relative, kind: 'server-module-reachable-from-client' })
  // Env key names only: no environment values are accessed by this checker.
  const forbidden = [...value.source.matchAll(/process\.env\.(SUPABASE_SERVICE_ROLE_KEY|VOICE_SERVICE_URL|VOICE_SERVICE_TOKEN|ASSISTANT_CONFIRMATION_SECRET|DOCTOR_CLAIM_SECRET|ABDM_CLIENT_SECRET|BHASHINI_API_KEY|GEMINI_API_KEY|UPSTASH_REDIS_REST_TOKEN|JITSI_APP_SECRET|JAAS_API_KEY|HF_TOKEN)\b/g)]
  if (forbidden.length) findings.push({ file: relative, kind: 'server-secret-reference-in-client-graph' })
  pending.push(...value.imports)
}
console.log(JSON.stringify({ clientEntries: entries.length, reachableModules: seen.size, findings }))
if (findings.length) process.exitCode = 1
