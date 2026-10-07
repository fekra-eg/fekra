'use client'

import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { isActivePath } from '@/i18n/routing'
import { cn } from '@/lib/cn'
import type { ResolvedLink } from '@/lib/resolveLink'

/**
 * 5.7 — the current section is marked with aria-current, not only a colour, so
 * it is announced as well as visible.
 */
export function NavLink({ link, hasChildren }: { link: ResolvedLink; hasChildren?: boolean }) {
  const isActive = isActivePath(usePathname() ?? '/', link.activeHref ?? link.href)

  return (
    <Link
      href={link.href}
      prefetch={link.external ? false : true}
      aria-current={isActive ? 'page' : undefined}
      data-analytics-id={link.analyticsId}
      className={cn(
        /*
         * Figma 1:10283: 14px navy with 4px padding and no pill behind it —
         * the item's own weight is the only chrome. h-11 is kept anyway so the
         * pointer target stays a full bar height; it changes nothing visually
         * because the label is centred in it.
         */
        'inline-flex h-11 min-w-11 items-center justify-center gap-1 px-1 text-sm text-navy-800 transition-colors hover:text-primary dark:text-foreground',
        // Preserve light-mode weight; dark mode adds a branded underline and colour.
        isActive ? 'font-bold dark:text-primary dark:underline dark:decoration-2 dark:underline-offset-8' : 'font-normal',
      )}
    >
      {link.label}
      {hasChildren ? <ChevronDown className="size-[13px]" aria-hidden /> : null}
    </Link>
  )
}
