import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { slugField } from '../fields/slug'
import { revalidateRelatedDocument, revalidateRelatedDelete } from '../hooks/revalidate'

export const Categories: CollectionConfig = {
  slug: 'categories',
  hooks: { afterChange: [revalidateRelatedDocument], afterDelete: [revalidateRelatedDelete] },
  labels: { singular: 'Category', plural: 'Categories' },
  admin: { useAsTitle: 'title', group: 'Content' },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    slugField(),
    { name: 'description', type: 'textarea', localized: true },
  ],
}
