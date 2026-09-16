import Image from "next/image";

/**
 * The wordmark, as artwork rather than as type.
 *
 * Two files ship with the brand and they are not a colour preference — `cylent_logo.svg`
 * sets the letters in #2B2F3F for light grounds, `cylent_logo_light.svg` sets them in
 * #EBF5F4 for dark ones. Both carry the same navy → cyan gradient on the mark, which is the
 * logo's own and deliberately not the site accent: the artwork is the brand's, and nothing
 * here recolours it.
 *
 * Sized by height — but that number reads smaller than it measures, and it is worth knowing
 * why before trying to fix it in the wrong place. Both files are tight: the ink runs the
 * full viewBox, 0,0 → 3900.72,1437.81, with nothing to crop. What makes the mark look small
 * is that it is lowercase. The box is set by the l's ascender and the y's descender, while
 * the letters a reader actually measures it by — c, e, n — are the x-height band in the
 * middle, a little over half of it. So a 2rem logo presents about 1.07rem of visible word,
 * and every height here is chosen against that, not against the box.
 *
 * The intrinsic pair below is that viewBox reduced. Next needs a ratio; the rendered size
 * comes from `className`.
 */
const VARIANTS = {
  ink: "/images/cylent_logo.svg",
  light: "/images/cylent_logo_light.svg",
} as const;

type LogoProps = {
  /** `ink` on our light surfaces, `light` on an ink ground. */
  variant?: keyof typeof VARIANTS;
  /** Size and any positioning. */
  className?: string;
  /**
   * Which axis the caller is setting. `height` is the wordmark's own alignment axis and the
   * default; `width` is for the footer watermark, the one place the mark is sized by the
   * space rather than the space by the mark.
   */
  fit?: "height" | "width";
  /**
   * Empty where the company is already named in adjacent text, so the mark is not read
   * out twice.
   */
  alt?: string;
  priority?: boolean;
};

export function Logo({
  variant = "ink",
  className = "",
  alt = "Cylent Solutions",
  priority = false,
  fit = "height",
}: LogoProps) {
  return (
    <Image
      src={VARIANTS[variant]}
      alt={alt}
      width={244}
      height={90}
      priority={priority}
      className={`${fit === "width" ? "h-auto w-full" : "w-auto"} ${className}`}
    />
  );
}
