import assert from 'node:assert/strict'
import { chromium, firefox, webkit } from '@playwright/test'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'

const base = process.env.REVIEW_BASE_URL || 'http://localhost:3012'
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Use an isolated local QA server')
const output = process.env.REVIEW_OUTPUT || '/private/tmp/fekra-review-browser'
mkdirSync(output, { recursive: true })
const axe = readFileSync('node_modules/axe-core/axe.min.js', 'utf8')
const results = []
const defects = []
const engines = process.env.REVIEW_ENGINES?.split(',') || ['chrome', 'firefox', 'webkit']
const locales = process.env.REVIEW_LOCALES?.split(',') || ['en', 'ar', 'de', 'fr', 'es']
for (const engine of engines) {
  const browser = engine === 'chrome' ? await chromium.launch({ channel: 'chrome' }) : await ({ firefox, webkit })[engine].launch()
  const context = await browser.newContext({ viewport: { width: 320, height: 740 }, reducedMotion: 'reduce', timezoneId: 'Africa/Cairo' })
  // UI checks do not complete or simulate a Turnstile widget. The separate
  // HTTP journeys exercise real form handlers against the provider mocks.
  await context.route('https://challenges.cloudflare.com/**', (route) => route.abort())
  for (const locale of locales) {
    const prefix = locale === 'en' ? '' : `/${locale}`
    for (const path of ['/services', '/services/hire-react-developers', '/contact', '/careers', '/blog', '/blog/what-is-staff-augmentation']) {
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      await context.clearCookies()
      const response = await page.goto(base + prefix + path, { waitUntil: 'networkidle' })
      const status = response.status()
      await page.locator('h1').first().waitFor()
      await page.addScriptTag({ content: axe })
      const name = `${engine}-${locale}-${path.replaceAll('/', '_')}`
      const initial = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]')
        return { bannerHeight: dialog?.getBoundingClientRect().height || 0, viewportHeight: innerHeight }
      })
      await page.evaluate(() => {
        document.cookie = 'fekra_consent=%7B%22analytics%22%3Afalse%2C%22marketing%22%3Afalse%7D; path=/'
        window.dispatchEvent(new CustomEvent('fekra:consent', { detail: { analytics: false, marketing: false } }))
      })
      const measures = await page.evaluate(() => ({
        width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        h1: document.querySelectorAll('main h1').length,
        header: document.querySelectorAll('body header').length,
        mainFocusable: document.querySelector('main')?.getAttribute('tabindex') === '-1',
        splitWords: document.documentElement.lang !== 'ar' ? document.querySelectorAll('main bdi').length : 0,
        clippedCtas: [...document.querySelectorAll('main .fk-button')].filter((e) => {
          const r = e.getBoundingClientRect(); return r.width && r.height && (r.left < -1 || r.right > innerWidth + 1 || e.scrollWidth > e.clientWidth + 2)
        }).map((e) => e.textContent.trim()),
        badImages: [...document.images].filter((e) => e.getBoundingClientRect().width && !e.hasAttribute('width') && !e.hasAttribute('height') && e.parentElement.getBoundingClientRect().height < 1).map((e) => e.currentSrc),
        tables: [...document.querySelectorAll('.fk-table-scroll')].every((e) => e.tabIndex === 0 && e.hasAttribute('aria-label')),
      }))
      for (const theme of ['light', 'dark']) {
        await page.evaluate((dark) => { document.documentElement.classList.toggle('dark', dark) }, theme === 'dark')
        await page.waitForTimeout(300)
        const violations = await page.evaluate(async () => (await window.axe.run(document.querySelector('main'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.slice(0, 5).map((n) => n.target), count: nodes.length })))
        if (violations.some((v) => ['serious', 'critical'].includes(v.impact))) defects.push({ name, theme, violations })
        if (engine === 'chrome' && (locale === 'es' || locale === 'ar') && ['/services/hire-react-developers', '/blog/what-is-staff-augmentation'].includes(path)) await page.screenshot({ path: `${output}/${name}-${theme}.png`, fullPage: true })
      }
      const pass = status === 200 && measures.h1 === 1 && measures.header > 0 && measures.mainFocusable && measures.scrollWidth <= measures.width + 1 && measures.clippedCtas.length === 0 && measures.tables && errors.length === 0 && initial.bannerHeight < initial.viewportHeight * .65
      results.push({ engine, locale, path, status, ...measures, ...initial, errors, pass })
      if (!pass) defects.push({ name, measures, initial, errors, status })
      console.log(pass ? 'PASS' : 'FAIL', name)
      await page.close()
    }
  }
  await browser.close()
}
writeFileSync(`${output}/results.json`, JSON.stringify({ results, defects }, null, 2))
console.log(JSON.stringify({ pages: results.length, failedPages: results.filter((r) => !r.pass).length, accessibilityOrLayoutFindings: defects.length }))
assert.equal(defects.length, 0, `See ${output}/results.json`)
