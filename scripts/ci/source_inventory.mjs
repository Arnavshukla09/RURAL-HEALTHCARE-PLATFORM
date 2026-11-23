import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
const files = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name).replaceAll('\\', '/')])
const routes = files('app/api').filter(file => file.endsWith('/route.ts')).map(file => {
  const source = fs.readFileSync(file, 'utf8'), tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)
  const methods = tree.statements.filter(node => ts.isFunctionDeclaration(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)).map(node => node.name?.text).filter(name => ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'HEAD'].includes(name))
  return { path: file.replace(/^app/, '').replace(/\/route.ts$/, ''), methods, source: file }
})
const docs = files('docs').filter(file => file.endsWith('.md'))
const sourceCounts = Object.fromEntries(['app', 'components', 'lib', 'services/voice', 'tests', 'scripts'].map(dir => [dir, files(dir).filter(file => /\.(tsx?|m?js|py)$/.test(file)).length]))
const report = { date: '2026-11-23', baseCommit: 'd4aeb5f', scope: 'Current source inventory; no deployment identifiers, request data or environment values', pageEntries: files('app').filter(file => file.endsWith('/page.tsx')).length, apiRoutes: routes.length, sourceCounts, docs: docs.length, routes }
fs.mkdirSync('docs/reports', { recursive: true })
fs.writeFileSync('docs/reports/SOURCE_INVENTORY.json', JSON.stringify(report, null, 2) + '\n')
fs.writeFileSync('docs/CURRENT_ENDPOINTS.md', '# Current HTTP surface\n\nGenerated from exported route handlers, 23 November 2026. Public paths are necessary for the website; their names are not credentials. Internal voice service origins and secrets remain server-only. See [FINAL_AUDIT.md](FINAL_AUDIT.md) for protection and verification limits.\n\n| Application path | Methods | Source |\n|---|---|---|\n' + routes.map(route => `| \`${route.path}\` | ${route.methods.join(', ')} | \`${route.source}\` |`).join('\n') + '\n')
console.log(JSON.stringify({ pageEntries: report.pageEntries, apiRoutes: report.apiRoutes, sourceCounts, docs: docs.length }))
