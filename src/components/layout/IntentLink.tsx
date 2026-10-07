'use client'

import Link from 'next/link'
import { useState, type ComponentProps } from 'react'

/** Fetch a service when it is targeted, without fetching the entire mega menu. */
export function IntentLink({ onMouseEnter, onFocus, onTouchStart, ...props }: ComponentProps<typeof Link>) {
  const [ready, setReady] = useState(false)
  return <Link {...props} prefetch={ready}
    onMouseEnter={(event) => { setReady(true); onMouseEnter?.(event) }}
    onFocus={(event) => { setReady(true); onFocus?.(event) }}
    onTouchStart={(event) => { setReady(true); onTouchStart?.(event) }} />
}
