# Launch Severity Register

Checklist 24.15. Status as of **14 Oct 2026**, checked against master `280f493` and the live
site www.fekra-egy.com.

## Gate rules

| Severity | Meaning | Gate |
| --- | --- | --- |
| **Critical** | Security exposure, data loss, or a core journey broken for most visitors | Prohibits launch. Fix immediately. |
| **Major** | A key requirement not met or not proven, with real user, SEO or business impact | Fix before sign-off, or FEKRA approves in writing |
| **Minor** | Cosmetic, low-impact, or depends on FEKRA content | May go on the approved post-launch list |

The site went live in early October 2026, before this register existed. S-01 is therefore an
emergency fix on a live site, not a pre-launch item.

## Open items

| ID | Severity | Item | Checklist | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| S-01 | **Critical** | `pnpm audit --prod`: 63 advisories, 7 critical and 28 high. Includes Next.js remote code execution (image optimization / next/og) and Payload SQL injection. Upgrade `next` and `payload` + `@payloadcms/*` to patched versions, rebuild, re-audit. | 3.8, 24.11 | Developer | Open |
| S-02 | Major | Every HTML page is served `private, no-store` and is never cached by the CDN, so each visit is rendered in Frankfurt and queries the database in Stockholm. Regional probes measured time to first byte of 0.35–3.1 s. Restore static/ISR caching. | 17.4, 17.10 | Developer | Open |
| S-03 | Major | Mobile Lighthouse below the 90 target on services (78), careers (73), blog (84), contact (85). Desktop is 95–100 on every page. Largely caused by S-02. | 17.2, 17.3, 24.9 | Developer | Open |
| S-04 | Major | Service pages declare hreflang `en` + `x-default` only, although `/ar`, `/de`, `/fr`, `/es` versions are live, indexable and self-canonical. Set the service documents' available locales. | 14.8, 19.11 | Developer | Open |
| S-05 | Major | No live end-to-end test yet of the contact form, careers application (with CV email attachment) and Calendly booking on production. | 10.6, 11.4, 24.3, 24.4 | Developer + FEKRA | Open |
| S-06 | Major | Ownership and access not yet transferred to FEKRA (repository, Vercel, domain/DNS, Supabase, Resend, GA4, Search Console, Calendly, CMS admin). See the handover access table. | 25.8 | Developer + FEKRA | Open |
| S-07 | Major | No browser/device matrix run (Chrome, Edge, Firefox, Safari, iOS Safari, Android Chrome). | 16.9, 23.6, 23.7, 24.8 | QA | Open |
| S-08 | Major | FEKRA content decisions pending: Fika audience (QA-009), testimonial permissions (QA-019), native review of DE/FR/ES copy (QA-017), written approval of the 91-URL sitemap (1.1). | 1.1, 13.2, 24.13 | FEKRA | Waiting on FEKRA |
| S-09 | Minor | No branch protection; changes are committed straight to `master`. | 3.3, 25.3 | Developer | Open |
| S-10 | Minor | No external uptime monitor or alerting on `/api/health`. | 25.7 | Developer | Open |
| S-11 | Minor | Office street addresses and map links missing (Cairo and Riyadh have phone/email only; Dubai, London and New York show the city only). | 11.6 | FEKRA | Waiting on FEKRA |
| S-12 | Minor | LinkedIn Insight Tag has no Partner ID. | 22.4 | FEKRA | Waiting on FEKRA |
| S-13 | Minor | Completed Calendly bookings cannot be tracked, because `/meeting` redirects to Calendly instead of embedding it. Clicks on the booking button are tracked. | 12.5, 22.8 | FEKRA decision | Open |
| S-14 | Minor | Mobile: long careers-form placeholders are cut off on phones, and the article's "On this page" links (from the article HTML) are under 44 px tall. | 16.2 | FEKRA content | Open |
| S-15 | Minor | Mobile layout fixes from 14 Oct (header at 360 px, consent checkboxes, testimonial carousel, footer, careers forms, tap targets) are built and checked locally but **not yet deployed**. | 16.1, 16.2 | Developer | Fixed locally |

## Launch decision

S-01 must be fixed before FEKRA can sign off. Each Major item must be fixed, or FEKRA must
accept it in writing. FEKRA can move Minor items to a post-launch list.

FEKRA approval: ______________________  Date: __________
