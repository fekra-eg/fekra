import { writeFileSync } from 'node:fs'
const base = (process.argv[2] || 'http://localhost:3012').replace(/\/$/, '')
const sitemap = await (await fetch(`${base}/sitemap.xml`)).text()
const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, xml]) => ({
  url: xml.match(/<loc>(.*?)<\/loc>/)?.[1],
  languages: Object.fromEntries([...xml.matchAll(/<xhtml:link\b[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"/g)].map(([, language, href]) => [language, href])),
}))
const results = [], timings = []
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, k, v]) => [k.toLowerCase(), v.replaceAll('&amp;', '&')]))
for (const entry of entries) {
  const urls = [...new Set([entry.url, ...Object.values(entry.languages)])]
  const batch = await Promise.all(urls.map(async (url) => {
    const path = new URL(url).pathname
    const start = performance.now()
    const response = await fetch(base + path, { redirect: 'manual' })
    const ttfb = performance.now() - start
    const html = await response.text()
    const links = [...html.matchAll(/<link\b[^>]*>/g)].map(([tag]) => attrs(tag))
    const canonical = links.find((l) => l.rel === 'canonical')?.href
    const languages = Object.fromEntries(links.filter((l) => l.rel === 'alternate' && l.hreflang).map((l) => [l.hreflang, l.href]))
    const pass = response.status === 200 && new URL(canonical || 'https://invalid.example').pathname === path && Object.entries(entry.languages).every(([language, href]) => languages[language] === href) && Object.keys(languages).length === Object.keys(entry.languages).length
    timings.push({ path, timestamp: new Date().toISOString(), region: 'local-qa', status: response.status, ttfbMs: Math.round(ttfb), cache: response.headers.get('x-nextjs-cache') || response.headers.get('x-vercel-cache') || '', bytes: Buffer.byteLength(html) })
    return { path, status: response.status, pass, ...(pass ? {} : { canonical, sitemapLanguages: entry.languages, pageLanguages: languages }) }
  }))
  results.push(...batch)
}
writeFileSync('/private/tmp/fekra-review-seo.json', JSON.stringify({ canonicalEntries: entries.length, results }, null, 2))
writeFileSync('/private/tmp/fekra-review-timings.csv', 'path,timestamp,region,status,ttfbMs,cache,bytes\n' + timings.map((row) => Object.values(row).join(',')).join('\n'))
console.log(JSON.stringify({ canonicalEntries: entries.length, localeUrls: results.length, failed: results.filter((r) => !r.pass).length }))
process.exitCode = results.some((r) => !r.pass) ? 1 : 0
