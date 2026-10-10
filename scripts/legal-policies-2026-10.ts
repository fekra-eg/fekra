/**
 * Replaces the Privacy Policy, Terms & Conditions and Cookie Policy pages with
 * the approved 1 October 2026 copy (Fekra_Tech_Website_Policies_01_October_2026.docx,
 * exported verbatim to legal-policies-2026-10.json, Arabic in legal-policies-2026-10.ar.json).
 *
 *   pnpm tsx scripts/legal-policies-2026-10.ts          # dry run
 *   pnpm tsx scripts/legal-policies-2026-10.ts --write  # backup, then apply
 *
 * Writes en, then ar onto the same blocks (layout is shared, only text is localized).
 * Slug, meta and availableLocales stay as they are.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { getPayload } from 'payload'

import config from '../src/payload.config'

type Block = ['h2' | 'h3' | 'p' | 'li', string]
type Copy = Record<string, { title: string; effective: string; blocks: Block[] }>
const load = (file: string) => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8')) as Copy
const pages = load('./legal-policies-2026-10.json')
const arabic = load('./legal-policies-2026-10.ar.json')

let node = { format: '', indent: 0, version: 1, direction: 'ltr' as 'ltr' | 'rtl' }
const text = (value: string) => ({ type: 'text', text: value, format: 0, style: '', mode: 'normal', detail: 0, version: 1 })
// Emails and URLs in the copy become real links.
const inline = (value: string) =>
  value
    .split(/(https?:\/\/\S+[^\s.,]|[\w.+-]+@[\w-]+\.[\w.-]*\w)/)
    .map((part, i) =>
      i % 2 === 0
        ? text(part)
        : { ...node, type: 'link', version: 3, fields: { linkType: 'custom', newTab: false, url: part.includes('@') ? `mailto:${part}` : part }, children: [text(part)] },
    )
    .filter((child) => child.type !== 'text' || (child as { text: string }).text)

function lexical(blocks: Block[], direction: 'ltr' | 'rtl' = 'ltr') {
  node = { ...node, direction }
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

const write = process.argv.includes('--write')
const payload = await getPayload({ config })
const { docs } = await payload.find({
  collection: 'pages', locale: 'en', depth: 0, limit: 10, where: { slug: { in: Object.keys(pages) } },
})

if (write) {
  const backup = `/private/tmp/fekra-legal-backup-${Date.now()}`
  mkdirSync(backup, { mode: 0o700 })
  writeFileSync(`${backup}/pages.json`, JSON.stringify(docs, null, 2), { mode: 0o600 })
  console.log(`Backup: ${backup}/pages.json`)
}

for (const [slug, page] of Object.entries(pages)) {
  const existing = docs.find((doc) => doc.slug === slug)
  console.log(`/${slug} — ${existing ? `update id ${existing.id}` : 'MISSING, create'}: ${page.blocks.length} blocks`)
  if (!write) continue
  const data = {
    title: page.title,
    layout: [
      { blockType: 'hero', heading: page.title, body: page.effective },
      { blockType: 'richText', width: 'prose', content: lexical(page.blocks) },
    ],
    _status: 'published',
  }
  const saved = existing
    ? await payload.update({ collection: 'pages', id: existing.id, locale: 'en', data: data as never })
    : await payload.create({ collection: 'pages', locale: 'en', data: { ...data, slug, availableLocales: ['en'] } as never })
  if (saved._status !== 'published') throw new Error(`/${slug} left as "${saved._status}".`)

  const ar = arabic[slug]!
  const layout = (saved.layout as { blockType: string }[]).map((row) =>
    row.blockType === 'hero' ? { ...row, heading: ar.title, body: ar.effective }
    : row.blockType === 'richText' ? { ...row, content: lexical(ar.blocks, 'rtl') }
    : row,
  )
  await payload.update({ collection: 'pages', id: saved.id, locale: 'ar', data: { title: ar.title, layout, _status: 'published' } as never })
}

console.log(write ? 'Policies updated.' : 'Dry run. Use --write to apply.')
process.exit(0)
