import Image from 'next/image'
import Link from 'next/link'

import { categoryTitle, type PostSummary } from '@/components/blog/PostCard'
import type { Locale } from '@/i18n/routing'
import { documentHref } from '@/lib/urls'
import { findDocs } from '@/lib/payload'
import { resolveLink } from '@/lib/resolveLink'
import { LinkButton } from '@/components/ui/Button'

import { mediaAlt, mediaUrl, type MediaDoc } from './types'
import type { BlockProps } from './types'

/**
 * Figma 1:11690 — image cards with the title sitting on the artwork under a
 * bottom-up scrim, rather than the editorial PostCard used on /blog.
 */
export async function PostsTeaser({ block, locale }: { block: BlockProps; locale: Locale }) {
  const categorySlug = typeof block.category === 'object' ? block.category?.slug : undefined
  const { docs } = await findDocs<PostSummary>({
    collection: 'posts',
    locale,
    limit: block.limit ?? 3,
    sort: '-publishedAt',
    select: { slug: true, title: true, heroImage: true, featured: true, category: true },
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

        <ul className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((post) => {
            const image = post.heroImage as MediaDoc | undefined
            const tag = post.featured ? 'Featured' : categoryTitle(post)
            return (
              <li key={post.id} className="relative h-[340px] overflow-hidden rounded-xl bg-primary">
                {image?.url ? (
                  <Image
                    src={mediaUrl(image)}
                    alt={mediaAlt(image)}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                ) : null}
                {/* Scrim starts at 60% so the artwork reads at the top while the
                    title keeps contrast at the bottom (15.5). */}
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 top-[60%] bg-[linear-gradient(180deg,rgba(18,18,18,0)_0%,#121212_100%)]"
                />
                <div className="absolute inset-x-4 bottom-4 flex flex-col items-start gap-2">
                  {tag ? (
                    <span className="rounded-[40px] bg-primary px-4 py-1 text-[10px] font-bold tracking-[0.3px] text-primary-foreground">
                      {tag}
                    </span>
                  ) : null}
                  <h3 className="text-xl/[1.5] font-semibold text-white">
                    {/* Stretched link: the whole card is the target, but only the
                        title is announced (23.6). */}
                    <Link href={documentHref('posts', post.slug, locale)} className="after:absolute after:inset-0">
                      {post.title}
                    </Link>
                  </h3>
                </div>
              </li>
            )
          })}
        </ul>

        {ctas.map((c) => (c.link ? <LinkButton key={c.link.href} link={c.link} variant="secondary" withArrow /> : null))}
      </div>
    </section>
  )
}
