'use client'

import { Button, useConfig, useDocumentInfo, useFormModified, useLocale } from '@payloadcms/ui'
import { useState } from 'react'

type Review = {
  score?: number
  summary?: string
  focusKeyword?: string
  secondaryKeywords?: string[]
  strengths?: string[]
  issues?: { severity?: string; issue?: string; fix?: string }[]
  suggestedTitle?: string
  suggestedMetaTitle?: string
  suggestedMetaDescription?: string
  suggestedHeadings?: string[]
}
type Measured = Record<string, number | boolean>

const muted = { fontSize: 13, color: 'var(--theme-elevation-500)' }
const SEVERITY: Record<string, string> = { high: '#c82333', medium: '#d97706', low: 'var(--theme-elevation-500)' }

function Suggestion({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return <div style={{ marginTop: 10 }}>
    <div style={muted}>{label} <span>({value.length} chars)</span></div>
    <div style={{ fontSize: 13, padding: 8, borderRadius: 4, background: 'var(--theme-elevation-50)', userSelect: 'all' }}>{value}</div>
  </div>
}

export function SeoReview() {
  const { id } = useDocumentInfo()
  const modified = useFormModified()
  const locale = useLocale()
  const { config } = useConfig()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ review: Review; measured: Measured } | null>(null)

  if (!id) return null

  async function run() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`${config.routes.api}/posts/${id}/seo-review?locale=${locale.code}`, { method: 'POST', credentials: 'include' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`)
      setResult(body)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'SEO review failed.')
    } finally {
      setBusy(false)
    }
  }

  const review = result?.review
  const m = result?.measured
  const score = review?.score ?? 0
  return <div style={{ marginBottom: 24 }}>
    <Button buttonStyle="secondary" size="medium" disabled={busy || modified} onClick={run} margin={false}>
      {busy ? 'Reviewing…' : `SEO review (${locale.code.toUpperCase()})`}
    </Button>
    <p style={{ ...muted, marginTop: 8 }}>
      {modified ? 'Save first — the review reads the saved draft.' : error || (!review && 'AI review of this language: score, issues and suggested meta. Nothing is changed.')}
    </p>
    {review && m ? <div style={{ fontSize: 13 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
        <strong style={{ fontSize: 28, color: score >= 80 ? '#15803d' : score >= 60 ? '#d97706' : '#c82333' }}>{score}</strong>
        <span style={muted}>/ 100</span>
      </div>
      <p style={{ marginTop: 6 }}>{review.summary}</p>
      <p style={{ ...muted, marginTop: 8 }}>
        {m.words} words · H2 {m.h2} · H3 {m.h3}{Number(m.h1) ? ` · body H1 ${m.h1}` : ''} · links {m.internalLinks} internal / {m.externalLinks} external · images {m.images}{Number(m.imagesWithoutAlt) ? ` (${m.imagesWithoutAlt} without alt)` : ''}
      </p>
      {review.focusKeyword ? <p style={{ marginTop: 8 }}><span style={muted}>Focus keyword:</span> <strong>{review.focusKeyword}</strong>{review.secondaryKeywords?.length ? <span style={muted}> · {review.secondaryKeywords.join(', ')}</span> : null}</p> : null}
      {review.issues?.length ? <>
        <h4 style={{ marginTop: 14, marginBottom: 6 }}>Fix</h4>
        <ol style={{ paddingInlineStart: 18, margin: 0 }}>
          {review.issues.map((item, i) => <li key={i} style={{ marginBottom: 8 }}>
            <span style={{ color: SEVERITY[item.severity ?? 'low'], fontWeight: 600, textTransform: 'uppercase', fontSize: 11 }}>{item.severity}</span> {item.issue}
            {item.fix ? <div style={muted}>→ {item.fix}</div> : null}
          </li>)}
        </ol>
      </> : null}
      {review.strengths?.length ? <>
        <h4 style={{ marginTop: 14, marginBottom: 6 }}>Working well</h4>
        <ul style={{ paddingInlineStart: 18, margin: 0 }}>{review.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
      </> : null}
      <Suggestion label="Suggested title" value={review.suggestedTitle} />
      <Suggestion label="Suggested meta title" value={review.suggestedMetaTitle} />
      <Suggestion label="Suggested meta description" value={review.suggestedMetaDescription} />
      {review.suggestedHeadings?.length ? <>
        <h4 style={{ marginTop: 14, marginBottom: 6 }}>Sections worth adding</h4>
        <ul style={{ paddingInlineStart: 18, margin: 0 }}>{review.suggestedHeadings.map((h, i) => <li key={i}>{h}</li>)}</ul>
      </> : null}
    </div> : null}
  </div>
}
