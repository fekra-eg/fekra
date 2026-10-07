import { BidiText } from '@/components/BidiText'
import { IntentLink as Link } from './IntentLink'
import { localeHref, type Locale } from '@/i18n/routing'
import type { Dictionary } from '@/i18n/getDictionary'
import type { ServicesMenu } from './Header'

const PLACEMENT: Record<string, string> = {
  'hire-in-demand-developers': 'col-span-2 col-start-1 row-start-1',
  'hire-front-end-developers': 'col-start-1 row-start-2',
  'hire-back-end-developers': 'col-start-2 row-start-2',
  'hire-full-stack-developers': 'col-start-3 row-start-1',
  'hire-ai-data-experts': 'col-start-3 row-start-2',
  'hire-mobile-app-developers': 'col-start-4 row-start-1',
  'hire-qa-engineers': 'col-start-4 row-start-2',
  'hire-devops-cloud-engineers': 'col-start-5 row-start-1',
}

export function ServicesMegaMenu({ services, locale, dict }: { services: ServicesMenu; locale: Locale; dict: Dictionary }) {
  return <div className="invisible fixed inset-x-0 top-full z-50 mx-auto max-w-[1240px] pt-2 opacity-0 transition-[opacity,visibility] group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
    <div data-services-menu className="relative max-h-[min(510px,68dvh)] overflow-y-auto overscroll-contain rounded-[24px] border border-border bg-card px-7 pt-8 pb-7 shadow-lift">
      <div className="grid grid-cols-5 items-start gap-x-6 gap-y-6">
        {services.map((service) => <div key={service.slug} className={PLACEMENT[service.slug]}>
          <Link href={localeHref(locale, `/services/${service.slug}`)} className="block pb-2 text-[13px]/5 font-bold text-navy-800 hover:text-primary dark:text-foreground"><BidiText>{service.title}</BidiText></Link>
          <ul className={service.slug === 'hire-in-demand-developers' ? 'grid grid-flow-col grid-rows-6 gap-x-6' : ''}>
            {service.roles.map((role) => <li key={`${role.slug}:${role.title}`} className="border-s border-border ps-2">
              <Link href={localeHref(locale, `/services/${role.slug}`)} className="block py-0.5 text-[13px]/[18px] text-muted-foreground hover:text-primary"><BidiText>{role.title}</BidiText></Link>
            </li>)}
          </ul>
        </div>)}
        <div className="col-start-5 row-start-2 self-center rounded-[20px] border border-primary px-3 pt-4 text-center">
          <p className="text-sm/5 text-navy-800 dark:text-foreground"><BidiText>{dict.nav.buildTeam}</BidiText></p>
          <Link href={localeHref(locale, '/contact')} className="fk-button fk-button--primary relative -mb-4 mt-3 inline-flex min-h-11 items-center rounded-pill bg-primary px-6 text-sm font-semibold text-primary-foreground">{dict.nav.hireNow}</Link>
        </div>
      </div>
    </div>
  </div>
}
