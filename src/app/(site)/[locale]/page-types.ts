import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import type { BlockProps, MediaDoc } from '@/components/blocks/types'

/**
 * View-model shapes for the route files. Generated `payload-types.ts` stays the
 * source of truth for the CMS; these are the narrow slices the pages actually
 * read, so a route never depends on a field it does not render.
 */
export type SeoMeta = {
  title?: string
  description?: string
  image?: MediaDoc | null
  canonicalOverride?: string | null
  noindex?: boolean
}

export type PageDoc = {
  id: string | number
  slug: string
  title: string
  layout?: BlockProps[] | null
  meta?: SeoMeta
  availableLocales?: string[] | null
  hideFromSitemap?: boolean | null
  updatedAt?: string
}

export type PostDoc = {
  id: string | number
  slug: string
  title: string
  excerpt?: string | null
  heroImage?: MediaDoc | null
  content?: SerializedEditorState | null
  contentFormat?: 'richText' | 'html' | null
  htmlContent?: string | null
  layout?: BlockProps[] | null
  category?: { title?: string; slug?: string } | null
  author?: { name?: string } | null
  tags?: string[] | null
  relatedPosts?: PostDoc[] | null
  publishedAt?: string | null
  updatedAt?: string
  featured?: boolean | null
  meta?: SeoMeta
  availableLocales?: string[] | null
}

export type ServiceDoc = {
  id: string | number
  slug: string
  title: string
  summary?: string | null
  icon?: MediaDoc | null
  layout?: BlockProps[] | null
  parent?: ServiceDoc | string | null
  relatedServices?: ServiceDoc[] | null
  order?: number | null
  meta?: SeoMeta
  availableLocales?: string[] | null
  updatedAt?: string
}

export type JobDoc = {
  id: string | number
  slug: string
  title: string
  summary?: string | null
  description?: SerializedEditorState | null
  requirements?: SerializedEditorState | null
  benefits?: SerializedEditorState | null
  department?: string | null
  location?: string | null
  workModel?: 'onsite' | 'hybrid' | 'remote'
  employmentType?: string | null
  city?: string | null
  countryCode?: string | null
  validThrough?: string | null
  roleStatus?: 'open' | 'closed'
  publishedAt?: string | null
  updatedAt?: string
  meta?: SeoMeta
  availableLocales?: string[] | null
}

export type SettingsLite = {
  siteName?: string
  calendlyUrl?: string
  offices?: unknown[]
}
