# FEKRA Website

Production build of the FEKRA marketing site: Next.js App Router frontend and Payload CMS
backend in one deployable application. Five locales, light/dark, CMS-managed content,
careers with CV upload, booking, and SEO/AEO structured data.

Scope and acceptance criteria come from
**FEKRA Website Production & QA Acceptance Checklist v1.1** (241 items, 25 sections).
Checklist item numbers appear in code comments where a decision maps to a requirement —
`(18.3)` in a comment means "this is how canonical URLs satisfy item 18.3".

---

## Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router, RSC) | Static/ISR rendering for public pages (17.4) |
| CMS / backend | Payload 3, mounted inside the Next app | One repo, one deploy, one auth model; per-locale fields, drafts and live preview out of the box (§4) |
| Database | PostgreSQL | Relational content + submissions; managed on Vercel |
| Media & CVs | S3 / Cloudflare R2 | CVs are private objects with signed, expiring downloads (21.4) |
| Styling | Tailwind v4 with tokens extracted from the Figma file | Design values live in `globals.css`, not scattered in components (2.1) |
| Email | Resend via Payload's email adapter | Form notifications (10.6 / 11.4) |
| Analytics | GTM / GA4 behind Consent Mode v2 | Nothing fires before consent (21.8) |

## Quick start

```bash
cp .env.example .env.local          # fill DATABASE_URL + PAYLOAD_SECRET at minimum
docker compose up -d db             # or point DATABASE_URL at any Postgres
pnpm install
pnpm dev                            # site: :3000   admin: :3000/admin
pnpm seed                           # optional: English Home page matching the Figma layout
```

`pnpm seed` creates `admin@fekra-egy.com` / `ChangeMe123!` on an empty database.
Change it on first login.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server (site + admin) |
| `pnpm build` / `pnpm start` | Production build and run |
| `pnpm typecheck` | Full TypeScript check |
| `pnpm check:i18n` | Locale routing, slug and dictionary-parity assertions (24.5) |
| `pnpm check:links <url>` | Crawl for 4xx/5xx, redirect hops, placeholder hrefs (20.9 / 24.12) |
| `pnpm test:api` | Postman/newman run of the sign-up and publish journeys (24.3) |
| `pnpm generate:types` | Regenerate `src/payload-types.ts` after a schema change |
| `pnpm seed` | Idempotent content seed |

## Structure

```
src/
├── app/
│   ├── (site)/[locale]/          Public site. Every page renders under a locale segment;
│   │   ├── layout.tsx            English is served unprefixed via a middleware rewrite.
│   │   ├── page.tsx              Home (CMS page with slug "home")
│   │   ├── [slug]/               Any other CMS page
│   │   ├── blog/ services/ careers/    Listings + detail routes
│   │   ├── contact/ meeting/     Conversion routes (work with or without CMS content)
│   │   └── not-found.tsx error.tsx
│   ├── (payload)/                Generated admin UI + CMS API, mounted at /admin and /cms-api
│   ├── api/                      contact · apply · newsletter · preview · health
│   ├── sitemap.ts robots.ts llms.txt/
│   └── (site)/globals.css        Design tokens from the Figma file
│
├── payload.config.ts             CMS entry: locales, collections, globals, plugins
├── payload/
│   ├── collections/              Pages Posts Categories Services Jobs Media Submissions Users
│   ├── globals.ts                Header · Footer · Site Settings
│   ├── blocks.ts                 14 page-builder blocks matching the approved sections
│   ├── fields/                   slug · link primitives
│   ├── hooks/revalidate.ts       Publish → purge the affected locale paths
│   └── access.ts preview.ts
│
├── components/
│   ├── blocks/                   One renderer per CMS block
│   ├── layout/ ui/ forms/        Header, footer, nav, buttons, accessible fields
│   ├── analytics/ booking/ theme/
│   └── RichText.tsx JsonLd.tsx PostCard.tsx
│
├── i18n/                         Locale contract + UI dictionaries (en ar de fr es)
├── lib/                          payload · seo · jsonld · urls · validation · consent · analytics
├── middleware.ts                 Locale routing + staging noindex
└── seed/
```

## Key decisions

**URL policy.** English is unprefixed (`/about`), other locales are prefixed (`/ar/about`).
This preserves every existing WordPress English URL (20.3) while giving each translation a
stable crawlable URL (14.2). `/en/*` permanently redirects to the unprefixed form so no page
has two live URLs. All of it is defined once in `src/i18n/routing.ts` and asserted by
`pnpm check:i18n`.

**Slugs are not localized.** One path segment per document keeps hreflang reciprocal and
canonical resolution unambiguous. Locale lives in the prefix.

**Redirects.** `redirects.json` is the single source of truth for the WordPress → Next map.
It compiles into the router, so every redirect is one hop with no runtime lookup (20.4).

**Draft content never leaks.** Public reads are filtered to `_status: published` at the
access-control layer, not in the query — the REST and GraphQL APIs are covered too.

**Analytics fire on confirmed success only.** Conversion events are dispatched after a 2xx
response, never on render, so a refresh cannot double-count (11.7 / 22.6).

## Documentation

- `docs/cms-guide/README.md` — illustrated CMS user manual in PDF, editable Word, and Markdown
- `docs/HANDOVER.md` — environments, deploy, integrations, CMS workflow, backups, ownership (25.9)
- `docs/QA-MAP.md` — every checklist section mapped to where it is implemented and how to verify it
- `postman/README.md` — API test collection: newsletter, contact, careers application, CMS auth and the publish lifecycle
