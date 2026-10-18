/** Apply the reviewed job translations (scripts/translations/jobs.<locale>.json), keeping each field's Lexical structure.
 * node --env-file=.env.local --import=tsx/esm scripts/translate-jobs.ts [--write]
 *
 * Refuses to run if a role's live English text no longer matches jobs.en.json —
 * a CMS edit since the fixture was made would otherwise shift every translation.
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const locales = ['ar', 'de', 'fr', 'es'] as const
const fields = ['description', 'requirements', 'benefits'] as const
type Copy = {
  title: string; summary: string; department: string | null; location: string
  metaTitle: string | null; metaDescription: string | null
} & Record<typeof fields[number], string[]>
const load = (name: string) => JSON.parse(readFileSync(`scripts/translations/jobs.${name}.json`, 'utf8')) as Record<string, Copy>
const english = load('en')
const translations = Object.fromEntries(locales.map((locale) => [locale, load(locale)]))
const write = process.argv.includes('--write')

const texts = (value: unknown, out: string[] = []): string[] => {
  if (Array.isArray(value)) value.forEach((item) => texts(item, out))
  else if (value && typeof value === 'object') {
    const node = value as Record<string, unknown>
    if (node.type === 'text') out.push(String(node.text))
    Object.values(node).forEach((item) => texts(item, out))
  }
  return out
}

const payload = await getPayload({ config })
const jobs = await payload.find({ collection: 'jobs', locale: 'all', depth: 0, limit: 100 })
if (write) {
  const backup = `/private/tmp/fekra-jobs-backup-${Date.now()}`
  mkdirSync(backup, { mode: 0o700 })
  writeFileSync(`${backup}/jobs.json`, JSON.stringify(jobs.docs, null, 2), { mode: 0o600 })
  console.log(`Backup: ${backup}/jobs.json`)
}

for (const { id } of jobs.docs) {
  const source = await payload.findByID({ collection: 'jobs', id, locale: 'en', fallbackLocale: false, depth: 0 })
  const fixture = english[source.slug]
  if (!fixture) { console.log(`${source.slug}: no fixture, skipped`); continue }
  for (const field of fields) {
    if (JSON.stringify(texts(source[field])) !== JSON.stringify(fixture[field])) {
      throw new Error(`${source.slug}.${field}: live English differs from jobs.en.json — refresh the fixture first`)
    }
  }

  const available = new Set(['en'])
  for (const locale of locales) {
    const translation = translations[locale]![source.slug]
    if (!translation) {
      const existing = await payload.findByID({ collection: 'jobs', id, locale, fallbackLocale: false, depth: 0 })
      if (existing.title && existing.description) available.add(locale)
      continue
    }
    const data: Record<string, unknown> = {
      title: translation.title, summary: translation.summary, location: translation.location,
      ...(translation.department ? { department: translation.department } : {}),
      ...(translation.metaTitle ? { meta: { title: translation.metaTitle, description: translation.metaDescription } } : {}),
      _status: source._status,
    }
    for (const field of fields) {
      if (!source[field]) continue
      let index = 0
      const visit = (value: unknown): unknown => {
        if (Array.isArray(value)) return value.map(visit)
        if (!value || typeof value !== 'object') return value
        const node = value as Record<string, unknown>
        const result = Object.fromEntries(Object.entries(node).map(([key, val]) => [key, visit(val)]))
        if (node.type === 'text') result.text = translation[field][index++]
        if ('direction' in node) result.direction = locale === 'ar' ? 'rtl' : 'ltr'
        return result
      }
      data[field] = visit(source[field])
      if (index !== translation[field].length) throw new Error(`Node count mismatch ${source.slug}.${field} [${locale}]`)
    }
    console.log(`${source.slug} [${locale}]: ${fields.map((field) => translation[field].length).join('/')} text nodes`)
    if (write) await payload.update({ collection: 'jobs', id, locale, data: data as never })
    available.add(locale)
  }
  console.log(`${source.slug}: availableLocales ${[...available].join(', ')}`)
  if (write) await payload.update({ collection: 'jobs', id, data: { availableLocales: [...available] as never, _status: source._status } })
}
if (!write) console.log('\nDry run — re-run with --write to save.')
process.exit(0)
