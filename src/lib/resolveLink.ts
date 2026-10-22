import { DEFAULT_LOCALE, type Locale, localeHref, servesLocale } from '@/i18n/routing'
import { documentHref, type LinkableCollection } from './urls'
import { BOOKING_URL } from './booking'

export type PayloadLink = {
  type?: 'internal' | 'route' | 'external' | null
  label?: string | null
  route?: string | null
  url?: string | null
  newTab?: boolean | null
  analyticsId?: string | null
  reference?: { relationTo: string; value: { slug?: string; availableLocales?: string[] | null } | string } | null
}

export type ResolvedLink = {
  href: string
  activeHref?: string
  label: string
  external: boolean
  newTab: boolean
  analyticsId?: string
}

/**
 * Resolves a CMS link to its *final* URL. Internal links always render the
 * destination path, never a path that would 301 (20.7); an internal link whose
 * target was deleted returns null so the renderer can drop it instead of
 * shipping a dead `#` (5.8).
 */
export function resolveLink(link: PayloadLink | null | undefined, locale: Locale): ResolvedLink | null {
  if (!link?.label) return null

  const common = {
    label: link.label,
    newTab: Boolean(link.newTab),
    analyticsId: link.analyticsId ?? undefined,
  }

  if (link.type === 'external') {
    return link.url ? { ...common, href: link.url, external: true } : null
  }

  if (link.type === 'route') {
    if (link.route === '/meet-fika-ai') return { ...common, href: localeHref(locale, '/fika'), external: false }
    if (link.route === '/meeting') return { ...common, href: BOOKING_URL, external: true }
    return link.route ? { ...common, href: localeHref(locale, link.route), external: false } : null
  }

  const ref = link.reference
  if (!ref) return null
  const slug = typeof ref.value === 'string' ? undefined : ref.value?.slug
  if (!slug) return null
  if (ref.relationTo === 'pages' && slug === 'meeting') return { ...common, href: BOOKING_URL, external: true }

  // An untranslated page or service 404s in this locale (T-01): link its English page.
  // Jobs fall back to English in place; coded routes serve every locale.
  const translated =
    typeof ref.value === 'string' || ref.relationTo === 'jobs' || (ref.relationTo === 'pages' && ['home', 'contact'].includes(slug)) ||
    !('availableLocales' in ref.value) || servesLocale(ref.value.availableLocales, locale)

  return {
    ...common,
    href: documentHref(ref.relationTo as LinkableCollection, slug, translated ? locale : DEFAULT_LOCALE),
    external: false,
  }
}
