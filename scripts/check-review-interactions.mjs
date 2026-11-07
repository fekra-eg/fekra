import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
const base = 'http://localhost:3012'
const output = '/private/tmp/fekra-review-interactions'
mkdirSync(output, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
const results = []
for (const locale of ['en', 'ar']) {
  const prefix = locale === 'en' ? '' : `/${locale}`
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', recordVideo: { dir: output, size: { width: 390, height: 844 } } })
  await context.route('https://challenges.cloudflare.com/**', (route) => route.abort())
  const page = await context.newPage()
  await page.goto(`${base}${prefix}/contact`)
  const form = page.locator('form').filter({ has: page.locator('[name=fullName]') }).first()
  await form.locator('[name=email]').fill('invalid')
  await form.locator('[name=email]').blur()
  await page.waitForTimeout(150)
  assert.equal(await form.locator('[name=email]').getAttribute('aria-invalid'), 'true')
  await form.locator('[name=email]').fill('qa@example.invalid')
  await form.locator('[name=email]').blur()
  assert.equal(await form.locator('[name=email]').getAttribute('aria-invalid'), 'false')
  await form.locator('[name=fullName]').fill('Synthetic QA')
  await form.locator('[name=subject]').fill('QA validation')
  await form.locator('[name=message]').fill('Synthetic browser validation. Do not send.')
  await form.locator('[name=consent]').check()
  await form.locator('[data-bot-verification]').scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)
  assert.ok(await form.locator('[data-bot-verification] [role=alert]').count())
  assert.equal(await form.locator('[data-bot-verification] a').getAttribute('href'), '#contact-details')
  assert.ok(await form.locator('button[type=submit]').isDisabled())
  await page.screenshot({ path: `${output}/${locale}-blocked-verification.png` })
  results.push({ locale, test: 'field errors clear; blocked verification keeps submit disabled and provides retry/contact', pass: true })
  await page.goto(`${base}${prefix}/services/hire-react-developers`)
  await page.locator('header button[aria-haspopup=menu]').click()
  const nextLocale = locale === 'en' ? 'ar' : 'es'
  await page.getByRole('menuitem', { name: locale === 'en' ? 'العربية' : 'Español', exact: true }).click()
  await page.waitForURL(`**/${nextLocale}/services/hire-react-developers`)
  assert.equal(await page.locator('html').getAttribute('lang'), nextLocale)
  await page.reload()
  assert.equal(await page.locator('html').getAttribute('lang'), nextLocale)
  results.push({ locale, test: 'language switch preserves service path and refresh state', pass: true })
  await context.close()
}
for (const locale of ['en', 'ar']) for (const theme of ['light', 'dark']) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' })
  await context.route('https://challenges.cloudflare.com/**', (route) => route.abort())
  const page = await context.newPage()
  await page.goto(`${base}${locale === 'en' ? '' : `/${locale}`}/services/hire-react-developers`)
  await page.evaluate((dark) => document.documentElement.classList.toggle('dark', dark), theme === 'dark')
  const controls = page.locator('button[data-process-control]:not([aria-hidden])')
  await controls.first().scrollIntoViewIfNeeded()
  await controls.first().click()
  const count = await controls.count()
  const states = []
  const start = Date.now()
  while (Date.now() - start < count * 3000 + 1800) {
    const active = await controls.evaluateAll((nodes) => nodes.findIndex((node) => node.getAttribute('aria-current') === 'step' || node.getAttribute('aria-pressed') === 'true'))
    if (states.at(-1)?.active !== active) states.push({ active, ms: Date.now() - start })
    await page.waitForTimeout(120)
  }
  writeFileSync(`${output}/${locale}-${theme}-process-states.json`, JSON.stringify(states, null, 2))
  assert.ok(states.some((state) => state.active === count - 1), 'Final Done state must be visited')
  assert.ok(states.some((state, index) => index > 0 && state.active === 0), 'Process must loop')
  await controls.nth(1).click()
  await page.waitForTimeout(3200)
  assert.equal(await controls.nth(2).getAttribute('aria-current'), 'step')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await controls.first().click()
  await page.waitForTimeout(3300)
  assert.equal(await controls.first().getAttribute('aria-current'), 'step')
  results.push({ locale, theme, test: 'process dwell, final state, loop, manual resume, reduced motion', states, pass: true })
  await context.close()
}
await browser.close()
writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2))
console.log(`PASS ${results.length} interaction scenarios; evidence in ${output}`)
