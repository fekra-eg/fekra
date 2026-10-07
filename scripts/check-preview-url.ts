import assert from 'node:assert/strict'
import { previewUrl } from '../src/payload/preview'

const previousSite = process.env.NEXT_PUBLIC_SITE_URL
const previousSecret = process.env.PREVIEW_SECRET
try {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://canonical.example.com'
  process.env.PREVIEW_SECRET = 'test-preview-token'
  for (const origin of ['http://localhost:3000', 'https://www.example.com', 'https://preview.example.com']) {
    for (const collection of ['pages', 'posts', 'services', 'jobs'] as const) {
      for (const locale of ['en', 'ar']) {
        const url = new URL(previewUrl(collection, 'example-article', locale), `${origin}/admin/collections/${collection}/1`)
        assert.equal(url.origin, origin)
        assert.equal(url.pathname, '/api/preview')
        assert.equal(url.searchParams.get('secret'), 'test-preview-token')
        assert.equal(url.searchParams.get('collection'), collection)
        assert.ok(url.searchParams.get('path')?.startsWith(locale === 'ar' ? '/ar/' : '/'))
      }
    }
  }
  assert.equal(new URL(previewUrl('pages', 'home', undefined), 'https://example.com').searchParams.get('path'), '/')
  console.log('Preview URLs remain on the editor origin across collections and locales.')
} finally {
  if (previousSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL
  else process.env.NEXT_PUBLIC_SITE_URL = previousSite
  if (previousSecret === undefined) delete process.env.PREVIEW_SECRET
  else process.env.PREVIEW_SECRET = previousSecret
}
