import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto'

export type BotAction = 'contact' | 'consultation' | 'application' | 'newsletter'
const actions: BotAction[] = ['contact', 'consultation', 'application', 'newsletter']
const secret = () => process.env.TURNSTILE_SECRET_KEY
const signature = (value: string) => createHmac('sha256', secret()!).update(value).digest('base64url')

export function createChallenge(action: string) {
  if (!secret() || !actions.includes(action as BotAction)) return null
  const a = randomInt(1, 10), b = randomInt(1, 10)
  const nonce = randomUUID()
  const payload = Buffer.from(JSON.stringify({ a, b, nonce, action, expires: Date.now() + 300_000 })).toString('base64url')
  return { a, b, nonce, challenge: `${payload}.${signature(payload)}` }
}

/** Fail closed before any database write or notification. Turnstile tokens are
 * single-use; action + cdata bind the token to this signed, expiring challenge. */
export async function verifyBot(request: Request, body: Record<string, unknown>, action: BotAction) {
  const reject = (reason: string) => { console.warn(`[bot-protection] ${action} rejected: ${reason}`); return false }
  if (!secret()) return reject('TURNSTILE_SECRET_KEY is not set')
  try {
    if (typeof body.botChallenge !== 'string' || body.botChallenge.length > 2048) return reject('missing challenge')
    const [payload, signed, extra] = body.botChallenge.split('.')
    if (!payload || !signed || extra) return reject('malformed challenge')
    const expected = Buffer.from(signature(payload)), received = Buffer.from(signed)
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return reject('bad challenge signature')
    const challenge = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (challenge.action !== action || challenge.expires < Date.now() || challenge.expires > Date.now() + 300_000) return reject('challenge expired or for another form')
    if (typeof body.botAnswer !== 'string' || !/^\d{1,2}$/.test(body.botAnswer.trim()) || Number(body.botAnswer) !== challenge.a + challenge.b) return reject('wrong math answer')
    if (typeof body.botToken !== 'string' || !body.botToken || body.botToken.length > 2048) return reject('missing Turnstile token')
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: secret()!, response: body.botToken }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) return reject(`siteverify HTTP ${response.status}`)
    const result = await response.json() as { success?: boolean; action?: string; cdata?: string; hostname?: string; 'error-codes'?: string[] }
    if (result.success !== true) return reject(`Turnstile failed: ${result['error-codes']?.join(',') || 'unknown'} (site key and secret key from the same widget?)`)
    if (result.action !== action || result.cdata !== challenge.nonce) return reject('Turnstile token not bound to this challenge')
    // The host the visitor actually used (behind Vercel's proxy, request.url can differ) plus any configured extras.
    const requestHost = (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? new URL(request.url).host).split(',')[0]!.trim().replace(/:\d+$/, '')
    const hosts = [requestHost, ...(process.env.TURNSTILE_HOSTNAMES ?? '').split(',').map((host) => host.trim())].filter(Boolean)
    if (!hosts.includes(result.hostname ?? '')) return reject(`hostname ${result.hostname} not in ${hosts.join(',')}`)
    return true
  } catch (error) {
    return reject(`error ${error instanceof Error ? error.message : String(error)}`)
  }
}
