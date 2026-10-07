'use client'

import { useDeferredValue, useMemo, useState } from 'react'

import { t } from '@/i18n/format'
import type { Dictionary } from '@/i18n/getDictionary'
import type { Locale } from '@/i18n/routing'

import { HeroBand } from './HeroBand'
import { PostCard, categoryTitle, type PostSummary } from './PostCard'
import { TopicPills } from './TopicPills'

/** A post belongs to a topic if its category or any tag matches (case-insensitive). */
function matchesTopic(post: PostSummary, topic: string): boolean {
  const needle = topic.toLowerCase()
  return (
    categoryTitle(post).toLowerCase() === needle ||
    (post.tags ?? []).some((tag) => tag.toLowerCase() === needle)
  )
}

/**
 * Blog index: cover band with live search and topic filtering, then the grid.
 *
 * Filtering runs on the client over the already-rendered list rather than
 * round-tripping to the server — the full list is server-rendered first, so
 * crawlers and no-JS visitors still get every post (19.2).
 */
export function BlogIndex({
  posts,
  locale,
  dict,
  topics,
}: {
  posts: PostSummary[]
  locale: Locale
  dict: Dictionary
  topics: string[]
}) {
  const [active, setActive] = useState('all')
  const [query, setQuery] = useState('')
  const articleWord = locale === 'ar'
    ? (posts.length === 2 ? 'مقالتين' : posts.length % 100 >= 3 && posts.length % 100 <= 10 ? 'مقالات' : 'مقالة')
    : posts.length === 1 ? ({ en: 'article', de: 'Artikel', fr: 'article', es: 'artículo' }[locale]) : dict.blog.heroWord
  // Keeps typing responsive when the list is long.
  const deferredQuery = useDeferredValue(query)

  const grid = useMemo(() => {
    const base = active === 'all' ? posts : posts.filter((post) => matchesTopic(post, active))
    const needle = deferredQuery.trim().toLowerCase()
    if (!needle) return base
    return base.filter((post) =>
      [post.title, post.excerpt ?? '', categoryTitle(post), ...(post.tags ?? [])]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [active, deferredQuery, posts])

  return (
    <>
      {/* ── Cover band (shared, brand-blue) ── */}
      <HeroBand>
        <div className="container-wide py-14 sm:py-20">
          <div className="grid items-start gap-8 lg:grid-cols-[1.5fr_minmax(0,1fr)]">
            {/* The counter is display copy; the heading crawlers and screen
                readers get describes the blog (FK-30). */}
            <h1 className="sr-only">{dict.blog.subtitle}</h1>
            <p className="text-[clamp(2rem,4vw,3.25rem)] leading-[1.12] font-extrabold tracking-tight text-slate-900 dark:text-white">
              {dict.blog.heroPre} <span className="text-blog-500">{new Intl.NumberFormat(locale).format(posts.length)}</span>
              <br />
              <span className="text-blog-500">{articleWord}</span> {dict.blog.heroPost}
            </p>

            <div className="relative w-full max-w-md lg:justify-self-end">
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                <path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={dict.blog.searchPlaceholder}
                aria-label={dict.blog.searchPlaceholder}
                className="w-full rounded-full border border-slate-200 bg-white py-3 ps-11 pe-4 text-base text-slate-700 shadow-sm transition-colors outline-none placeholder:text-slate-400 focus:border-blog-500 focus:ring-2 focus:ring-blog-500/20 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
              />
            </div>
          </div>

          {topics.length ? (
            <div className="mt-9">
              <TopicPills
                topics={topics}
                allLabel={dict.blog.allCategories}
                moreLabel={dict.blog.more}
                active={active}
                onSelect={setActive}
              />
            </div>
          ) : null}
        </div>
      </HeroBand>

      {/* ── Posts ── */}
      <section className="bg-blog-surface py-14 dark:bg-blog-ink">
        <div className="container-wide">
          {/* Announced so filtering is perceivable without sight (23.4). */}
          <p className="sr-only" role="status" aria-live="polite">
            {t(dict.blog.resultCount, { count: grid.length })}
          </p>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map((post, index) => (
              <PostCard key={post.id} post={post} locale={locale} priority={index < 3} />
            ))}
          </div>

          {grid.length === 0 ? (
            <p className="mt-16 text-center text-slate-500 dark:text-slate-400">{dict.blog.empty}</p>
          ) : null}
        </div>
      </section>
    </>
  )
}
