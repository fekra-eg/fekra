/**
 * Batch 8: Privacy Policy, Terms & Conditions and Cookie Policy in German,
 * French and Spanish, and all five locales switched on for those pages.
 *
 * Source copy is the approved 1 October 2026 text (legal-policies-2026-10.json),
 * translated block-for-block into legal-policies-2026-10.{de,fr,es}.json.
 * English and Arabic content is not touched.
 *
 *   pnpm tsx --env-file=.env.local scripts/legal-locales-2026-11.ts          # dry run
 *   pnpm tsx --env-file=.env.local scripts/legal-locales-2026-11.ts --write  # backup, then apply
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { getPayload } from 'payload'

import config from '../src/payload.config'

type Block = ['h2' | 'h3' | 'p' | 'li', string]
type Copy = Record<string, { title: string; effective: string; metaTitle: string; description: string; blocks: Block[] }>
const load = (file: string) => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8')) as Copy
const LOCALES = { de: load('./legal-policies-2026-10.de.json'), fr: load('./legal-policies-2026-10.fr.json'), es: load('./legal-policies-2026-10.es.json') }
const english = load('./legal-policies-2026-10.json')

const node = { format: '', indent: 0, version: 1, direction: 'ltr' as const }
const text = (value: string) => ({ type: 'text', text: value, format: 0, style: '', mode: 'normal', detail: 0, version: 1 })
// Same linkifier as legal-policies-2026-10.ts: emails and URLs become real links.
const inline = (value: string) =>
  value
    .split(/(https?:\/\/\S+[^\s.,]|[\w.+-]+@[\w-]+\.[\w.-]*\w)/)
    .map((part, i) =>
      i % 2 === 0
        ? text(part)
        : { ...node, type: 'link', version: 3, fields: { linkType: 'custom', newTab: false, url: part.includes('@') ? `mailto:${part}` : part }, children: [text(part)] },
    )
    .filter((child) => child.type !== 'text' || (child as { text: string }).text)

function lexical(blocks: Block[]) {
  const children: unknown[] = []
  for (const [kind, value] of blocks) {
    if (kind === 'li') {
      const item = { ...node, type: 'listitem', value: 0, children: inline(value) }
      const last = children.at(-1) as { type?: string; children: { value: number }[] } | undefined
      if (last?.type === 'list') last.children.push({ ...item, value: last.children.length + 1 })
      else children.push({ ...node, type: 'list', listType: 'bullet', tag: 'ul', start: 1, children: [{ ...item, value: 1 }] })
    } else if (kind === 'p') children.push({ ...node, type: 'paragraph', children: inline(value) })
    else children.push({ ...node, type: 'heading', tag: kind, children: [text(value)] })
  }
  return { root: { ...node, type: 'root', children } }
}

// A translation that drifted from the approved structure must not ship.
for (const [locale, pages] of Object.entries(LOCALES)) {
  for (const [slug, page] of Object.entries(english)) {
    const kinds = (blocks: Block[]) => blocks.map((b) => b[0]).join()
    if (kinds(pages[slug]!.blocks) !== kinds(page.blocks)) throw new Error(`${locale}/${slug}: blocks differ from the English source`)
  }
}

const write = process.argv.includes('--write')
const payload = await getPayload({ config })
const { docs } = await payload.find({
  collection: 'pages', locale: 'en', depth: 0, limit: 10, where: { slug: { in: Object.keys(english) } },
})

if (write) {
  const backup = `/private/tmp/fekra-legal-locales-backup-${Date.now()}`
  mkdirSync(backup, { mode: 0o700 })
  const all = await payload.find({ collection: 'pages', locale: 'all', depth: 0, limit: 10, where: { slug: { in: Object.keys(english) } } })
  writeFileSync(`${backup}/pages.json`, JSON.stringify(all.docs, null, 2), { mode: 0o600 })
  console.log(`Backup: ${backup}/pages.json`)
}

for (const slug of Object.keys(english)) {
  const page = docs.find((doc) => doc.slug === slug)
  if (!page) throw new Error(`/${slug} is missing — run legal-policies-2026-10.ts first.`)
  const rows = page.layout as { id?: string; blockType: string }[]
  console.log(`/${slug} (id ${page.id}): ${Object.keys(LOCALES).join(', ')} — ${rows.map((r) => r.blockType).join(', ')}`)
  if (!write) continue

  for (const [locale, pages] of Object.entries(LOCALES)) {
    const copy = pages[slug]!
    // Same row ids as English: layout structure is shared, only text is localized.
    const layout = rows.map((row) =>
      row.blockType === 'hero' ? { ...row, heading: copy.title, body: copy.effective }
      : row.blockType === 'richText' ? { ...row, content: lexical(copy.blocks) }
      : row,
    )
    await payload.update({
      collection: 'pages', id: page.id, locale: locale as 'de',
      data: { title: copy.title, layout, meta: { ...(page.meta as object), title: copy.metaTitle, description: copy.description }, _status: 'published' } as never,
    })
  }
  const saved = await payload.update({
    collection: 'pages', id: page.id, locale: 'en',
    data: { availableLocales: ['en', 'ar', 'de', 'fr', 'es'], _status: 'published' } as never,
  })
  console.log(`  published, availableLocales ${JSON.stringify(saved.availableLocales)}`)
}

console.log(write ? 'Legal translations applied.' : 'Dry run. Use --write to apply.')
process.exit(0)
