import type { Locale } from './routing'

/** Exact legacy-copy replacements only. New editorial copy is left untouched.
 * Applied to CMS reads so existing records and future seeds behave alike,
 * without overwriting editors' data or requiring a production data migration. */
const english: Record<string, string> = {
  'All Businesses Types': 'Businesses We Serve',
  'Our Industry Expertises': 'Our Industry Expertise',
  'Startups Business': 'Startups',
  'Small Business': 'Small Businesses',
  'Enterprise Business': 'Enterprises',
  'Agency Business': 'Agencies',
  'Top Talents': 'Top Talent',
  'Contact us': 'Contact Us',
  'Our locations': 'Our Locations',
}

const contact = {
  en: ['Contact Us', "Let's Talk Business!"],
  ar: ['تواصل معنا', 'لنتحدث عن مشروعك!'],
  de: ['Kontaktieren Sie uns', 'Sprechen wir über Ihr Projekt!'],
  fr: ['Contactez-nous', 'Parlons de votre projet !'],
  es: ['Contáctanos', '¡Hablemos de tu proyecto!'],
} satisfies Record<Locale, [string, string]>

export const certificationHeading: Record<Locale, string> = {
  en: 'Partnerships & Certifications', ar: 'الشراكات والشهادات',
  de: 'Partnerschaften & Zertifizierungen', fr: 'Partenariats et certifications',
  es: 'Alianzas y certificaciones',
}

export const talentStatement = {
  de: { before: 'Mehr als 50 Unternehmen setzen auf', highlight: 'die besten 3 % der Tech-Talente', after: 'zur Erweiterung ihrer Entwicklungsteams.' },
  fr: { before: 'Plus de 50 entreprises font appel aux', highlight: '3 % des meilleurs talents', after: 'pour développer leurs équipes techniques.' },
  es: { before: 'Más de 50 empresas confían en', highlight: 'el 3 % del mejor talento tecnológico', after: 'para ampliar sus equipos de desarrollo.' },
}

export function correctQaCopy(text: string, locale: Locale): string {
  if (/^let[’']s talk business!$/i.test(text)) return contact[locale][1]
  if (/^contact us$/i.test(text)) return contact[locale][0]
  if (locale === 'de' && text === 'Meet Fika AI') return 'Fika AI kennenlernen'
  return locale === 'en' ? english[text] ?? text : text
}

export function correctQaDocument<T>(value: T, locale: Locale): T {
  if (typeof value === 'string') return correctQaCopy(value, locale) as T
  if (Array.isArray(value)) return value.map((item) => correctQaDocument(item, locale)) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, correctQaDocument(item, locale)])) as T
  }
  return value
}

// The home <title> and snippet Google shows — kept out of the CMS so a "Home"
// meta title can never ship again.
export const homeTitle: Record<Locale, string> = {
  en: 'Fekra Tech | Software Outsourcing & Dedicated Teams',
  ar: 'فكرة تك | تعهيد البرمجيات والفرق المخصصة',
  de: 'Fekra Tech | Software-Outsourcing & dedizierte Teams',
  fr: 'Fekra Tech | Externalisation logicielle & équipes dédiées',
  es: 'Fekra Tech | Outsourcing de software y equipos dedicados',
}

export const homeDescription: Record<Locale, string> = {
  en: 'Build your team with Fekra Tech. We provide software outsourcing and dedicated developers to help businesses scale and deliver quality digital products.',
  ar: 'ابنِ فريقك مع فكرة تك. نقدّم خدمات تعهيد البرمجيات ومطوّرين مخصّصين لمساعدة الشركات على التوسع وتقديم منتجات رقمية عالية الجودة.',
  de: 'Bauen Sie Ihr Team mit Fekra Tech auf. Wir bieten Software-Outsourcing und dedizierte Entwickler, damit Unternehmen wachsen und hochwertige digitale Produkte liefern.',
  fr: 'Constituez votre équipe avec Fekra Tech. Nous proposons l’externalisation logicielle et des développeurs dédiés pour aider les entreprises à croître et à livrer des produits numériques de qualité.',
  es: 'Forma tu equipo con Fekra Tech. Ofrecemos outsourcing de software y desarrolladores dedicados para ayudar a las empresas a crecer y entregar productos digitales de calidad.',
}

/** Title + meta description of the pages we want as Google sitelinks. */
type Sitelink = 'services' | 'about' | 'blog' | 'contact' | 'careers'
export const sitelinkCopy: Record<Locale, Record<Sitelink, { title: string; description: string }>> = {
  en: {
    services: { title: 'Services', description: 'Explore our technology services and solutions.' },
    about: { title: 'About Us', description: 'Meet Fekra Tech and learn about our team.' },
    blog: { title: 'Blog', description: 'Insights, company news and technology updates.' },
    contact: { title: 'Contact Us', description: 'Talk to us about your team and project requirements.' },
    careers: { title: 'Careers', description: 'Explore opportunities to join Fekra Tech.' },
  },
  ar: {
    services: { title: 'الخدمات', description: 'استكشف خدماتنا وحلولنا التقنية.' },
    about: { title: 'من نحن', description: 'تعرّف على فكرة تك وفريقنا.' },
    blog: { title: 'المدونة', description: 'رؤى وأخبار الشركة وآخر مستجدات التكنولوجيا.' },
    contact: { title: 'تواصل معنا', description: 'تحدّث إلينا عن فريقك ومتطلبات مشروعك.' },
    careers: { title: 'الوظائف', description: 'اكتشف فرص الانضمام إلى فكرة تك.' },
  },
  de: {
    services: { title: 'Leistungen', description: 'Entdecken Sie unsere Technologie-Services und Lösungen.' },
    about: { title: 'Über uns', description: 'Lernen Sie Fekra Tech und unser Team kennen.' },
    blog: { title: 'Blog', description: 'Einblicke, Unternehmensnews und Technologie-Updates.' },
    contact: { title: 'Kontakt', description: 'Sprechen Sie mit uns über Ihr Team und Ihre Projektanforderungen.' },
    careers: { title: 'Karriere', description: 'Entdecken Sie Möglichkeiten, Teil von Fekra Tech zu werden.' },
  },
  fr: {
    services: { title: 'Services', description: 'Découvrez nos services et solutions technologiques.' },
    about: { title: 'À propos', description: 'Découvrez Fekra Tech et notre équipe.' },
    blog: { title: 'Blog', description: 'Analyses, actualités de l’entreprise et nouveautés technologiques.' },
    contact: { title: 'Contact', description: 'Parlez-nous de votre équipe et des besoins de votre projet.' },
    careers: { title: 'Carrières', description: 'Découvrez les opportunités pour rejoindre Fekra Tech.' },
  },
  es: {
    services: { title: 'Servicios', description: 'Descubre nuestros servicios y soluciones tecnológicas.' },
    about: { title: 'Sobre nosotros', description: 'Conoce Fekra Tech y a nuestro equipo.' },
    blog: { title: 'Blog', description: 'Análisis, noticias de la empresa y novedades tecnológicas.' },
    contact: { title: 'Contacto', description: 'Háblanos de tu equipo y de los requisitos de tu proyecto.' },
    careers: { title: 'Empleo', description: 'Descubre oportunidades para unirte a Fekra Tech.' },
  },
}
