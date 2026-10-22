import type { MetadataRoute } from 'next'

import { DEFAULT_LOCALE, PUBLIC_LOCALES, type Locale } from '@/i18n/routing'
import { payloadClient } from '@/lib/payload'
import { isComingSoon } from '@/lib/site-mode'
import { redirectsAway } from '@/lib/redirects'
import { absoluteUrl, documentPath, type LinkableCollection } from '@/lib/urls'

export const revalidate = 3600

type Indexable = {
  slug: string
  updatedAt?: string
  availableLocales?: string[] | null
  hideFromSitemap?: boolean | null
  meta?: { noindex?: boolean }
  roleStatus?: string
}

/** One entry per canonical URL with its hreflang alternates (18.5 / 19.11). */
function entry(path: string, locales: Locale[], lastModified?: string, priority = 0.7): MetadataRoute.Sitemap[number] {
  const languages = Object.fromEntries(locales.map((l) => [l, absoluteUrl(path, l)]))
  // Same x-default as the page head (FK-64 / DQ-14).
  if (locales.includes(DEFAULT_LOCALE)) languages['x-default'] = absoluteUrl(path, DEFAULT_LOCALE)
  return {
    url: absoluteUrl(path, DEFAULT_LOCALE),
    lastModified: lastModified ? new Date(lastModified) : undefined,
    changeFrequency: 'weekly',
    priority,
    alternates: { languages },
  }
}

const localesOf = (doc: Indexable): Locale[] => {
  const declared = (doc.availableLocales ?? [DEFAULT_LOCALE]).filter((l): l is Locale =>
    (PUBLIC_LOCALES as readonly string[]).includes(l),
  )
  return declared.length ? declared : [DEFAULT_LOCALE]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Closed site: nothing is reachable, so advertise nothing.
  if (isComingSoon()) return []

  const payload = await payloadClient()

  const query = async (collection: LinkableCollection) => {
    const { docs } = await payload.find({
      collection,
      limit: 1000,
      depth: 0,
      locale: DEFAULT_LOCALE,
      where: { _status: { equals: 'published' } },
      // Only what the sitemap needs — this runs on every revalidation.
      select: { slug: true, updatedAt: true, availableLocales: true, hideFromSitemap: true, meta: true, roleStatus: true },
    })
    return docs as unknown as Indexable[]
  }

  // A sitemap is worth degrading for: an unreachable CMS should not fail the
  // whole deploy, and the next revalidation picks the real list back up.
  let pages: Indexable[] = []
  let posts: Indexable[] = []
  let services: Indexable[] = []
  let jobs: Indexable[] = []
  try {
    ;[pages, posts, services, jobs] = await Promise.all([
      query('pages'),
      query('posts'),
      query('services'),
      query('jobs'),
    ])
  } catch (error) {
    console.warn('sitemap: CMS unavailable, emitting static routes only —', error)
  }

  // Paths that a coded route owns. A CMS page with the same slug (`contact`)
  // only supplies that route's content — emitting it again from the pages
  // collection put the URL in the sitemap twice (1.11 / 18.5).
  // The approved sitelinks — Services, About, Blog, Contact, Careers — sit
  // directly under the homepage; everything else ranks below them.
  // Every entry carries a real lastmod (T-14): a listing changes when anything it lists does.
  const latest = (docs: Indexable[]) =>
    docs.map((d) => d.updatedAt).filter((d): d is string => Boolean(d)).sort().at(-1)
  const pageUpdated = (slug: string) => pages.find((p) => p.slug === slug)?.updatedAt
  const LISTINGS: [path: string, priority: number, lastModified: string | undefined][] = [
    ['/services', 0.9, latest(services)],
    ['/blog', 0.9, latest(posts)],
    ['/contact', 0.9, pageUpdated('contact')],
    ['/careers', 0.9, latest(jobs)],
  ]
  const listings: MetadataRoute.Sitemap = LISTINGS.map(([path, priority, lastModified]) =>
    entry(path, [...PUBLIC_LOCALES], lastModified, priority),
  )
  // /meeting is a redirect to Calendly, so it is owned but never listed.
  const coded = new Set(['home', 'meeting', ...LISTINGS.map(([path]) => path.slice(1))])

  const fromCollection = (docs: Indexable[], collection: LinkableCollection, priority: number) =>
    docs
      // noindex, hidden and closed roles never appear — the sitemap and the
      // robots directives must not contradict each other (19.11).
      .filter((doc) => !doc.meta?.noindex && !doc.hideFromSitemap && doc.roleStatus !== 'closed' && !redirectsAway(documentPath(collection, doc.slug)))
      .map((doc) => entry(documentPath(collection, doc.slug), localesOf(doc), doc.updatedAt, priority))

  return [
    entry('/', [...PUBLIC_LOCALES], pageUpdated('home'), 1),
    ...listings,
    ...fromCollection(pages.filter((p) => p.slug === 'about'), 'pages', 0.9),
    ...fromCollection(
      pages.filter((p) => !coded.has(p.slug) && p.slug !== 'about'),
      'pages',
      0.7,
    ),
    ...fromCollection(services, 'services', 0.8),
    ...fromCollection(posts, 'posts', 0.6),
    ...fromCollection(jobs, 'jobs', 0.6),
  ]
}
