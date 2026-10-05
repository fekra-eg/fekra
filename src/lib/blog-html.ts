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
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, rel: 'noopener noreferrer' } }),
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
