/**
 * Writes ar/de/fr/es translations for every published service.
 *
 *   pnpm tsx scripts/translate-services.ts --init    # (re)build scripts/translations/services.json
 *   pnpm tsx scripts/translate-services.ts           # dry run: coverage report
 *   pnpm tsx scripts/translate-services.ts --write   # apply
 *   pnpm tsx scripts/translate-services.ts --write --only=<slug>   # one service
 *
 * Same method as translate-page.ts: read each service in ENGLISH at depth 0,
 * deep-clone, replace every string that has an entry in the JSON, write the
 * clone back per locale. Row ids ride through untouched — Payload keys
 * localized values off them.
 *
 * A locale already listed in a service's availableLocales is never written:
 * that copy was translated and reviewed by hand. --init harvests those reviewed
 * translations into the JSON, so the new pages reuse the same wording.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['ar', 'de', 'fr', 'es'] as const
type Loc = (typeof LOCALES)[number]
type Entry = Record<Loc, string>

const FILE = path.resolve(process.cwd(), 'scripts/translations/services.json')
const write = process.argv.includes('--write')
const init = process.argv.includes('--init')
const only = process.argv.find((arg) => arg.startsWith('--only='))?.slice(7)

// Select values and design tokens, never copy.
const NOT_COPY = new Set([
  'primary', 'secondary', 'brand', 'panel', 'compliance', 'none', 'left', 'right', 'center',
  'faq', 'posts', 'contact', 'ctaBand', 'default', 'small', 'large', 'light', 'dark',
  'numbered', 'bullet', 'check', 'statement', 'lavender',
  'mint', 'blue', 'blush', 'amber', 'sky', 'coral', 'teal', 'gold', 'lilac',
])
// Structural keys whose string values are never shown to a reader.
const NOT_COPY_FIELD = new Set([
  'id', 'blockType', 'blockName', 'type', 'format', 'version', 'direction', 'mode', 'style',
  'relationTo', 'value', 'tag', 'listType', 'indent', 'textFormat', 'textStyle', 'slug',
  'anchor', 'url', 'route', 'heroTone', 'tone', 'variant', 'theme', 'image', 'icon',
])
const isCopy = (s: string) => s.length > 1 && /[a-zA-Z]/.test(s) && !/^(https?:|\/|#|mailto:|tel:)/.test(s) && !NOT_COPY.has(s)

type Doc = Record<string, unknown> & { id: number | string; slug: string; availableLocales?: string[] | null }
const copyOf = (d: Doc) => ({ title: d.title, summary: d.summary, layout: d.layout, meta: d.meta, menuRoles: d.menuRoles })

/** Walk English and localized copies side by side; record each string pair. */
function harvest(en: unknown, loc: unknown, key: string | null, out: Map<string, string>): void {
  if (key && NOT_COPY_FIELD.has(key)) return
  if (typeof en === 'string') {
    if (isCopy(en) && typeof loc === 'string' && loc.trim() && loc !== en && !out.has(en)) out.set(en, loc)
    return
  }
  if (Array.isArray(en)) return en.forEach((v, i) => harvest(v, Array.isArray(loc) ? loc[i] : undefined, null, out))
  if (en && typeof en === 'object') {
    const l = (loc && typeof loc === 'object' ? loc : {}) as Record<string, unknown>
    for (const [k, v] of Object.entries(en)) harvest(v, l[k], k, out)
  }
}

function collect(node: unknown, key: string | null, out: Set<string>): void {
  if (key && NOT_COPY_FIELD.has(key)) return
  if (typeof node === 'string') return void (isCopy(node) && out.add(node))
  if (Array.isArray(node)) return node.forEach((n) => collect(n, null, out))
  if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) collect(v, k, out)
}

function translate(value: unknown, key: string | null, map: Record<string, Entry>, locale: Loc, miss: Set<string>): unknown {
  if (typeof value === 'string') {
    if (key && NOT_COPY_FIELD.has(key)) return value
    const hit = map[value]?.[locale]
    if (hit) return hit
    if (isCopy(value) && /[a-z] [a-z]/i.test(value)) miss.add(value)
    return value
  }
  if (Array.isArray(value)) return value.map((v) => translate(v, null, map, locale, miss))
  if (value && typeof value === 'object') {
    // Lexical paragraphs carry their own direction; Arabic reads right to left.
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        k === 'direction' && locale === 'ar' && v ? 'rtl' : translate(v, k, map, locale, miss),
      ]),
    )
  }
  return value
}

const payload = await getPayload({ config })
const { docs } = (await payload.find({
  collection: 'services',
  limit: 500,
  depth: 0,
  locale: 'en',
  pagination: false,
  where: { _status: { equals: 'published' } },
})) as unknown as { docs: Doc[] }

if (init) {
  const strings = new Set<string>()
  for (const d of docs) collect(copyOf(d), null, strings)
  const previous: Record<string, Entry> = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : {}
  const known = Object.fromEntries(LOCALES.map((l) => [l, new Map<string, string>()])) as Record<Loc, Map<string, string>>
  for (const locale of LOCALES) {
    for (const d of docs) {
      if (!d.availableLocales?.includes(locale)) continue
      const loc = await payload.findByID({ collection: 'services', id: d.id, depth: 0, locale, fallbackLocale: false as never })
      harvest(copyOf(d), copyOf(loc as unknown as Doc), null, known[locale])
    }
  }
  const out: Record<string, Entry> = {}
  for (const s of strings) {
    out[s] = Object.fromEntries(LOCALES.map((l) => [l, previous[s]?.[l] || known[l].get(s) || ''])) as Entry
  }
  writeFileSync(FILE, JSON.stringify(out, null, 2) + '\n')
  const filled = Object.fromEntries(LOCALES.map((l) => [l, Object.values(out).filter((e) => e[l]).length]))
  console.log(`${FILE}: ${strings.size} strings; prefilled`, filled)
  process.exit(0)
}

const MAP: Record<string, Entry> = JSON.parse(readFileSync(FILE, 'utf8'))

for (const locale of LOCALES) {
  const miss = new Set<string>()
  let written = 0
  for (const d of docs) {
    if (d.availableLocales?.includes(locale) || (only && d.slug !== only)) continue
    const copy = translate(copyOf(d), null, MAP, locale, miss) as ReturnType<typeof copyOf>
    if (!write) continue
    await payload.update({
      collection: 'services',
      id: d.id,
      locale,
      depth: 0,
      data: {
        ...copy,
        availableLocales: [...new Set([...(d.availableLocales ?? ['en']), locale])],
        _status: 'published',
      } as never,
    })
    d.availableLocales = [...new Set([...(d.availableLocales ?? ['en']), locale])]
    written += 1
  }
  console.log(`${locale}: ${write ? `${written} services written` : 'dry run'}, ${miss.size} strings left in English`)
  for (const m of [...miss].slice(0, 10)) console.log(`   en: ${m.slice(0, 100)}`)
}

if (write) {
  // English is the source every locale is cloned from — check it survived.
  const sample = docs[0]!
  const check = await payload.findByID({ collection: 'services', id: sample.id, depth: 0, locale: 'en' })
  if (check._status !== 'published' || check.title !== sample.title) throw new Error(`EN copy of ${sample.slug} changed!`)
  console.log(`\nEN intact ("${check.title}", ${check._status}).`)
}
process.exit(0)
