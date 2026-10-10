import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'

import { mediaUrl } from '@/components/blocks/types'
import { LocaleStatusProvider } from '@/components/LocaleStatusProvider'
import { Analytics } from '@/components/analytics/Analytics'
import { ConsentBanner } from '@/components/analytics/ConsentBanner'
import { buildServicesMenu } from '@/lib/services-menu'
import { JsonLd } from '@/components/JsonLd'
import { Footer, type FooterData } from '@/components/layout/Footer'
import { Header, type HeaderData } from '@/components/layout/Header'
import { SmoothScroll } from '@/components/layout/SmoothScroll'
import { ScrollReveal } from '@/components/ScrollReveal'
import { TalkToFika } from '@/components/layout/TalkToFika'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { getDictionary } from '@/i18n/getDictionary'
import { PUBLIC_LOCALES, dir, isLocale } from '@/i18n/routing'
import { organizationSchema, websiteSchema } from '@/lib/jsonld'
import { findDocs, getGlobal } from '@/lib/payload'
import { isComingSoon } from '@/lib/site-mode'
import { inter, plexArabic, tajawal, urbanist } from '@/fonts'
import { siteUrl } from '@/lib/urls'

import '../globals.css'

export const viewport: Viewport = {
  themeColor: '#ffffff',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'Fekra Tech', template: '%s | Fekra Tech' },
}

export function generateStaticParams() {
  // Behind the holding page every one of these routes is rewritten before it
  // renders, so prerendering them only means the build needs a database it
  // will never read. Returning [] lets the holding page deploy on its own.
  if (isComingSoon()) return []
  return PUBLIC_LOCALES.map((locale) => ({ locale }))
}

type SiteSettings = {
  siteName?: string
  legalName?: string
  tagline?: string
  logoLight?: { url?: string } | null
  logoDark?: { url?: string } | null
  socialProfiles?: { platform: string; url: string }[]
  offices?: {
    city?: string
    country?: string
    addressLine?: string
    phone?: string
    email?: string
    countryCode?: string
    isHeadquarters?: boolean
  }[]
  calendlyUrl?: string
  ga4MeasurementId?: string
  gtmContainerId?: string
  linkedinPartnerId?: string
  consentMode?: 'opt-in' | 'essential'
  searchConsoleVerification?: string
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const [dict, header, footer, settings, servicesDocs] = await Promise.all([
    getDictionary(locale),
    getGlobal<HeaderData>('header', locale),
    getGlobal<FooterData>('footer', locale),
    getGlobal<SiteSettings>('site-settings', locale),
    findDocs<{
      id: string | number
      title: string
      slug: string
      parent?: string | number | { id: string | number } | null
      menuRoles?: { label: string }[] | null
    }>({
      collection: 'services',
      locale,
      limit: 100,
      depth: 0,
      sort: 'order',
      // Runs on every page — keep it to the fields the menu and its child
      // destinations need. Role links point at their SEO pages, not the parent.
      select: { title: true, slug: true, parent: true, menuRoles: true, order: true },
    }),
  ])

  const servicesMenu = buildServicesMenu(servicesDocs.docs, locale)
  const siteName = settings.siteName ?? 'FEKRA'
  const logoUrl = settings.logoLight?.url ? mediaUrl(settings.logoLight) : null

  return (
    // 14.5 — lang and dir are emitted per locale, not patched in on the client.
    <html
      lang={locale}
      dir={dir(locale)}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${urbanist.variable} ${inter.variable} ${tajawal.variable} ${plexArabic.variable}`}
    >
      <head>
        {settings.searchConsoleVerification ? (
          <meta name="google-site-verification" content={settings.searchConsoleVerification} />
        ) : null}
        {/*
          Google Consent Mode v2 defaults, inline in <head> so they are set before
          any tag can load (21.8). Deliberately a raw script and not next/script:
          ordering here is the whole point.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;' +
              "gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});",
          }}
        />
      </head>
      <body className="min-h-dvh antialiased">
        <SmoothScroll />
        <ScrollReveal />
        <ThemeProvider>
          <Header
            data={header}
            locale={locale}
            dict={dict}
            siteName={siteName}
            servicesMenu={servicesMenu}
          />

          <main id="main"><LocaleStatusProvider messages={{ loading: dict.common.loading, error: dict.error }}>{children}</LocaleStatusProvider></main>

          <Footer
            data={footer}
            locale={locale}
            dict={dict}
            siteName={siteName}
            offices={settings.offices}
            socials={settings.socialProfiles}
          />

          <TalkToFika locale={locale} dict={dict} consentRequired={(settings.consentMode ?? 'opt-in') === 'opt-in'} />
          <ConsentBanner dict={dict} locale={locale} enabled={(settings.consentMode ?? 'opt-in') === 'opt-in'} />
          <Analytics
            gtmId={settings.gtmContainerId}
            ga4Id={settings.ga4MeasurementId || 'G-C39M5MW6D8'}
            linkedinPartnerId={settings.linkedinPartnerId}
            mode={settings.consentMode ?? 'opt-in'}
          />
        </ThemeProvider>

        <JsonLd
          data={[
            organizationSchema({
              siteName,
              legalName: settings.legalName,
              tagline: settings.tagline,
              logoUrl,
              socialProfiles: settings.socialProfiles,
              offices: settings.offices,
            }),
            websiteSchema(locale),
          ]}
        />
      </body>
    </html>
  )
}
