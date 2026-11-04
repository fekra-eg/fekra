import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getDictionary } from '@/i18n/getDictionary'
import { sitelinkCopy } from '@/i18n/qa-copy'
import { isLocale, localeHref, PUBLIC_LOCALES, servesLocale } from '@/i18n/routing'
import { findDocs } from '@/lib/payload'
import { buildMetadata, notFoundMetadata } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import { breadcrumbSchema } from '@/lib/jsonld'
import type { ServiceDoc } from '../page-types'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) return notFoundMetadata
  return buildMetadata({ ...sitelinkCopy[locale].services, locale, path: '/services', availableLocales: [...PUBLIC_LOCALES], template: 'services' })
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const [dict, { docs }] = await Promise.all([
    getDictionary(locale),
    findDocs<ServiceDoc>({ collection: 'services', locale, limit: 300, depth: 0, sort: 'order', select: { title: true, slug: true, summary: true, availableLocales: true, parent: true } }),
  ])
  const services = docs.filter((doc) => servesLocale(doc.availableLocales, locale))
  const groups = services.filter((doc) => !doc.parent)
  const cards = groups.length ? groups : services
  return <div className="container-site py-12 sm:py-16">
    <nav aria-label={dict.common.breadcrumb}><Link className="inline-flex min-h-11 items-center text-primary underline" href={localeHref(locale, '/')}>{dict.nav.home}</Link></nav>
    <h1 className="mt-5 text-4xl font-bold">{sitelinkCopy[locale].services.title}</h1>
    <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{sitelinkCopy[locale].services.description}</p>
    <ul className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((service) => <li key={service.slug} className="min-w-0 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-bold"><Link href={localeHref(locale, `/services/${service.slug}`)} className="inline-flex min-h-11 items-center text-primary hover:underline">{service.title}</Link></h2>
        {service.summary ? <p className="mt-3 text-muted-foreground">{service.summary}</p> : null}
        <ul className="mt-4 space-y-1">{services.filter((role) => (typeof role.parent === 'object' ? role.parent?.id : role.parent) === service.id).map((role) => <li key={role.slug}><Link className="inline-flex min-h-11 items-center hover:underline" href={localeHref(locale, `/services/${role.slug}`)}>{role.title}</Link></li>)}</ul>
      </li>)}
    </ul>
    <JsonLd data={breadcrumbSchema([{ name: dict.nav.home, path: '/' }, { name: dict.nav.services, path: '/services' }], locale)} />
  </div>
}
