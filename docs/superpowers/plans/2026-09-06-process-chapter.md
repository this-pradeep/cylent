# Chapter 7 — The Process Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the process chapter that carries the Confidence beat — four stages as stations on a single accent hairline drawn across the section on scroll — between Work and Future on the homepage.

**Architecture:** A pure timing module states where the drawing front is and when each station lights, derived from one another so they cannot desync. A content module holds the four stages. One client component reads both and drives a single scrubbed GSAP timeline through `gsap.matchMedia`, with the line's extent written from `drawExtent()` in `onUpdate` — the same pattern `About.tsx` uses for its fields.

**Tech Stack:** Next.js App Router, TypeScript strict, Tailwind v4, GSAP + ScrollTrigger (already registered in `LenisProvider`), Vitest.

**Spec:** `docs/superpowers/specs/2026-09-06-process-chapter-design.md`

## Global Constraints

- **No new dependencies.** `CLAUDE.md`: "Do not introduce additional libraries unless absolutely necessary."
- **Never `import { ScrollTrigger }` in a section component.** The plugin is registered once in `LenisProvider`. `Future.tsx:161` records that naming the symbol in a section file pulled a second copy into the page chunk and cost 17kB. Declare triggers through the timeline's `scrollTrigger` config only.
- **Every section branches three ways** via `gsap.matchMedia`: `held` (≥820px, motion allowed), `flowing` (<820px, motion allowed), `still` (`prefers-reduced-motion: reduce`). The `still` branch must leave all four stages fully legible.
- **Clean up.** `mm.revert()` on unmount, and `scrollTrigger?.kill()` for triggers created inside a `matchMedia` branch.
- **Accent usage.** The gradient (`var(--gradient-accent)`) is for hairlines and display type only. Anything small takes the solid `--color-accent` — `globals.css` states the rule and the reason: across a few small elements a ramp reads as an arbitrary colour rather than as a gradient.
- **Breakpoint is 820px**, matching `Work.tsx`, so the two neighbouring sections change layout together.
- **Path alias:** `@/*` → `./src/*`, configured in both `tsconfig.json` and `vitest.config.ts`.
- **Copy is the studio's.** Stage names are settled (Discover, Design, Build, Deliver). The heading, subhead and four supporting lines ship as a proposal and must be flagged in-file the way `projects.ts` flags its placeholder data.

---

### Task 1: Station timing

The section's one load-bearing claim is that each station lights exactly as the drawing front reaches it. That is arithmetic, so it belongs in a pure module and gets tested there — following `chapter-beats.ts`, which does the same for Chapter 6's beats.

**Files:**
- Create: `src/lib/motion/process-stations.ts`
- Test: `tests/lib/process-stations.test.ts`

**Interfaces:**
- Consumes: `clampProgress(value: number): number` from `@/lib/motion/scroll-progress`
- Produces:
  - `DRAW_LEAD: 0.08`, `DRAW_END: 0.82`, `STATION_REVEAL: 0.1`
  - `type StationReveal = { start: number; end: number }`
  - `stationPosition(index: number, count: number): number | null`
  - `drawExtent(progress: number): number`
  - `stationReveal(index: number, count: number): StationReveal | null`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/process-stations.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  DRAW_END,
  DRAW_LEAD,
  STATION_REVEAL,
  drawExtent,
  stationPosition,
  stationReveal,
} from "@/lib/motion/process-stations";

const STAGES = 4;

describe("drawExtent", () => {
  it("holds the line closed until the lead is spent", () => {
    expect(drawExtent(0)).toBe(0);
    expect(drawExtent(DRAW_LEAD)).toBeCloseTo(0, 5);
  });

  it("completes the line with scroll left to rest on it", () => {
    expect(drawExtent(DRAW_END)).toBeCloseTo(1, 5);
    expect(DRAW_END).toBeLessThan(1);
  });

  it("never runs past either end", () => {
    expect(drawExtent(-0.5)).toBe(0);
    expect(drawExtent(1.5)).toBe(1);
  });

  it("draws in one direction only", () => {
    const samples = [0, 0.1, 0.25, 0.4, 0.6, 0.75, 0.9, 1].map(drawExtent);
    expect(samples).toEqual([...samples].sort((a, b) => a - b));
  });
});

describe("stationPosition", () => {
  it("puts the stations at the head of their own columns", () => {
    expect(stationPosition(0, STAGES)).toBeCloseTo(0, 5);
    expect(stationPosition(1, STAGES)).toBeCloseTo(0.25, 5);
    expect(stationPosition(2, STAGES)).toBeCloseTo(0.5, 5);
    expect(stationPosition(3, STAGES)).toBeCloseTo(0.75, 5);
  });

  it("leaves line beyond the last station, so the stroke carries on past it", () => {
    expect(stationPosition(STAGES - 1, STAGES)).toBeLessThan(1);
  });

  it("has no position for a station outside the set", () => {
    expect(stationPosition(STAGES, STAGES)).toBeNull();
    expect(stationPosition(-1, STAGES)).toBeNull();
    expect(stationPosition(0, 0)).toBeNull();
  });
});

describe("stationReveal", () => {
  // The whole design claim, as an assertion: a station lights at the moment the
  // drawing front arrives at it. Not two sequences tuned to look aligned — one
  // derived from the other.
  it("lights each station exactly as the drawing front reaches it", () => {
    for (let index = 0; index < STAGES; index += 1) {
      const { start } = stationReveal(index, STAGES)!;
      expect(drawExtent(start)).toBeCloseTo(stationPosition(index, STAGES)!, 5);
    }
  });

  it("lights the first station as the line starts drawing", () => {
    expect(stationReveal(0, STAGES)!.start).toBeCloseTo(DRAW_LEAD, 5);
  });

  it("reveals in reading order", () => {
    const starts = [0, 1, 2, 3].map((index) => stationReveal(index, STAGES)!.start);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });

  it("gives every station the same time to arrive", () => {
    [0, 1, 2, 3].forEach((index) => {
      const { start, end } = stationReveal(index, STAGES)!;
      expect(end - start).toBeCloseTo(STATION_REVEAL, 5);
    });
  });

  it("finishes the last station before the scroll runs out", () => {
    expect(stationReveal(STAGES - 1, STAGES)!.end).toBeLessThan(1);
  });

  it("has no window for a station outside the set", () => {
    expect(stationReveal(STAGES, STAGES)).toBeNull();
    expect(stationReveal(-1, STAGES)).toBeNull();
    expect(stationReveal(0, 0)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- process-stations`
Expected: FAIL — cannot resolve `@/lib/motion/process-stations`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/motion/process-stations.ts`:

```ts
import { clampProgress } from "@/lib/motion/scroll-progress";

/**
 * Chapter 7 — The Process. One hairline is drawn across the section as it is scrolled, and
 * the four stages are stations on it. This is where the front is and when each station
 * lights.
 *
 * The two are not tuned against each other. A station's reveal begins at the scrub progress
 * where `drawExtent` reaches that station's own position, so "the station lights as the line
 * reaches it" is arithmetic rather than a pair of sequences that happen to agree. Change
 * either constant below and they stay in step.
 *
 * Expressed against the scrub's 0–1 progress, like `chapter-beats.ts`, so the sequencing can
 * be reasoned about without a DOM.
 *
 * Deliberately not `beatWindow` from that module. It divides a scrub into equal consecutive
 * slices for items that have no position of their own; these stations have positions on a
 * line and their timing is derived from those positions. One function cannot mean both
 * things without lying about what its numbers are.
 */

/** The section holds before the stroke starts, so the heading is read first. */
export const DRAW_LEAD = 0.08;

/** The stroke is complete by here, leaving scroll to rest on the finished diagram. */
export const DRAW_END = 0.82;

/** How long one station takes to arrive, as a slice of the scrub. */
export const STATION_REVEAL = 0.1;

export type StationReveal = {
  start: number;
  end: number;
};

/**
 * Where a station sits along the line, 0–1.
 *
 * `index / count`, not `index / (count - 1)`: the stations sit at the head of their own
 * columns rather than being spread to both ends. That is what the desktop grid does — four
 * equal columns, each station at its column's left edge — so the geometry here is the
 * layout's, not an approximation of it. It also leaves a quarter of the stroke running on
 * past the last station, which is the section's closing image: the work goes out and keeps
 * going.
 */
export function stationPosition(index: number, count: number): number | null {
  if (count <= 0 || index < 0 || index > count - 1) return null;
  return index / count;
}

/** How much of the line is drawn at this point in the scrub, 0–1. */
export function drawExtent(progress: number): number {
  return clampProgress((progress - DRAW_LEAD) / (DRAW_END - DRAW_LEAD));
}

/** When a station arrives — starting at the moment the drawing front reaches it. */
export function stationReveal(index: number, count: number): StationReveal | null {
  const position = stationPosition(index, count);
  if (position === null) return null;

  const start = DRAW_LEAD + position * (DRAW_END - DRAW_LEAD);
  return { start, end: start + STATION_REVEAL };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- process-stations`
Expected: PASS, 13 tests.

- [ ] **Step 5: Typecheck and commit**

```bash
npm run typecheck
git add src/lib/motion/process-stations.ts tests/lib/process-stations.test.ts
git commit -m "feat: the line knows where its stations are"
```

---

### Task 2: The four stages

**Files:**
- Create: `src/lib/site/process.ts`
- Test: `tests/lib/process.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type ProcessStage = { number: string; name: string; line: string }`
  - `PROCESS_STAGES: readonly ProcessStage[]` — four entries
  - `PROCESS_EYEBROW: string`, `PROCESS_HEADING: string`, `PROCESS_SUBHEAD: string`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/process.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  PROCESS_EYEBROW,
  PROCESS_HEADING,
  PROCESS_STAGES,
  PROCESS_SUBHEAD,
} from "@/lib/site/process";

describe("PROCESS_STAGES", () => {
  it("runs the four stages the story document names", () => {
    expect(PROCESS_STAGES.map((stage) => stage.name)).toEqual([
      "Discover",
      "Design",
      "Build",
      "Deliver",
    ]);
  });

  it("numbers them in order, zero-padded, so the column reads as a set", () => {
    expect(PROCESS_STAGES.map((stage) => stage.number)).toEqual(["01", "02", "03", "04"]);
  });

  // The copy is the studio's to replace. This is what stops a replacement leaving a
  // station rendering as an empty column.
  it("gives every stage something to say", () => {
    PROCESS_STAGES.forEach((stage) => {
      expect(stage.name.trim()).not.toBe("");
      expect(stage.line.trim()).not.toBe("");
    });
  });

  it("heads the section", () => {
    expect(PROCESS_EYEBROW.trim()).not.toBe("");
    expect(PROCESS_HEADING.trim()).not.toBe("");
    expect(PROCESS_SUBHEAD.trim()).not.toBe("");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- tests/lib/process.test.ts`
Expected: FAIL — cannot resolve `@/lib/site/process`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/site/process.ts`:

```ts
/**
 * Chapter 7 — The Process.
 *
 * `website-story.md` flagged the Confidence beat — "they know how to execute" — as
 * unclaimed once Chapters 5 and 7 were cut. This is the content that claims it back.
 *
 * The stages are the four in `docs/ux_architecture.md` (ACT 07), moved off the engineering
 * register: this studio makes websites, film and identity, so "Engineer" and "Deploy" are
 * Build and Deliver.
 *
 * ⚠ THE WORDS BELOW ARE A PROPOSAL. The four stage names are settled; the heading, the
 * subhead and the four supporting lines are marketing copy and belong to the studio. They
 * are written here so the section is never shipped empty, and nothing in the layout depends
 * on them — every one of these strings can be replaced without touching a component.
 */

export type ProcessStage = {
  /** Shown as a typographic element. The <ol> carries the order; this is composition. */
  number: string;
  name: string;
  /** One line. What actually happens here — never a claim about how well it happens. */
  line: string;
};

export const PROCESS_EYEBROW = "How we work";

/**
 * Grammatically unlike Chapter 3's payoff on purpose. That one is a third-person claim
 * about the work ("Great work doesn't happen in silos"); this is first-person and about
 * the studio. Two display headings built the same way, two sections apart, read as one
 * sentence said twice.
 */
export const PROCESS_HEADING = "We work the same way every time.";

/** The line that stops the heading reading as rigidity rather than as rigour. */
export const PROCESS_SUBHEAD = "The work changes. The method doesn’t.";

export const PROCESS_STAGES: readonly ProcessStage[] = [
  {
    number: "01",
    name: "Discover",
    line: "We find out what it’s actually for.",
  },
  {
    number: "02",
    name: "Design",
    line: "We argue the idea before anything gets built.",
  },
  {
    number: "03",
    name: "Build",
    line: "We make it — written, shot, or drawn.",
  },
  {
    number: "04",
    name: "Deliver",
    line: "We hand it over working, not almost working.",
  },
];
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- tests/lib/process.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Typecheck and commit**

```bash
npm run typecheck
git add src/lib/site/process.ts tests/lib/process.test.ts
git commit -m "feat: the four stages, and the words that are not ours to keep"
```

---

### Task 3: The section

**Files:**
- Create: `src/components/sections/Process.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `PROCESS_EYEBROW`, `PROCESS_HEADING`, `PROCESS_SUBHEAD`, `PROCESS_STAGES` from `@/lib/site/process`; `drawExtent`, `stationReveal`, `stationPosition` from `@/lib/motion/process-stations`; `SectionEyebrow`, `EYEBROW_LIFT_HEADROOM` from `@/components/SectionEyebrow`.
- Produces: `export function Process(): JSX.Element`

**Layout note.** The connecting line is decorative and sits in its own `aria-hidden` layer, positioned independently of the list. That is what lets the stages stay one plain `<ol>` of four `<li>`s with no `display: contents`, no subgrid and no fixed heights — the semantics and the drawing never have to negotiate. Desktop puts the line above the stations, which hang from it; mobile puts it to their left. One arrangement rotated, so both read as the same object.

- [ ] **Step 1: Write the component**

Create `src/components/sections/Process.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { EYEBROW_LIFT_HEADROOM, SectionEyebrow } from "@/components/SectionEyebrow";
import {
  PROCESS_EYEBROW,
  PROCESS_HEADING,
  PROCESS_STAGES,
  PROCESS_SUBHEAD,
} from "@/lib/site/process";
import { drawExtent, stationPosition, stationReveal } from "@/lib/motion/process-stations";

/**
 * Chapter 7 — The Process.
 *
 * `website-story.md` records that Chapters 5 and 7 both carried the **Confidence** beat and
 * both were cut, leaving the page to move from what we make straight to the ask. This is
 * that beat, claimed back in Chapter 7's slot — after the proof, before the close, which is
 * where it answers the question the work provokes rather than pre-empting it.
 *
 * The section is one hairline drawn across it, with the four stages as stations on the
 * line. A process is a thing with an order, and a line drawn through four points states
 * that order without a word of it being claimed.
 *
 * Deliberately not Chapter 3's language. That section is radial — fields blooming and
 * gathering; this one is linear. Two abstract diagrams on one page have to read as
 * different instruments, and radial-against-linear is the cleanest separation there is.
 * Both draw on `--gradient-accent`, so they still belong to one system.
 *
 * Paper rather than ink. `design-principles.md` Principle 2 asks for contrast and Chapter 6
 * already spends it on three full-bleed ink frames; a fourth dark slab would dilute those
 * rather than add to them, and Chapter 8's beam needs a light ground to fall on. The
 * quieter ground suits the content too — this is the studio talking about itself, and it
 * should be quieter than the work.
 *
 * Held with CSS `sticky`, like every other section here. Nothing on this page pins.
 */

/** Matches Work.tsx, so the two neighbouring sections change layout on the same line. */
const HELD = "(min-width: 820px) and (prefers-reduced-motion: no-preference)";
const FLOWING = "(max-width: 819px) and (prefers-reduced-motion: no-preference)";
const STILL = "(prefers-reduced-motion: reduce)";

export function Process() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const queryAll = <T extends HTMLElement>(selector: string) =>
      Array.from(section.querySelectorAll<T>(selector));

    const rail = section.querySelector<HTMLElement>("[data-process-rail]");
    const spine = section.querySelector<HTMLElement>("[data-process-spine]");
    const stations = queryAll("[data-process-station]");
    const dots = queryAll("[data-process-dot]");
    const intro = queryAll("[data-process-intro]");
    if (!rail || !spine || stations.length === 0) return;

    const mm = gsap.matchMedia();

    mm.add({ held: HELD, flowing: FLOWING, still: STILL }, (context) => {
      const { held, still } = context.conditions as Record<string, boolean>;

      // The stages are content, not decoration. With motion removed the line is simply
      // drawn and all four stations are simply there.
      if (still) {
        gsap.set([rail, spine], { clipPath: "none", opacity: 1 });
        gsap.set([...intro, ...stations], { clipPath: "none", opacity: 1, y: 0 });
        gsap.set(dots, { opacity: 1, scale: 1 });
        return;
      }

      gsap.set(stations, { opacity: 0, y: 18 });
      gsap.set(dots, { opacity: 0, scale: 0.3 });

      // The heading belongs to the arrival, not to the scrub — the section would otherwise
      // sit blank for a full screen before it said anything.
      const arrival = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: section,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      });
      arrival.fromTo(
        intro,
        { clipPath: "inset(0% 0% 100% 0%)", y: 16 },
        { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.8, stagger: 0.1 },
        0,
      );

      // A total duration of 1 maps this timeline straight onto the scrub, so the windows in
      // process-stations.ts are the timeline's own positions with no conversion — the same
      // arrangement Chapter 6 uses for its beats.
      const draw = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: held ? "top top" : "top 74%",
          end: held ? "bottom bottom" : "bottom 70%",
          scrub: 0.9,
          invalidateOnRefresh: true,
          // Written from `drawExtent` rather than tweened, so that function stays the only
          // description of where the front is — the arrangement About.tsx uses for its
          // fields. A station's own window is derived from the same number, which is what
          // makes "the station lights as the line reaches it" true by construction rather
          // than by tuning.
          onUpdate: (self) => {
            const hidden = (1 - drawExtent(self.progress)) * 100;
            // The gradient must not move while the line grows. `scaleX` would squeeze the
            // whole five-stop ramp into whatever is drawn so far and light every station at
            // a colour it does not keep; clipping holds the ramp still and uncovers it.
            gsap.set(rail, { clipPath: `inset(0% ${hidden}% 0% 0%)` });
            gsap.set(spine, { clipPath: `inset(0% 0% ${hidden}% 0%)` });
          },
        },
      });

      stations.forEach((station, index) => {
        const window = stationReveal(index, stations.length);
        if (!window) return;
        const duration = window.end - window.start;

        draw.fromTo(
          station,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration, ease: "power3.out" },
          window.start,
        );
        const dot = dots[index];
        if (dot) {
          draw.fromTo(
            dot,
            { opacity: 0, scale: 0.3 },
            { opacity: 1, scale: 1, duration, ease: "back.out(2)" },
            window.start,
          );
        }
      });

      return () => {
        arrival.scrollTrigger?.kill();
        draw.scrollTrigger?.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      data-eyebrow-surface
      className="relative bg-paper motion-safe:min-[820px]:h-[170vh]"
    >
      <div className="flex flex-col justify-center gap-[7vh] overflow-hidden px-6 py-[16vh] md:px-[6vw] motion-safe:min-[820px]:sticky motion-safe:min-[820px]:top-0 motion-safe:min-[820px]:h-screen motion-safe:min-[820px]:py-0">
        <div className="flex flex-col gap-5">
          <span data-process-intro className={`block ${EYEBROW_LIFT_HEADROOM}`}>
            <SectionEyebrow label={PROCESS_EYEBROW} />
          </span>

          {/* No accent rule beneath the eyebrow, unlike Chapter 3. The drawn line is this
              section's rule, and a static hairline above one that draws reads as a fault. */}
          <h2
            data-process-intro
            className="m-0 max-w-[16ch] text-[clamp(2rem,5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-ink"
          >
            {PROCESS_HEADING}
          </h2>

          <p
            data-process-intro
            className="m-0 max-w-[40ch] text-[clamp(1rem,2vw,1.25rem)] font-medium leading-[1.4] tracking-[-0.02em] text-ink/70"
          >
            {PROCESS_SUBHEAD}
          </p>
        </div>

        {/* The stations, and the line they sit on. The line is a separate decorative layer
            so the stages can stay one plain <ol> — no display:contents, no subgrid, no
            fixed heights, and nothing about the drawing constrains the markup that carries
            the meaning. */}
        <div className="relative">
          {/* Desktop: the line runs above the stations and they hang from it.
              `inset-x-0` spans the full content width, so the stations' own grid columns
              put each dot exactly where stationPosition() says it is. */}
          <span
            data-process-rail
            aria-hidden="true"
            className="absolute left-0 right-0 top-0 hidden h-px bg-[image:var(--gradient-accent)] min-[820px]:block"
          />

          {/* Mobile: the same line turned vertical, a spine down the left of the column.
              Four stations across a phone would give each about 80px, which is not a
              column — vertical is the honest form at that width. */}
          <span
            data-process-spine
            aria-hidden="true"
            className="absolute bottom-0 left-[3px] top-0 block w-px bg-[image:var(--gradient-accent)] min-[820px]:hidden"
          />

          <ol className="m-0 grid list-none grid-cols-1 gap-y-10 p-0 min-[820px]:grid-cols-4 min-[820px]:gap-y-0 min-[820px]:pt-10">
            {PROCESS_STAGES.map((stage, index) => (
              <li
                key={stage.name}
                className="relative m-0 pl-9 min-[820px]:pl-0 min-[820px]:pr-[3vw]"
              >
                {/* The dot. Solid accent, never the ramp: globals.css sets the rule and
                    gives the reason — across something this small a gradient reads as an
                    arbitrary colour rather than as a gradient.

                    On mobile it sits on its own row's spine. On desktop it sits on the rail
                    above, at the head of its own column — which is exactly the position
                    stationPosition() reports, because both are the same grid. */}
                <span
                  data-process-dot
                  aria-hidden="true"
                  className="absolute left-0 top-[0.45em] block h-[7px] w-[7px] rounded-full bg-accent will-change-transform min-[820px]:-top-[calc(2.5rem+3px)] min-[820px]:left-0"
                />

                <div data-process-station className="flex flex-col gap-2 will-change-transform">
                  <p className="m-0 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ink-muted">
                    {stage.number}
                  </p>
                  <h3 className="m-0 text-[clamp(1.5rem,2.6vw,2.25rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-ink">
                    {stage.name}
                  </h3>
                  <p className="m-0 max-w-[30ch] text-[0.9375rem] leading-[1.55] text-ink/70">
                    {stage.line}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify the unused import is real, not assumed**

`stationPosition` is imported above but only referenced in comments. Remove it from the import statement — `eslint` will fail the build on an unused binding. The import line must read:

```tsx
import { drawExtent, stationReveal } from "@/lib/motion/process-stations";
```

- [ ] **Step 3: Wire it into the page**

Modify `src/app/page.tsx` — replace the whole file:

```tsx
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Work } from "@/components/sections/Work";
import { Process } from "@/components/sections/Process";
import { Future } from "@/components/sections/Future";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <About />
      <Work />
      <Process />
      <Future />
    </main>
  );
}
```

Note this also drops the commented-out `Problem` import, whose component Task 4 deletes.

- [ ] **Step 4: Typecheck, lint and build**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: all three clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/Process.tsx src/app/page.tsx
git commit -m "feat: the method arrives between the proof and the ask"
```

---

### Task 4: Housekeeping

Two items approved alongside the section. Both are about the repo telling the truth about itself.

**Files:**
- Delete: `src/components/sections/Problem.tsx`
- Modify: `CLAUDE.md`
- Modify: `docs/website-story.md`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Confirm nothing imports Problem**

```bash
grep -rn "sections/Problem\|<Problem" src tests
```

Expected: no output. (`page.tsx` lost its commented import in Task 3.)

- [ ] **Step 2: Delete it**

```bash
git rm src/components/sections/Problem.tsx
```

It was commented out of the page and imported by nothing. It is a four-tile card grid, which `CLAUDE.md` forbids in as many words — "repetitive card grids", "remove anything that feels generic" — and Chapter 2's positioning is already carried by the Hero and Chapter 3. Dead code that contradicts the project's own rules is worth removing rather than leaving for someone to revive.

- [ ] **Step 3: Repoint CLAUDE.md**

Replace the opening block of `CLAUDE.md` — everything above the `# Cylent Solutions Website Rules` heading — with:

```markdown
Before making any design or implementation decisions, read:

- docs/brand-guidelines.md
- docs/design-principles.md
- docs/motion-system.md
- docs/website-story.md

These four files are the source of truth. Twenty-six comments across `src/` cite them by
name; if you find yourself contradicting one, you are changing the brand, not the code.

The `docs/` files written in snake_case — `project_brief.md`, `brand_direction.md`,
`design_direction.md`, `ux_architecture.md`, and the rest — are reference, not source of
truth. They describe Cylent as a dark, green-accented software engineering and IT
consulting firm. This site is a light editorial studio for web, video and design, and where
the two disagree the four files above win. Mine that set for ideas; do not build its
identity.

Do not create layouts, animations, or content that conflict with the source of truth.

Always explain your reasoning by referencing these documents.

Do not create a section because most websites have that section.

Every section must justify its existence through the narrative in website-story.md.

Remove anything that feels generic.
```

Leave everything from `# Cylent Solutions Website Rules` onward exactly as it is.

- [ ] **Step 4: Rewrite Chapter 7 in the story document**

In `docs/website-story.md`, replace the Chapter 7 block — from the `## Chapter 7 — Attention To Detail` heading down to (but not including) the `---` that precedes `## Chapter 8 — The Future` — with:

```markdown
## Chapter 7 — The Process

### Objective

Carry the **Confidence** beat: "they know how to execute."

Chapters 5 and 7 both carried it and both were cut, which left the page moving from what we
make straight to the ask. This chapter claims it back. It is not a new idea — it is the
decision the previous note here left open, resolved.

It also answers a claim the page already makes and never supports. Chapter 3 says the work
happens "in the space between ideas and execution." This is what happens in that space.

### Position

After Chapter 6, before Chapter 8. The method answers the question the work provokes rather
than pre-empting it, and it keeps the work as high on the page as it was.

### Structure

Four stages — Discover, Design, Build, Deliver — as stations on a single accent hairline
drawn across the section as it is scrolled. Each station lights as the drawing front reaches
it.

Not four cards. A process is a thing with an order, and a line drawn through four points
states that order without a word of it being claimed. The chapter is linear where Chapter 3
is radial, so the page's two abstract diagrams read as different instruments.

### User Thought

"They know how they work."
```

- [ ] **Step 5: Verify and commit**

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Expected: all clean.

```bash
git add -A
git commit -m "chore: the repo says what is true of itself again"
```

---

### Task 5: Read it

The quality checklist asks for a visual audit, and none of the above proves the section
looks right.

**Files:** none — this task changes nothing unless it finds something.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Read the section at three widths and one setting**

Open `http://localhost:3000` and scroll to the section between the last Work chapter and
the closing statement. Check:

- **Desktop (≥1280px):** the line draws left to right as the section is held; each station's
  dot lights as the front reaches it, not before or after; the four columns do not collide;
  the section holds for its full scroll without the diagram drifting off-screen.
- **Tablet (~900px):** still four columns, still held; the supporting lines have not wrapped
  into towers.
- **Phone (~390px):** the spine runs down the left, dots sit on it beside their own rows,
  nothing overflows horizontally, and the section is not taller than it needs to be.
- **Reduced motion:** with the OS setting on, the line is fully drawn, all four stations are
  present and legible, the section is an ordinary block with no sticky hold, and nothing
  moves.

- [ ] **Step 3: Run the checklist's own test**

`quality_checklist.md`: *remove all animations — does it still work?* The reduced-motion pass
above is that test. If the section only reads once it is animated, the design is wrong and
not the motion.

- [ ] **Step 4: Fix anything found, then commit**

Only if Step 2 or 3 found something:

```bash
git add -A
git commit -m "fix: <what was actually wrong>"
```

---

## Self-Review

**Spec coverage.** Placement (Task 3), paper ground (Task 3), the drawn line and its
clip-path rationale (Tasks 1, 3), no accent rule under the eyebrow (Task 3), desktop and
mobile arrangements (Task 3), station timing derived from the draw (Task 1), reduced motion
(Task 3 `still` branch, Task 5 verification), no `ScrollTrigger` import (Global Constraints,
Task 3), `<ol>` semantics and `aria-hidden` decoration (Task 3), content held apart from
components (Task 2), copy flagged as the studio's (Task 2), `CLAUDE.md` and `Problem.tsx`
(Task 4), Chapter 7 rewritten (Task 4), verification commands (Tasks 3, 4, 5).

**Deviation from the spec, deliberate.** The spec drew names above the line and supporting
text below. The implementation hangs whole stations beneath the line instead. That keeps the
stages as one `<ol>` of four `<li>`s — splitting them above and below would have required
`display: contents` or subgrid, and `display: contents` on a list item drops it from the
accessibility tree in some browsers. It also makes desktop and mobile the same arrangement
rotated (line, then content) rather than two different ones.

**Placeholder scan.** None. Every step carries its content; the one "fix what you found"
step is conditional on a finding and names no imaginary defect.

**Type consistency.** `stationReveal` returns `{ start, end }` in Task 1 and is destructured
as `{ start, end }` in Tasks 1 and 3. `drawExtent(progress: number): number` is called with
`self.progress` in Task 3. `ProcessStage` fields `number` / `name` / `line` are defined in
Task 2 and read as `stage.number` / `stage.name` / `stage.line` in Task 3. `PROCESS_STAGES`
has four entries, and `stations.length` — read from the DOM in Task 3 — is what is passed to
`stationReveal`, so the two cannot disagree even if the array changes.

**One trap flagged.** Task 3 Step 2 exists because the component's comments discuss
`stationPosition` while the code does not call it, and `eslint` fails the build on an unused
import. Written as its own step so it is not discovered as a build failure.
