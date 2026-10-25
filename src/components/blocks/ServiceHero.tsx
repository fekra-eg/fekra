import { BidiText } from '@/components/BidiText'
import Image from 'next/image'

import { ConsultationForm } from '@/components/forms/ConsultationForm'
import type { Dictionary } from '@/i18n/getDictionary'
import type { Locale } from '@/i18n/routing'
import { cn } from '@/lib/cn'

import type { BlockProps, MediaDoc } from './types'
import { mediaUrl } from './types'

/* Band tints from the service-page comps — one per service. */
const HERO_TONE = {
  mint: 'bg-[#d9f3cf]',
  blue: 'bg-[#d5dff7]',
  blush: 'bg-[#fcdeda]',
  amber: 'bg-[#fbd9a3]',
  sky: 'bg-[#9ed2f0]',
  coral: 'bg-[#f4a26e]',
  teal: 'bg-[#8fd7c2]',
  gold: 'bg-[#f5da90]',
  lilac: 'bg-[#c9abdb]',
} as const

/**
 * Service-page hero: copy and highlight cards on a pastel band, with the
 * "Get Free Consultation" card floating on the right and dropping ~50px past
 * the band's bottom edge, as the comp draws it.
 */
export function ServiceHeroSection({
  block,
  locale,
  dict,
  isFirst,
}: {
  block: BlockProps
  locale: Locale
  dict: Dictionary
  isFirst: boolean
}) {
  const Title = isFirst ? 'h1' : 'h2'
  const paragraphs = (block.body ?? '').split('\n').filter(Boolean)

  return (
    <section
      data-service-hero
      id={block.anchor ?? undefined}
      className={cn('mt-2.5 lg:mb-10 dark:bg-background-subtle', HERO_TONE[block.heroTone ?? 'mint'])}
    >
      <div className="container-site grid items-start gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_414px] lg:gap-16">
        <div className="pt-2">
          <Title className="font-display text-4xl font-bold text-[#001033] dark:text-foreground">
            <BidiText>{block.heading}</BidiText>
          </Title>

          {paragraphs.length ? (
            <div className="mt-3 flex flex-col text-base/6 text-[#001033] dark:text-muted-foreground">
              {paragraphs.map((text, i) => (
                <p key={i}><BidiText>{text}</BidiText></p>
              ))}
            </div>
          ) : null}

          {block.closer ? (
            <p className="mt-1 text-base/6 font-bold text-[#001033] dark:text-foreground"><BidiText>{block.closer}</BidiText></p>
          ) : null}

          {block.highlights?.length ? (
            <ul className="mt-8 grid gap-2.5 sm:grid-cols-3">
              {block.highlights.map((item, index) => {
                const icon = item.icon as MediaDoc | undefined
                const iconSrc = icon?.url ? mediaUrl(icon) : ['/images/services/icon-cost.svg', '/images/services/icon-speed.png', '/images/services/icon-talent.svg'][index]
                return (
                  <li
                    key={item.text}
                    className="flex min-h-[95px] items-center gap-3 rounded-[15px] border border-[#001033]/20 bg-white/30 p-2.5 dark:border-border dark:bg-card"
                  >
                    {iconSrc ? (
                      <span className="flex size-8 shrink-0 items-center justify-center">
                        <Image src={iconSrc} alt="" width={31} height={31} aria-hidden className="fk-mono-icon size-[31px]" />
                      </span>
                    ) : null}
                    <span className="text-sm/[21px] text-[#001033] dark:text-foreground"><BidiText>{item.text}</BidiText></span>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>

        {/* Offset the 48px band padding plus the design’s 50px overhang. */}
        <div className="lg:-mb-[98px]">
          <ConsultationForm
            title={block.formTitle ?? 'Get Free Consultation'}
            service={block.heading ?? 'our services'}
            dict={dict}
            locale={locale}
          />
        </div>
      </div>
    </section>
  )
}
