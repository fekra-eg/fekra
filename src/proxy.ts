import { NextResponse, type NextRequest } from 'next/server'

import { DEFAULT_LOCALE, LOCALES, isLocale, isPublicLocale, negotiateLocale } from '@/i18n/routing'
import { isLocaleDocumentRequest } from '@/i18n/navigation'
import { isComingSoon } from '@/lib/site-mode'
import { cmsRoute, routeExists } from '@/lib/route-existence'
import { getDictionary } from '@/i18n/getDictionary'
import { dir, localeHref } from '@/i18n/routing'

const LOCALE_COOKIE = 'NEXT_LOCALE'

/**
 * Remember the locale the visitor is actually looking at — but only on a real
 * page load. The language switcher warms every other locale with
 * router.prefetch(), and those background requests come through here too: when
 * they write the cookie, the last prefetch to land decides where "/" goes, so
 * an explicit language choice is silently overwritten a moment after the click.
 *
 * `sec-fetch-dest` is the only signal that can tell them apart — Next strips
 * its own flight headers (rsc, next-router-prefetch) before the proxy runs. A
 * navigation is `document`; a prefetch or client-side RSC fetch is `empty`.
 * Clients that send no such header (curl, pre-16.4 Safari) count as
 * navigations, which is the old behaviour. Switching still sticks without a
 * document request: LanguageSwitcher writes the cookie itself on click.
 */
function remember(response: NextResponse, locale: string, request: NextRequest) {
  if (!isLocaleDocumentRequest(request.headers)) return response
  response.cookies.set(LOCALE_COOKIE, locale, { path: '/', sameSite: 'lax', maxAge: 31536000 })
  return response
}

/**
 * Holding-page mode. Opt-in via env so it can never switch itself on at launch:
 * an unset variable means the real site. The CMS (/admin, /cms-api) and the API
 * routes are already excluded by the matcher below, so editors keep working
 * while the public site is closed.
 */
const COMING_SOON = isComingSoon()
const SOON_PATH = '/coming-soon'

/**
 * Locale routing + staging indexing guard (Next 16 `proxy` convention).
 *
 * URL policy (see i18n/routing.ts): English is unprefixed, other locales are
 * prefixed. Internally every page renders under /[locale]/..., so unprefixed
 * requests are *rewritten* (URL stays clean) and /en/* is *redirected* away so
 * only one indexable URL exists per page (18.3).
 */
export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const requestHeaders = new Headers(request.headers)
  // Overwrite rather than trust a client-supplied value.
  requestHeaders.set('x-fekra-pathname', pathname)

  if (COMING_SOON) {
    // Rewrite, not redirect: every URL keeps working and starts serving the
    // real page the moment the flag is turned off, with nothing cached as a 3xx.
    if (pathname === SOON_PATH) return NextResponse.next()
    const response = NextResponse.rewrite(new URL(SOON_PATH, request.url))
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return response
  }

  // /en/about -> /about (301). Never leave two live URLs for the same content.
  if (pathname === `/${DEFAULT_LOCALE}` || pathname.startsWith(`/${DEFAULT_LOCALE}/`)) {
    const stripped = pathname.slice(`/${DEFAULT_LOCALE}`.length) || '/'
    return withGuards(NextResponse.redirect(new URL(stripped + search, request.url), 308), request)
  }

  const segment = pathname.split('/')[1]

  // A locale we no longer serve (see PUBLIC_LOCALES) folds back to the English
  // URL. 307, not 308: this is a policy that can be lifted, and a permanent
  // redirect would sit in browser caches long after it was.
  if (isLocale(segment) && !isPublicLocale(segment)) {
    return withGuards(NextResponse.redirect(new URL((pathname.slice(segment.length + 1) || '/') + search, request.url), 307), request)
  }

  const route = cmsRoute(pathname)
  // Draft previews keep their existing authenticated render path. Public
  // misses are answered before the layout can stream a misleading HTTP 200.
  if (route && !request.cookies.has('__prerender_bypass')) {
    const locale = isLocale(segment) ? segment : DEFAULT_LOCALE
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      const exists = await Promise.race([
        routeExists(route.collection, route.slug, locale),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('route_lookup_timeout')), 2000) }),
      ])
      if (!exists) return await notFoundResponse(locale)
    } catch {
      // Slow or failed lookup (a cold start's DB connect alone can pass 2s):
      // fall through and let the page render — it still calls notFound() on
      // a real miss. Answering 503 here served crawlers errors for live
      // articles (FK-07).
    } finally {
      clearTimeout(timer)
    }
  }

  // Already a prefixed locale (/ar/..., /de/...) — render as-is.
  if (isLocale(segment) && segment !== DEFAULT_LOCALE) {
    return withGuards(remember(NextResponse.next({ request: { headers: requestHeaders } }), segment, request), request)
  }

  // Bare "/" with a remembered or negotiated non-default locale -> send there once.
  if (pathname === '/' && isLocaleDocumentRequest(request.headers)) {
    const remembered = request.cookies.get(LOCALE_COOKIE)?.value
    const preferred = isLocale(remembered)
      ? remembered
      : negotiateLocale(request.headers.get('accept-language'))
    if (preferred !== DEFAULT_LOCALE && isPublicLocale(preferred)) {
      return withGuards(NextResponse.redirect(new URL(`/${preferred}${search}`, request.url), 307), request)
    }
  }

  // Unprefixed path -> render the English tree without changing the visible URL.
  // Remember the default locale too — otherwise a stale /ar cookie bounces "/"
  // back to Arabic forever and switching to English never sticks.
  const response = NextResponse.rewrite(new URL(`/${DEFAULT_LOCALE}${pathname}${search}`, request.url), { request: { headers: requestHeaders } })
  return withGuards(remember(response, DEFAULT_LOCALE, request), request)
}

async function notFoundResponse(locale: typeof DEFAULT_LOCALE | 'ar' | 'de' | 'fr' | 'es') {
  const status = 404
  const dict = await getDictionary(locale)
  const copy = dict.notFound
  const escape = (value: string) => value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
  return new NextResponse(`<!doctype html><html lang="${locale}" dir="${dir(locale)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${status} | FEKRA</title></head><body style="margin:0;background:#f2fafb;color:#153c48;font:18px Arial,sans-serif"><main style="min-height:100dvh;display:grid;place-content:center;padding:24px;text-align:center"><p style="font-size:64px;margin:0;font-weight:bold">${status}</p><h1>${escape(copy.title)}</h1><p>${escape(copy.body)}</p><a style="padding:16px;color:#075e70;font-weight:bold" href="${localeHref(locale, '/')}">${escape(copy.cta)}</a></main></body></html>`, {
    status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  })
}

/** Staging must never be indexable (3.4) — enforced at the edge, not in a meta tag. */
function withGuards(response: NextResponse, request: NextRequest) {
  if (process.env.NEXT_PUBLIC_ENV !== 'production') {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }
  response.headers.set('x-pathname', request.nextUrl.pathname)
  return response
}

export const config = {
  // Everything except Payload admin/API, Next internals, and files with an extension.
  matcher: ['/((?!api|cms-api|admin|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}

export const SUPPORTED = LOCALES
