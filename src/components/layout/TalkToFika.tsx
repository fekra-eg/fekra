'use client'

import Image from 'next/image'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useState } from 'react'

import type { Dictionary } from '@/i18n/getDictionary'
import { localeHref, type Locale } from '@/i18n/routing'
import { useConsent } from '@/lib/useConsent'

/**
 * Figma 1:14136 — the floating "Talk to Fika" bubble. There is no chat backend,
 * so the bubble links to the dedicated Fika page; the close
 * button collapses it to the avatar, which can re-expand it.
 */
export function TalkToFika({ locale, dict, consentRequired = true }: { locale: Locale; dict: Dictionary; consentRequired?: boolean }) {
  const [open, setOpen] = useState(false)
  const consent = useConsent()
  if (consentRequired && !consent) return null

  const avatar = (
    <span className="relative inline-block size-9 shrink-0 sm:size-12">
      <Image
        src="/images/fika-avatar.png"
        alt=""
        width={48}
        height={48}
        className="size-9 rounded-full border-2 border-[#72a6b1] bg-white object-cover sm:size-12"
      />
      <span aria-hidden className="absolute end-0 bottom-0 size-2.5 rounded-full border-2 border-white bg-[#12b76a] sm:size-3" />
    </span>
  )

  const card =
    // Bottom corner on phones — parked mid-viewport it sat on top of the hero
    // CTA. Desktop sits 50px above centre, which is what clears the hero
    // collage instead of crowding the tile directly beneath it.
    'relative ms-auto me-4 my-4 w-fit rounded-2xl border border-border bg-white p-2 shadow-lift sm:fixed sm:end-4 sm:bottom-[max(1rem,env(safe-area-inset-bottom))] sm:z-40 sm:m-0 dark:bg-card'

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={dict.chat.open}
        aria-expanded={false}
        className={`${card} cursor-pointer transition-transform hover:scale-105`}
      >
        {avatar}
      </button>
    )
  }

  return (
    <div className={card}>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label={dict.chat.close}
        className="absolute -end-2 -top-10 grid size-11 cursor-pointer place-items-center rounded-full border border-border bg-card text-foreground shadow-sm"
      >
        <span className="grid size-6 place-items-center rounded-full bg-[#8fd0dd] transition-colors hover:bg-primary">
          <X className="size-3.5" aria-hidden />
        </span>
      </button>
      <Link href={localeHref(locale, '/fika')} className="flex min-h-11 min-w-11 items-center justify-center gap-2.5 sm:gap-[15px]">
        {avatar}
        <span className="pe-1 font-display text-base font-bold text-navy-800 dark:text-foreground">
          {dict.chat.talk}
        </span>
      </Link>
    </div>
  )
}
