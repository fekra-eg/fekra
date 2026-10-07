import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowUpRight, Check } from 'lucide-react'

import { BidiText } from '@/components/BidiText'
import { getDictionary } from '@/i18n/getDictionary'
import { isLocale, localeHref } from '@/i18n/routing'
import { findDocs } from '@/lib/payload'
import { buildMetadata } from '@/lib/seo'

import type { ServiceDoc } from '../page-types'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = await getDictionary(locale)
  return buildMetadata({ title: dict.nav.services, description: dict.services.subtitle, path: '/services', locale })
}

/**
 * Services hub (FK-23): the nav's "Services" used to redirect to one service,
 * leaving no page that links every service. Top-level services as cards, their
 * technology pages listed under each.
 */
export default async function ServicesIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const [dict, { docs }] = await Promise.all([
    getDictionary(locale),
    findDocs<ServiceDoc>({
      collection: 'services',
      locale,
      limit: 100,
      sort: 'order',
      depth: 0,
      // Without a select this query joins every block table for every service.
      select: { title: true, slug: true, summary: true, parent: true, order: true },
    }),
  ])

  const parentId = (s: ServiceDoc) => (typeof s.parent === 'object' ? s.parent?.id : s.parent)
  const roots = docs.filter((s) => !s.parent)

  return (
    <section className="relative isolate mt-[calc(var(--header-block)*-1)] pt-[calc(var(--header-block)+clamp(3rem,7vw,6rem))] pb-16 md:pb-24">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[linear-gradient(117.67deg,rgba(238,252,243,0.78)_3.72%,rgba(220,239,247,0.78)_103.6%)] dark:bg-none"
      />
      <div className="container-site">
        <h1 className="font-display text-[clamp(2.25rem,5.4vw,4.25rem)] leading-[1.05] font-bold text-navy-800 dark:text-foreground">
          {dict.nav.services}
        </h1>
        <p className="mt-5 max-w-[66ch] text-base/7 text-ink-500 md:text-lg/8 dark:text-muted-foreground">
          {dict.services.subtitle}
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {roots.map((service) => {
            const children = docs.filter((s) => parentId(s) === service.id)
            return (
              <article
                key={service.id}
                className="group relative flex h-full flex-col rounded-panel border border-panel-grey bg-card p-6 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lift md:p-7 dark:border-border"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <h2 className="font-display text-xl leading-7 font-bold text-navy-800 dark:text-foreground">
                      <Link
                        href={localeHref(locale, `/services/${service.slug}`)}
                        className="after:absolute after:inset-0 focus-visible:outline-none"
                      >
                        <BidiText>{service.title}</BidiText>
                      </Link>
                    </h2>
                    {service.summary ? (
                      <p className="mt-3 text-sm/6 text-ink-500 dark:text-muted-foreground">{service.summary}</p>
                    ) : null}
                  </div>
                  <span
                    aria-hidden
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-50 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground dark:bg-background-subtle"
                  >
                    <ArrowUpRight className="size-4 rtl:-scale-x-100" strokeWidth={2.25} />
                  </span>
                </div>

                {children.length ? (
                  <ul className="relative z-10 mt-6 grid gap-1 border-t border-border pt-4 sm:grid-cols-2">
                    {children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={localeHref(locale, `/services/${child.slug}`)}
                          className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm text-ink-500 transition-colors hover:bg-brand-50 hover:text-primary dark:text-muted-foreground dark:hover:bg-background-subtle"
                        >
                          <Check className="size-3.5 shrink-0 text-primary" aria-hidden />
                          <BidiText>{child.title}</BidiText>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
