import { createHmac, timingSafeEqual } from 'node:crypto'
import { isLocale, type Locale } from '@/i18n/routing'

export const NEWSLETTER_CONSENT_VERSION = '2026-11-03'
type Purpose = 'confirm' | 'unsubscribe'
export { newsletterCopy } from '@/i18n/newsletter'

const signature = (value: string) => {
  if (!process.env.PAYLOAD_SECRET) throw new Error('PAYLOAD_SECRET is missing')
  return createHmac('sha256', process.env.PAYLOAD_SECRET).update(`newsletter:${value}`).digest('base64url')
}
export function newsletterToken(id: number | string, purpose: Purpose) {
  const value = Buffer.from(JSON.stringify({ id: String(id), purpose, issuedAt: Date.now(), exp: Date.now() + (purpose === 'confirm' ? 48 * 3600_000 : 365 * 86400_000) })).toString('base64url')
  return `${value}.${signature(value)}`
}
export function readNewsletterToken(token: string, purpose: Purpose): { id: string; issuedAt: number } | null {
  try {
    if (token.length > 1024) return null
    const [value, signed, extra] = token.split('.')
    if (!value || !signed || extra) return null
    const a = Buffer.from(signature(value)), b = Buffer.from(signed)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    const data = JSON.parse(Buffer.from(value, 'base64url').toString())
    return data.purpose === purpose && typeof data.exp === 'number' && data.exp > Date.now() && typeof data.issuedAt === 'number' && data.issuedAt <= Date.now() + 5000 && /^\d+$/.test(data.id) ? { id: data.id, issuedAt: data.issuedAt } : null
  } catch { return null }
}
export const newsletterLocale = (locale?: string | null) => isLocale(locale ?? undefined) ? locale as Locale : 'en'
