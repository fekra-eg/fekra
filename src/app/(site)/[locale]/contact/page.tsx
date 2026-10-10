import { notFound } from 'next/navigation'

import { sitelinkCopy } from '@/i18n/qa-copy'
import { ContactSection } from '@/components/blocks/ContactSection'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { getDictionary } from '@/i18n/getDictionary'
import { isLocale, LOCALES } from '@/i18n/routing'
import { findDoc, getGlobal } from '@/lib/payload'
import { buildMetadata } from '@/lib/seo'

import type { PageDoc, SettingsLite } from '../page-types'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  return buildMetadata({
    ...sitelinkCopy[locale].contact,
    path: '/contact',
    locale,
    // The route is localized by the dictionary and by localized CMS fields, so
    // it exists in every language whatever the CMS page happens to declare —
    // taking availableLocales from the document here made hreflang list only
    // `en` while the sitemap listed all five (1.11 / 18.5).
    availableLocales: [...LOCALES],
  })
}

/**
 * The contact route always renders a working form even before an editor creates
 * the CMS page — a primary conversion path must never depend on content entry.
 */
export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const [dict, page, settings] = await Promise.all([
    getDictionary(locale),
    findDoc<PageDoc>('pages', 'contact', locale),
    getGlobal<SettingsLite>('site-settings', locale),
  ])

  if (page?.layout?.length) {
    return (
      <RenderBlocks
        blocks={page.layout}
        locale={locale}
        dict={dict}
        context={{ offices: settings.offices, calendlyUrl: settings.calendlyUrl }}
      />
    )
  }

  return (
    <ContactSection
      block={{ blockType: 'contact', showForm: true, showOffices: true }}
      locale={locale}
      dict={dict}
      offices={settings.offices as never}
      as="h1"
    />
  )
}
