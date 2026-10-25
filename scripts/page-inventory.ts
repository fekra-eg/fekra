/**
 * Prints the launch page inventory as Markdown — checklist 1.12 (every live
 * page, its language versions, content source and final URL) and the evidence
 * for 1.11 (slug freeze: duplicates and staging-style slugs are flagged).
 *
 *   pnpm inventory > docs/PAGE-INVENTORY.md
 *
 * Reads the same published-only, noindex/hidden-aware rules the sitemap uses,
 * so the inventory and the sitemap cannot disagree about what is live.
 */
import { getPayload } from 'payload'

import { DEFAULT_LOCALE, PUBLIC_LOCALES, type Locale } from '../src/i18n/routing'
import { documentPath, siteUrl, type LinkableCollection } from '../src/lib/urls'
import config from '../src/payload.config'

type Doc = {
  slug: string
  title?: string
  updatedAt?: string
  availableLocales?: string[] | null
  hideFromSitemap?: boolean | null
  meta?: { noindex?: boolean }
  roleStatus?: string
  parent?: unknown
}

/** Routes that exist in code; a CMS page with the same slug only fills them in. */
const CODED: Record<string, string> = {
  '/': 'app/(site)/[locale]/page.tsx + CMS Pages/home',
  '/blog': 'app/(site)/[locale]/blog/page.tsx (lists CMS Posts)',
  '/careers': 'app/(site)/[locale]/careers/page.tsx (lists CMS Jobs)',
  '/contact': 'app/(site)/[locale]/contact/page.tsx + CMS Pages/contact',
  '/meeting': 'app/(site)/[locale]/meeting/page.tsx + Site Settings',
}

const OWNER: Record<LinkableCollection, string> = {
  pages: 'FEKRA marketing',
  posts: 'FEKRA marketing',
  services: 'FEKRA marketing',
  jobs: 'FEKRA talent',
}

const localesOf = (doc: Doc): Locale[] => {
  const declared = (doc.availableLocales ?? [DEFAULT_LOCALE]).filter((l): l is Locale =>
    (PUBLIC_LOCALES as readonly string[]).includes(l),
  )
  return declared.length ? declared : [DEFAULT_LOCALE]
}

const run = async () => {
  const payload = await getPayload({ config })

  const query = async (collection: LinkableCollection) =>
    (
      await payload.find({
        collection,
        limit: 1000,
        depth: 0,
        locale: DEFAULT_LOCALE,
        where: { _status: { equals: 'published' } },
        sort: 'slug',
      })
    ).docs as unknown as Doc[]

  const [pages, posts, services, jobs] = await Promise.all([
    query('pages'),
    query('posts'),
    query('services'),
    query('jobs'),
  ])

  type Row = { path: string; title: string; locales: Locale[]; source: string; owner: string; note: string }
  const rows: Row[] = []

  const push = (docs: Doc[], collection: LinkableCollection) => {
    for (const doc of docs) {
      const path = documentPath(collection, doc.slug)
      const excluded = [
        doc.meta?.noindex && 'noindex',
        doc.hideFromSitemap && 'hidden from sitemap',
        doc.roleStatus === 'closed' && 'role closed',
      ].filter(Boolean)
      rows.push({
        path,
        title: doc.title ?? doc.slug,
        // A coded route is localized by the dictionary, so it exists in every
        // language regardless of what its backing CMS page declares (1.11).
        locales: path in CODED ? [...PUBLIC_LOCALES] : localesOf(doc),
        source: CODED[path] ?? `CMS ${collection}/${doc.slug}`,
        owner: OWNER[collection],
        note: excluded.length ? `not in sitemap (${excluded.join(', ')})` : '',
      })
    }
  }

  push(pages, 'pages')
  push(services, 'services')
  push(posts, 'posts')
  push(jobs, 'jobs')

  // Listing routes have no CMS document of their own.
  for (const path of ['/blog', '/careers', '/meeting']) {
    if (!rows.some((r) => r.path === path)) {
      rows.push({
        path,
        title: path.slice(1).replace(/^\w/, (c) => c.toUpperCase()),
        locales: [...PUBLIC_LOCALES],
        source: CODED[path]!,
        owner: 'FEKRA marketing',
        note: '',
      })
    }
  }

  rows.sort((a, b) => a.path.localeCompare(b.path))

  const base = siteUrl()
  const url = (path: string) => `${base}${path === '/' ? '' : path}`

  console.log('# Launch page inventory\n')
  console.log(`Generated ${new Date().toISOString().slice(0, 10)} by \`pnpm inventory\` from published CMS`)
  console.log(`documents on \`${base}\`. Regenerate after any content change — it is the 1.12 sign-off artefact.\n`)
  console.log(`**${rows.length} live pages** in English; each row lists the languages that document declares.`)
  console.log(`Non-English URLs are the same path under \`/ar\`, \`/de\`, \`/fr\`, \`/es\`.\n`)

  console.log('| # | URL | Title | Languages | Content source | Owner | Notes |')
  console.log('|---|-----|-------|-----------|----------------|-------|-------|')
  rows.forEach((r, i) => {
    console.log(
      `| ${i + 1} | [${r.path}](${url(r.path)}) | ${r.title} | ${r.locales.join(', ')} | ${r.source} | ${r.owner} | ${r.note} |`,
    )
  })

  // --- 1.11: slug freeze evidence -----------------------------------------
  const paths = rows.map((r) => r.path)
  const dupes = paths.filter((p, i) => paths.indexOf(p) !== i)
  const suspicious = rows.filter((r) =>
    /(^|[-/])(test|tmp|temp|copy|draft|new|old|v\d|staging|untitled|\d{4}-\d{2}-\d{2})([-/]|$)/i.test(r.path),
  )
  const englishOnly = rows.filter((r) => r.locales.length === 1)

  // Two service pages on the same subject compete with each other in search.
  // What is left after dropping the `hire-` landing-page prefix and the words
  // every service slug shares is the subject; two services whose subjects
  // overlap are the pair to look at.
  const GENERIC = new Set(['hire', 'developers', 'engineers', 'experts', 'end', 'stack', 'app'])
  const tokens = (slug: string) => new Set(slug.split('-').filter((t) => !GENERIC.has(t)))
  const overlapping: string[] = []
  for (let i = 0; i < services.length; i++) {
    for (let j = i + 1; j < services.length; j++) {
      const a = tokens(services[i]!.slug)
      const b = tokens(services[j]!.slug)
      if (!a.size || !b.size) continue
      const shared = [...a].filter((t) => b.has(t))
      if (shared.length === a.size || shared.length === b.size) {
        overlapping.push(`\`${services[i]!.slug}\` / \`${services[j]!.slug}\``)
      }
    }
  }
  const orphanServices = services.filter((s) => !s.parent).length

  console.log('\n## Slug freeze (1.11)\n')
  console.log(`- Duplicate URLs: ${dupes.length ? dupes.join(', ') : 'none'}`)
  console.log(
    `- Staging/temporary-looking slugs: ${suspicious.length ? suspicious.map((r) => r.path).join(', ') : 'none'}`,
  )
  console.log(`- Overlapping service subjects: ${overlapping.length ? overlapping.join(', ') : 'none'}`)
  console.log(
    `- Services with no parent: ${orphanServices} of ${services.length}` +
      (orphanServices === services.length ? ' — the 7.4 parent/child hierarchy is unused, so every service is a top-level URL' : ''),
  )
  console.log(`- English-only documents: ${englishOnly.length} of ${rows.length}`)
  if (englishOnly.length) console.log(`  - ${englishOnly.map((r) => r.path).join(', ')}`)

  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
