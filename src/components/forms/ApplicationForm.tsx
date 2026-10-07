'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { Field, Input, Textarea } from '@/components/ui/Field'
import type { Dictionary } from '@/i18n/getDictionary'
import type { Locale } from '@/i18n/routing'
import { localeHref } from '@/i18n/routing'
import { EVENTS, captureAttribution, track } from '@/lib/analytics'
import { applicationSchema, CV, validateCv } from '@/lib/validation'
import careersCopy from '@/i18n/careers.json'
import { BotVerification } from './BotVerification'
import { useFormValidation } from './useFormValidation'

type Status = 'idle' | 'sending' | 'success' | 'error'

export function ApplicationForm({
  jobId,
  jobTitle,
  dict,
  locale,
  disabled,
  kind,
}: {
  jobId: string | number
  jobTitle: string
  dict: Dictionary
  locale: Locale
  disabled?: boolean
  kind?: 'job' | 'internship' | 'future'
}) {
  const formId = useId()
  const copy = careersCopy[locale]
  const [cvName, setCvName] = useState('')
  const extraFields = kind === 'internship'
    ? ['university', 'graduation', 'location', 'interest'] as const
    : kind === 'future' ? ['desiredRole', 'skills', 'location'] as const
      : kind === 'job' ? ['location'] as const : []
  const [status, setStatus] = useState<Status>('idle')
  const { errors, setErrors, valid, validate, onFieldEvent } = useFormValidation('application', extraFields, jobId)
  const [botReady, setBotReady] = useState(false)
  const [verification, setVerification] = useState(0)
  // Render must stay pure — the render timestamp is stamped after mount.
  const startedAt = useRef(0)
  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  if (disabled) {
    return (
      <p className="rounded-card border border-border bg-background-subtle p-6 text-sm text-muted-foreground">
        {dict.careers.closed}
      </p>
    )
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    if (!validate(form) || !botReady || status === 'sending') return
    const formData = new FormData(form)
    const values = Object.fromEntries(formData)
    if (kind) {
      formData.set('coverNote', extraFields.map((key) => `${careersCopy.en[key]}: ${String(values[key] ?? '').trim()}`).join('\n'))
      values.coverNote = formData.get('coverNote')!
    }

    const parsed = applicationSchema.safeParse({
      ...values,
      jobId: String(jobId),
      consent: values.consent === 'on',
    })
    const nextErrors: Record<string, string> = {}
    for (const key of extraFields) {
      if (!String(values[key] ?? '').trim()) nextErrors[key] = 'required'
    }
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? 'form')
        nextErrors[field] =
          field === 'email' ? 'email' : field === 'phone' ? 'phone' : field === 'linkedin' ? 'url' : 'required'
      }
    }

    // 10.4 — reject bad files before uploading 5 MB the server will discard.
    const file = formData.get('cv')
    if (file instanceof File) {
      if (file.size === 0) {
        nextErrors.cv = 'required'
      } else {
        const problem = validateCv(file)
        if (problem) nextErrors.cv = problem
      }
    } else {
      nextErrors.cv = 'required'
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      setStatus('idle')
      const firstField = Object.keys(nextErrors)[0]
      requestAnimationFrame(() =>
        form.querySelector<HTMLElement>(`[name="${firstField}"]`)?.focus(),
      )
      return
    }

    formData.set('jobId', String(jobId))
    formData.set('startedAt', String(startedAt.current))
    formData.set('locale', locale)
    formData.set('sourcePath', window.location.pathname)
    for (const [key, value] of Object.entries(captureAttribution())) {
      if (typeof value === 'string' && value) formData.set(key, value)
    }

    setStatus('sending')
    setErrors({})

    try {
      const res = await fetch('/api/apply', { method: 'POST', body: formData })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { fields?: Record<string, string> }
        const nextErrors = body.fields ?? {}
        setErrors(nextErrors)
        setBotReady(false)
        setVerification((value) => value + 1)
        setStatus(Object.keys(nextErrors).length ? 'idle' : 'error')
        requestAnimationFrame(() => {
          const firstField = Object.keys(nextErrors)[0]
          if (firstField) form.querySelector<HTMLElement>(`[name="${firstField}"]`)?.focus()
        })
        return
      }
      // 22.7 — no candidate PII in the event payload, only the role.
      track(EVENTS.applicationSubmit, { job: jobTitle, locale })
      form.reset()
      setCvName('')
      setStatus('success')
    } catch {
      setBotReady(false)
      setVerification((value) => value + 1)
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-card border border-primary/40 bg-primary/5 p-6"
      >
        <p className="font-display text-xl font-bold text-navy-800 dark:text-foreground">
          {dict.form.applicationSuccess}
        </p>
        <Link
          href={localeHref(locale, '/careers')}
          className="fk-button fk-button--secondary mt-5 inline-flex min-h-11 items-center rounded-pill border border-navy-800 px-5 text-sm font-semibold text-navy-800 transition-colors dark:border-foreground dark:text-foreground"
        >
          {dict.careers.backToRoles}
        </Link>
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
      action="/api/apply"
      onSubmit={onSubmit}
      onChange={onFieldEvent}
      onBlur={onFieldEvent}
      noValidate
      encType="multipart/form-data"
      aria-busy={status === 'sending'}
      data-career-form={kind}
      className="@container flex flex-col gap-4 @md:gap-5"
    >
      <div aria-hidden hidden>
        <label htmlFor={`${formId}-website`}>Website</label>
        <input id={`${formId}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={kind ? 'grid gap-4' : 'grid gap-4 @md:grid-cols-2 @md:gap-5'}>
        <Field label={dict.form.name} hideLabel={Boolean(kind)} required error={messageFor('fullName')}>
          {(props) => <Input {...props} name="fullName" autoComplete="name" />}
        </Field>
        <Field label={dict.form.email} hideLabel={Boolean(kind)} required error={messageFor('email')}>
          {(props) => <Input {...props} name="email" type="email" autoComplete="email" />}
        </Field>
        <Field label={dict.form.phone} hideLabel={Boolean(kind)} required error={messageFor('phone')}>
          {(props) => <Input {...props} name="phone" type="tel" autoComplete="tel" dir="ltr" />}
        </Field>
        {/* Optional on every form — the privacy policy lists it (FK-22). */}
        <Field label={dict.form.linkedin} hideLabel={Boolean(kind)} error={messageFor('linkedin')}>
          {(props) => (
            <Input {...props} name="linkedin" type="url" dir="ltr" {...(kind ? {} : { placeholder: 'https://' })} />
          )}
        </Field>
        {extraFields.map((key) => <Field key={key} label={copy[key]} hideLabel required error={messageFor(key)}>
          {(props) => <Input {...props} name={key} maxLength={500} inputMode={key === 'graduation' ? 'numeric' : undefined} />}
        </Field>)}
      </div>

      {kind ? <Field label={dict.form.cv} hideLabel required hint={dict.form.cvHint} error={messageFor('cv')}>
        {(props) => <label className="career-upload fk-button fk-button--secondary" htmlFor={props.id}>
          <span>{cvName || copy.attach}</span>
          <input {...props} className="sr-only" name="cv" type="file" accept={[...CV.mimeTypes, ...CV.extensions].join(',')} onChange={(event) => setCvName(event.target.files?.[0]?.name ?? '')} />
        </label>}
      </Field> : <Field label={dict.form.cv} required hint={dict.form.cvHint} error={messageFor('cv')}>
        {(props) => (
          <Input
            {...props}
            name="cv"
            type="file"
            accept={[...CV.mimeTypes, ...CV.extensions].join(',')}
            className={cn(
              props.className,
              'cursor-pointer px-2 py-2 text-sm @md:px-3 @md:py-3 @md:text-base',
              'file:me-3 file:cursor-pointer file:rounded-pill file:border-0 file:bg-primary',
              'file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground',
            )}
          />
        )}
      </Field>}

      {!kind ? <Field label={dict.form.message} error={messageFor('coverNote')}>
        {(props) => <Textarea {...props} name="coverNote" rows={4} />}
      </Field> : null}

      <label className="flex min-h-11 items-start gap-3 text-sm text-muted-foreground">
        <input
          type="checkbox"
          name="consent"
          required
          aria-invalid={Boolean(errors.consent)}
          aria-describedby={errors.consent ? `${formId}-consent-error` : undefined}
          className="mt-0.5 size-5 accent-primary"
        />
        <span>
          {dict.form.consent}
          {errors.consent ? (
            <span
              id={`${formId}-consent-error`}
              role="alert"
              className="mt-1 block text-xs font-medium text-danger-600"
            >
              {messageFor('consent')}
            </span>
          ) : null}
        </span>
      </label>

      {status === 'error' ? (
        <p role="alert" className="text-sm font-medium text-danger-600">
          {dict.form.error}
        </p>
      ) : null}

      <BotVerification key={verification} locale={locale} action="application" onReady={setBotReady} error={errors.botToken} />
      <Button
        type="submit"
        size="lg"
        disabled={status === 'sending' || !valid || !botReady}
        className="w-full @md:w-auto @md:self-start"
      >
        {status === 'sending' ? dict.form.submitting : kind ? copy.submit : dict.form.apply}
      </Button>
      <p className="sr-only" role="status" aria-live="polite">
        {status === 'sending' ? dict.form.submitting : ''}
      </p>
    </form>
  )
}
