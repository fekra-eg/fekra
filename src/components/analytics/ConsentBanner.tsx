'use client'

import Link from 'next/link'
import { Cookie } from 'lucide-react'
import { useId } from 'react'

import { OPEN_COOKIE_PREFERENCES } from '@/components/analytics/CookiePreferences'
import { Button } from '@/components/ui/Button'
import type { Dictionary } from '@/i18n/getDictionary'
import { type Locale, localeHref } from '@/i18n/routing'
import { writeConsent } from '@/lib/consent'
import { useConsent } from '@/lib/useConsent'

export function ConsentBanner({ dict, locale, enabled }: { dict: Dictionary; locale: Locale; enabled: boolean }) {
  const consent = useConsent()
  const titleId = useId()
  const descriptionId = useId()

  // Server render and any answered visitor render nothing.
  if (!enabled || consent !== null) return null

  const decide = (analytics: boolean, marketing: boolean) => writeConsent({ analytics, marketing })

  return (
    <div
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-100 max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-[20px] border border-border bg-card p-4 shadow-[0_8px_40px_rgb(0_16_51/0.14)] sm:inset-x-4 sm:p-5 md:inset-x-auto md:end-6 md:w-full md:max-w-md md:rounded-3xl md:p-6"
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <Cookie aria-hidden className="size-[18px]" />
        </span>
        <h2 id={titleId} className="font-display text-base font-bold sm:text-lg">{dict.consent.title}</h2>
      </div>
      <p id={descriptionId} className="mt-2 text-sm/6 text-muted-foreground">
        {dict.consent.body}{' '}
        {/* Consent is not informed without the detail behind it (1.10 / 21.8). */}
        <Link href={localeHref(locale, '/cookie-policy')} className="rounded-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          {dict.consent.cookiePolicy}
        </Link>
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
        <Button className="min-w-0 px-3 py-2.5 text-sm leading-5 whitespace-normal" onClick={() => decide(true, true)}>{dict.consent.acceptAll}</Button>
        <Button className="min-w-0 px-3 py-2.5 text-sm leading-5 whitespace-normal" variant="secondary" onClick={() => decide(false, false)}>
          {dict.consent.essentialOnly}
        </Button>
        <Button className="col-span-2 min-w-0 px-3 py-2.5 text-sm leading-5 whitespace-normal" variant="secondary" onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES))}>
          {dict.consent.managePreferences}
        </Button>
      </div>
    </div>
  )
}
