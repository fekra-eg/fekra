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

// The home <title> Google shows as the result headline — kept out of the CMS so
// a "Home" meta title can never ship again.
export const homeTitle: Record<Locale, string> = {
  en: 'FekraTech: Your Trusted Technology & Outsourcing Partner',
  ar: 'فكرة تك: شريكك الموثوق في التكنولوجيا والتعهيد',
  de: 'FekraTech: Ihr verlässlicher Technologie- und Outsourcing-Partner',
  fr: 'FekraTech : votre partenaire de confiance en technologie et outsourcing',
  es: 'FekraTech: tu socio de confianza en tecnología y outsourcing',
}

export const homeDescription: Record<Locale, string> = {
  en: 'Build and scale your technology team with FEKRA. Hire vetted software, AI, and QA engineers through flexible team extension and dedicated delivery models.',
  ar: 'ابنِ فريقك التقني ووسّعه مع فكرة. وظّف مهندسي برمجيات وذكاء اصطناعي وجودة مختارين بعناية، بنماذج مرنة لتوسيع الفرق والتسليم المتخصص.',
  de: 'Bauen und erweitern Sie Ihr Tech-Team mit FEKRA. Finden Sie geprüfte Software-, KI- und QA-Fachkräfte für flexible Teamerweiterung und dedizierte Teams.',
  fr: 'Constituez et développez votre équipe technique avec FEKRA. Recrutez des ingénieurs logiciels, IA et QA évalués, en renfort ou en équipe dédiée.',
  es: 'Crea y amplía tu equipo tecnológico con FEKRA. Incorpora profesionales evaluados de software, IA y QA mediante equipos dedicados o ampliación de equipos.',
}
