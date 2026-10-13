'use client'

import Script from 'next/script'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { Locale } from '@/i18n/routing'
import { botCopy } from '@/i18n/bot-protection'
import type { BotAction } from '@/lib/bot-protection'

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string
  remove: (id: string) => void
}
declare global { interface Window { turnstile?: Turnstile } }
type Challenge = { a: number; b: number; nonce: string; challenge: string }

export function BotVerification({ locale, action, onReady, error }: {
  locale: Locale; action: BotAction; onReady: (ready: boolean) => void; error?: string
}) {
  const copy = botCopy[locale]
  const { resolvedTheme } = useTheme()
  const id = useId()
  const root = useRef<HTMLFieldSetElement>(null)
  const container = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [token, setToken] = useState('')
  const [answer, setAnswer] = useState('')
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [widgetSize, setWidgetSize] = useState<'compact' | 'flexible'>('compact')
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const invalidate = useCallback(() => { setToken(''); onReady(false) }, [onReady])

  // Closed job panels and offscreen footer forms should not load challenges
  // or spend the visitor's rate limit before they reach the form.
  useEffect(() => {
    if (!root.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) { setVisible(true); observer.disconnect() }
    }, { rootMargin: '200px' })
    observer.observe(root.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!container.current) return
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const next = entry.contentRect.width >= 300 ? 'flexible' : 'compact'
      if (next !== widgetSize) { invalidate(); setWidgetSize(next) }
    })
    observer.observe(container.current)
    return () => observer.disconnect()
  }, [widgetSize, invalidate])

  useEffect(() => {
    if (!visible) return
    const abort = new AbortController()
    fetch(`/api/bot-challenge?action=${action}`, { signal: abort.signal, cache: 'no-store' })
      .then(async (response) => { if (!response.ok) throw new Error('unavailable'); return response.json() as Promise<Challenge> })
      .then(setChallenge).catch(() => { if (!abort.signal.aborted) setFailed(true) })
    // Both the math challenge and CAPTCHA expire. Refresh together.
    const expiry = setTimeout(() => { invalidate(); setChallenge(null); setAnswer(''); setAttempt((value) => value + 1) }, 290_000)
    return () => { abort.abort(); clearTimeout(expiry) }
  }, [action, attempt, invalidate, visible])

  useEffect(() => {
    if (!loaded || !sitekey || !challenge || !container.current || !window.turnstile) return
    const api = window.turnstile
    const widget = api.render(container.current, {
      sitekey, action, cData: challenge.nonce, language: locale, theme: resolvedTheme === 'dark' ? 'dark' : 'light', size: widgetSize,
      'response-field': false,
      callback: (value: string) => { setToken(value); setFailed(false) },
      'expired-callback': invalidate,
      'error-callback': () => { invalidate(); setFailed(true) },
    })
    return () => { api.remove(widget); invalidate() }
  }, [loaded, sitekey, challenge, action, locale, invalidate, widgetSize, resolvedTheme])

  const correct = Boolean(challenge && /^\d{1,2}$/.test(answer.trim()) && Number(answer) === challenge.a + challenge.b)
  useEffect(() => { onReady(Boolean(token && correct && !failed)) }, [token, correct, failed, onReady])

  return <fieldset ref={root} className="min-w-0 space-y-3" data-bot-verification>
    <legend className="mb-2 text-sm font-medium">{copy.title}</legend>
    {sitekey && visible ? <Script id="fekra-turnstile" src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={() => setLoaded(true)} onError={() => setFailed(true)} /> : null}
    <div ref={container} className="min-w-0" />
    <input type="hidden" name="botToken" value={token} />
    <input type="hidden" name="botChallenge" value={challenge?.challenge ?? ''} />
    {challenge ? <div>
      <label htmlFor={id} className="block text-sm">{copy.question}: <bdi dir="ltr">{challenge.a} + {challenge.b} = ?</bdi></label>
      <input id={id} name="botAnswer" value={answer} onChange={(event) => setAnswer(event.target.value.replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))))} inputMode="numeric" autoComplete="off" required aria-invalid={Boolean(answer && !correct)} aria-describedby={answer && !correct ? `${id}-error` : undefined} className="mt-2 min-h-12 w-24 rounded-lg border-2 border-[#85858f] bg-background px-3 text-lg text-foreground focus:border-primary dark:border-[#898794]" />
      {answer && !correct ? <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-danger-600">{copy.invalid}</p> : null}
    </div> : null}
    {failed || !sitekey ? <div role="alert" className="text-sm text-danger-600">{copy.unavailable}
      <button type="button" onClick={() => { invalidate(); setFailed(false); setChallenge(null); setAnswer(''); setAttempt((value) => value + 1) }} className="fk-link ms-2 min-h-11 underline underline-offset-4">{copy.retry}</button>
    </div> : null}
    {error && !(token && correct && !failed) ? <p role="alert" className="text-sm text-danger-600">{copy.required}</p> : null}
  </fieldset>
}
