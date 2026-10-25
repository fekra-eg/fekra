'use client'

import { useEffect, useRef, useState } from 'react'

import type { Dictionary } from '@/i18n/getDictionary'
import type { Locale } from '@/i18n/routing'
import { EVENTS, captureAttribution, track } from '@/lib/analytics'
import { Field } from '@/components/ui/Field'
import { BotVerification } from './BotVerification'
import { useFormValidation } from './useFormValidation'

type Status = 'idle' | 'sending' | 'success' | 'error'

const MODELS = ['fullTime', 'partTime', 'hourly'] as const

/*
 * The "Get Free Consultation" card from the Figma service heroes: underline
 * inputs, a hiring-model choice and a solid brand button. Submits to the
 * existing /api/contact endpoint — subject and message are synthesised from
 * the service name and chosen model, so no new API surface is needed.
 *
 * Shared CAPTCHA and field validation also run at the server trust boundary.
 */
export function ConsultationForm({
  title,
  service,
  dict,
  locale,
}: {
  title: string
  service: string
  dict: Dictionary
  locale: Locale
}) {
  const [status, setStatus] = useState<Status>('idle')
  const { errors, setErrors, valid, validate, onFieldEvent } = useFormValidation('consultation')
  const [botReady, setBotReady] = useState(false)
  const [verification, setVerification] = useState(0)
  const startedAt = useRef(0)
  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    if (!validate(form) || !botReady || status === 'sending') return
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>

    setErrors({})
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...data,
          formKind: 'consultation',
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          website: data.website,
          subject: `Free consultation — ${service}`,
          message: `Consultation request from the ${service} page. Hiring model: ${data.model ?? 'not specified'}.`,
          consent: data.consent === 'on',
          startedAt: startedAt.current,
          locale,
          sourcePath: window.location.pathname,
          ...captureAttribution(),
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { fields?: Record<string, string> }
        setErrors(body.fields ?? {})
        setBotReady(false)
        setVerification((value) => value + 1)
        const first = Object.keys(body.fields ?? {})[0]
        if (first) requestAnimationFrame(() => (form.elements.namedItem(first) as HTMLElement | null)?.focus())
        setStatus('error')
        return
      }
      track(EVENTS.contactSubmit, { form: 'consultation', locale })
      form.reset()
      setStatus('success')
    } catch {
      setBotReady(false)
      setVerification((value) => value + 1)
      setStatus('error')
    }
  }

  const input =
    'w-full border-b border-[#bcbcbc] bg-transparent px-2 py-2.5 text-sm text-ink-900 placeholder:text-ink-900/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:border-input dark:text-foreground dark:placeholder:text-muted-foreground'
  const messageFor = (field: string) => errors[field] ? dict.form.errors[errors[field] as keyof typeof dict.form.errors] ?? dict.form.error : undefined

  return (
    <div className="rounded-[25px] bg-white p-[30px] shadow-[0_0_5px_rgba(0,0,0,0.2)] dark:bg-card dark:ring-1 dark:ring-border">
      <h2 className="font-display text-2xl font-bold text-black dark:text-foreground">{title}</h2>

      {status === 'success' ? (
        <p role="status" className="mt-6 rounded-card border border-primary/40 bg-primary/5 p-4 font-medium">
          {dict.form.success}
        </p>
      ) : (
        <form method="post" action="/api/contact" onSubmit={onSubmit} onChange={onFieldEvent} onBlur={onFieldEvent} noValidate className="@container mt-3 flex flex-col gap-1">
          {/* Honeypot — hidden from users and screen readers, irresistible to bots. */}
          <div aria-hidden hidden>
            <label htmlFor="consult-website">Website</label>
            <input id="consult-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <Field label={dict.form.name} hideLabel required error={messageFor('fullName')}>
            {(props) => <input {...props} name="fullName" autoComplete="name" className={input} />}
          </Field>
          <Field label={dict.form.email} hideLabel required error={messageFor('email')}>
            {(props) => <input {...props} name="email" type="email" autoComplete="email" className={input} />}
          </Field>
          <Field label={dict.form.phone} hideLabel required error={messageFor('phone')}>
            {(props) => <input {...props} name="phone" type="tel" autoComplete="tel" dir="ltr" className={input} />}
          </Field>

          <fieldset className="mt-3" aria-describedby={errors.model ? 'consult-model-error' : undefined}>
            <legend className="text-sm font-medium text-ink-900 dark:text-foreground">{dict.form.hiringModel}</legend>
            <div className="mt-1 flex flex-wrap gap-x-4">
              {MODELS.map((model) => (
                <label key={model} className="flex min-h-8 items-center gap-1.5 text-sm text-ink-900 dark:text-foreground">
                  <input type="radio" name="model" required value={{ fullTime: 'Full Time', partTime: 'Part Time', hourly: 'Hourly Time' }[model]} className="size-4 accent-primary" />
                  {dict.form.hiringModels[model]}
                </label>
              ))}
            </div>
            {errors.model ? <p id="consult-model-error" role="alert" className="text-sm text-danger-600">{messageFor('model')}</p> : null}
          </fieldset>

          <label className="mt-1 flex items-start gap-2 py-1 text-xs/5 text-muted-foreground">
            <input type="checkbox" name="consent" aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? 'consult-consent-error' : undefined} required className="mt-0.5 size-4 shrink-0" />
            <span>{dict.form.consent}</span>
          </label>
          {errors.consent ? <p id="consult-consent-error" role="alert" className="text-sm text-danger-600">{messageFor('consent')}</p> : null}

          {status === 'error' && (!Object.keys(errors).length || errors.message) ? (
            <p id="consult-errors" role="alert" className="text-sm font-medium text-danger-600">
              {messageFor('message') ?? dict.form.error}
            </p>
          ) : null}

          <BotVerification key={verification} locale={locale} action="consultation" onReady={setBotReady} error={errors.botToken} compact />
          <button
            type="submit"
            disabled={status === 'sending' || !valid || !botReady}
            className="fk-button fk-button--primary mt-3 min-h-11 w-full rounded-[10px] bg-primary text-base text-primary-foreground transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {status === 'sending' ? dict.form.submitting : dict.form.hireDevelopers}
          </button>
        </form>
      )}
    </div>
  )
}
