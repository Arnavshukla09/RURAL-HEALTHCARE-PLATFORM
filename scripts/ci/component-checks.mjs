import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const DATA_CATALOGS = new Set([
  'lib/data/real-doctors.ts',
  'lib/data/annual-campaigns.ts',
  'lib/schemes/health-schemes.ts',
  'lib/emergency/helplines.ts',
  'lib/i18n/translations.ts',
  'lib/ai/clinical-dataset.ts',
])
const SOURCE_DIRS = ['app', 'components', 'lib', 'hooks', 'types']
const normalize = value => value.replaceAll('\\', '/')

export function sourceFiles(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name)
    return entry.isDirectory() ? sourceFiles(file) : /\.(ts|tsx|js|jsx|mjs)$/.test(file) ? [file] : []
  })
}

export function lineLimit(relative) {
  const file = normalize(relative)
  if (file.startsWith('components/ui/') || DATA_CATALOGS.has(file)) return null
  if (file.startsWith('app/api/')) return 149
  if (['app/', 'components/', 'lib/'].some(prefix => file.startsWith(prefix))) return 400
  return null
}

export function localImports(tree) {
  const imports = []
  function visit(node) {
    let specifier
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) specifier = node.moduleSpecifier
    else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) specifier = node.arguments[0]
    if (specifier && ts.isStringLiteral(specifier) && /^(?:@\/|\.\.?\/)/.test(specifier.text)) {
      imports.push({ specifier: specifier.text, line: tree.getLineAndCharacterOfPosition(specifier.getStart(tree)).line + 1 })
    }
    ts.forEachChild(node, visit)
  }
  visit(tree)
  return imports
}

export function hasExport(tree) {
  return tree.statements.some(node =>
    ts.isExportDeclaration(node) || ts.isExportAssignment(node) ||
    node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)
  )
}

function importExists(root, file, specifier) {
  const resolved = specifier.startsWith('@/')
    ? path.resolve(root, specifier.slice(2))
    : path.resolve(path.dirname(file), specifier)
  return ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.css', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'].some(suffix => {
    const candidate = resolved + suffix
    return fs.existsSync(candidate) && fs.statSync(candidate).isFile()
  })
}

export function inspectSource(root = process.cwd()) {
  const files = SOURCE_DIRS.flatMap(dir => sourceFiles(path.join(root, dir)))
  const findings = []
  for (const file of files) {
    const relative = normalize(path.relative(root, file))
    const content = fs.readFileSync(file, 'utf8')
    const tree = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true)
    for (const item of localImports(tree)) {
      if (!importExists(root, file, item.specifier)) findings.push({ file: relative, ...item, kind: 'unresolved-import' })
    }
    if (relative.startsWith('components/') && relative.endsWith('.tsx') && !hasExport(tree)) {
      findings.push({ file: relative, kind: 'missing-export' })
    }
    const limit = lineLimit(relative)
    const lines = content.split(/\r?\n/).length
    if (limit !== null && lines > limit) findings.push({ file: relative, kind: 'module-size', lines, limit })
  }
  return { files: files.length, findings }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = inspectSource()
  console.log(JSON.stringify(report, null, 2))
  if (report.findings.length) process.exitCode = 1
}
