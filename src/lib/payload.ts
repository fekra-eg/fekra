import { cache } from 'react'
import { cmsMemo } from './cms-cache'

import { draftMode } from 'next/headers'
import { getPayload, type SelectType, type Where } from 'payload'
import configPromise from '@payload-config'

import type { Locale } from '@/i18n/routing'
import { correctQaDocument } from '@/i18n/qa-copy'
import { localizeJobLocation } from '@/i18n/job-copy'
import { isComingSoon } from './site-mode'

/** One Payload instance per server process. */
export const payloadClient = async () => getPayload({ config: configPromise })

type FindArgs = {
  collection: 'pages' | 'posts' | 'services' | 'jobs' | 'categories'
  locale: Locale
  slug?: string
  limit?: number
  page?: number
  where?: Where
  sort?: string
  depth?: number
  /** Column allow-list. Skips the block-table joins entirely — the full-layout
      query for a list of services is heavy enough to hit statement timeouts. */
  select?: SelectType
}

/**
 * `draftMode()` throws outside a request — `generateStaticParams` runs at build
 * time with no HTTP context. Every caller routes through here, so the guard
 * lives here once instead of at each call site.
 */
async function isDraft(): Promise<boolean> {
  try {
    return (await draftMode()).isEnabled
  } catch {
    return false
  }
}

/**
 * Draft mode reads unpublished versions directly. Published reads use a data
 * cache because draftMode() opts the route into dynamic rendering. CMS hooks
 * invalidate both the data tag and route paths when content changes.
 */
export async function findDocs<T = unknown>({
  collection,
  locale,
  limit = 12,
  page = 1,
  where = {} as Where,
  sort,
  depth = 1,
  select,
}: FindArgs): Promise<{ docs: T[] }> {
  const draft = await isDraft()
  const payload = await payloadClient()

  // Only draft-enabled collections have a queryable `_status`; asking for it on
  // e.g. `categories` is a 400. Read it from the config so it cannot drift.
  const hasDrafts = Boolean(payload.collections[collection]?.config.versions?.drafts)

  const result = await cmsMemo(
    draft ? null : JSON.stringify(['find', collection, locale, limit, page, where, sort, depth, select]),
    () =>
      payload.find({
        collection,
        locale,
        fallbackLocale: collection === 'posts' ? false : 'en',
        draft,
        overrideAccess: draft,
        depth,
        limit,
        page,
        sort,
        select,
        /*
         * Payload runs a second `select count(*)` per find purely to fill in
         * totalDocs/totalPages. Nothing in this app reads either — the blog
         * index pulls its whole list and filters on the client, and there is no
         * pagination UI anywhere — so every list read was paying for two round
         * trips to get one. That is also the query that surfaces as the
         * intermittent `Failed query: select count(*) from "services"` when the
         * database is slow, so dropping it halves both the cost and the
         * exposure. Re-enable it (and return the counts) the day something
         * actually paginates.
         */
        pagination: false,
        where: {
          and: [
            where,
            ...(draft || !hasDrafts ? [] : [{ _status: { equals: 'published' } }]),
            ...(collection === 'posts' && !draft && locale !== 'en' ? [{ availableLocales: { contains: locale } }] : []),
          ],
        },
      }),
  )

  const docs = correctQaDocument(result.docs, locale)
  if (collection === 'jobs') {
    for (const doc of docs) {
      if ('location' in doc && typeof doc.location === 'string') doc.location = localizeJobLocation(doc.location, locale) ?? doc.location
    }
  }
  return { docs: docs as T[] }
}

/*
 * `cache()` dedupes within one request: generateMetadata and the page both ask
 * for the same document, and the layout and page both ask for site-settings —
 * without it each render paid for every query twice. It only memoizes on
 * primitive-arg identity, which is why findDoc/getGlobal are wrapped and the
 * object-arg findDocs is not.
 *
 * Depth 1: block media, categories, authors and internal-link targets are each
 * a single relationship hop. Loading their own relationships and layouts adds
 * large joins without providing anything the renderers use.
 */
export const findDoc = cache(async function findDoc<T = unknown>(
  collection: FindArgs['collection'],
  slug: string,
  locale: Locale,
  depth = 1,
): Promise<T | null> {
  const { docs } = await findDocs<T>({
    collection,
    locale,
    limit: 1,
    depth,
    where: { slug: { equals: slug } },
  })
  return docs[0] ?? null
})

// Depth 1: header/footer links need reference.value.slug and nothing deeper.
// Depth 2 made the header global populate its referenced pages' own relations
// — a full second per request on its own.
export const getGlobal = cache(async function getGlobal<T = unknown>(
  slug: 'header' | 'footer' | 'site-settings',
  locale: Locale,
): Promise<T> {
  const payload = await payloadClient()
  return correctQaDocument(await cmsMemo(JSON.stringify(['global', slug, locale]), () =>
    payload.findGlobal({ slug, locale, fallbackLocale: 'en', depth: 1 }),
  ), locale) as T
})

/**
 * Slug list for `generateStaticParams`. A build must not die because the
 * database is briefly unreachable or empty on a first deploy — the pages still
 * render on demand and get cached, they just are not prerendered. The failure
 * is logged rather than swallowed silently.
 */
export async function staticSlugs(
  collection: FindArgs['collection'],
  locale: Locale,
  limit = 500,
): Promise<{ slug: string }[]> {
  // Behind the holding page these routes are rewritten before they render,
  // so asking the CMS for slugs is only a slower build and noisier logs.
  if (isComingSoon()) return []

  try {
    const { docs } = await findDocs<{ slug: string }>({
      collection,
      locale,
      limit,
      depth: 0,
      select: { slug: true },
    })
    return docs.map(({ slug }) => ({ slug }))
  } catch (error) {
    console.warn(`generateStaticParams: skipping prerender for "${collection}" —`, error)
    return []
  }
}
