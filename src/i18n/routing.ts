/**
 * Locale contract for the whole app (checklist 14.1 - 14.5).
 *
 * URL policy: `as-needed` prefixing. English is served unprefixed so every
 * existing WordPress English URL is preserved byte-for-byte (20.3); every other
 * locale gets a stable crawlable prefix (14.2).
 *
 *   /about        -> en
 *   /ar/about     -> ar   (dir=rtl)
 *   /de/about     -> de
 */
export const LOCALES = ['en', 'ar', 'de', 'fr', 'es'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

/** Locales that render right-to-left (14.4). */
const RTL_LOCALES = new Set<Locale>(['ar'])

export const LOCALE_META: Record<Locale, { label: string; english: string; hreflang: string }> = {
  en: { label: 'English', english: 'English', hreflang: 'en' },
  ar: { label: 'العربية', english: 'Arabic', hreflang: 'ar' },
  de: { label: 'Deutsch', english: 'German', hreflang: 'de' },
  fr: { label: 'Français', english: 'French', hreflang: 'fr' },
  es: { label: 'Español', english: 'Spanish', hreflang: 'es' },
}

export const isLocale = (value: string | undefined): value is Locale =>
  !!value && (LOCALES as readonly string[]).includes(value)

/**
 * The locales the public site actually serves. LOCALES is what the CMS stores
 * content in; this is the subset that gets routed, linked, advertised in
 * hreflang/sitemap, and offered in the switcher.
 *
 * All five since 23 Aug 2026: the home page, header, footer, offices and the
 * 13 service documents carry ar/de/fr/es translations (scripts/translate-home
 * .ts). Published blog posts also carry all five translations. Each document's
 * availableLocales keeps its hreflang honest (14.9), and untranslated CMS
 * fields elsewhere fall back to English rather than rendering blank.
 */
export const PUBLIC_LOCALES: readonly Locale[] = ['en', 'ar', 'de', 'fr', 'es']

/* Plain boolean, not a type predicate: PUBLIC_LOCALES is a runtime subset of
   the same type, so narrowing on it would collapse the negated branch to never. */
export const isPublicLocale = (value: string | undefined): boolean =>
  !!value && (PUBLIC_LOCALES as readonly string[]).includes(value)

export const dir = (locale: Locale): 'rtl' | 'ltr' => (RTL_LOCALES.has(locale) ? 'rtl' : 'ltr')

/** Build a public href for a locale. `/about` for en, `/ar/about` for the rest. */
export function localeHref(locale: Locale, pathname = '/'): string {
  const clean = pathname === '/' ? '' : pathname.startsWith('/') ? pathname : `/${pathname}`
  return locale === DEFAULT_LOCALE ? clean || '/' : `/${locale}${clean}`
}

/** Is a document with these `availableLocales` served in `locale`? Missing means English only. */
export function servesLocale(availableLocales: readonly string[] | null | undefined, locale: Locale): boolean {
  return (availableLocales?.length ? availableLocales : [DEFAULT_LOCALE]).includes(locale)
}

/** Path → the locales its document is served in, for documents missing some public locale (T-01). */
export type LocaleAvailability = Record<string, Locale[]>

/**
 * localeHref, except a document with no `locale` translation links to its
 * English page: untranslated locale URLs are 404s, never English copy under a
 * German URL (T-01).
 */
export function availableHref(locale: Locale, path: string, availability?: LocaleAvailability): string {
  const only = availability?.[path]
  return localeHref(only && !only.includes(locale) ? DEFAULT_LOCALE : locale, path)
}

/** Inverse of localeHref: split an incoming pathname into locale + rest. */
export function splitLocale(pathname: string): { locale: Locale; rest: string } {
  const [, maybe, ...others] = pathname.split('/')
  if (isLocale(maybe)) {
    const rest = `/${others.join('/')}`.replace(/\/$/, '')
    return { locale: maybe, rest: rest || '/' }
  }
  return { locale: DEFAULT_LOCALE, rest: pathname || '/' }
}

/**
 * Is `href` the page at `pathname`, or a page under it? Both sides go through
 * splitLocale because a prerendered English page reached via the proxy rewrite
 * reads usePathname() as `/en/about`, never the `/about` in the nav href. A
 * locale root ("/", "/ar") matches exactly, or it would be active everywhere.
 */
export function isActivePath(pathname: string, href: string): boolean {
  const current = splitLocale(pathname)
  const target = splitLocale(href)
  if (current.locale !== target.locale) return false
  if (current.rest === target.rest) return true
  return target.rest !== '/' && current.rest.startsWith(`${target.rest}/`)
}

/**
 * Pick the best locale from an Accept-Language header. Used only for the very
 * first visit to `/`; never overrides an explicit locale in the URL (14.9).
 */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE
  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag = '', ...params] = part.trim().split(';')
      const q = params.find((p) => p.trim().startsWith('q='))
      return { tag: tag.toLowerCase(), q: q ? Number(q.split('=')[1]) || 0 : 1 }
    })
    .sort((a, b) => b.q - a.q)

  for (const { tag } of ranked) {
    const base = tag.split('-')[0]
    if (isLocale(base)) return base
  }
  return DEFAULT_LOCALE
}
