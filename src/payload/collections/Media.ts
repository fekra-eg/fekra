import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { revalidateRelatedDocument, revalidateRelatedDelete } from '../hooks/revalidate'

export const Media: CollectionConfig = {
  slug: 'media',
  hooks: { afterChange: [revalidateRelatedDocument], afterDelete: [revalidateRelatedDelete] },
  admin: { group: 'Content', useAsTitle: 'filename' },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  upload: {
    staticDir: '.uploads/media',
    mimeTypes: ['image/*', 'video/mp4', 'application/pdf'],
    // Widths mirror the layout container and card grid so `sizes` in next/image
    // always has an exact match — no upscaling, no oversized download (17.5).
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 768 },
      { name: 'content', width: 1200 },
      { name: 'hero', width: 1920 },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    formatOptions: { format: 'webp', options: { quality: 82 } },
    /*
     * Payload's file route sends an ETag and nothing else, so every media
     * response was uncacheable (17.10). Two costs: the image optimiser had to
     * re-fetch the source from Supabase on each of its own cache misses, and
     * SVGs — which next/image does not optimise, so they are served straight
     * from this route — were refetched on every single page view. The tech
     * logos, industry icons and certification badges are all SVG.
     *
     * `s-maxage` a year lets the CDN hold them; `max-age` an hour keeps
     * browsers from re-asking constantly while still picking up a replaced
     * image the same day. Deliberately NOT `immutable`: Payload keeps the
     * uploaded filename rather than content-hashing it, so re-uploading over
     * the same name has to be able to win eventually.
     *
     * Media only. CVs live in `applicant-files`, whose responses are signed
     * and must never be cached by anything.
     */
    modifyResponseHeaders: ({ headers }) => {
      headers.set('Cache-Control', 'public, max-age=3600, s-maxage=31536000, stale-while-revalidate=86400')
      return headers
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Describe the image for screen readers and search (18.11). Leave empty ONLY for purely decorative images.',
      },
    },
    {
      name: 'decorative',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Decorative image — renders with an empty alt attribute.' },
    },
    { name: 'caption', type: 'text', localized: true },
    { name: 'credit', type: 'text' },
  ],
}
