'use client'

import { useEffect, useRef } from 'react'

import type { Dictionary } from '@/i18n/getDictionary'
import { EVENTS, track } from '@/lib/analytics'
import { useConsent } from '@/lib/useConsent'

/**
 * 12.2 / 21.8 — Calendly is a third-party iframe that sets cookies, so it only
 * loads after marketing consent. Without consent the user still gets a working
 * path: a direct link to the booking page (12.4 — no dead end).
 *
 * The iframe reserves its height up front so loading it does not shift the page
 * (17.11), and Calendly's postMessage events distinguish "opened the widget"
 * from "actually booked" (12.5 / 22.8).
 */
export function CalendlyEmbed({ url, dict }: { url: string; dict: Dictionary }) {
  const allowed = useConsent()?.marketing === true
  const frame = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!allowed) return
    const onMessage = (event: MessageEvent) => {
      if (!/^https:\/\/(?:[a-z0-9-]+\.)?calendly\.com$/.test(event.origin) || event.source !== frame.current?.contentWindow) return
      const eventName = (event.data as { event?: string })?.event
      if (eventName === 'calendly.event_type_viewed') track(EVENTS.bookingClick)
      if (eventName === 'calendly.event_scheduled') track(EVENTS.bookingComplete)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [allowed])

  const embedUrl = `${url}${url.includes('?') ? '&' : '?'}embed_domain=${
    typeof window === 'undefined' ? '' : window.location.hostname
  }&embed_type=Inline&hide_gdpr_banner=1`

  if (!allowed) {
    return (
      <div className="mt-10 flex min-h-[680px] flex-col items-center justify-center gap-4 rounded-panel border border-border bg-background-subtle p-8 text-center">
        <p className="text-muted-foreground">{dict.meeting.consentRequired}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track(EVENTS.bookingClick, { mode: 'external' })}
          className="font-semibold text-primary underline underline-offset-4"
        >
          {dict.meeting.openInNewTab}
        </a>
      </div>
    )
  }

  return (
    <iframe
      ref={frame}
      src={embedUrl}
      title={dict.meeting.title}
      loading="lazy"
      className="mt-10 min-h-[680px] w-full rounded-panel border border-border"
    />
  )
}
