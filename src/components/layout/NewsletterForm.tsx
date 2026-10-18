'use client'

import { ArrowRight } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import type { Dictionary } from '@/i18n/getDictionary'
import type { Locale } from '@/i18n/routing'
import { BotVerification } from '@/components/forms/BotVerification'
import { useFormValidation } from '@/components/forms/useFormValidation'

export function NewsletterForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const { errors, valid, validate, onFieldEvent } = useFormValidation('newsletter')
  const [botReady, setBotReady] = useState(false)
  const [verification, setVerification] = useState(0)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    if (!validate(form) || !botReady || state === 'sending') return
    const data = Object.fromEntries(new FormData(form))
    setState('sending')
    try {
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...data, locale, path: window.location.pathname }),
    })
    setState(res.ok ? 'done' : 'error')
    if (res.ok) form.reset()
    } catch { setState('error') }
    setBotReady(false)
    setVerification((value) => value + 1)
  }

  if (state === 'done') {
    return (
      <p role="status" className="text-sm font-medium text-primary">
        {dict.form.success}
      </p>
    )
  }

  return (
    <form method="post" action="/api/newsletter" onSubmit={onSubmit} onChange={onFieldEvent} onBlur={onFieldEvent} className="flex w-full max-w-md flex-wrap gap-2">
      <label htmlFor="newsletter-email" className="sr-only">
        {dict.form.email}
      </label>
      <input
        id="newsletter-email"
        name="email"
        aria-invalid={Boolean(errors.email)}
        aria-describedby={errors.email ? 'newsletter-email-error' : undefined}
        type="email"
        required
        autoComplete="email"
        placeholder={dict.form.emailPlaceholder}
        /* min-w-0: an input's intrinsic ~20ch floor otherwise pushes the row
           past the viewport on narrow phones. */
        className="h-13 min-w-0 flex-1 rounded-pill border border-input bg-card px-4 text-sm"
      />
      <Button type="submit" disabled={state === 'sending' || !valid || !botReady} className="h-13 w-full px-8 sm:w-auto">
        {state === 'sending' ? dict.form.submitting : dict.form.subscribe}
        <ArrowRight className="icon-flip size-4" aria-hidden />
      </Button>
      {errors.email ? <p id="newsletter-email-error" role="alert" className="w-full text-sm text-danger-600">{dict.form.errors.email}</p> : null}
      <div className="mt-2 w-full"><BotVerification key={verification} locale={locale} action="newsletter" onReady={setBotReady} /></div>
      {state === 'error' ? (
        <p role="alert" className="w-full text-sm text-danger-600">
          {dict.form.error}
        </p>
      ) : null}
    </form>
  )
}
