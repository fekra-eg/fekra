import type { Locale } from '@/i18n/routing'

/** Corrections to exact reviewed copy, without changing later editorial edits. */
const OLD_TITLES: Record<Locale, string> = {
  en: 'Software Outsourcing in 2026: When It Works, When It Fails',
  ar: 'الاستعانة بمصادر خارجية لتطوير البرمجيات في 2026: متى تنجح ومتى تفشل',
  de: 'Software-Outsourcing 2026: Wann es funktioniert, wann es scheitert',
  fr: 'Externalisation logicielle en 2026 : quand ça marche, quand ça échoue',
  es: 'Externalización de software en 2026: cuándo funciona, cuándo falla',
}
const TITLES: Record<Locale, string> = {
  en: "Outsourcing Software Development to Egypt: Buyer's Guide",
  ar: 'دليل المشتري: الاستعانة بمصادر خارجية لتطوير البرمجيات في مصر',
  de: 'Auslagerung der Softwareentwicklung nach Ägypten: Käuferleitfaden',
  fr: "Externalisation du développement logiciel vers l'Égypte : guide de l'acheteur",
  es: 'Externalización del desarrollo de software a Egipto: Guía del comprador',
}
const EXCERPTS: Record<Locale, string> = {
  en: 'Compare software development partners in Egypt: talent, collaboration hours, engagement models, total cost, security and the first 30 days.',
  ar: 'قارن شركاء تطوير البرمجيات في مصر من حيث المواهب وساعات التعاون ونماذج التعاقد والتكلفة الكاملة والأمان وأول 30 يومًا.',
  de: 'Vergleichen Sie Softwareentwicklungspartner in Ägypten: Talente, Zusammenarbeit, Vertragsmodelle, Gesamtkosten, Sicherheit und die ersten 30 Tage.',
  fr: 'Comparez les partenaires de développement en Égypte : talents, collaboration, modèles de contrat, coût total, sécurité et 30 premiers jours.',
  es: 'Compara proveedores de desarrollo en Egipto: talento, colaboración, modelos de contratación, coste total, seguridad y los primeros 30 días.',
}
type Post = { slug?: string; title?: string; excerpt?: string | null; htmlContent?: string | null; meta?: { title?: string | null; description?: string | null; [key: string]: unknown } | null }
export function correctReviewPost<T extends Post>(post: T, locale: Locale): T {
  const result = { ...post }
  if (locale === 'ar' && result.htmlContent) {
    result.htmlContent = result.htmlContent
      .replaceAll('الأربعون يومًا الأولى', 'الثلاثون يومًا الأولى')
      .replaceAll('احتفظ بساوريتين منفصلتين.', 'ميّز بين مدة ترشيح الكفاءات وموعد بدء العمل الفعلي.')
  }
  if (post.slug === 'software-outsourcing-in-2026' && post.title?.replace(/\s/g, ' ') === OLD_TITLES[locale]) {
    result.title = TITLES[locale]
    result.excerpt = EXCERPTS[locale]
    result.meta = { ...post.meta, title: TITLES[locale], description: EXCERPTS[locale] }
  }
  return result
}
