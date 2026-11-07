import { NextResponse } from 'next/server'
import { payloadClient } from '@/lib/payload'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { newsletterSchema } from '@/lib/validation'
import { verifyBot } from '@/lib/bot-protection'
import { NEWSLETTER_CONSENT_VERSION, newsletterCopy, newsletterLocale, newsletterToken } from '@/lib/newsletter'
import { siteUrl } from '@/lib/urls'

export const runtime = 'nodejs'

/** One normalized subscriber per email, explicit consent, then double opt-in. */
export async function POST(request: Request) {
  const limit = rateLimit(`newsletter:${clientIp(request)}`, 5, 60_000)
  if (!limit.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } })
  const body = await request.json().catch(() => null)
  const parsed = newsletterSchema.safeParse({ ...body, consent: body?.consent === true || body?.consent === 'on' })
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 422 })
  if (parsed.data.website) return NextResponse.json({ ok: true })
  if (!await verifyBot(request, body, 'newsletter')) return NextResponse.json({ error: 'verification_failed' }, { status: 422 })
  const payload = await payloadClient()
  const email = parsed.data.email.trim().toLowerCase()
  const locale = newsletterLocale(parsed.data.locale)
  try {
    if (!process.env.RESEND_API_KEY) throw new Error('Newsletter delivery is not configured')
    const lookup = () => payload.find({ collection: 'newsletter-subscribers', where: { email: { equals: email } }, depth: 0, limit: 1, pagination: false })
    let subscriber = (await lookup()).docs[0]
    if (subscriber?.status === 'subscribed') return NextResponse.json({ ok: true })
    const data = { email, status: 'pending' as const, consentAt: new Date().toISOString(), consentVersion: NEWSLETTER_CONSENT_VERSION, confirmedAt: null, locale, sourcePath: parsed.data.path }
    if (subscriber) {
      subscriber = await payload.update({ collection: 'newsletter-subscribers', id: subscriber.id, data, depth: 0 })
    } else {
      try { subscriber = await payload.create({ collection: 'newsletter-subscribers', data, depth: 0 }) }
      catch (error) { subscriber = (await lookup()).docs[0]; if (!subscriber) throw error }
    }
    const confirm = `${siteUrl()}/api/newsletter/confirm?token=${newsletterToken(subscriber.id, 'confirm')}`
    const unsubscribe = `${siteUrl()}/api/newsletter/unsubscribe?token=${newsletterToken(subscriber.id, 'unsubscribe')}`
    const copy = newsletterCopy[locale]
    await payload.sendEmail({ to: email, subject: `FEKRA — ${copy.confirm}`,
      html: `<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}"><body><p>${copy.check}</p><p><a href="${confirm}">${copy.confirm}</a></p><p><a href="${unsubscribe}">${copy.unsubscribe}</a></p></body></html>`,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    payload.logger.error({ err: error }, 'newsletter signup failed')
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
