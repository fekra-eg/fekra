import assert from 'node:assert/strict'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { isLocalDatabase } from '../src/lib/site-mode'
import { newsletterToken } from '../src/lib/newsletter'
if (!isLocalDatabase() || process.env.NEXT_PUBLIC_ENV === 'production') throw new Error('Local QA database only')
const payload = await getPayload({ config })
const base = 'http://localhost:3012'
const email = `resubscribe-${Date.now()}@example.invalid`
let sequence = 140
const headers = () => ({ 'content-type': 'application/json', 'x-forwarded-for': `203.0.113.${++sequence}` })
async function signup() {
  const challenge = await (await fetch(`${base}/api/bot-challenge?action=newsletter`, { headers: headers() })).json()
  const proof = JSON.parse(Buffer.from(challenge.challenge.split('.')[0], 'base64url').toString())
  const response = await fetch(`${base}/api/newsletter`, { method: 'POST', headers: headers(), body: JSON.stringify({ email: email.toUpperCase(), consent: true, locale: 'en', botChallenge: challenge.challenge, botAnswer: String(proof.a + proof.b), botToken: Buffer.from(JSON.stringify({ action: 'newsletter', nonce: proof.nonce })).toString('base64url') }) })
  assert.equal(response.status, 200, await response.text())
  return (await payload.find({ collection: 'newsletter-subscribers', where: { email: { equals: email } } })).docs[0]!
}
try {
  const first = await signup()
  const oldToken = newsletterToken(first.id, 'confirm')
  assert.equal((await fetch(`${base}/api/newsletter/confirm?token=${oldToken}`, { method: 'POST', headers: headers() })).status, 200)
  const confirmed = await payload.findByID({ collection: 'newsletter-subscribers', id: first.id })
  assert.ok(confirmed.confirmedAt)
  assert.equal((await fetch(`${base}/api/newsletter/unsubscribe?token=${newsletterToken(first.id, 'unsubscribe')}`, { method: 'POST', headers: headers() })).status, 200)
  const second = await signup()
  assert.equal(second.id, first.id)
  assert.equal(second.confirmedAt, null)
  assert.equal((await fetch(`${base}/api/newsletter/confirm?token=${oldToken}`, { method: 'POST', headers: headers() })).status, 400)
  assert.equal((await fetch(`${base}/api/newsletter/confirm?token=${newsletterToken(first.id, 'confirm')}`, { method: 'POST', headers: headers() })).status, 200)
  const final = await payload.findByID({ collection: 'newsletter-subscribers', id: first.id })
  assert.ok(new Date(final.confirmedAt!).getTime() > new Date(confirmed.confirmedAt!).getTime())
  console.log('PASS normalized email, resubscription reuses one record, clears old confirmation, rejects stale confirmation and records fresh opt-in')
} finally { await payload.destroy() }
process.exit(0)
