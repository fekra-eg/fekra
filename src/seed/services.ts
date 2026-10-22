/**
 * Approved service inventory migrated from the public FEKRA site.
 *
 * The previous website exposed two kinds of service content: delivery
 * services below /services/* and specialist hiring families with role-level
 * SEO pages. Keeping the inventory here gives the full seed and the targeted
 * services seed one source of truth.
 */

import { serviceDesigns } from './service-designs'

export type ServiceTone =
  'mint' | 'blue' | 'blush' | 'amber' | 'sky' | 'coral' | 'teal' | 'gold' | 'lilac'

export type ServiceSeed = {
  slug: string
  title: string
  summary: string
  body: string
  tone: ServiceTone
}

export type ServiceFamilySeed = ServiceSeed & {
  children: Array<Pick<ServiceSeed, 'slug' | 'title' | 'summary'>>
}

export const deliveryServices: ServiceSeed[] = [
  {
    slug: 'outsource',
    title: 'Custom Software Outsourcing',
    summary:
      'End-to-end software delivery that adds experienced product and engineering capacity to your team.',
    body:
      'Turn product ideas into secure, scalable software with a delivery team built around your goals.\n' +
      'FEKRA supports new products, modernization programs, and long-term delivery partnerships with clear ownership, direct communication, and flexible engagement models.\n' +
      'Keep focus on your core business while we manage the engineering workflow from discovery and architecture through development, quality assurance, release, and support.',
    tone: 'mint',
  },
  {
    slug: 'consulting-training',
    title: 'IT Consulting & Training',
    summary:
      'Practical technology guidance and capability building for teams making important delivery decisions.',
    body:
      'Make confident technology decisions with consultants who understand delivery as well as strategy.\n' +
      'We help teams assess architecture, choose platforms, improve engineering practices, and build the skills needed to operate solutions successfully after launch.\n' +
      'Every engagement is shaped around a measurable business outcome, with recommendations your team can act on rather than a report that sits on a shelf.',
    tone: 'blue',
  },
  {
    slug: 'qa-testing-support',
    title: 'Software Testing & Support',
    summary:
      'Manual, automated, performance, and ongoing quality services for dependable software releases.',
    body:
      'Release with confidence using a quality program aligned to your product risks and delivery cadence.\n' +
      'FEKRA combines exploratory testing, test automation, performance validation, and structured defect reporting to find costly issues before your users do.\n' +
      'Our engineers can support a single release, strengthen an existing QA function, or operate as a long-term quality partner across web, mobile, and enterprise systems.',
    tone: 'lilac',
  },
  {
    slug: 'enterprise-resources',
    title: 'Enterprise Backup Solutions',
    summary:
      'Resilient backup, recovery, and continuity solutions designed around critical business systems.',
    body:
      'Protect critical systems and data with a backup and recovery strategy designed for the way your organization operates.\n' +
      'We assess risk, recovery objectives, infrastructure, and compliance needs before selecting and implementing the right enterprise solution.\n' +
      'The result is a tested continuity plan with clear ownership, dependable recovery paths, and support when it matters most.',
    tone: 'sky',
  },
  {
    slug: 'design-development',
    title: 'Custom Web & Mobile Development',
    summary:
      'Bespoke web and mobile products designed, engineered, and supported by one accountable team.',
    body:
      'Create fast, usable digital products with a team that connects product thinking, interface design, engineering, and quality assurance.\n' +
      'From responsive websites and customer portals to mobile applications and integrated platforms, FEKRA builds around your users, workflows, and growth plans.\n' +
      'Our iterative delivery process keeps progress visible, reduces rework, and produces software that is ready to operate and evolve.',
    tone: 'coral',
  },
]

export const serviceFamilies: ServiceFamilySeed[] = [
  {
    slug: 'hire-web-developers',
    title: 'Hire Web Developers',
    summary:
      'Build scalable web products with experienced developers across modern front-end and back-end technologies.',
    body:
      'Web development is an integral part of FEKRA’s services. With more than seven years of experience and clients around the world, our teams work with modern, widely adopted web technologies to deliver innovative and effective solutions.\n' +
      'Hire an individual developer or a complete team selected around your stack, delivery goals, and preferred working model.\n' +
      'FEKRA manages recruitment, onboarding, HR, equipment, and ongoing support while you retain direct communication and delivery visibility.',
    tone: 'mint',
    children: (
      [
        ['hire-front-end-developers', 'Hire Front-End Developers'],
        ['hire-angular-developers', 'Hire Angular Developers'],
        ['hire-react-developers', 'Hire React Developers'],
        ['hire-yii-developers', 'Hire Yii Developers'],
        ['hire-laravel-developers', 'Hire Laravel Developers'],
        ['hire-php-developers', 'Hire PHP Developers'],
        ['hire-python-developers', 'Hire Python Developers'],
        ['hire-back-end-developers', 'Hire Back-End Developers'],
      ] as const
    ).map(([slug, title]) => ({
      slug,
      title,
      summary: `${title} through FEKRA’s vetted talent network and flexible engagement models.`,
    })),
  },
  {
    slug: 'hire-javascript-developers',
    title: 'Hire JavaScript Developers',
    summary:
      'Add JavaScript specialists who can build robust, scalable, future-ready digital products.',
    body:
      'FEKRA creates innovative applications that prioritize user experience while supporting scalable, service-oriented architecture.\n' +
      'Our JavaScript developers work across modern frameworks and full-stack environments, helping teams deliver fast, maintainable products that are ready for changing customer needs.\n' +
      'Choose hourly, part-time, or full-time engagement and collaborate directly with specialists selected for your product and technology stack.',
    tone: 'blue',
    children: (
      [
        ['hire-mean-stack-developers', 'Hire MEAN Stack Developers'],
        ['hire-full-stack-developers', 'Hire Full-Stack Developers'],
        ['hire-mern-stack-developers', 'Hire MERN Stack Developers'],
        ['hire-vuejs-developers', 'Hire Vue.js Developers'],
        ['hire-nextjs-developers', 'Hire Next.js Developers'],
        ['hire-nodejs-developers', 'Hire Node.js Developers'],
      ] as const
    ).map(([slug, title]) => ({
      slug,
      title,
      summary: `${title} for secure, maintainable web platforms and product teams that need to move quickly.`,
    })),
  },
  {
    slug: 'hire-mobile-app-developers',
    title: 'Hire Mobile App Developers',
    summary:
      'Build reliable native and cross-platform apps with mobile engineers selected for your product.',
    body:
      'Build fast, reliable, and user-friendly mobile applications with experienced developers who understand seamless experiences across iOS and Android.\n' +
      'Whether you are launching a new product, modernizing an existing application, or expanding your team, FEKRA gives you access to specialists in native and cross-platform technologies.\n' +
      'Every developer is evaluated against your product goals, performance expectations, and preferred stack before joining your team.',
    tone: 'amber',
    children: (
      [
        ['hire-ios-developers', 'Hire iOS Developers'],
        ['hire-android-developers', 'Hire Android Developers'],
        ['hire-flutter-developers', 'Hire Flutter Developers'],
        ['hire-pwa-developers', 'Hire PWA Developers'],
        ['hire-react-native-developers', 'Hire React Native Developers'],
      ] as const
    ).map(([slug, title]) => ({
      slug,
      title,
      summary: `${title} to create dependable mobile experiences with a flexible FEKRA engagement model.`,
    })),
  },
  {
    slug: 'hire-quality-assurance-testers',
    title: 'Hire Quality Assurance Testers',
    summary:
      'Strengthen every release with manual and automation QA specialists who understand product risk.',
    body:
      'Protect product quality with experienced testers who can join your delivery process without slowing it down.\n' +
      'FEKRA provides manual, automation, performance, and regression testing expertise for web, mobile, API, and enterprise platforms.\n' +
      'Our QA specialists are selected around your tools, release cadence, and risk profile, with direct reporting and flexible part-time or full-time engagement.',
    tone: 'lilac',
    children: (
      [
        ['hire-manual-qa-testers', 'Hire Manual QA Testers'],
        ['hire-automation-qa-engineers', 'Hire Automation QA Engineers'],
        ['hire-qa-engineers', 'Hire QA Engineers'],
      ] as const
    ).map(([slug, title]) => ({
      slug,
      title,
      summary: `${title} to improve release confidence, coverage, and product reliability.`,
    })),
  },
  {
    slug: 'hire-microsoft-developers',
    title: 'Hire Microsoft Developers',
    summary:
      'Build scalable applications and cloud platforms with experienced Microsoft technology specialists.',
    body:
      'FEKRA’s experience across Microsoft technologies and the .NET ecosystem helps organizations create scalable, efficient solutions with a strong technical foundation.\n' +
      'Our Microsoft developers work across .NET, ASP.NET Core, Azure, desktop, API, and enterprise environments, complementing front-end teams with reliable back-end and platform expertise.\n' +
      'Hire specialists by the hour, month, or year, with secure collaboration, direct communication, and project confidentiality protected by clear agreements.',
    tone: 'sky',
    children: (
      [
        ['hire-aspnet-developers', 'Hire ASP.NET Developers'],
        ['hire-dotnet-core-developers', 'Hire .NET Core Developers'],
        ['hire-wpf-developers', 'Hire WPF Developers'],
      ] as const
    ).map(([slug, title]) => ({
      slug,
      title,
      summary: `${title} for scalable Microsoft applications, integrations, and enterprise delivery.`,
    })),
  },
]

type PayloadLike = {
  find: (args: never) => Promise<{ docs: Array<{ id: number | string }> }>
  create: (args: never) => Promise<{ id: number | string }>
  update: (args: never) => Promise<{ id: number | string }>
}

type LayoutFactory = (service: ServiceSeed) => unknown[]

async function upsertService(payload: PayloadLike, slug: string, data: Record<string, unknown>) {
  const common = { collection: 'services', context: { disableRevalidate: true } }
  const found = await payload.find({
    ...common,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  } as never)
  const existing = found.docs[0]
  if (existing) return payload.update({ ...common, id: existing.id, data } as never)
  return payload.create({ ...common, data: { ...data, slug } } as never)
}

export async function seedApprovedServices(payload: PayloadLike, layoutFactory: LayoutFactory) {
  // Family metadata must never replace a page's reviewed copy or band color.
  const makeLayout: LayoutFactory = (service) => {
    const design = serviceDesigns.find((entry) => entry.slug === service.slug)
    return layoutFactory(design ? { ...service, title: design.title, body: design.body, summary: design.summary, tone: design.heroTone } : service)
  }
  const roots = new Map<string, { id: number | string }>()
  let order = 20

  for (const service of deliveryServices) {
    const saved = await upsertService(payload, service.slug, {
      title: service.title,
      summary: service.summary,
      parent: null,
      order: order++,
      menuRoles: [],
      layout: makeLayout(service),
      meta: { title: `${service.title} | FEKRA`, description: service.summary },
      availableLocales: ['en'],
      _status: 'published',
    })
    roots.set(service.slug, saved)
  }

  for (const family of serviceFamilies) {
    const saved = await upsertService(payload, family.slug, {
      title: family.title,
      summary: family.summary,
      parent: null,
      order: order++,
      menuRoles: family.children.map((child) => ({ label: child.title })),
      layout: makeLayout(family),
      meta: { title: `${family.title} | FEKRA`, description: family.summary },
      availableLocales: ['en'],
      _status: 'published',
    })
    roots.set(family.slug, saved)
  }

  let childOrder = 100
  for (const family of serviceFamilies) {
    const parent = roots.get(family.slug)
    if (!parent) continue
    const siblings: Array<{ id: number | string }> = []

    for (const child of family.children) {
      const childService: ServiceSeed = {
        ...child,
        tone: family.tone,
        body:
          `${child.summary}\n` +
          `FEKRA selects ${child.title.replace(/^Hire /, '')} around your stack, delivery goals, collaboration hours, and preferred engagement model.\n` +
          'Start with an individual specialist or a complete team, with recruitment, onboarding, HR, equipment, and ongoing support managed for you.',
      }
      const saved = await upsertService(payload, child.slug, {
        title: child.title,
        summary: child.summary,
        parent: Number(parent.id),
        order: childOrder++,
        menuRoles: [],
        layout: makeLayout(childService),
        meta: { title: `${child.title} | FEKRA`, description: child.summary },
        availableLocales: ['en'],
        _status: 'published',
      })
      siblings.push(saved)
    }

    for (const sibling of siblings) {
      await payload.update({
        collection: 'services',
        id: sibling.id,
        context: { disableRevalidate: true },
        data: {
          relatedServices: siblings
            .filter((item) => item.id !== sibling.id)
            .slice(0, 5)
            .map((item) => Number(item.id)),
        },
      } as never)
    }
  }
}
