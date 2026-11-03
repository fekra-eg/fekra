import sharp from 'sharp'

import { isLocale } from '@/i18n/routing'
import { findDocs } from '@/lib/payload'

import type { PostDoc } from '../../../../(site)/[locale]/page-types'

/**
 * A post's cover as a 1200×630 JPEG share card. Media is stored as WebP, which
 * LinkedIn and others won't show, so every post fell back to the generic card.
 * URL: /og/post/{locale}/{slug}.jpg (the dot keeps it out of the locale proxy).
 */
export async function GET(request: Request, { params }: { params: Promise<{ locale: string; file: string }> }) {
  const { locale, file } = await params
  const slug = file.replace(/\.jpg$/, '')
  if (!isLocale(locale) || slug === file) return new Response('Not found', { status: 404 })

  const { docs } = await findDocs<PostDoc>({ collection: 'posts', locale, limit: 1, where: { slug: { equals: slug } } })
  const post = docs[0]
  const cover = post?.meta?.image?.url ? post.meta.image : post?.heroImage
  const src = (cover as { sizes?: { og?: { url?: string | null } } } | null | undefined)?.sizes?.og?.url || cover?.url
  // No usable cover: send crawlers to the generic blog card rather than no image.
  const fallback = () => Response.redirect(new URL('/og/blog.png', request.url), 302)
  if (!src) return fallback()

  const upstream = await fetch(new URL(src, request.url)).catch(() => null)
  if (!upstream?.ok) return fallback()
  const jpeg = await sharp(Buffer.from(await upstream.arrayBuffer()))
    .resize(1200, 630, { fit: 'cover', position: 'attention' })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer()

  return new Response(new Uint8Array(jpeg), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400' },
  })
}
