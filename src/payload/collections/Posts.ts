import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'
import { allBlocks } from '../blocks'
import { slugField } from '../fields/slug'
import { revalidateDocument, revalidateOnDelete } from '../hooks/revalidate'
import { previewUrl } from '../preview'
import { MAX_BLOG_HTML_LENGTH } from '@/lib/blog-html'
import { LOCALES, type Locale } from '@/i18n/routing'
import { translatePost, type TranslatablePost } from '@/lib/translate-post'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Article', plural: 'Blog' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', '_status'],
    group: 'Content',
    livePreview: { url: ({ data, locale }) => previewUrl('posts', data?.slug, locale?.code) },
    preview: (data, { locale }) => previewUrl('posts', data?.slug as string, locale),
  },
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  /*
   * Autosave interval must exceed how long a save actually takes, or the admin
   * queues saves faster than they drain: the pool (2 connections on Vercel)
   * starves, requests never return, and the editor sits on "Saving..." with
   * Publish disabled. Measured against the production database:
   *   pages ~9000ms (a version touches 94 tables), posts ~3400ms, services ~1800ms.
   */
  versions: { drafts: { autosave: { interval: 10_000 } }, maxPerDoc: 25 },
  endpoints: [
    {
      // POST /api/posts/:id/translate — English -> every other locale, saved as a draft for review.
      path: '/:id/translate',
      method: 'post',
      handler: async (req) => {
        if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        const id = String(req.routeParams?.id ?? '')
        const post = await req.payload.findByID({
          collection: 'posts', id, locale: 'en', fallbackLocale: false, draft: true, depth: 0,
        })
        const targets = LOCALES.filter((locale): locale is Exclude<Locale, 'en'> => locale !== 'en')
        // Translate in parallel, save one at a time: concurrent draft saves on one document would race.
        const results = await Promise.allSettled(targets.map((locale) => translatePost(post as TranslatablePost, locale)))
        const translated: string[] = []
        const failed: { locale: string; error: string }[] = []
        for (const [i, result] of results.entries()) {
          const locale = targets[i]!
          if (result.status === 'rejected') {
            failed.push({ locale, error: String(result.reason instanceof Error ? result.reason.message : result.reason) })
            continue
          }
          try {
            await req.payload.update({ collection: 'posts', id, locale, draft: true, data: result.value })
            translated.push(locale)
          } catch (error) {
            failed.push({ locale, error: error instanceof Error ? error.message : String(error) })
          }
        }
        if (translated.length) {
          const available = new Set([...(post.availableLocales ?? ['en']), 'en', ...translated])
          await req.payload.update({
            collection: 'posts', id, draft: true,
            data: { availableLocales: LOCALES.filter((locale) => available.has(locale)) },
          })
        }
        if (failed.length) req.payload.logger.error({ failed }, `Translation failed for post ${id}`)
        return Response.json({ translated, failed }, { status: translated.length ? 200 : 502 })
      },
    },
  ],
  hooks: {
    afterChange: [revalidateDocument('posts', '/blog')],
    afterDelete: [revalidateOnDelete('posts', '/blog')],
    beforeChange: [
      ({ data }) => {
        // 8.2 — a published article always has a date, even if the editor forgot.
        if (data._status === 'published' && !data.publishedAt) data.publishedAt = new Date().toISOString()
        return data
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true, hooks: { beforeValidate: [({ value }) => (typeof value === 'string' ? value.trim() : value)] } },
    slugField(),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'excerpt', type: 'textarea', localized: true, maxLength: 320 },
            { name: 'heroImage', type: 'upload', relationTo: 'media' },
            {
              name: 'contentFormat', type: 'select', localized: true, defaultValue: 'richText',
              options: [{ label: 'Rich text editor', value: 'richText' }, { label: 'Import / paste HTML', value: 'html' }],
            },
            {
              name: 'content', type: 'richText', localized: true,
              admin: { condition: (_, siblingData) => siblingData.contentFormat !== 'html' },
              validate: (value, { siblingData }) =>
                (siblingData as { contentFormat?: string }).contentFormat === 'html' || value ? true : 'Please add article content.',
            },
            {
              name: 'htmlContent', type: 'textarea', localized: true, maxLength: MAX_BLOG_HTML_LENGTH,
              admin: {
                condition: (_, siblingData) => siblingData.contentFormat === 'html',
                components: { Field: '@/components/admin/BlogHtmlField#BlogHtmlField' },
              },
              validate: (value, { siblingData }) => {
                if ((siblingData as { contentFormat?: string }).contentFormat !== 'html') return true
                if (!value?.trim()) return 'Please paste HTML or import an HTML file.'
                return value.length <= MAX_BLOG_HTML_LENGTH || 'HTML must be smaller than 500 KB.'
              },
            },
            {
              name: 'layout',
              type: 'blocks',
              label: 'Extra sections (optional)',
              blocks: allBlocks,
              admin: {
                initCollapsed: true,
                description: 'CTA, FAQ or related blocks under the article body.',
              },
            },
          ],
        },
        {
          label: 'Meta',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'category', type: 'relationship', relationTo: 'categories', admin: { width: '50%' } },
                {
                  name: 'author',
                  type: 'relationship',
                  relationTo: 'users',
                  admin: { width: '50%', description: 'Shown as the byline and used in Article schema (19.4).' },
                },
              ],
            },
            { name: 'tags', type: 'text', hasMany: true, localized: true },
            {
              name: 'relatedPosts',
              type: 'relationship',
              relationTo: 'posts',
              hasMany: true,
              maxDepth: 1,
              filterOptions: ({ id }) => ({ id: { not_equals: id } }),
            },
            {
              name: 'availableLocales',
              type: 'select',
              hasMany: true,
              options: ['en', 'ar', 'de', 'fr', 'es'],
              defaultValue: ['en'],
            },
          ],
        },
      ],
    },
    {
      name: 'translate',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: '@/components/admin/TranslateButton#TranslateButton' } },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
}
