/** Stamp first-party controls once; later runs verify coverage instead of renumbering. */
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import crypto from 'node:crypto'
import { sameVoiceRegistrations } from './voice_registry_compare.mjs'

const tags = new Set(['button', 'a', 'input', 'textarea', 'select', 'form', 'Button', 'Input', 'Textarea', 'Select', 'SelectTrigger', 'SelectItem', 'Checkbox', 'RadioGroupItem', 'Switch', 'TabsTrigger', 'DialogTrigger', 'DropdownMenuItem', 'Link'])
const events = new Set(['onClick', 'onChange', 'onValueChange', 'onSubmit', 'onSelect', 'onCheckedChange'])
const walkFiles = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walkFiles(path.join(dir, entry.name)) : entry.name.endsWith('.tsx') ? [path.join(dir, entry.name)] : [])
const controls = {}, apply = process.argv.includes('--register')
let missing = 0
function inferredFieldLabel(node, parsed) {
  function content(label) {
    return label.children.flatMap(child => ts.isJsxText(child) && child.text.trim() ? [JSON.stringify(child.text.replace(/\s+/g, ' ').trim())] : ts.isJsxExpression(child) && child.expression ? [child.expression.getText(parsed)] : []).join(', ')
  }
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (!ts.isJsxElement(parent)) continue
    const labels = parent.children.filter(child => ts.isJsxElement(child) && ['Label', 'label'].includes(child.openingElement.tagName.getText(parsed)))
    if (labels.length === 1) { const text = content(labels[0]); if (text) return `{[${text}].join(' ')}` }
    if (labels.length > 1 || parent.openingElement.tagName.getText(parsed) === 'form') return null
  }
  return null
}
for (const file of [...walkFiles('app'), ...walkFiles('components')].filter(file => !file.replaceAll('\\', '/').startsWith('components/ui/'))) {
  let source = fs.readFileSync(file, 'utf8')
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const edits = [], ordinals = {}
  const relative = file.replaceAll('\\', '/')
  function walk(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(parsed)
      const attributes = node.attributes.properties.filter(ts.isJsxAttribute)
      const attr = name => attributes.find(item => item.name.getText(parsed) === name)?.initializer
      const literal = name => { const value = attr(name); return value && ts.isStringLiteral(value) ? value.text : '' }
      const handlers = attributes.filter(item => events.has(item.name.getText(parsed)))
      const wrapper = tag === 'Button' && attr('asChild')
      if (!wrapper && (tags.has(tag) || handlers.length)) {
        const index = ordinals[tag] = (ordinals[tag] || 0) + 1
        const id = literal('data-voice-control') || 'ui.' + crypto.createHash('sha256').update(relative + ':' + tag + ':' + index + ':' + node.getText(parsed)).digest('hex').slice(0, 16)
        if (controls[id]) throw new Error(`Duplicate registration ${id} in ${relative}`)
        if (!attr('data-voice-control')) {
          missing++
          edits.push({ pos: node.tagName.end, text: ` data-voice-control="${id}"` })
        }
        const type = literal('type'), name = literal('name') + literal('id') + literal('autoComplete')
        const handlerText = handlers.map(item => item.getText(parsed)).join(' ')
        const secure = /password|otp|token|secret|one-time|verification.?code/i.test(type + name + handlerText)
        const field = ['input', 'Input', 'textarea', 'Textarea', 'select'].includes(tag)
        if (field && !attr('aria-label')) {
          const label = inferredFieldLabel(node, parsed)
          if (label) edits.push({ pos: node.attributes.end, text: ` aria-label=${label}` })
        }
        const legacy = /admin[\\/]records|admin[\\/]users|doctor[\\/]claim|AdminRecords|admin-user|doctor-claim/i.test(relative)
        const unsafeWrite = /delete|erase|remove|reopen|reschedule|claim|approve|reject|role/i.test(handlerText)
        let policy = field ? 'field' : tag === 'form' || tag === 'Select' ? 'container' : 'confirm'
        if (secure || type === 'file' || (legacy && unsafeWrite)) policy = 'handoff'
        if (!field && /set[A-Z]|toggle|onClose|handleFilter|handleRadius|handleState|handleDistrict|setPage|onSelect|onFilter|handleLoad|onChange|onBack|onNext|onPrevious/.test(handlerText) && !/save|send|submit|book|cancelAppointment|delete|remove|role|approve|reject|complete/i.test(handlerText)) policy = 'local'
        if (secure || type === 'file' || (legacy && unsafeWrite)) policy = 'handoff'
        if (['a', 'Link'].includes(tag)) policy = 'link'
        if (['TabsTrigger', 'DialogTrigger', 'SelectTrigger', 'SelectItem'].includes(tag)) policy = 'local'
        if (literal('data-voice-handoff') === 'true') policy = 'handoff'
        if (/reopen|reschedule|claim|role|provision|invite|erase/i.test(handlerText) && !field) policy = 'handoff'
        if (field && /onRoleChange|handleRoleChange|provision|approveClaim|erase/i.test(handlerText)) policy = 'handoff'
        if (legacy && !field && (type === 'submit' || /submit|save|update|approve|reject|delete|remove/i.test(handlerText))) policy = 'handoff'
        if (!field && /router\.push|router\.back|onGo\(|toggleSection|map\.(zoom|pan)|onPageChange|onShowRoute/.test(handlerText) && !/save|send|submit|delete|remove/i.test(handlerText)) policy = 'local'
        if (!['button', 'a', 'input', 'textarea', 'select', 'form', 'Button', 'Input', 'Textarea', 'SelectTrigger', 'SelectItem', 'Checkbox', 'RadioGroupItem', 'Switch', 'TabsTrigger', 'DialogTrigger', 'DropdownMenuItem', 'Link', 'div', 'span'].includes(tag)) policy = 'container'
        if (relative.startsWith('components/voice-assistant/') && !relative.endsWith('/MeetingControls.tsx')) policy = 'assistant'
        controls[id] = { file: relative, tag, policy, secure, fieldType: type, line: parsed.getLineAndCharacterOfPosition(node.getStart(parsed)).line + 1 }
      }
    }
    ts.forEachChild(node, walk)
  }
  walk(parsed)
  if (apply && edits.length) {
    for (const edit of edits.sort((a, b) => b.pos - a.pos)) source = source.slice(0, edit.pos) + edit.text + source.slice(edit.pos)
    fs.writeFileSync(file, source)
  }
}
const output = JSON.stringify(controls, null, 2) + '\n'
if (apply) fs.writeFileSync('lib/assistant/registered-controls.json', output)
else {
  const recorded = JSON.parse(fs.readFileSync('lib/assistant/registered-controls.json', 'utf8'))
  const actual = JSON.parse(output)
  if (missing || !sameVoiceRegistrations(recorded, actual)) {
    console.error('Voice map is out of date. Review new controls and run register_voice_controls.mjs --register.')
    process.exitCode = 1
  }
}
console.log(`${Object.keys(controls).length} first-party control templates; ${missing} missing registrations`)
