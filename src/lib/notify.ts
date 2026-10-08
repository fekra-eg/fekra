import type { Payload } from 'payload'

import { siteUrl } from './urls'

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

// Brand tokens from globals.css — email clients ignore CSS variables.
const BRAND = '#20a2bc'
const NAVY = '#273969'
const MUTED = '#687170'
const FONT = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif"

const button = (href: string, label: string, primary: boolean) =>
  `<a href="${escapeHtml(href)}" style="display:inline-block;padding:11px 20px;margin:0 8px 8px 0;border-radius:8px;${FONT};font-size:14px;font-weight:600;text-decoration:none;${
    primary ? `background:${BRAND};color:#ffffff` : `background:#ffffff;color:${NAVY};border:1px solid #d5dbe3`
  }">${escapeHtml(label)}</a>`

/** Table-based, inline-styled layout — the only markup Gmail and Outlook agree on. */
function render({ heading, rows, replyTo, adminPath }: {
  heading: string
  rows: [string, string | undefined][]
  replyTo?: string
  adminPath?: string
}) {
  const body = rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) => `<tr><td style="padding:14px 0;border-bottom:1px solid #eef1f4">
<div style="${FONT};font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:${MUTED};margin-bottom:4px">${escapeHtml(label)}</div>
<div style="${FONT};font-size:15px;line-height:1.55;color:#111827;white-space:pre-wrap;word-break:break-word">${escapeHtml(String(value))}</div>
</td></tr>`,
    )
    .join('')

  const actions = [
    replyTo && button(`mailto:${replyTo}`, 'Reply', true),
    adminPath && button(`${siteUrl()}${adminPath}`, 'Open in admin', !replyTo),
  ].filter(Boolean).join('')

  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f6f8">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e9ef">
<tr><td style="background:${NAVY};padding:22px 28px;border-bottom:4px solid ${BRAND}">
<img src="${siteUrl()}/images/email-logo.png" width="130" height="38" alt="Fekra" style="display:block;border:0;height:38px;width:130px;${FONT};font-size:20px;font-weight:700;color:#ffffff">
</td></tr>
<tr><td style="padding:28px 28px 8px">
<h1 style="margin:0 0 4px;${FONT};font-size:20px;line-height:1.35;color:${NAVY}">${escapeHtml(heading)}</h1>
<p style="margin:0;${FONT};font-size:13px;color:${MUTED}">Received ${new Date().toUTCString()}</p>
</td></tr>
<tr><td style="padding:8px 28px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${body}</table></td></tr>
${actions ? `<tr><td style="padding:20px 28px 20px">${actions}</td></tr>` : ''}
<tr><td style="padding:16px 28px;background:#f9fafb;${FONT};font-size:12px;color:${MUTED}">Sent automatically by ${escapeHtml(siteUrl().replace(/^https?:\/\//, ''))}</td></tr>
</table></td></tr></table></body></html>`
}

/**
 * Internal notifications (10.6 / 11.4). Delivery failure never fails the
 * submission — the record is already in the database, so we log and move on
 * rather than showing the user an error for something that did work.
 */
export async function notify(
  payload: Payload,
  { to, subject, rows, replyTo, adminPath }: {
    to: string[]
    subject: string
    rows: [string, string | undefined][]
    /** The submitter's address — "Reply" in the inbox goes straight to them. */
    replyTo?: string
    /** e.g. `/admin/collections/job-applications/12` — becomes an "Open in admin" button. */
    adminPath?: string
  },
): Promise<void> {
  if (!to.length) {
    payload.logger.warn(`No notification recipients configured for "${subject}"`)
    return
  }

  try {
    await payload.sendEmail({
      to: to.join(','),
      subject,
      replyTo,
      html: render({ heading: subject, rows, replyTo, adminPath }),
    })
  } catch (error) {
    payload.logger.error({ err: error }, `Failed to send notification "${subject}"`)
  }
}
