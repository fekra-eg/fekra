import Link from 'next/link'

import type { MediaDoc } from '@/components/blocks/types'
import { type Locale } from '@/i18n/routing'
import { cn } from '@/lib/cn'
import { documentHref } from '@/lib/urls'

import { Cover } from './Cover'

export type PostSummary = {
  id: string | number
  slug: string
  title: string
  excerpt?: string | null
  heroImage?: MediaDoc | null
  publishedAt?: string | null
  featured?: boolean | null
  tags?: string[] | null
  category?: { title?: string; slug?: string } | string | null
}

export const categoryTitle = (post: PostSummary): string =>
  (typeof post.category === 'object' ? post.category?.title : undefined) ?? ''

/** Localised, readable date (Arabic gets Arabic month names + digits). */
export function formatDate(value: string, locale: Locale): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  // ICU punctuation differs between Node and WebKit (Arabic gained a comma
  // in Safari), even with the same timezone. Format date parts explicitly.
  const months: Record<Locale, string[]> = {
    en: 'January February March April May June July August September October November December'.split(' '),
    ar: 'يناير فبراير مارس أبريل مايو يونيو يوليو أغسطس سبتمبر أكتوبر نوفمبر ديسمبر'.split(' '),
    de: 'Januar Februar März April Mai Juni Juli August September Oktober November Dezember'.split(' '),
    fr: 'janvier février mars avril mai juin juillet août septembre octobre novembre décembre'.split(' '),
    es: 'enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split(' '),
  }
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Africa/Cairo', year: 'numeric', month: 'numeric', day: 'numeric', numberingSystem: 'latn' }).formatToParts(date)
  const part = (type: string) => parts.find((item) => item.type === type)!.value
  const day = part('day'), year = part('year'), month = months[locale][Number(part('month')) - 1]
  return locale === 'en' ? `${month} ${day}, ${year}` : locale === 'de' ? `${day}. ${month} ${year}` : locale === 'es' ? `${day} de ${month} de ${year}` : `${day} ${month} ${year}`
}

export function PostCard({
  post,
  locale,
  priority,
  className,
}: {
  post: PostSummary
  locale: Locale
  priority?: boolean
  className?: string
}) {
  const href = documentHref('posts', post.slug, locale)
  const category = categoryTitle(post)

  return (
    <article
      className={cn(
        'group relative flex flex-col rounded-3xl bg-white p-3 shadow-[0_10px_40px_-28px_rgba(15,23,42,0.35)] ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-30px_rgba(15,23,42,0.4)] dark:bg-white/[0.04] dark:ring-white/10',
        className,
      )}
    >
      <div className="block overflow-hidden rounded-2xl shadow-[0_16px_36px_-22px_rgba(15,23,42,0.5)] ring-1 ring-black/[0.04] dark:ring-white/5">
        <Cover
          category={category || 'FEKRA'}
          title={post.title}
          image={post.heroImage}
          priority={priority}
          className="aspect-[16/10] transition-transform duration-500 group-hover:scale-[1.06]"
        />
      </div>

      <div className="flex flex-1 flex-col px-3 pt-5 pb-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          {category ? (
            <span className="rounded-full border border-blog-500/40 px-3 py-1 text-[11px] font-semibold tracking-wide text-blog-600 uppercase dark:text-blog-300">
              {category}
            </span>
          ) : (
            <span />
          )}
          {post.publishedAt ? (
            <time dateTime={post.publishedAt} className="text-sm text-slate-600 dark:text-slate-400">
              {formatDate(post.publishedAt, locale)}
            </time>
          ) : null}
        </div>

        <h3 className="text-lg leading-snug font-bold text-slate-900 transition-colors group-hover:text-blog-600 dark:text-white dark:group-hover:text-blog-300">
          {/* Stretched link: the whole card is the target, but only one link is
              in the tab order and the accessible name stays the title (23.2). */}
          <Link href={href} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>

        {post.excerpt ? (
          <p className="mt-3 line-clamp-3 text-[15px] leading-7 text-slate-500 dark:text-slate-400">{post.excerpt}</p>
        ) : null}
      </div>
    </article>
  )
}
