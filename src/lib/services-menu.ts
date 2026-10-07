import arabicServices from '@/i18n/dictionaries/ar-services.json'
import type { Locale } from '@/i18n/routing'
import type { ServicesMenu } from '@/components/layout/Header'

type Service = { slug: string; title: string; menuRoles?: { label: string }[] | null }
const groups = [
  { slug: 'hire-in-demand-developers', roles: [] },
  {
    slug: 'hire-front-end-developers',
    roles: ['React', 'Angular', 'Vue.js', 'Next.js', 'JavaScript', 'TypeScript'],
  },
  {
    slug: 'hire-back-end-developers',
    roles: [
      'Python',
      'Node.js',
      'Java',
      'Spring Boot',
      '.NET',
      'ASP.NET Core',
      'PHP',
      'Laravel',
      'Golang',
    ],
  },
  {
    slug: 'hire-full-stack-developers',
    roles: [
      'Full-Stack',
      'MERN Stack',
      'MEAN Stack',
      'Java Full-Stack',
      '.NET Full-Stack',
      'Python Full-Stack',
    ],
  },
  { slug: 'hire-ai-data-experts', roles: [] },
  {
    slug: 'hire-mobile-app-developers',
    roles: ['iOS', 'Android', 'React Native', 'Flutter', 'Kotlin', 'Swift'],
  },
  {
    slug: 'hire-qa-engineers',
    roles: ['Manual QA', 'Automation QA', 'SDET', 'Performance Test', 'Mobile QA', 'API Test'],
  },
  { slug: 'hire-devops-cloud-engineers', roles: [] },
] as const

const approvedArabicGroups: Record<string, { title: string; roles: string[] }> = {
  'hire-in-demand-developers': {
    title: 'Hire In-Demand Developers',
    roles: [
      'AI Developer',
      'MEAN Stack Developers',
      'Data Engineers',
      'Full-Stack Developers',
      'MERN Stack Developers',
      'Python Developers',
      'JavaScript Developers',
      'AWS Developers',
      'CRM Developers',
      'Graphic Designers',
      'Odoo Developers',
      'Blockchain Developers',
    ],
  },
  'hire-full-stack-developers': {
    title: 'Hire Full-Stack Developers',
    roles: [
      'Full-Stack Developers',
      'MERN Stack Developers',
      'MEAN Stack Developers',
      'Java Full-Stack Developers',
      '.NET Full-Stack Developers',
      'Python Full-Stack Developers',
    ],
  },
  'hire-mobile-app-developers': {
    title: 'Hire Mobile App Developers',
    roles: [
      'iOS Developers',
      'Android Developers',
      'React Native Developers',
      'Flutter Developers',
      'Kotlin Developers',
      'Swift Developers',
    ],
  },
  'hire-devops-cloud-engineers': {
    title: 'Hire DevOps & Cloud Engineers',
    roles: [
      'DevOps Engineers',
      'Cloud Engineers',
      'AWS Engineers',
      'Azure Engineers',
      'Google Cloud Engineers',
      'Site Reliability Engineers',
      'Platform Engineers',
      'Kubernetes Engineers',
    ],
  },
  'hire-front-end-developers': {
    title: 'Hire Front-End Developers',
    roles: [
      'React Developers',
      'Angular Developers',
      'Vue.js Developers',
      'Next.js Developers',
      'JavaScript Developers',
      'TypeScript Developers',
    ],
  },
  'hire-back-end-developers': {
    title: 'Hire Back-End Developers',
    roles: [
      'Python Developers',
      'Node.js Developers',
      'Java Developers',
      'Spring Boot Developers',
      '.NET Developers',
      'ASP.NET Core Developers',
      'PHP Developers',
      'Laravel Developers',
      'Golang Developers',
    ],
  },
  'hire-ai-data-experts': {
    title: 'Hire AI & Data Experts',
    roles: [
      'AI Engineers',
      'Machine Learning Engineers',
      'Data Engineers',
      'Data Scientists',
      'MLOps Engineers',
      'NLP Engineers',
      'Computer Vision Engineers',
      'BI Developers',
    ],
  },
  'hire-qa-engineers': {
    title: 'Hire QA Engineers',
    roles: [
      'Manual QA Engineers',
      'Automation QA Engineers',
      'SDET Engineers',
      'Performance Test Engineers',
      'Mobile QA Engineers',
      'API Test Engineers',
    ],
  },
}

const roleTitle = (technology: string, engineer: boolean, locale: Locale) => {
  const titles = {
    en: `${technology} ${engineer ? 'Engineers' : 'Developers'}`,
    ar: `${engineer ? 'مهندسو' : 'مطورو'} ${technology}`,
    de: `${technology}-${engineer ? 'Engineers' : 'Entwickler'}`,
    fr: `${engineer ? 'Ingénieurs' : 'Développeurs'} ${technology}`,
    es: `${engineer ? 'Ingenieros' : 'Desarrolladores'} ${technology}`,
  }
  return titles[locale]
}

// Technology pages whose slug isn't `hire-<tech>-developers`.
const ROLE_SLUGS: Record<string, string> = {
  '.NET': 'hire-dotnet-core-developers',
  'ASP.NET Core': 'hire-aspnet-developers',
  'Full-Stack': 'hire-full-stack-developers',
  'Manual QA': 'hire-manual-qa-testers',
  'Automation QA': 'hire-automation-qa-engineers',
}

/** Explicit groups follow the approved comp independently of the CMS taxonomy. */
export function buildServicesMenu(services: Service[], locale: Locale): ServicesMenu {
  const bySlug = new Map(services.map((service) => [service.slug, service]))
  // A role links to its own technology page when one is published, else to its
  // group — the menu used to send ~70 links to 8 pages (FK-24/27).
  const roleSlug = (technology: string, fallback: string) => {
    const tech = technology.replace(/ (Developers|Engineers)$/, '')
    const slug = ROLE_SLUGS[tech] ?? `hire-${tech.toLowerCase().replace(/\./g, '').replace(/\s+/g, '-')}-developers`
    return bySlug.has(slug) ? slug : fallback
  }
  return groups.flatMap((group) => {
    const service = bySlug.get(group.slug)
    if (!service) return []
    if (locale === 'ar') {
      const approved = approvedArabicGroups[group.slug]!
      const translate = (key: string) => arabicServices[key as keyof typeof arabicServices]
      return [
        {
          title: translate(approved.title),
          slug: group.slug,
          roles: approved.roles.map((label) => ({ title: translate(label), slug: roleSlug(label, group.slug) })),
        },
      ]
    }
    const roles = group.roles.length
      ? group.roles.map((technology) => {
          return {
            title: roleTitle(technology, group.slug === 'hire-qa-engineers', locale),
            slug: roleSlug(technology, group.slug),
          }
        })
      : (service.menuRoles ?? []).map((role) => ({ title: role.label, slug: group.slug }))
    return [{ title: service.title, slug: service.slug, roles }]
  })
}
