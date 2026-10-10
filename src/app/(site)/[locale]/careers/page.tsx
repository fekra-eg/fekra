import Image from 'next/image'
import { sitelinkCopy } from '@/i18n/qa-copy'
import { notFound } from 'next/navigation'
import { Users } from 'lucide-react'

import { getDictionary } from '@/i18n/getDictionary'
import { isLocale, type Locale } from '@/i18n/routing'
import { findDocs, getGlobal } from '@/lib/payload'
import { ContactSection } from '@/components/blocks/ContactSection'
import type { SettingsLite } from '../page-types'
import { buildMetadata } from '@/lib/seo'

import type { JobDoc } from '../page-types'
import careersCopy from '@/i18n/careers.json'
import { LegacyCareers } from './LegacyCareers'
import styles from './careers.module.css'

export const revalidate = 900

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  return buildMetadata({
    ...sitelinkCopy[locale].careers,
    path: '/careers',
    locale,
  })
}

// Content photos, so they get described (FK-63).
const TEAM_PHOTO_ALT: Record<Locale, [string, string]> = {
  en: ['FEKRA engineers in a planning session', 'Two FEKRA engineers pair programming'],
  ar: ['مهندسو فكرة في جلسة تخطيط', 'مهندسان من فكرة يعملان معًا على الكود'],
  de: ['FEKRA-Engineers in einer Planungssitzung', 'Zwei FEKRA-Engineers beim Pair Programming'],
  fr: ['Ingénieurs FEKRA en séance de planification', 'Deux ingénieurs FEKRA en pair programming'],
  es: ['Ingenieros de FEKRA en una sesión de planificación', 'Dos ingenieros de FEKRA programando en pareja'],
}

export default async function CareersIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const [dict, { docs }, settings] = await Promise.all([
    getDictionary(locale),
    findDocs<JobDoc>({
      collection: 'jobs',
      locale,
      limit: 100,
      sort: '-publishedAt',
      where: { roleStatus: { equals: 'open' } },
    }),
    getGlobal<SettingsLite>('site-settings', locale),
  ])

  const copy = careersCopy[locale]
  const hasInternship = docs.some((job) => job.slug === 'internship-program')
  const hasFuture = docs.some((job) => job.slug === 'future-opportunities')

  return (
    <>
      {/* A team-led hero with a direct jump to the current openings. */}
      <section className="relative isolate mt-[calc(var(--header-block)*-1)] overflow-hidden pt-[calc(var(--header-block)+clamp(2.5rem,7vw,5.5rem))] pb-14 md:pb-20">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(117.67deg,rgba(238,252,243,0.45)_3.72%,rgba(220,239,247,0.45)_103.6%)] dark:bg-none"
        />
        <div className="container-site grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="max-w-[680px]">
            <h1 className="font-display text-[clamp(2rem,4.8vw,3.5rem)] leading-[1.08] font-bold tracking-[-0.5px] text-balance text-navy-800 md:tracking-[-1px] dark:text-foreground">
              {dict.careers.heroTitle}
            </h1>
            <p className="mt-5 text-[15px]/7 text-ink-500 md:text-lg/8 dark:text-muted-foreground">
              {dict.careers.heroBody}
            </p>
            <nav className={`${styles.shortcuts} mt-7`} aria-label={dict.careers.title}>
              <a className="fk-button fk-button--career" href="#open-roles">{dict.careers.openRoles}</a>
              {hasInternship ? <a className="fk-button fk-button--career" href="#internship-program">{copy.internship.replace(/\.+$/, '')}</a> : null}
              {hasFuture ? <a className="fk-button fk-button--career" href="#future-opportunities">{copy.future.replace(/\.+$/, '')}</a> : null}
            </nav>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <Image src="/images/team/team-planning-session.webp" alt={TEAM_PHOTO_ALT[locale][0]} width={360} height={440} priority className="aspect-[4/5] w-full rounded-tl-[64px] rounded-br-[32px] object-cover" />
            <div className="flex flex-col gap-4 pt-10">
              <Image src="/images/team/team-pairing-session.webp" alt={TEAM_PHOTO_ALT[locale][1]} width={320} height={240} priority className="aspect-[4/3] w-full rounded-tr-[40px] rounded-bl-[32px] object-cover" />
              <div className="rounded-tr-[32px] rounded-bl-[32px] bg-brand-100 p-5 text-navy-800 dark:bg-card dark:text-foreground"><Users className="mb-3 size-6 text-primary" aria-hidden /><p className="font-display text-lg font-semibold">{dict.careers.whyTitle}</p></div>
            </div>
          </div>
        </div>
      </section>

      <LegacyCareers jobs={docs} dict={dict} locale={locale} />
      <ContactSection block={{ blockType: 'contact', heading: dict.contact.offices, showForm: false }} locale={locale} dict={dict} offices={settings?.offices as never} />
    </>
  )
}
