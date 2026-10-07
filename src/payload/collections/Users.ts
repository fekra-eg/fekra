import type { CollectionConfig } from 'payload'

import { authenticated, isAdmin, isAdminField } from '../access'
import { revalidateRelatedDocument, revalidateRelatedDelete } from '../hooks/revalidate'

export const Users: CollectionConfig = {
  slug: 'users',
  hooks: { afterChange: [revalidateRelatedDocument], afterDelete: [revalidateRelatedDelete] },
  labels: { singular: 'User', plural: 'Users' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Admin',
  },
  auth: {
    // 21.10 — admin sessions are short and login is rate-limited.
    tokenExpiration: 60 * 60 * 8,
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  access: {
    read: authenticated,
    create: isAdmin,
    update: ({ req, id }) => req.user?.role === 'admin' || req.user?.id === id,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      access: { update: isAdminField },
      admin: { description: 'Editors manage content. Admins also manage users and settings.' },
    },
  ],
}
