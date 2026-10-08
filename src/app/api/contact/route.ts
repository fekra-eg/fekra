import { NextResponse, after } from 'next/server'

import { notify } from '@/lib/notify'
import { payloadClient } from '@/lib/payload'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { MIN_FILL_SECONDS, contactSchema, consultationSchema } from '@/lib/validation'
import { verifyBot } from '@/lib/bot-protection'

export const runtime = 'nodejs'

/**
 * Contact form endpoint (11.1 - 11.5 / 21.2).
 *
 * Order matters: rate limit, then bot traps, then schema. A bot that trips a
 * trap gets the same 200 a human gets — telling it why it failed just teaches
 * it to pass next time.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`contact:${clientIp(request)}`, 5, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'rate_limited', fields: { message: 'tooMany' } },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'bad_request' }, { status: 400 })

  const consultation = body.formKind === 'consultation'
  const consultationResult = consultation ? consultationSchema.safeParse(body) : null
  if (consultationResult && !consultationResult.success) {
    const fields = Object.fromEntries(consultationResult.error.issues.map((issue) => {
      const key = String(issue.path[0])
      return [key, key === 'phone' ? 'phone' : key === 'email' ? 'email' : 'required']
    }))
    return NextResponse.json({ error: 'invalid', fields }, { status: 422 })
  }
  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      fields[key] = issue.message === 'phone' ? 'phone' : key === 'email' ? 'email' : 'required'
    }
    return NextResponse.json({ error: 'invalid', fields }, { status: 422 })
  }

  const data = parsed.data

  // Honeypot filled, or submitted faster than a human can type: silently accept.
  const tooFast = data.startedAt ? (Date.now() - data.startedAt) / 1000 < MIN_FILL_SECONDS : false
  if (data.website || tooFast) return NextResponse.json({ ok: true })

  if (!await verifyBot(request, body, consultation ? 'consultation' : 'contact')) {
    return NextResponse.json({ error: 'verification_failed', fields: { botToken: 'required' } }, { status: 422 })
  }

  const payload = await payloadClient()

  try {
    const submission = await payload.create({
      collection: 'contact-submissions',
      // Public users have no Payload session; the route is the trust boundary.
      overrideAccess: true,
      // One flat row, one INSERT — the BEGIN/COMMIT Payload wraps it in are
      // two extra round-trips to a remote database protecting nothing. This
      // halved the time the visitor sits on "Sending…" (measured 355→180ms).
      disableTransaction: true,
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || undefined,
        company: data.company,
        subject: data.subject,
        message: data.message,
        locale: data.locale,
        sourcePath: data.sourcePath,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        referrer: data.referrer,
      },
    })

    /*
     * The record is stored — that is the whole of what the visitor is waiting
     * for. Looking up the recipients and sending the email is internal
     * follow-up, so it runs after the response: a slow database or mail
     * provider then costs an email, not a form stuck on "Sending…". `select`
     * keeps the lookup to the one column it needs instead of populating the
     * whole of site-settings across every locale.
     */
    after(async () => {
      try {
        const settings = await payload.findGlobal({
          slug: 'site-settings',
          depth: 0,
          select: { notificationEmails: true },
        })
        await notify(payload, {
          to: (settings.notificationEmails as string[] | undefined) ?? [],
          subject: `New contact: ${data.subject}`,
          replyTo: data.email,
          adminPath: `/admin/collections/contact-submissions/${submission.id}`,
          rows: [
            ['Name', data.fullName],
            ['Email', data.email],
            ['Phone', data.phone],
            ['Company', data.company],
            ['Message', data.message],
            ['Page', data.sourcePath],
            ['Campaign', data.utmCampaign],
          ],
        })
      } catch (error) {
        payload.logger.error({ err: error }, 'contact notification failed')
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    // 21.11 — the user gets a generic message, the detail stays in the log.
    payload.logger.error({ err: error }, 'contact submission failed')
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
