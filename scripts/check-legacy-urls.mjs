#!/usr/bin/env node
/**
 * Old-site URL audit. Every legacy URL must end in exactly one of:
 *   301/308 → a live 200 page (one hop), or 410 Gone.
 * Never 200, 404, a redirect chain, or a redirect to an error.
 * Also checks the sitemap never lists a legacy URL and every sitemap URL is 200.
 *
 *   node scripts/check-legacy-urls.mjs https://www.fekra-egy.com
 */
import { readFileSync } from 'node:fs'

const base = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '')
const redirects = JSON.parse(readFileSync(new URL('../redirects.json', import.meta.url), 'utf8'))
const sample = (path) => path.replace(':slug', 'old-entry').replace(':n', '2')

// Mirrors RETIRED in src/proxy.ts, expanded to concrete URLs.
const industries = ['agritech', 'ecommerce', 'education', 'finance', 'food', 'games', 'healthcare', 'insurance', 'media', 'real-estate', 'sports', 'logistics', 'ev-charging', 'ev-charging-2']
const retired = [...industries.flatMap((name) => [`/${name}`, `/ind/${name}`, `/industriess/${name}`]), '/ind', '/industriess']
// WordPress leftovers Google still knows about (Yoast sitemaps, feeds, archives).
const wordpress = ['/sitemap_index.xml', '/page-sitemap.xml', '/post-sitemap.xml', '/category-sitemap.xml', '/career-sitemap.xml', '/feed', '/comments/feed', '/wp-login.php', '/wp-admin', '/xmlrpc.php', '/author/admin', '/tag/outsourcing', '/blog/page/2', '/category/news', '/?p=1', '/?page_id=2']

const legacy = [...new Set([...redirects.map((r) => sample(r.from)), ...retired, ...wordpress])]
const results = []

async function check(path) {
  const hops = []
  let url = base + path
  for (let i = 0; i < 5; i++) {
    const res = await fetch(url, { redirect: 'manual', headers: { 'user-agent': 'FEKRA-legacy-audit' } })
    hops.push(res.status)
    const next = res.headers.get('location')
    if (res.status >= 300 && res.status < 400 && next) { url = new URL(next, url).href; continue }
    const target = url.replace(base, '') || '/'
    // Off-site (the Calendly booking link) is not an indexing concern; any hops are fine.
    const external = !url.startsWith(base) && res.status === 200
    const ok = res.status === 410 || external || (hops.length === 2 && [301, 308].includes(hops[0]) && res.status === 200)
    return { path, hops: hops.join('→'), target, ok }
  }
  return { path, hops: hops.join('→'), target: url, ok: false }
}

for (let i = 0; i < legacy.length; i += 8) {
  results.push(...await Promise.all(legacy.slice(i, i + 8).map(check)))
}

const sitemap = await (await fetch(`${base}/sitemap.xml`)).text()
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc)
const listed = new Set(locs.map((loc) => new URL(loc).pathname))
const inSitemap = legacy.filter((path) => listed.has(path))
const sitemapStatus = []
for (let i = 0; i < locs.length; i += 8) {
  sitemapStatus.push(...await Promise.all(locs.slice(i, i + 8).map(async (loc) => ({ loc, status: (await fetch(loc, { redirect: 'manual' })).status }))))
}

const bad = results.filter((r) => !r.ok)
console.log(`Legacy URLs checked: ${results.length} — ${results.filter((r) => r.hops.startsWith('410')).length} gone (410), ${results.filter((r) => r.ok && !r.hops.startsWith('410')).length} redirected, ${bad.length} problems`)
for (const r of bad) console.log(`  PROBLEM ${r.path}  ${r.hops}  → ${r.target}`)
console.log(`Sitemap: ${locs.length} URLs, ${sitemapStatus.filter((s) => s.status !== 200).length} not 200, ${inSitemap.length} legacy`)
for (const s of sitemapStatus.filter((s) => s.status !== 200)) console.log(`  SITEMAP ${s.status} ${s.loc}`)
for (const path of inSitemap) console.log(`  SITEMAP lists legacy ${path}`)
if (process.argv.includes('--all')) for (const r of results) console.log(`${r.ok ? 'ok ' : 'BAD'} ${r.path}  ${r.hops}  ${r.target}`)
process.exitCode = bad.length || inSitemap.length || sitemapStatus.some((s) => s.status !== 200) ? 1 : 0
