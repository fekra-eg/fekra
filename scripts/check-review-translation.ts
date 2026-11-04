import assert from 'node:assert/strict'
import { getPayload, type PayloadRequest } from 'payload'
import config from '../src/payload.config'
import { isLocalDatabase } from '../src/lib/site-mode'
import { translateEndpoint } from '../src/payload/translate-endpoint'

if (!isLocalDatabase() || process.env.NEXT_PUBLIC_ENV === 'production') throw new Error('Local QA database only')
const payload = await getPayload({ config })
const manual = '<p>هذه ترجمة يدوية يجب الحفاظ عليها.</p>'
const post = await payload.create({ collection: 'posts', draft: true, context: { disableRevalidate: true }, data: { title: 'React', slug: `qa-translation-${Date.now()}`, contentFormat: 'html', htmlContent: '<p>English source.</p>', availableLocales: ['en', 'de', 'fr', 'es'] } })
try {
  await payload.update({ collection: 'posts', id: post.id, locale: 'ar', draft: true, data: { title: 'React', contentFormat: 'html', htmlContent: manual } })
  let calls = 0
  const endpoint = translateEndpoint('posts', async () => { calls++; throw new Error('Saved translation must never reach a provider') })
  const response = await endpoint.handler({ payload, user: { id: 1, role: 'admin' }, routeParams: { id: post.id }, json: async () => ({}) } as unknown as PayloadRequest)
  assert.equal(response.status, 200)
  assert.equal(calls, 0)
  const copy = await payload.findByID({ collection: 'posts', id: post.id, locale: 'ar', fallbackLocale: false, draft: true })
  assert.equal(copy.htmlContent, manual)
  assert.equal(copy.title, 'React')
  console.log('PASS saved manual Arabic body with an unchanged English technical title survives automatic translation; no provider calls')
} finally {
  await payload.delete({ collection: 'posts', id: post.id, context: { disableRevalidate: true } })
  await payload.destroy()
}
process.exit(0)
