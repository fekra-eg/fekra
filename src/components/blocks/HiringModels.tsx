import Image from 'next/image'
import { Clock } from 'lucide-react'

import { LinkButton } from '@/components/ui/Button'
import type { Locale } from '@/i18n/routing'
import { cn } from '@/lib/cn'
import { resolveLink } from '@/lib/resolveLink'

import type { BlockProps } from './types'

/* Column tints sampled from the comp's rendered frame. */
const MODEL_TONE = {
  amber: { header: 'bg-[#ffda9b] dark:bg-[#493c2b] dark:text-[#ffda9b]', card: 'border-[#ffda9b] dark:border-[#756044]', value: 'text-[#ffda9b]' },
  lavender: { header: 'bg-[#aaabfc] dark:bg-[#343650] dark:text-[#cdcfff]', card: 'border-[#aaabfc] dark:border-[#5a5d88]', value: 'text-[#aaabfc]' },
  blue: { header: 'bg-[#7bb6fc] dark:bg-[#273e57] dark:text-[#a8d0ff]', card: 'border-[#7bb6fc] dark:border-[#47698f]', value: 'text-[#7bb6fc]' },
} as const

/**
 * "Our Hiring Models" (Figma service pages): a left-aligned heading, three
 * tinted model columns — header pill over two outlined stat cards — and a
 * full-bleed grey benefits band the stat cards overlap, with the CTA pill
 * dropping past the band's bottom edge.
 */
export function HiringModelsSection({ block, locale }: { block: BlockProps; locale: Locale }) {
  const models = block.models ?? []
  const benefits = block.benefits ?? []
  const ctas = (block.ctas ?? []).map((c) => ({ variant: c.variant, link: resolveLink(c.link, locale) }))

  return (
    <section id={block.anchor ?? undefined} className="pt-[var(--section-y)]">
      <div className="container-site">
        {block.eyebrow ? (
          <p className="flex items-center gap-3 text-xs text-ink-500 dark:text-muted-foreground">
            <span aria-hidden className="h-px w-6 bg-ink-500" />
            {block.eyebrow}
          </p>
        ) : null}
        <h2 className="mt-4 flex items-start gap-2.5 font-display text-[2rem] leading-none font-bold text-ink-900 dark:text-foreground">
          {block.heading}
          {/* The comp's hand-drawn arrow, curling toward the model columns. */}
          <Image
            src="/images/services/arrow-doodle.svg"
            alt=""
            width={56}
            height={37}
            aria-hidden
            className="fk-mono-icon mt-1 shrink-0 rtl:-scale-x-100"
          />
        </h2>

        {models.length ? (
          /* The cards sink 50px into the benefits band below. */
          <ul className="relative z-10 mt-10 grid gap-5 md:grid-cols-3">
            {models.map((model) => {
              const tone = MODEL_TONE[model.tone ?? 'amber']
              return (
                <li key={model.title}>
                  <p
                    className={cn(
                      'flex min-h-11 items-center gap-2 rounded-pill px-4 text-[13px] font-semibold text-black',
                      tone.header,
                    )}
                  >
                    <Clock aria-hidden className="size-4 shrink-0" />
                    {model.title}
                  </p>
                  <div className="mt-0 grid grid-cols-2 gap-1">
                    {(model.stats ?? []).map((stat) => (
                      <div
                        key={stat.label}
                        /* min-h, not h: the hour-package list wraps on phones. */
                        className={cn('flex min-h-[125px] flex-col gap-2 rounded-lg border-2 bg-white p-5 dark:bg-card', tone.card)}
                      >
                        {/* "400/200\n100/50" is a set of hour packages, not a ratio: list them as options (FK-52). */}
                        {/^\d+(?:[\s/]+\d+){2,}$/.test(stat.value.trim()) ? (
                          <span className={cn('font-display text-xl/7 font-semibold', tone.value)}>
                            <bdi dir="ltr">{stat.value.trim().split(/[\s/]+/).map(Number).sort((a, b) => a - b).join(' · ')}</bdi>
                          </span>
                        ) : (
                          <span className={cn('font-display text-3xl/9 font-semibold whitespace-pre-line', tone.value)}>
                            {stat.value === 'Flexible' ? ({ en: 'Flexible', ar: 'مرن', de: 'Flexibel', fr: 'Flexible', es: 'Flexible' })[locale] : <bdi dir="ltr">{stat.value}</bdi>}
                          </span>
                        )}
                        <span className="mt-auto text-sm text-navy-800 dark:text-foreground">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>

      {/* Benefits band — full-bleed grey, tucked 50px under the stat cards. */}
      {benefits.length || ctas.length ? (
        <>
          <div className="-mt-[50px] bg-[#eee] pt-[82px] pb-10 dark:bg-background-subtle">
            <div className="container-site">
              {block.benefitsTitle ? (
                <p className="flex items-center gap-3 font-display text-[22px] font-medium text-ink-900 dark:text-foreground">
                  <Image src="/images/services/benefits-mark.svg" alt="" width={22} height={22} aria-hidden className="fk-mono-icon" />
                  {block.benefitsTitle}
                </p>
              ) : null}

              {benefits.length ? (
                <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {benefits.map((benefit) => (
                    <li key={benefit.text} className="flex items-center gap-2 text-base font-medium text-ink-900 dark:text-foreground">
                      <Image src="/images/services/benefit-bullet.svg" alt="" width={12} height={12} aria-hidden className="fk-mono-icon" />
                      {benefit.text}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          {/* The CTA pill straddles the band's bottom edge. It stays inside
              this section and overlaps upward — hanging below the section
              gets painted over by the next section's reveal wrapper. */}
          <div className="relative -mt-[22px] flex justify-center">
            {ctas.map((c) =>
              c.link ? <LinkButton key={c.link.href} link={c.link} variant={c.variant ?? 'primary'} withArrow /> : null,
            )}
          </div>
        </>
      ) : null}
    </section>
  )
}
