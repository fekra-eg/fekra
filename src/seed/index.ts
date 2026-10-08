import { serviceDesigns } from './service-designs'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { seedJobs } from './jobs'
import { seedApprovedServices } from './services'

import { getPayload } from 'payload'
import config from '../payload.config'
import { TEAM, splitTalentPanels } from './team'
import { HERO_PHOTOS } from '../lib/hero-photos'

/**
 * Seeds a working English site that matches the approved Figma Home layout, so
 * a fresh environment renders something real instead of an empty shell.
 *
 * Idempotent: re-running updates the same documents by slug. Content is English
 * only — the other four locales are entered by FEKRA through the CMS (14.12).
 *
 *   pnpm seed
 */
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@fekra-egy.com'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!'

/**
 * Sample articles and the example job exist to make a fresh local environment
 * look like a real site. Set SEED_DEMO_CONTENT=false when seeding a real
 * database so the blog starts empty instead of shipping placeholder posts.
 */
const WITH_DEMO_CONTENT = process.env.SEED_DEMO_CONTENT !== 'false'

/** A connection that is not on this machine is treated as real data. */
const isRemoteDatabase = (): boolean => {
  const url = process.env.DATABASE_URL ?? ''
  return Boolean(url) && !/@(localhost|127\.0\.0\.1|::1|db|host\.docker\.internal)[:/]/.test(url)
}

const textNode = (text: string) => ({
  type: 'text',
  text,
  format: 0,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})

const block = (type: 'paragraph' | 'heading', text: string, tag?: 'h2' | 'h3') => ({
  type,
  ...(tag ? { tag } : {}),
  format: '' as const,
  indent: 0,
  version: 1,
  direction: 'ltr' as const,
  children: [textNode(text)],
})

const doc = (children: ReturnType<typeof block>[]) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children,
  },
})

/** Single paragraph — used for short fields like FAQ answers. */
const rich = (text: string) => doc([block('paragraph', text)])

/** `['h2', 'Heading']` / `['p', 'Body copy']` -> a lexical document. */
const article = (lines: ['h2' | 'h3' | 'p', string][]) =>
  doc(
    lines.map(([kind, text]) =>
      kind === 'p' ? block('paragraph', text) : block('heading', text, kind),
    ),
  )

type SeedCollection = 'pages' | 'posts' | 'services' | 'jobs' | 'categories'

async function upsert<T extends { id: number; title?: string }>(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: SeedCollection,
  slug: string,
  data: Record<string, unknown>,
): Promise<T> {
  const existing = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  const first = existing.docs[0]
  const args = { collection, context: { disableRevalidate: true } } as never
  if (first) {
    return (await payload.update({
      ...(args as object),
      id: first.id,
      data,
    } as never)) as unknown as T
  }
  return (await payload.create({
    ...(args as object),
    data: { ...data, slug },
  } as never)) as unknown as T
}

/**
 * Uploads a file from public/images into the Media collection, keyed by
 * filename so re-running the seed reuses the existing document.
 */
async function upsertMedia(
  payload: Awaited<ReturnType<typeof getPayload>>,
  file: string,
  alt: string,
  folder = 'hero',
): Promise<{ id: number } | null> {
  // Media converts rasters to webp on upload, so the stored filename is not
  // the one passed in. Look for both or every run creates duplicates.
  const stored = file.replace(/\.(png|jpe?g)$/i, '.webp')
  const existing = await payload.find({
    collection: 'media',
    where: { or: [{ filename: { equals: file } }, { filename: { equals: stored } }] },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) return existing.docs[0] as unknown as { id: number }

  const path = join(process.cwd(), 'public', 'images', folder, file)
  if (!existsSync(path)) return null

  try {
    return (await payload.create({
      collection: 'media',
      data: { alt },
      filePath: path,
      context: { disableRevalidate: true },
    })) as unknown as { id: number }
  } catch {
    // Payload suffixes stored filenames (-1, -2…) when the upload dir already
    // holds the name, so the exact-match lookup above can miss and the retry
    // then trips the unique constraint. Fall back to the newest suffixed copy
    // rather than killing the whole seed over one image.
    const fallback = await payload.find({
      collection: 'media',
      where: { filename: { like: file.replace(/\.[a-z]+$/i, '') } },
      sort: '-createdAt',
      limit: 1,
      depth: 0,
    })
    return (fallback.docs[0] as unknown as { id: number }) ?? null
  }
}

const run = async () => {
  const payload = await getPayload({ config })

  const users = await payload.find({ collection: 'users', limit: 1 })
  if (!users.docs.length) {
    // Refuse to put the throwaway development password on a real database — it
    // is printed in the README, so such an account is effectively public. The
    // check belongs here rather than at the top: once an admin exists, seeding
    // content creates no account and is safe to re-run without credentials.
    if (isRemoteDatabase() && !process.env.SEED_ADMIN_PASSWORD) {
      console.error(
        '\n  Refusing to create the first admin on a remote database with the default password.\n' +
          '  Re-run with your own credentials:\n\n' +
          "    SEED_ADMIN_EMAIL=you@fekra-egy.com SEED_ADMIN_PASSWORD='<strong password>' pnpm seed\n",
      )
      process.exit(1)
    }
    await payload.create({
      collection: 'users',
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: 'FEKRA Admin', role: 'admin' },
    })
    payload.logger.info(`Created admin ${ADMIN_EMAIL} — change the password on first login.`)
  }

  await payload.updateGlobal({
    slug: 'site-settings',
    context: { disableRevalidate: true },
    data: {
      siteName: 'FEKRA',
      legalName: 'Fekra',
      logoLight: (await upsertMedia(payload, 'fekra-logo.webp', 'FEKRA', ''))?.id,
      logoDark: (await upsertMedia(payload, 'fekra-logo-white.webp', 'FEKRA', ''))?.id,
      tagline: 'Loyalty . Innovation . Expansion',
      generalEmail: 'info@fekra-egy.com',
      notificationEmails: ['info@fekra-egy.com'],
      careersEmails: ['hr@fekra-egy.com'],
      consentMode: 'opt-in',
      // Live profiles, as published on fekra-egy.com.
      socialProfiles: [
        { platform: 'linkedin', url: 'https://www.linkedin.com/company/fekra-egy' },
        { platform: 'facebook', url: 'https://www.facebook.com/FekraEgy.Company/' },
        { platform: 'youtube', url: 'https://www.youtube.com/channel/UCA0UOTqXkRUZRc1NAH9M1aw' },
        { platform: 'whatsapp', url: 'https://wa.me/+201101133572' },
      ],
      crawlerPolicy: {
        allowSearchEngines: true,
        allowAiSearchBots: true,
        allowAiTrainingBots: false,
        publishLlmsTxt: false,
      },
      offices: [
        {
          city: 'Cairo',
          country: 'Egypt',
          countryCode: 'EG',
          addressLine: 'Cairo, Egypt',
          phone: '+20 110 113 3572',
          email: 'info@fekra-egy.com',
          mapUrl: 'https://maps.app.goo.gl/zzophdB6vNaMQvRJ7',
          isHeadquarters: true,
        },
        {
          city: 'Riyadh',
          country: 'Saudi Arabia',
          countryCode: 'SA',
          addressLine: 'Riyadh, Saudi Arabia',
          phone: '+966 56 161 6057',
          email: 'info@fekra-egy.com',
          mapUrl: 'https://maps.app.goo.gl/tpqavwfxtpXZdG4U8',
        },
        { city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE' },
        { city: 'London', country: 'United Kingdom', countryCode: 'GB' },
        { city: 'New York', country: 'United States', countryCode: 'US' },
      ],
    },
  })

  type RoutePath = '/' | '/blog' | '/services' | '/careers' | '/contact' | '/meeting' | '/meet-fika-ai'

  const page = (label: string, id: number | string) => ({
    type: 'internal' as const,
    label,
    reference: { relationTo: 'pages' as const, value: Number(id) },
    newTab: false,
  })

  const route = (label: string, path: RoutePath, analyticsId?: string) => ({
    type: 'route' as const,
    label,
    route: path,
    newTab: false,
    ...(analyticsId ? { analyticsId } : {}),
  })

  // The client logos, in the order they appear in the comp (Figma 1:10296).
  // `partner-pinwheel` is the one mark the design does not name — rename it in
  // the CMS, since the name is what becomes its alt text.
  const clientLogos = await Promise.all(
    [
      ['pitman-training', 'Pitman Training'],
      ['kuwait-finance-house', 'Kuwait Finance House'],
      ['partner-pinwheel', 'Partner'],
      ['al-rajhi-bank', 'Al Rajhi Bank'],
      ['allianz', 'Allianz'],
      ['smart-management-systems', 'Smart Management Systems'],
      ['stc', 'stc'],
      ['datafusion-software', 'DataFusion Software'],
      ['codewave-systems', 'Codewave Systems'],
      ['adnoc', 'ADNOC'],
    ].map(async ([slug, name]) => ({
      name,
      media: await upsertMedia(payload, `${slug}.png`, `${name} logo`, 'logos'),
    })),
  )

  // Figma 1:11600.
  const certBadges = await Promise.all(
    [
      ['ISTQB Platinum Partner', 'cert-istqb'],
      ['ISO 9001 certified', 'cert-iso-9001'],
      ['ISO 27001 certified', 'cert-iso-27001'],
      ['GDPR compliant', 'cert-gdpr'],
      ['SOC 2 Type 2', 'cert-soc2'],
    ].map(async ([name, file]) => ({
      name: name as string,
      image: (await upsertMedia(payload, `${file}.png`, name as string, 'certs'))?.id,
    })),
  )

  // Figma 1:11493 — the comp reuses two portraits across five quotes.
  const testimonialAvatars = Object.fromEntries(
    await Promise.all(
      ['sarah-chen', 'marcus-rivera'].map(async (n) => [
        n,
        await upsertMedia(payload, `${n}.png`, '', 'people'),
      ]),
    ),
  )

  // Figma 3:1825 — 20 tiles, tones exactly as the comp cycles them.
  const industryRows: [string, string, string][] = [
    ['Finance & Banking', 'finance', 'pink'],
    ['E-commerce', 'ecommerce', 'mint'],
    ['Telecom', 'telecom', 'lilac'],
    ['Real Estate', 'real-estate', 'teal'],
    ['Software', 'software', 'blue'],
    ['Health & Fitness', 'health', 'mint'],
    ['Automotive', 'automotive', 'lilac'],
    ['Photo & Video', 'photo-video', 'blue'],
    ['Business', 'business', 'blue'],
    ['Startup', 'startup', 'teal'],
    ['AR/VR', 'arvr', 'lilac'],
    ['Legal Services', 'legal', 'teal'],
    ['Non-profit', 'nonprofit', 'blue'],
    ['Govt. & Public Sector', 'government', 'teal'],
    ['Sports & Fitness', 'sports', 'lilac'],
    ['Gaming', 'gaming', 'teal'],
    ['Fashion & Apparel', 'fashion', 'blue'],
    ['Energy & Utilities', 'energy', 'mint'],
    ['Agriculture', 'agriculture', 'mint'],
    ['Logistics', 'logistics', 'teal'],
  ]
  const industryItems = await Promise.all(
    industryRows.map(async ([label, file, tone]) => ({
      label,
      tone,
      icon: (await upsertMedia(payload, `ind-${file}.svg`, '', 'industries'))?.id,
    })),
  )

  // Figma 3:1656. Only the AI/ML tab's tools are specified in that node; the
  // other eight tabs exist so the bar matches the design and are filled in
  // through the CMS.
  const aiTools = [
    ['TensorFlow', 'tensorflow.svg'],
    ['PyTorch', 'pytorch.png'],
    ['Keras', 'keras.svg'],
    ['Scikit-learn', 'scikit-learn.svg'],
    ['Hugging Face Transformers', 'hugging-face.png'],
    ['FastAI', 'fastai.png'],
    ['OpenCV', 'opencv.svg'],
    ['LightGBM', 'lightgbm.svg'],
    ['XGBoost', 'xgboost.png'],
    ['Apache Spark MLlib', 'apache-spark.svg'],
    ['NLP frameworks (NLTK, SpaCy)', 'spacy.svg'],
  ]
  const aiItems = await Promise.all(
    aiTools.map(async ([name, file]) => ({
      name: name as string,
      logo: (await upsertMedia(payload, file as string, '', 'tech'))?.id,
    })),
  )

  // "All Businesses Types" — Figma 1:10748. Icons exported from the same node.
  const bizIcons = Object.fromEntries(
    await Promise.all(
      ['startups', 'small', 'enterprise', 'agency', 'innovation'].map(async (n) => [
        n,
        await upsertMedia(payload, `biz-${n}.svg`, '', 'icons'),
      ]),
    ),
  )

  // Upload once, then give each talent panel its own distinct roster.
  const talentPeople = await Promise.all(
    TEAM.map(async (person) => ({
      name: person.name,
      role: person.role,
      experience: person.experience,
      match: person.match,
      evaluated: true,
      avatar: person.file
        ? ((await upsertMedia(payload, person.file, person.name, 'people'))?.id ?? null)
        : null,
    })),
  )
  const [buildTeamPeople, confidencePeople] = splitTalentPanels(talentPeople)

  const photoNames = [
    'team',
    'office',
    'desk',
    'code',
    'meeting',
    'laptop',
    'server',
    'design',
    'data',
    'ai',
    'review',
    'ship',
  ]
  const photos = Object.fromEntries(
    await Promise.all(
      photoNames.map(async (n) => [
        n,
        await upsertMedia(payload, `${n}.jpg`, 'FEKRA team at work', 'samples'),
      ]),
    ),
  ) as Record<string, { id: number } | null>

  const serviceIcons = await Promise.all(
    ['ai', 'code', 'review', 'server'].map((n) => upsertMedia(payload, `${n}.jpg`, '', 'samples')),
  )

  const services = await Promise.all<{ id: number; title: string; summary: string }>(
    [
      {
        slug: 'ai-engineers',
        title: 'AI Engineers',
        summary: 'Vetted AI and machine-learning engineers.',
      },
      {
        slug: 'software-developers',
        title: 'Software Developers',
        summary: 'Front-end, back-end and full-stack engineers.',
      },
      {
        slug: 'qa-engineers',
        title: 'QA Engineers',
        summary: 'Manual, automation and performance testing.',
      },
      {
        slug: 'devops-cloud',
        title: 'DevOps & Cloud',
        summary: 'Platform, SRE and cloud infrastructure engineers.',
      },
    ].map((service, index) =>
      upsert<{ id: number; title: string; summary: string }>(payload, 'services', service.slug, {
        ...service,
        order: index,
        icon: serviceIcons[index]?.id,
        availableLocales: ['en'],
        _status: 'published',
      }),
    ),
  )

  const categories = Object.fromEntries(
    await Promise.all(
      [
        ['outsourcing', 'Outsourcing'],
        ['hiring', 'Hiring'],
        ['engineering', 'Engineering'],
        ['quality', 'Quality'],
        ['ai', 'AI'],
      ].map(async ([slug, title]) => [
        slug,
        await upsert<{ id: number }>(payload, 'categories', slug!, { title, _status: 'published' }),
      ]),
    ),
  ) as Record<string, { id: number }>

  const posts: {
    slug: string
    title: string
    excerpt: string
    category: string
    tags: string[]
    featured?: boolean
    body: ['h2' | 'h3' | 'p', string][]
  }[] = [
    {
      slug: 'software-outsourcing-in-2026',
      title: 'Software Outsourcing in 2026: When It Works, When It Fails',
      excerpt:
        'What separates outsourcing engagements that ship from the ones that stall — scoping, ownership, and the handover nobody plans for.',
      category: 'outsourcing',
      tags: ['Outsourcing', 'Delivery'],
      featured: true,
      body: [
        [
          'p',
          'Outsourcing works when the boundary between teams is a contract about outcomes, not a queue of tickets. It fails when the vendor owns the code but nobody owns the problem.',
        ],
        ['h2', 'Where outsourcing actually works'],
        [
          'p',
          'The strongest engagements share one trait: the external team is accountable for a slice of the product a customer can see, end to end. Give a team a feature and a definition of done, and it will organise itself around shipping.',
        ],
        ['h3', 'Clear surface area'],
        [
          'p',
          'A well-drawn boundary is usually a page, a service, or a workflow — something with its own tests and its own users. Boundaries drawn along skills instead ("they do frontend") create handoffs at exactly the point where context is expensive to transfer.',
        ],
        ['h3', 'A real definition of done'],
        [
          'p',
          'Done means merged, tested, observable in production, and documented well enough that the next person does not need a call. Anything short of that pushes work back onto your own team later.',
        ],
        ['h2', 'Where it fails'],
        [
          'p',
          'Two failure modes account for most of it: treating the vendor as a ticket queue, and never planning the handover. Both are avoidable, and both are decided in the first two weeks.',
        ],
        ['h3', 'The ticket queue trap'],
        [
          'p',
          'When every task arrives fully specified, you pay for hands and lose the judgement you were buying. Engineers who cannot ask "should we build this at all?" produce exactly what was written, including the parts that were wrong.',
        ],
        ['h2', 'How to do it right'],
        [
          'p',
          'Start with one bounded slice. Insist on the same code review, CI and on-call standards you hold internally. Plan the handover on day one, not at the end — the documentation you would need if the team disappeared tomorrow is the documentation you need anyway.',
        ],
      ],
    },
    {
      slug: 'how-we-vet-the-top-3-percent',
      title: 'How We Vet the Top 3% of Engineers',
      excerpt:
        'Five screening stages, what each one is actually testing for, and why the technical interview comes last.',
      category: 'hiring',
      tags: ['Hiring', 'Process'],
      body: [
        [
          'p',
          'Every engineer we place goes through the same five stages. The order matters more than the content: the cheapest signals come first.',
        ],
        ['h2', 'Profile screening'],
        [
          'p',
          'We shortlist on demonstrated ownership rather than years or logos. Someone who took a system from prototype to production tells us more than someone who spent longer next to one.',
        ],
        ['h2', 'Language and communication'],
        [
          'p',
          'A structured interview in English confirms the engineer can disagree clearly, ask for missing context, and write an update somebody else can act on. This stage removes more candidates than the technical one.',
        ],
        ['h2', 'Commitment and reliability'],
        [
          'p',
          'Availability, notice periods and overlap hours are boring questions that prevent expensive surprises. We ask them before anyone invests in a technical assessment.',
        ],
        ['h2', 'Technical assessment'],
        [
          'p',
          'A practical task drawn from the role, not a puzzle. We review the commit history as closely as the result — how someone works through a problem predicts collaboration better than the final diff.',
        ],
        ['h2', 'Technical interview'],
        [
          'p',
          'Last, and deliberately so. By this point we already know the person communicates and delivers, so the conversation can go deep on architecture instead of re-checking basics.',
        ],
      ],
    },
    {
      slug: 'scaling-engineering-teams-with-ai',
      title: 'Scaling Engineering Teams With AI, Without the Theatre',
      excerpt:
        'Where AI tooling genuinely compounds a team’s output, and where it quietly adds review load nobody budgeted for.',
      category: 'ai',
      tags: ['AI', 'Engineering'],
      body: [
        [
          'p',
          'AI tooling changes the cost of writing code. It does not change the cost of understanding it — and understanding is where teams were already bottlenecked.',
        ],
        ['h2', 'What compounds'],
        [
          'p',
          'Test scaffolding, migrations, boilerplate translation, and first-draft documentation. All are verifiable in seconds and boring to write, which is exactly the right profile.',
        ],
        ['h2', 'What adds review load'],
        [
          'p',
          'Large speculative refactors and unfamiliar subsystems. Generated code arrives without the reasoning that produced it, so the reviewer reconstructs it from scratch — often slower than writing it.',
        ],
        ['h2', 'A rule that holds up'],
        [
          'p',
          'Let AI write anything you can verify faster than you can write. Everything else still needs a human who will be on call for it.',
        ],
      ],
    },
    {
      slug: 'building-qa-culture-that-ships',
      title: 'Building a QA Culture That Still Ships Weekly',
      excerpt:
        'Quality gates that catch real defects without turning every release into a two-week ceremony.',
      category: 'quality',
      tags: ['Quality', 'Testing', 'Delivery'],
      body: [
        [
          'p',
          'Most QA processes fail in one of two directions: too thin to catch anything, or so heavy that teams route around them.',
        ],
        ['h2', 'Gate on severity, not on count'],
        [
          'p',
          'A blocker stops a release. A cosmetic issue does not. Writing that distinction down before launch week is what keeps the conversation technical instead of political.',
        ],
        ['h2', 'Automate the regressions, review the rest'],
        [
          'p',
          'Anything that broke once should be a test. Everything else is better served by a short, honest manual pass on the flows that make money.',
        ],
        ['h2', 'Re-test before you call it passed'],
        [
          'p',
          'A fixed defect is not a passed defect. The re-test is the cheapest step in the process and the one most often skipped.',
        ],
      ],
    },
    {
      slug: 'nearshore-vs-offshore',
      title: 'Nearshore vs Offshore: Which Model Fits Your Team',
      excerpt:
        'Timezone overlap, cost, and hiring depth pull in different directions. Here is how to weigh them honestly.',
      category: 'outsourcing',
      tags: ['Outsourcing', 'Hiring'],
      body: [
        [
          'p',
          'The nearshore/offshore debate is really a debate about how many hours a day your teams can talk to each other.',
        ],
        ['h2', 'Overlap is the real variable'],
        [
          'p',
          'Four hours of overlap is enough for a team that owns a bounded slice. One hour is not enough for anyone, at any price.',
        ],
        ['h2', 'When offshore wins'],
        [
          'p',
          'Deep, specialised skills that are simply not available nearby, and work that is asynchronous by nature — data pipelines, migrations, long-running platform work.',
        ],
        ['h2', 'When nearshore wins'],
        [
          'p',
          'Product work with frequent direction changes, anything customer-facing, and any team still finding its architecture.',
        ],
      ],
    },
  ]

  const now = Date.now()
  if (WITH_DEMO_CONTENT)
    await Promise.all(
      posts.map((post, index) =>
        upsert(payload, 'posts', post.slug, {
          title: post.title,
          excerpt: post.excerpt,
          heroImage: photos[photoNames[index % photoNames.length]!]?.id,
          content: article(post.body),
          category: categories[post.category]!.id,
          tags: post.tags,
          featured: Boolean(post.featured),
          availableLocales: ['en'],
          // Spread the dates so the listing has a believable order.
          publishedAt: new Date(now - index * 6 * 864e5).toISOString(),
          _status: 'published',
        }),
      ),
    )

  if (WITH_DEMO_CONTENT) await seedJobs(payload, article, now)

  // Hero assets, exported from the Figma frame.
  const icons = await Promise.all(
    ['icon-1.svg', 'icon-2.svg', 'icon-3.svg'].map((f) => upsertMedia(payload, f, '')),
  )
  const tiles = await Promise.all(
    HERO_PHOTOS.map((photo) => upsertMedia(payload, photo.file, photo.alt, 'hero')),
  )

  /*
   * Blocks the service pages share with the home page (the Figma service
   * comps repeat these sections verbatim), defined once and reused in both
   * layouts.
   */
  const logoCloudStatement = {
    blockType: 'logoCloud',
    statement: {
      before: '50+ companies rely on our',
      highlight: 'top 3%',
      after: 'talent to scale their dev teams.',
    },
    logos: clientLogos.filter((l) => l.media).map((l) => ({ name: l.name, image: l.media!.id })),
  }

  const techStackBlock = {
    blockType: 'techStack',
    heading: 'Technologies We Work With',
    body: 'Modern tools for web, mobile, cloud, AI, data, and automation.',
    groups: [
      { name: 'AI / ML', items: aiItems },
      { name: 'Frontend', items: [] },
      { name: 'Backend', items: [] },
      { name: 'Mobile', items: [] },
      { name: 'Cloud & DevOps', items: [] },
      { name: 'Databases', items: [] },
      { name: 'QA & Testing', items: [] },
      { name: 'CMS & E-commerce', items: [] },
      { name: 'Low-Code & Automation', items: [] },
    ],
  }

  const processBlock = {
    // Figma 1:11041 — sits between the technologies and industries boards.
    blockType: 'process',
    eyebrow: 'Your success starts here',
    heading: 'Our Process',
    body: 'We screen every engineer for technical skills, communication, and reliability.',
    steps: [
      {
        title: 'Application Review',
        body: 'We review each application for role relevance, technical fit, experience, and overall profile quality.',
      },
      {
        title: 'Language & Communication Screening',
        body: 'Selected candidates go through a structured language and communication interview to ensure they can collaborate clearly and confidently with your team.',
      },
      {
        title: 'HR & Commitment Evaluation',
        body: 'We assess professionalism, reliability, availability, cultural fit, and commitment to support long-term collaboration.',
      },
      {
        title: 'Technical Evaluation',
        body: 'Candidates complete a structured technical assessment based on the role, covering practical knowledge, problem-solving ability, and real-job relevance.',
      },
      {
        title: 'Technical Interview',
        body: 'Our team conducts a detailed technical interview to validate depth of knowledge, hands-on capability, and readiness to perform in a real project environment.',
      },
    ],
  }

  const industriesBlock = {
    blockType: 'industries',
    heading: 'Our Industry Expertises',
    body: 'Fekra helps companies scale with carefully vetted software engineers, structured technical evaluation, and a transparent delivery process built for speed, quality, and trust.',
    industries: industryItems,
  }

  const testimonialsBlock = {
    blockType: 'testimonials',
    eyebrow: 'Trusted by',
    heading: 'Industry Leaders',
    items: [
      {
        quote:
          '“Fekra transformed our legacy platform into a modern, scalable architecture. Their team didn’t just write code — they became true partners in our product vision.”',
        authorName: 'Sarah Chen',
        authorRole: 'CTO at FinFlow',
        avatar: testimonialAvatars['sarah-chen']?.id,
      },
      {
        quote:
          '“The mobile app Fekra built for us hit 4.8 stars on both stores within the first month. Their attention to UX details is on another level entirely.”',
        authorName: 'Marcus Rivera',
        authorRole: 'VP Product at HealthSync',
        avatar: testimonialAvatars['marcus-rivera']?.id,
      },
      {
        quote:
          '“We migrated 500+ stores to their headless commerce engine. Zero downtime, 40% faster page loads. Fekra over-delivered on every single metric.”',
        authorName: 'Aiko Tanaka',
        authorRole: 'CEO at RetailX',
        avatar: testimonialAvatars['sarah-chen']?.id,
      },
      {
        quote:
          '“Fekra took our rough idea and delivered a polished MVP in just 8 weeks. We raised our seed round largely because of how professional the product looked.”',
        authorName: 'Elena Vasquez',
        authorRole: 'Founder at EduSpark',
        avatar: testimonialAvatars['sarah-chen']?.id,
      },
      {
        quote:
          '“The AI team they assembled developed an impressive prediction model that successfully reduced our logistics costs by an astounding 35%. We saw a clear return on investment within just the first quarter of implementation. Their work is truly world-class and sets a new standard in the industry.”',
        authorName: 'David Okonkwo',
        authorRole: 'Engineering Lead at LogiTrack',
        avatar: testimonialAvatars['marcus-rivera']?.id,
      },
    ],
    stats: [
      { value: '4.9', label: 'Clutch Rating', star: true },
      { value: '98%', label: 'Client Retention' },
      { value: '200+', label: '5-Star Reviews' },
    ],
  }

  const fikaBlock = {
    // Figma 3:2214 — Meet Fika comes before the certifications band.
    blockType: 'cta',
    tone: 'feature',
    eyebrow: 'Your assistant',
    heading: 'Meet Fika',
    body: 'Fika is Fekra’s AI-powered hiring assistant, built to help our team organize candidate data, accelerate screening, and support faster, more structured hiring decisions.',
    media: (await upsertMedia(payload, 'fika.png', 'Fika, the FEKRA hiring assistant', 'decor'))
      ?.id,
    ctas: [{ variant: 'primary', link: route('Meet Fika', '/meet-fika-ai') }],
  }

  const certBlock = {
    blockType: 'logoCloud',
    variant: 'badges',
    eyebrow: 'Our partnerships',
    heading: '& Certifications',
    logos: certBadges.filter((c) => c.image).map((c) => ({ name: c.name, image: c.image! })),
  }

  const faqBlock = {
    blockType: 'faq',
    eyebrow: 'Take a look at',
    heading: 'Frequently Asked Questions',
    emitSchema: true,
    footnote: 'We are here to answer your questions & inquiries…',
    ctas: [{ variant: 'secondary', link: route('Inquire Now', '/contact') }],
    items: [
      {
        question: 'What makes Fekra different?',
        answer: rich(
          'Access to vetted senior talent, rapid start, and a structured process that removes weeks of screening.',
        ),
      },
      {
        question: 'What is the estimated cost of hiring a dedicated development team?',
        answer: rich(
          'Cost depends on seniority, stack and engagement length. Book a 30-minute call for a concrete estimate.',
        ),
      },
      {
        question: 'How does Fekra protect client rights and data confidentiality?',
        answer: rich(
          'Every engagement is covered by NDAs and IP assignment, with access controls agreed before onboarding.',
        ),
      },
    ],
  }

  const postsTeaserBlock = {
    blockType: 'postsTeaser',
    eyebrow: 'Latest blogs',
    heading: 'Our Recent Blogs',
    limit: 3,
    ctas: [{ variant: 'secondary', link: route('View all blogs', '/blog') }],
  }

  const contactBlock = {
    blockType: 'contact',
    eyebrow: "Let's talk business!",
    heading: 'Contact us',
    showOffices: true,
    showForm: true,
  }

  const ctaBandBlock = {
    // Figma 1:13917.
    blockType: 'cta',
    tone: 'band',
    heading: 'Ready to scale your engineering team?',
    body: 'We embed high-performance developers directly into your team, skipping the friction of traditional recruiting. Increase your engineering velocity with fast onboarding and talent that fundamentally elevates your product architecture.',
    ctas: [{ variant: 'secondary', link: route('Get in Touch', '/contact') }],
  }

  const home = await upsert<{ id: number }>(payload, 'pages', 'home', {
    title: 'Home',
    availableLocales: ['en'],
    _status: 'published',
    layout: [
      {
        blockType: 'hero',
        trustLine: 'Trusted by 50+ innovative companies',
        heading: 'Scale Your Team Faster With',
        headingAccent: 'AI Engineers',
        body: 'Fekra helps companies scale with carefully vetted software engineers, structured technical evaluation, and a transparent delivery process built for speed, quality, and trust.',
        rotatingWords: [
          { text: 'AI Engineers' },
          { text: 'Full-Stack Engineers' },
          { text: 'Backend Engineers' },
          { text: 'Mobile Engineers' },
          { text: 'QA Engineers' },
          { text: 'DevOps Engineers' },
          { text: 'Data Engineers' },
        ],
        bullets: [
          { text: 'Vetted in days, not weeks', icon: icons[0]?.id },
          { text: 'Structured technical evaluation', icon: icons[1]?.id },
          { text: 'Transparent delivery process', icon: icons[2]?.id },
        ],
        ctas: [
          { variant: 'primary', link: route('Schedule a Call', '/meeting', 'booking_cta_click') },
        ],
        // Order matters: each entry maps to a fixed slot in MOSAIC_LAYOUT,
        // which follows the Vivasoft reference. Photo indices follow HERO_PHOTOS.
        mosaic: [
          { kind: 'image', corner: 'tl', image: tiles[0]?.id },
          { kind: 'stat', corner: 'tr', tone: 'green', value: '100+', label: 'Top Talents' },
          { kind: 'image', corner: 'tr', image: tiles[1]?.id },
          { kind: 'stat', corner: 'tr', tone: 'teal', value: '80+', label: 'Projects' },
          { kind: 'image', corner: 'tr', image: tiles[2]?.id },
          { kind: 'stat', corner: 'tl', tone: 'indigo', value: '8+', label: 'Experience' },
          { kind: 'image', corner: 'tr', image: tiles[3]?.id },
          { kind: 'image', corner: 'tl', image: tiles[4]?.id },
          { kind: 'image', corner: 'tr', image: tiles[5]?.id },
          { kind: 'stat', corner: 'tr', tone: 'emerald', value: '20+', label: 'Tech Stack' },
          { kind: 'image', corner: 'tl', image: tiles[6]?.id },
          { kind: 'image', corner: 'tr', image: tiles[7]?.id },
          { kind: 'image', corner: 'tr', image: tiles[8]?.id },
        ],
      },
      logoCloudStatement,
      {
        blockType: 'talentShowcase',
        heading: 'Build Your',
        headingAccent: 'Team Faster',
        body: 'Get vetted engineers matched to your exact needs without wasting weeks on hiring, screening, and filtering.',
        bullets: [
          { text: 'Fast shortlisting' },
          { text: 'Technical evaluation reports' },
          { text: 'Flexible engagement models' },
        ],
        roles: [
          { label: 'AI Engineers' },
          { label: 'Software Developer' },
          { label: 'Software Tester' },
          { label: 'Project managers & business analysts' },
          { label: 'UI/UX Designer' },
          { label: 'Scrum Masters & product owners' },
          { label: 'System administrators & DevOps' },
        ],
        panelTitle: 'Build your remote team',
        panelTone: 'grey',
        side: 'copyLeft',
        people: buildTeamPeople,
      },
      {
        // Same block, mirrored and tinted — Figma 1:10318 lower half.
        blockType: 'talentShowcase',
        heading: 'Work With',
        headingAccent: 'Confidence',
        body: 'Start with clear contracts, NDA protection, secure access, dedicated engineers, and structured delivery follow-up from day one.',
        bullets: [
          { text: 'Contracts & NDA from day one' },
          { text: 'Secure data & access' },
          { text: 'Dedicated engineers with time zone fit' },
          { text: 'Transparent delivery follow-up' },
        ],
        panelTitle: 'Build your remote team',
        panelTone: 'mint',
        side: 'copyRight',
        people: confidencePeople,
      },
      {
        blockType: 'cardGrid',
        variant: 'business',
        eyebrow: 'We work with',
        heading: 'All Businesses Types',
        body: 'Tailored Outsourcing & Technology Solutions for Every Business — from Startups to Global Enterprises.',
        cards: [
          {
            icon: bizIcons.startups?.id,
            title: 'Startups Business',
            body: 'At Fekra, we empower startups to transform their ideas into scalable digital products. Our expertise in MVP development, rapid prototyping, and agile delivery helps founders move fast from concept to market-ready solutions. Acting as your extended tech team, we provide the technical foundation while you focus on growth, investment, and customer traction.\nWe make innovation simple — you dream it, we build it.',
          },
          {
            icon: bizIcons.small?.id,
            title: 'Small Business',
            body: 'Small and mid-sized businesses trust Fekra to drive efficiency, scalability, and digital transformation. We deliver end-to-end technology services — from UI/UX design and web or mobile development to QA, cloud deployment, and ongoing support.\nOur flexible outsourcing models ensure you get enterprise-grade results without enterprise-level costs.',
          },
          {
            icon: bizIcons.enterprise?.id,
            title: 'Enterprise Business',
            body: 'For large enterprises, Fekra provides robust, secure, and scalable enterprise-grade software solutions that deliver measurable impact. Our teams specialize in complex system integrations, custom platforms, ERP/CRM implementations, and long-term dedicated resources.\nWe enable global organizations to innovate faster and scale confidently through our reliable offshore delivery centers in Egypt and Saudi Arabia.',
          },
          {
            icon: bizIcons.agency?.id,
            title: 'Agency Business',
            body: 'We collaborate with agencies worldwide — providing the technical execution that transforms creative visions into real products. Through 360° technology consulting, flexible engagement models, and a skilled in-house team, we help agencies extend their capabilities, meet deadlines, and scale seamlessly.\nPartnering with Fekra means gaining a trusted technical backbone for your client projects.',
          },
          {
            icon: bizIcons.innovation?.id,
            title: 'Bringing Innovation Together',
            body: 'Innovation is at the heart of Fekra.\nOur R&D and engineering teams stay ahead of emerging technologies — from AI and automation to cloud and data-driven platforms — ensuring our clients always benefit from the latest innovations, security standards, and global best practices. Let\u2019s build the future, together.',
          },
        ],
        ctas: [{ variant: 'secondary', link: route('Get in Touch', '/contact') }],
      },
      techStackBlock,
      processBlock,
      industriesBlock,
      testimonialsBlock,
      fikaBlock,
      certBlock,
      faqBlock,
      postsTeaserBlock,
      contactBlock,
      ctaBandBlock,
    ],
  })

  const contact = await upsert<{ id: number }>(payload, 'pages', 'contact', {
    title: 'Contact Us',
    availableLocales: ['en'],
    _status: 'published',
    layout: [
      {
        blockType: 'contact',
        eyebrow: "Let's talk business!",
        heading: 'Contact us',
        showOffices: true,
        showForm: true,
      },
    ],
  })

  /*
   * The three "Hire … Developers" landing pages (Figma sections 15:18474,
   * 20:24086, 22:27840). One shared template — hero, brands, hiring models,
   * then the same sections the home page runs — with per-page hero copy and
   * band tint.
   */
  const consultIcons = await Promise.all(
    ['icon-cost.svg', 'icon-speed.png', 'icon-talent.svg'].map((f) =>
      upsertMedia(payload, f, '', 'services'),
    ),
  )

  const hiringModelsBlock = {
    blockType: 'hiringModels',
    eyebrow: 'Hire Best Resources',
    heading: 'Our Hiring Models',
    models: [
      {
        title: 'Full Time Monthly Hire',
        tone: 'amber',
        stats: [
          { value: '8', label: 'Hours Per Day' },
          { value: '160', label: 'Hours' },
        ],
      },
      {
        title: 'Part Time Monthly Hire',
        tone: 'lavender',
        stats: [
          { value: '4', label: 'Hours Per Day' },
          { value: '80', label: 'Hours' },
        ],
      },
      {
        title: 'Hourly Hire',
        tone: 'blue',
        stats: [
          { value: '400/200\n100/50', label: 'Hours' },
          { value: 'Flexible', label: 'Maintenance service' },
        ],
      },
    ],
    benefitsTitle: 'Benefits',
    // Listed row-major for the 3-column grid: column order in the comp is
    // (Cost savings, Direct Communication) / (Speedy Staffing, Daily
    // Reporting) / (Support 24/7, SCRUM Based Execution).
    benefits: [
      { text: 'Cost savings' },
      { text: 'Speedy Staffing' },
      { text: 'Support 24/7' },
      { text: 'Direct Communication' },
      { text: 'Daily Reporting' },
      { text: 'SCRUM Based Execution' },
    ],
    ctas: [{ variant: 'primary', link: route('Schedule a Developer Interview', '/meeting') }],
  }

  const serviceLayout = (hero: {
    heading: string
    heroTone: 'mint' | 'blue' | 'blush' | 'amber' | 'sky' | 'coral' | 'teal' | 'gold' | 'lilac'
    body: string
    closer: string
  }) => [
    {
      blockType: 'serviceHero',
      ...hero,
      highlights: [
        {
          icon: consultIcons[0]?.id,
          text: '30% to 60% Cost savings per talent hired through Fekra',
        },
        {
          icon: consultIcons[1]?.id,
          text: "Hire an individual or team in 6 to 14 days with Fekra's fast staffing solutions.",
        },
        { icon: consultIcons[2]?.id, text: "Access Fekra's top-rated, highly skilled talent pool" },
      ],
      formTitle: 'Get Free Consultation',
    },
    logoCloudStatement,
    hiringModelsBlock,
    processBlock,
    techStackBlock,
    industriesBlock,
    testimonialsBlock,
    fikaBlock,
    certBlock,
    faqBlock,
    postsTeaserBlock,
    contactBlock,
    ctaBandBlock,
  ]

  const hireServices = await Promise.all(
    serviceDesigns.map((svc, index) =>
      upsert<{ id: number; title: string }>(payload, 'services', svc.slug, {
        title: svc.title,
        summary: svc.summary,
        order: services.length + index,
        availableLocales: ['en'],
        _status: 'published',
        menuRoles: svc.roles.map((label) => ({ label })),
        layout: serviceLayout({
          heading: svc.title,
          heroTone: svc.heroTone,
          body: svc.body,
          closer: svc.summary,
        }),
      }),
    ),
  )

  // The public FEKRA catalog includes delivery services, specialist families,
  // and role-level SEO pages. Run this after the original hire pages so shared
  // slugs (front-end, full-stack, mobile, QA) receive their approved parent
  // relationships and metadata rather than being reset to top-level pages.
  await seedApprovedServices(payload as never, (service) =>
    serviceLayout({
      heading: service.title,
      heroTone: service.tone,
      body: service.body,
      closer: service.summary,
    }),
  )

  await payload.updateGlobal({
    slug: 'header',
    context: { disableRevalidate: true },
    data: {
      items: [
        { link: page('Home', home.id) },
        {
          link: route('Services', '/services'),
          children: hireServices.map((service) => ({
            link: {
              type: 'internal' as const,
              label: String(service.title),
              reference: { relationTo: 'services' as const, value: Number(service.id) },
            },
          })),
        },
        { link: route('Blog', '/blog') },
        { link: route('Careers', '/careers') },
        { link: page('Contact Us', contact.id) },
      ],
      ctas: [
        {
          variant: 'primary',
          link: route('Book a 30-Min Meeting', '/meeting', 'booking_cta_click'),
        },
      ],
    },
  })

  await payload.updateGlobal({
    slug: 'footer',
    context: { disableRevalidate: true },
    data: {
      tagline: 'Loyalty . Innovation . Expansion',
      blurb: 'We provide your teams with a diverse group of highly skilled engineers.',
      // The comp's footer has no nav column; an omitted key would leave the
      // previously seeded one in place, so clear it explicitly.
      columns: [],
      newsletter: {
        enabled: true,
        heading: "Let's create something remarkable together.",
        // The comp pairs the heading with the partnership line; its "Stay
        // updated…" sentence sits beside the form and has no field yet.
        body: 'Partner with Fekra and turn your vision into a market-ready product that stands out.',
      },
      copyright: `© ${new Date().getFullYear()} Fekra. All rights reserved.`,
    },
  })

  payload.logger.info(
    `Seed complete — ${WITH_DEMO_CONTENT ? 'including' : 'without'} demo articles and the example job.`,
  )
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  // Payload nests field-level failures here; without this you only see "400".
  if (error?.data?.errors) console.error(JSON.stringify(error.data.errors, null, 2))
  process.exit(1)
})
