'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { createContext, use, useSyncExternalStore, type ReactNode } from 'react'

import { RichText } from '@/components/RichText'
import type { Locale } from '@/i18n/routing'

type LiveFields = { id?: number | string; title?: string | null; excerpt?: string | null; content?: SerializedEditorState | null }

const Ctx = createContext<LiveFields>({})
const noop = () => () => {}

/**
 * Inside the admin's live-preview iframe, title/excerpt/body follow the form as
 * the editor types (no save, no server render). Everything else on the page
 * still updates through LivePreviewRefresh on save. Outside the iframe this is
 * a plain pass-through of the server data.
 */
export function LivePost({ initial, children }: { initial: LiveFields; children: ReactNode }) {
  const framed = useSyncExternalStore(noop, () => window.self !== window.top, () => false)
  return framed ? <Live initial={initial}>{children}</Live> : <Ctx value={initial}>{children}</Ctx>
}

function Live({ initial, children }: { initial: LiveFields; children: ReactNode }) {
  const { data } = useLivePreview<LiveFields>({ initialData: initial, serverURL: window.location.origin, apiRoute: '/cms-api', depth: 1 })
  return <Ctx value={data}>{children}</Ctx>
}

export function LiveTitle() {
  return <>{use(Ctx).title}</>
}

export function LiveExcerpt() {
  return <>{use(Ctx).excerpt}</>
}

/** Server-rendered body until the editor sends live data, so public pages
    never ship the Lexical JSON to the browser. */
export function LiveBody({ locale, children }: { locale: Locale; children: ReactNode }) {
  const { content } = use(Ctx)
  return content ? <RichText data={content} anchors variant="article" locale={locale} /> : children
}
