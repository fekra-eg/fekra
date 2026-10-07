'use client'

import { Check, Link2 } from 'lucide-react'
import { useState } from 'react'

const BUTTON =
  'fk-button fk-button--secondary flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors dark:border-white/10 dark:bg-white/5 dark:text-slate-300'

/**
 * Brand marks are inline paths: lucide dropped its brand icon set, and pulling
 * a second icon package for two glyphs is not worth the bytes (17.7).
 */
function BrandIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d={d} />
    </svg>
  )
}

const X_PATH =
  'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'
const LINKEDIN_PATH =
  'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14M7.12 20.45H3.56V9h3.56zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0'

export function ShareButtons({ url, title, label }: { url: string; title: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const encoded = { url: encodeURIComponent(url), title: encodeURIComponent(title.trim()) }
  const links = [
    {
      name: 'X',
      href: `https://twitter.com/intent/tweet?text=${encoded.title}&url=${encoded.url}`,
      icon: <BrandIcon d={X_PATH} />,
    },
    {
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded.url}`,
      icon: <BrandIcon d={LINKEDIN_PATH} />,
    },
  ]

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard blocked (insecure context or denied permission) — the share
      // links still work, so there is nothing useful to tell the user.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="me-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</span>

      {links.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.name}
          className={BUTTON}
        >
          {link.icon}
        </a>
      ))}

      <button type="button" onClick={copy} aria-label={label} aria-live="polite" className={BUTTON}>
        {copied ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
      </button>
    </div>
  )
}
