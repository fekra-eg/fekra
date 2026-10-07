'use client'

import { useEffect, useRef, useState } from 'react'

import { Field, Input, Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import type { Dictionary } from '@/i18n/getDictionary'
import type { Locale } from '@/i18n/routing'
import { EVENTS, captureAttribution, track } from '@/lib/analytics'
import { BotVerification } from './BotVerification'
import { useFormValidation } from './useFormValidation'

type Status = 'idle' | 'sending' | 'success' | 'error'

export function ContactForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [status, setStatus] = useState<Status>('idle')
  const { errors, setErrors, valid, validate, onFieldEvent } = useFormValidation('contact')
  const [botReady, setBotReady] = useState(false)
  const [verification, setVerification] = useState(0)
  // Render must stay pure — the render timestamp is stamped after mount.
  const startedAt = useRef(0)
  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    if (!validate(form) || !botReady || status === 'sending') return
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>

    setStatus('sending')
    setErrors({})

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...data,
          consent: data.consent === 'on',
          startedAt: startedAt.current,
          locale,
          sourcePath: window.location.pathname,
          ...captureAttribution(),
        }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { fields?: Record<string, string> }
        const nextErrors = body.fields ?? {}
        setErrors(nextErrors)
        setBotReady(false)
        setVerification((value) => value + 1)
        setStatus(Object.keys(nextErrors).length ? 'idle' : 'error')
        const firstInvalid = Object.keys(nextErrors)[0]
        if (firstInvalid) {
          const control = form.elements.namedItem(firstInvalid) as HTMLElement | null
          requestAnimationFrame(() => control?.focus())
        }
        return
      }

      // 11.7 / 22.6 — fired only after a confirmed 2xx, never on render.
      track(EVENTS.contactSubmit, { form: 'contact', locale })
      form.reset()
      setStatus('success')
    } catch {
      setBotReady(false)
      setVerification((value) => value + 1)
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div role="status" className="rounded-card border border-primary/40 bg-primary/5 p-6">
        <p className="font-medium text-foreground">{dict.form.success}</p>
      </div>
    )
  }

  const messageFor = (field: string) =>
    errors[field]
      ? (dict.form.errors[errors[field] as keyof typeof dict.form.errors] ?? errors[field])
      : undefined

  return (
    <form
      method="post"
      action="/api/contact"
      onSubmit={onSubmit}
      onChange={onFieldEvent}
      onBlur={onFieldEvent}
      noValidate
      aria-busy={status === 'sending'}
      className="@container flex flex-col gap-5"
    >
      {/* Honeypot — hidden from users and screen readers, irresistible to bots. */}
      <div aria-hidden hidden>
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {/* Stacked fields, as the comp draws them. Phone and company are
          optional — they qualify the lead, and the privacy policy lists them (FK-20/21). */}
      <Field hideLabel label={dict.form.name} required error={messageFor('fullName')}>
        {(props) => <Input {...props} name="fullName" autoComplete="name" />}
      </Field>

      <Field hideLabel label={dict.form.email} required error={messageFor('email')}>
        {(props) => (
          <Input {...props} name="email" type="email" autoComplete="email" inputMode="email" />
        )}
      </Field>

      <Field hideLabel label={dict.form.company} error={messageFor('company')}>
        {(props) => <Input {...props} name="company" autoComplete="organization" />}
      </Field>

      <Field hideLabel label={dict.form.phone} error={messageFor('phone')}>
        {(props) => <Input {...props} name="phone" type="tel" autoComplete="tel" inputMode="tel" />}
      </Field>

      <Field hideLabel label={dict.form.subject} required error={messageFor('subject')}>
        {(props) => <Input {...props} name="subject" />}
      </Field>

      <Field hideLabel label={dict.form.message} required error={messageFor('message')}>
        {(props) => <Textarea {...props} name="message" rows={6} />}
      </Field>

      <div>
        <label className="flex min-h-11 items-start gap-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="consent"
            required
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? 'contact-consent-error' : undefined}
            className="mt-0.5 size-5"
          />
          <span>{dict.form.consent}</span>
        </label>
        {errors.consent ? (
          <p id="contact-consent-error" role="alert" className="text-sm text-danger-600">
            {messageFor('consent')}
          </p>
        ) : null}
      </div>

      {status === 'error' ? (
        <p role="alert" className="text-sm font-medium text-danger-600">
          {dict.form.error}
        </p>
      ) : null}

      <BotVerification key={verification} locale={locale} action="contact" onReady={setBotReady} error={errors.botToken} />
      <Button
        type="submit"
        size="lg"
        disabled={status === 'sending' || !valid || !botReady}
        className="w-full justify-center"
      >
        {status === 'sending' ? dict.form.submitting : dict.form.submit}
      </Button>
    </form>
  )
}
