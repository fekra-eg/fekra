'use client'

import { useEffect, useRef, useState } from 'react'

import { BidiText } from '@/components/BidiText'
import { cn } from '@/lib/cn'

/*
 * Comp glyphs (Figma 1:11041). The rows use the standard standing-person
 * pictogram — the file's own export is a mangled mask composite, and this is
 * the same glyph. The outlet figure IS the file's vector, lifted verbatim.
 * Both take currentColor, so they recolor with the theme.
 */
const PERSON_PATH =
  'M12,2A2,2 0 0,1 14,4A2,2 0 0,1 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2M10.5,7H13.5A2,2 0 0,1 15.5,9V14.5H14V22H10V14.5H8.5V9A2,2 0 0,1 10.5,7Z'

const WINNER_PATHS = [
  'M8.72583 3.94396C9.71593 3.94396 10.5186 3.14134 10.5186 2.15125C10.5186 1.16116 9.71593 0.358543 8.72583 0.358543C7.73573 0.358543 6.93309 1.16116 6.93309 2.15125C6.93309 3.14134 7.73573 3.94396 8.72583 3.94396Z',
  'M6.40549 10.9849C6.53545 10.1755 6.59377 9.39305 6.38309 8.85206C6.20381 8.38688 5.81395 8.12649 5.34335 7.949L1.1963 6.60717C0.65848 6.42789 0.156062 6.12761 0.120657 5.53422C0.0758383 4.77233 0.748117 4.27933 1.4204 4.4586C1.4204 4.4586 5.36443 5.85423 8.72573 5.85423C12.0871 5.85423 15.9862 4.46488 15.9862 4.46488C16.793 4.24079 17.3308 4.86824 17.3308 5.53109C17.3308 6.16795 16.8378 6.39204 16.2551 6.60403L12.3112 8.03416C11.9527 8.16861 11.37 8.43752 11.1459 8.84899C10.877 9.33074 10.9218 10.1724 11.0518 10.9819L11.3162 12.3097L12.9929 19.6554C13.1184 20.2448 12.7105 20.7956 12.1233 20.8986C11.5363 21.0017 11.0563 20.6011 10.8823 20.0309L9.19898 14.8352C9.11804 14.5861 9.04631 14.334 8.98389 14.0792L8.72573 13.0268L8.48823 13.9972C8.41292 14.3064 8.32625 14.6124 8.22822 14.9151L6.57443 20.0265C6.39516 20.6024 5.92456 21.0013 5.33752 20.8986C4.75038 20.796 4.33361 20.2 4.4653 19.6554L6.14109 12.3129L6.40549 10.9849Z',
] as const

export type Step = { title: string; body: string }

const DWELL_MS = 3000

/*
 * Funnel geometry from Figma 1:11041, widened 40px per row on request: five
 * centred bars shrinking 328 -> 168 (one person icon fewer each row), a 56px
 * row height on a 72px pitch, then a 128px tip with the "Top 3%" pill hanging
 * off its end. The --fs var scales every measured width down on phones, where
 * the full-size funnel would overflow.
 */
const BARS = [328, 288, 248, 208, 168] as const

/**
 * The hiring process as a candidate funnel (Figma 1:11041): each numbered bar
 * holds one person fewer than the last, narrowing to the "Top 3%" outlet. The
 * card beside it describes the active step.
 *
 * Still an ordered list: every step's title and body stay in the DOM at all
 * times (sr-only), so this reads correctly with no JS, to a screen reader, and
 * to a crawler. The visual card only mirrors the active entry.
 *
 * Auto-advance starts from step 1 only once the funnel scrolls into view — a
 * cycle that begins on page load would already be mid-way when the visitor
 * arrives. Selecting any stage restarts its full dwell, even when it is already
 * selected. Reduced-motion users can select stages without automatic motion.
 */
export function ProcessStepper({ steps, completed, resultLabel }: { steps: Step[]; completed: Step; resultLabel: string }) {
  const [active, setActive] = useState(0)
  const [auto, setAuto] = useState(false)
  const [started, setStarted] = useState(false)
  const [selection, setSelection] = useState(0)
  const selectStep = (index: number) => {
    setActive(index)
    setStarted(true)
    setSelection((value) => value + 1)
  }
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setAuto(!media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  // Arm the cycle at step 1 the first time the funnel is actually seen.
  useEffect(() => {
    const el = root.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setStarted(true)
        observer.disconnect()
      },
      { threshold: 0.35 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  /*
   * The cycle runs one beat PAST the last step: index === steps.length is the
   * result state, where every stage reads as passed and the Top 3% outlet
   * lights up. The reference's process ends inside the final funnel state
   * rather than looping straight from step 5 back to step 1 — without this
   * beat the outcome is never part of the journey.
   */
  useEffect(() => {
    if (!auto || !started || steps.length < 2) return
    const id = setTimeout(() => {
      setActive((i) => (i + 1) % (steps.length + 1))
    }, DWELL_MS)
    return () => clearTimeout(id)
  }, [auto, started, steps.length, active, selection])

  if (!steps.length) return null
  const resultActive = active === steps.length
  const step = resultActive ? completed : steps[active] ?? steps[0]!

  return (
    <div
      ref={root}
      className="flex w-full flex-col items-center justify-center gap-8 lg:flex-row lg:items-center lg:gap-10"
    >
      <ol
        /* ps reserves room for the number gutter that hangs off the bars'
           start edge — without it the active ribbon clips at the viewport. */
        /* PF-3 — was gap-4. At 16px the five bars read as separate blocks
           stacked up; at 4px they read as one narrowing funnel, which is the
           whole point of the graphic. */
        className="flex w-full max-w-[544px] flex-col gap-1 ps-10 [--fs:0.58] min-[400px]:[--fs:0.72] sm:ps-0 sm:[--fs:1]"
      >
        {steps.map((s, i) => {
          const on = i === active
          const width = BARS[i] ?? BARS[BARS.length - 1]!
          return (
            <li key={s.title} className="flex h-11 justify-center sm:h-14">
              <div className="relative h-full" style={{ width: `calc(var(--fs) * ${width}px)` }}>
                {/*
                 * Step number in the 96px zone butted against the bar. The
                 * active one sits on a teal ribbon whose start end is a notched
                 * banner tail; the clip-path is physical-left, so the shape
                 * span mirrors under RTL while the digit on top does not.
                 */}
                <button
                  data-process-control type="button"
                  onClick={() => selectStep(i)}
                  // Pointer target only: the title button beside it is the same
                  // control, so this one stays out of AT and the tab order (FK-66).
                  aria-hidden
                  tabIndex={-1}
                  data-process-number={i}
                  className={cn(
                    'absolute end-full flex h-full w-12 items-center justify-center text-xl font-bold transition-colors duration-200 sm:w-24 sm:text-2xl',
                    on ? 'text-primary-foreground' : 'text-primary',
                  )}
                >
                  {on ? (
                    /* Active-step marker butted into the bar's slanted edge
                       (reference): step 1 is a banner flag with a notched
                       tail; the rest are parallelograms at the funnel's
                       angle. Asymmetric shapes, hence the RTL mirror. */
                    <span
                      className={cn(
                        'absolute inset-y-0 start-0 bg-primary rtl:-scale-x-100',
                        i === 0
                          ? '[clip-path:polygon(0_0,calc(100%_-_var(--fs)*18.5px)_0,100%_100%,0_100%,calc(var(--fs)*12px)_50%)]'
                          : '[clip-path:polygon(0_0,calc(100%_-_var(--fs)*18.5px)_0,100%_100%,calc(var(--fs)*18.5px)_100%)]',
                      )}
                      style={{ insetInlineEnd: 'calc(var(--fs) * -18.5px)' }}
                    />
                  ) : null}
                  <span className="relative">{i + 1}</span>
                </button>

                <button
                  data-process-control type="button"
                  onClick={() => selectStep(i)}
                  aria-current={on ? 'step' : undefined}
                  /* Icon size and gap ride --fs with the bar widths, so the row
                     can never outgrow its bar at any scale. */
                  className="group relative flex size-full items-center justify-center gap-[calc(var(--fs)*16px)] text-ink-500 dark:text-muted-foreground"
                >
                  {/*
                   * The shape lives on this span, not the button, so the focus
                   * ring is not clipped. A plain symmetric trapezoid, per the
                   * reference funnel: rows shrink 40px on a 60px pitch, so an
                   * 18.5px per-side inset continues the SAME slope through the
                   * 4px gaps — five stages read as one funnel, not stacked
                   * blocks. Symmetric, so no RTL mirror is needed.
                   */}
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-border transition-colors duration-200 group-hover:bg-canvas-2 [clip-path:polygon(0_0,100%_0,calc(100%_-_var(--fs)*18.5px)_100%,calc(var(--fs)*18.5px)_100%)] dark:bg-card dark:group-hover:bg-border"
                  />
                  <span className="sr-only">
                    {i + 1} — {s.title}
                  </span>
                  {/* One person fewer each row — the funnel narrows. */}
                  {Array.from({ length: BARS.length + 1 - i }, (_, k) => (
                    <svg key={k} viewBox="0 0 24 24" fill="currentColor" aria-hidden className="relative size-[calc(var(--fs)*24px)] shrink-0">
                      <path d={PERSON_PATH} />
                    </svg>
                  ))}
                </button>
              </div>
              <p className="sr-only">{s.body}</p>
            </li>
          )
        })}

        {/*
         * PF-4, reference-exact pass: the funnel ends in a GREY tip that
         * continues the taper (top 128 = row 5's bottom edge), and the result
         * is an arrow-tipped brand ribbon overlapping the tip and running out
         * past the funnel's edge — the reference's "Top 1%" treatment. The
         * ribbon's left edge slants at the funnel's angle; asymmetric shape,
         * so it mirrors under RTL while its content does not.
         */}
        <li className="flex h-11 justify-center sm:h-16">
          <button data-process-control type="button" onClick={() => selectStep(steps.length)} aria-label={`${completed.title} ${completed.body}`} aria-pressed={resultActive} className="relative h-full" style={{ width: 'calc(var(--fs) * 128px)' }}>
            <span
              className={cn(
                'absolute inset-0 bg-border transition-opacity duration-500 [clip-path:polygon(0_0,100%_0,calc(100%_-_var(--fs)*21px)_100%,calc(var(--fs)*21px)_100%)] dark:bg-card',
                resultActive && 'opacity-0',
              )}
            />
            {/* Reference geometry: same height as the tip, and at rest the
                ribbon STARTS where the tip ends — its slanted edge sits 4px
                past the tip's own right edge, giving the thin parallel seam.
                On the result beat it slides back to the tip's start and the
                tip fades: the ribbon replaces the last grey shape. */}
            <div
              className={cn(
                'absolute inset-y-0 transition-transform duration-500',
                resultActive && '-translate-x-[53%] rtl:translate-x-[53%]',
              )}
              style={{
                insetInlineStart: 'calc(100% - var(--fs) * 22px)',
                width: 'calc(var(--fs) * 200px)',
              }}
            >
              <span
                /* Resting: left edge "/" continues the tip's right side, and
                   the box overlaps the tip 1px so no background peeks through.
                   Active: the edge morphs to "\" — the funnel's LEFT slant —
                   because the ribbon now stands where the tip stood. Same
                   vertex count, so the clip animates with the slide. */
                className={cn(
                  'absolute inset-0 bg-primary transition-[clip-path,box-shadow] duration-500 rtl:-scale-x-100',
                  resultActive
                    ? '[clip-path:polygon(0_0,calc(100%_-_var(--fs)*26px)_0,100%_50%,calc(100%_-_var(--fs)*26px)_100%,calc(var(--fs)*21px)_100%)] shadow-[0_12px_32px_-8px_rgba(32,162,188,0.55)]'
                    : '[clip-path:polygon(calc(var(--fs)*21px)_0,calc(100%_-_var(--fs)*26px)_0,100%_50%,calc(100%_-_var(--fs)*26px)_100%,0_100%)]',
                )}
              />
              <span className="relative flex h-full items-center justify-center gap-1.5 pe-[calc(var(--fs)*14px)] text-primary-foreground">
                <svg
                  viewBox="0 0 17.45 21.04"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  strokeLinejoin="round"
                  aria-hidden
                  className="h-5 w-auto shrink-0 sm:h-6"
                >
                  {WINNER_PATHS.map((d) => (
                    <path key={d.slice(0, 16)} d={d} />
                  ))}
                </svg>
                <span className="text-sm font-bold whitespace-nowrap sm:text-base"><BidiText>{resultLabel}</BidiText></span>
              </span>
            </div>
          </button>
        </li>
      </ol>

      {/* Active step detail — a duplicate of list content, so hidden from AT.
          Text only: no card chrome. */}
      {/* Card scale matched to the funnel's own type: a 32px title against
          the bars' 14px labels is what made the right side feel like a second
          hero. min-h stays so the card cannot change height between steps and
          rock the funnel beside it. */}
      <div aria-hidden className="w-full max-w-[420px] self-center p-6 sm:min-h-[220px] lg:p-8">
        <div key={active} className="fk-enter [animation-duration:0.35s]">
          {/* <p>, not a heading: a duplicate heading still reads to crawlers. */}
          <p className="font-display text-2xl leading-tight font-bold text-navy-800 dark:text-foreground">
            {step.title}
          </p>
          <p className="mt-3 text-base/7 text-ink-500 dark:text-muted-foreground">{step.body}</p>
        </div>
      </div>
    </div>
  )
}
