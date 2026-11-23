import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'

const root = process.cwd()
const runtime = JSON.parse(fs.readFileSync('lib/assistant/registered-controls.json', 'utf8'))
const relative = file => path.relative(root, file).replaceAll('\\', '/')
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name)
    return entry.isDirectory() ? files(file) : /\.(ts|tsx)$/.test(file) ? [file] : []
  })
}
function resolve(from, spec) {
  if (!spec.startsWith('@/') && !spec.startsWith('.')) return null
  const base = spec.startsWith('@/') ? path.join(root, spec.slice(2)) : path.resolve(path.dirname(from), spec)
  return [base + '.tsx', base + '.ts', path.join(base, 'index.tsx'), path.join(base, 'index.ts')].find(file => fs.existsSync(file)) || null
}
const elements = new Set(['button', 'a', 'input', 'textarea', 'select', 'form', 'Button', 'Input', 'Textarea', 'Select', 'SelectTrigger', 'SelectItem', 'Checkbox', 'RadioGroupItem', 'Switch', 'TabsTrigger', 'DialogTrigger', 'DropdownMenuItem'])
const eventNames = new Set(['onClick', 'onChange', 'onValueChange', 'onSubmit', 'onSelect', 'onCheckedChange'])
const graph = new Map()
function read(file) {
  if (graph.has(file)) return graph.get(file)
  const source = fs.readFileSync(file, 'utf8')
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const imports = new Set(), controls = []
  const short = text => text.replace(/\s+/g, ' ').trim().slice(0, 150)
  function names(expression) {
    if (!expression) return []
    if (ts.isIdentifier(expression)) return [expression.text]
    const values = new Set()
    function visit(node) {
      if (ts.isCallExpression(node)) {
        const name = node.expression.getText(parsed)
        if (/^[\w$.?!]+$/.test(name)) values.add(name)
      }
      ts.forEachChild(node, visit)
    }
    visit(expression)
    return [...values]
  }
  function label(node) {
    if (ts.isJsxText(node)) return short(node.text)
    if (ts.isJsxExpression(node)) {
      if (!node.expression) return ''
      const text = node.expression.getText(parsed)
      return text.length < 150 && !text.includes('=>') ? '{' + short(text) + '}' : '[dynamic content]'
    }
    if (ts.isJsxElement(node)) return node.children.map(label).filter(Boolean).join(' ').slice(0, 150)
    return ''
  }
  function walk(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const target = resolve(file, node.moduleSpecifier.text)
      if (target) imports.add(target)
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(node.arguments[0])) {
      const target = resolve(file, node.arguments[0].text)
      if (target) imports.add(target)
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(parsed)
      const attributes = node.attributes.properties.filter(ts.isJsxAttribute)
      const find = name => attributes.find(attribute => attribute.name.getText(parsed) === name)?.initializer
      const attribute = name => {
        const value = find(name)
        return value ? ts.isStringLiteral(value) ? value.text : short(value.getText(parsed)) : null
      }
      const handlers = attributes.filter(attribute => eventNames.has(attribute.name.getText(parsed)))
      const isWrapper = tag === 'Button' && attributes.some(attribute => attribute.name.getText(parsed) === 'asChild')
      if (!isWrapper && (elements.has(tag) || handlers.length)) {
        let owner = '', current = node.parent
        while (current && !owner) {
          if (ts.isFunctionDeclaration(current)) owner = current.name?.text || ''
          if (ts.isVariableDeclaration(current)) owner = current.name.getText(parsed)
          current = current.parent
        }
        const position = parsed.getLineAndCharacterOfPosition(node.getStart(parsed))
        const line = position.line + 1, column = position.character + 1
        const text = ts.isJsxOpeningElement(node) && ts.isJsxElement(node.parent) ? node.parent.children.map(label).filter(Boolean).join(' ').slice(0, 150) : ''
        const fieldType = attribute('type')
        const fieldId = attribute('id') || attribute('name')
        controls.push({
          runtimeId: attribute('data-voice-control'), voicePolicy: runtime[attribute('data-voice-control')]?.policy || 'unregistered',
          id: relative(file) + ':' + line + ':' + column, file: relative(file), line, column, owner, tag,
          label: attribute('aria-label') || attribute('label') || attribute('placeholder') || text || fieldId || '[unlabelled/dynamic]',
          fieldId, fieldType, secureField: /password/i.test((fieldType || '') + (fieldId || '')),
          events: handlers.map(item => ({ event: item.name.getText(parsed), handlers: names(ts.isJsxExpression(item.initializer) ? item.initializer.expression : item.initializer) })),
          href: attribute('href'), disabled: attribute('disabled'),
          hasDirectHandler: handlers.length > 0 || !!find('href') || fieldType === 'submit',
        })
      }
    }
    ts.forEachChild(node, walk)
  }
  walk(parsed)
  const data = { imports: [...imports], controls, sha256: crypto.createHash('sha256').update(source).digest('hex') }
  graph.set(file, data)
  return data
}
function reachable(start) {
  const seen = new Set(), pending = [start]
  while (pending.length) {
    const file = pending.pop()
    if (seen.has(file)) continue
    seen.add(file)
    pending.push(...read(file).imports)
  }
  return seen
}
const pageFiles = files(path.join(root, 'app')).filter(file => path.basename(file) === 'page.tsx')
const globals = reachable(path.join(root, 'app/layout.tsx'))
const routes = pageFiles.map(file => ({ route: '/' + relative(path.dirname(file)).replace(/^app\/?/, ''), entry: relative(file), reachable: reachable(file) }))
const componentFiles = files(path.join(root, 'components')).filter(file => !relative(file).startsWith('components/ui/'))
for (const file of componentFiles) read(file)
const all = [...graph.entries()].flatMap(([file, data]) => data.controls.map(control => ({ ...control, global: globals.has(file), routes: routes.filter(route => route.reachable.has(file)).map(route => route.route) })))
const controls = all.filter(control => !control.file.startsWith('components/ui/') && (control.global || control.routes.length))
const unmapped = all.filter(control => !control.file.startsWith('components/ui/') && !control.global && !control.routes.length)
const commit = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const catalog = {
  sourceState: 'Implementation working tree; file hashes identify the scanned sources. generatedFromCommit is the base commit before this update.',
  sourceHashes: Object.fromEntries([...graph.entries()].map(([file, data]) => [relative(file), data.sha256])),
  generatedFromCommit: commit, generatedAt: '2026-11-23', scope: 'Static first-party JSX interactive-control candidates, including forms/containers and local import reachability; no live DOM, authorization or runtime multiplicity certification',
  exclusions: ['Shared UI primitives', 'Native browser/OS dialogs', 'Third-party Leaflet/Jitsi internals', 'Generated dependencies/builds'],
  counts: { routes: routes.length, controls: controls.length, globalControls: controls.filter(item => item.global).length, filesWithControls: new Set(controls.map(item => item.file)).size, unreachableTemplates: unmapped.length },
  routes: routes.map(route => ({ route: route.route, entry: route.entry, localControls: controls.filter(control => !control.global && control.routes.includes(route.route)).length })),
  controls, unreachableTemplates: unmapped,
}
fs.writeFileSync('docs/HANDS_FREE_CONTROL_INVENTORY.json', JSON.stringify(catalog, null, 2) + '\n')
const escape = value => String(value || '—').replaceAll('|', '\\|').replaceAll('\n', ' ')
const table = items => ['| Source / line | Control | Label or expression | Existing handler(s) | Registered target / disposition |', '|---|---|---|---|---|', ...items.map(item => `| ${item.file}:${item.line} | ${item.tag}${item.secureField ? ' (secure)' : ''} | ${escape(item.label)} | ${escape(item.events.flatMap(event => event.handlers).join(', ') || (item.href ? 'link navigation' : item.fieldType === 'submit' ? 'parent form submission' : 'no direct handler: inspect wiring'))} | ${item.runtimeId || 'unregistered'} / ${item.voicePolicy} |`)].join('\n')
const markdown = [
  '# Hands-free control inventory', '', `Source commit: \`${commit}\`. Generated 23 November 2026.`, '',
  '**Implemented source registration inventory, not device or end-to-end coverage certification.** These are static JSX templates; one facility-card template may render many buttons. A reachable template can be hidden or disabled at runtime. Dispositions include executable controls, containers, avatar-owned controls and explicit handoffs. Role permissions must be evaluated by the server and active UI state.', '',
  `Scanned ${catalog.counts.routes} page entries, ${catalog.counts.controls} reachable control templates in ${catalog.counts.filesWithControls} source files, including ${catalog.counts.globalControls} shared/global templates.`, '',
  'The inventory excludes input values, credentials and conversation data. Handler names and label expressions are source references. Native dialogs and third-party widget controls need separate adapters/exclusions. File/line/column IDs identify audit candidates, not future stable runtime action IDs. The JSON companion preserves these IDs and route associations.', '',
  '## Global controls', '', table(controls.filter(item => item.global)), '',
  ...routes.flatMap(route => [`## ${route.route}`, '', `Entry: \`${route.entry}\`. Local reachable templates: ${catalog.routes.find(item => item.route === route.route).localControls}. Shared controls are listed once above.`, '', table(controls.filter(item => !item.global && item.routes.includes(route.route))), '']),
  '## Templates with no page import path', '', 'These require manual review before promising functionality; they may be unused, mounted through configuration, or intended for future screens.', '', table(unmapped), '',
]
fs.writeFileSync('docs/HANDS_FREE_CONTROL_INVENTORY.md', markdown.join('\n'))
console.log(JSON.stringify(catalog.counts))
console.log(JSON.stringify(catalog.routes))
