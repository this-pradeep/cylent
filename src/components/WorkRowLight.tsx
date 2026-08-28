"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { Discipline } from "@/lib/site/projects";

/**
 * The light behind one project.
 *
 * Vivid, few, large, never still — the idiom Chapter 3 and Chapter 8 already use, and the
 * one every muted wash before this failed. About says it outright: muted shades were "too
 * weak to be a colour, too flat to be glass."
 *
 * ## One project, one colour
 *
 * A row carries a single hue. Two colours crossing inside one row is Chapter 3's move, and
 * it earns it because three fields combining *is* that section's argument. Depth here comes
 * from two treatments of the same hue.
 *
 * ## Why the colours run in this order
 *
 * The page opens on the discipline's own colour from Chapter 3 — Websites blue, Videos red,
 * Designs green — and walks the wheel from there: the prism spent structurally, one colour
 * entering at the top and separating as you travel down.
 *
 * ## Why each discipline's light is made of a different thing
 *
 * Not a different silhouette, and not an abstract metaphor either. The light on each route
 * is made of the artefact that discipline actually works in, drawn in its own colour:
 *
 * - **Web** — a **layout grid**. Columns and gutters, the thing a responsive site is built
 *   on before anything is designed into it, and the thing `brand-guidelines.md` names for
 *   web outright. It reflows as you scroll: the columns widen and narrow the way a grid does
 *   at a breakpoint.
 * - **Video** — a **roll of film**, laid across the section edge to edge and running as the
 *   row is scrolled, the way stock passes a gate. Perforations along both edges, and real
 *   frame cells between them: it is the frames going by that make it read as film rather
 *   than as a striped band, because a frame is the unit film is counted in. There was a
 *   spool drawn beside it for a while and it is gone — a circle is the *icon* of film,
 *   whereas the roll is the film, and the icon was competing with the thing it stood for.
 * - **Design** — a **vector path**. A Bézier curve with its anchor points, control handles
 *   and tangents, flexing as the row is scrolled. It is the thing a graphic designer
 *   actually has under the cursor all day, and unlike the two attempts before it — a
 *   halftone screen, then press registration marks — it is graphic design rather than print
 *   *production*. It is also the only one of the three made of line rather than fill, which
 *   is why it can cross running text without touching legibility: a hairline is not a
 *   texture.
 */

/** The wheel, in spectral order, holding Chapter 3's three discipline primaries. */
const SPECTRUM = [
  "255, 78, 122", // red — Videos
  "232, 71, 155", // magenta
  "104, 83, 212", // violet
  "76, 111, 255", // blue — Websites
  "31, 191, 212", // cyan
  "31, 217, 160", // green — Designs
  "242, 160, 60", // gold
] as const;

const START: Record<Discipline, number> = { video: 0, web: 3, graphics: 5 };

/** The hue a project takes: its discipline's colour, then onward round the wheel. */
export function fieldColour(discipline: Discipline, index: number): string {
  return SPECTRUM[(START[discipline] + index) % SPECTRUM.length];
}

/** Chapter 3's stop table, for the soft body every route keeps underneath its material. */
const STOPS: readonly { at: number; alpha: number }[] = [
  { at: 0, alpha: 0.62 },
  { at: 26, alpha: 0.4 },
  { at: 52, alpha: 0.18 },
  { at: 74, alpha: 0.05 },
  { at: 100, alpha: 0 },
];

function bloom(rgb: string, extent: string, scale: number): string {
  const stops = STOPS.map(({ at, alpha }) => `rgba(${rgb}, ${(alpha * scale).toFixed(3)}) ${at}%`);
  return `radial-gradient(ellipse ${extent} at 50% 50%, ${stops.join(", ")})`;
}

/**
 * The mask every patterned material wears.
 *
 * Two jobs. Without it a repeating pattern stops dead at the element's edge, and a straight
 * edge in a field of light reads as a mistake. And it is weighted toward the side the
 * artefact bleeds from rather than centred, because centred it sat at full density straight
 * through the body copy — a halftone screen behind running text is not atmosphere, it is a
 * legibility problem. The pattern belongs to the work; the reading gets clean ground.
 */
function soften(mirror: boolean): string {
  return (
    `radial-gradient(ellipse 58% 74% at ${mirror ? 68 : 32}% 50%,` +
    " #000 0%, rgba(0,0,0,0.58) 38%, transparent 80%)"
  );
}

type Layer = {
  style: React.CSSProperties;
  /** The shared falloff, weighted toward the side the artefact bleeds from. */
  soften?: boolean;
  /** A mask of the layer's own, for anything that does not live on the bleed side. */
  mask?: string;
  node?: React.ReactNode;
};

/**
 * Mirroring is done in the geometry, never with a transform.
 *
 * Two reasons, both of which cost a rewrite to learn. GSAP owns `transform` on these
 * elements, so an inline `scaleX(-1)` is discarded the first time a tween writes one. And
 * putting the flip on a wrapper is worse: `transform` creates a stacking context, a stacking
 * context isolates blending, and `mix-blend-multiply` inside one has nothing left to
 * multiply against — the same trap About and Future both carry warnings about.
 */
function layersFor(discipline: Discipline, rgb: string, mirror: boolean): [Layer, Layer] {
  /** Horizontal anchor, flipped. */
  const anchor = (value: string) => (mirror ? { right: value } : { left: value });

  if (discipline === "web") {
    return [
      // The layout grid: 76px columns with 24px gutters, plus a heavier rule every fourth
      // column the way a working grid marks its major divisions.
      {
        style: {
          ...anchor("-14%"),
          top: "-24%",
          width: "112%",
          height: "150%",
          backgroundImage:
            `repeating-linear-gradient(90deg, rgba(${rgb}, 0.3) 0 76px, transparent 76px 100px),` +
            ` repeating-linear-gradient(90deg, rgba(${rgb}, 0.34) 0 2px, transparent 2px 400px)`,
        },
        soften: true,
      },
      {
        style: {
          ...anchor("-8%"),
          top: "-18%",
          width: "84%",
          height: "136%",
          backgroundImage: bloom(rgb, "46% 78%", 0.72),
        },
      },
    ];
  }

  if (discipline === "video") {
    // Perforations along both edges of the stock.
    const perforation =
      `repeating-linear-gradient(90deg, transparent 0 15px, rgba(${rgb}, 0.6) 15px 36px,` +
      ` transparent 36px 54px)`;
    // One frame: its leading division, then the cell itself. Tiled at the frame's own width,
    // so the pattern's repeat and the thing it depicts are the same length — which is what
    // lets it travel without the cells appearing to stretch.
    const frame =
      `linear-gradient(90deg, rgba(${rgb}, 0.5) 0 2px, rgba(${rgb}, 0.13) 2px 100%)`;

    return [
      {
        // Edge to edge. No horizontal anchor and no falloff at the sides: the film is meant
        // to run off both ends of the section, and a strip that fades before the margin
        // reads as a decoration of film rather than as a length of it.
        style: {
          left: 0,
          right: 0,
          top: "24%",
          height: "52%",
          backgroundImage: `${perforation}, ${perforation}, ${frame}`,
          backgroundRepeat: "repeat-x, repeat-x, repeat-x",
          backgroundSize: "54px 16px, 54px 16px, 232px 60%",
          backgroundPosition: "0 0, 0 100%, 0 50%",
        },
      },
      {
        style: {
          ...anchor("-16%"),
          top: "2%",
          width: "138%",
          height: "82%",
          backgroundImage: bloom(rgb, "70% 26%", 0.82),
        },
      },
    ];
  }

  return [
    {
      style: {
        ...anchor("-20%"),
        top: "-14%",
        width: "112%",
        height: "132%",
        backgroundImage: bloom(rgb, "52% 74%", 1),
      },
    },
    {
      // Line work, not fill. Drawn rather than tiled, so there is nothing dense anywhere for
      // type to sit on.
      style: { ...anchor("-8%"), top: "-6%", width: "96%", height: "116%" },
      node: <VectorPath rgb={rgb} mirror={mirror} />,
    },
  ];
}

/**
 * The path's four control points, which are what the flex moves.
 *
 * The viewBox below is 240 × 92 — deliberately close to the row's own proportion. An SVG
 * whose viewBox is a different shape from its box either distorts under
 * `preserveAspectRatio="none"` (circles stop being circles) or, under `slice`, scales to
 * cover and crops: a 1.5:1 viewBox in a 2.6:1 box magnified everything elevenfold and left
 * one giant anchor square on screen with the curve outside the frame.
 */
const HANDLES = { c1y: 14, c2y: 80, c3y: 6, c4y: 74 };

function pathFor(h: typeof HANDLES): string {
  return `M10,68 C50,${h.c1y} 84,${h.c2y} 120,40 C156,${h.c3y} 196,${h.c4y} 232,28`;
}

/**
 * A Bézier with its scaffolding shown: anchors as squares, control points as circles, the
 * tangents between them as hairlines. Exactly what the pen tool draws while a curve is being
 * edited, which is the point — this is the discipline mid-thought rather than its output.
 */
function VectorPath({ rgb, mirror }: { rgb: string; mirror: boolean }) {
  const stroke = `rgba(${rgb}, 0.62)`;
  const faint = `rgba(${rgb}, 0.34)`;

  return (
    <svg
      viewBox="0 0 240 92"
      aria-hidden="true"
      className="h-full w-full"
    >
      {/* Mirrored on the SVG's own coordinate system rather than with a CSS transform: a
          transform on the element would create a stacking context and isolate the blend. */}
      <g transform={mirror ? "translate(240,0) scale(-1,1)" : undefined}>
        {/* Tangents first, so the curve sits over them. */}
        <g stroke={faint} strokeWidth={1} vectorEffect="non-scaling-stroke">
          <line data-handle-line="1" x1="10" y1="68" x2="50" y2={HANDLES.c1y} />
          <line data-handle-line="2" x1="120" y1="40" x2="84" y2={HANDLES.c2y} />
          <line data-handle-line="3" x1="120" y1="40" x2="156" y2={HANDLES.c3y} />
          <line data-handle-line="4" x1="232" y1="28" x2="196" y2={HANDLES.c4y} />
        </g>

        <path
          data-curve
          d={pathFor(HANDLES)}
          fill="none"
          stroke={stroke}
          strokeWidth={1.6}
          vectorEffect="non-scaling-stroke"
        />

        {/* Anchors are square and filled; control points are round and hollow. That is the
            convention every vector tool uses, and reversing it would read as a drawing of a
            pen tool rather than as one. */}
        <g fill={stroke}>
          <rect x="8.9" y="66.9" width="2.2" height="2.2" />
          <rect x="118.9" y="38.9" width="2.2" height="2.2" />
          <rect x="230.9" y="26.9" width="2.2" height="2.2" />
        </g>
        <g fill="none" stroke={stroke} strokeWidth={1.2} vectorEffect="non-scaling-stroke">
          <circle data-handle-dot="1" cx="50" cy={HANDLES.c1y} r="1.5" />
          <circle data-handle-dot="2" cx="84" cy={HANDLES.c2y} r="1.5" />
          <circle data-handle-dot="3" cx="156" cy={HANDLES.c3y} r="1.5" />
          <circle data-handle-dot="4" cx="196" cy={HANDLES.c4y} r="1.5" />
        </g>
      </g>
    </svg>
  );
}

export function WorkRowLight({
  discipline,
  index,
  bleedLeft,
}: {
  discipline: Discipline;
  /** Position of the project within its discipline, which is what picks the hue. */
  index: number;
  bleedLeft: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const parts = Array.from(root.querySelectorAll<HTMLElement>("[data-field]"));
    if (parts.length !== 2) return;

    const direction = bleedLeft ? 1 : -1;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(parts, { opacity: 1 });
      return;
    }
    gsap.set(parts, { opacity: 0 });

    // Declared through the config rather than by importing ScrollTrigger: the plugin is
    // registered once in LenisProvider, and naming it here pulls a second copy into the
    // page chunk.
    const travel = gsap.timeline({
      scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: 1.1 },
    });
    const drift = gsap.timeline({ repeat: -1, yoyo: true, paused: true });

    if (discipline === "web") {
      // The grid reflows. Widening the column interval is what a breakpoint does, and it is
      // the one motion a layout grid has of its own — so the structure resizes rather than
      // slides. `backgroundSize` rather than a transform: scaling the element would carry
      // its soft mask along and nothing would appear to change.
      travel.fromTo(
        parts[0],
        { backgroundSize: "88px 100%, 340px 100%" },
        { backgroundSize: "116px 100%, 460px 100%", ease: "none" },
        0,
      );
      travel.fromTo(parts[1], { yPercent: -8 }, { yPercent: 8, ease: "none" }, 0);
      drift
        .to(parts[0], { backgroundPosition: `${24 * direction}px 0`, duration: 15, ease: "sine.inOut" }, 0)
        .to(parts[1], { xPercent: 5 * direction, duration: 11, ease: "sine.inOut" }, 0);
    } else if (discipline === "video") {
      // The film runs. Both perforation rows and the frames travel on one tween, so it reads
      // as a single length of stock going past rather than three patterns sliding at once —
      // and further than the page moves, because film through a projector is never keeping
      // pace with anything.
      const at = (x: number) => `${x}px 0, ${x}px 100%, ${x}px 50%`;
      travel.fromTo(
        parts[0],
        { backgroundPosition: at(-696 * direction) },
        { backgroundPosition: at(696 * direction), ease: "none" },
        0,
      );
      travel.fromTo(parts[1], { xPercent: -10 * direction }, { xPercent: 10 * direction, ease: "none" }, 0);
      drift
        // A whole number of frames, so the creep never leaves a cell part-way past.
        .to(parts[0], { backgroundPosition: at(232 * direction), duration: 9, ease: "none" }, 0)
        .to(parts[1], { yPercent: 5, duration: 12, ease: "sine.inOut" }, 0);
    } else {
      // The curve flexes. GSAP has no path morph outside its premium plugin, so the control
      // points are tweened as plain numbers and the geometry is rewritten from them each
      // frame — the handles, their tangents and the path all read from one source, which is
      // the only way they stay attached to each other.
      const svg = root.querySelector("svg");
      const curve = svg?.querySelector<SVGPathElement>("[data-curve]");
      if (svg && curve) {
        const state = { ...HANDLES };
        const dots = [1, 2, 3, 4].map((n) => svg.querySelector<SVGCircleElement>(`[data-handle-dot="${n}"]`));
        const lines = [1, 2, 3, 4].map((n) => svg.querySelector<SVGLineElement>(`[data-handle-line="${n}"]`));
        const redraw = () => {
          curve.setAttribute("d", pathFor(state));
          const ys = [state.c1y, state.c2y, state.c3y, state.c4y];
          dots.forEach((dot, i) => dot?.setAttribute("cy", String(ys[i])));
          lines.forEach((line, i) => line?.setAttribute("y2", String(ys[i])));
        };

        travel.fromTo(
          state,
          { c1y: 4, c4y: 86 },
          { c1y: 30, c4y: 56, ease: "none", onUpdate: redraw },
          0,
        );
        drift
          .to(state, { c2y: 62, duration: 17, ease: "sine.inOut", onUpdate: redraw }, 0)
          .to(state, { c3y: 24, duration: 11, ease: "sine.inOut", onUpdate: redraw }, 0);
      }
      travel.fromTo(parts[0], { yPercent: -7, scale: 0.96 }, { yPercent: 7, scale: 1.04, ease: "none" }, 0);
      drift.to(parts[0], { xPercent: 4 * direction, duration: 15, ease: "sine.inOut" }, 0);
    }

    // Separate from the scrub so it finishes early and stays finished; folded in, the light
    // would fade back out as the row left, which reads as a bug rather than a departure.
    const bloomIn = gsap.timeline({
      scrollTrigger: { trigger: root, start: "top 88%", toggleActions: "play none none reverse" },
    });
    bloomIn.to(parts, { opacity: 1, duration: 1.5, ease: "power2.out", stagger: 0.2 }, 0);

    // Paused off screen. A blended layer repainting every frame re-composites every frame.
    const watcher = new IntersectionObserver(
      ([record]) => (record.isIntersecting ? drift.play() : drift.pause()),
      { threshold: 0 },
    );
    watcher.observe(root);

    return () => {
      watcher.disconnect();
      drift.kill();
      bloomIn.scrollTrigger?.kill();
      travel.scrollTrigger?.kill();
    };
  }, [bleedLeft, discipline, index]);

  const rgb = fieldColour(discipline, index);
  const layers = layersFor(discipline, rgb, !bleedLeft);

  return (
    // No z-index: an explicit one would form a second stacking context and isolate the
    // blend. Paint order comes from the row's content carrying `relative`.
    <div ref={rootRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {layers.map((layer, i) => (
        <span
          key={i}
          data-field
          className="absolute block mix-blend-multiply will-change-transform"
          style={{
            ...layer.style,
            ...(layer.mask
              ? { maskImage: layer.mask, WebkitMaskImage: layer.mask }
              : layer.soften
                ? { maskImage: soften(!bleedLeft), WebkitMaskImage: soften(!bleedLeft) }
                : null),
          }}
        >
          {layer.node}
        </span>
      ))}
    </div>
  );
}
