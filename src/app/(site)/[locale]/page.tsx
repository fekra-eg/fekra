import { notFound } from 'next/navigation'

import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { getDictionary } from '@/i18n/getDictionary'
import { isLocale } from '@/i18n/routing'
import { findDoc, getGlobal } from '@/lib/payload'
import { buildMetadata } from '@/lib/seo'
import { homeDescription, homeTitle } from '@/i18n/qa-copy'

import type { PageDoc, SettingsLite } from './page-types'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const page = await findDoc<PageDoc>('pages', 'home', locale)
  if (!page) return {}
  return buildMetadata({
    title: homeTitle[locale],
    brand: false,
    description: page.meta?.description?.trim() || homeDescription[locale],
    path: '/',
    locale,
    availableLocales: page.availableLocales,
    image: page.meta?.image?.url ? { url: page.meta.image.url } : null,
    noindex: page.meta?.noindex,
    canonicalOverride: page.meta?.canonicalOverride,
  })
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const [page, dict, settings] = await Promise.all([
    findDoc<PageDoc>('pages', 'home', locale),
    getDictionary(locale),
    getGlobal<SettingsLite>('site-settings', locale),
  ])

  // 18.12 — a missing home document is a real 404, not an empty 200.
  if (!page) notFound()

  return (
    <RenderBlocks
      blocks={page.layout}
      locale={locale}
      dict={dict}
      context={{ offices: settings.offices, calendlyUrl: settings.calendlyUrl }}
    />
  )
}
