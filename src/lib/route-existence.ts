import type { Locale } from '@/i18n/routing'

type Collection = 'pages' | 'services' | 'posts' | 'jobs'
const cache = new Map<string, { exists: boolean; expires: number }>()
const inflight = new Map<string, Promise<boolean>>()

/** Lightweight published-ID lookup before a streaming layout starts. Never
 * interpret a database outage as a missing document. Cache is bounded and
 * short-lived so publishing a new slug does not require another deployment. */
export async function routeExists(collection: Collection, slug: string, locale: Locale): Promise<boolean> {
  const key = `${collection}:${locale}:${slug}`
  const hit = cache.get(key)
  if (hit && hit.expires > Date.now()) return hit.exists
  const pending = inflight.get(key)
  if (pending) return pending
  if (inflight.size >= 50) throw new Error('route_lookup_busy')
  const lookup = (async () => {
    const { payloadClient } = await import('./payload')
    const payload = await payloadClient()
    const result = await payload.find({
      collection, locale, fallbackLocale: collection === 'posts' ? false : 'en',
      overrideAccess: false, depth: 0, limit: 1, pagination: false,
      select: { slug: true },
      where: { and: [
        { slug: { equals: slug } }, { _status: { equals: 'published' } },
        // Untranslated locale copies are 404s (T-01). Jobs fall back to English with a notice.
        ...(collection !== 'jobs' && locale !== 'en' ? [{ availableLocales: { contains: locale } }] : []),
      ] },
    })
    const exists = result.docs.length > 0
    if (cache.size >= 500) cache.delete(cache.keys().next().value!)
    cache.set(key, { exists, expires: Date.now() + (exists ? 60_000 : 5_000) })
    return exists
  })().finally(() => inflight.delete(key))
  inflight.set(key, lookup)
  return lookup
}

export function cmsRoute(pathname: string): { collection: Collection; slug: string } | null {
  const parts = pathname.split('/').filter(Boolean)
  if (['en', 'ar', 'de', 'fr', 'es'].includes(parts[0] ?? '')) parts.shift()
  if (parts.length === 1 && !['blog', 'careers', 'contact', 'meeting', 'services', 'coming-soon'].includes(parts[0]!)) {
    return { collection: 'pages', slug: parts[0]! }
  }
  if (parts.length === 2) {
    const collection = parts[0] === 'services' ? 'services' : parts[0] === 'blog' ? 'posts' : parts[0] === 'careers' ? 'jobs' : null
    if (collection) return { collection, slug: parts[1]! }
  }
  return null
}
