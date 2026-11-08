'use client'

import { useRef } from 'react'

/**
 * Nav item whose dropdown/mega panel is pure CSS hover/focus (see Header).
 * Clicking a link inside must close the panel even though the pointer still
 * hovers it and the link keeps focus — `nav-closed` (globals.css) hides the
 * panel until the pointer leaves or focus re-enters, which re-arms it.
 */
export function NavItem({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLLIElement>(null)
  return (
    <li
      ref={ref}
      className="group relative"
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return
        ref.current?.querySelector<HTMLElement>('a, button')?.focus()
        ref.current?.classList.add('nav-closed')
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('[data-nav-close]')) {
          ref.current?.querySelector<HTMLElement>('a, button')?.focus()
          ref.current?.classList.add('nav-closed')
          return
        }
        if (!(e.target as HTMLElement).closest('a')) return
        ref.current?.classList.add('nav-closed')
        ;(document.activeElement as HTMLElement | null)?.blur()
      }}
      onMouseLeave={() => ref.current?.classList.remove('nav-closed')}
      onFocusCapture={() => ref.current?.classList.remove('nav-closed')}
    >
      {children}
    </li>
  )
}
