import type { Locale } from '@/i18n/routing'
import { absoluteUrl, siteUrl } from './urls'

/**
 * Structured data (18.8 / 19.4). Every builder takes only data that is also
 * visible on the page — schema that contradicts the rendered content is a
 * validation failure, not a ranking trick.
 */

type Office = {
  city?: string | null
  country?: string | null
  addressLine?: string | null
  phone?: string | null
  email?: string | null
  countryCode?: string | null
  isHeadquarters?: boolean | null
}

export function organizationSchema(settings: {
  siteName?: string | null
  legalName?: string | null
  tagline?: string | null
  logoUrl?: string | null
  socialProfiles?: { url: string }[] | null
  offices?: Office[] | null
}) {
  const hq = settings.offices?.find((o) => o.isHeadquarters) ?? settings.offices?.[0]
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl()}/#organization`,
    name: settings.siteName ?? 'FEKRA',
    legalName: settings.legalName ?? undefined,
    description: settings.tagline ?? undefined,
    url: siteUrl(),
    logo: settings.logoUrl ?? undefined,
    sameAs: settings.socialProfiles?.map((s) => s.url).filter(Boolean),
    address: hq
      ? {
          '@type': 'PostalAddress',
          streetAddress: hq.addressLine ?? undefined,
          addressLocality: hq.city ?? undefined,
          addressCountry: hq.countryCode ?? undefined,
        }
      : undefined,
    contactPoint: settings.offices
      ?.filter((o) => o.phone || o.email)
      .map((o) => ({
        '@type': 'ContactPoint',
        contactType: 'sales',
        telephone: o.phone ?? undefined,
        email: o.email ?? undefined,
        areaServed: o.countryCode ?? undefined,
      })),
  }
}

export function websiteSchema(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl()}/#website`,
    url: siteUrl(),
    // Google's site name (the label above the result) comes from here (19.4).
    name: 'FekraTech',
    alternateName: ['Fekra Tech', 'FEKRA', 'فكرة'],
    inLanguage: locale,
    publisher: { '@id': `${siteUrl()}/#organization` },
  }
}

export function breadcrumbSchema(items: { name: string; path: string }[], locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, locale),
    })),
  }
}

export function articleSchema(post: {
  title: string
  excerpt?: string | null
  path: string
  locale: Locale
  imageUrl?: string | null
  publishedAt?: string | null
  updatedAt?: string | null
  authorName?: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt ?? undefined,
    mainEntityOfPage: absoluteUrl(post.path, post.locale),
    image: post.imageUrl ?? undefined,
    inLanguage: post.locale,
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt ?? post.publishedAt ?? undefined,
    author: post.authorName ? { '@type': 'Person', name: post.authorName } : { '@id': `${siteUrl()}/#organization` },
    publisher: { '@id': `${siteUrl()}/#organization` },
  }
}

export function serviceSchema(service: { title: string; summary?: string | null; path: string; locale: Locale }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.summary ?? undefined,
    url: absoluteUrl(service.path, service.locale),
    provider: { '@id': `${siteUrl()}/#organization` },
  }
}

/**
 * 10.9 — only emitted while the role is open. Closing a job removes the schema
 * rather than leaving an expired posting indexed.
 */
export function jobPostingSchema(job: {
  title: string
  description: string
  path: string
  locale: Locale
  publishedAt?: string | null
  validThrough?: string | null
  employmentType?: string | null
  workModel?: string | null
  city?: string | null
  countryCode?: string | null
  organizationName: string
}) {
  const datePosted = job.publishedAt ?? new Date().toISOString()
  const validThrough =
    job.validThrough ?? new Date(new Date(datePosted).getTime() + 90 * 864e5).toISOString()

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    url: absoluteUrl(job.path, job.locale),
    datePosted,
    validThrough,
    employmentType: job.employmentType ?? 'FULL_TIME',
    hiringOrganization: { '@type': 'Organization', name: job.organizationName, sameAs: siteUrl() },
    jobLocationType: job.workModel === 'remote' ? 'TELECOMMUTE' : undefined,
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.city ?? undefined,
        addressCountry: job.countryCode ?? undefined,
      },
    },
  }
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}
