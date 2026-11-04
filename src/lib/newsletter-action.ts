import { payloadClient } from './payload'
import { newsletterCopy, newsletterLocale, readNewsletterToken } from './newsletter'
import { clientIp, rateLimit } from './rate-limit'
import { localeHref } from '@/i18n/routing'

/** GET displays a form: email link scanners cannot confirm or unsubscribe. */
export async function newsletterAction(request: Request, purpose: 'confirm' | 'unsubscribe') {
  const token = new URL(request.url).searchParams.get('token') ?? ''
  const proof = readNewsletterToken(token, purpose)
  const headers = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' }
  if (!proof) return new Response('Invalid or expired link.', { status: 400, headers })
  const { id } = proof
  if (!rateLimit(`newsletter-action:${clientIp(request)}`, 20, 60_000).ok) return new Response('Please try later.', { status: 429, headers })
  try {
    const payload = await payloadClient()
    const subscriber = await payload.findByID({ collection: 'newsletter-subscribers', id, depth: 0 })
    const locale = newsletterLocale(subscriber.locale)
    const copy = newsletterCopy[locale]
    if (purpose === 'confirm' && subscriber.status === 'unsubscribed') return new Response('Please subscribe again to receive a new confirmation link.', { status: 410, headers })
    if (purpose === 'confirm' && proof.issuedAt < new Date(subscriber.consentAt).getTime()) return new Response('Please use the latest confirmation email.', { status: 400, headers })
    if (request.method === 'POST') {
      await payload.update({ collection: 'newsletter-subscribers', id, data: purpose === 'confirm'
        ? { status: 'subscribed', confirmedAt: subscriber.confirmedAt || new Date().toISOString() }
        : { status: 'unsubscribed', unsubscribedAt: new Date().toISOString() } })
    }
    const label = request.method === 'POST' ? copy[purpose === 'confirm' ? 'confirmed' : 'unsubscribed'] : copy[purpose]
    return new Response(`<!doctype html><html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${label} | FEKRA</title><body style="font:18px system-ui;margin:0;background:#f2fafb;color:#153c48"><main style="max-width:600px;margin:10vh auto;padding:24px"><h1>${label}</h1>${request.method === 'GET' ? `<form method="post"><button style="min-height:44px;padding:12px 24px;background:#146676;color:white;border:0;border-radius:24px">${label}</button></form>` : `<a href="${localeHref(locale, '/')}">FEKRA</a>`}</main></body></html>`, { headers })
  } catch { return new Response('Please try again later.', { status: 503, headers }) }
}
