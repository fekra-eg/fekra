'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * The header is a floating pill at rest and spans the full width once the page
 * scrolls, per the approved design.
 *
 * Scroll state is written to a data attribute and styled in CSS rather than
 * held in React state. Two reasons, and the first one is not theoretical:
 * `useSyncExternalStore` reads the snapshot during render and React reads it
 * twice to check consistency — mid-scroll those reads disagree, and the retry
 * loop throws inside the layout, which escapes every error boundary and takes
 * the whole page down. Second, this way a scroll never re-renders the tree at
 * all, so it costs nothing on the main thread (17.8).
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const shell = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const el = shell.current
      if (!el) return
      // Hysteresis. A single threshold flaps: momentum and rubber-band
      // scrolling jitter back and forth across it, and with a 600ms morph
      // every flap is a visible resize. Collapsing and expanding at different
      // points gives the state somewhere to settle.
      const isScrolled = el.dataset.scrolled === 'true'
      const next = window.scrollY > (isScrolled ? 4 : 24)
      if (next !== isScrolled) el.dataset.scrolled = String(next)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div
      ref={shell}
      data-scrolled="false"
      // The height is pinned to --header-block and never animates. It used to
      // shrink along with the bar, and because this element sits in flow that
      // removed pixels from the document on every frame of the morph, which
      // moved the scroll position, which re-tested the threshold, which
      // re-triggered the morph. That loop is the random resizing. The bar
      // inside is free to shrink now that it no longer carries the layout.
      //
      // The strip a shrunken bar leaves behind would swallow clicks meant for
      // the page, hence pointer events off here and back on for the bar.
      className="group/header pointer-events-none sticky top-0 z-50 h-[var(--header-block)] px-3 pt-4 transition-[padding] duration-[600ms] ease-[var(--ease-morph)] motion-reduce:transition-none data-[scrolled=true]:px-0 data-[scrolled=true]:pt-0 sm:px-5 sm:pt-6 sm:data-[scrolled=true]:px-0 sm:data-[scrolled=true]:pt-0"
    >
      <div
        className={[
          // The comp floats the pill on a narrow margin rather than centring a
          // narrower bar: roughly 40px of air each side, still capped so it
          // stops growing on very wide monitors.
          'pointer-events-auto mx-auto flex h-16 max-w-[calc(100vw-16px)] items-center justify-between gap-2 rounded-[40px] sm:max-w-[min(1400px,92vw)] sm:gap-6',
          'border border-transparent bg-white/50 px-3 shadow-[0_1px_4px_0_rgba(25,33,61,0.06)] backdrop-blur-md sm:px-6 dark:bg-card/70',
          'transition-[max-width,border-radius,background-color,box-shadow,height,padding] duration-[600ms] ease-[var(--ease-morph)] motion-reduce:transition-none',
          // Scrolled: edge to edge, squared off, sitting on a hairline.
          //
          // `max-w-full` (100%), never `max-w-none`. `none` is a keyword, not a
          // length, so the browser cannot interpolate 1200px → none and snaps
          // the width in one frame however long the duration says. Against 100%
          // it tweens as a length-percentage and the pill actually grows.
          'group-data-[scrolled=true]/header:h-16 group-data-[scrolled=true]/header:max-w-full',
          'group-data-[scrolled=true]/header:rounded-none group-data-[scrolled=true]/header:border-b-border',
          'group-data-[scrolled=true]/header:bg-background/85 group-data-[scrolled=true]/header:shadow-none',
          'group-data-[scrolled=true]/header:lg:px-12',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  )
}
