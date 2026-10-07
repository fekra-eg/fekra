'use client'

import { Check, Globe, LoaderCircle } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'

import { LOCALES, PUBLIC_LOCALES, LOCALE_META, type Locale, localeHref, splitLocale } from '@/i18n/routing'
import { cn } from '@/lib/cn'

/**
 * 14.3 — switching language keeps the user on the equivalent page. Locales
 * without an approved translation for this page are shown disabled rather than
 * hidden, so the user learns the page exists but not in their language (14.9).
 */
export function LanguageSwitcher({
  current,
  available,
  labels,
}: {
  current: Locale
  available?: Locale[]
  labels: { switch: string; unavailable: string }
}) {
  const pathname = usePathname() ?? '/'
  const { rest } = splitLocale(pathname)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [targetLocale, setTargetLocale] = useState(current)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Back/Forward may restore a cached route without a document request. Keep
  // the remembered language aligned with the content actually on screen.
  useEffect(() => {
    document.cookie = `NEXT_LOCALE=${current}; path=/; max-age=31536000; samesite=lax`
  }, [current, pathname])

  // Warm only the language the visitor points to, not four complete pages
  // whenever any page mounts or the menu opens (expensive on cold CMS routes).
  const approved = useMemo(
    () => new Set<Locale>(available?.length ? (available as Locale[]) : [...PUBLIC_LOCALES]),
    [available],
  )
  const enabled = useMemo(
    () => new Set<Locale>([...PUBLIC_LOCALES].filter((l) => approved.has(l))),
    [approved],
  )
  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (LOCALES.length < 2) return null

  /*
   * The menu lists ALL five languages; only the ones we can actually serve are
   * clickable. Two separate gates decide that:
   *
   *   PUBLIC_LOCALES  - the locales the router serves at all
   *   available       - the locales THIS document has an approved translation in
   *
   * Listing every language answers "where is the language menu?" while an
   * unserved locale stays visibly disabled rather than silently handing the
   * visitor translated chrome wrapped around English content (14.9).
   */
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={labels.switch}
        aria-busy={pending}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-11 items-center gap-2 rounded-pill px-3 text-sm font-medium text-foreground transition-colors hover:bg-background-subtle"
      >
        {pending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Globe className="size-4" aria-hidden />}
        <span className="uppercase">{pending ? targetLocale : current}</span>
      </button>
      <span role="status" className="sr-only">{pending ? `${labels.switch}: ${LOCALE_META[targetLocale].label}` : ''}</span>

      {/* Always rendered, toggled with `hidden`: the locale links must be in
          the server HTML for crawlers to find the other languages (FK-64). */}
      <div
        role="menu"
        hidden={!open}
        className="absolute end-0 z-50 mt-2 min-w-44 rounded-card border border-border bg-card p-1 shadow-lift"
      >
        {LOCALES.map((locale) => {
          const isAvailable = enabled.has(locale)
          const label = LOCALE_META[locale].label

          if (!isAvailable) {
            return (
              <span
                key={locale}
                role="menuitem"
                aria-disabled
                title={labels.unavailable}
                className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground/60"
              >
                {label}
              </span>
            )
          }

          return (
            <Link
              key={locale}
              role="menuitem"
              href={localeHref(locale, rest)}
              hrefLang={LOCALE_META[locale].hreflang}
              prefetch={false}
              onPointerEnter={() => { if (locale !== current) router.prefetch(localeHref(locale, rest)) }}
              onFocus={() => { if (locale !== current) router.prefetch(localeHref(locale, rest)) }}
              onNavigate={(event) => {
                event.preventDefault()
                setOpen(false)
                if (locale === current) return
                // Explicit choice must beat the remembered locale, or the "/"
                // redirect in proxy.ts bounces English home back to the old one.
                document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; samesite=lax`
                setTargetLocale(locale)
                startTransition(() => router.push(localeHref(locale, rest) + window.location.search + window.location.hash))
              }}
              className={cn(
                'fk-button fk-button--secondary flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                locale === current && 'font-semibold text-primary',
              )}
            >
              {label}
              {locale === current ? <Check className="size-4" aria-hidden /> : null}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
