import Image from 'next/image'

/**
 * The FEKRA lockup from Figma 1:14126 — building mark, wordmark and tagline.
 * Decorative throughout: the wrapping link carries the accessible name.
 */
export function BrandLogo() {
  return (
    <span className="flex items-center gap-2">
      {/* The SVGs are cropped to the artwork; scale by height so the lockup
          reads at brand size without growing the h-16 header bar. */}
      <Image src="/images/logo-mark.svg" alt="" width={22} height={35} aria-hidden className="h-10 w-auto max-[359px]:h-8 sm:h-[46px]" />
      <span className="flex flex-col items-start gap-1">
        <Image
          src="/images/logo-wordmark.svg"
          alt=""
          width={113}
          height={16}
          aria-hidden
          className="h-[18px] w-auto max-[359px]:h-[15px] sm:h-[21px] dark:brightness-0 dark:invert"
        />
        {/* Under 360px the full lockup pushes the burger off-screen; the tagline goes and the mark shrinks (T-19). */}
        <span className="text-[9px] leading-none max-[359px]:hidden sm:text-[10.5px] whitespace-nowrap text-navy-800 dark:text-foreground">
          Loyalty . Innovation . Expansion
        </span>
      </span>
    </span>
  )
}
