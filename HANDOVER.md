# FEKRA Website — Quick Handover

_22 Oct 2026_

## What it is
FEKRA's marketing site at **https://www.fekra-egy.com**. One Next.js 16 app with Payload CMS 3 built in.
5 languages (en, ar, de, fr, es), light/dark mode, blog, services, careers with CV upload, contact and booking.

| Piece | Where |
| --- | --- |
| Code | github.com/fekra-eg/fekra (default branch `master`) |
| Hosting | Vercel project `fekra`, region `fra1` |
| Database | Supabase Postgres (`eu-north-1`) |
| Media + CVs | Supabase Storage bucket `fekra_assets` (private; CV links are signed and expire in 5 min) |
| Email | Resend · Bot check: Cloudflare Turnstile · Analytics: GA4 `G-C39M5MW6D8`, loads only after consent |
| CMS admin | `/admin` (API at `/cms-api`). Admin login: **admin@fekra.com** (password: in the PDF handover, not stored in the repo) |
| AI translation | OpenAI API key (`OPENAI_API_KEY` in Vercel) powers the "Translate to all languages" button on blog articles |

**Accounts:** every platform above (GitHub, Vercel, Supabase, Resend, Cloudflare, Google Analytics / Search Console, OpenAI) is signed in with **ahmed.developer@fekra-egy.com**. Exception: Calendly (`fekra-egy-info/30min`) is on FEKRA's own account, not this one. Passwords are not stored in this repo; get them from the account owner.

## Run it locally
```bash
cp .env.example .env.local   # set DATABASE_URL and PAYLOAD_SECRET at minimum
docker compose up -d db
pnpm install && pnpm dev     # site: localhost:3000 · admin: /admin
pnpm seed                    # optional starter content
```
Every env var is documented in `.env.example`. Real values live only in Vercel.

## Where things live
- `src/app/(site)/[locale]/`: public pages. English has no prefix (`/about`); other languages do (`/ar/about`).
- `src/payload/`: CMS collections, globals, page-builder blocks, publish hooks that refresh cached pages.
- `src/components/blocks/`: one renderer per CMS block.
- `src/i18n/routing.ts`: all locale and URL rules. `src/proxy.ts`: locale routing and noindex.
- `redirects.json`: old WordPress URL to new URL map.
- `scripts/`: seed, translation, fix and check scripts (`pnpm check:i18n`, `check:links`, `perf`, `check:storage`).

## Deploy and roll back
- `pnpm build` runs DB migrations first (`scripts/migrate.mjs`), then builds.
- Push to the Vercel production branch to deploy. Each PR gets a preview, which is never indexed.
  ⚠️ `vercel.json` lists `main` under `git.deploymentEnabled`, but the default branch is `master`. Check which branch production follows in Vercel → Settings → Git.
- **Rollback:** Vercel → Deployments → last good build → *Promote to Production*.
- **Schema change:** `pnpm migrate:create <name>`, commit the migration, then `pnpm generate:types`.

## Editing content (for FEKRA)
Save Draft → Preview → Publish. Publishing refreshes the live page within seconds.
Switch language at the top of the edit screen. Set **Available locales** on each document; only listed languages appear in the language switcher and hreflang.

## Still open (from the register, 14 Oct; re-check before relying on it)
| # | Item | Owner |
| --- | --- | --- |
| S-01 | ✅ Audit down from 63 to 2 after the upgrade and overrides. The 2 left (`braces` in the admin Sass watcher, `esbuild` dev server) have no upstream fix and don't run on the public site | Dev |
| S-02 | ✅ Fixed: live pages are CDN-cached (`x-vercel-cache: HIT`, checked 22 Oct) | Dev |
| S-03 | Re-run mobile Lighthouse now that caching works | Dev |
| S-05 | End-to-end test on production: contact, careers (CV email), Calendly | Dev + FEKRA |
| S-06 | **Transfer ownership** (GitHub, Vercel, domain/DNS, Supabase, Resend, GA4, Search Console, CMS admin) | Dev + FEKRA |
| S-07 | Browser and device test pass | QA |
| S-09/10 | Branch protection; uptime monitor on `/api/health` | Dev |
| S-08/11/12 | Content decisions, office addresses, LinkedIn Partner ID | FEKRA |

## Gotchas
- The default seed admin is `admin@fekra-egy.com` / `ChangeMe123!`. Make sure it is changed or removed in production.
- If `S3_BUCKET` is empty, uploads go to local disk, and Vercel wipes that disk on every deploy.
- `S3_REGION` must be the real region (`eu-north-1`), never `auto`.
- Without `NEXT_PUBLIC_ENV=production`, the site is set to noindex (intended for previews).
- Rotating `PAYLOAD_SECRET` logs out every CMS user.
- Health check: `GET /api/health` returns 200 only when the database responds.
