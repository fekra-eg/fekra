import { NotFoundCopy } from '@/components/NotFoundCopy'
import { getDictionary } from '@/i18n/getDictionary'
import { PUBLIC_LOCALES } from '@/i18n/routing'

/**
 * Localized from the URL on the client: reading the proxy's pathname header
 * here made the whole /[locale] tree dynamic. Unmatched routes use the
 * CMS-independent global-not-found document.
 */
export default async function NotFound() {
  const copies = Object.fromEntries(
    await Promise.all(PUBLIC_LOCALES.map(async (locale) => [locale, (await getDictionary(locale)).notFound])),
  )

  return (
    <div className="section">
      <div className="container-site flex min-h-[50dvh] flex-col items-center justify-center text-center">
        <p className="font-display text-6xl font-bold text-primary">404</p>
        <NotFoundCopy copies={copies} />
      </div>
    </div>
  )
}
