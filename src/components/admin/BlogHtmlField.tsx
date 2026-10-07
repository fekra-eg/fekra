'use client'

import { useField } from '@payloadcms/ui'
import type { TextareaFieldClientComponent } from 'payload'
import { useDeferredValue, useMemo, useState } from 'react'

import { HtmlArticle } from '@/components/blog/HtmlArticle'
import { blogHtmlDocument, MAX_BLOG_HTML_LENGTH } from '@/lib/blog-html'

export const BlogHtmlField: TextareaFieldClientComponent = ({ path, readOnly }) => {
  const { value, setValue, showError, errorMessage, disabled } = useField<string>({ path })
  const locked = readOnly || disabled
  const [mobile, setMobile] = useState(false)
  const [importError, setImportError] = useState('')
  const deferred = useDeferredValue(value ?? '')
  const document = useMemo(() => blogHtmlDocument(deferred), [deferred])

  return <div style={{ marginBottom: 24 }}>
    <label htmlFor={`field-${path}`} style={{ display: 'block', marginBottom: 8 }}>HTML content</label>
    <p>Paste HTML with its CSS, or import an .html file. Use inline styles or a &lt;style&gt; block and absolute image URLs. JavaScript and forms are disabled.</p>
    <input type="file" accept=".html,.htm,text/html" aria-label="Import HTML file" disabled={locked}
      onChange={async (event) => {
        const input = event.currentTarget
        const file = input.files?.[0]
        if (!file) return
        try {
          if (file.size > MAX_BLOG_HTML_LENGTH) throw new Error('Please choose an HTML file smaller than 500 KB.')
          const html = await file.text()
          setValue(html)
          setImportError('')
        } catch (error) {
          setImportError(error instanceof Error ? error.message : 'Could not read this file.')
        } finally { input.value = '' }
      }} />
    <textarea id={`field-${path}`} value={value ?? ''} readOnly={locked} maxLength={MAX_BLOG_HTML_LENGTH}
      aria-invalid={showError || undefined} spellCheck={false} rows={14}
      onChange={(event) => setValue(event.target.value)}
      style={{ display: 'block', width: '100%', marginTop: 12, padding: 12, fontFamily: 'monospace', resize: 'vertical', direction: 'ltr' }} />
    {showError || importError ? <p role="alert" style={{ color: 'var(--theme-error-500)' }}>{importError || errorMessage}</p> : null}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBlock: 16 }}>
      <strong>HTML preview</strong>
      <button type="button" aria-pressed={!mobile} onClick={() => setMobile(false)}>Desktop</button>
      <button type="button" aria-pressed={mobile} onClick={() => setMobile(true)}>Mobile</button>
    </div>
    <div style={{ maxHeight: 720, overflow: 'auto', padding: 12, border: '1px solid var(--theme-elevation-200)', background: 'var(--theme-elevation-50)' }}>
      <div style={{ width: mobile ? 390 : '100%', maxWidth: '100%', marginInline: 'auto' }}>
        <HtmlArticle document={document} title="Blog HTML preview" />
      </div>
    </div>
  </div>
}
