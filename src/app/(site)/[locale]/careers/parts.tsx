import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import type { Dictionary } from '@/i18n/getDictionary'
import { type Locale, localeHref } from '@/i18n/routing'
import { cn } from '@/lib/cn'

import type { JobDoc } from '../page-types'

/** Quiet eyebrow + heading pair. No rules, no chrome — spacing does the work. */
export function SectionLabel({ eyebrow, heading }: { eyebrow: string; heading: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">{eyebrow}</p>
      <h2 className="mt-3 font-display text-[clamp(1.5rem,3vw,2.125rem)] leading-tight font-bold text-navy-800 dark:text-foreground">
        {heading}
      </h2>
    </div>
  )
}

/**
 * Role meta as one plain line. Separated by dots rather than pills — three
 * coloured chips per row is what made the list read as busy.
 */
export function JobMeta({ job, dict, className }: { job: JobDoc; dict: Dictionary; className?: string }) {
  const bits = [
    { label: dict.careers.location, value: job.location },
    { label: dict.careers.workModel, value: dict.careers.workModels[job.workModel as keyof typeof dict.careers.workModels] ?? job.workModel },
    { label: dict.careers.employmentType, value: dict.careers.employmentTypes[job.employmentType as keyof typeof dict.careers.employmentTypes] ?? job.employmentType },
  ].filter((bit) => bit.value)

  return (
    <ul className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500 dark:text-muted-foreground', className)}>
      {bits.map((bit, i) => (
        <li key={bit.label} className="flex items-center gap-3">
          {i > 0 ? <span aria-hidden className="size-1 rounded-pill bg-border" /> : null}
          <span>
            <span className="sr-only">{bit.label}: </span>
            <span className="capitalize">{bit.value}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * One open role, as a row in a plain list. The whole row is the link — one tab
 * stop and a large touch target, without card borders or a hover lift.
 */
export function RoleRow({ job, locale, dict }: { job: JobDoc; locale: Locale; dict: Dictionary }) {
  return (
    <li>
      <Link
        href={localeHref(locale, `/careers/${job.slug}`)}
        className="group flex flex-col gap-3 py-7 transition-colors md:flex-row md:items-center md:gap-8"
      >
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg leading-snug font-bold text-navy-800 transition-colors group-hover:text-primary md:text-xl dark:text-foreground">
            {job.title}
          </h3>
          {job.summary ? (
            <p className="mt-1.5 max-w-[60ch] text-sm/6 text-ink-500 dark:text-muted-foreground">{job.summary}</p>
          ) : null}
        </div>

        {/* One list: the row stacks it under the text on phones (FK-59). */}
        <JobMeta job={job} dict={dict} className="shrink-0" />

        <ArrowRight
          className="icon-flip hidden size-5 shrink-0 text-border transition-colors group-hover:text-primary md:block"
          aria-hidden
        />
      </Link>
    </li>
  )
}

/** The four hiring steps. Plain numbered text — a real <ol> for AT and crawlers (19.1). */
export function HiringProcess({ dict, compact = false }: { dict: Dictionary; compact?: boolean }) {
  const steps = [
    { title: dict.careers.step1Title, body: dict.careers.step1Body },
    { title: dict.careers.step2Title, body: dict.careers.step2Body },
    { title: dict.careers.step3Title, body: dict.careers.step3Body },
    { title: dict.careers.step4Title, body: dict.careers.step4Body },
  ]

  const list = (
    <ol className={cn('grid gap-x-10', compact ? 'gap-y-5' : 'gap-y-8 sm:grid-cols-2')}>
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-4">
          <span
            aria-hidden
            className={cn(
              'shrink-0 font-display font-bold text-primary/40',
              compact ? 'text-base leading-6' : 'text-lg leading-7',
            )}
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <div>
            <p
              className={cn(
                'font-semibold text-navy-800 dark:text-foreground',
                compact ? 'text-sm' : 'text-base',
              )}
            >
              {step.title}
            </p>
            <p
              className={cn(
                'mt-1 text-ink-500 dark:text-muted-foreground',
                compact ? 'text-xs/5' : 'text-sm/6',
              )}
            >
              {step.body}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )

  if (compact) return list

  return (
    <section className="section pt-0">
      <div className="container-site max-w-[900px]">
        <SectionLabel eyebrow={dict.careers.processEyebrow} heading={dict.careers.processTitle} />
        <div className="mt-10">{list}</div>
      </div>
    </section>
  )
}

/** Closing note for people no current role suits. Text and a link, nothing more. */
export function CareersCta({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <section className="section pt-0">
      <div className="container-site">
        <div className="mx-auto max-w-[560px] border-t border-border pt-12 text-center">
          <h2 className="font-display text-xl font-bold text-navy-800 dark:text-foreground">
            {dict.careers.noFitTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-[46ch] text-sm/6 text-ink-500 dark:text-muted-foreground">
            {dict.careers.noFitBody}
          </p>
          <Link
            href={localeHref(locale, '/contact')}
            className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            {dict.careers.noFitCta}
            <ArrowRight className="icon-flip size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
