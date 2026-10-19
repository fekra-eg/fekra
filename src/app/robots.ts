import type { MetadataRoute } from 'next'

import { payloadClient } from '@/lib/payload'
import { isComingSoon } from '@/lib/site-mode'
import { siteUrl } from '@/lib/urls'

export const revalidate = 3600

/** Search/discovery crawlers — allowed unless FEKRA says otherwise (19.6/19.7). */
const SEARCH_BOTS = ['Googlebot', 'Googlebot-Image', 'Bingbot', 'DuckDuckBot', 'Applebot', 'YandexBot']

/** AI *search* crawlers — these drive citations, not model training (19.8). */
const AI_SEARCH_BOTS = ['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Claude-User']

/** AI *training* crawlers — a separate business decision (19.9). */
const AI_TRAINING_BOTS = ['GPTBot', 'CCBot', 'Google-Extended', 'anthropic-ai', 'ClaudeBot', 'Applebot-Extended']

const PRIVATE_PATHS = ['/admin', '/cms-api', '/api', '/api/preview']

const yn = (allowed: boolean) => (allowed ? 'yes' : 'no')

export default async function robots(): Promise<MetadataRoute.Robots> {
  // 3.4 — staging is never crawlable, whatever the CMS says.
  if (process.env.NEXT_PUBLIC_ENV !== 'production') {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  // robots.txt and sitemap.xml carry a file extension, so the proxy matcher
  // skips them and they would keep advertising pages that currently serve the
  // holding page. Close the whole site while it is behind that page (18.13).
  if (isComingSoon()) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  let policy = {
    allowSearchEngines: true,
    allowAiSearchBots: true,
    allowAiTrainingBots: false,
  }

  try {
    const payload = await payloadClient()
    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    policy = { ...policy, ...((settings.crawlerPolicy as typeof policy | undefined) ?? {}) }
  } catch {
    // Config unavailable — fall back to the documented default rather than
    // accidentally blocking everything.
  }

  const rules: MetadataRoute.Robots['rules'] = [
    {
      userAgent: '*',
      allow: '/',
      disallow: PRIVATE_PATHS,
      // contentsignals.org — the same policy as the per-bot rules below, for agents that read it.
      other: {
        'Content-Signal': `search=${yn(policy.allowSearchEngines)}, ai-input=${yn(policy.allowAiSearchBots)}, ai-train=${yn(policy.allowAiTrainingBots)}`,
      },
    },
    ...SEARCH_BOTS.map((bot) => ({
      userAgent: bot,
      ...(policy.allowSearchEngines ? { allow: '/', disallow: PRIVATE_PATHS } : { disallow: '/' }),
    })),
    ...AI_SEARCH_BOTS.map((bot) => ({
      userAgent: bot,
      ...(policy.allowAiSearchBots ? { allow: '/', disallow: PRIVATE_PATHS } : { disallow: '/' }),
    })),
    ...AI_TRAINING_BOTS.map((bot) => ({
      userAgent: bot,
      ...(policy.allowAiTrainingBots ? { allow: '/', disallow: PRIVATE_PATHS } : { disallow: '/' }),
    })),
  ]

  return { rules, sitemap: `${siteUrl()}/sitemap.xml`, host: siteUrl() }
}
