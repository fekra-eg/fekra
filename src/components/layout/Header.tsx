import Link from 'next/link'

import { BrandLogo } from '@/components/layout/BrandLogo'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { LinkButton } from '@/components/ui/Button'
import type { Dictionary } from '@/i18n/getDictionary'
import type { Locale, LocaleAvailability } from '@/i18n/routing'
import { localeHref } from '@/i18n/routing'
import { resolveLink, type PayloadLink } from '@/lib/resolveLink'

import { HeaderShell } from './HeaderShell'
import { MobileNav } from './MobileNav'
import { NavItem } from './NavItem'
import { NavLink } from './NavLink'
import { ServicesMegaMenu } from './ServicesMegaMenu'

export type HeaderData = {
  items?: { link?: PayloadLink; children?: { link?: PayloadLink; description?: string }[] }[] | null
  ctas?: { variant?: 'primary' | 'secondary' | 'ghost'; link?: PayloadLink }[] | null
  announcement?: { enabled?: boolean; text?: string; link?: PayloadLink } | null
}

export type ServicesMenu = {
  title: string
  slug: string
  href: string
  roles: { title: string; slug: string; href: string }[]
}[]

export function Header({
  data,
  locale,
  dict,
  siteName,
  servicesMenu,
  availability,
}: {
  data: HeaderData
  locale: Locale
  dict: Dictionary
  siteName: string
  servicesMenu?: ServicesMenu
  availability?: LocaleAvailability
}) {
  const items = (data.items ?? [])
    .map((item) => ({
      link: resolveLink(item.link, locale),
      children: (item.children ?? [])
        .map((c) => ({ link: resolveLink(c.link, locale), description: c.description }))
        .filter((c) => c.link),
    }))
    .filter((i) => i.link)

  if (locale === 'ar') {
    for (const item of items) for (const child of item.children) {
      const service = servicesMenu?.find((service) => service.href === child.link?.href)
      if (service && child.link) child.link = { ...child.link, label: service.title }
    }
  }

  const ctas = (data.ctas ?? [])
    .map((c) => ({ variant: c.variant ?? 'primary', link: resolveLink(c.link, locale) }))
    .filter((c) => c.link)

  const announcement = data.announcement?.enabled
    ? resolveLink(data.announcement.link, locale)
    : null

  return (
    <>
      {/* 23.2 — first tab stop skips the whole nav. */}
      <a
        href="#main"
        className="fk-button fk-button--primary sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-100 focus:rounded-pill focus:bg-primary focus:px-5 focus:py-3 focus:text-primary-foreground"
      >
        {dict.nav.skipToContent}
      </a>

      {announcement ? (
        <div className="bg-primary text-primary-foreground">
          <div className="container-wide flex items-center justify-center gap-3 py-2 text-sm">
            <span>{data.announcement?.text}</span>
            <Link href={announcement.href} className="font-semibold underline underline-offset-4">
              {announcement.label}
            </Link>
          </div>
        </div>
      ) : null}

      <HeaderShell>
        {/* The Figma lockup (1:14126); the CMS logo uploads are no longer used. */}
        <Link
          href={localeHref(locale, '/')}
          className="flex min-h-11 shrink-0 items-center gap-2"
          aria-label={siteName}
        >
          <BrandLogo />
        </Link>

        {/*
          Burger until `xl`, not `lg`. The pill is max-w-[min(1400px,92vw)],
          so at 1024px (iPad landscape) the bar has ~940px for the logo,
          seven links, the language and theme controls and the CTA — and
          "Contact Us" and "Meet Fika AI" wrapped onto two and three lines,
          leaving a broken two-storey header (16.3). 1280px fits it.

          Re-measured: the seven labels need ~560px even with nowrap, plus a
          205px lockup and ~290px of controls — ~1055px against 942 available.
          Tightening the gap and the CTA does not close a 113px deficit, so this
          stays at `xl` until the nav loses an item.
        */}
        <nav data-main-nav aria-label={dict.nav.main} className="hidden xl:block">
          <ul className="flex items-center gap-4">
            {items.map((item) => {
              const mega = (item.link!.activeHref ?? item.link!.href) === localeHref(locale, '/services') && servicesMenu?.length ? servicesMenu : null
              return (
                <NavItem key={item.link!.href}>
                  <NavLink link={item.link!} hasChildren={item.children.length > 0} />
                  {mega ? (
                    <>
                      {/* Invisible bridge so the pointer can travel from the link
                          down to the panel without leaving the hover group. */}
                      <span
                        aria-hidden
                        className="invisible absolute -inset-x-10 top-full h-8 group-hover:visible"
                      />
                      <ServicesMegaMenu services={mega} locale={locale} dict={dict} />
                    </>
                  ) : item.children.length ? (
                    <ul className="invisible absolute start-0 top-full z-50 min-w-64 rounded-card border border-border bg-card p-2 opacity-0 shadow-lift transition-[opacity,visibility] group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      {item.children.map((child) => (
                        <li key={child.link!.href}>
                          <Link
                            href={child.link!.href}
                            className="block rounded-lg px-3 py-2 transition-colors hover:bg-background-subtle"
                          >
                            <span className="block text-sm font-medium">{child.link!.label}</span>
                            {child.description ? (
                              <span className="block text-xs text-muted-foreground">
                                {child.description}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </NavItem>
              )
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <LanguageSwitcher
            current={locale}
            availability={availability}
            labels={{ switch: dict.language.switch, unavailable: dict.language.unavailable }}
          />

          <ThemeToggle label={dict.theme.toggle} />

          <div data-header-ctas className="hidden xl:flex xl:items-center xl:gap-2 xl:ps-1">
            {ctas.map((cta) => (
              <LinkButton
                key={cta.link!.href}
                link={cta.link!}
                variant={cta.variant}
                size="md"
                className="h-12 px-4"
              />
            ))}
          </div>

          <MobileNav items={items} ctas={ctas} dict={dict} />
        </div>
      </HeaderShell>
    </>
  )
}
