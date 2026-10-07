import Link from 'next/link'
import { notFound } from 'next/navigation'

import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd } from '@/components/JsonLd'
import { getDictionary } from '@/i18n/getDictionary'
import { isLocale, localeHref } from '@/i18n/routing'
import { breadcrumbSchema, serviceSchema } from '@/lib/jsonld'
import { findDoc, getGlobal, staticSlugs } from '@/lib/payload'
import { buildMetadata, notFoundMetadata } from '@/lib/seo'

import type { ServiceDoc, SettingsLite } from '../../page-types'

export const revalidate = 3600

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return []
  return staticSlugs('services', params.locale, 300)
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  if (!isLocale(locale)) return notFoundMetadata
  const service = await findDoc<ServiceDoc>('services', slug, locale)
  if (!service) return notFoundMetadata

  return buildMetadata({
    title: service.meta?.title ?? service.title,
    description: service.meta?.description ?? service.summary ?? undefined,
    path: `/services/${slug}`,
    locale,
    availableLocales: service.availableLocales,
    image: service.meta?.image?.url ? { url: service.meta.image.url } : null,
    noindex: service.meta?.noindex,
    canonicalOverride: service.meta?.canonicalOverride,
  })
}

export default async function ServicePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()

  const [service, dict, settings] = await Promise.all([
    findDoc<ServiceDoc>('services', slug, locale),
    getDictionary(locale),
    getGlobal<SettingsLite>('site-settings', locale),
  ])
  if (!service) notFound()

  const parent = typeof service.parent === 'object' ? service.parent : null
  const crumbs = [
    { name: dict.nav.home, path: '/' },
    { name: dict.nav.services, path: '/services' },
    ...(parent ? [{ name: parent.title, path: `/services/${parent.slug}` }] : []),
    { name: service.title, path: `/services/${slug}` },
  ]

  // A serviceHero block carries the H1 itself; the plain header would double it.
  const hasHero = service.layout?.[0]?.blockType === 'serviceHero'

  return (
    <>
      {!hasHero ? (
        <div className="container-site pt-10">
          <nav aria-label={dict.common.breadcrumb} className="text-sm text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-2">
              {crumbs.slice(0, -1).map((crumb) => (
                <li key={crumb.path} className="flex items-center gap-2">
                  <Link href={localeHref(locale, crumb.path)}>{crumb.name}</Link>
                  <span aria-hidden>/</span>
                </li>
              ))}
              <li aria-current="page">{service.title}</li>
            </ol>
          </nav>

          <h1 className="mt-6 text-4xl md:text-5xl">{service.title}</h1>
          {service.summary ? (
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{service.summary}</p>
          ) : null}
        </div>
      ) : null}

      <RenderBlocks
        blocks={service.layout}
        locale={locale}
        dict={dict}
        context={{ offices: settings.offices, calendlyUrl: settings.calendlyUrl, servicePage: true }}
      />

      {service.relatedServices?.length ? (
        <section className="container-site pb-[var(--section-y)]">
          <h2 className="text-2xl">{dict.common.learnMore}</h2>
          <ul className="mt-6 flex flex-wrap gap-3">
            {service.relatedServices
              .filter((item) => typeof item === 'object')
              .map((item) => (
                <li key={item.id}>
                  <Link
                    href={localeHref(locale, `/services/${item.slug}`)}
                    className="fk-button fk-button--secondary rounded-pill border border-border px-4 py-2 text-sm"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      <JsonLd
        data={[
          serviceSchema({ title: service.title, summary: service.summary, path: `/services/${slug}`, locale }),
          breadcrumbSchema(crumbs, locale),
        ]}
      />
    </>
  )
}
