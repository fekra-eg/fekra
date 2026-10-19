import { NodeHtmlMarkdown } from 'node-html-markdown'

export const runtime = 'nodejs'

/**
 * Markdown for Agents. The proxy rewrites `Accept: text/markdown` page
 * requests here; we fetch the same page as HTML (a CDN hit for static pages)
 * and convert its <main>, so the markdown never drifts from what browsers see.
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin
  // Set by the proxy (a rewrite's query string does not reach the handler).
  const target = new URL(request.headers.get('x-markdown-path') ?? '/', origin)
  // The path is caller-controlled: never let it point the fetch off-site.
  if (target.origin !== origin) return new Response('Bad request', { status: 400 })

  const page = await fetch(target, { headers: { accept: 'text/html' }, redirect: 'follow' })
  const html = await page.text()
  if (!page.ok || !page.headers.get('content-type')?.includes('text/html')) {
    return new Response('Not found', { status: page.status === 200 ? 404 : page.status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  const title = NodeHtmlMarkdown.translate(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '')
  const main = html.match(/<main[^>]*>([\s\S]*)<\/main>/)?.[1] ?? html
  const body = NodeHtmlMarkdown.translate(main.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/g, ''))
  const markdown = `${title ? `# ${title}\n\n` : ''}${body}\n`

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(Math.ceil(markdown.length / 4)), // ponytail: chars/4 estimate, no tokenizer
      Vary: 'Accept',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      'X-Robots-Tag': 'noindex',
    },
  })
}
