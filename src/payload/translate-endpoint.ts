import type { Endpoint } from 'payload'

import { LOCALES, type Locale } from '@/i18n/routing'

type Target = Exclude<Locale, 'en'>

/**
 * POST /api/<collection>/:id/translate — English -> each locale that is still empty, saved as a draft
 * for review. Edited translations are kept (DEV-07); `{ overwrite: ['de'] }` retranslates one on purpose.
 */
export function translateEndpoint(
  collection: 'posts' | 'jobs',
  translate: (doc: never, locale: Target) => Promise<Record<string, unknown>>,
): Endpoint {
  return {
    path: '/:id/translate',
    method: 'post',
    handler: async (req) => {
      if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
      const id = String(req.routeParams?.id ?? '')
      const doc = await req.payload.findByID({
        collection, id, locale: 'en', fallbackLocale: false, draft: true, depth: 0,
      })
      const body = (await req.json?.().catch(() => ({}))) as { overwrite?: unknown } | undefined
      const overwrite = new Set(Array.isArray(body?.overwrite) ? body.overwrite.map(String) : [])
      // Every locale's title at once: a translation exists once it is published or differs from English.
      const titles = (await req.payload.findByID({
        collection, id, locale: 'all', fallbackLocale: false, draft: true, depth: 0, select: { title: true },
      })).title as unknown as Partial<Record<Locale, string>>
      const others = LOCALES.filter((locale): locale is Target => locale !== 'en')
      const hasTranslation = (locale: Locale) =>
        (doc.availableLocales ?? []).includes(locale) || Boolean(titles?.[locale]?.trim() && titles[locale]!.trim() !== doc.title.trim())
      const skipped = others.filter((locale) => !overwrite.has(locale) && hasTranslation(locale))
      const targets = others.filter((locale) => !skipped.includes(locale))
      if (!targets.length) return Response.json({ translated: [], failed: [], skipped })
      // Translate in parallel, save one at a time: concurrent draft saves on one document would race.
      const results = await Promise.allSettled(targets.map((locale) => translate(doc as never, locale)))
      const translated: string[] = []
      const failed: { locale: string; error: string }[] = []
      for (const [i, result] of results.entries()) {
        const locale = targets[i]!
        if (result.status === 'rejected') {
          failed.push({ locale, error: String(result.reason instanceof Error ? result.reason.message : result.reason) })
          continue
        }
        try {
          await req.payload.update({ collection, id, locale, draft: true, data: result.value })
          translated.push(locale)
        } catch (error) {
          failed.push({ locale, error: error instanceof Error ? error.message : String(error) })
        }
      }
      if (translated.length) {
        const available = new Set([...(doc.availableLocales ?? ['en']), 'en', ...translated])
        await req.payload.update({
          collection, id, draft: true,
          data: { availableLocales: LOCALES.filter((locale) => available.has(locale)) },
        })
      }
      if (failed.length) req.payload.logger.error({ failed }, `Translation failed for ${collection} ${id}`)
      return Response.json({ translated, failed, skipped }, { status: translated.length ? 200 : 502 })
    },
  }
}
