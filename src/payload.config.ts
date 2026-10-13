import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { seoPlugin } from '@payloadcms/plugin-seo'
import type { GenerateDescription, GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { LOCALES } from './i18n/routing'
import { MediaBlock } from './payload/blocks'
import { Categories } from './payload/collections/Categories'
import { Jobs } from './payload/collections/Jobs'
import { Media } from './payload/collections/Media'
import { Pages } from './payload/collections/Pages'
import { Posts } from './payload/collections/Posts'
import { Services } from './payload/collections/Services'
import { ApplicantFiles, ContactSubmissions, JobApplications } from './payload/collections/Submissions'
import { Users } from './payload/collections/Users'
import { Footer, Header, SiteSettings } from './payload/globals'
import { documentPath, siteUrl, type LinkableCollection } from './lib/urls'
import { isLocalDatabase } from './lib/site-mode'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const generateTitle: GenerateTitle = ({ doc }) => (doc?.title ? `${doc.title} | FEKRA` : 'FEKRA')

const generateDescription: GenerateDescription = ({ doc }) =>
  (doc?.excerpt as string) || (doc?.summary as string) || ''

const generateURL: GenerateURL = ({ doc, collectionConfig }) =>
  `${siteUrl()}${documentPath((collectionConfig?.slug ?? 'pages') as LinkableCollection, (doc?.slug as string) ?? '')}`

const hasS3 = Boolean(process.env.S3_BUCKET)

/**
 * Public read URL for the media bucket, when one is configured. Supabase serves
 * public objects from /storage/v1/object/public/<bucket>/, which is a different
 * host and path from the S3 API endpoint uploads go through. Same variable
 * next.config.ts allows in `images.remotePatterns`, so the two cannot drift.
 */
const MEDIA_PUBLIC_BASE = process.env.S3_PUBLIC_HOST
  ? `https://${process.env.S3_PUBLIC_HOST}/storage/v1/object/public/${process.env.S3_BUCKET}`
  : null

/*
 * Supabase signs S3 requests against the project's real region. `auto` is a
 * Cloudflare R2 convention and it is the default in .env.example, so the wrong
 * combination is easy to land on — and it fails as a bare 403 on every upload
 * with nothing pointing at the region. Refuse to start instead.
 */
if (hasS3 && /supabase\.(co|in)\/storage\/v1\/s3/.test(process.env.S3_ENDPOINT ?? '')) {
  const region = process.env.S3_REGION?.trim()
  if (!region || region === 'auto') {
    throw new Error(
      'S3_REGION must be the Supabase project region (e.g. eu-north-1), not "auto".\n' +
        'It is the region in the DATABASE_URL host: aws-0-<region>.pooler.supabase.com',
    )
  }
  if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
    throw new Error(
      'S3_BUCKET is set but the S3 credentials are missing.\n' +
        'Create them in Supabase under Storage > S3 Access Keys (not the anon or service keys).',
    )
  }
}

/**
 * Origins the admin is legitimately served from.
 *
 * Payload rejects any cookie-authenticated write whose `Origin` is not on this
 * list, and the failure surfaces as a bare 403 — the CMS looks broken rather
 * than misconfigured. Three cases have to be covered or editors hit that wall:
 *
 *  - the canonical site URL (production),
 *  - the per-deployment Vercel hostname (preview/staging review, 3.4),
 *  - localhost AND 127.0.0.1 in development, which are different origins.
 */
const adminOrigins = [
  siteUrl(),
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  // The stable *.vercel.app alias, which is NOT the same as VERCEL_URL.
  ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
    : []),
  ...(process.env.VERCEL_BRANCH_URL ? [`https://${process.env.VERCEL_BRANCH_URL}`] : []),
  ...(process.env.NODE_ENV === 'production'
    ? []
    : ['http://localhost:3000', 'http://127.0.0.1:3000']),
].filter((origin, index, all) => all.indexOf(origin) === index)

export default buildConfig({
  serverURL: siteUrl(),

  // /api/* belongs to the public site; the CMS API lives on its own base so the
  // two never collide and the admin surface is not guessable (21.10).
  routes: { api: '/cms-api' },

  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' · FEKRA CMS',
      // The FEKRA mark, not Payload's default favicon.
      icons: [
        { rel: 'icon', type: 'image/svg+xml', url: '/icon.svg' },
        { rel: 'apple-touch-icon', type: 'image/png', url: '/apple-icon.png' },
      ],
    },
    components: {
      graphics: {
        Logo: '@/payload/admin/Logo#Logo',
        Icon: '@/payload/admin/Logo#Icon',
      },
    },
    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 390, height: 844 },
        { label: 'Tablet', name: 'tablet', width: 834, height: 1112 },
        { label: 'Laptop', name: 'laptop', width: 1440, height: 900 },
        { label: 'Desktop', name: 'desktop', width: 1920, height: 1080 },
      ],
    },
  },

  collections: [
    Pages,
    Posts,
    Categories,
    Services,
    Jobs,
    Media,
    ApplicantFiles,
    JobApplications,
    ContactSubmissions,
    Users,
  ],

  globals: [Header, Footer, SiteSettings],

  /**
   * 14.1/14.10 — every localized field is stored per locale, so editing Arabic
   * can never overwrite German. `fallback: true` returns English when a locale
   * is empty; the frontend still decides whether to *publish* that locale using
   * `availableLocales` (14.9), so we never silently serve the wrong language.
   */
  localization: {
    locales: LOCALES.map((code) => ({
      code,
      label: code.toUpperCase(),
      ...(code === 'ar' ? { rtl: true } : {}),
    })),
    defaultLocale: 'en',
    fallback: true,
  },

  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      HorizontalRuleFeature(),
      // Only h2/h3/h4 in body copy — the page template owns the single H1 (18.4).
      HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
      BlocksFeature({ blocks: [MediaBlock] }),
    ],
  }),

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
      /*
       * The Supabase pooler caps session-mode clients at 15 for the WHOLE
       * project. pg's default max is 10 per process, so one dev server plus a
       * build-time migration is already over budget — which is how deploys die
       * with EMAXCONNSESSION. A small per-process cap leaves room for a local
       * dev server, a seed run and a Vercel build to coexist. Raise via
       * DATABASE_POOL_MAX if the pooler's limit is ever increased.
       *
       * At RUNTIME 2 is a deadlock: Fluid Compute runs many requests per
       * instance and every Payload write holds a connection for the length of
       * its transaction, so two concurrent saves park both connections and any
       * third query stalls out the connect timeout — the "Something went
       * wrong." 500 on /cms-api. Runtime needs real headroom.
       *
       * The build used to squeeze to 2 for fear of that shared cap, and it was
       * strangling itself for exactly the reason the paragraph above gives.
       * Every page render opens several queries at once — the document, the
       * dictionary and site-settings go out under one Promise.all — so with two
       * connections the third waits for a slot that only frees when a query
       * finishes, and a wide one (Payload's page query laterals across all
       * nineteen block tables) holds its slot for seconds. Past the timeout
       * that is not a slow page, it is `Export encountered an error`, and the
       * whole deploy dies on the first one.
       *
       * Measured 10 Sep 2026 on this database: at 2 the export died at 0/109,
       * at 8 it completed 109/109 in 33.3s with no errors. The 15-client fear
       * was about SESSION mode; DATABASE_URL points at the transaction pooler
       * on 6543, which multiplexes and was sitting at 27 of 60 backends.
       */
      max: Number(
        process.env.DATABASE_POOL_MAX ??
          (process.env.NEXT_PHASE === 'phase-production-build' ? 8 : process.env.VERCEL ? 10 : 4),
      ),
      // Give connections back to the pooler quickly once idle.
      idleTimeoutMillis: 10_000,
      /*
       * When Supavisor stalls it can drop a backend without the FIN ever
       * reaching us, leaving a half-open socket that pg still counts as a live
       * client. Enough of those and the pool is permanently full of
       * connections that will never answer: every query — read AND write —
       * then fails on the connectionTimeoutMillis below, and the process stays
       * broken until it is restarted. Observed on 09 Sep 2026, when a pooler
       * stall left the dev server returning 500s for a quarter of an hour
       * after Supabase itself had recovered.
       *
       * TCP keepalive makes the OS notice the dead peer and error the socket,
       * so pg discards the client instead of holding a corpse; the lifetime
       * cap retires long-lived connections that never went idle long enough
       * for idleTimeoutMillis to reap them.
       */
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
      maxLifetimeSeconds: 1800,
      /*
       * Without this pg waits FOREVER for a free connection, so a saturated
       * pool reads as a request that never returns — the admin spinning on
       * "Saving..." with no error anywhere. Fail loudly instead.
       *
       * Build gets four times the patience — not because that was the export
       * failure (an undersized pool was; see `max`), but because Supavisor has
       * been measured taking 17-54s to hand over a connection, and at 15s a
       * stall like that still kills the deploy. The two limits answer to
       * different people: at runtime someone is watching a spinner and 15s is
       * already longer than they will wait, so failing fast is the kindness;
       * during a prerender nobody is waiting and the cost of giving up is the
       * whole deploy.
       */
      connectionTimeoutMillis: Number(
        process.env.DATABASE_CONNECT_TIMEOUT_MS ??
          (process.env.NEXT_PHASE === 'phase-production-build' ? 60_000 : 15_000),
      ),
    },
    // Only ever auto-push against a local throwaway database (see isLocalDatabase).
    push: process.env.NODE_ENV !== 'production' && isLocalDatabase(),
  }),

  email: process.env.RESEND_API_KEY
    ? resendAdapter({
        defaultFromAddress: process.env.EMAIL_FROM || 'website@fekra-egy.com',
        defaultFromName: 'FEKRA Website',
        apiKey: process.env.RESEND_API_KEY,
      })
    : undefined,

  plugins: [
    seoPlugin({
      collections: ['pages', 'posts', 'services', 'jobs'],
      uploadsCollection: 'media',
      generateTitle,
      generateDescription,
      generateURL,
      tabbedUI: true,
      fields: ({ defaultFields }) => [
        ...defaultFields,
        {
          name: 'canonicalOverride',
          type: 'text',
          admin: { description: 'Only set this when the page must point at a different canonical (18.3).' },
        },
        {
          name: 'noindex',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Excludes the page from search results and the sitemap (18.13).' },
        },
      ],
    }),

    ...(hasS3
      ? [
          s3Storage({
            collections: {
              /*
               * Serve media straight from the bucket instead of streaming every
               * byte back through this app. Payload's default keeps uploads
               * behind /cms-api/media/file/..., so each of the ~70 images on the
               * home page is a round trip that wakes a function, fetches the
               * object from Supabase and re-emits it — measured at 2.5s per
               * image against 0.75s for the same file fetched directly.
               *
               * Only `media` opts out. Supabase's default S3 URL is the signed
               * API path (403 unencoded), so the public object path is built
               * explicitly. Gated on S3_PUBLIC_HOST: unset — or a bucket that is
               * not public — leaves the proxied behaviour exactly as it was
               * rather than turning every image into a 403.
               */
              media: {
                prefix: 'media',
                ...(MEDIA_PUBLIC_BASE
                  ? {
                      disablePayloadAccessControl: true as const,
                      generateFileURL: ({ filename, prefix }: { filename: string; prefix?: string }) =>
                        `${MEDIA_PUBLIC_BASE}/${prefix ? `${prefix}/` : ''}${filename}`,
                    }
                  : {}),
              },
              // 21.4 — CVs are never public objects; links expire.
              'applicant-files': { prefix: 'applications', signedDownloads: { expiresIn: 300 } },
            },
            bucket: process.env.S3_BUCKET!,
            config: {
              region: process.env.S3_REGION || 'auto',
              endpoint: process.env.S3_ENDPOINT,
              forcePathStyle: Boolean(process.env.S3_ENDPOINT),
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
              },
            },
          }),
        ]
      : []),
  ],

  /*
   * Payload replaces every server error with "Something went wrong." in
   * production, which makes an upload failure impossible to diagnose from the
   * browser. Off by default — set PAYLOAD_DEBUG=true on the environment to get
   * the real message back in the API response, then turn it off again.
   * (The full stack is always written to the server log regardless.)
   */
  debug: process.env.PAYLOAD_DEBUG === 'true',

  secret: process.env.PAYLOAD_SECRET || '',
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  // Admin and site share an origin; nothing else may post to the API (21.10).
  cors: adminOrigins,
  csrf: adminOrigins,
  graphQL: { disablePlaygroundInProduction: true },
})
