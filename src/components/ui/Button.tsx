import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/cn'
import type { ResolvedLink } from '@/lib/resolveLink'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'fk-button inline-flex max-w-full min-w-0 items-center justify-center gap-2 rounded-pill text-center font-semibold whitespace-normal [overflow-wrap:anywhere] transition-colors duration-200 [&_svg]:shrink-0 ' +
  // 16.6 — 44px minimum touch target on every size.
  'min-h-11 disabled:opacity-50 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

const variants: Record<ButtonVariant, string> = {
  primary: 'fk-button--primary bg-primary text-primary-foreground',
  // The comp's outlined pill: navy hairline, transparent fill, navy label.
  secondary:
    'fk-button--secondary border border-navy-800 bg-transparent text-navy-800 dark:border-foreground dark:text-foreground',
  ghost: 'fk-button--secondary text-foreground',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

export const buttonClass = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) =>
  cn(base, variants[variant], sizes[size], className)

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ComponentProps<'button'> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonClass(variant, size, className)} {...props} />
}

/**
 * Renders a resolved CMS link. External links get rel="noopener" and an
 * accessible "opens in a new tab" hint; internal links use next/link so the
 * prefetch/scroll behaviour stays consistent.
 */
export function LinkButton({
  link,
  variant = 'primary',
  size = 'md',
  className,
  withArrow,
  children,
}: {
  link: ResolvedLink
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  withArrow?: boolean
  children?: ReactNode
}) {
  const content = (
    <>
      {children ?? link.label}
      {withArrow ? <ArrowRight className="icon-flip size-4" aria-hidden /> : null}
    </>
  )
  const cls = buttonClass(variant, size, className)

  if (link.external) {
    return (
      <a
        href={link.href}
        className={cls}
        target={link.newTab ? '_blank' : undefined}
        rel={link.newTab ? 'noopener noreferrer' : undefined}
        data-analytics-id={link.analyticsId}
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={link.href} className={cls} data-analytics-id={link.analyticsId}>
      {content}
    </Link>
  )
}
