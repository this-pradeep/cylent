"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "@/components/icons/Arrow";
import { useMagneticHover } from "@/lib/motion/useMagneticHover";

type ActionLinkProps = {
  label: string;
  href: string;
  className?: string;
};

/**
 * The inline sibling of the footer's circular button: same ink fill, same magnetic pull,
 * same arrow hand-off — sized to sit at the end of a chapter rather than to anchor a page.
 *
 * It carries the `cbtn` class deliberately. The hand-off is already described in
 * globals.css against `.cbtn:hover .cbtn-arrow-*`, and a second copy of that rule under a
 * different name is how two controls start drifting apart.
 *
 * Ink, never the accent. design-principles.md keeps every button ink precisely so the
 * accent never has to carry a large fill; the accent appears here as the hairline that
 * draws beneath on hover, which is a use the same document sanctions.
 */
export function ActionLink({ label, href, className = "" }: ActionLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useMagneticHover(ref, reducedMotion);

  return (
    <Link
      ref={ref}
      href={href}
      className={`cbtn group relative inline-flex items-center gap-3.5 rounded-full bg-ink py-3.5 pl-6 pr-5 text-surface outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${className}`}
    >
      <span className="font-mono text-[0.6875rem] uppercase tracking-[0.18em]">{label}</span>

      <span className="relative grid h-4 w-4 place-items-center overflow-hidden">
        <Arrow className="cbtn-arrow cbtn-arrow-one h-4 w-4" />
        <Arrow className="cbtn-arrow cbtn-arrow-two absolute h-4 w-4" />
      </span>

      {/* The accent, as a rule rather than a fill. Sits outside the pill so the ink stays
          uninterrupted and the colour reads as an underline being drawn. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-6 -bottom-2 h-px origin-left scale-x-0 bg-[image:var(--gradient-accent)] transition-transform duration-[0.55s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 motion-reduce:transition-none"
      />
    </Link>
  );
}
