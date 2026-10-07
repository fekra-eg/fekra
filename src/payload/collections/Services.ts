import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'
import { layoutField } from '../blocks'
import { slugField } from '../fields/slug'
import { revalidateDocument, revalidateOnDelete } from '../hooks/revalidate'
import { previewUrl } from '../preview'

export const Services: CollectionConfig = {
  slug: 'services',
  labels: { singular: 'Service', plural: 'Services' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'parent', '_status'],
    group: 'Content',
    livePreview: { url: ({ data, locale }) => previewUrl('services', data?.slug, locale?.code) },
    preview: (data, { locale }) => previewUrl('services', data?.slug as string, locale),
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
  versions: { drafts: { autosave: { interval: 8_000 } }, maxPerDoc: 25 },
  hooks: {
    afterChange: [revalidateDocument('services', '/services')],
    afterDelete: [revalidateOnDelete('services', '/services')],
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
            { name: 'summary', type: 'textarea', localized: true, required: true },
            { name: 'icon', type: 'upload', relationTo: 'media' },
            layoutField,
          ],
        },
        {
          label: 'Structure',
          fields: [
            {
              name: 'parent',
              type: 'relationship',
              relationTo: 'services',
              // New SEO pages have no ID until after validation. Passing
              // `not_equals: undefined` makes every parent invalid on create.
              filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
              admin: {
                description:
                  'Set for SEO landing pages under a parent service. Drives breadcrumbs (18.9) and internal linking (18.10).',
              },
            },
            {
              name: 'relatedServices',
              type: 'relationship',
              relationTo: 'services',
              hasMany: true,
              filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
            },
            {
              name: 'order',
              type: 'number',
              defaultValue: 0,
              admin: { description: 'Lower numbers appear first in the Services overview.' },
            },
            {
              name: 'menuRoles',
              type: 'array',
              labels: { singular: 'Role', plural: 'Roles' },
              admin: {
                description:
                  'Roles listed under this service in the header Services mega-menu. Leave empty to keep the service out of the menu columns.',
              },
              fields: [{ name: 'label', type: 'text', localized: true, required: true }],
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
  ],
}
