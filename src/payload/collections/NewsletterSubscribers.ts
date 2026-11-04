import type { CollectionConfig } from 'payload'
import { isAdmin, noPublicRead } from '../access'

export const NewsletterSubscribers: CollectionConfig = {
  slug: 'newsletter-subscribers',
  admin: { group: 'Submissions', useAsTitle: 'email', defaultColumns: ['email', 'status', 'consentAt', 'confirmedAt'] },
  access: { read: noPublicRead, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'email', type: 'email', required: true, unique: true, index: true, hooks: { beforeValidate: [({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value] } },
    { name: 'status', type: 'select', required: true, defaultValue: 'pending', options: ['pending', 'subscribed', 'unsubscribed'] },
    { name: 'consentAt', type: 'date', required: true },
    { name: 'consentVersion', type: 'text', required: true },
    { name: 'confirmedAt', type: 'date' },
    { name: 'unsubscribedAt', type: 'date' },
    { name: 'locale', type: 'text' },
    { name: 'sourcePath', type: 'text' },
  ],
}
