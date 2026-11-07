import { PostCard, type PostSummary } from '@/components/blog/PostCard'
import type { Locale } from '@/i18n/routing'
import { findDocs } from '@/lib/payload'
import { resolveLink } from '@/lib/resolveLink'
import { LinkButton } from '@/components/ui/Button'

import type { BlockProps } from './types'

/**
 * Latest-posts section. Cards are the /blog PostCard itself, so one design
 * change applies everywhere (batch 8).
 */
export async function PostsTeaser({ block, locale }: { block: BlockProps; locale: Locale }) {
  const categorySlug = typeof block.category === 'object' ? block.category?.slug : undefined
  const { docs } = await findDocs<PostSummary>({
    collection: 'posts',
    locale,
    limit: block.limit ?? 3,
    sort: '-publishedAt',
    select: { slug: true, title: true, excerpt: true, heroImage: true, publishedAt: true, featured: true, tags: true, category: true },
    where: categorySlug ? { 'category.slug': { equals: categorySlug } } : {},
  })

  // 8.9 — an empty section is removed, not rendered as an empty grid.
  if (!docs.length) return null

  const ctas = (block.ctas ?? []).map((c) => ({ variant: c.variant, link: resolveLink(c.link, locale) }))

  return (
    <section id={block.anchor ?? undefined} className="section">
      <div className="container-site flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-2 text-center">
          {block.eyebrow ? (
            <p className="text-sm font-semibold tracking-[2.8px] text-navy-800 uppercase dark:text-foreground">
              {block.eyebrow}
            </p>
          ) : null}
          <h2 className="font-display text-[clamp(1.75rem,2.92vw,2.625rem)] leading-[1.19] font-bold">
            <span className="bg-[linear-gradient(142.32deg,#12cbb4_0%,#375bc7_100%)] bg-clip-text text-transparent">
              {block.heading}
              {block.headingAccent ? ` ${block.headingAccent}` : null}
            </span>
          </h2>
        </div>

        <div className="grid w-full gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((post) => (
            <PostCard key={post.id} post={post} locale={locale} />
          ))}
        </div>

        {ctas.map((c) => (c.link ? <LinkButton key={c.link.href} link={c.link} variant="secondary" withArrow /> : null))}
      </div>
    </section>
  )
}
