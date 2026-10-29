'use client'

import { Button, useConfig, useDocumentInfo, useFormModified } from '@payloadcms/ui'
import { useState } from 'react'

export function TranslateButton() {
  const { id, collectionSlug } = useDocumentInfo()
  const modified = useFormModified()
  const { config } = useConfig()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  if (!id) return <p style={{ marginBottom: 24 }}>Save the English version first, then translate it.</p>

  async function translate() {
    setBusy(true)
    setMessage('Translating the languages that are still empty… this can take a minute.')
    try {
      const res = await fetch(`${config.routes.api}/${collectionSlug}/${id}/translate`, { method: 'POST', credentials: 'include' })
      const body = (await res.json().catch(() => ({}))) as { translated?: string[]; failed?: { locale: string; error: string }[]; skipped?: string[]; error?: string }
      const failed = body.failed?.map((f) => `${f.locale.toUpperCase()}: ${f.error}`).join(' · ')
      const kept = body.skipped?.length ? `Kept existing ${body.skipped.join(', ').toUpperCase()}.` : ''
      if (res.ok && !body.translated?.length && !failed) return setMessage(`${kept} Nothing left to translate.`.trim())
      if (!body.translated?.length) throw new Error(failed || body.error || `Request failed (${res.status})`)
      // Reload so the editor shows the saved translations instead of stale form state.
      if (!failed) return window.location.reload()
      setMessage(`Translated ${body.translated.join(', ').toUpperCase()}. ${kept} Failed — ${failed}. Reload to see the saved ones.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Translation failed.')
    } finally {
      setBusy(false)
    }
  }

  return <div style={{ marginBottom: 24 }}>
    <Button buttonStyle="secondary" size="medium" disabled={busy || modified} onClick={translate} margin={false}>
      {busy ? 'Translating…' : 'Translate empty languages'}
    </Button>
    <p style={{ marginTop: 8, fontSize: 13, color: 'var(--theme-elevation-500)' }}>
      {modified
        ? 'Save your English changes first.'
        : message || 'Translates languages that are still empty; edited translations are kept. Saved as a draft — review, then Publish.'}
    </p>
  </div>
}
