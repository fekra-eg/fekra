import type { Metadata } from 'next'

import { DEFAULT_LOCALE, LOCALE_META, PUBLIC_LOCALES, type Locale } from '@/i18n/routing'
import { absoluteUrl, siteUrl } from './urls'

type SeoInput = {
  title: string
  description?: string
  /** Path without locale prefix, e.g. `/blog/hello`. */
  path: string
  locale: Locale
  /** Locales with an approved translation. Drives hreflang (14.8/14.9). */
  availableLocales?: string[] | null
  image?: { url: string; width?: number; height?: number; alt?: string } | null
  noindex?: boolean
  canonicalOverride?: string | null
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  /** false = emit `title` as-is, without the `| Fekra Tech` suffix (home page). */
  brand?: boolean
  /** Share card for pages without their own image (T-18). */
  template?: 'services' | 'careers' | 'blog'
}

/**
 * Every page's metadata goes through here so canonical, hreflang and social
 * tags can never disagree (18.2/18.3/18.7/19.11).
 *
 * hreflang only lists locales that actually have an approved translation —
 * pointing at a fallback page would be a reciprocity error.
 */
/** og:locale wants language_TERRITORY (T-15). */
const OG_LOCALE: Record<Locale, string> = { en: 'en_US', ar: 'ar_EG', de: 'de_DE', fr: 'fr_FR', es: 'es_ES' }

const DEFAULT_OG_IMAGE = { url: '/images/og-default.jpg', width: 1200, height: 630 }
const DEFAULT_OG_ALT: Record<Locale, string> = {
  en: 'Fekra Tech — vetted engineering teams from Egypt',
  ar: 'Fekra Tech — فرق هندسية مختارة بعناية من مصر',
  de: 'Fekra Tech — geprüfte Engineering-Teams aus Ägypten',
  fr: 'Fekra Tech — des équipes d’ingénieurs vérifiées depuis l’Égypte',
  es: 'Fekra Tech — equipos de ingeniería verificados desde Egipto',
}

export function buildMetadata({
  title,
  description,
  path,
  locale,
  availableLocales,
  image,
  noindex,
  canonicalOverride,
  type = 'website',
  publishedTime,
  modifiedTime,
  brand = true,
  template,
}: SeoInput): Metadata {
  const base = siteUrl()
  const published = (availableLocales?.length ? availableLocales : [DEFAULT_LOCALE]).filter((l): l is Locale =>
    (PUBLIC_LOCALES as readonly string[]).includes(l),
  )

  const languages: Record<string, string> = {}
  for (const l of published) languages[LOCALE_META[l].hreflang] = absoluteUrl(path, l)
  if (published.includes(DEFAULT_LOCALE)) languages['x-default'] = absoluteUrl(path, DEFAULT_LOCALE)

  const canonical = canonicalOverride || absoluteUrl(path, locale)
  const unbrandedTitle = title.replace(/(?:\s*\|\s*(?:FEKRA|Fekra\s?Tech))+$/i, '').trim()
  const brandedTitle = brand ? `${unbrandedTitle} | Fekra Tech` : unbrandedTitle
  // Every page gets a share card (FK-33); JPG because LinkedIn's WebP support is unreliable.
  const fallback = template ? { ...DEFAULT_OG_IMAGE, url: `/og/${template}.png` } : DEFAULT_OG_IMAGE
  const card = image?.url ? image : { ...fallback, alt: DEFAULT_OG_ALT[locale] ?? DEFAULT_OG_ALT.en }
  const ogImage = [{ url: new URL(card.url, base).toString(), width: card.width ?? 1200, height: card.height ?? 630, alt: card.alt ?? title }]

  return {
    // CMS editors may include the brand suffix while the root layout also has
    // a title template. Emit one absolute title so it can never become
    // "... | FEKRA | FEKRA" on any CMS-backed route.
    title: { absolute: brandedTitle },
    description,
    metadataBase: new URL(base),
    alternates: { canonical, languages },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
    openGraph: {
      type,
      title: brandedTitle,
      description,
      url: canonical,
      siteName: 'Fekra Tech',
      locale: OG_LOCALE[locale],
      alternateLocale: published.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      images: ogImage,
      ...(type === 'article' ? { publishedTime, modifiedTime } : {}),
    },
    twitter: { card: 'summary_large_image', title: brandedTitle, description, images: ogImage.map((i) => i.url) },
  }
}

/** Fallback metadata for a route whose document is missing — never a soft 404 (18.12). */
export const notFoundMetadata: Metadata = {
  title: { absolute: 'Page not found | Fekra Tech' },
  robots: { index: false, follow: false },
}
