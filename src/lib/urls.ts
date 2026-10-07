import { DEFAULT_LOCALE, LOCALES, type Locale, localeHref } from '@/i18n/routing'

/** Collection slug -> public path prefix. Single source of truth for URLs. */
export const PATH_PREFIX = {
  pages: '',
  posts: '/blog',
  services: '/services',
  jobs: '/careers',
} as const

export type LinkableCollection = keyof typeof PATH_PREFIX

/** Path without locale prefix, e.g. `/blog/hello` or `/about`. */
export function documentPath(collection: LinkableCollection, slug: string): string {
  if (collection === 'pages') return slug === 'home' ? '/' : `/${slug}`
  return `${PATH_PREFIX[collection]}/${slug}`
}

/** Public href for one locale, e.g. `/ar/blog/hello`. */
export function documentHref(collection: LinkableCollection, slug: string, locale: Locale): string {
  return localeHref(locale, documentPath(collection, slug))
}

/** Every locale variant of a path — used for hreflang and cache revalidation. */
export function allLocaleHrefs(path: string): Record<Locale, string> {
  return Object.fromEntries(LOCALES.map((l) => [l, localeHref(l, path)])) as Record<Locale, string>
}

/**
 * Origin only — scheme, host and port, never a path.
 *
 * Everything downstream concatenates onto this: canonicals, sitemap entries,
 * OG urls, the preview link and the CORS/CSRF allow-list. A path segment left
 * on the variable (`https://site.com/ar`, easy to paste from the address bar)
 * therefore prefixes every one of them at once — `/ar/api/preview` 404s, every
 * canonical points at the wrong URL, and the CORS entry stops being a valid
 * origin so it can never match. Normalising here costs one URL parse and makes
 * that whole class of misconfiguration impossible.
 */
const PRODUCTION_ORIGIN = 'https://www.fekra-egy.com'

export const siteUrl = (): string => {
  let raw = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').trim()
  // Production once shipped with the *.vercel.app alias here, and every
  // canonical, og:url and share link told Google that was the real site.
  // A production deploy only ever has one public origin.
  if (process.env.VERCEL_ENV === 'production' && (!raw || /\.vercel\.app/i.test(raw))) raw = PRODUCTION_ORIGIN
  try {
    return new URL(raw).origin
  } catch {
    // Not parseable (missing scheme, say) — fall back to the old behaviour
    // rather than throwing at import time and taking the whole build down.
    return raw.replace(/\/$/, '')
  }
}

/**
 * Absolute URL for canonical tags, sitemaps, OG and JSON-LD (18.3).
 * The root is emitted without a trailing slash so the canonical tag, the
 * sitemap and the schema all agree on one spelling (19.11).
 */
export function absoluteUrl(path: string, locale: Locale = DEFAULT_LOCALE): string {
  const href = localeHref(locale, path)
  return `${siteUrl()}${href === '/' ? '' : href}`
}
