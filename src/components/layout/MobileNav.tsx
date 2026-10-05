'use client'

import { ChevronRight, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { BrandLogo } from '@/components/layout/BrandLogo'
import { LinkButton } from '@/components/ui/Button'
import type { Dictionary } from '@/i18n/getDictionary'
import { isActivePath, localeHref, splitLocale } from '@/i18n/routing'
import { cn } from '@/lib/cn'
import type { ResolvedLink } from '@/lib/resolveLink'

type Item = { link: ResolvedLink | null; children: { link: ResolvedLink | null; description?: string }[] }

/**
 * 5.4 — open/close, nested items, focus containment, scroll lock and Escape.
 * Rendered as a <dialog> so focus trapping and inertness come from the platform
 * instead of a hand-rolled keydown loop.
 */
export function MobileNav({
  items,
  ctas,
  dict,
}: {
  items: Item[]
  ctas: { variant?: 'primary' | 'secondary' | 'ghost'; link: ResolvedLink | null }[]
  dict: Dictionary
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  const pathname = usePathname() ?? '/'

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const isActive = (href: string) => isActivePath(pathname, href)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={dict.nav.openMenu}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="grid size-11 place-items-center rounded-pill text-foreground hover:bg-background-subtle xl:hidden"
      >
        <Menu className="size-6" aria-hidden />
      </button>

      <dialog
        id="mobile-menu"
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        aria-label={dict.nav.main}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-background p-0 text-foreground backdrop:bg-[var(--overlay)] xl:hidden"
      >
        {open ? (
          <div className="flex h-full flex-col">
            <div className="flex h-20 shrink-0 items-center justify-between border-b border-border px-5">
              <Link href={localeHref(splitLocale(pathname).locale, '/')} aria-label="FEKRA" onClick={() => setOpen(false)}><BrandLogo /></Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={dict.nav.closeMenu}
                className="grid size-11 place-items-center rounded-pill border border-border hover:bg-background-subtle"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            {/* Any link closes the menu — otherwise it stays open over the new page. */}
            <nav className="flex-1 overflow-y-auto px-5 py-4" onClick={() => setOpen(false)}>
              <ul className="flex flex-col">
                {items.map((item, index) =>
                  item.link ? (
                    <li
                      key={item.link.href}
                      style={{ '--i': index } as React.CSSProperties}
                      className="fk-enter border-b border-border last:border-0"
                    >
                      <Link
                        href={item.link.href}
                        prefetch={item.link.external ? false : true}
                        aria-current={isActive(item.link.activeHref ?? item.link.href) ? 'page' : undefined}
                        className={cn(
                          'flex items-center justify-between gap-4 py-4 font-display text-lg font-bold',
                          isActive(item.link.activeHref ?? item.link.href) ? 'text-primary' : 'text-navy-800 dark:text-foreground',
                        )}
                      >
                        {item.link.label}
                        <ChevronRight
                          className={cn('icon-flip size-4', isActive(item.link.activeHref ?? item.link.href) ? 'text-primary' : 'text-muted-foreground')}
                          aria-hidden
                        />
                      </Link>

                      {item.children.length ? (
                        <ul className="mb-4 flex flex-col gap-0.5 rounded-card bg-background-subtle p-2">
                          {item.children.map((child) =>
                            child.link ? (
                              <li key={child.link.href}>
                                <Link
                                  href={child.link.href}
                                  aria-current={isActive(child.link.href) ? 'page' : undefined}
                                  className={cn(
                                    'flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-[15px] transition-colors',
                                    isActive(child.link.href)
                                      ? 'bg-card font-medium text-primary'
                                      : 'text-ink-500 hover:bg-card dark:text-muted-foreground',
                                  )}
                                >
                                  {child.link.label}
                                  <ChevronRight className="icon-flip size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
                                </Link>
                              </li>
                            ) : null,
                          )}
                          {(item.link.activeHref ?? item.link.href) === localeHref(splitLocale(pathname).locale, '/services') ? (
                            <li><LinkButton link={{ href: localeHref(splitLocale(pathname).locale, '/contact'), label: dict.nav.hireNow, external: false, newTab: false }} className="mt-3 w-full" /></li>
                          ) : null}
                        </ul>
                      ) : null}
                    </li>
                  ) : null,
                )}
              </ul>
            </nav>

            {ctas.length ? (
              <div
                className="shrink-0 border-t border-border p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
                onClick={() => setOpen(false)}
              >
                <div className="flex flex-col gap-3">
                  {ctas.map((cta) =>
                    cta.link ? (
                      <LinkButton
                        key={cta.link.href}
                        link={cta.link}
                        variant={cta.variant}
                        size="lg"
                        className="w-full"
                      />
                    ) : null,
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </>
  )
}
