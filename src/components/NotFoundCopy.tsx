'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import { DEFAULT_LOCALE, isLocale, localeHref, type Locale } from '@/i18n/routing'
import { buttonClass } from '@/components/ui/Button'

type Copy = { title: string; body: string; cta: string }

/**
 * Picks the locale on the client so not-found.tsx never calls headers() —
 * that one call made every /[locale] page dynamic (no ISR, no CDN cache).
 */
export function NotFoundCopy({ copies }: { copies: Partial<Record<Locale, Copy>> }) {
  const segment = useParams<{ locale?: string }>()?.locale
  const locale = isLocale(segment) && copies[segment] ? segment : DEFAULT_LOCALE
  const copy = copies[locale]!

  return (
    <>
      <h1 className="mt-4 text-4xl">{copy.title}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">{copy.body}</p>
      <Link href={localeHref(locale, '/')} className={buttonClass('primary', 'lg', 'mt-8')}>
        {copy.cta}
      </Link>
    </>
  )
}
