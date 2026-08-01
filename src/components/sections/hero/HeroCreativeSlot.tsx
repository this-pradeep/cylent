/**
 * The hero's creative slot.
 *
 * Position, size and crop are supplied by Hero via `className` — anything mounted
 * here fills the box it is given and must not position itself. See
 * docs/superpowers/specs/2026-08-01-hero-composition-design.md §5 for the full
 * contract a creative has to satisfy (fallback, RAF suspension, disposal, DPR cap,
 * reduced-motion behaviour).
 *
 * The slot is deliberately empty. Both previous WebGL objects were removed from the
 * hero and the replacement has not been built yet, so the upper portion of the hero
 * is blank until it lands. The wrapper still participates in the entrance timeline,
 * so dropping a creative in requires no change to Hero's motion code.
 */

export type HeroCreativeProps = {
  /** 0 = Websites, 1 = Videos, 2 = Brands — the same state that drives the pill. */
  index: number;
  /** Supplied by Hero. The creative must not set its own position or size. */
  className?: string;
};

export function HeroCreativeSlot({ className }: HeroCreativeProps) {
  return (
    <div
      data-hero-creative
      aria-hidden="true"
      className={`pointer-events-none absolute ${className ?? ""}`}
    />
  );
}
