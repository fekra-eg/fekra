'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import { useSyncExternalStore } from 'react'

const noop = () => () => {}

/**
 * Re-renders the page when the admin saves (autosave included) while it sits
 * in the live-preview iframe. Mounted only inside a frame: the component
 * refreshes on mount, which would double every normal page view.
 */
export function LivePreviewRefresh() {
  const router = useRouter()
  const framed = useSyncExternalStore(noop, () => window.self !== window.top, () => false)
  if (!framed) return null
  return <RefreshRouteOnSave refresh={router.refresh} serverURL={window.location.origin} apiRoute="/cms-api" />
}
