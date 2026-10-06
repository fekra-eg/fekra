import testimonialCopy from '@/i18n/testimonials.json'
import { BidiText } from '@/components/BidiText'
import { Award, Check, Clock, FilePenLine, Star, BadgeCheck, ListChecks, Workflow } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { JsonLd } from '@/components/JsonLd'
import { RichText } from '@/components/RichText'
import { LinkButton } from '@/components/ui/Button'
import { dir, type Locale } from '@/i18n/routing'
import { batchTwo } from '@/i18n/batch-two'
import { cn } from '@/lib/cn'
import { logoMarkSize } from '@/lib/logo-size'
import { clientLogo } from '@/lib/client-logos'
import { faqSchema } from '@/lib/jsonld'
import { defaultHeroPhoto } from '@/lib/hero-photos'
import { resolveLink } from '@/lib/resolveLink'

import { CountUp } from './CountUp'
import { FaqAccordion } from './FaqAccordion'
import { TestimonialCarousel } from './TestimonialCarousel'
import { ProcessStepper } from './ProcessStepper'
import { RotatingWords } from './RotatingWords'
import { TechTabs } from './TechTabs'
import type { BlockProps, MediaDoc } from './types'
import { mediaAlt, mediaUrl } from './types'

// These checked-in originals have transparent backgrounds and consistent
// crops; use them for both the home strip and the compliance rows.
const certificationSource = (image: MediaDoc) => {
  const name = image.url?.match(/(cert-(?:soc2|iso-27001|iso-9001|gdpr|istqb))(?:\.[a-z]+)$/)?.[1]
  return name ? `/images/certs/${name}.png` : mediaUrl(image)
}

/* Reference pastels in light mode; quieter brand hues in dark mode. */
const STAT_TONE = {
  green: 'bg-[#c4e8fc] text-navy-800 dark:bg-[#23342f] dark:text-[#b7f5dd]',
  emerald: 'bg-[#ddd7ff] text-navy-800 dark:bg-[#233334] dark:text-[#b7eee8]',
  indigo: 'bg-[#d4fbea] text-navy-800 dark:bg-[#2d2b3e] dark:text-[#eeecff]',
  teal: 'bg-[#ffd6ef] text-navy-800 dark:bg-[#26323b] dark:text-[#c8eff7]',
} as const

const TILE_CORNER = {
  tl: 'rounded-tl-tile',
  tr: 'rounded-tr-tile',
  bl: 'rounded-bl-tile',
  br: 'rounded-br-tile',
} as const

/* Phone grid cells are ~174x124, so --radius-tile's 28px floor takes a quarter
   of the tile. Same signature corner, sized for the cell it is actually on. */
const TILE_CORNER_SM = {
  tl: 'rounded-tl-[1.25rem]',
  tr: 'rounded-tr-[1.25rem]',
  bl: 'rounded-bl-[1.25rem]',
  br: 'rounded-br-[1.25rem]',
} as const

/* Vivasoft reference, traced tile by tile off a 1975 x 629 capture of the
 * live site (same 3.14:1 board). Percentages are of the board box. Gutters
 * run ~1% of the width both ways; the centre columns climb to within a
 * gutter of the CTA row, which is where the reference gets its density. */
const MOSAIC_LAYOUT = [
  { left: 0.0000, top: 0.0000, width: 12.2000, height: 59.9400, corner: 'tl' },
  { left: 13.2700, top: 14.6300, width: 11.0300, height: 45.3100, corner: 'tr' },
  { left: 25.6700, top: 26.0700, width: 11.3900, height: 29.4100, corner: 'tr' },
  { left: 25.6700, top: 58.6600, width: 11.3900, height: 41.3400, corner: 'tr' },
  { left: 38.2800, top: 25.7600, width: 12.5100, height: 74.2400, corner: 'tr' },
  { left: 52.0000, top: 36.0900, width: 11.2900, height: 39.7500, corner: 'tl' },
  { left: 52.0000, top: 79.0100, width: 11.2900, height: 20.9900, corner: 'tr' },
  { left: 64.8100, top: 22.8900, width: 11.7500, height: 31.4800, corner: 'tl' },
  { left: 64.8100, top: 57.5500, width: 22.7800, height: 42.4500, corner: 'tr' },
  { left: 77.4700, top: 14.3100, width: 10.1200, height: 40.0600, corner: 'tr' },
  { left: 88.4600, top: 1.9100, width: 11.5400, height: 59.3000, corner: 'tl' },
  { left: 88.4600, top: 64.7100, width: 11.5400, height: 35.2900, corner: 'tr' },
  { left: 0.0000, top: 63.1200, width: 24.3000, height: 36.8800, corner: 'tr' },
] as const

/** Shared section heading. One H2 per section keeps the outline honest (18.4). */
function SectionHeading({
  eyebrow,
  heading,
  headingAccent,
  body,
  center = true,
  as: As = 'h2',
}: {
  eyebrow?: string | null
  heading?: string | null
  headingAccent?: string | null
  body?: string | null
  center?: boolean
  as?: 'h1' | 'h2'
}) {
  if (!heading && !eyebrow && !body) return null
  return (
    <div className={cn('flex flex-col gap-4', center && 'mx-auto max-w-3xl text-center')}>
      {eyebrow ? (
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">{eyebrow}</p>
      ) : null}
      {/* 42/50 #000 — measured off the comp's section heading (93:3073). */}
      {heading ? (
        <As className="text-[clamp(1.75rem,2.92vw,2.625rem)]/[1.19] tracking-normal text-wrap text-[#000000] dark:text-foreground">
          {heading}
          {headingAccent ? <span className="text-primary"> {headingAccent}</span> : null}
        </As>
      ) : null}
      {body ? <p className="text-lg text-muted-foreground">{body}</p> : null}
    </div>
  )
}

function Ctas({
  ctas,
  locale,
  size = 'lg',
  className,
  withArrow = true,
}: {
  ctas?: BlockProps['ctas']
  locale: Locale
  size?: 'md' | 'lg'
  /** Extra classes per button — the comps size or recolour a few CTAs. */
  className?: string
  withArrow?: boolean
}) {
  const resolved = (ctas ?? []).map((c) => ({
    variant: c.variant,
    link: resolveLink(c.link, locale),
  }))
  if (!resolved.some((c) => c.link)) return null
  return (
    <div className="flex flex-wrap gap-3">
      {resolved.map((c) =>
        c.link ? (
          <LinkButton
            key={c.link.href}
            link={c.link}
            variant={c.variant ?? 'primary'}
            size={size}
            withArrow={withArrow}
            className={className}
          />
        ) : null,
      )}
    </div>
  )
}

/* Hero body copy supports **bold** runs — comp 93:2966 bolds the key figures
   inside an otherwise plain paragraph, and a full richText field would be
   overkill for one emphasis style. */
function emphasize(text: string) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 ? (
      <strong key={i} className="font-semibold text-[#333333] dark:text-foreground">
        {part}
      </strong>
    ) : (
      part
    ),
  )
}

/**
 * Meet-Fika comp — copy at the start, illustration at the end, on the same
 * soft wash as the other heroes. Its own function rather than a third branch
 * inside HeroSection: it shares no alignment, no collage and no badge row
 * with the centred layouts, so weaving it in would only tangle them.
 */
function SplitHero({ block, locale, isFirst }: { block: BlockProps; locale: Locale; isFirst: boolean }) {
  const media = block.media as MediaDoc
  const Title = isFirst ? 'h1' : 'h2'
  return (
    <section
      id={block.anchor ?? undefined}
      className="relative isolate mt-[calc(var(--header-block)*-1)] overflow-hidden pt-[calc(var(--header-block)+clamp(2rem,5vw,4.5rem))] pb-[clamp(2.5rem,5vw,4.5rem)] dark:bg-background"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(117.67deg,rgba(238,252,243,0.4)_3.72%,rgba(220,239,247,0.4)_103.6%)] dark:bg-none"
      />
      <div className="container-site grid items-center gap-10 md:grid-cols-[1fr_410px] md:gap-12">
        <div className="max-w-[568px]">
          <Title className="text-[clamp(2rem,3.06vw,2.75rem)]/[1.06] font-bold tracking-normal text-wrap text-[#333333] dark:text-foreground">
            {block.heading}
            {block.headingAccent ? (
              <>
                {' '}
                <span className="text-[#2ebde9]">{block.headingAccent}</span>
              </>
            ) : null}
          </Title>
          {block.body ? (
            <p className="mt-6 text-[clamp(0.875rem,1.11vw,1rem)]/[1.55] whitespace-pre-line text-[#333333] dark:text-muted-foreground">
              {block.body}
            </p>
          ) : null}
          {block.ctas?.length ? (
            <div className="mt-7">
              <Ctas ctas={block.ctas} locale={locale} />
            </div>
          ) : null}
        </div>
        <Image
          src={mediaUrl(media)}
          alt={mediaAlt(media)}
          width={384}
          height={417}
          priority={isFirst}
          style={{ height: 'auto' }}
          className="mx-auto h-auto w-[clamp(240px,28.5vw,410px)] object-contain md:mx-0"
        />
      </div>
    </section>
  )
}

export function HeroSection({
  block,
  locale,
  isFirst,
}: {
  block: BlockProps
  locale: Locale
  isFirst: boolean
}) {
  // An illustration switches the hero to the split Meet-Fika layout.
  if ((block.media as MediaDoc | undefined)?.url) return <SplitHero block={block} locale={locale} isFirst={isFirst} />

  const words = (block.rotatingWords ?? []).map((w) => w.text).filter(Boolean)
  let photoIndex = 0
  const mosaic = (block.mosaic ?? []).map((item) => {
    if (item.kind === 'stat') return item
    const source = item.image as MediaDoc | undefined
    const replacement = defaultHeroPhoto(source?.url, photoIndex++)
    return replacement ? { ...item, image: replacement } : item
  })
  const Title = isFirst ? 'h1' : 'h2'

  // Four photo/stat pairs retain every business figure on phones.
  const mobileTiles: typeof mosaic = []
  const photos = mosaic.filter((item) => item.kind !== 'stat')
  const stats = mosaic.filter((item) => item.kind === 'stat')
  for (let i = 0; mobileTiles.length < 8 && (photos[i] || stats[i]); i++) {
    /*
     * Zig-zag the pair. Pushing photo-then-stat every time puts every photo in
     * the left grid column and every stat in the right one — two stacked
     * columns, not a collage. Flipping odd rows makes the stats alternate
     * sides, which is what the desktop board does.
     */
    const pair = [photos[i], stats[i]].filter((item) => item != null)
    if (i % 2) pair.reverse()
    mobileTiles.push(...pair.slice(0, 8 - mobileTiles.length))
  }

  // No mosaic -> the About comp's simple centred hero: wider copy column,
  // larger subhead, badge pills below the CTA. Home (with mosaic) unaffected.
  const simple = !mosaic.length

  const tile = (item: (typeof mosaic)[number], index: number, compact = false) => {
    const image = item.image as MediaDoc | undefined
    const corner = compact
      ? TILE_CORNER_SM[item.corner ?? 'tl']
      : TILE_CORNER[MOSAIC_LAYOUT[index]?.corner ?? item.corner ?? 'tl']

    if (item.kind === 'stat') {
      return (
        <div
          className={cn(
            'flex size-full flex-col items-start justify-center text-start',
            compact ? 'p-3.5' : 'px-[clamp(1rem,1.8vw,2.5rem)] py-3',
            corner,
            STAT_TONE[item.tone ?? 'green'],
          )}
        >
          {/* Fluid with the tile width — the comp's 24/40px pair is only safe at 1440.
              Compact flips the ratio: on a 174px cell the number has to lead, so the
              label drops to 13px and the value grows. */}
          <span
            className={cn(
              'flex min-h-[2.5em] items-center font-display leading-tight tracking-[-0.04em] rtl:tracking-normal',
              compact ? 'text-[0.8125rem]' : 'text-[clamp(0.75rem,1.3vw,1.75rem)] leading-[1.25] font-medium',
            )}
          >
            {item.label}
          </span>
          <CountUp
            value={item.value ?? ''}
            dir="ltr"
            className={cn(
              'font-[family-name:var(--font-urbanist)] font-bold tracking-[-0.04em]',
              compact
                ? 'mt-1.5 block text-[1.75rem] leading-none'
                : 'mt-[0.35em] block text-[clamp(1.5rem,2.9vw,3.75rem)] leading-none',
            )}
          />
        </div>
      )
    }

    return (
      <div className={cn('relative size-full overflow-hidden bg-tile-mist dark:bg-card', corner)}>
        {image?.url ? (
          <Image
            src={mediaUrl(image)}
            alt={mediaAlt(image)}
            fill
            sizes="(min-width: 768px) 24vw, 50vw"
            priority={isFirst && index < 4}
            className="object-cover object-[center_35%] md:object-center"
          />
        ) : null}
      </div>
    )
  }

  return (
    <section
      id={block.anchor ?? undefined}
      // Natural height, not h-dvh: locking to one screen squashed the collage
      // board on short windows, which is what broke the tiles' proportions.
      // Budgeted so copy + collage land the section bottom at ~982px on a
      // 1440x982 screen — the whole hero fits one screen by default there.
      data-motion="hero"
      className={cn(
        'relative isolate mt-[calc(var(--header-block)*-1)] flex flex-col overflow-hidden pt-[calc(var(--header-block)+clamp(1.25rem,3vw,2.5rem))] pb-8 md:pb-12 dark:bg-background',
        // The copy-only hero carries the comp's 136px of air under the nav;
        // the collage hero cannot afford it and keeps the tighter default.
        // 26px under the badges is the comp's own clearance (pills end 758,
        // frame ends 784) — the default 48px left the tint cutting to white
        // right at the badge edge.
        simple &&
          'pt-[calc(var(--header-block)+clamp(2rem,8.8vw,7.875rem))] pb-[26px] md:pb-[26px]',
      )}
    >
      {/*
        The tint is its own layer, stopping where the collage stops, so the
        section can hold padding under the tiles without the gradient bleeding
        into it. On the section itself those two are the same edge — you get a
        coloured strip below the images or no clearance at all, not both.
        `isolate` on the section keeps this -z-10 above the page background.
      */}
      <div
        aria-hidden
        /* Dark gets its own wash rather than `dark:hidden`, which left the hero
           flat black while every other theme surface carried a tint. Same angle,
           brand teal into navy at low alpha over the dark background. */
        className={cn(
          'absolute inset-x-0 top-0 bottom-8 md:bottom-12 -z-10 bg-[linear-gradient(117.67deg,rgba(238,252,243,0.4)_3.72%,rgba(220,239,247,0.4)_103.6%)] dark:bg-none',
          // No collage to clear, so the wash runs the full frame as it does in
          // the comp, instead of stopping short and banding into white.
          simple && 'bottom-0 md:bottom-0',
        )}
      />
      <div className="relative z-10 container-wide shrink-0">
        {/* Uniform ~28px rhythm between pill, headline, body, bullets and CTA —
            measured off the comp at 1440. */}
        <div
          className={cn(
            'mx-auto flex max-w-[844px] flex-col items-center text-center',
            simple ? 'max-w-[1130px] gap-0' : 'gap-5 md:gap-7',
          )}
        >
          {block.trustLine ? (
            <p
              style={{ '--i': 0 } as React.CSSProperties}
              /* text-ink-500 is a LIGHT-mode grey and had no dark override, so
                 in dark it sat at 3.39:1 on the card — under the 4.5:1 floor.
                 The pill also used bg-card, only 1.13:1 against the page, so it
                 barely read as a pill at all. Elevated + foreground fixes both. */
              className="fk-enter inline-flex items-center gap-2 rounded-pill border border-[rgba(25,36,36,0.08)] bg-white py-1 ps-1 pe-3 text-xs font-medium sm:pe-3.5 sm:text-sm tracking-[0.35px] text-ink-500 dark:border-border dark:bg-elevated dark:text-foreground"
            >
              {/* Client faces lead the line as social proof — the testimonial
                  portraits, overlapped and ringed in the pill's own surface. */}
              <span aria-hidden className="flex shrink-0">
                {TESTIMONIAL_PROFILES.slice(0, 4).map((profile) => (
                  <Image
                    key={profile.avatar}
                    src={profile.avatar}
                    alt=""
                    width={28}
                    height={28}
                    className="size-6 rounded-pill object-cover ring-2 ring-white not-first:-ms-2 sm:size-7 dark:ring-elevated"
                  />
                ))}
              </span>
              {block.trustLine}
            </p>
          ) : null}

          <Title
            style={{ '--i': 1 } as React.CSSProperties}
            // 60px at the 1440 comp width, easing down with the viewport.
            className={cn(
              'fk-enter font-display font-bold',
              simple
                ? // text-wrap overrides the global `text-wrap: balance` on
                  // headings: the comp fills line one and drops the remainder
                  // ("…Technology &" / "Outsourcing Partner"), where balancing
                  // evens the two lines and breaks after "Trusted".
                  'text-[clamp(1.875rem,3.6vw,3.25rem)] leading-[1.19] font-semibold tracking-normal text-wrap text-[#333333] dark:text-foreground'
                : 'text-[clamp(1.75rem,4.6vw,3.75rem)] leading-[1.08] tracking-[-0.5px] text-balance text-navy-800 md:leading-[1.05] md:tracking-[-1.5px] dark:text-foreground',
            )}
          >
            {block.heading}
            <br />
            {/* Second line is a gradient fill in the comp, teal -> blue.
                The gradient must live ON the animated word (inside
                RotatingWords), not on a wrapper: Chrome leaves paint slivers
                when a `background-clip: text` element has animating children. */}
            {words.length ? (
              <RotatingWords words={words} />
            ) : block.headingAccent ? (
              /* Static accent renders as the SUBHEAD line (About-page comp
                 93:2966): small, bold, navy — several steps below the H1. */
              /* Roboto Medium in the comp, not the display face — Inter is
                 our neutral grotesque, so the subhead drops out of the display face. */
              <span className="mt-2 block font-sans text-[clamp(1.125rem,1.66vw,1.5rem)] leading-[1.25] font-medium tracking-normal text-[#333333] dark:text-foreground">
                {block.headingAccent}
              </span>
            ) : null}
          </Title>

          {block.body ? (
            <p
              style={{ '--i': 2 } as React.CSSProperties}
              className={cn(
                'fk-enter whitespace-pre-line',
                simple
                  ? 'mt-[21px] text-[clamp(0.9375rem,1.25vw,1.125rem)]/[1.56] text-[#333333] dark:text-muted-foreground'
                  : 'text-[15px]/6 text-ink-500 md:text-lg/7 dark:text-muted-foreground',
              )}
            >
              {emphasize(block.body)}
            </p>
          ) : null}

          {block.bullets?.length && !simple ? (
            <ul
              style={{ '--i': 3 } as React.CSSProperties}
              /* One row at every size, and it must fit — the three labels run
                 ~85 characters, so a nowrap row scrolled the third bullet off a
                 390px screen. Equal thirds instead, icon stacked over centred
                 text: left-aligned wrapping left three ragged blocks of
                 different heights, which is what read as broken. items-stretch
                 runs the dividers the full height of the tallest column.
                 Back to a wrapped inline row at md, where they fit on a line. */
              className="fk-enter mx-auto grid w-full grid-cols-3 items-stretch md:flex md:w-auto md:flex-wrap md:items-center md:justify-center md:gap-x-8 md:gap-y-3"
            >
              {block.bullets.map((bullet, index) => {
                const FeatureIcon = [BadgeCheck, ListChecks, Workflow][index % 3]!
                return (
                  <li
                    key={bullet.text}
                    /* Vertical hairline between columns, dropped at md where
                       gap-x-8 already separates them. */
                    className="flex flex-col items-center justify-start gap-1.5 border-s border-border px-2 text-center text-[11px] leading-tight text-ink-500 first:border-0 sm:text-sm md:flex-row md:gap-1 md:border-0 md:px-0 md:text-start md:leading-normal dark:text-muted-foreground"
                  >
                    <FeatureIcon data-hero-feature-icon aria-hidden className="size-5 shrink-0 text-primary" strokeWidth={1.8} />
                    {bullet.text}
                  </li>
                )
              })}
            </ul>
          ) : null}

          <div
            style={{ '--i': 4 } as React.CSSProperties}
            // The arbitrary variants stretch Ctas' shrink-to-fit container so
            // the button can actually fill the row on phones.
            className={cn(
              'fk-enter flex w-full flex-wrap justify-center gap-4 [&>div]:w-full [&>div]:justify-center',
              simple && 'mt-[10px]',
            )}
          >
            <Ctas
              ctas={block.ctas}
              locale={locale}
              className="w-full py-3 text-sm sm:w-auto sm:py-4 sm:text-base"
            />
          </div>

          {block.bullets?.length && simple ? (
            /* Simple hero (comp 93:2966): grey badge chips BELOW the CTA. A
               CMS icon upload wins; otherwise the comp's three glyphs cycle —
               medal, signed document, clock. */
            <ul
              style={{ '--i': 5 } as React.CSSProperties}
              className="fk-enter mt-[29px] flex flex-wrap items-center justify-center gap-2.5"
            >
              {block.bullets.map((bullet, i) => {
                const icon = bullet.icon as MediaDoc | undefined
                const Fallback = [Award, FilePenLine, Clock][i % 3]!
                return (
                  <li
                    key={bullet.text}
                    className="inline-flex h-[38px] items-center gap-1.5 rounded-pill bg-[#eef0f4] px-5 text-base font-normal text-black dark:bg-elevated dark:text-foreground"
                  >
                    {icon?.url ? (
                      <Image
                        src={mediaUrl(icon)}
                        alt=""
                        width={20}
                        height={20}
                        aria-hidden
                        className="fk-mono-icon size-5 shrink-0"
                      />
                    ) : (
                      <Fallback aria-hidden className="fk-mono-icon size-5 shrink-0" strokeWidth={1.8} />
                    )}
                    {bullet.text}
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      </div>

      {mosaic.length ? (
        <>
          {/* The board's top edge sits level with the CTA row, as in the
              reference: the outer portraits start beside the button and the
              centre columns rise to a gutter below it. Tablets pull up less
              so the middle photo keeps clear of the button. */}
          <div data-hero-collage className="relative mx-3 -mt-8 hidden aspect-[1975/629] [--radius-tile:clamp(1.5rem,5.5vw,7rem)] md:block xl:-mt-16">
            {mosaic.map((item, index) => {
              const pos = MOSAIC_LAYOUT[index]
              if (!pos) return null
              return (
                <div
                  key={index}
                  data-scroll-reveal
                  className="absolute"
                  style={
                    {
                      left: `${pos.left}%`,
                      top: `${pos.top}%`,
                      width: `${pos.width}%`,
                      height: `${pos.height}%`,
                      '--i': index,
                    } as React.CSSProperties
                  }
                >
                  {tile(item, index)}
                </div>
              )
            })}
          </div>

          {mosaic.length > MOSAIC_LAYOUT.length ? (
            <ul className="mx-3 mt-3 hidden grid-cols-4 gap-3 md:grid">
              {mosaic.slice(MOSAIC_LAYOUT.length).map((item, index) => (
                <li key={index} className="aspect-[4/3]">{tile(item, index + MOSAIC_LAYOUT.length)}</li>
              ))}
            </ul>
          ) : null}

          {/* Mobile: the collage would be unreadable at 390px, so the curated
              tiles become a two-column board. Uniform cells — each tile's own
              rounded corner is what keeps it reading as the collage. */}
          <ul className="mt-5 grid auto-rows-[124px] grid-cols-2 gap-3 px-4 md:hidden">
            {mobileTiles.map((item, index) => (
              <li key={index} data-scroll-reveal>{tile(item, index, true)}</li>
            ))}
          </ul>
        </>
      ) : null}

      {block.stats?.length ? (
        <div className="container-wide">
          <dl className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {block.stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-sm text-muted-foreground">{stat.label}</dt>
                <dd className="font-display text-3xl font-bold text-primary">
                  <CountUp value={stat.value ?? ''} dir="ltr" />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </section>
  )
}

export function LogoCloudSection({ block }: { block: BlockProps; locale: Locale }) {
  /* Figma 1:11600 — the same logo array, presented as a centred badge row
     under a gradient heading instead of beside a statement. */
  if (block.variant === 'badges') {
    const badges = block.logos ?? []
    if (!badges.length) return null
    return (
      <section
        id={block.anchor ?? undefined}
        className="section bg-[linear-gradient(180deg,#eafafb_0%,#ffffff_100%)] dark:bg-none dark:bg-background"
      >
        <div className="container-site flex flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-4 text-center">
            {block.eyebrow ? (
              <p className="text-sm font-semibold tracking-[2.8px] text-navy-800 uppercase dark:text-foreground">
                {block.eyebrow}
              </p>
            ) : null}
            <h2 className="font-display text-[clamp(1.75rem,2.92vw,2.625rem)] leading-[1.19] font-bold">
              <span className="bg-[linear-gradient(139.28deg,#12cbb4_0%,#375bc7_100%)] bg-clip-text text-transparent">
                {block.heading}
              </span>
            </h2>
          </div>

          <ul className="flex w-full flex-wrap items-center justify-center gap-x-12 gap-y-8 lg:justify-between">
            {badges.map((badge) => {
              const image = badge.image as MediaDoc | undefined
              if (!image?.url) return null
              return (
                <li key={badge.name} className={cn('flex h-32 items-center justify-center p-3', certificationSource(image).includes('istqb') ? 'w-52' : 'w-36 sm:w-44')}>
                  {/* Heights are equalised, widths left to each badge: the row
                      mixes a wide lockup with four round seals. */}
                  <Image
                    src={certificationSource(image)}
                    alt={badge.name}
                    width={296}
                    height={125}
                    style={{ width: 'auto' }}
                    className="max-h-[104px] max-w-full object-contain"
                  />
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    )
  }

  const logos = (block.logos ?? []).map(clientLogo)
  const statement = block.statement
  const hasStatement = Boolean(statement?.before || statement?.highlight || statement?.after)
  // The statement is content in its own right — it should not disappear just
  // because the client logos have not been uploaded yet (8.9).
  if (!logos.length && !hasStatement) return null

  return (
    /* Figma 1:10296 — 120px gutters, 80px block padding, statement and logo
       board pushed to opposite edges. container-site is the 1440 frame's
       content width; container-wide would stretch the board out of proportion. */
    <section id={block.anchor ?? undefined} className="py-[var(--section-y)]">
      {/*
       * Proportions matched to the BairesDev client-logo section, per the
       * feedback's reference: stacked and centred until lg, then a two-column
       * row with the copy on a 25rem basis and the board on 38rem, the pair
       * capped at 5xl then 6xl. `basis` rather than justify-between is what
       * stops the two halves drifting apart on a wide screen.
       */}
      {/*
       * justify-center + fixed gap, NOT flex-1/basis: container-site sits in
       * the same utilities layer as Tailwind's max-w-* and is declared later,
       * so the lg:max-w-5xl cap lost and the row ran ~1800px wide. With the
       * copy on flex-1 it absorbed all of that, its text capped at 28rem —
       * which put ~700px of dead air between the text and the grid. Centring
       * the pair with a fixed gap cannot stretch, whatever the row width.
       */}
      <div className="container-site mx-auto flex flex-col items-center gap-10 lg:flex-row lg:justify-center lg:gap-10 xl:gap-14">
        {hasStatement ? (
          <p className="mx-auto max-w-md text-center font-display text-[28px] leading-[1.3] font-semibold text-navy-800 sm:text-[32px] lg:mx-0 lg:my-auto lg:w-[430px] lg:max-w-none lg:shrink-0 lg:text-start lg:text-[36px] dark:text-foreground">
            {statement?.before}{' '}
            {statement?.highlight ? (
              <span className="text-primary">{statement.highlight}</span>
            ) : null}{' '}
            {statement?.after}
          </p>
        ) : block.heading ? (
          <p className="text-sm text-muted-foreground">{block.heading}</p>
        ) : (
          <span />
        )}

        {logos.length ? (
          /* Compared three- and four-column boards: three preserves the
             reference's balance and keeps the detailed lockups legible. */
          <ul data-client-logos className="mx-auto grid w-full max-w-[38rem] grid-cols-3 gap-x-4 gap-y-5 sm:gap-x-6 lg:mx-0 lg:min-w-0">
            {logos.map((logo) => {
              const image = logo.image as MediaDoc | undefined
              if (!image?.url) return null
              return (
                /*
                 * Proportions remain intact inside consistent cells, with
                 * optical padding for the broadest and narrowest marks.
                 *
                 * Dark mode sets the marks on a light tile rather than
                 * inverting them — three of the twelve ship opaque white
                 * grounds, and inverting those makes solid white rectangles.
                 */
                <li
                  key={logo.name}
                  className="fk-art-surface group/client-logo relative mx-auto flex h-24 w-full max-w-[11rem] items-center justify-center rounded-lg bg-white p-2 sm:h-28"
                >
                  <span className="relative block" style={logoMarkSize(image.width, image.height, 160 / 88) ?? { width: '100%', height: '100%' }}>
                    <Image
                      src={mediaUrl(image)}
                      alt={logo.name ?? image.alt ?? ''}
                      fill
                      sizes="(max-width: 640px) 28vw, 160px"
                      className="fk-art-image object-contain grayscale transition-[filter] duration-200 group-hover/client-logo:grayscale-0 dark:grayscale-0 motion-reduce:transition-none"
                    />
                  </span>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </section>
  )
}

export function CardGridSection({ block, locale }: { block: BlockProps; locale: Locale }) {
  const columns = block.columns ?? '3'
  const cards = block.cards ?? []

  /*
   * Figma 1:10748 — two cards over three. A six-column grid gets that from the
   * card count alone: the first two span three columns, the rest span two. No
   * per-row markup, and a sixth card simply joins the second row.
   */
  /*
   * About comp 93:3098 — full-width certification rows: badge art at the
   * start, title over a bold one-liner over body copy, and a tinted
   * "What It Means for You" strip across the bottom. Strip tints cycle.
   */
  /*
   * Meet-Fika comp — six numbered steps in two narrow columns. The number is
   * part of the card title in the CMS ("1. Understand Your Needs Faster"), so
   * there is no counter to keep in sync with the copy.
   */
  if (block.variant === 'numbered') {
    return (
      <section id={block.anchor ?? undefined} className="section">
        <div className="container-site flex flex-col items-center gap-10">
          {block.heading ? (
            <h2 className="text-center text-[clamp(1.875rem,4.03vw,3.625rem)]/[1.15] font-bold tracking-normal text-[#000000] dark:text-foreground">
              {block.heading}
            </h2>
          ) : null}
          <ul className="grid w-full max-w-[749px] gap-y-6 sm:grid-cols-2 sm:gap-x-[117px]">
            {cards.map((card) => (
              <li
                key={card.title}
                className="flex min-h-[140px] flex-col justify-center rounded-xl bg-[#f7f8fb] px-5 py-5 shadow-[0_1px_3px_rgba(25,33,61,0.04)] dark:bg-card"
              >
                <h3 className="text-[15px]/[22px] font-semibold text-[#333333] dark:text-foreground">{card.title}</h3>
                {card.body ? (
                  <p className="mt-2.5 text-[14px]/[21px] text-ink-500 dark:text-muted-foreground">{card.body}</p>
                ) : null}
              </li>
            ))}
          </ul>
          <Ctas ctas={block.ctas} locale={locale} />
        </div>
      </section>
    )
  }

  if (block.variant === 'compliance') {
    /*
     * Row 1 is measured off the comp (93:3103): a #e4f0fe disc behind the
     * badge and a #d9f3cf strip. Rows 2-5 keep the comp's hue order but their
     * exact values are unread — Figma's call limit only allowed one row.
     * ponytail: approximated tints, replace with the real ones when the rest
     * of 93:3112-93:3140 can be read.
     */
    const ROW_TINTS = [
      { disc: '#e4f0fe', strip: '#d9f3cf' },
      { disc: '#e4f0fe', strip: '#dbe4fb' },
      { disc: '#e4f0fe', strip: '#fbdcdc' },
      { disc: '#e4f0fe', strip: '#d5ecfa' },
      { disc: '#e4f0fe', strip: '#fbf0cf' },
    ]
    return (
      /* The rows are bg-white in the comp, which only reads as a card because
         the band behind them is tinted. */
      <section
        id={block.anchor ?? undefined}
        className="section bg-[#eafafb] dark:bg-background-subtle"
      >
        {/* Wider than `.container-site`: the comp runs the heading on one line
            (896 wide) and the description on one line at 1329, which is past
            the 1200 grid. Boxed at max-w-4xl both wrapped to two lines. */}
        <div className="mx-auto flex w-full max-w-[1330px] flex-col items-center gap-12 px-5">
          <div className="flex flex-col items-center gap-4 text-center">
            {block.eyebrow ? (
              <p className="text-sm font-semibold tracking-[2.8px] text-navy-800 uppercase dark:text-foreground">
                {block.eyebrow}
              </p>
            ) : null}
            <h2 className="font-display text-[clamp(1.75rem,2.92vw,2.625rem)]/[1.19] font-bold tracking-normal text-[#000000] dark:text-foreground">
              {block.heading}
            </h2>
            {block.body ? (
              <p className="text-[clamp(1rem,1.39vw,1.25rem)]/[1.6] text-[#333333] dark:text-muted-foreground">
                {block.body}
              </p>
            ) : null}
          </div>

          {/* 1096-wide list, 30px between rows. Each row is a 10px-radius white
              card — no border — with a 120px disc at a 25px inset, a 30px
              gutter, then the copy, over a 34px tinted strip (93:3103). */}
          <ul className="flex w-full max-w-[1096px] flex-col gap-[30px]">
            {cards.map((card, index) => {
              const icon = card.icon as MediaDoc | undefined
              const tint = ROW_TINTS[index % ROW_TINTS.length]!
              // The comp sets the "What It Means for You:" lead-in Regular and
              // the sentence after it Medium.
              const split = card.note?.indexOf(':') ?? -1
              const noteLead = split > -1 ? card.note!.slice(0, split + 1) : null
              const noteRest = split > -1 ? card.note!.slice(split + 1) : card.note
              return (
                <li
                  key={card.title}
                  className="overflow-hidden rounded-[10px] bg-white dark:bg-card"
                >
                  <div className="flex flex-col items-center gap-5 px-[25px] py-6 sm:min-h-[150px] sm:flex-row sm:gap-[30px] sm:py-[15px]">
                    {icon?.url ? (
                      /* The comp discs only the round badges — the ISTQB
                         wordmark (157x56) sits bare, and a circle behind a
                         wide lockup reads wrong. Derived from the art rather
                         than a CMS flag: no new field, no migration. */
                      <span className="grid h-[120px] w-[184px] shrink-0 place-items-center p-2">
                        <Image
                          src={certificationSource(icon)}
                          alt=""
                          width={120}
                          height={120}
                          aria-hidden
                          style={{ width: 'auto' }}
                          className="max-h-[104px] w-auto max-w-full object-contain"
                        />
                      </span>
                    ) : null}
                    <div className="text-center sm:text-start">
                      <h3 className="text-[22px]/[26px] font-semibold text-[#333333] dark:text-foreground">
                        {card.title}
                      </h3>
                      {card.subtitle ? (
                        <p className="mt-[15px] text-[18px]/[22px] font-medium text-[#333333] dark:text-foreground">
                          {card.subtitle}
                        </p>
                      ) : null}
                      {card.body ? (
                        <p className="mt-2.5 max-w-[868px] text-[15px]/[18px] text-[#666666] dark:text-muted-foreground">
                          {card.body}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {card.note ? (
                    <p
                      style={{ '--fk-tint': tint.strip } as React.CSSProperties}
                      className="fk-tint-bg flex min-h-[34px] items-center justify-center px-6 py-2 text-center text-[14px]/[18px] text-[#333333] dark:text-foreground"
                    >
                      <span>
                        {noteLead}
                        <span className="font-medium">{noteRest}</span>
                      </span>
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>

          <Ctas ctas={block.ctas} locale={locale} />
        </div>
      </section>
    )
  }

  if (block.variant === 'business') {
    return (
      <section id={block.anchor ?? undefined} className="section">
        <div className="container-site flex flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-4 text-center">
            {block.eyebrow ? (
              <p className="text-sm font-semibold tracking-[2.8px] text-navy-800 uppercase dark:text-foreground">
                {block.eyebrow}
              </p>
            ) : null}
            <h2 className="font-display text-[clamp(1.75rem,2.92vw,2.625rem)] leading-[1.19] font-bold">
              <span className="bg-[linear-gradient(147.07deg,#12cbb4_0%,#375bc7_100%)] bg-clip-text text-transparent">
                {block.heading}
                {block.headingAccent ? ` ${block.headingAccent}` : null}
              </span>
            </h2>
            {block.body ? (
              <p className="max-w-full text-base/[1.5] text-ink-500 xl:text-lg dark:text-muted-foreground">
                {block.body}
              </p>
            ) : null}
          </div>

          <ul className="grid w-full gap-6 md:grid-cols-6">
            {cards.map((card, index) => {
              const icon = card.icon as MediaDoc | undefined
              return (
                <li
                  key={card.title}
                  className={cn(
                    'relative isolate overflow-hidden rounded-card border border-panel-grey bg-card px-5 py-5 sm:px-7 sm:py-6 dark:border-border',
                    index < 2 ? 'md:col-span-3' : 'md:col-span-2',
                  )}
                >
                  {/* Blue-to-grey wash at 40%, and the dotted corner, both
                      decorative — behind the content and out of the a11y tree. */}
                  <div
                    aria-hidden
                    className="absolute inset-0 -z-10 bg-[linear-gradient(149.31deg,rgba(72,155,194,0.4)_0%,rgba(142,142,142,0.1)_100%)] opacity-40 dark:opacity-20"
                  />
                  <Image
                    aria-hidden
                    src="/images/decor/card-corner-dots.svg"
                    alt=""
                    width={132}
                    height={86}
                    className="pointer-events-none absolute -end-px -top-2 -z-10 w-[132px] rtl:-scale-x-100"
                  />

                  <div className="flex flex-col gap-3">
                    {icon?.url ? (
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-card dark:bg-elevated">
                        {/* Eager: a lazy 24px icon leaves the white chip empty
                            until it arrives, which reads as a missing icon. */}
                        <Image
                          src={mediaUrl(icon)}
                          alt=""
                          width={24}
                          height={24}
                          loading="eager"
                          className="fk-mono-icon size-6"
                          aria-hidden
                        />
                      </span>
                    ) : null}
                    <h3 className="pt-2 font-display text-xl leading-7 font-bold text-navy-800 dark:text-foreground">
                      {card.title}
                    </h3>
                    {card.body ? (
                      <p className="text-base/[1.55] whitespace-pre-line text-ink-500 sm:text-lg/[1.35] dark:text-muted-foreground">
                        {card.body}
                      </p>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>

          <Ctas ctas={block.ctas} locale={locale} />
        </div>
      </section>
    )
  }

  return (
    <section id={block.anchor ?? undefined} className="section">
      <div className="container-site">
        <SectionHeading
          eyebrow={block.eyebrow}
          heading={block.heading}
          headingAccent={block.headingAccent}
          body={block.body}
        />
        <ul
          className={cn(
            'mt-12 grid gap-6 sm:grid-cols-2',
            columns === '2' && 'lg:grid-cols-2',
            columns === '3' && 'lg:grid-cols-3',
            columns === '4' && 'lg:grid-cols-4',
          )}
        >
          {cards.map((card) => {
            const link = resolveLink(card.link, locale)
            const icon = card.icon as MediaDoc | undefined
            const inner = (
              <>
                {icon ? (
                  <Image
                    src={mediaUrl(icon)}
                    alt=""
                    width={48}
                    height={48}
                    className="fk-mono-icon size-12"
                    aria-hidden
                  />
                ) : null}
                <h3 className="text-xl">{card.title}</h3>
                {card.body ? <p className="text-sm text-muted-foreground">{card.body}</p> : null}
              </>
            )
            return (
              <li key={card.title}>
                {link ? (
                  <Link
                    href={link.href}
                    className="flex h-full flex-col gap-3 rounded-card border border-border bg-card p-6 transition-shadow hover:shadow-lift"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="flex h-full flex-col gap-3 rounded-card border border-border bg-card p-6">
                    {inner}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
        <div className="mt-10 flex justify-center">
          <Ctas ctas={block.ctas} locale={locale} />
        </div>
      </div>
    </section>
  )
}

/* Figma 3:1825 — the five pastels cycle across the grid; the editor picks
   each tile's tone so a new industry does not have to inherit a neighbour's. */
const INDUSTRY_TONE = {
  pink: 'var(--color-industry-pink)',
  mint: 'var(--color-industry-mint)',
  lilac: 'var(--color-industry-lilac)',
  teal: 'var(--color-industry-teal)',
  blue: 'var(--color-industry-blue)',
} as const

export function IndustriesSection({ block }: { block: BlockProps }) {
  const items = block.industries ?? []
  if (!items.length) return null

  return (
    <section
      id={block.anchor ?? undefined}
      className="section bg-[linear-gradient(180deg,#ffffff_0%,#e9f9fa_100%)] dark:bg-none dark:bg-background"
    >
      <div className="container-board flex flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-tight font-bold">
            <span className="bg-[linear-gradient(145.94deg,#12cbb4_0%,#375bc7_100%)] bg-clip-text text-transparent">
              {block.heading}
              {block.headingAccent ? ` ${block.headingAccent}` : null}
            </span>
          </h2>
          {block.body ? (
            <p className="max-w-3xl text-lg/7 text-ink-500 dark:text-muted-foreground">
              {block.body}
            </p>
          ) : null}
        </div>

        {/*
         * IE-1 — the comp is three rows at 1440, but an unconstrained wrap fits
         * six per row and lands 6/6/6/2: four rows with a stranded pair on the
         * end, which is what reads as crowded and unfinished.
         *
         * Capping the list at seven cards' width (7x160 + 6x24 = 1264) forces
         * exactly seven per row, so twenty items land 7/7/6 — three balanced
         * rows with no orphan. Still a wrap, so it reflows normally below lg.
         */}
        <ul className="grid w-full grid-cols-3 gap-3 sm:flex sm:w-auto sm:flex-wrap sm:justify-center sm:gap-6 lg:max-w-[1264px]">
          {items.map((item) => {
            const icon = item.icon as MediaDoc | undefined
            return (
              <li
                key={item.label}
                style={{ '--fk-tint': INDUSTRY_TONE[item.tone ?? 'teal'] } as React.CSSProperties}
                className="fk-tint-bg fk-tint-border flex min-w-0 flex-col items-center gap-2 rounded-tl-industry rounded-br-industry border px-2 py-3 sm:w-[160px] sm:gap-4 sm:px-4 sm:py-4"
              >
                <span className="flex size-8 items-center justify-center">
                  {icon?.url ? (
                    <Image
                      src={/ind-logistics|logistics/i.test(icon.url ?? '') ? '/images/industries/ind-logistics.svg' : mediaUrl(icon)}
                      alt=""
                      width={32}
                      height={32}
                      aria-hidden
                      className="fk-mono-icon size-8"
                    />
                  ) : null}
                </span>
                <span className="text-center text-sm leading-5 font-semibold [overflow-wrap:anywhere] text-ink-900 sm:text-base sm:leading-6 dark:text-foreground">
                  {item.label}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/*
 * About comp 93:3074-93:3095 — one tint per card, used for BOTH the 2px
 * border and the corner chip. The chip is flush to the top-end corner (which
 * is why the card leaves that corner square) and the glyph inside is plain
 * #333, not a saturated version of the tint. Cycles, so a fifth stat reuses
 * the first tint.
 */
const STAT_TINTS = ['#e3f0f6', '#fdf3ed', '#eff5e7', '#fbf5e7'] as const

export function StatsSection({ block }: { block: BlockProps }) {
  return (
    <section id={block.anchor ?? undefined} className="section">
      <div className="container-site">
        {block.heading ? <SectionHeading heading={block.heading} /> : null}
        {/* 282x204 cards on the 1200 grid, 24px apart — 93:3074. Value box is
            centred at 82 and the label at 136, both on a 22px inset. */}
        <dl className="mt-[35px] grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-6">
          {(block.items ?? []).map((item, i) => {
            const tint = STAT_TINTS[i % STAT_TINTS.length]
            const icon = item.icon as MediaDoc | undefined
            return (
              <div
                key={i}
                style={{ '--fk-tint': tint } as React.CSSProperties}
                /* The comp's 52px of top air is a 1440 number; below md it
                   would leave the label almost no room. Top-end corner stays
                   square so the chip can sit flush in it. */
                className="fk-tint-border relative flex min-w-0 flex-col overflow-hidden rounded-[25px] rounded-se-none border-2 bg-white px-[22px] pt-8 pb-8 shadow-[0_3px_3px_rgba(51,51,51,0.05)] md:min-h-[204px] md:pt-[52px] md:pb-0 dark:bg-card"
              >
                <span
                  aria-hidden
                  className="fk-tint-bg absolute end-0 top-0 grid size-11 place-items-center rounded-es-[40px] md:size-[65px] md:rounded-es-[60px]"
                >
                  {icon?.url ? (
                    /* Masked, not <img>: the export is a flat shape and the
                       comp paints it #333 like the rest of the card copy. */
                    <span
                      className="size-6 bg-[#333333] md:size-[30px] dark:bg-foreground"
                      style={{
                        maskImage: `url(${mediaUrl(icon)})`,
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        maskSize: 'contain',
                        WebkitMaskImage: `url(${mediaUrl(icon)})`,
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        WebkitMaskSize: 'contain',
                      }}
                    />
                  ) : (
                    <span className="size-3.5 rounded-pill bg-[#333333] dark:bg-foreground" />
                  )}
                </span>
                <dd className="text-[clamp(2rem,3.47vw,3.125rem)]/[60px] font-medium text-[#333333] dark:text-foreground">
                  <CountUp value={item.value ?? ''} dir="ltr" />
                </dd>
                <dt className="mt-3 text-sm text-[#333333] md:text-xl/[24px] dark:text-muted-foreground">
                  {item.label}
                </dt>
              </div>
            )
          })}
        </dl>
      </div>
    </section>
  )
}

export function ProcessSection({ block, locale }: { block: BlockProps; locale: Locale }) {
  const steps = (block.steps ?? []).map((s) => ({ title: s.title, body: s.body }))

  return (
    <section
      id={block.anchor ?? undefined}
      /* Same soft diagonal wash as the hero (client request) so the funnel
         sits on a tinted ground instead of bare page. */
      className="section bg-[linear-gradient(117.67deg,rgba(238,252,243,0.4)_3.72%,rgba(220,239,247,0.4)_103.6%)] dark:bg-none"
    >
      {/*
       * PF-1 — the comp's 100px gap between the heading and the funnel is what
       * reads as "too spread out" once the funnel and its description sit side
       * by side. Pulled to 56px, and the heading block gets its own tighter
       * internal rhythm so eyebrow/heading/body read as one unit.
       */}
      <div className="container-site flex flex-col items-center gap-6 lg:gap-10">
        <div className="flex max-w-3xl flex-col items-center gap-3 text-center">
          {block.eyebrow ? (
            <p className="text-sm font-semibold tracking-[2.8px] text-navy-800 uppercase dark:text-foreground">
              {block.eyebrow}
            </p>
          ) : null}
          {/* PF-2 — was clamp(2rem,4vw,3rem). At 48px it dwarfed the funnel's
              own 20-24px type; the hierarchy now steps down more gently. */}
          <h2 className="font-display text-[clamp(1.75rem,3.2vw,2.5rem)] leading-[1.1] font-bold">
            <span className="bg-[linear-gradient(142deg,#12cbb4_0%,#375bc7_100%)] bg-clip-text text-transparent">
              {block.heading}
              {block.headingAccent ? ` ${block.headingAccent}` : null}
            </span>
          </h2>
          {block.body ? (
            <p className="max-w-2xl text-base/7 text-ink-500 dark:text-muted-foreground">
              {block.body}
            </p>
          ) : null}
        </div>

        <ProcessStepper resultLabel={({ en: 'Top 3%', ar: 'أفضل 3%', de: 'Top 3%', fr: 'Top 3 %', es: 'Mejor 3%' })[locale]} steps={steps} completed={{ title: batchTwo[locale].done, body: batchTwo[locale].doneBody }} />
      </div>
    </section>
  )
}

/*
 * The supplied testimonial artwork contains finished cards rather than loose
 * headshots. Keeping those full-size screenshots in the page would duplicate
 * the quote text and make it unreadably small, so their portraits are cropped
 * into compact, local WebP avatars. Quote matching lets the existing CMS data
 * stay authoritative while enriching this known set with its supplied person.
 */
const TESTIMONIAL_PROFILES = [
  {
    quoteKey: 'fekra transformed our legacy platform',
    name: 'Omar Khalid',
    role: 'CTO',
    country: 'UAE',
    avatar: '/images/testimonials/omar-khalid.webp',
  },
  {
    quoteKey: 'fekra quickly understood our needs',
    name: 'Emily Carter',
    role: 'VP of Product',
    country: 'Canada',
    avatar: '/images/testimonials/emily-carter.webp',
  },
  {
    quoteKey: 'working with fekra has been a game changer',
    name: 'Lukas Weber',
    role: 'Head of Engineering',
    country: 'Germany',
    avatar: '/images/testimonials/lukas-weber.webp',
  },
  {
    quoteKey: 'fekra has been a trusted partner for us',
    name: 'Abdullah Al Saud',
    role: 'IT Director',
    country: 'Saudi Arabia',
    avatar: '/images/testimonials/abdullah-al-saud.webp',
  },
  {
    quoteKey: 'fekra has consistently delivered highly skilled talent',
    name: 'Jessica Brown',
    role: 'Talent Acquisition Manager',
    country: 'United Kingdom',
    avatar: '/images/testimonials/jessica-brown.webp',
  },
  {
    quoteKey: 'the fekra team brought a level of commitment',
    name: 'Michael Turner',
    role: 'Chief Technology Officer',
    country: 'United States',
    avatar: '/images/testimonials/michael-turner.webp',
  },
  {
    quoteKey: 'fekra brought a strong mix of professionalism',
    name: 'Aiko Tanaka',
    role: 'Operations Director',
    country: 'Japan',
    avatar: '/images/testimonials/aiko-tanaka.webp',
  },
  {
    quoteKey: 'fekra has been instrumental in helping us scale',
    name: 'Sofia Martinez',
    role: 'Product Manager',
    country: 'Spain',
    avatar: '/images/testimonials/sofia-martinez.webp',
  },
  {
    quoteKey: 'fekra brought strong ownership',
    name: 'Priya Nair',
    role: 'Director of Delivery',
    country: 'India',
    avatar: '/images/testimonials/priya-nair.webp',
  },
  {
    quoteKey: 'fekra consistently brought strong technical judgment',
    name: 'Daniel Okafor',
    role: 'Engineering Director',
    country: 'Nigeria',
    avatar: '/images/testimonials/daniel-okafor.webp',
  },
  {
    quoteKey: 'fekra stands out for their deep technical expertise',
    name: 'Daniel Tan',
    role: 'Engineering Manager',
    country: 'Singapore',
    avatar: '/images/testimonials/daniel-tan.webp',
  },
  {
    quoteKey: 'working with fekra has been a seamless experience. they are organized',
    name: 'James Carter',
    role: 'Head of Product',
    country: 'Canada',
    avatar: '/images/testimonials/james-carter.webp',
  },
  {
    quoteKey: 'working with fekra has been a seamless experience. they quickly understood',
    name: 'Lina Haddad',
    role: 'Operations Manager',
    country: 'UAE',
    avatar: '/images/testimonials/lina-haddad.webp',
  },
  {
    quoteKey: 'fekra understands our technical needs',
    name: 'Omar Khalil',
    role: 'CTO',
    country: 'Egypt',
    avatar: '/images/testimonials/omar-khalil.webp',
  },
  {
    quoteKey: 'fekra consistently delivers high-quality work',
    name: 'Rafael Costa',
    role: 'Chief Technology Officer',
    country: 'Brazil',
    avatar: '/images/testimonials/rafael-costa.webp',
  },
] as const

function testimonialProfile(quote?: string) {
  const normalized = quote
    ?.toLowerCase()
    .replace(/[“”"]/g, '')
    .replace(/[’]/g, "'")
    .trim()

  const englishQuote = Object.entries(testimonialCopy).find(([, translations]) => Object.values(translations).some((translation) => translation.quote === quote))?.[0].toLowerCase()
  return TESTIMONIAL_PROFILES.find((profile) => (englishQuote ?? normalized)?.includes(profile.quoteKey))
}

export function TestimonialsSection({ block, locale }: { block: BlockProps; locale: Locale }) {
  const items = block.items ?? []
  const labels = batchTwo[locale]
  const stats = [
    { value: '4.9/5', label: labels.clientRating, star: true },
    { value: '98%', label: labels.retention },
    { value: '12+', label: labels.countries },
  ]

  /* Empty still means "not ready", not "broken" — the section reappears as
     soon as the CMS contains at least one testimonial. */
  if (!items.length) return null

  return (
    <section
      id={block.anchor ?? undefined}
      className="section bg-brand-50 dark:bg-background-subtle"
    >
      <div className="container-reading flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          {block.eyebrow ? (
            <p className="text-sm font-semibold tracking-[2.8px] text-navy-800 uppercase dark:text-foreground">
              {block.eyebrow.toLowerCase() === 'trusted by' ? ({ en: 'Trusted by', ar: 'نحظى بثقة', de: 'Vertrauen von', fr: 'Ils nous font confiance', es: 'Confían en nosotros' })[locale] : block.eyebrow}
            </p>
          ) : null}
          <h2 className="font-display text-[clamp(1.75rem,2.92vw,2.625rem)] leading-[1.19] font-bold">
            <span className="bg-[linear-gradient(141.83deg,#12cbb4_0%,#375bc7_100%)] bg-clip-text text-transparent">
              {block.heading}
              {block.headingAccent ? ` ${block.headingAccent}` : null}
            </span>
          </h2>
        </div>

        {/* Three across, then a narrow card beside a wide one — the comp's
            exact five-card rhythm. */}
        <TestimonialCarousel labels={labels}>
          {items.map((item, i) => {
            const avatar = item.avatar as MediaDoc | undefined
            const profile = testimonialProfile(item.quote)
            const avatarSrc = profile?.avatar ?? (avatar?.url ? mediaUrl(avatar) : undefined)
            const authorName = profile?.name ?? item.authorName
            const localized = locale !== 'en' && profile ? Object.entries(testimonialCopy).find(([quote]) => quote.toLowerCase().includes(profile.quoteKey))?.[1][locale] : undefined
            const authorRole = localized ? `${localized.role} · ${localized.country}` : locale === 'en' && profile ? `${profile.role} · ${profile.country}` : item.authorRole
            const span = i % 5 === 4 ? 'md:col-span-4' : 'md:col-span-2'
            return (
              <li
                key={i}
                className={cn(
                  'flex min-w-0 flex-col justify-between gap-4 rounded-card border border-panel-grey bg-card p-6 dark:border-border',
                  span,
                )}
              >
                <figure className="flex flex-col gap-4">
                  <Image
                    aria-hidden
                    src="/images/decor/quote-mark.svg"
                    alt=""
                    width={31}
                    height={31}
                    className="size-8"
                  />
                  <blockquote className="text-base/6 text-ink-500 dark:text-muted-foreground">
                    {localized?.quote ?? item.quote}
                  </blockquote>
                </figure>
                <figcaption className="flex items-center gap-3">
                  {avatarSrc ? (
                    <Image
                      src={avatarSrc}
                      alt=""
                      width={40}
                      height={40}
                      aria-hidden
                      sizes="40px"
                      className="size-10 shrink-0 rounded-pill object-cover"
                    />
                  ) : null}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-navy-800 dark:text-foreground">
                      {authorName}
                    </span>
                    <span className="block truncate text-xs text-ink-500 dark:text-muted-foreground">
                      {authorRole}
                    </span>
                  </span>
                </figcaption>
              </li>
            )
          })}
        </TestimonialCarousel>

        {stats.length ? (
          <ul className="flex flex-wrap items-start justify-center gap-x-8 gap-y-6 border-t border-panel-grey pt-5 dark:border-border">
            {stats.map((stat) => (
              <li key={stat.label} className="flex flex-col items-center gap-1">
                <span className="flex items-center justify-center gap-1">
                  {stat.star ? (
                    <Star aria-hidden className="size-6 fill-primary text-primary" strokeWidth={1.5} />
                  ) : null}
                  <CountUp
                    value={stat.value ?? ''}
                    dir="ltr"
                    className="font-display text-3xl font-bold text-navy-800 dark:text-foreground"
                  />
                </span>
                <span className="text-xs text-ink-500 dark:text-muted-foreground">
                  {stat.label}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}

export function FaqSection({ block, locale }: { block: BlockProps; locale: Locale }) {
  const items = block.items ?? []
  return (
    <section id={block.anchor ?? undefined} className="section">
      <div className="container-reading flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-2 text-center">
          {block.eyebrow ? (
            <p className="text-sm font-semibold tracking-[2.8px] text-navy-800 uppercase dark:text-foreground">
              {block.eyebrow}
            </p>
          ) : null}
          <h2 className="font-display text-[clamp(1.75rem,2.92vw,2.625rem)] leading-[1.19] font-bold">
            <span className="bg-[linear-gradient(154.58deg,#12cbb4_0%,#375bc7_100%)] bg-clip-text text-transparent">
              {block.heading}
              {block.headingAccent ? ` ${block.headingAccent}` : null}
            </span>
          </h2>
        </div>

        <FaqAccordion items={items.map((item) => ({
          question: item.question,
          answer: <RichText data={item.answer} className="max-w-none text-base/7 text-ink-500 [&_p]:mb-3 [&_ul]:mb-3 [&_ol]:mb-3 [&_li]:mb-1 [&>*:last-child]:mb-0 dark:text-muted-foreground" />,
        }))} />

        {block.footnote || block.ctas?.length ? (
          <div className="flex flex-col items-center gap-4 text-center">
            {block.footnote ? (
              <p className="text-sm font-semibold tracking-[2.8px] text-ink-500 uppercase dark:text-muted-foreground">
                {block.footnote}
              </p>
            ) : null}
            <Ctas ctas={block.ctas} locale={locale} size="md" />
          </div>
        ) : null}
      </div>

      {block.emitSchema && items.length ? (
        <JsonLd
          data={faqSchema(
            items
              .filter((item) => item.question)
              .map((item) => ({ question: item.question!, answer: plainText(item.answer) })),
          )}
        />
      ) : null}
    </section>
  )
}

export function CtaSection({ block, locale }: { block: BlockProps; locale: Locale }) {
  const tone = block.tone ?? 'brand'
  const media = block.media as MediaDoc | undefined

  /* Figma 3:2214 "Meet Fika" — full-bleed teal wash, gradient heading and a
     portrait illustration above the button, rather than the boxed CTA band. */
  if (tone === 'feature') {
    return (
      <section
        id={block.anchor ?? undefined}
        className="section bg-[linear-gradient(180deg,rgba(25,190,200,0.1)_0%,rgba(255,255,255,0.1)_100%)] dark:bg-none dark:bg-background-subtle"
      >
        <div className="container-site flex flex-col items-center gap-10 text-center">
          <div className="flex flex-col items-center gap-2">
            {block.eyebrow ? (
              <p className="text-sm font-semibold tracking-[2.8px] text-ink-900 uppercase dark:text-foreground">
                {block.eyebrow}
              </p>
            ) : null}
            <h2 className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-tight font-bold">
              <span className="bg-[linear-gradient(121.18deg,#12cbb4_0%,#375bc7_100%)] bg-clip-text text-transparent">
                {block.heading}
              </span>
            </h2>
            {block.body ? (
              <p className="max-w-[818px] text-lg/7 text-ink-500 dark:text-muted-foreground">
                {block.body}
              </p>
            ) : null}
          </div>

          {media?.url ? (
            <Image
              src={mediaUrl(media)}
              alt={mediaAlt(media)}
              width={384}
              height={417}
              style={{ height: 'auto' }}
              className="h-auto w-[280px] rounded-[30px] object-contain sm:w-[384px]"
            />
          ) : null}

          {/* The comp's wide solid pill — 340px, label only, no arrow. Capped
              at 100% so it cannot overflow a narrow phone. */}
          <Ctas
            ctas={block.ctas?.map((cta) => ({ ...cta, link: { ...cta.link, type: 'route', route: '/fika' } }))}
            locale={locale}
            withArrow={false}
            className="min-w-[min(340px,100%)]"
          />
        </div>
      </section>
    )
  }

  /* Figma 1:13917 — full-bleed navy band, copy left, dot field right. */
  if (tone === 'band') {
    return (
      <section
        id={block.anchor ?? undefined}
        className="relative isolate overflow-hidden bg-navy-800"
      >
        {/* A 7-column field of 8px dots on a 36px grid, inset from the right —
            the comp's dots are large and gathered, not a fine spray across the
            whole half. */}
        <div
          aria-hidden
          className="absolute inset-y-0 end-0 -z-10 hidden w-[288px] bg-[radial-gradient(circle,rgba(146,221,236,0.9)_4px,transparent_4px)] [background-size:36px_36px] lg:block"
        />
        <div className="container-site flex flex-col items-start gap-6 py-[var(--section-y)]">
          <h2 className="max-w-[860px] font-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-tight font-bold text-white">
            {block.heading}
          </h2>
          {block.body ? (
            <p className="max-w-[700px] text-base/6 text-white/80">{block.body}</p>
          ) : null}
          {/* On navy the outlined pill flips to white per the comp. */}
          <Ctas
            ctas={block.ctas}
            locale={locale}
            size="md"
            className="fk-button--on-dark border-white text-white dark:border-white dark:text-white"
          />
        </div>
      </section>
    )
  }

  /*
   * About comp 93:3175 — the band is 1388x325 sitting on a 25px side margin,
   * which is wider than `.container-site` and lets the heading hold one line.
   * Boxed inside the 1200 container it ran 475px tall on a two-line heading.
   */
  /*
   * Meet-Fika comp — a white card floated on a tinted band, illustration at
   * the start and the copy at the end. `body` keeps one paragraph per line,
   * matching how the other blocks treat a textarea.
   */
  if (tone === 'panel') {
    return (
      <section id={block.anchor ?? undefined} className="section bg-[#f5f6f8] dark:bg-background-subtle">
        <div className="container-site">
          <div className="grid items-center gap-8 rounded-[24px] bg-white px-6 py-10 sm:px-12 md:grid-cols-[300px_1fr] md:gap-14 md:px-16 dark:bg-card">
            {media?.url ? (
              <Image
                src={mediaUrl(media)}
                alt={mediaAlt(media)}
                width={300}
                height={326}
                style={{ height: 'auto' }}
                className="mx-auto h-auto w-[clamp(180px,22vw,300px)] object-contain"
              />
            ) : null}
            <div>
              <h2 className="text-[clamp(1.5rem,2.08vw,1.875rem)]/[1.25] font-bold tracking-normal text-[#333333] dark:text-foreground">
                {block.heading}
              </h2>
              {block.body ? (
                <div className="mt-4 flex flex-col gap-4">
                  {block.body.split(/\n+/).map((para, i) => (
                    <p key={i} className="text-[14px]/[22px] text-ink-500 dark:text-muted-foreground">
                      {para}
                    </p>
                  ))}
                </div>
              ) : null}
              {block.ctas?.length ? (
                <div className="mt-7">
                  <Ctas ctas={block.ctas} locale={locale} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    )
  }

  /*
   * About comp 93:3175 — the brand band inverts the usual hierarchy: the
   * heading is a small lead-in and the BODY carries the display size, copy
   * sits at the start rather than centred, and the button rides on the end
   * edge. Decorative arcs (93:3178) sit on the top edge of the gradient.
   */
  if (tone === 'brand') {
    return (
      <section id={block.anchor ?? undefined} className="section">
        <div className="mx-auto w-full max-w-[1438px] px-[25px]">
          <div className="relative isolate flex flex-col justify-center gap-8 overflow-hidden rounded-[20px] bg-[linear-gradient(90deg,#2497b4_0%,#63b4dc_100%)] px-6 py-10 sm:px-[50px] md:min-h-[325px] md:flex-row md:items-center md:justify-between md:gap-12">
            <Image
              src="/images/decor/cta-band-shapes.svg"
              alt=""
              width={311}
              height={68}
              aria-hidden
              className="pointer-events-none absolute top-0 end-[10%] -z-10 max-w-none"
            />
            <div className="max-w-[640px]">
              {block.heading ? (
                <h2 className="text-[clamp(0.9375rem,1.25vw,1.125rem)]/[1.5] font-normal tracking-normal text-white/90">
                  {block.heading}
                </h2>
              ) : null}
              {block.body ? (
                <p className="mt-1.5 text-[clamp(1.375rem,2.08vw,1.875rem)]/[1.36] font-medium text-white">
                  {block.body}
                </p>
              ) : null}
            </div>
            {/* Solid white pill with a dark disc around the arrow. */}
            <Ctas
              ctas={block.ctas}
              locale={locale}
              size="md"
              className="fk-button--inverse shrink-0 border-0 bg-white py-2 ps-6 pe-2 text-[15px] text-navy-800 dark:text-navy-800 [&_svg]:size-8 [&_svg]:rounded-pill [&_svg]:bg-navy-800 [&_svg]:p-2 [&_svg]:text-white"
            />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id={block.anchor ?? undefined} className="section">
      <div className="container-site">
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-6 rounded-panel px-6 py-14 text-center md:px-16',
            tone === 'ink' && 'bg-ink-900 text-white',
            tone === 'subtle' && 'border border-border bg-background-subtle',
          )}
        >
          <h2 className="max-w-2xl text-[clamp(1.75rem,2.92vw,2.625rem)]/[1.19]">{block.heading}</h2>
          {block.body ? <p className="max-w-2xl text-lg opacity-90">{block.body}</p> : null}
          <Ctas ctas={block.ctas} locale={locale} />
        </div>
      </div>
    </section>
  )
}

export function TechStackSection({ block }: { block: BlockProps }) {
  /* Media is resolved here so the client component receives plain strings and
     never has to know about Payload's document shape. */
  const groups = (block.groups ?? []).map((group) => ({
    name: group.name,
    items: (group.items ?? []).map((item) => {
      const logo = item.logo as MediaDoc | undefined
      // width/height ride along so the grid can size every mark to equal area
      // (TS-3) rather than letting a wide wordmark dwarf a square icon.
      return {
        name: item.name,
        src: logo?.url ? mediaUrl(logo) : null,
        width: logo?.width ?? null,
        height: logo?.height ?? null,
      }
    }),
  }))

  return (
    <section id={block.anchor ?? undefined} className="section">
      <div className="container-board flex flex-col items-center">
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 className="font-display text-[clamp(1.75rem,2.92vw,2.625rem)] leading-[1.19] font-bold">
            <span className="bg-[linear-gradient(154.19deg,#12cbb4_0%,#375bc7_100%)] bg-clip-text text-transparent">
              {block.heading}
              {block.headingAccent ? ` ${block.headingAccent}` : null}
            </span>
          </h2>
          {block.body ? (
            <p className="text-lg/7 text-ink-500 dark:text-muted-foreground">{block.body}</p>
          ) : null}
        </div>

        <div className="w-full">
          <TechTabs groups={groups} />
        </div>
      </div>
    </section>
  )
}

/**
 * About comp 93:3148 — the "Who We Are" band: a centred h2 and a chip sitting
 * on the page background, then a 1276-wide tinted panel holding the prose and
 * a white "What We Deliver" card whose checklist runs in two columns.
 *
 * The leading heading and the bold-only paragraph are lifted OUT of the
 * Lexical tree and rendered as real elements, because the tint is a box and
 * those two live outside it — no selector can pull them out of their own
 * background. Everything after them stays rich text.
 */
function PanelRichText({ block }: { block: BlockProps }) {
  type Node = { type?: string; tag?: string; children?: { text?: string; format?: number }[] }
  const root = block.content?.root as { children?: Node[] } | undefined
  const nodes = root?.children ?? []

  let i = 0
  const headingNode =
    nodes[i]?.type === 'heading' && nodes[i]?.tag === 'h2' ? nodes[i++] : undefined
  // A paragraph whose entire content is one bold run is the chip line.
  const chipNode =
    nodes[i]?.type === 'paragraph' &&
    nodes[i]?.children?.length === 1 &&
    (nodes[i]!.children![0]!.format ?? 0) & 1
      ? nodes[i++]
      : undefined
  const plain = (node?: Node) => (node?.children ?? []).map((c) => c.text ?? '').join('')
  const rest = nodes.slice(i)

  return (
    <section id={block.anchor ?? undefined} className="section">
      {/* 1276 at 1440 — wider than the site container, per the comp. */}
      <div className="mx-auto flex w-full max-w-[1276px] flex-col items-center px-5">
        {headingNode ? (
          <h2 className="font-display text-center text-[clamp(1.75rem,2.92vw,2.625rem)]/[1.19] font-bold tracking-normal text-[#000000] dark:text-foreground">
            {plain(headingNode)}
          </h2>
        ) : null}
        {chipNode ? (
          /* Neutral grey pill in the comp, not a blue one, and the label is
             not bold. */
          <p className="mt-1 inline-flex h-[44px] items-center rounded-pill bg-[#f0f0f0] px-4 text-[clamp(0.9375rem,1.25vw,1.125rem)]/[28px] font-normal text-[#333333] dark:bg-elevated dark:text-foreground">
            {plain(chipNode)}
          </p>
        ) : null}

        {/* The marker art rides in on a custom property: RichText takes no
            style prop, and a quoted url() inside a Tailwind arbitrary value
            does not survive the CSS parser. */}
        <div
          className="w-full"
          style={{ '--fk-bullet': "url('/images/icons/list-bullet.png')" } as React.CSSProperties}
        >
          <RichText
            data={
              rest.length
                ? ({ ...block.content, root: { ...root, children: rest } } as typeof block.content)
                : block.content
            }
            className={cn(
              'mt-9 w-full max-w-none rounded-[24px] bg-[#eafafb] px-6 pt-8 pb-10 sm:px-[50px] sm:pb-[50px] dark:bg-background-subtle',
              '[&_p]:text-base/[26px] [&_p]:text-[#333333] dark:[&_p]:text-muted-foreground',
              // h3 + ul are the two halves of one white card.
              // Comp gaps the prose from the white card by 46px (body ends 344,
              // card starts 390 inside the 93:3152 overlay).
              // The card stops at 1102 of the 1276 panel — it does NOT fill the
              // padded width, so it sits inset from the panel's end edge.
              '[&_h3]:mt-[46px] [&_h3]:mb-0 [&_h3]:max-w-[1102px] [&_h3]:rounded-t-2xl [&_h3]:bg-card [&_h3]:px-6 [&_h3]:pt-[34px] [&_h3]:pb-0 [&_h3]:text-xl/[26px]',
              '[&_ul]:mb-0 [&_ul]:grid [&_ul]:max-w-[1102px] [&_ul]:list-none [&_ul]:gap-x-6 [&_ul]:gap-y-6 [&_ul]:rounded-b-2xl [&_ul]:bg-card [&_ul]:px-6 [&_ul]:pt-5 [&_ul]:pb-[34px] [&_ul]:ps-6 sm:[&_ul]:grid-cols-2',
              '[&_li]:relative [&_li]:mb-0 [&_li]:ps-[30px] [&_li]:text-base/[28px] [&_li]:text-[#333333] dark:[&_li]:text-foreground',
              // The marker art itself, supplied by FEKRA — a 10x20 blue disc
              // sitting in the comp's 20px slot (93:3158). Background-image
              // rather than <img> because the list comes out of Lexical.
              "[&_li]:before:absolute [&_li]:before:start-0 [&_li]:before:top-[4px] [&_li]:before:size-5 [&_li]:before:bg-[image:var(--fk-bullet)] [&_li]:before:bg-contain [&_li]:before:bg-center [&_li]:before:bg-no-repeat [&_li]:before:content-['']",
            )}
          />
        </div>
      </div>
    </section>
  )
}

export function RichTextSection({ block }: { block: BlockProps }) {
  if (block.width === 'panel') return <PanelRichText block={block} />
  return (
    <section id={block.anchor ?? undefined} className="section">
      <div className={cn('container-site', block.width === 'prose' && 'max-w-3xl')}>
        <RichText data={block.content} />
      </div>
    </section>
  )
}

export function MediaSection({ block }: { block: BlockProps }) {
  const media = block.media as MediaDoc | undefined
  if (!media) return null
  const full = block.width === 'full'
  return (
    <section id={block.anchor ?? undefined} className="section">
      <figure className={cn(!full && 'container-site')}>
        <div className="relative aspect-16/9 w-full overflow-hidden rounded-panel bg-background-subtle">
          <Image
            src={mediaUrl(media)}
            alt={mediaAlt(media)}
            fill
            sizes={full ? '100vw' : '(min-width: 1280px) 1280px, 100vw'}
            className="object-cover"
          />
        </div>
        {block.caption ? (
          <figcaption className="mt-3 text-center text-sm text-muted-foreground">
            {block.caption}
          </figcaption>
        ) : null}
      </figure>
    </section>
  )
}

/** Flattens lexical JSON to text for FAQ schema — schema must match what is visible. */
function plainText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const obj = node as { text?: string; children?: unknown[]; root?: unknown }
  if (obj.root) return plainText(obj.root)
  if (typeof obj.text === 'string') return obj.text
  return (obj.children ?? []).map(plainText).join(' ').replace(/\s+/g, ' ').trim()
}

/*
 * Chip labels for the talent cards. Local rather than in the dictionaries:
 * RenderBlocks hands sections only `locale`, and threading the full dict
 * through every block for two words is not worth the plumbing.
 */
const TALENT_CHIPS: Record<Locale, { match: string; evaluated: string }> = {
  en: { match: 'Match', evaluated: 'Technically Evaluated' },
  ar: { match: 'نسبة التطابق', evaluated: 'تم تقييمه تقنياً' },
  de: { match: 'Match', evaluated: 'Technisch geprüft' },
  fr: { match: 'Compatibilité', evaluated: 'Évalué techniquement' },
  es: { match: 'Afinidad', evaluated: 'Evaluado técnicamente' },
}

export function TalentShowcaseSection({ block, locale }: { block: BlockProps; locale: Locale }) {
  const people = block.people ?? []
  const copyRight = block.side === 'copyRight'

  // Each person belongs to one row. Only the hidden animation copy repeats
  // the row, so different cards never share the same profile.
  const rows = [
    people.filter((_, index) => index % 2 === 0),
    people.filter((_, index) => index % 2 === 1),
  ].filter((row) => row.length)

  const card = (
    person: NonNullable<BlockProps['people']>[number],
    key: string,
    hidden: boolean,
  ) => {
    const avatar = person.avatar as MediaDoc | undefined
    return (
      <li
        key={key}
        aria-hidden={hidden || undefined}
        /* The track is dir="ltr" so the loop's geometry is stable; the card
           restores the page direction for its own text and pill order. */
        dir={dir(locale)}
        /* Margin, not gap, on the track. A gap leaves half of one at the seam,
           so translating the duplicated track by exactly -50% would stutter
           every loop; with margin the two halves are identical. */
        className="me-6 w-[220px] shrink-0 rounded-card bg-card p-4 shadow-[0_0_7.5px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-center gap-2.5">
          {avatar?.url ? (
            <Image
              src={mediaUrl(avatar)}
              alt=""
              width={48}
              height={48}
              aria-hidden
              className="size-12 shrink-0 rounded-pill object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="grid size-12 shrink-0 place-items-center rounded-pill bg-primary/12 font-display text-base font-bold text-primary"
            >
              {person.name.charAt(0)}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate font-display text-base font-bold text-navy-800 dark:text-foreground">
              {person.name}
            </span>
            {/* The name truncates, the role wraps. 130px of text column fits
                nine of the twelve role titles; "Senior Backend Engineer" and
                friends need 143px, and a cut-off job title reads worse than a
                second line. Cards in a row stretch to the tallest, so the row
                stays level. */}
            <span className="block text-xs text-ink-500 dark:text-muted-foreground">
              <BidiText>{person.role}</BidiText>
            </span>
          </span>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5 pb-1">
          {person.experience ? (
            /* The shared numeric experience value uses a locale-specific label. */
            <span className="rounded-pill border border-border bg-background-subtle px-2.5 py-1.5 text-xs text-ink-500 dark:text-muted-foreground">
              {/[0-9]+/.test(person.experience) ? <><bdi dir="ltr">{person.experience.match(/[0-9]+/)?.[0]}+</bdi>{' '}{({ en: 'Years', ar: 'سنوات خبرة', de: 'Jahre Erfahrung', fr: 'ans d’expérience', es: 'años de experiencia' })[locale]}</> : <BidiText>{person.experience}</BidiText>}
            </span>
          ) : null}
          {typeof person.match === 'number' ? (
            <span className="rounded-pill border border-[#a7f3d0] bg-[#ecfdf5] px-2.5 py-1.5 text-xs text-success-600 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-200">
              {TALENT_CHIPS[locale].match}: {person.match}%
            </span>
          ) : null}
          {person.evaluated ? (
            <span className="rounded-pill border border-[#e0e7ff] bg-[#eef2ff] px-2.5 py-1.5 text-xs text-[#4338ca] dark:border-indigo-300/25 dark:bg-indigo-300/10 dark:text-indigo-200">
              {TALENT_CHIPS[locale].evaluated}
            </span>
          ) : null}
        </div>
      </li>
    )
  }

  const copy = (
    <div className="flex w-full flex-col gap-8 lg:w-[420px] lg:shrink-0 xl:w-[480px]">
      {block.eyebrow ? (
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          {block.eyebrow}
        </p>
      ) : null}

      {/* Arabic reads as ONE line (client request): joined by a space, and a
          step smaller so the longest title still fits the 480px copy column.
          Other locales keep the comp's two-line break. */}
      <h2
        className={cn(
          'font-display font-bold',
          locale === 'ar' ? 'text-[clamp(1.75rem,3vw,2.375rem)]' : 'text-[clamp(2rem,4vw,2.5rem)]',
          // Keep leading after the arbitrary font size so cn retains it.
          'leading-[1.05]',
        )}
      >
        {/* Teal to indigo clipped to the text — the hero's treatment. */}
        <span className="bg-[linear-gradient(114.22deg,#12cbb4_0%,#375bc7_100%)] bg-clip-text text-transparent">
          {block.heading}
          {block.headingAccent ? (
            locale === 'ar' ? (
              <> {block.headingAccent}</>
            ) : (
              <>
                <br />
                {block.headingAccent}
              </>
            )
          ) : null}
        </span>
      </h2>

      {block.body ? (
        <p className="text-lg/[1.6] text-ink-500 dark:text-muted-foreground">{block.body}</p>
      ) : null}

      {block.bullets?.length ? (
        <ul className="flex flex-col gap-3 text-base/6 text-ink-500 dark:text-muted-foreground">
          {block.bullets.map((bullet) => (
            <li key={bullet.text} className="flex items-start gap-3"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Check aria-hidden className="size-3.5" strokeWidth={2.5} /></span><span>{bullet.text}</span></li>
          ))}
        </ul>
      ) : null}

      {block.roles?.length ? (
        <ul className="flex flex-wrap gap-x-3 gap-y-2">
          {block.roles.map((role) => (
            <li
              key={role.label}
              className="rounded-pill border border-brand-500 bg-role-pill px-3 py-2.5 text-base leading-none text-role-pill-ink"
            >
              <BidiText>{role.label}</BidiText>
            </li>
          ))}
        </ul>
      ) : null}

      <Ctas ctas={block.ctas} locale={locale} size="md" />
    </div>
  )

  const panel = rows.length ? (
    <div
      className={cn(
        // 652px is the comp's panel width and it does not shrink, so the
        // side-by-side row only fits from `xl`. At `lg` (iPad landscape) the
        // copy column plus this panel came to ~1230px in a 1024px window and
        // both marquee stages bled off the edges (16.3).
        'fk-marquee-stage w-full max-w-[652px] overflow-hidden rounded-[40px] p-6 sm:p-10 xl:w-[652px] xl:shrink-0',
        block.panelTone === 'mint' ? 'bg-panel-mint' : 'bg-panel-grey',
        'dark:bg-background-subtle',
      )}
    >
      {block.panelTitle ? (
        <p className="mb-6 text-center text-sm font-semibold tracking-[2.8px] text-navy-800 uppercase dark:text-foreground">
          {block.panelTitle}
        </p>
      ) : null}

      {/*
       * dir="ltr" on the wrapper as well as the tracks: a track is wider than
       * the panel, and a block box that overflows an RTL containing block is
       * right-anchored — its excess hangs off the LEFT. The keyframes then
       * slide it further left, so past mid-loop the stage showed nothing.
       * An LTR containing block left-anchors the track, as the loop assumes.
       */}
      <div dir="ltr" className="flex flex-col gap-6">
        {rows.map((row, rowIndex) => (
          /*
           * dir="ltr" pins the marquee's GEOMETRY: under RTL the flex row laid
           * out right-to-left while the keyframes still slid physically left,
           * so the first cards sat clipped off the start edge with a dead gap
           * at the other end. A looping strip has no reading order to honour —
           * only its cards do, and each carries the page direction itself.
           */
          <ul
            key={rowIndex}
            dir="ltr"
            style={{ '--marquee-duration': `${46 + rowIndex * 10}s` } as React.CSSProperties}
            className={cn('fk-marquee', rowIndex % 2 === 1 && 'fk-marquee-reverse')}
          >
            {/* Duplicated so -50% lands the copy where the original began. The
                second half is hidden from assistive tech — same people twice. */}
            {row.map((person, i) => card(person, `a-${rowIndex}-${i}`, false))}
            {row.map((person, i) => card(person, `b-${rowIndex}-${i}`, true))}
          </ul>
        ))}
      </div>
    </div>
  ) : null

  return (
    <section id={block.anchor ?? undefined} className="section">
      <div
        className={cn(
          // Two columns from lg, not xl. The copy column is a fixed 480px, so
          // between 1024 and 1280 the old rule left it stranded in the middle
          // of a wide viewport with the panel stacked underneath — the tablet
          // "not using the full width" complaint. 480 + gap + panel fits 1024.
          'container-site flex flex-col items-center gap-10 lg:flex-row lg:justify-center lg:gap-8 xl:gap-10',
          copyRight && 'lg:flex-row-reverse',
        )}
      >
        {copy}
        {panel}
      </div>
    </section>
  )
}
