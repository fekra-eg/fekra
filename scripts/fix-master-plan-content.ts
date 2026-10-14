/**
 * CMS content fixes from the master plan (Oct 2026). Dry run by default.
 *
 *   pnpm fix:content            # prints what would change
 *   pnpm fix:content --apply    # writes to the database in .env.local
 *
 * FK-68  unpublish the four test articles (kept as drafts, not deleted)
 * FK-69  real article's publish date -> 5 Oct 2026
 * FK-73  Arabic-Indic digits -> Western digits in all Arabic content
 * FK-78  hero rotating words fit the sentence; role pill is a stand-alone label
 * FK-81  certification and Fika image alt text in de/fr/es
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const apply = process.argv.includes('--apply')
const ctx = { disableRevalidate: true }

const TEST_POSTS = ['how-we-vet-the-top-3-percent', 'scaling-engineering-teams-with-ai', 'building-qa-culture-that-ships', 'nearshore-vs-offshore']
const REAL_POST = { slug: 'software-outsourcing-in-2026', publishedAt: '2026-10-05T09:00:00.000Z' }

// "Scale your team faster with <word>": each word must complete the sentence.
const HERO_WORDS: Record<string, string[]> = {
  de: ['KI-Ingenieuren', 'Full-Stack-Ingenieuren', 'Backend-Ingenieuren', 'Mobile-Ingenieuren', 'QA-Ingenieuren', 'DevOps-Ingenieuren', 'Dateningenieuren'],
  fr: ['des ingénieurs IA', 'des ingénieurs full-stack', 'des ingénieurs back-end', 'des ingénieurs mobile', 'des ingénieurs QA', 'des ingénieurs DevOps', 'des ingénieurs data'],
  es: ['ingenieros de IA', 'ingenieros full-stack', 'ingenieros back-end', 'ingenieros móviles', 'ingenieros de QA', 'ingenieros DevOps', 'ingenieros de datos'],
}
const AI_PILL: Record<string, string> = { de: 'KI-Ingenieure', fr: 'Ingénieurs IA', es: 'Ingenieros de IA' }

// Keyed by the English alt text.
const MEDIA_ALT: Record<string, Record<string, string>> = {
  'ISO 9001 certified': { de: 'ISO 9001 zertifiziert', fr: 'Certifié ISO 9001', es: 'Certificado ISO 9001' },
  'ISO 27001 certified': { de: 'ISO 27001 zertifiziert', fr: 'Certifié ISO 27001', es: 'Certificado ISO 27001' },
  'GDPR compliant': { de: 'DSGVO-konform', fr: 'Conforme au RGPD', es: 'Conforme con el RGPD' },
  'ISTQB Platinum Partner': { de: 'ISTQB Platinum Partner', fr: 'Partenaire ISTQB Platinum', es: 'Socio ISTQB Platinum' },
  'SOC 2 Type 2': { en: 'SOC 2 Type II', de: 'SOC 2 Typ II', fr: 'SOC 2 Type II', es: 'SOC 2 Tipo II' },
  'Fika, the FEKRA hiring assistant': { de: 'Fika, die Recruiting-Assistentin von FEKRA', fr: 'Fika, l’assistante de recrutement de FEKRA', es: 'Fika, la asistente de contratación de FEKRA' },
}

const westernDigits = (v: unknown): unknown =>
  typeof v === 'string'
    ? v.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/٪/g, '%')
    : Array.isArray(v)
      ? v.map(westernDigits)
      : v && typeof v === 'object'
        ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, westernDigits(x)]))
        : v
const hasArabicDigits = (v: unknown) => /[٠-٩]/.test(JSON.stringify(v))
const strip = (doc: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(doc).filter(([key]) => !['id', 'createdAt', 'updatedAt', 'globalType'].includes(key)))

type Doc = Record<string, unknown> & { id: number; slug?: string; layout?: Record<string, unknown>[] }

const run = async () => {
  const payload = await getPayload({ config })
  const log = (msg: string) => console.log(`${apply ? 'write' : 'would'}  ${msg}`)

  // FK-68 / FK-69
  for (const slug of TEST_POSTS) {
    const post = (await payload.find({ collection: 'posts', where: { slug: { equals: slug } }, limit: 1, depth: 0 })).docs[0] as Doc | undefined
    if (!post || post._status !== 'published') continue
    log(`unpublish post ${slug}`)
    if (apply) await payload.update({ collection: 'posts', id: post.id, data: { _status: 'draft' }, context: ctx } as never)
  }
  const real = (await payload.find({ collection: 'posts', where: { slug: { equals: REAL_POST.slug } }, limit: 1, depth: 0 })).docs[0] as Doc | undefined
  if (real && String(real.publishedAt).slice(0, 10) !== REAL_POST.publishedAt.slice(0, 10)) {
    log(`publishedAt ${real.publishedAt} -> ${REAL_POST.publishedAt} on ${REAL_POST.slug}`)
    if (apply) await payload.update({ collection: 'posts', id: real.id, data: { publishedAt: REAL_POST.publishedAt }, context: ctx } as never)
  }

  // FK-78
  for (const locale of Object.keys(HERO_WORDS) as ('de' | 'fr' | 'es')[]) {
    const home = (await payload.find({ collection: 'pages', where: { slug: { equals: 'home' } }, locale, fallbackLocale: false as never, limit: 1, depth: 0 })).docs[0] as Doc | undefined
    if (!home?.layout) continue
    let changed = false
    const layout = home.layout.map((block) => {
      const words = block.rotatingWords as { id: string; text: string }[] | undefined
      if (words?.length === HERO_WORDS[locale]!.length && words.some((w, i) => w.text !== HERO_WORDS[locale]![i])) {
        changed = true
        return { ...block, rotatingWords: words.map((w, i) => ({ ...w, text: HERO_WORDS[locale]![i] })) }
      }
      const roles = block.roles as { id: string; label: string }[] | undefined
      if (block.blockType === 'talentShowcase' && roles?.[0] && roles[0].label !== AI_PILL[locale] && /IA|KI/.test(roles[0].label)) {
        changed = true
        return { ...block, roles: roles.map((r, i) => (i ? r : { ...r, label: AI_PILL[locale] })) }
      }
      return block
    })
    if (!changed) continue
    log(`home hero words / AI pill in ${locale}`)
    if (apply) await payload.update({ collection: 'pages', id: home.id, locale, data: { layout }, context: ctx } as never)
  }

  // FK-81
  for (const [english, alts] of Object.entries(MEDIA_ALT)) {
    const { docs } = await payload.find({ collection: 'media', where: { alt: { equals: english } }, locale: 'en', limit: 20, depth: 0 })
    for (const media of docs as unknown as Doc[]) {
      for (const [locale, alt] of Object.entries(alts)) {
        log(`media ${media.id} alt (${locale}) -> ${alt}`)
        if (apply) await payload.update({ collection: 'media', id: media.id, locale: locale as never, data: { alt }, context: ctx } as never)
      }
    }
  }

  // FK-73
  for (const collection of ['pages', 'services', 'posts', 'jobs', 'categories'] as const) {
    const { docs } = await payload.find({ collection, locale: 'ar', fallbackLocale: false as never, limit: 500, depth: 0 })
    for (const doc of docs as unknown as Doc[]) {
      if (!hasArabicDigits(doc)) continue
      log(`Western digits in ${collection}/${doc.slug}`)
      if (apply) await payload.update({ collection, id: doc.id, locale: 'ar', data: strip(westernDigits(doc) as Doc), depth: 0, context: ctx } as never)
    }
  }
  for (const slug of ['header', 'footer', 'site-settings']) {
    const global = (await payload.findGlobal({ slug: slug as never, locale: 'ar', fallbackLocale: false as never, depth: 0 })) as Doc
    if (!hasArabicDigits(global)) continue
    log(`Western digits in global ${slug}`)
    if (apply) await payload.updateGlobal({ slug: slug as never, locale: 'ar', data: strip(westernDigits(global) as Doc), depth: 0, context: ctx } as never)
  }

  console.log(apply ? 'Done. Redeploy (or publish any page in the admin) to refresh the cached pages.' : 'Dry run only. Re-run with --apply to write.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
