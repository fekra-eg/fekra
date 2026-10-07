'use client'

import { useEffect, useState } from 'react'

import { bidiIsolate } from '@/components/BidiText'
import { cn } from '@/lib/cn'

// Visual layers draw their text from `data-text` via ::before, so it stays out
// of the DOM: crawlers read hidden spans too, and the H1 used to index as every
// phrase concatenated. The sr-only span is the heading's only real text.
const CELL = 'col-start-1 row-start-1 -my-[0.16em] py-[0.16em] before:content-[attr(data-text)]'
const CARET = 'ms-[0.08em] inline-block h-[0.8em] w-[0.055em] min-w-[2px] translate-y-[0.05em] rounded-[2px]'

/**
 * Cycles the last phrase of the hero headline as a typewriter: the word holds,
 * backspaces character by character, then the next one types in behind a
 * blinking caret. Same cadence as Juthoor's hero.
 *
 * The first word is server-rendered in full inside the heading, so the H1 is
 * complete text for crawlers and for anyone with JS off (19.2). Screen readers
 * get one stable complete phrase, never duplicate layers or half-typed words.
 *
 * Honours prefers-reduced-motion by not rotating at all: a word changing under
 * you every few seconds is exactly the kind of motion that setting exists for
 * (17.8 / 23.5).
 */
export function RotatingWords({ words, intervalMs = 5000 }: { words: string[]; intervalMs?: number }) {
  const [index, setIndex] = useState(0)
  const [count, setCount] = useState(() => Array.from(words[0] ?? '').length)
  const [phase, setPhase] = useState<'hold' | 'deleting' | 'typing'>('hold')
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (words.length < 2) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setEnabled(!media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [words.length])

  const current = words[enabled ? index : 0] ?? ''
  const chars = Array.from(current)

  useEffect(() => {
    if (!enabled) return
    let timer: number
    if (phase === 'hold') {
      // Keep the whole type-hold-delete cycle close to intervalMs per word.
      timer = window.setTimeout(() => setPhase('deleting'), Math.max(1500, intervalMs - chars.length * 130 - 600))
    } else if (phase === 'deleting') {
      timer =
        count > 0
          ? window.setTimeout(() => setCount((c) => c - 1), 42)
          : window.setTimeout(() => {
              setIndex((i) => (i + 1) % words.length)
              setPhase('typing')
            }, 280)
    } else {
      timer =
        count < chars.length
          ? window.setTimeout(() => setCount((c) => c + 1), 82)
          : window.setTimeout(() => setPhase('hold'), 140)
    }
    return () => window.clearTimeout(timer)
  }, [enabled, phase, count, chars.length, intervalMs, words.length])

  const shown = enabled ? chars.slice(0, count).join('') : current

  return (
    <span className="relative inline-grid max-w-full align-top text-center leading-[1.15] text-primary">
      <span className="sr-only">{words[0]}</span>
      {/* Measure every phrase in the same grid cell: character count does not
          predict rendered width, and mobile phrases can wrap to two lines. */}
      {words.map((word, i) => (
        <span key={i} aria-hidden data-text={bidiIsolate(word)} className={cn(CELL, 'invisible')} />
      ))}
      {/* Nothing inside a `background-clip: text` span may animate — Chrome
          leaves stale paint slivers — so the gradient word only holds an
          invisible caret-sized spacer... */}
      <span
        aria-hidden
        data-text={bidiIsolate(shown)}
        className={cn(CELL, 'bg-[linear-gradient(137.53deg,#12cbb4_0%,#375bc7_100%)] bg-clip-text text-transparent')}
      >
        {enabled ? <span className={cn(CARET, 'invisible')} /> : null}
      </span>
      {/* ...and the blinking caret rides a transparent copy of the same text
          on top, so both layers centre and wrap identically. */}
      {enabled ? (
        <span aria-hidden data-text={bidiIsolate(shown)} className={cn(CELL, 'text-transparent')}>
          <span className={cn(CARET, 'fk-caret bg-[linear-gradient(180deg,#12cbb4,#375bc7)]')} />
        </span>
      ) : null}
    </span>
  )
}
