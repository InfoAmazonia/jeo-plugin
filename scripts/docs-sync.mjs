#!/usr/bin/env node
/**
 * Syncs a translated docs tree (docs/<locale>/) from the English source.
 *
 * - Creates a pending copy (English content + locale banner) for every
 *   English page that has no counterpart in the target locale yet.
 * - With --force, refreshes copies that are still marked untranslated
 *   (frontmatter `untranslated: true`) from the current English source.
 * - Never touches translated pages: translating a page means removing the
 *   flag and the banner, after which the script leaves it alone.
 *
 * Usage: node scripts/docs-sync.mjs <locale> [--force]
 * Example: npm run docs:pt:sync   (pt → docs/pt/, <TranslationPendingPT />)
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Locale key → banner component registered in docs/.vitepress/theme/index.ts
const LOCALES = {
  pt: 'TranslationPendingPT',
  es: 'TranslationPendingES',
}

const root = fileURLToPath(new URL('..', import.meta.url))
const docsDir = join(root, 'docs')

const [locale, ...flags] = process.argv.slice(2)
const banner = LOCALES[locale]
if (!banner) {
  console.error(
    `Unknown or missing locale "${locale || ''}". Usage: node scripts/docs-sync.mjs <${Object.keys(LOCALES).join('|')}> [--force]`,
  )
  process.exit(1)
}
const force = flags.includes('--force')

const targetDir = join(docsDir, locale)
// Locale trees are mirrors, never sources for one another.
const SKIP_DIRS = new Set(['.vitepress', 'node_modules', 'public', 'img', ...Object.keys(LOCALES)])
const BANNER = `<${banner} />`

function listPages(dir, prefix = '') {
  const pages = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      pages.push(...listPages(join(dir, entry.name), `${prefix}${entry.name}/`))
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md') {
      pages.push(`${prefix}${entry.name}`)
    }
  }
  return pages.sort()
}

/**
 * Adjusts an English page body for its translated mirror: images live in
 * docs/img, which is one extra `../` level away from docs/<locale> (any depth).
 */
function adaptForLocale(content, depth) {
  const up = '../'.repeat(depth + 1)
  return content
    .replace(/(\]\()(\.\.\/)*img\//g, `$1${up}img/`)
    .replace(/(src=")(\.\.\/)*img\//g, `$1${up}img/`)
}

function makePending(content, depth) {
  const adapted = adaptForLocale(content, depth)
  const match = adapted.match(/^---\n([\s\S]*?)\n---\n/)
  if (match) {
    return `---\n${match[1]}\nuntranslated: true\n---\n\n${BANNER}\n\n${adapted.slice(match[0].length)}`
  }
  return `---\nuntranslated: true\n---\n\n${BANNER}\n\n${adapted}`
}

function isPending(content) {
  return content.startsWith('---\n') && content.includes('\nuntranslated: true\n')
}

const created = []
const refreshed = []
const pending = []
const translated = []

for (const page of listPages(docsDir)) {
  const dst = join(targetDir, page)
  const depth = page.split('/').length - 1

  if (!existsSync(dst)) {
    mkdirSync(dirname(dst), { recursive: true })
    writeFileSync(dst, makePending(readFileSync(join(docsDir, page), 'utf8'), depth))
    created.push(page)
    continue
  }

  const current = readFileSync(dst, 'utf8')
  if (!isPending(current)) {
    translated.push(page)
  } else if (force) {
    writeFileSync(dst, makePending(readFileSync(join(docsDir, page), 'utf8'), depth))
    refreshed.push(page)
  } else {
    pending.push(page)
  }
}

const list = (items) => items.map((p) => `  - ${p}`).join('\n')

console.log(`docs sync (${locale}): ${created.length} created, ${refreshed.length} refreshed, ${pending.length} pending, ${translated.length} translated`)
if (created.length) console.log(`created:\n${list(created)}`)
if (refreshed.length) console.log(`refreshed:\n${list(refreshed)}`)
if (pending.length) console.log(`pending (use --force to refresh from English):\n${list(pending)}`)
