/** Local-only fixture import. Source is the public posts export, never submissions. */
import { readFileSync } from 'node:fs'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { LOCALES } from '../src/i18n/routing'
import { isLocalDatabase } from '../src/lib/site-mode'

if (!isLocalDatabase() || process.env.NEXT_PUBLIC_ENV === 'production') throw new Error('Fixtures require a local test database')
const payload = await getPayload({ config })
const context = { disableRevalidate: true }
const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#146676"/><text x="80" y="320" font-size="72" fill="white">FEKRA QA cover</text></svg>')
const cover = await payload.create({ collection: 'media', data: { alt: 'Synthetic QA cover' }, context, file: { data: svg, name: 'review-cover.svg', mimetype: 'image/svg+xml', size: svg.length } })
const source = JSON.parse(readFileSync(process.argv[2]!, 'utf8'))
for (const post of source.docs) {
  const existing = await payload.find({ collection: 'posts', where: { slug: { equals: post.slug } }, depth: 0, limit: 1 })
  let id = existing.docs[0]?.id
  for (const locale of LOCALES) {
    const data = { slug: post.slug, title: post.title[locale], excerpt: post.excerpt[locale], htmlContent: post.htmlContent[locale], contentFormat: 'html' as const, heroImage: cover.id, availableLocales: [...LOCALES], publishedAt: post.publishedAt, _status: 'published' as const }
    if (!id) id = (await payload.create({ collection: 'posts', locale, context, data })).id
    else await payload.update({ collection: 'posts', id, locale, context, data })
  }
}
// All existing seed services are intentionally available in this synthetic fixture.
const services = await payload.find({ collection: 'services', limit: 300, depth: 0 })
for (const service of services.docs) await payload.update({ collection: 'services', id: service.id, context, data: { availableLocales: [...LOCALES] } })
const jobs = await payload.find({ collection: 'jobs', limit: 100, depth: 0 })
for (const slug of ['internship-program', 'future-opportunities']) {
  if (!jobs.docs.some((job) => job.slug === slug)) await payload.create({ collection: 'jobs', context, data: { slug, title: slug, summary: 'Synthetic QA application route', description: jobs.docs[0]!.description, location: 'Cairo, Egypt', workModel: 'hybrid', employmentType: slug === 'internship-program' ? 'INTERN' : 'FULL_TIME', roleStatus: 'open', _status: 'published' } })
}
for (const locale of LOCALES) await payload.updateGlobal({ slug: 'site-settings', locale, context, data: { notificationEmails: ['contact@example.invalid'], careersEmails: ['hr@example.invalid'] } })
console.log(`Local fixtures: ${source.docs.length} published articles, ${services.docs.length} services, synthetic mail recipients`)
await payload.destroy()
