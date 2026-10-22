/**
 * FK-26 role-page hero fixes. Dry run by default.
 *
 *   pnpm fix:role-hero            # prints what would change
 *   pnpm fix:role-hero --apply    # writes to the database in .env.local
 *
 * - The summary sentence was in the hero body AND its bold closer (and the
 *   meta description): the closer is dropped when it repeats a body line.
 * - "FEKRA selects react developers": the seed lower-cased the title. The
 *   technology now comes from the heading, with its own casing (English only;
 *   the other locales were translated by hand).
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { LOCALES } from '../src/i18n/routing'

const apply = process.argv.includes('--apply')
const ctx = { disableRevalidate: true }

type Block = Record<string, unknown> & { blockType?: string; heading?: string | null; body?: string | null; closer?: string | null }
type Doc = { id: number; slug: string; layout?: Block[] }

const run = async () => {
  const payload = await getPayload({ config })
  const log = (msg: string) => console.log(`${apply ? 'write' : 'would'}  ${msg}`)

  for (const locale of LOCALES) {
    const { docs } = await payload.find({ collection: 'services', locale, fallbackLocale: false, limit: 500, depth: 0, pagination: false })
    for (const doc of docs as unknown as Doc[]) {
      let changed = false
      const layout = doc.layout?.map((block) => {
        if (block.blockType !== 'serviceHero') return block
        let { body, closer } = block
        const lines = (body ?? '').split('\n').map((line) => line.trim())
        if (closer && lines.includes(closer.trim())) closer = null
        if (locale === 'en' && block.heading) {
          const tech = block.heading.replace(/^Hire /, '')
          body = (body ?? '').replace(/^FEKRA selects (.+?) around /m, (match, found: string) =>
            found.toLowerCase() === tech.toLowerCase() ? `FEKRA selects ${tech} around ` : match,
          )
        }
        if (body === block.body && closer === block.closer) return block
        changed = true
        return { ...block, body, closer }
      })
      if (!changed) continue
      log(`hero body/closer on services/${doc.slug} (${locale})`)
      if (apply) await payload.update({ collection: 'services', id: doc.id, locale, data: { layout }, depth: 0, context: ctx } as never)
    }
  }

  console.log(apply ? 'Done. Redeploy (or publish any page in the admin) to refresh the cached pages.' : 'Dry run only. Re-run with --apply to write.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
