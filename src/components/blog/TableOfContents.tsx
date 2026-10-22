'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/lib/cn'

import type { Heading } from './lexical'

/** Highlights the heading currently in view and links to each anchor. */
export function TableOfContents({ headings, title }: { headings: Heading[]; title: string }) {
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    if (!headings.length) return
    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((el): el is HTMLElement => el !== null)
    if (!elements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      // Top offset clears the sticky header; the bottom margin means a heading
      // stays "active" until the next one reaches the upper third.
      { rootMargin: '-96px 0px -70% 0px', threshold: [0, 1] },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [headings])

  if (!headings.length) return null

  return (
    <nav aria-label={title} className="text-[0.95rem]">
      <p className="mb-4 flex items-center gap-2.5 text-lg font-bold text-slate-900 dark:text-white">
        <span className="inline-block h-5 w-1.5 rounded-full bg-blog-500" aria-hidden />
        {title}
      </p>

      <ul className="relative">
        <span
          aria-hidden
          className="absolute inset-y-1.5 start-[4.5px] z-0 w-0.5 rounded-full bg-slate-200 dark:bg-white/10"
        />
        {headings.map((heading) => {
          const isActive = activeId === heading.id
          return (
            <li key={heading.id} className="relative z-10">
              <a
                href={`#${heading.id}`}
                aria-current={isActive ? 'location' : undefined}
                className={cn(
                  'flex min-h-11 gap-3 py-2 leading-relaxed transition-colors',
                  heading.depth === 3 && 'ps-6',
                  isActive
                    ? 'font-semibold text-blog-600 dark:text-blog-300'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'mt-[0.45em] shrink-0 rounded-full transition-all',
                    heading.depth === 3
                      ? cn('h-1.5 w-1.5', isActive ? 'bg-blog-500' : 'bg-slate-300 dark:bg-white/25')
                      : cn('h-2.5 w-2.5', isActive ? 'bg-blog-500 ring-4 ring-blog-500/15' : 'bg-blog-500/45'),
                  )}
                />
                <span>{heading.text}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
