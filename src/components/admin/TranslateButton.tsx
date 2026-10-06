'use client'

import { Button, useConfig, useDocumentInfo, useFormModified } from '@payloadcms/ui'
import { useState } from 'react'

export function TranslateButton() {
  const { id } = useDocumentInfo()
  const modified = useFormModified()
  const { config } = useConfig()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  if (!id) return <p style={{ marginBottom: 24 }}>Save the English article first, then translate it.</p>

  async function translate() {
    setBusy(true)
    setMessage('Translating into Arabic, German, French and Spanish… this can take a minute.')
    try {
      const res = await fetch(`${config.routes.api}/posts/${id}/translate`, { method: 'POST', credentials: 'include' })
      const body = (await res.json().catch(() => ({}))) as { translated?: string[]; failed?: { locale: string; error: string }[]; error?: string }
      const failed = body.failed?.map((f) => `${f.locale.toUpperCase()}: ${f.error}`).join(' · ')
      if (!body.translated?.length) throw new Error(failed || body.error || `Request failed (${res.status})`)
      // Reload so the editor shows the saved translations instead of stale form state.
      if (!failed) return window.location.reload()
      setMessage(`Translated ${body.translated.join(', ').toUpperCase()}. Failed — ${failed}. Reload to see the saved ones.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Translation failed.')
    } finally {
      setBusy(false)
    }
  }

  return <div style={{ marginBottom: 24 }}>
    <Button buttonStyle="secondary" size="medium" disabled={busy || modified} onClick={translate} margin={false}>
      {busy ? 'Translating…' : 'Translate to all languages'}
    </Button>
    <p style={{ marginTop: 8, fontSize: 13, color: 'var(--theme-elevation-500)' }}>
      {modified
        ? 'Save your English changes first.'
        : message || 'Overwrites AR, DE, FR and ES with a translation of the English version, saved as a draft. Review, then Publish.'}
    </p>
  </div>
}
