import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'
import { slugField } from '../fields/slug'
import { revalidateDocument, revalidateOnDelete } from '../hooks/revalidate'
import { previewUrl } from '../preview'

export const Jobs: CollectionConfig = {
  slug: 'jobs',
  labels: { singular: 'Job', plural: 'Careers' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'department', 'location', 'roleStatus', '_status'],
    group: 'Content',
    livePreview: { url: ({ data, locale }) => previewUrl('jobs', data?.slug, locale?.code) },
    preview: (data, { locale }) => previewUrl('jobs', data?.slug as string, locale),
  },
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: { drafts: true, maxPerDoc: 10 },
  hooks: {
    afterChange: [revalidateDocument('jobs', '/careers')],
    afterDelete: [revalidateOnDelete('jobs', '/careers')],
  },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true, hooks: { beforeValidate: [({ value }) => (typeof value === 'string' ? value.trim() : value)] } },
    slugField(),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Role',
          fields: [
            { name: 'summary', type: 'textarea', localized: true, required: true },
            { name: 'description', type: 'richText', localized: true, required: true },
            { name: 'requirements', type: 'richText', localized: true },
            { name: 'benefits', type: 'richText', localized: true },
          ],
        },
        {
          label: 'Details',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'department', type: 'text', localized: true, admin: { width: '50%' } },
                { name: 'location', type: 'text', localized: true, required: true, admin: { width: '50%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'workModel',
                  type: 'select',
                  required: true,
                  defaultValue: 'onsite',
                  options: [
                    { label: 'On-site', value: 'onsite' },
                    { label: 'Hybrid', value: 'hybrid' },
                    { label: 'Remote', value: 'remote' },
                  ],
                  admin: { width: '50%' },
                },
                {
                  name: 'employmentType',
                  type: 'select',
                  required: true,
                  defaultValue: 'FULL_TIME',
                  // schema.org employmentType values — emitted verbatim in JobPosting (10.9).
                  options: ['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'TEMPORARY', 'INTERN'].map((v) => ({
                    label: v.replace('_', ' ').toLowerCase(),
                    value: v,
                  })),
                  admin: { width: '50%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'countryCode', type: 'text', defaultValue: 'EG', admin: { width: '33%' } },
                { name: 'city', type: 'text', admin: { width: '33%' } },
                {
                  name: 'validThrough',
                  type: 'date',
                  admin: { width: '33%', description: 'Schema expiry. Blank = 90 days after publish.' },
                },
              ],
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
      // NOT "status": Payload's draft system already owns `_status` on this
      // collection and both would generate the same Postgres enum name.
      name: 'roleStatus',
      type: 'select',
      required: true,
      defaultValue: 'open',
      options: [
        { label: 'Open — accepting applications', value: 'open' },
        { label: 'Closed — page stays live, form disabled', value: 'closed' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Closing a role removes its JobPosting schema and disables the form (10.9).',
      },
    },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
  ],
}
