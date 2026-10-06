import type { Locale } from '@/i18n/routing'

/**
 * Machine translation for blog posts (English -> one target locale) via the
 * OpenAI Chat Completions API. One request per locale: every string the
 * article shows goes out in one JSON object and must come back in the same shape.
 */

const LANGUAGE: Record<Exclude<Locale, 'en'>, string> = { ar: 'Arabic', de: 'German', fr: 'French', es: 'Spanish' }
const EXCERPT_MAX = 320

type LexicalNode = { type?: string; text?: string; children?: LexicalNode[]; [key: string]: unknown }
export type TranslatablePost = {
  title?: string | null
  excerpt?: string | null
  tags?: string[] | null
  contentFormat?: string | null
  htmlContent?: string | null
  content?: { root: LexicalNode } | null
  meta?: { title?: string | null; description?: string | null } | null
}

function textNodes(node: LexicalNode | undefined, out: LexicalNode[] = []): LexicalNode[] {
  if (!node) return out
  if (node.type === 'text' && node.text?.trim()) out.push(node)
  for (const child of node.children ?? []) textNodes(child, out)
  return out
}

/** CSS is never translated — swap it out so it costs no tokens and cannot be mangled. */
function stashStyles(html: string) {
  const styles: string[] = []
  const stripped = html.replace(/<style\b[\s\S]*?<\/style>/gi, (match) => `⟦STYLE_${styles.push(match) - 1}⟧`)
  return { stripped, restore: (out: string) => out.replace(/⟦STYLE_(\d+)⟧/g, (_, i) => styles[Number(i)] ?? '') }
}

function clip(value: string, max: number) {
  if (value.length <= max) return value
  const cut = value.slice(0, max - 1)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 40))}…`
}

async function openai(system: string, input: unknown): Promise<Record<string, unknown>> {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY is not set')
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(input) },
      ],
    }),
    signal: AbortSignal.timeout(240_000),
  })
  const body = (await response.json().catch(() => ({}))) as {
    error?: { message?: string }
    choices?: { message?: { content?: string }; finish_reason?: string }[]
  }
  if (!response.ok) throw new Error(`OpenAI ${response.status}: ${body.error?.message ?? 'request failed'}`)
  const choice = body.choices?.[0]
  if (choice?.finish_reason === 'length') throw new Error('OpenAI response was cut off (article too long)')
  return JSON.parse(choice?.message?.content ?? '{}')
}

/** Returns the localized field values to save for `locale`. Throws if the model breaks the contract. */
export async function translatePost(post: TranslatablePost, locale: Exclude<Locale, 'en'>) {
  const language = LANGUAGE[locale]
  const html = post.contentFormat === 'html' && post.htmlContent ? stashStyles(post.htmlContent) : null
  // Clone so the English document is never mutated between locales.
  const content = !html && post.content ? (structuredClone(post.content) as { root: LexicalNode }) : null
  const nodes = content ? textNodes(content.root) : []

  const input = {
    title: post.title ?? '',
    excerpt: post.excerpt ?? '',
    tags: post.tags ?? [],
    metaTitle: post.meta?.title ?? '',
    metaDescription: post.meta?.description ?? '',
    ...(html ? { html: html.stripped } : { texts: nodes.map((node) => node.text!) }),
  }

  const system = [
    `You are a professional translator for FEKRA, a software engineering outsourcing company. Translate the user's JSON from English to ${language}.`,
    'Return a JSON object with exactly the same keys. Arrays must keep the same length and order; translate each item on its own (items in "texts" are consecutive runs of one document, so keep leading/trailing spaces).',
    'Empty strings stay empty. Keep brand and product names (FEKRA, Fika), technology and company names, code, URLs, e-mail addresses and numbers unchanged.',
    `Use a natural, professional business tone for native ${language} readers. "excerpt" and "metaDescription" must stay under ${EXCERPT_MAX} characters.`,
    html
      ? `"html" is an HTML document: translate only human-visible text and the values of alt, title and aria-label attributes. Keep every tag, attribute, class, id, href and every ⟦STYLE_n⟧ placeholder exactly as is. Set any lang attribute to "${locale}".${locale === 'ar' ? ' Add dir="rtl" to the <html> element (or to the outermost element if there is no <html>).' : ''}`
      : '',
  ].join(' ')

  const out = await openai(system, input)
  const str = (key: string) => (typeof out[key] === 'string' ? (out[key] as string) : '')

  const data: Record<string, unknown> = {
    title: str('title') || post.title,
    excerpt: post.excerpt ? clip(str('excerpt'), EXCERPT_MAX) : post.excerpt,
    tags: Array.isArray(out.tags) && out.tags.length === input.tags.length ? out.tags : post.tags,
    meta: { title: str('metaTitle') || undefined, description: str('metaDescription') ? clip(str('metaDescription'), EXCERPT_MAX) : undefined },
    contentFormat: post.contentFormat,
  }

  if (html) {
    const translated = str('html')
    if (!translated.trim()) throw new Error('OpenAI returned no HTML')
    data.htmlContent = html.restore(translated)
  } else if (content) {
    const texts = out.texts
    if (!Array.isArray(texts) || texts.length !== nodes.length) throw new Error('OpenAI returned a different number of text blocks')
    nodes.forEach((node, i) => { if (typeof texts[i] === 'string') node.text = texts[i] })
    data.content = content
  }
  return data
}
