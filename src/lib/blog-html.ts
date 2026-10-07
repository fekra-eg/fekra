import sanitizeHtml from 'sanitize-html'

export const MAX_BLOG_HTML_LENGTH = 500_000

/** Preserve article styling inside an isolated, script-free document. */
export function cleanBlogHtml(source: string): string {
  return sanitizeHtml(source, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'html', 'head', 'body', 'title', 'style', 'img'],
    allowedAttributes: {
      '*': ['id', 'class', 'style', 'dir', 'lang', 'title', 'role', 'aria-*'],
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan', 'scope'],
      ol: ['start', 'reversed', 'type'],
    },
    allowedSchemes: ['https', 'http', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['https', 'http', 'data'] },
    allowVulnerableTags: true, // CSS is confined to a sandboxed iframe, never the host page.
    parseStyleAttributes: false,
    transformTags: {
      // Links leave the sandboxed frame instead of loading inside it; #anchors are scrolled by HtmlArticle.
      a: (tagName, attribs) => ({
        tagName,
        attribs: attribs.href?.startsWith('#') ? attribs : { ...attribs, target: '_blank', rel: 'noopener noreferrer' },
      }),
    },
  })
}

export function blogHtmlDocument(source: string): string {
  const html = cleanBlogHtml(source)
  const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'unsafe-inline' https:; img-src https: http: data:; font-src https: data:; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'"><style>html{overflow-wrap:break-word}body{margin:0}img{max-width:100%;height:auto}</style>`
  // Place our policy before any imported content, including its styles.
  if (/<head(?:\s|>)/i.test(html)) return `<!doctype html>${html.replace(/<head([^>]*)>/i, `<head$1>${head}`)}`
  if (/<html(?:\s|>)/i.test(html)) return `<!doctype html>${html.replace(/<html([^>]*)>/i, `<html$1><head>${head}</head>`)}`
  return `<!doctype html><html><head>${head}</head><body>${html}</body></html>`
}

export function htmlReadingMinutes(source: string): number {
  const text = sanitizeHtml(source, { allowedTags: [], allowedAttributes: {} })
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).filter(Boolean).length / 220))
}

const ARTICLE_CLASS = 'fk-html-article'

/**
 * Same article, rendered into the page instead of an iframe: srcdoc content is
 * invisible to crawlers, so the post indexed as title + summary only (FK-06).
 * The article's CSS is confined with @scope, its page-level selectors
 * (`:root`, `html`, `body`) retarget the wrapper, and a reset layer that ranks
 * above Tailwind's undoes preflight so the article sees browser defaults, as
 * it did in the frame. CSS is editor-supplied (trusted), as before.
 */
export function blogHtmlInline(source: string): { html: string; css: string } {
  const cleaned = sanitizeHtml(cleanBlogHtml(source), {
    allowedTags: false,
    allowedAttributes: false,
    allowVulnerableTags: true,
    exclusiveFilter: (frame) => ['title', 'meta'].includes(frame.tag),
    transformTags: {
      // The page already has its <main> and its H1 (the post title).
      main: 'div',
      h1: (_, attribs) => ({ tagName: 'h2', attribs: { ...attribs, class: `${attribs.class ?? ''} fk-article-title`.trim() } }),
    },
  })
  const styles = [...cleaned.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n')
  const body = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  const html = (body.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? body).replace(/<\/?html[^>]*>/gi, '')
  const scoped = styles.replace(/([^{}]+)\{/g, (_, selector: string) =>
    `${selector.replace(/:root\b|\bhtml\b|\bbody\b/g, ':scope').replace(/\bh1\b/g, '.fk-article-title')}{`,
  )
  const css =
    `@layer fk-article-reset{.${ARTICLE_CLASS} *{all:revert}}` +
    `.${ARTICLE_CLASS}{position:relative;overflow:clip;background:#fff;color:#000;overflow-wrap:break-word}.${ARTICLE_CLASS} img{max-width:100%;height:auto}` +
    `@scope (.${ARTICLE_CLASS}){${scoped}}`
  return { html, css }
}

export const BLOG_HTML_CLASS = ARTICLE_CLASS
