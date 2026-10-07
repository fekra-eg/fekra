import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'
import { layoutField } from '../blocks'
import { slugField } from '../fields/slug'
import { revalidateDocument, revalidateOnDelete } from '../hooks/revalidate'
import { previewUrl } from '../preview'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    group: 'Content',
    livePreview: { url: ({ data, locale }) => previewUrl('pages', data?.slug, locale?.code) },
    preview: (data, { locale }) => previewUrl('pages', data?.slug as string, locale),
  },
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  // 4.8 — editors review unpublished content before it goes public.
  /*
   * Autosave interval must exceed how long a save actually takes, or the admin
   * queues saves faster than they drain: the pool (2 connections on Vercel)
   * starves, requests never return, and the editor sits on "Saving..." with
   * Publish disabled. Measured against the production database:
   *   pages ~9000ms (a version touches 94 tables), posts ~3400ms, services ~1800ms.
   */
  // A 9s write cannot be put on a timer at all — no interval is safe when the
  // editor can keep typing through it. Drafts stay; saving is explicit.
  versions: { drafts: true, maxPerDoc: 25 },
  hooks: {
    afterChange: [revalidateDocument('pages')],
    afterDelete: [revalidateOnDelete('pages')],
  },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true, hooks: { beforeValidate: [({ value }) => (typeof value === 'string' ? value.trim() : value)] } },
    slugField(),
    {
      type: 'tabs',
      tabs: [
        { label: 'Content', fields: [layoutField] },
        {
          label: 'Settings',
          fields: [
            {
              name: 'hideFromSitemap',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'Excludes this page from sitemap.xml (18.5).' },
            },
            {
              name: 'availableLocales',
              type: 'select',
              hasMany: true,
              options: ['en', 'ar', 'de', 'fr', 'es'],
              defaultValue: ['en'],
              admin: {
                description:
                  'Locales with approved translations. Drives hreflang and the language switcher (14.8/14.9).',
              },
            },
          ],
        },
      ],
    },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
  ],
}
