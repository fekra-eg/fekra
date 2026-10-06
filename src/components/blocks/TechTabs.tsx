'use client'

import Image from 'next/image'

import { logoMarkSize } from '@/lib/logo-size'
import { useId, useRef, useState } from 'react'

import { cn } from '@/lib/cn'

export type TechGroup = {
  name: string
  items: { name: string; src?: string | null; width?: number | null; height?: number | null }[]
}

/**
 * The tabbed technology grid (Figma 3:1656).
 *
 * A real tablist rather than a set of buttons: arrow keys move between tabs and
 * only the selected one is in the tab order, which is what screen readers and
 * keyboard users expect from this pattern (23.1 / 23.3). Panels are rendered
 * for the selected group only — nine hidden grids of logos would cost every
 * visitor the download for content most never open.
 */
export function TechTabs({ groups }: { groups: TechGroup[] }) {
  const [active, setActive] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const id = useId()

  if (!groups.length) return null

  const move = (event: React.KeyboardEvent, index: number) => {
    const last = groups.length - 1
    const next =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null
    if (next === null) return
    event.preventDefault()
    setActive(next)
    tabs.current[next]?.focus()
  }

  // `active` is only ever set from an index into `groups`, but the compiler
  // cannot know that; falling back to the first keeps it total.
  const group = groups[active] ?? groups[0]!

  return (
    <div className="mt-12">
      {/* The bar scrolls rather than wraps: nine labels do not fit a phone, and
          a wrapped tab row stops reading as one control. */}
      <div className="overflow-x-auto rounded-t-2xl bg-tab-bar px-6 pt-6 pb-4 dark:bg-background-subtle">
        <div role="tablist" aria-label="Technology areas" className="flex min-w-max gap-8 lg:min-w-0 lg:justify-between">
          {groups.map((g, i) => (
            <button
              key={g.name}
              ref={(el) => {
                tabs.current[i] = el
              }}
              role="tab"
              type="button"
              id={`${id}-tab-${i}`}
              aria-selected={i === active}
              aria-controls={`${id}-panel-${i}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => move(e, i)}
              className={cn(
                'min-h-11 shrink-0 border-b-2 px-1 pb-4 text-sm font-semibold whitespace-nowrap transition-colors',
                i === active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-ink-500 hover:text-foreground dark:text-muted-foreground',
              )}
            >
              {g.name}
            </button>
          ))}
        </div>
        <div aria-hidden className="mt-0 h-px w-full bg-card" />
      </div>

      <div
        role="tabpanel"
        id={`${id}-panel-${active}`}
        aria-labelledby={`${id}-tab-${active}`}
        tabIndex={0}
        className="rounded-b-3xl bg-tab-panel px-3 py-8 sm:px-5 sm:py-14 dark:bg-card"
      >
        {group.items.length ? (
          <ul className="grid grid-cols-3 gap-x-3 gap-y-6 sm:gap-x-10 sm:gap-y-10 lg:grid-cols-4">
            {group.items.map((item) => (
              <li key={item.name} className="flex min-w-0 flex-col items-center gap-2 text-center sm:gap-4">
                {/*
                 * TS-3 — a fixed square cell with every mark sized to equal AREA
                 * (see lib/logo-size).
                 *
                 * `max-h-[88px] w-auto` sized each logo by its own height, so a
                 * square icon filled 88x88 while a wide wordmark rendered 88
                 * wide and barely 30 tall — an 8x spread in ink. Equal-area
                 * sizing in a fixed square brings that to ~1x.
                 *
                 * White tile per TS-4 (client's consolidated feedback — it
                 * supersedes the earlier request to drop them): same treatment
                 * as the client-logo board, a soft ring instead of a shadow so
                 * the tiles sit in the panel rather than float over it, and
                 * a softer light ground in dark mode to reduce glare.
                 *
                 * No logo yet? Render the name in the same square with a soft
                 * outline, so the cell is not simply empty.
                 */}
                {item.src ? (
                  <span className="fk-art-surface flex size-[84px] sm:size-[104px] items-center justify-center rounded-2xl bg-white p-3 ring-1 ring-navy-800/10 dark:ring-white/15">
                    <span
                      className="relative block"
                      style={logoMarkSize(item.width, item.height, 1) ?? { width: '100%', height: '100%' }}
                    >
                      <Image src={item.src} alt="" fill sizes="104px" aria-hidden className="fk-art-image object-contain" />
                    </span>
                  </span>
                ) : (
                  <span className="fk-art-surface flex size-[84px] sm:size-[104px] items-center justify-center rounded-2xl bg-white px-3 text-center text-sm font-semibold text-navy-800 ring-1 ring-navy-800/10 dark:text-navy-800 dark:ring-white/15">
                    {item.name}
                  </span>
                )}
                {item.src ? (
                  <span className="text-sm/5 [overflow-wrap:anywhere] text-ink-700 sm:text-lg/7 dark:text-muted-foreground">{item.name}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-ink-500 dark:text-muted-foreground">
            Nothing listed for {group.name} yet.
          </p>
        )}
      </div>
    </div>
  )
}
