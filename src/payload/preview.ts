import { DEFAULT_LOCALE, isLocale } from '@/i18n/routing'
import { slugify } from '@/lib/slug'
import { documentHref, type LinkableCollection } from '@/lib/urls'

/**
 * Draft preview link (4.8). The token is a shared secret checked by
 * /api/preview, which then enables Next's draft mode — no unpublished content
 * is reachable without it.
 */
export function previewUrl(
  collection: LinkableCollection,
  data: { slug?: unknown; title?: unknown } | undefined,
  locale: string | undefined,
): string {
  const resolved = isLocale(locale) ? locale : DEFAULT_LOCALE
  // The slug field fills itself from the title on save, but the form still
  // shows it empty until reload — so the preview derives it the same way
  // instead of pointing at the index page.
  const slug = typeof data?.slug === 'string' && data.slug ? data.slug : slugify(String(data?.title ?? ''))
  const path = documentHref(collection, slug, resolved)
  const params = new URLSearchParams({
    secret: process.env.PREVIEW_SECRET ?? '',
    path,
    collection,
  })
  // Payload resolves relative preview URLs against the admin browser origin.
  // A canonical site URL can differ from localhost, www, or a deployment alias;
  // our same-origin frame policy would then block the preview iframe.
  return `/api/preview?${params.toString()}`
}
