"use client";

import { useEffect, useRef } from "react";
import { liftStrength, liftTransform, stepToward } from "@/lib/motion/cursor-lift";

type SectionEyebrowProps = {
  /** The section's number, shown at full ink. */
  index: string;
  /** What the section is called, shown muted beside it. */
  label: string;
  /** Extra classes for the wrapper — spacing belongs to the caller, not here. */
  className?: string;
};

const SEPARATOR = " — ";

/**
 * The section label, shared by About and by every Work chapter. The two had drifted into
 * near-identical copies with different rules under them; this is the single one.
 *
 * Letters rise and lean as the pointer passes and settle behind it. The page already runs a
 * liquid cursor, so the label is something the cursor can touch rather than something it
 * passes over.
 *
 * Resting state carries the whole meaning. There is no pointer on a phone and none under
 * reduced motion, and in both cases the label simply sits there fully legible — the effect
 * is a reward for having a cursor, never a requirement for reading it.
 */
export function SectionEyebrow({ index, label, className }: SectionEyebrowProps) {
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Coarse pointers get the resting state. A pointermove that only fires on tap would
    // flick the letters once and leave them.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const letters = Array.from(root.querySelectorAll<HTMLElement>("[data-eyebrow-letter]"));
    if (letters.length === 0) return;

    // Measured once rather than per event. Reading a rect per letter per pointermove forces
    // a layout on every frame, which is how a cheap effect becomes an expensive one.
    const centres = new Float64Array(letters.length);
    const current = new Float64Array(letters.length);

    const measure = () => {
      letters.forEach((letter, i) => {
        const box = letter.getBoundingClientRect();
        // Horizontal only: a letter's centre survives vertical scrolling, so this needs to
        // outlast nothing but a resize and the webfont landing.
        centres[i] = box.left + box.width / 2;
      });
    };

    let pointerX: number | null = null;
    let frame = 0;
    let running = false;

    const render = () => {
      let moving = false;

      letters.forEach((letter, i) => {
        const delta = pointerX === null ? Infinity : centres[i] - pointerX;
        const target = pointerX === null ? 0 : liftStrength(delta);

        current[i] = stepToward(current[i], target);
        if (Math.abs(target - current[i]) > 0.002) moving = true;

        const { y, rotate } = liftTransform(current[i], Math.sign(delta));
        letter.style.transform = `translateY(${y.toFixed(2)}px) rotate(${rotate.toFixed(2)}deg)`;
        letter.style.color = current[i] > 0.04 ? `rgba(104, 83, 212, ${Math.min(1, current[i] * 1.6)})` : "";
      });

      // The loop stops once every letter is back at rest, so an untouched label costs
      // nothing at all.
      if (pointerX === null && !moving) {
        running = false;
        return;
      }
      frame = requestAnimationFrame(render);
    };

    const start = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(render);
    };

    const onMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      start();
    };
    const onLeave = () => {
      pointerX = null;
      start();
    };

    // The label itself is a 13px strip. The section it heads is the honest hit area.
    const surface = root.closest("[data-eyebrow-surface]") ?? root;

    measure();
    void document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    surface.addEventListener("pointermove", onMove as EventListener);
    surface.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      surface.removeEventListener("pointermove", onMove as EventListener);
      surface.removeEventListener("pointerleave", onLeave);
      letters.forEach((letter) => {
        letter.style.transform = "";
        letter.style.color = "";
      });
    };
  }, [index, label]);

  const characters = `${index}${SEPARATOR}${label}`.split("");

  return (
    <span
      ref={rootRef}
      className={`flex font-mono text-[0.8125rem] font-medium uppercase tracking-[0.16em] text-ink-muted ${className ?? ""}`}
    >
      {/* Announced once, as a phrase. A row of individually transformed letters is not
          reliably read as one label. */}
      <span className="sr-only">{`${index}${SEPARATOR}${label}`}</span>

      <span aria-hidden="true" className="flex">
        {characters.map((character, position) => (
          <span
            key={`${character}-${position}`}
            data-eyebrow-letter
            className={`inline-block whitespace-pre will-change-transform ${
              position < index.length ? "tabular-nums text-ink" : ""
            }`}
          >
            {character}
          </span>
        ))}
      </span>
    </span>
  );
}
