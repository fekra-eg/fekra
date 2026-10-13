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
      <Image src="/images/logo-mark.svg" alt="" width={22} height={35} aria-hidden className="h-10 w-auto sm:h-[46px]" />
      <span className="flex flex-col items-start gap-1">
        <Image
          src="/images/logo-wordmark.svg"
          alt=""
          width={113}
          height={16}
          aria-hidden
          className="h-[18px] w-auto sm:h-[21px] dark:brightness-0 dark:invert"
        />
        <span className="text-[9px] leading-none sm:text-[10.5px] whitespace-nowrap text-navy-800 dark:text-foreground">
          Loyalty . Innovation . Expansion
        </span>
      </span>
    </span>
  )
}
