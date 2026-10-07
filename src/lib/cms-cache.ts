import { unstable_cache } from 'next/cache'

/*
 * Process-lifetime memo for `next dev` and `next build`. Dev re-renders every
 * request — ISR is a production mechanism — so each locale switch repaid ~1.2s
 * of remote queries for data that had not changed.
 *
 * The build needs it for a different reason. Every page carrying a
 * `sharedSection` block reads the whole home document to resolve it (see
 * RenderBlocks.resolveShared), and that is Payload's widest query: a lateral
 * join across all nineteen block tables and their locale tables. `findDoc` is
 * wrapped in React `cache()`, which dedupes inside ONE render and does nothing
 * across separate prerenders, so a 109-page export ran it 109 times. That is
 * what put the deploy at the mercy of a busy pooler — `Export encountered an
 * error on /services/[slug]`, cause `timeout exceeded when trying to connect`.
 * Content cannot change mid-build, so one fetch per worker is not just an
 * optimisation, it is the correct read.
 *
 * Draft reads bypass both caches. Production uses Next's persistent data
 * cache below; publishing invalidates its tag as well as the affected routes.
 */
const devCache = new Map<string, { t: number; v: unknown }>()
const devInflight = new Map<string, Promise<unknown>>()
const DEV_TTL_MS = 300_000
const MEMOIZED_PHASE =
  process.env.NODE_ENV === 'development' || process.env.NEXT_PHASE === 'phase-production-build'
export async function cmsMemo<T>(key: string | null, fn: () => Promise<T>): Promise<T> {
  if (key === null) return fn()
  if (!MEMOIZED_PHASE) {
    // draftMode() makes these routes dynamic, so route-level ISR alone cannot
    // prevent repeated database reads. Keep request APIs outside this scope.
    // Cache Components are not enabled in this application.
    return unstable_cache(fn, ['cms-public-v1', key], { tags: ['cms-public'], revalidate: 300 })()
  }
  const hit = devCache.get(key)
  if (hit && Date.now() - hit.t < DEV_TTL_MS) return hit.v as T

  // React can request the page HTML and RSC payload at the same time. Share a
  // single cold database read instead of making both requests compete for the
  // small remote Postgres pool.
  const pending = devInflight.get(key)
  if (pending) return pending as Promise<T>

  const generation = cacheGeneration
  const request = fn()
    .then((value) => {
      if (generation === cacheGeneration) devCache.set(key, { t: Date.now(), v: value })
      return value
    })
    .finally(() => { if (devInflight.get(key) === request) devInflight.delete(key) })
  devInflight.set(key, request)
  return request
}

let cacheGeneration = 0

/** Publishing also clears development/build memo entries in this process. */
export function clearCmsMemo() {
  cacheGeneration += 1
  devCache.clear()
  devInflight.clear()
}
