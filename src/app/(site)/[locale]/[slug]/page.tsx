import { notFound } from 'next/navigation'

import { sitelinkCopy } from '@/i18n/qa-copy'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd } from '@/components/JsonLd'
import { getDictionary } from '@/i18n/getDictionary'
import { isLocale } from '@/i18n/routing'
import { breadcrumbSchema } from '@/lib/jsonld'
import { findDoc, getGlobal, staticSlugs } from '@/lib/payload'
import { buildMetadata, notFoundMetadata } from '@/lib/seo'

import type { PageDoc, SettingsLite } from '../page-types'

export const revalidate = 3600

/** The parent layout supplies each locale; build its pages before visitors switch. */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return []
  const slugs = await staticSlugs('pages', params.locale, 200)
  return slugs.filter(({ slug }) => slug !== 'home')
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  if (!isLocale(locale)) return notFoundMetadata
  const page = await findDoc<PageDoc>('pages', slug, locale)
  if (!page) return notFoundMetadata

  return buildMetadata({
    title: page.meta?.title ?? page.title,
    description: page.meta?.description,
    path: `/${slug}`,
    locale,
    availableLocales: page.availableLocales,
    ...(slug === 'about' ? sitelinkCopy[locale].about : {}),
    image: page.meta?.image?.url ? { url: page.meta.image.url } : null,
    noindex: page.meta?.noindex,
    canonicalOverride: page.meta?.canonicalOverride,
  })
}

export default async function CmsPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()

  const [page, dict, settings] = await Promise.all([
    findDoc<PageDoc>('pages', slug, locale),
    getDictionary(locale),
    getGlobal<SettingsLite>('site-settings', locale),
  ])

  if (!page) notFound()

  return (
    <>
      <RenderBlocks
        blocks={page.layout}
        locale={locale}
        dict={dict}
        context={{ offices: settings.offices, calendlyUrl: settings.calendlyUrl }}
      />
      <JsonLd
        data={breadcrumbSchema(
          [
            { name: dict.nav.home, path: '/' },
            { name: page.title, path: `/${slug}` },
          ],
          locale,
        )}
      />
    </>
  )
}
