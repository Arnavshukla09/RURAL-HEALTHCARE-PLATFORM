import fs from 'node:fs'
import path from 'node:path'
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : entry.name.endsWith('.md') ? [path.join(dir, entry.name)] : [])
const files = ['README.md', 'CONTRIBUTING.md', ...walk('docs').filter(file => !file.replaceAll('\\', '/').startsWith('docs/history/'))]
const missing = []
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '')
  for (const match of text.matchAll(/!?\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const link = match[1].replace(/^<|>$/g, '').split('#')[0]
    if (!link || /^[a-z][a-z0-9+.-]*:/i.test(link) || link.includes('<')) continue
    const target = path.resolve(path.dirname(file), decodeURIComponent(link))
    if (!fs.existsSync(target)) missing.push({ file: file.replaceAll('\\', '/'), link })
  }
}
console.log(JSON.stringify({ documents: files.length, brokenLocalLinks: missing }))
if (missing.length) process.exitCode = 1
