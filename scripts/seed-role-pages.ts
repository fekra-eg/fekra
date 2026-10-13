/**
 * Creates the mega-menu role pages from src/seed/role-pages.ts (FK-24).
 * Create-only: a slug that already exists is skipped, never overwritten.
 *
 *   pnpm seed:role-pages            # dry run, prints what would be created
 *   pnpm seed:role-pages --apply    # writes to the database in .env
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { serviceHighlights } from '../src/seed/service-designs'
import { rolePages, type RolePage } from '../src/seed/role-pages'

const apply = process.argv.includes('--apply')

const textNode = (text: string) => ({ type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 })
const richText = (text: string) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: [{ type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr' as const, children: [textNode(text)] }],
  },
})

const stripIds = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripIds)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !['id', 'createdAt', 'updatedAt'].includes(key))
      .map(([key, entry]) => [key, stripIds(entry)]),
  )
}

type Block = Record<string, unknown> & { blockType: string }

const run = async () => {
  const payload = await getPayload({ config })
  const find = async (slug: string) =>
    (await payload.find({ collection: 'services', where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: false })).docs[0] as
      | { id: number; layout?: Block[] }
      | undefined

  // Same shared sections as every other technology page; hero, skills and FAQ are swapped per role.
  const template = stripIds((await find('hire-front-end-developers'))?.layout ?? []) as Block[]
  if (!template.length) throw new Error('Template page hire-front-end-developers not found')
  const templateTech = template.find((block) => block.blockType === 'techStack') as
    | { groups?: Array<{ items?: Array<{ name: string; logo?: unknown }> }> }
    | undefined
  const logos = new Map(
    (templateTech?.groups ?? []).flatMap((group) => group.items ?? []).map((item) => [item.name.toLowerCase(), item.logo]),
  )

  const layoutFor = (page: RolePage): Block[] =>
    template.map((block) => {
      if (block.blockType === 'serviceHero')
        return {
          ...block,
          heading: page.title,
          body: page.body.join('\n'),
          closer: page.summary,
          highlights: serviceHighlights.map((text) => ({ text })),
        }
      if (block.blockType === 'techStack')
        return {
          ...block,
          heading: 'Skills Covered',
          groups: page.skills.map(([name, items]) => ({
            name,
            items: items.map((item) => ({ name: item, logo: logos.get(item.toLowerCase()) ?? null })),
          })),
        }
      if (block.blockType === 'faq')
        return {
          ...block,
          // Opts out of RenderBlocks' swap for the shared home FAQ.
          anchor: 'role-faq',
          items: page.faqs.map(([question, answer]) => ({ question, answer: richText(answer) })),
        }
      return block
    })

  const created: Array<{ id: number; parent: number }> = []
  for (const page of rolePages) {
    if (await find(page.slug)) {
      console.log(`skip   ${page.slug} (already exists)`)
      continue
    }
    const parent = await find(page.parent)
    if (!parent) throw new Error(`Parent ${page.parent} not found for ${page.slug}`)
    if (!apply) {
      console.log(`create ${page.slug} under ${page.parent}`)
      continue
    }
    const doc = (await payload.create({
      collection: 'services',
      context: { disableRevalidate: true },
      data: {
        title: page.title,
        slug: page.slug,
        summary: page.summary,
        parent: parent.id,
        menuRoles: [],
        layout: layoutFor(page),
        meta: { title: page.title, description: page.summary },
        availableLocales: ['en'],
        _status: 'published',
      },
    } as never)) as { id: number }
    created.push({ id: doc.id, parent: parent.id })
    console.log(`created ${page.slug}`)
  }

  // "Learn more" links: up to five other pages under the same category.
  for (const page of created) {
    const siblings = await payload.find({
      collection: 'services',
      where: { parent: { equals: page.parent }, id: { not_equals: page.id } },
      limit: 5,
      depth: 0,
    })
    await payload.update({
      collection: 'services',
      id: page.id,
      context: { disableRevalidate: true },
      data: { relatedServices: siblings.docs.map((doc) => doc.id) },
    } as never)
  }

  console.log(apply ? `Done: ${created.length} pages created.` : 'Dry run only. Re-run with --apply to write.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
