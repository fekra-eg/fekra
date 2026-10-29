import type { Endpoint } from 'payload'
import { NodeHtmlMarkdown } from 'node-html-markdown'

import { LOCALES, type Locale } from '@/i18n/routing'
import { openai } from '@/lib/translate-post'
import { siteUrl } from '@/lib/urls'

type Node = { type?: string; tag?: string; text?: string; url?: string; fields?: { url?: string; linkType?: string }; value?: { alt?: string } | number; children?: Node[] }

/** Lexical -> markdown-ish text plus the counts a reviewer would check by hand. */
function readLexical(root: Node | undefined) {
  const facts = { h1: 0, h2: 0, h3: 0, internalLinks: 0, externalLinks: 0, images: 0, imagesWithoutAlt: 0 }
  const lines: string[] = []
  const text = (n: Node): string => (n.text ?? '') + (n.children ?? []).map(text).join('')
  const walk = (n: Node) => {
    if (n.type === 'heading') {
      const level = Number(n.tag?.slice(1)) || 2
      if (level <= 3) facts[`h${level}` as 'h1' | 'h2' | 'h3']++
      lines.push(`${'#'.repeat(level)} ${text(n)}`)
      return
    }
    if (n.type === 'link' || n.type === 'autolink') countLink(n.fields?.linkType === 'internal' ? '/' : (n.fields?.url ?? ''), facts)
    if (n.type === 'upload') {
      facts.images++
      if (typeof n.value !== 'object' || !n.value?.alt?.trim()) facts.imagesWithoutAlt++
    }
    if (n.type === 'paragraph' || n.type === 'listitem' || n.type === 'quote') {
      const line = text(n).trim()
      if (line) lines.push(n.type === 'listitem' ? `- ${line}` : line)
      ;(n.children ?? []).forEach(walkInline)
      return
    }
    ;(n.children ?? []).forEach(walk)
  }
  // Links and images inside a paragraph still count, but their text is already in the line.
  const walkInline = (n: Node) => {
    if (n.type === 'link' || n.type === 'autolink') countLink(n.fields?.linkType === 'internal' ? '/' : (n.fields?.url ?? ''), facts)
    ;(n.children ?? []).forEach(walkInline)
  }
  if (root) walk(root)
  return { markdown: lines.join('\n\n'), facts }
}

function readHtml(html: string) {
  const body = html.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, '')
  const count = (re: RegExp) => (body.match(re) ?? []).length
  const facts = { h1: count(/<h1\b/gi), h2: count(/<h2\b/gi), h3: count(/<h3\b/gi), internalLinks: 0, externalLinks: 0, images: 0, imagesWithoutAlt: 0 }
  for (const [, href] of body.matchAll(/<a\b[^>]*\bhref=["']([^"']*)["']/gi)) countLink(href ?? '', facts)
  for (const [tag] of body.matchAll(/<img\b[^>]*>/gi)) {
    facts.images++
    if (!/\balt=["'][^"']+["']/i.test(tag)) facts.imagesWithoutAlt++
  }
  return { markdown: NodeHtmlMarkdown.translate(body), facts }
}

function countLink(href: string, facts: { internalLinks: number; externalLinks: number }) {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
  const internal = href.startsWith('/') || href.startsWith(siteUrl())
  facts[internal ? 'internalLinks' : 'externalLinks']++
}

/**
 * POST /api/posts/:id/seo-review?locale=en — reads the saved draft, measures it,
 * and asks the model for a scored review. Read-only: nothing is written back.
 */
export const seoReviewEndpoint: Endpoint = {
  path: '/:id/seo-review',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const requested = req.searchParams.get('locale') as Locale | null
    const locale: Locale = requested && LOCALES.includes(requested) ? requested : 'en'
    const post = (await req.payload.findByID({
      collection: 'posts', id: String(req.routeParams?.id ?? ''), locale, fallbackLocale: false, draft: true, depth: 1,
    })) as unknown as {
      title?: string; slug?: string; excerpt?: string; tags?: string[]; heroImage?: unknown
      contentFormat?: string; htmlContent?: string; content?: { root: Node }
      meta?: { title?: string; description?: string; image?: unknown }
    }
    const { markdown, facts } = post.contentFormat === 'html' && post.htmlContent ? readHtml(post.htmlContent) : readLexical(post.content?.root)
    if (!markdown.trim()) return Response.json({ error: 'This article has no content in this language yet.' }, { status: 400 })

    const measured = {
      ...facts,
      words: markdown.split(/\s+/).filter(Boolean).length,
      titleLength: post.title?.length ?? 0,
      metaTitleLength: post.meta?.title?.length ?? 0,
      metaDescriptionLength: post.meta?.description?.length ?? 0,
      hasExcerpt: Boolean(post.excerpt?.trim()),
      hasHeroImage: Boolean(post.heroImage),
      hasSocialImage: Boolean(post.meta?.image),
      tags: post.tags?.length ?? 0,
    }
    const system = [
      'You are a senior SEO editor reviewing a blog article for FEKRA, a software engineering outsourcing company (staff augmentation, dedicated teams, QA, AI, cloud).',
      `The article is written in locale "${locale}"; write your review in English, but quote any suggested title or meta description in the article's own language.`,
      'The "measured" object is exact — trust it over your own counting. The page template renders the title as the only H1, so body H1s are a problem.',
      'Judge: search intent and a clear focus keyword; keyword use in title, meta, first paragraph and headings; heading structure; depth and length for the topic; readability (short paragraphs, plain sentences);',
      'internal links to FEKRA services or other articles; external links to authoritative sources; image alt text; meta title (50–60 chars) and description (120–160 chars); E-E-A-T signals; a closing call to action.',
      'Return JSON: {"score": 0-100, "summary": "2–3 sentences", "focusKeyword": string, "secondaryKeywords": string[],',
      '"strengths": string[], "issues": [{"severity": "high"|"medium"|"low", "issue": string, "fix": string}] (most important first, at most 10, each fix concrete enough to apply),',
      '"suggestedTitle": string, "suggestedMetaTitle": string, "suggestedMetaDescription": string, "suggestedHeadings": string[] (H2s worth adding, may be empty)}.',
    ].join(' ')
    try {
      const review = await openai(system, {
        url: `/blog/${post.slug ?? ''}`,
        title: post.title ?? '',
        metaTitle: post.meta?.title ?? '',
        metaDescription: post.meta?.description ?? '',
        excerpt: post.excerpt ?? '',
        tags: post.tags ?? [],
        measured,
        // ponytail: long articles are clipped at ~60k chars to stay inside one request; chunk if posts grow past that.
        content: markdown.slice(0, 60_000),
      })
      return Response.json({ locale, measured, review })
    } catch (error) {
      req.payload.logger.error({ error }, 'SEO review failed')
      return Response.json({ error: error instanceof Error ? error.message : 'SEO review failed' }, { status: 502 })
    }
  },
}
