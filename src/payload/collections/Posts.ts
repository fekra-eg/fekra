import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'
import { allBlocks } from '../blocks'
import { slugField } from '../fields/slug'
import { revalidateDocument, revalidateOnDelete } from '../hooks/revalidate'
import { previewUrl } from '../preview'
import { MAX_BLOG_HTML_LENGTH } from '@/lib/blog-html'
import { translatePost } from '@/lib/translate-post'
import { seoReviewEndpoint } from '../seo-review-endpoint'
import { translateEndpoint } from '../translate-endpoint'

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
  endpoints: [translateEndpoint('posts', translatePost), seoReviewEndpoint],
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
                  relationTo: 'authors',
                  admin: { width: '50%', description: 'Shown as the byline and used as the Person author in Article schema (19.4 / FK-38).' },
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
      name: 'seoReview',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: '@/components/admin/SeoReview#SeoReview' } },
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
