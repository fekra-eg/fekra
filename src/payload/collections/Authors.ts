import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { revalidateRelatedDocument, revalidateRelatedDelete } from '../hooks/revalidate'

/** Article bylines (FK-38): a real Person in BlogPosting schema, not the organisation. */
export const Authors: CollectionConfig = {
  slug: 'authors',
  hooks: { afterChange: [revalidateRelatedDocument], afterDelete: [revalidateRelatedDelete] },
  labels: { singular: 'Author', plural: 'Authors' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'role'], group: 'Content' },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'text', localized: true, admin: { description: 'e.g. "Head of Engineering".' } },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'bio', type: 'textarea', localized: true, maxLength: 600 },
    { name: 'linkedin', type: 'text', label: 'LinkedIn URL', admin: { description: 'https://www.linkedin.com/in/… — used as the author URL in search results.' } },
  ],
}
