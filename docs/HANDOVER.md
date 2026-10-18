# FEKRA Website — Technical Handover

Covers checklist section 25.9 (technical handover documentation) and the environment,
integration and ownership items it depends on.

**Live site:** https://www.fekra-egy.com · **Repository:** github.com/fekra-eg/fekra ·
**Hosting:** Vercel project `fekra` · **Updated:** 14 Oct 2026 (master `280f493`)

Companion documents: `docs/SEVERITY-REGISTER.md` (open defects and launch gates, 24.15) and
`docs/REGIONAL-ACCESS.md` (regional access test and known limitations, 23.10 / 23.11 / 25.5).

---

## 1. Architecture

One Next.js application contains both the public site and the CMS.

```
                     ┌─────────────────────────────────────────┐
   visitor  ────────▶│  Next.js (Vercel)                       │
                     │   proxy.ts     locale routing + noindex  │
                     │   (site)/…     RSC pages, ISR-cached     │
                     │   api/…        forms, preview, health    │
   editor   ────────▶│   /admin       Payload admin UI          │
                     │   /cms-api     Payload REST + GraphQL    │
                     └───────┬──────────────────┬───────────────┘
                             │                  │
                     ┌───────▼──────┐   ┌───────▼────────────┐
                     │  PostgreSQL  │   │  Supabase Storage  │
                     │  content +   │   │  media (public)    │
                     │  submissions │   │  CVs (signed only) │
                     └──────────────┘   └────────────────────┘
```

Rendering: public pages are designed to be statically generated and revalidated on a timer,
plus an immediate purge when an editor publishes (`src/payload/hooks/revalidate.ts`).
**Known regression (14 Oct 2026):** production currently serves every HTML page as
`private, no-store`, so pages render per request. See severity register S-02. Nothing on a
public page requires client-side data fetching to be readable (19.2).

## 2. Environments (3.4)

| Environment | Branch | Indexable | Database |
| --- | --- | --- | --- |
| Production | production branch set in Vercel → Settings → Git | yes | production Postgres |
| Staging / preview | any PR | **no** — `X-Robots-Tag: noindex` at the edge and `robots.txt` disallow-all | staging Postgres |
| Local | — | no | `docker compose up -d db` |

`NEXT_PUBLIC_ENV` drives the indexing behaviour. Anything other than `production` is
non-indexable regardless of CMS settings — staging cannot be indexed by mistake.

## 3. Environment variables (3.6)

The authoritative list with descriptions is `.env.example`. Values live in Vercel project
settings; nothing secret is committed. Summary:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical origin. Wrong value breaks canonical, sitemap and CORS. |
| `NEXT_PUBLIC_ENV` | yes | `production` unlocks indexing. |
| `DATABASE_URL` | yes | Use the **pooled** connection string on Vercel. |
| `PAYLOAD_SECRET` | yes | 32+ random chars. Rotating logs everyone out. |
| `PREVIEW_SECRET` | yes | Guards `/api/preview`. |
| `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | prod | Bucket is `fekra_assets`. Empty bucket name = local disk, which Vercel wipes on every deploy. Region must be the real one (`eu-north-1`), never `auto`. Keys come from Supabase > Storage > S3 Access Keys. Verify with `pnpm check:storage`. |
| `S3_ENDPOINT` | prod | `https://<project-ref>.supabase.co/storage/v1/s3`. Omit only for real AWS. |
| `S3_PUBLIC_HOST` | prod | Added to `next/image` `remotePatterns`. |
| `RESEND_API_KEY`, `EMAIL_FROM` | prod | Without it, submissions still save but no email is sent. |
| CSP | automatic | Enforced in `next.config.ts`; production excludes `unsafe-eval`. Review the allow-list when adding an integration. |

## 4. Deploy (3.7 / 25.1 / 25.3)

```bash
pnpm install
pnpm build          # fails loudly if the database is unreachable
pnpm start
```

On Vercel: push to the production branch (Vercel → Settings → Git) → build → promote. Every PR gets a preview deployment, which is
the staging review environment. Each release is traceable to a commit SHA in the Vercel
dashboard.

**Rollback (3.9).** Vercel → Deployments → the last known-good build → *Promote to
Production*. Instant, no rebuild. If the rollback also needs a schema revert, restore the
database snapshot first, then promote.

**Schema changes.** `push: true` auto-syncs the schema in development only. For production,
generate and commit a migration:

```bash
pnpm payload migrate:create <name>
pnpm payload migrate            # run as a release step
```

## 5. Integrations (21.9)

| Integration | Where it is configured | Notes |
| --- | --- | --- |
| Calendly | Site Settings → Integrations → `calendlyUrl` | `/meeting` and `/book-a-call` redirect to `calendly.com/fekra-egy-info/30min`. Completed bookings are therefore not visible to site analytics. |
| GA4 | Site Settings → Integrations | Live: `G-C39M5MW6D8`, loaded directly (no GTM), only after analytics consent. If a GTM container is ever added, GA4 is no longer injected directly, so page views cannot double. |
| LinkedIn Insight | Site Settings → Integrations | Supported, marketing consent only; **Partner ID not set yet**. |
| Search Console | Verification file in `public/` | Sitemap: `https://www.fekra-egy.com/sitemap.xml`. |
| Cloudflare Turnstile | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_HOSTNAMES` env | Bot check on every form; falls back to a maths question if Turnstile cannot load. |
| Resend | `RESEND_API_KEY` env | Verify the sending domain (SPF/DKIM) before launch or notifications land in spam. |
| Supabase Storage | env | One bucket, `fekra_assets`: media under `media/`, CVs under `applications/`. Keep it private — files stream through `/cms-api` and CV links are signed for 5 minutes. |

## 6. CMS workflow (4.10)

**Roles.** `admin` manages users and Site Settings; `editor` manages content.

**Publishing.** Every content collection has drafts. Save Draft → *Preview* opens the real
page with draft mode on → Publish. Publishing purges the cached page in every locale plus
the listing it appears in, so the change is live within seconds.

**Translations.** The locale switcher at the top of the edit view switches which language you
are editing. Fields are stored per locale — editing Arabic never touches German. Slugs are
shared across locales by design.

Set **Available locales** on each document to the languages that have approved translations.
That field, not the presence of text, controls hreflang and the language switcher. A locale
left out of the list is shown as unavailable rather than being served in the wrong language.

**Adding a page.** Pages → New → title, slug, then compose the layout from blocks. Fill the
SEO tab. Add it to Header/Footer navigation if it needs a menu entry.

**Adding a job.** Careers → New. Set status `open`. Closing a role disables the form,
removes its JobPosting schema and drops it from the sitemap; the page stays reachable.

**Media.** Every meaningful image needs alt text. Tick *Decorative* only for images that
carry no information — those render with an empty alt attribute.

## 7. Forms and submitted data (21.12)

| Form | Endpoint | Stored in | Notified |
| --- | --- | --- | --- |
| Contact | `POST /api/contact` | `contact-submissions` | Site Settings → `notificationEmails` |
| Job application | `POST /api/apply` | `job-applications` + `applicant-files` | Site Settings → `careersEmails` |
| Newsletter | `POST /api/newsletter` | `contact-submissions` | — |

Protection: rate limit per IP, hidden honeypot field, a minimum fill time, and Cloudflare
Turnstile (falling back to a short maths question if Turnstile cannot load).

Since 14 Oct 2026 the careers notification email **attaches the applicant's CV**. A copy of
every CV therefore also lives in the `careersEmails` inboxes. Include those inboxes in the
retention decision below.

CVs are stored in a collection the public cannot read, under the `applications/` prefix, and
served through signed URLs that expire in five minutes. Only logged-in CMS users can open
them. Duplicate applications for the same role and email are rejected by a unique index.

Retention is a business decision: nothing is auto-deleted today. Agree a retention period
with FEKRA and add a scheduled job if one is required.

## 8. Monitoring and backups (25.7 / 25.2)

- `GET /api/health` returns `200` only when the database answers. Point the uptime monitor here.
- Application errors surface in Vercel → Logs. User-facing errors show a digest ID that
  matches the log entry — no stack traces are exposed to visitors.
- Database backups are the managed provider's daily snapshots. Verify the retention window
  and take a manual snapshot immediately before any migration or cutover.
- Media/CV objects are versioned by the storage provider; enable object versioning on the bucket.

## 9. Ownership and access transfer (25.8)

No credentials are written in this document. Transfer each service by **inviting a
FEKRA-owned account as Owner/Admin**, then removing developer accounts once FEKRA confirms
access. Do not share passwords.

| Service | What it holds | Current location (14 Oct 2026) | Transfer action | FEKRA confirms |
| --- | --- | --- | --- | --- |
| GitHub | Source code | Org `fekra-eg`, repo `fekra` | FEKRA account = org **Owner**; enable branch protection | ☐ |
| Vercel | Hosting, deploys, env vars, logs | Project `fekra` | Transfer project to a FEKRA team, or add FEKRA as **Owner** | ☐ |
| Domain registrar | `fekra-egy.com` (expires 08 Jul 2027) | PDR Ltd via Hostinger | Confirm the account is FEKRA's; turn on auto-renew | ☐ |
| DNS | A/CNAME for www, MX for email | Hostinger (`main-hosting.eu`) | FEKRA holds the login | ☐ |
| Supabase | Postgres database + `fekra_assets` storage (media, CVs) | Region `eu-north-1` | Add FEKRA as **Owner**; confirm backups | ☐ |
| Resend | Notification email | `RESEND_API_KEY` in Vercel | Add FEKRA as admin; verify SPF/DKIM | ☐ |
| Cloudflare Turnstile | Form bot protection | Keys in Vercel env | Move widget to FEKRA's Cloudflare account, or add FEKRA | ☐ |
| Google Analytics 4 | Property `G-C39M5MW6D8` | — | FEKRA account = property **Administrator** | ☐ |
| Google Search Console | `fekra-egy.com` property | Verified by file | FEKRA account = **Owner** | ☐ |
| Calendly | Booking page `fekra-egy-info/30min` | FEKRA account | Confirm display name (was "Ferka Tech") | ☐ |
| LinkedIn Campaign Manager | Insight Tag (not active) | — | FEKRA supplies the Partner ID | ☐ |
| CMS (`/admin`) | Content, submissions, CVs | Payload users | FEKRA admin user created; seeded password changed; developer users removed after handover | ☐ |
| Google Workspace | Company email (MX) | FEKRA | Not part of this project | — |

Signed off for FEKRA: ______________________  Date: __________

## 10. Routine maintenance

| Task | Cadence |
| --- | --- |
| `pnpm audit --prod` / `pnpm outdated` and patch security advisories | monthly (open: S-01) |
| `pnpm check:links https://<domain>` | after any content migration or nav change |
| Search Console coverage and Core Web Vitals review | monthly |
| Review `contact-submissions` / `job-applications` retention | quarterly |

## 11. Search and AI visibility — what is committed (19.12)

**This project commits to technical readiness and quality. It does not commit to rankings,
traffic, or citations in AI answers.** Those are decided by third-party systems — Google,
Bing, ChatGPT, Perplexity, Claude, AI Overviews — whose ranking and citation criteria are
undisclosed, change without notice, and weigh competition, domain authority, brand signals
and content depth that no amount of code can supply. Any supplier who guarantees a position
or a citation is guessing.

What was built and is verifiable today:

| Delivered | How to re-verify |
| --- | --- |
| Server-rendered content — every page's copy, headings and schema are in the raw HTML with no JavaScript required (19.2) | `curl` any URL and read it |
| Semantic HTML: real `<ol>`, `<details>`, `<figure>`, `<dialog>`, heading hierarchy (19.1, 19.3) | `pnpm lint`, manual audit |
| Organization, WebSite, Service, BlogPosting, FAQPage, JobPosting, BreadcrumbList structured data (19.4) | Rich Results Test |
| One canonical per page, reciprocal hreflang across 5 locales, sitemap `<loc>` == canonical == schema `url` (19.11, 18.3) | `pnpm check:i18n`, `pnpm check:links` |
| Search and AI-search crawlers allowed at both robots.txt and the network layer; training crawlers separately controlled (19.6–19.10) | `curl -A "OAI-SearchBot" https://<domain>/` → 200 |
| Core Web Vitals budget enforced in the build (§17) | `pnpm perf` |

What moves the outcomes, and belongs to FEKRA rather than to this codebase: publishing
depth and cadence, subject-matter authority, earned links and mentions, brand search
demand, and pricing/competitive position. The technical layer removes the obstacles; it
does not create the demand.

**Timing.** Even where the technical work is correct, discovery, indexing and re-evaluation
by AI systems take weeks to months after go-live. An absence of results in the first weeks
is not evidence of a technical defect — check Search Console coverage first (§10).
