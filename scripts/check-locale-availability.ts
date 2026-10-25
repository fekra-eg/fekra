/**
 * T-01 / FK-25 / T-17 self-check: untranslated documents link their English
 * page, and the services menu lists each URL once.
 *
 *   npx tsx scripts/check-locale-availability.ts
 */
import assert from 'node:assert/strict'

import { availableHref, servesLocale } from '../src/i18n/routing'
import { buildServicesMenu, relatedRoleSlugs } from '../src/lib/services-menu'

assert.equal(servesLocale(null, 'en'), true)
assert.equal(servesLocale(null, 'de'), false)
assert.equal(servesLocale(['en', 'ar'], 'ar'), true)

const availability = { '/services/hire-react-developers': ['en', 'ar'] as ('en' | 'ar')[] }
assert.equal(availableHref('de', '/services/hire-react-developers', availability), '/services/hire-react-developers')
assert.equal(availableHref('ar', '/services/hire-react-developers', availability), '/ar/services/hire-react-developers')
assert.equal(availableHref('de', '/about', availability), '/de/about')

const slugs = [
  'hire-in-demand-developers', 'hire-front-end-developers', 'hire-back-end-developers', 'hire-full-stack-developers',
  'hire-ai-data-experts', 'hire-mobile-app-developers', 'hire-qa-engineers', 'hire-devops-cloud-engineers',
  'hire-react-developers', 'hire-angular-developers', 'hire-python-developers', 'hire-mern-stack-developers', 'hire-ai-engineers',
]
const services = slugs.map((slug) => ({
  slug,
  title: slug.replace(/^hire-/, 'Hire ').replace(/-/g, ' '),
  menuRoles: slug === 'hire-in-demand-developers'
    ? [{ label: 'AI Developer' }, { label: 'MEAN Stack Developers' }, { label: 'Data Engineers' }, { label: 'Full-Stack Developers' }, { label: 'MERN Stack Developers' }, { label: 'Python Developers' }]
    : slug === 'hire-ai-data-experts' ? [{ label: 'AI Engineers' }] : [],
}))

for (const locale of ['en', 'ar', 'de'] as const) {
  const menu = buildServicesMenu(services, locale, availability)
  // Role pages may repeat across groups (In-Demand cross-links them); within a
  // group each link appears once, and no role repeats its own heading.
  for (const group of menu) {
    const hrefs = group.roles.map((role) => role.href)
    assert.equal(new Set(hrefs).size, hrefs.length, `duplicate role href in ${locale} ${group.slug}: ${hrefs}`)
    assert.ok(!hrefs.includes(group.href), `role repeats its heading in ${locale} ${group.slug}: ${hrefs}`)
  }
  const react = menu.flatMap((g) => g.roles).find((role) => role.slug === 'hire-react-developers')
  assert.equal(react?.href, locale === 'de' ? '/services/hire-react-developers' : locale === 'ar' ? '/ar/services/hire-react-developers' : '/services/hire-react-developers')
}

assert.deepEqual(relatedRoleSlugs(services, 'hire-react-developers'), ['hire-angular-developers'])
console.log('locale availability checks passed')
