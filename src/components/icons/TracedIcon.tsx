import type { CSSProperties } from "react";

/**
 * Icons that redraw themselves.
 *
 * Every glyph ships twice inside one SVG: a resting copy in muted ink, and a copy on top
 * whose strokes are hidden by a full dash offset. On hover or focus the second copy runs its
 * offset to zero, stroke by stroke, so the icon draws itself in the active colour.
 *
 * That is not a new idea on this page — it is the footer's existing one at icon scale. The
 * index rows resolve a dotted leader into a solid rule; the loader reveals its progress bar
 * with a clip rather than a scale. A line completing itself is the motion language here, and
 * these icons speak it rather than importing a second one. motion-system.md, Principle 3.
 *
 * No library. The whole mechanism is two SVG attributes and one transition.
 */

/** A stroked contour, or a solid dot — the two things these five marks are made of. */
type Stroke = { d: string } | { dot: [cx: number, cy: number] };

/**
 * Drawn in the order they are listed: outer contour first, then what sits inside it, which
 * is the order a hand would draw them and the order the stagger follows.
 *
 * These are the real marks, not suggestions of them — a brand glyph a visitor half-recognises
 * is worse than no glyph at all. Each is the standard 24-box line rendering of the mark, at
 * the 1.5 stroke and round caps the rest of the site's icons already use.
 */
const GLYPHS = {
  mail: [
    { d: "M5.5 5.5h13a2.5 2.5 0 0 1 2.5 2.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16V8a2.5 2.5 0 0 1 2.5-2.5z" },
    { d: "M4 7.5l8 5.5 8-5.5" },
  ],
  /** The balloon with its tail at the foot, and the handset inside it. */
  whatsapp: [
    { d: "M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" },
    { d: "M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" },
  ],
  /** Rounded frame, lens, and the flash dot in the top right corner. */
  instagram: [
    { d: "M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" },
    { d: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" },
    { dot: [16.5, 7.5] },
  ],
  /** Frame, then the i and the n that spell the mark. */
  linkedin: [
    { d: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z" },
    { d: "M8 11v5" },
    { dot: [8, 8] },
    { d: "M12 16v-5" },
    { d: "M16 16v-3a2 2 0 1 0-4 0" },
  ],
  /** The ball, then its three seams — the one mark here whose drawing order is the mark. */
  dribbble: [
    { d: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" },
    { d: "M9 3.6c5 6 7 10.5 7.5 16.2" },
    { d: "M6.4 19c3.5-3.5 6-6.5 14.5-6.4" },
    { d: "M3.1 10.75c5 0 9.81-.38 15.31-5" },
  ],
} satisfies Record<string, Stroke[]>;

export type GlyphName = keyof typeof GLYPHS;

/**
 * `pathLength="1"` is what lets one dash rule fit every contour. The browser scales the dash
 * pattern to the declared length, so the dribbble ball and the five-pixel stem of an "i" both
 * run 1 → 0 across the same duration. Without it each stroke would finish at a different
 * moment according to its own geometry, and the stagger would read as an accident.
 */
function draw(stroke: Stroke, index: number, tracing: boolean, paint?: string) {
  // Drives the stagger. One custom property beats five hand-written delay classes.
  const style = { "--ico-i": index } as CSSProperties;

  if ("dot" in stroke) {
    const [cx, cy] = stroke.dot;
    return (
      <circle
        key={`${cx}-${cy}`}
        cx={cx}
        cy={cy}
        r={0.6}
        fill={tracing ? (paint ?? "currentColor") : "currentColor"}
        stroke="none"
        // A dot has no length to draw, so it arrives by scale instead — on its own beat of
        // the same stagger, so it still lands in sequence with the strokes around it.
        className={tracing ? "ico-dot" : undefined}
        style={tracing ? style : undefined}
      />
    );
  }

  return (
    <path
      key={stroke.d}
      d={stroke.d}
      pathLength={tracing ? 1 : undefined}
      style={tracing ? style : undefined}
    />
  );
}

type TracedIconProps = {
  name: GlyphName;
  /** Size and resting colour. */
  className?: string;
  /** Colour of the copy that draws itself in. */
  traceClassName?: string;
  /**
   * A paint server for the traced copy — `url(#ico-ramp)` draws it in the site's accent
   * ramp. Left unset it inherits `currentColor` from `traceClassName`, which is what the
   * ink-filled channel buttons need: the ramp's stops are darkened for light grounds and
   * would vanish against ink.
   */
  tracePaint?: string;
};

export function TracedIcon({
  name,
  className = "",
  traceClassName = "",
  tracePaint,
}: TracedIconProps) {
  const strokes: Stroke[] = GLYPHS[name];

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <g>{strokes.map((stroke, index) => draw(stroke, index, false))}</g>
      {/* `currentColor` resolves against each element's own computed colour, so this group
          carrying its own text colour is all it takes to draw in a second one. */}
      {/* A shade heavier than the resting line. Hovering should make a mark more present,
          not less, and the ramp needs a little more body than 1.5 to read as a ramp. */}
      <g
        className={`ico-trace ${traceClassName}`}
        stroke={tracePaint}
        strokeWidth={1.75}
      >
        {strokes.map((stroke, index) => draw(stroke, index, true, tracePaint))}
      </g>
    </svg>
  );
}

/**
 * The accent ramp as a paint server, so a glyph can be stroked with it.
 *
 * `userSpaceOnUse` rather than the default: with object-bounding-box units every path in a
 * glyph would restart the ramp inside its own box, so the dribbble ball and each of its
 * seams would each run the full spectrum. Pinned to the 24-unit canvas every icon shares,
 * one ramp crosses the whole mark and each stroke shows its own slice of it.
 *
 * The stops are --gradient-accent's, and the 2,4 → 22,20 vector is its 100deg. Rendered once
 * per page; a def is a document-wide resource, not a per-icon one.
 */
export function IconGradientDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" className="absolute">
      <defs>
        <linearGradient
          id="ico-ramp"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="2"
          x2="24"
          y2="22"
        >
          <stop offset="0" stopColor="#ae3f73" />
          <stop offset="0.24" stopColor="#93508a" />
          <stop offset="0.5" stopColor="#665abb" />
          <stop offset="0.74" stopColor="#405dd6" />
          <stop offset="1" stopColor="#29717b" />
        </linearGradient>
      </defs>
    </svg>
  );
}
