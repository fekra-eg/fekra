import type { Locale } from '@/i18n/routing'

/** Generated editorial images for the default hero, in photo-slot order.
 * The people are synthetic, not portraits of FEKRA employees.
 * Custom CMS uploads keep their own image and alternative text. */
export const HERO_PHOTOS = [
  { file: 'egypt-developer-window.webp', alt: { en: 'Developer working at a laptop beside an office window', ar: 'مطور يعمل على حاسوبه بجوار نافذة المكتب', de: 'Entwickler am Laptop neben einem Bürofenster', fr: 'Développeur travaillant sur son ordinateur près d’une fenêtre', es: 'Desarrollador trabajando con su portátil junto a una ventana' } },
  { file: 'egypt-developer-focus.webp', alt: { en: 'Developer concentrating at her desk', ar: 'مطورة تركّز على عملها في مكتبها', de: 'Entwicklerin konzentriert an ihrem Schreibtisch', fr: 'Développeuse concentrée à son bureau', es: 'Desarrolladora concentrada en su escritorio' } },
  { file: 'egypt-courtyard-pair.webp', alt: { en: 'Two developers discussing work in an office courtyard', ar: 'مطوران يناقشان العمل في فناء المكتب', de: 'Zwei Entwickler besprechen ihre Arbeit im Innenhof', fr: 'Deux développeurs échangent dans la cour du bureau', es: 'Dos desarrolladores conversan en el patio de la oficina' } },
  { file: 'egypt-team-discussion.webp', alt: { en: 'Developers discussing a project in a shared workspace', ar: 'مطورون يناقشون مشروعًا في مساحة عمل مشتركة', de: 'Entwickler besprechen ein Projekt im Coworking-Bereich', fr: 'Développeurs discutant d’un projet dans un espace partagé', es: 'Desarrolladores comentan un proyecto en un espacio compartido' } },
  { file: 'egypt-engineer-office.webp', alt: { en: 'Engineer working in a shared office', ar: 'مهندس يعمل في مكتب مشترك', de: 'Ingenieur bei der Arbeit in einem Gemeinschaftsbüro', fr: 'Ingénieur au travail dans un bureau partagé', es: 'Ingeniero trabajando en una oficina compartida' } },
  { file: 'egypt-pair-programming.webp', alt: { en: 'Two engineers reviewing code together at a laptop', ar: 'مهندسان يراجعان الكود معًا على حاسوب', de: 'Zwei Ingenieure prüfen gemeinsam Code am Laptop', fr: 'Deux ingénieurs relisent du code ensemble', es: 'Dos ingenieros revisan código juntos en un portátil' } },
  { file: 'egypt-senior-engineer.webp', alt: { en: 'Senior engineer concentrating on his laptop', ar: 'مهندس أول يركّز على حاسوبه', de: 'Senior-Ingenieur konzentriert am Laptop', fr: 'Ingénieur senior concentré sur son ordinateur', es: 'Ingeniero sénior concentrado en su portátil' } },
  { file: 'egypt-terrace-developer.webp', alt: { en: 'Developer working on a shaded office terrace', ar: 'مطور يعمل على شرفة مظللة في المكتب', de: 'Entwickler auf einer schattigen Büroterrasse', fr: 'Développeur travaillant sur une terrasse ombragée', es: 'Desarrollador trabajando en una terraza con sombra' } },
  { file: 'egypt-team-planning.webp', alt: { en: 'A development team planning work around a whiteboard', ar: 'فريق تطوير يخطط للعمل حول سبورة', de: 'Ein Entwicklerteam plant am Whiteboard', fr: 'Une équipe de développement planifie autour d’un tableau blanc', es: 'Un equipo de desarrollo planifica frente a una pizarra' } },
] as const

const LEGACY_PHOTO = /^(?:tile-0[1-9]|developer-workspace-side|developer-desk-bright|team-standup-review|team-focus-coworking|developer-coding-window|team-pairing-session|team-planning-session|developer-desk-portrait|team-review-huddle|team-lounge-pair)(?:-\d+)?\.(?:png|webp|jpe?g)$/i

export function defaultHeroPhoto(url: string | null | undefined, photoIndex: number, locale: Locale) {
  const filename = (url ?? '').split(/[?#]/)[0]!.split('/').pop() ?? ''
  const photo = HERO_PHOTOS[photoIndex]
  if (!photo || (url && !LEGACY_PHOTO.test(filename))) return undefined
  return { url: `/images/hero/${photo.file}`, alt: photo.alt[locale] }
}
