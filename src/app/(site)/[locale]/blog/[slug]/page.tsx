import { Clock, Eye } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { Cover } from '@/components/blog/Cover'
import { HeroBand } from '@/components/blog/HeroBand'
import { HtmlArticle } from '@/components/blog/HtmlArticle'
import { blogHtmlDocument, htmlReadingMinutes } from '@/lib/blog-html'
import { extractHeadings, readingMinutes } from '@/components/blog/lexical'
import { NewsletterPanel } from '@/components/blog/NewsletterPanel'
import { PostCard, categoryTitle, formatDate, type PostSummary } from '@/components/blog/PostCard'
import { ReadingProgress } from '@/components/blog/ReadingProgress'
import { ShareButtons } from '@/components/blog/ShareButtons'
import { TableOfContents } from '@/components/blog/TableOfContents'
import { categoryTheme } from '@/components/blog/theme'
import { JsonLd } from '@/components/JsonLd'
import { RichText } from '@/components/RichText'
import { getDictionary, t } from '@/i18n/getDictionary'
import { isLocale, localeHref } from '@/i18n/routing'
import { articleSchema, breadcrumbSchema } from '@/lib/jsonld'
import { cn } from '@/lib/cn'
import { findDoc, findDocs, staticSlugs } from '@/lib/payload'
import { buildMetadata, notFoundMetadata } from '@/lib/seo'
import { absoluteUrl } from '@/lib/urls'

import type { PostDoc } from '../../page-types'

export const revalidate = 900

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return []
  return staticSlugs('posts', params.locale, 500)
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  if (!isLocale(locale)) return notFoundMetadata
  const post = await findDoc<PostDoc>('posts', slug, locale)
  if (!post) return notFoundMetadata

  const image = post.meta?.image?.url ?? post.heroImage?.url
  return buildMetadata({
    title: post.meta?.title ?? post.title,
    description: post.meta?.description ?? post.excerpt ?? undefined,
    path: `/blog/${slug}`,
    locale,
    availableLocales: post.availableLocales,
    image: image ? { url: image } : null,
    noindex: post.meta?.noindex,
    canonicalOverride: post.meta?.canonicalOverride,
    type: 'article',
    publishedTime: post.publishedAt ?? undefined,
    modifiedTime: post.updatedAt,
  })
}

export default async function ArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()

  const [post, dict] = await Promise.all([findDoc<PostDoc>('posts', slug, locale), getDictionary(locale)])
  if (!post) notFound()

  const category = categoryTitle(post as unknown as PostSummary)
  const theme = categoryTheme(category || slug)
  const isHtml = post.contentFormat === 'html' && Boolean(post.htmlContent?.trim())
  const headings = isHtml ? [] : extractHeadings(post.content)
  const minutes = isHtml ? htmlReadingMinutes(post.htmlContent!) : readingMinutes(post.content)
  const url = absoluteUrl(`/blog/${slug}`, locale)

  // Related posts: same category first, falling back to most recent, and never
  // the article you are already reading.
  const explicit = (post.relatedPosts ?? []).filter((item) => typeof item === 'object')
  const { docs: fallback } =
    explicit.length >= 3
      ? { docs: [] }
      : await findDocs<PostSummary>({
          collection: 'posts',
          locale,
          limit: 4,
          sort: '-publishedAt',
          select: { slug: true, title: true, excerpt: true, heroImage: true, publishedAt: true, featured: true, tags: true, category: true },
          where: { slug: { not_equals: slug } },
        })
  const related = [...(explicit as unknown as PostSummary[]), ...fallback]
    .filter((item, index, all) => all.findIndex((other) => other.slug === item.slug) === index)
    .slice(0, 3)

  const crumbs = [
    { name: dict.nav.home, path: '/' },
    { name: dict.blog.title, path: '/blog' },
    { name: post.title, path: `/blog/${slug}` },
  ]

  return (
    <div className="bg-blog-surface dark:bg-blog-ink">
      <ReadingProgress />

      <HeroBand>
        <div className="container-wide py-10 sm:py-14">
          <nav aria-label={dict.common.breadcrumb} className="mb-8 text-sm text-slate-500 dark:text-slate-400">
            <ol className="flex flex-wrap items-center gap-2">
              {crumbs.slice(0, -1).map((crumb) => (
                <li key={crumb.path} className="flex items-center gap-2">
                  <Link href={localeHref(locale, crumb.path)} className="hover:text-blog-600">
                    {crumb.name}
                  </Link>
                  <span aria-hidden>/</span>
                </li>
              ))}
              <li aria-current="page" className="line-clamp-1 font-medium text-slate-700 dark:text-slate-200">
                {post.title}
              </li>
            </ol>
          </nav>

          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <header>
              {category ? (
                <span className={cn('inline-block rounded-full px-3 py-1 text-xs font-semibold', theme.tag)}>
                  {category}
                </span>
              ) : null}

              <h1 className="mt-4 text-[clamp(2.1rem,4.2vw,3.4rem)] leading-[1.12] font-extrabold tracking-tight text-balance text-slate-900 dark:text-white">
                {post.title}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-500 dark:text-slate-400">
                {post.author?.name ? (
                  <span className="flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className="grid h-10 w-10 place-items-center rounded-full bg-blog-500 text-sm font-bold text-white shadow-sm ring-2 ring-white dark:ring-white/10"
                    >
                      {post.author.name.charAt(0)}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{post.author.name}</span>
                  </span>
                ) : null}

                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blog-500" aria-hidden />
                  {t(dict.common.minRead, { minutes })}
                </span>

                {post.publishedAt ? (
                  <time dateTime={post.publishedAt}>· {formatDate(post.publishedAt, locale)}</time>
                ) : null}
              </div>
            </header>

            <Cover
              category={category || 'FEKRA'}
              title={post.title}
              image={post.heroImage}
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="aspect-[16/10] w-full rounded-[1.75rem] shadow-[0_30px_70px_-40px_rgba(15,23,42,0.5)] ring-1 ring-white/60 dark:ring-white/10"
            />
          </div>
        </div>
      </HeroBand>

      <div className="container-wide py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          {!isHtml ? <aside className="order-2 hidden lg:order-1 lg:col-span-3 lg:block">
            <div className="scrollbar-slim sticky top-24 max-h-[calc(100vh-7rem)] overflow-auto rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_12px_44px_-30px_rgba(15,23,42,0.4)] dark:border-white/10 dark:bg-white/[0.03]">
              <TableOfContents headings={headings} title={dict.blog.tableOfContents} />
            </div>
          </aside> : null}

          <article className={cn('order-1 min-w-0 lg:order-2', isHtml ? 'lg:col-span-9' : 'lg:col-span-6')}>
            {headings.length ? (
              /* Phones lose the sticky sidebar, so the same TOC collapses in
                 here instead. The nav's own title is hidden — the summary row
                 already carries it. */
              <details className="group mb-8 rounded-2xl border border-slate-200/70 bg-white p-5 lg:hidden dark:border-white/10 dark:bg-white/[0.03]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-lg font-bold text-slate-900 [&::-webkit-details-marker]:hidden dark:text-white">
                  <span className="flex items-center gap-2.5">
                    <span className="inline-block h-5 w-1.5 rounded-full bg-blog-500" aria-hidden />
                    {dict.blog.tableOfContents}
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-4 w-4 shrink-0 text-blog-500 transition-transform duration-200 group-open:rotate-180">
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <div className="mt-4 [&_nav>p]:hidden">
                  <TableOfContents headings={headings} title={dict.blog.tableOfContents} />
                </div>
              </details>
            ) : null}

            {post.excerpt ? (
              <div className="relative mt-3 mb-12 rounded-2xl border border-blog-500/25 bg-blog-500/[0.06] p-7 ps-8 sm:p-8">
                <span className="absolute -top-5 start-6 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blog-400 to-blog-700 text-2xl leading-none font-bold text-white shadow-lg">
                  &ldquo;
                </span>
                <p className="text-[1.0625rem] leading-8 text-slate-700 sm:text-[1.125rem] dark:text-slate-200">
                  <span className="font-bold text-slate-900 dark:text-white">{dict.blog.quickSummary}: </span>
                  {post.excerpt}
                </p>
              </div>
            ) : null}

            {isHtml ? <HtmlArticle document={blogHtmlDocument(post.htmlContent!)} title={post.title} /> :
              <RichText data={post.content} anchors variant="article" locale={locale} />}

            {post.tags?.length ? (
              <ul className="mt-10 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300"
                  >
                    #{tag}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 dark:border-white/10">
              <ShareButtons url={url} title={post.title} label={dict.blog.share} />
              <Link href={localeHref(locale, '/blog')} className="text-sm font-semibold text-blog-600 hover:underline">
                {dict.blog.backToBlog}
              </Link>
            </div>

            {post.author?.name ? (
              <div className="mt-8 flex items-start gap-4 rounded-2xl border border-slate-200/70 bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]">
                <span
                  aria-hidden
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-blog-500 text-xl font-bold text-white shadow-sm ring-2 ring-white dark:ring-white/10"
                >
                  {post.author.name.charAt(0)}
                </span>
                <div>
                  <p className="text-xs font-semibold tracking-wide text-blog-600 uppercase">{dict.blog.aboutAuthor}</p>
                  <p className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">{post.author.name}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{dict.blog.authorBio}</p>
                </div>
              </div>
            ) : null}
          </article>

          <aside className="order-3 lg:col-span-3">
            <div className="sticky top-24 space-y-5">
              <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-blog-500 to-blog-700 p-6 text-white shadow-[0_20px_50px_-28px_rgba(72,155,194,0.9)]">
                <p className="text-lg leading-snug font-bold">{dict.blog.sidebarCtaTitle}</p>
                <Link
                  href={localeHref(locale, '/contact')}
                  className="fk-button fk-button--inverse mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-blog-700 transition-transform"
                >
                  {dict.blog.sidebarCtaButton}
                  <span aria-hidden>→</span>
                </Link>
              </div>

              <p className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                <Eye className="h-5 w-5 text-blog-500" aria-hidden />
                {t(dict.common.minRead, { minutes })}
              </p>
            </div>
          </aside>
        </div>
      </div>

      <RenderBlocks blocks={post.layout} locale={locale} dict={dict} />

      {related.length ? (
        <section className="border-t border-slate-200/70 py-16 dark:border-white/10">
          <div className="container-wide">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{dict.blog.related}</h2>
            <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {related.map((item) => (
                <PostCard key={item.id ?? item.slug} post={item} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="pb-24">
        <div className="container-wide">
          <NewsletterPanel dict={dict} locale={locale} />
        </div>
      </section>

      <JsonLd
        data={[
          articleSchema({
            title: post.title,
            excerpt: post.excerpt,
            path: `/blog/${slug}`,
            locale,
            imageUrl: post.heroImage?.url ?? null,
            publishedAt: post.publishedAt,
            updatedAt: post.updatedAt,
            authorName: post.author?.name,
          }),
          breadcrumbSchema(crumbs, locale),
        ]}
      />
    </div>
  )
}
