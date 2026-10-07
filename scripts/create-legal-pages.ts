/**
 * Creates /privacy-policy and /cookie-policy and wires them into the footer's
 * legalLinks slots — checklist 1.10 (supporting legal pages reachable, branded
 * and linked) and 21.7 (a clear privacy policy).
 *
 *   pnpm tsx scripts/create-legal-pages.ts          # dry run
 *   pnpm tsx scripts/create-legal-pages.ts --write  # apply
 *
 * The copy is written from what the site ACTUALLY does — the form schemas in
 * src/lib/validation.ts, the cookie in src/lib/consent.ts, and the providers in
 * .env.example — so the policy and the code cannot drift apart on the facts.
 *
 * FEKRA MUST CONFIRM before this counts as signed off (21.12): the retention
 * periods under "How long we keep it" are conservative defaults, not an agreed
 * policy — 24 months for enquiries, 12 months for applications. Change them in
 * the CMS (Pages -> Privacy Policy) if the business has decided otherwise.
 *
 * English only for now: availableLocales says so, which keeps hreflang and the
 * language switcher honest until translations are approved (14.9).
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const REVIEWED = '5 September 2026'

const text = (value: string, bold = false) => ({
  type: 'text', text: value, format: bold ? 1 : 0, style: '', mode: 'normal', detail: 0, version: 1,
})
const p = (value: string, bold = false) => ({
  type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr' as const, children: [text(value, bold)],
})
const h = (tag: 'h2' | 'h3', value: string) => ({
  type: 'heading', tag, format: '', indent: 0, version: 1, direction: 'ltr' as const, children: [text(value)],
})
const ul = (items: string[]) => ({
  type: 'list', listType: 'bullet', tag: 'ul', start: 1, format: '', indent: 0, version: 1, direction: 'ltr' as const,
  children: items.map((item, i) => ({
    type: 'listitem', value: i + 1, format: '', indent: 0, version: 1, direction: 'ltr' as const, children: [text(item)],
  })),
})
const doc = (children: unknown[]) => ({
  root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr' as const, children },
})

const privacy = doc([
  h('h2', 'Who we are'),
  p(
    'Fekra ("FEKRA", "we", "us") is a technology outsourcing and software engineering company headquartered in Cairo, Egypt. This policy explains what personal information we collect through this website, why we collect it, who processes it for us, and the choices you have. Questions about anything here go to info@fekra-egy.com.',
  ),

  h('h2', 'What we collect, and why'),
  h('h3', 'When you contact us'),
  p(
    'The contact form asks for your full name, email address, subject and message, and optionally your phone number and company. We use it to answer your enquiry and to follow up about the work you asked about. The legal basis is your consent, given when you submit the form, together with our legitimate interest in replying to business enquiries.',
  ),
  h('h3', 'When you apply for a role'),
  p(
    'A job application asks for your full name, email address, phone number, where you are located and your CV, and optionally a LinkedIn profile. Internship applications also ask for your university, graduation year and area of interest; future-opportunity applications ask for the role you want and your skills. We use it to assess your application and contact you about the role you applied for, and about comparable roles unless you tell us not to. The legal basis is steps taken at your request before entering an employment relationship, together with your consent.',
  ),
  h('h3', 'When you subscribe to updates'),
  p(
    'The newsletter form collects your email address and nothing else. Every message we send includes a way to unsubscribe, and unsubscribing removes you from the list.',
  ),
  h('h3', 'When you book a meeting'),
  p(
    'Meeting booking is handled by Calendly. The name, email address and time you give in the booking widget go to Calendly as our scheduling provider and to us as the meeting organiser, under Calendly’s own privacy terms as well as this policy.',
  ),
  h('h3', 'Automatically, as you browse'),
  p(
    'When you send an enquiry we store the page you arrived on, the referring site and any UTM campaign parameters in your browser, so we know which campaign the enquiry came from. Our hosting provider records standard server logs, including IP address, which we use to keep the site available and to rate-limit abusive or automated traffic. Cookies are covered in our Cookie Policy, linked in the footer of every page.',
  ),

  h('h2', 'What we do not do'),
  ul([
    'We do not sell personal information, and we do not share it for anyone else’s marketing.',
    'We do not use it for automated decision-making or profiling.',
    'We do not load advertising or analytics trackers before you accept the matching cookies.',
  ]),

  h('h2', 'Who processes data for us'),
  p('We use a small number of established providers, each doing one job:'),
  ul([
    'Vercel — website hosting and content delivery.',
    'Supabase — the database and the private file storage that holds submitted CVs, hosted in the European Union.',
    'Resend — the transactional email that notifies our team about a new enquiry or application.',
    'Calendly — meeting scheduling, when you use the booking page.',
    'Google — Analytics and Tag Manager, only once you have accepted analytics cookies.',
    'LinkedIn — the Insight Tag for campaign measurement, only once you have accepted marketing cookies.',
  ]),
  p(
    'Some of these providers operate outside Egypt and the European Union. Where they do, the transfer relies on the provider’s standard contractual protections. We do not share your information with anyone else except where the law requires it.',
  ),

  h('h2', 'How long we keep it'),
  ul([
    'Enquiries sent through the contact form: up to 24 months after our last exchange with you.',
    'Job applications and CVs: up to 12 months from the date you applied, or sooner if you ask us to delete them.',
    'Newsletter subscriptions: until you unsubscribe.',
    'Analytics data: for the retention period configured in the analytics tool, once analytics is enabled.',
    'Server logs: for the short period our hosting provider retains them, for security and troubleshooting.',
  ]),

  h('h2', 'How we protect it'),
  ul([
    'The whole site is served over HTTPS, with HSTS, so traffic cannot be downgraded to an insecure connection.',
    'CVs are stored in a private bucket that is never publicly readable, and can only be opened through a link that expires within minutes.',
    'Uploads are checked by file type and size, and every form is validated on the server and rate-limited against abuse.',
    'Access to submitted data is limited to the FEKRA staff who need it to do their job.',
  ]),

  h('h2', 'Your rights'),
  p(
    'You can ask us for a copy of the personal information we hold about you, ask us to correct or delete it, ask us to restrict or object to how we use it, ask for it in a portable format, and withdraw consent at any time. Withdrawing consent does not affect anything we did lawfully before you withdrew it.',
  ),
  p(
    'To exercise any of these, email info@fekra-egy.com. We answer within 30 days. If you are in the European Union or the United Kingdom you also have the right to complain to your local data protection authority; in Egypt, to the competent authority under Law No. 151 of 2020.',
  ),

  h('h2', 'Children'),
  p(
    'This website is aimed at businesses and at professionals seeking work. It is not directed at children, and we do not knowingly collect information from anyone under 16.',
  ),

  h('h2', 'Changes to this policy'),
  p(
    `We update this page when what we do changes. The date at the top of the page is the last review date — currently ${REVIEWED}.`,
  ),

  h('h2', 'Contact'),
  p(
    'Fekra, Cairo, Egypt. Email info@fekra-egy.com, phone +20 110 113 3572. For anything about a job application, careers@fekra-egy.com reaches the same team.',
  ),
])

const cookies = doc([
  h('h2', 'What a cookie is here'),
  p(
    'A cookie is a small file a website stores in your browser. Some are needed for the site to work at all; the rest are optional and only load after you accept them. This page lists what this site uses, and how to change your mind.',
  ),

  h('h2', 'Strictly necessary'),
  ul([
    'fekra_consent — remembers your cookie choice so we do not ask on every page. Set for 6 months, then we ask again.',
    'payload-token — the login session for FEKRA staff using the content management system. It is never set for ordinary visitors.',
  ]),

  h('h2', 'Preferences'),
  ul([
    'Your light or dark theme choice is kept in your browser’s local storage. It stays on your device and is never sent to us or to anyone else.',
  ]),

  h('h2', 'Analytics — only with your consent'),
  ul([
    'Google Analytics 4 (_ga and _ga_* cookies, up to 2 years) measures which pages people read and which routes lead to an enquiry. It is loaded through Google Tag Manager.',
  ]),

  h('h2', 'Marketing — only with your consent'),
  ul([
    'The LinkedIn Insight Tag measures whether a LinkedIn campaign led to a visit or an enquiry.',
    'Calendly sets its own cookies when the booking widget is opened, to run the scheduling session.',
  ]),

  h('h2', 'How consent works on this site'),
  p(
    'Nothing in the analytics or marketing groups loads before you accept it. We use Google Consent Mode v2, which means the tags are told to store nothing until consent is granted, rather than being asked politely after the fact. Choosing "Essential only" leaves you with the strictly necessary cookies above.',
  ),
  p(
    'At the moment no analytics or marketing tool is switched on for this website. When one is, it will only run under the consent rules described here, and this page will be updated first.',
  ),

  h('h2', 'Changing your mind'),
  p(
    'Delete the fekra_consent cookie in your browser settings and the choice is asked again on your next visit. Your browser can also block or clear cookies for this site entirely; the pages will still work, since nothing but the strictly necessary cookies is required to read them.',
  ),

  h('h2', 'Contact'),
  p(
    'Questions about cookies or about anything in our Privacy Policy: info@fekra-egy.com. Fekra, Cairo, Egypt.',
  ),
])

const PAGES = [
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    label: 'Privacy Policy',
    lead: `How FEKRA collects, uses and protects personal information on this website. Last reviewed ${REVIEWED}.`,
    content: privacy,
    meta: {
      title: 'Privacy Policy | FEKRA',
      description:
        'What personal information FEKRA collects through this website, why we collect it, who processes it for us, how long we keep it and how to exercise your rights.',
    },
  },
  {
    slug: 'cookie-policy',
    title: 'Cookie Policy',
    label: 'Cookie Policy',
    lead: `Which cookies this site sets, which ones are optional, and how to change your choice. Last reviewed ${REVIEWED}.`,
    content: cookies,
    meta: {
      title: 'Cookie Policy | FEKRA',
      description:
        'The cookies FEKRA uses — strictly necessary, preferences, analytics and marketing — how consent is handled under Google Consent Mode v2, and how to change your mind.',
    },
  },
]

async function run() {
  const write = process.argv.includes('--write')
  const payload = await getPayload({ config })

  const ids: Record<string, number | string> = {}

  for (const page of PAGES) {
    console.log(`/${page.slug} — hero + richText (${(page.content.root.children as unknown[]).length} nodes)`)
    if (!write) continue

    const data = {
      title: page.title,
      layout: [
        { blockType: 'hero', heading: page.title, body: page.lead },
        { blockType: 'richText', width: 'prose', content: page.content },
      ],
      availableLocales: ['en'],
      meta: page.meta,
      _status: 'published',
    }

    const existing = (
      await payload.find({ collection: 'pages', where: { slug: { equals: page.slug } }, limit: 1, depth: 0 })
    ).docs[0]
    const saved = existing
      ? await payload.update({ collection: 'pages', id: existing.id, data: data as never })
      : await payload.create({ collection: 'pages', data: { ...data, slug: page.slug } as never })

    const check = await payload.findByID({ collection: 'pages', id: saved.id, depth: 0 })
    if (check._status !== 'published') throw new Error(`/${page.slug} left as "${check._status}".`)
    ids[page.slug] = saved.id
    console.log(`  id ${saved.id}, ${check._status}`)
  }

  if (!write) {
    console.log('\nFooter legalLinks would be set to: ' + PAGES.map((x) => x.label).join(', '))
    console.log('Dry run. Re-run with --write to apply.')
    process.exit(0)
  }

  // The footer already renders legalLinks (Footer.tsx); they were simply empty.
  await payload.updateGlobal({
    slug: 'footer',
    data: {
      legalLinks: PAGES.map((page) => ({
        link: { type: 'internal', label: page.label, reference: { relationTo: 'pages', value: ids[page.slug] } },
      })),
    } as never,
  })

  const footer = await payload.findGlobal({ slug: 'footer', depth: 0 })
  console.log(`\nFooter legalLinks: ${(footer as { legalLinks?: unknown[] }).legalLinks?.length ?? 0}`)
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
