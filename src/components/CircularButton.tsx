"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Arrow } from "@/components/icons/Arrow";
import { useMagneticHover } from "@/lib/motion/useMagneticHover";
import { ringCircumference, ringLabel, ringPath } from "@/lib/motion/spin-ring";

type CircularButtonProps = {
  /** Set around the ring. Also the accessible name unless `ariaLabel` overrides it. */
  label: string;
  /**
   * Accessible name, for when the ring carries something that is not a sentence — a bare
   * domain reads fine spinning round a circle and badly as a link name.
   */
  ariaLabel?: string;
  href: string;
  /** Opens in a new tab, with the rel a new tab requires. */
  external?: boolean;
  /** Outer diameter in px. */
  size?: number;
  /** How many times the label repeats around the ring. */
  repeats?: number;
  className?: string;
};


/**
 * Circular link with the label set around a spinning ring and an arrow in the core.
 *
 * Three animations coexist here, deliberately on three different elements so they never
 * contend for the same property: `useMagneticHover` writes `transform` on the anchor,
 * the ring's rotation is a CSS animation on a child, and the arrow hand-off is a CSS
 * transition on a grandchild. Do not add a transform transition to the anchor — it would
 * smooth every frame the magnetic tween writes and the pull would feel like it is dragging.
 */
export function CircularButton({
  label,
  ariaLabel,
  href,
  external = false,
  size = 152,
  repeats = 2,
  className = "",
}: CircularButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useMagneticHover(ref, reducedMotion);

  // useId can contain characters that are awkward in a fragment identifier.
  const rawId = useId();
  const pathId = `ring-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const center = size / 2;
  const radius = center * 0.75;

  return (
    <a
      ref={ref}
      href={href}
      aria-label={ariaLabel ?? label}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={`cbtn relative grid shrink-0 place-items-center rounded-full bg-ink ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        className="ring-spin absolute inset-0 h-full w-full"
      >
        <defs>
          <path id={pathId} d={ringPath(radius, center)} fill="none" />
        </defs>
        <text className="fill-surface font-mono text-[10.5px] uppercase tracking-[0.02em]">
          <textPath
            href={`#${pathId}`}
            startOffset="0"
            textLength={ringCircumference(radius)}
            lengthAdjust="spacing"
          >
            {ringLabel(label, repeats)}
          </textPath>
        </text>
      </svg>

      <span
        className="cbtn-core relative grid place-items-center overflow-hidden rounded-full bg-surface text-ink"
        style={{ width: size * 0.42, height: size * 0.42 }}
      >
        <Arrow className="cbtn-arrow cbtn-arrow-one h-5 w-5" />
        <Arrow className="cbtn-arrow cbtn-arrow-two absolute h-5 w-5" />
      </span>
    </a>
  );
}
