import type { Dictionary } from '@/i18n/getDictionary'
import type { Locale } from '@/i18n/routing'
import { findDoc } from '@/lib/payload'
import { findSharedSection } from '@/lib/shared-sections'
import { certificationHeading, talentStatement } from '@/i18n/qa-copy'

import { BookingSection } from './BookingSection'
import { ContactSection } from './ContactSection'
import { HiringModelsSection } from './HiringModels'
import { PostsTeaser } from './PostsTeaser'
import { ServiceHeroSection } from './ServiceHero'
import {
  CardGridSection,
  CtaSection,
  FaqSection,
  HeroSection,
  IndustriesSection,
  LogoCloudSection,
  MediaSection,
  ProcessSection,
  RichTextSection,
  StatsSection,
  TalentShowcaseSection,
  TechStackSection,
  TestimonialsSection,
} from './sections'
import type { BlockProps } from './types'

/**
 * Swaps every `sharedSection` reference for the real block it names on the
 * home page, so a section lives in exactly one place and every page that uses
 * it stays in step. `findDoc` is request-cached, so N references cost one
 * query, and home is only fetched when a page actually references something.
 *
 * A reference whose section has since been removed from home is dropped rather
 * than rendered empty — a CMS edit must not be able to break another page.
 */
async function resolveShared(blocks: BlockProps[], locale: Locale): Promise<BlockProps[]> {
  if (!blocks.some((block) => block.blockType === 'sharedSection')) return blocks

  const home = await findDoc<{ layout?: BlockProps[] }>('pages', 'home', locale)

  return blocks.flatMap((block) => {
    if (block.blockType !== 'sharedSection') return [block]
    const source = findSharedSection(block.section, home?.layout)
    return source ? [{ ...source, id: block.id ?? source.id }] : []
  })
}

/**
 * Renders the CMS layout array. An unknown block type is skipped silently in
 * production rather than crashing the page — a stale draft must never take the
 * site down.
 */
export async function RenderBlocks({
  blocks,
  locale,
  dict,
  context,
}: {
  blocks?: BlockProps[] | null
  locale: Locale
  dict: Dictionary
  context?: { offices?: unknown[]; calendlyUrl?: string | null; servicePage?: boolean }
}) {
  if (!blocks?.length) return null

  let layout = await resolveShared(blocks, locale)
  layout = layout.map((block) => {
    if (block.blockType !== 'logoCloud') return block
    if (block.variant === 'badges' && ['& Certifications', 'وشهاداتنا', 'والشهادات', '& Zertifizierungen', 'y certificaciones'].includes(block.heading ?? '')) return { ...block, eyebrow: null, heading: certificationHeading[locale] }
    // Correct the reviewed split sentence as a unit, not individual words.
    if (block.statement && locale in talentStatement && ['50+ Unternehmen setzen auf unsere', "Plus de 50 entreprises s'appuient sur nos", 'Más de 50 empresas confían en nuestro'].includes(block.statement.before ?? '')) {
      return { ...block, statement: talentStatement[locale as keyof typeof talentStatement] }
    }
    return block
  })
  // All service layouts reuse the current home testimonials, including future
  // service pages. Remove old copies so the shared section is rendered once.
  if (context?.servicePage || blocks.some((block) => block.blockType === 'serviceHero')) {
    const home = await findDoc<{ layout?: BlockProps[] }>('pages', 'home', locale)
    const faq = findSharedSection('faq', home?.layout)
    if (faq) layout = layout.map((block) =>
      block.blockType === 'faq' ? { ...faq, id: block.id ?? faq.id, anchor: block.anchor ?? faq.anchor } : block,
    )
    const testimonials = home?.layout?.find((block) => block.blockType === 'testimonials')
    if (testimonials) layout = layout.filter((block) => block.blockType !== 'testimonials').flatMap((block) =>
      block.blockType === 'industries' ? [block, { ...testimonials, id: 'shared-industry-leaders' }] : [block],
    )
  }

  return (
    <>
      {layout.map((block, index) => {
        const key = `${locale}:${block.id ?? `${block.blockType}-${index}`}`
        const isFirst = index === 0

        switch (block.blockType) {
          case 'hero':
            return <HeroSection key={key} block={block} locale={locale} isFirst={isFirst} />
          case 'serviceHero':
            return (
              <ServiceHeroSection key={key} block={block} locale={locale} dict={dict} isFirst={isFirst} />
            )
          case 'hiringModels':
            return <HiringModelsSection key={key} block={block} locale={locale} />
          case 'logoCloud':
            return <LogoCloudSection key={key} block={block} locale={locale} />
          case 'talentShowcase':
            return <TalentShowcaseSection key={key} block={block} locale={locale} />
          case 'cardGrid':
            return <CardGridSection key={key} block={block} locale={locale} />
          case 'stats':
            return <StatsSection key={key} block={block} />
          case 'process':
            return <ProcessSection key={key} block={block} locale={locale} />
          case 'testimonials':
            return <TestimonialsSection key={key} block={block} locale={locale} />
          case 'faq':
            return <FaqSection key={key} block={block} locale={locale} />
          case 'postsTeaser':
            return <PostsTeaser key={key} block={block} locale={locale} />
          case 'industries':
            return <IndustriesSection key={key} block={block} />
          case 'techStack':
            return <TechStackSection key={key} block={block} />
          case 'cta':
            return <CtaSection key={key} block={block} locale={locale} />
          case 'richText':
            return <RichTextSection key={key} block={block} />
          case 'mediaBlock':
            return <MediaSection key={key} block={block} />
          case 'contact':
            return (
              <ContactSection
                key={key}
                block={block}
                locale={locale}
                dict={dict}
                offices={context?.offices as never}
                as={isFirst ? 'h1' : 'h2'}
              />
            )
          case 'booking':
            return (
              <BookingSection
                key={key}
                block={block}
                dict={dict}
                fallbackUrl={context?.calendlyUrl ?? undefined}
              />
            )
          default:
            if (process.env.NODE_ENV !== 'production') {
              throw new Error(`RenderBlocks: no renderer for block type "${block.blockType}"`)
            }
            return null
        }
      })}
    </>
  )
}
