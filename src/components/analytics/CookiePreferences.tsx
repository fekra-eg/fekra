'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { type Locale, localeHref } from '@/i18n/routing'
import { batchTwo } from '@/i18n/batch-two'
import { cookiePreferencesCopy } from '@/i18n/cookie-preferences'
import { DENIED, readConsent, writeConsent, type ConsentState } from '@/lib/consent'

/** Fired by the consent banner's "Manage preferences" button. */
export const OPEN_COOKIE_PREFERENCES = 'fekra:cookie-preferences'

export function CookiePreferences({ locale }: { locale: Locale }) {
  const labels = batchTwo[locale]
  const copy = cookiePreferencesCopy[locale]
  const dialog = useRef<HTMLDialogElement>(null)
  const [choice, setChoice] = useState<ConsentState>(DENIED)
  const [status, setStatus] = useState<'saved' | 'failed' | null>(null)
  const open = () => {
    setChoice(readConsent() ?? DENIED)
    setStatus(null)
    dialog.current?.showModal()
  }
  useEffect(() => {
    window.addEventListener(OPEN_COOKIE_PREFERENCES, open)
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES, open)
  }, [])
  const save = (next: ConsentState) => {
    const previous = readConsent()
    setChoice(next)
    writeConsent(next)
    const stored = readConsent()
    if (stored?.analytics !== next.analytics || stored?.marketing !== next.marketing) return setStatus('failed')
    // Already executed third-party scripts cannot be unloaded by removing
    // their script tag. Reload after revocation so no denied tag runs again.
    if ((previous?.analytics && !next.analytics) || (previous?.marketing && !next.marketing)) return window.location.reload()
    setStatus('saved')
  }
  const policyLink = 'font-semibold text-primary underline underline-offset-4'
  return <>
    <button type="button" onClick={open} className="inline-flex min-h-11 items-center text-start transition-colors hover:text-foreground">{labels.preferences}</button>
    <dialog ref={dialog} aria-labelledby="cookie-preferences-title" onClick={(event) => {
      if (event.target !== event.currentTarget) return
      const rect = event.currentTarget.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.current?.close()
    }} className="fixed inset-0 m-auto max-h-[calc(100dvh-32px)] w-[min(520px,calc(100%_-_32px))] max-w-none overflow-y-auto rounded-3xl border border-border bg-card p-6 text-foreground shadow-lift backdrop:bg-navy-800/40">
      <div className="flex items-center justify-between gap-3">
        <h2 id="cookie-preferences-title" className="text-xl font-bold">{labels.preferences}</h2>
        <button type="button" onClick={() => dialog.current?.close()} aria-label={copy.close} className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-background-subtle"><X aria-hidden className="size-5" /></button>
      </div>
      <p className="mt-3 text-sm/6 text-muted-foreground">{copy.intro} {copy.introNote}</p>
      <div className="my-5 divide-y divide-border">
        <div className="py-4">
          <div className="flex items-center justify-between gap-4 text-base font-semibold">
            {copy.necessary}
            <span className="text-sm font-medium text-primary">{copy.alwaysActive}</span>
          </div>
          <p className="mt-1 text-sm/6 text-muted-foreground">{copy.necessaryBody}</p>
        </div>
        {(['analytics', 'marketing'] as const).map((category) => <div key={category} className="py-4">
          <label className="flex cursor-pointer items-center justify-between gap-4 text-base font-semibold">
            <span>{labels[category]} <span className="text-sm font-normal text-muted-foreground">— {copy.optional}</span></span>
            <input type="checkbox" checked={choice[category]} onChange={(event) => setChoice((state) => ({ ...state, [category]: event.target.checked }))} className="size-5 accent-primary" />
          </label>
          <p className="mt-1 text-sm/6 text-muted-foreground">{copy[`${category}Body`]} {copy.offByDefault}</p>
        </div>)}
      </div>
      <button type="button" onClick={() => save(choice)} className="fk-button fk-button--primary min-h-11 w-full rounded-pill bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{copy.save}</button>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => save({ analytics: true, marketing: true })} className="min-h-11 rounded-pill border border-border px-4 py-2.5 text-sm font-semibold hover:bg-background-subtle">{copy.acceptAll}</button>
        <button type="button" onClick={() => save(DENIED)} className="min-h-11 rounded-pill border border-border px-4 py-2.5 text-sm font-semibold hover:bg-background-subtle">{copy.essentialOnly}</button>
      </div>
      <p role="status" className={`mt-3 text-sm font-medium ${status === 'failed' ? 'text-red-600' : 'text-primary'}`}>
        {status ? copy[status] : null}
      </p>
      <p className="mt-3 text-xs/5 text-muted-foreground">{copy.changeMind}</p>
      <p className="mt-2 text-xs/5 text-muted-foreground">
        {copy.morePolicies}{' '}
        <Link href={localeHref(locale, '/cookie-policy')} className={policyLink}>{copy.cookiePolicy}</Link>
        {' · '}
        <Link href={localeHref(locale, '/privacy-policy')} className={policyLink}>{copy.privacyPolicy}</Link>
      </p>
    </dialog>
  </>
}
