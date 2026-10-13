import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

/**
 * Shared blog cover band — the brand-blue tinted hero used by BOTH the blog
 * index and every article page, so the cover treatment lives in one place.
 *
 * The header is sticky with a pinned height (--header-block), so the band is
 * pulled up under it — same as the careers and services heroes — instead of
 * leaving a white strip between the header and the tint.
 */
export function HeroBand({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        'relative mt-[calc(var(--header-block)*-1)] pt-[var(--header-block)] bg-gradient-to-b from-blog-band-from via-blog-band-via to-blog-surface',
        'dark:from-blog-ink dark:via-blog-ink dark:to-blog-ink',
        className,
      )}
    >
      {/* decor clipped to the band; the section itself does NOT clip, so the
          topic dropdown can overflow below it instead of being cut off */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 end-1/4 h-80 w-80 rounded-full bg-blog-500/20 blur-3xl dark:bg-blog-500/5" />
        <div className="absolute -bottom-32 start-[-5rem] h-80 w-80 rounded-full bg-blog-300/15 blur-3xl dark:bg-blog-500/5" />
      </div>
      <div className="relative z-10">{children}</div>
    </section>
  )
}
