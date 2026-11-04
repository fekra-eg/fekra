import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { isLocalDatabase } from '../src/lib/site-mode'
import { newsletterToken } from '../src/lib/newsletter'

if (!isLocalDatabase() || process.env.NEXT_PUBLIC_ENV === 'production' || !process.env.HTTPS_PROXY) throw new Error('Run only with the isolated QA database and provider simulation')
const base = 'http://localhost:3012'
const payload = await getPayload({ config })
let seq = 0
const headers = () => ({ 'content-type': 'application/json', 'x-forwarded-for': `192.0.2.${++seq}` })
async function verification(action: string) {
  const response = await fetch(`${base}/api/bot-challenge?action=${action}`, { headers: headers() })
  assert.equal(response.status, 200)
  const body = await response.json()
  const encoded = body.challenge ?? body.token ?? body.botChallenge
  const data = JSON.parse(Buffer.from(encoded.split('.')[0], 'base64url').toString())
  return { botChallenge: encoded, botAnswer: String(data.a + data.b), botToken: Buffer.from(JSON.stringify({ action, nonce: data.nonce })).toString('base64url') }
}
const post = (path: string, body: unknown) => fetch(base + path, { method: 'POST', headers: headers(), body: JSON.stringify(body) })
const jobs = (await payload.find({ collection: 'jobs', limit: 100, depth: 0 })).docs
const localeList = ['en', 'ar', 'de', 'fr', 'es'] as const
const stamp = Date.now()
for (const locale of localeList) {
  const common = { fullName: 'Synthetic QA', email: `qa-${stamp}-${locale}@example.invalid`, phone: '+201001234567', consent: true, locale, startedAt: Date.now() - 5000 }
  const contact = { ...common, subject: `QA ${locale}`, message: 'Synthetic review verification; no real enquiry.', sourcePath: `/${locale}/contact` }
  for (const action of ['contact', 'consultation']) {
    const result = await post('/api/contact', { ...contact, ...(action === 'consultation' ? { formKind: 'consultation', model: 'Full Time' } : {}), ...await verification(action) })
    assert.equal(result.status, 200, `${locale} ${action}: ${await result.text()}`)
  }
  for (const job of [jobs.find((j) => !['internship-program', 'future-opportunities'].includes(j.slug))!, jobs.find((j) => j.slug === 'internship-program')!, jobs.find((j) => j.slug === 'future-opportunities')!]) {
    const form = new FormData()
    for (const [key, value] of Object.entries({ ...common, consent: 'on', jobId: String(job.id), ...await verification('application') })) form.set(key, String(value))
    form.set('cv', new File([readFileSync('postman/fixtures/sample-cv.pdf')], 'qa.pdf', { type: 'application/pdf' }))
    const result = await fetch(`${base}/api/apply`, { method: 'POST', headers: { 'x-forwarded-for': `198.51.100.${++seq}` }, body: form })
    assert.equal(result.status, 200, `${locale} ${job.slug}: ${await result.text()}`)
    const applications = await payload.find({ collection: 'job-applications', where: { and: [{ email: { equals: common.email } }, { job: { equals: job.id } }] }, depth: 0 })
    assert.equal(applications.docs.length, 1)
    assert.equal(applications.docs[0]!.locale, locale)
    const file = await payload.findByID({ collection: 'applicant-files', id: applications.docs[0]!.cv as number, depth: 0 })
    const anonymous = await fetch(`${base}/cms-api/applicant-files/file/${file.filename}`)
    assert.ok([401, 403, 404].includes(anonymous.status), `Anonymous CV access: ${anonymous.status}`)
  }
  const signup = { email: `newsletter-${stamp}-${locale}@example.invalid`, consent: true, locale, path: `/${locale}/blog` }
  for (let i = 0; i < 2; i++) {
    const response = await post('/api/newsletter', { ...signup, ...await verification('newsletter') })
    assert.equal(response.status, 200, await response.text())
  }
  const subscribers = await payload.find({ collection: 'newsletter-subscribers', where: { email: { equals: signup.email } } })
  assert.equal(subscribers.docs.length, 1)
  const subscriber = subscribers.docs[0]!
  assert.equal(subscriber.status, 'pending')
  assert.ok(subscriber.consentAt && subscriber.consentVersion)
  const url = `${base}/api/newsletter/confirm?token=${newsletterToken(subscriber.id, 'confirm')}`
  assert.equal((await fetch(url, { headers: headers() })).status, 200)
  assert.equal((await payload.findByID({ collection: 'newsletter-subscribers', id: subscriber.id })).status, 'pending')
  assert.equal((await fetch(url, { method: 'POST', headers: headers() })).status, 200)
  assert.equal((await payload.findByID({ collection: 'newsletter-subscribers', id: subscriber.id })).status, 'subscribed')
  assert.equal((await fetch(`${base}/api/newsletter/unsubscribe?token=${newsletterToken(subscriber.id, 'unsubscribe')}`, { method: 'POST', headers: headers() })).status, 200)
  assert.equal((await payload.findByID({ collection: 'newsletter-subscribers', id: subscriber.id })).status, 'unsubscribed')
  assert.equal((await fetch(url, { method: 'POST', headers: headers() })).status, 410)
  console.log(`PASS ${locale}: contact, consultation, job, internship, future, private CV, newsletter dedup/confirmation/unsubscribe`)
}
const rejected = await post('/api/newsletter', { email: 'no-consent@example.invalid' })
assert.equal(rejected.status, 422)
assert.equal((await fetch(base + '/api/newsletter/confirm?token=tampered')).status, 400)
console.log('PASS missing consent and tampered confirmation are rejected')
const mockUrl = process.env.REVIEW_RESEND_MOCK_URL
if (!mockUrl || !['localhost', '127.0.0.1'].includes(new URL(mockUrl).hostname)) throw new Error('Set REVIEW_RESEND_MOCK_URL to the local simulation member address')
const delivered = await (await fetch(`${mockUrl}/_qa/messages`)).json()
const thisRun = delivered.filter((message: { html: string; to: string | string[] }) => message.html.includes(String(stamp)) || String(message.to).includes(String(stamp)))
const hr = thisRun.filter((message: { to: string | string[] }) => String(message.to).includes('hr@example.invalid'))
assert.equal(hr.length, 15)
assert.ok(hr.every((message: { attachments?: { content?: string }[] }) => message.attachments?.length === 1 && message.attachments[0]?.content))
assert.equal(thisRun.length, 35)
console.log('PASS provider simulation: 35 accepted messages, 15 HR notifications with CV attachments; no real inbox delivery claimed')
await payload.destroy()
process.exit(0)
