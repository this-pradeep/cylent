# Chapter 7 — The Process

Design spec. 2026-09-06.

## Why this section exists

`website-story.md` sets out a six-stage emotional journey: Curiosity, Interest,
Understanding, **Confidence**, Desire, Action. Its Chapter 7 note records what happened to
the fourth of those:

> Both carried the **Confidence** beat in the emotional journey above — "they know how to
> execute" and "they genuinely care about quality." Nothing carries it now. Chapter 6
> proves capability and Chapter 8 asks for the meeting, so the page moves from what we
> make straight to the ask. Worth knowing before that beat is either replaced or
> deliberately abandoned.

This chapter replaces it. It is not a new idea imported from outside — it closes a hole the
story document itself left open and flagged for a decision.

The section also answers a claim the page already makes and never supports. Chapter 3 says
work happens "in the space between ideas and execution … That's where we work." The site
states the studio's position and shows the results, and never shows the method that
connects them.

`docs/ux_architecture.md` (ACT 07) supplies the shape: four stages, "represented as one
connected system rather than four cards." The stage names are taken from it and moved off
the engineering register — Discover, Design, Build, Deliver — because this studio makes
websites, film and identity, not infrastructure.

### Numbering

The section takes **Chapter 7's** slot. Chapter 5 (also a process chapter) stays cut, as
its own note instructs — it sat before Proof, and this section sits after it. Chapter 7's
slot is already in the right place in the running order and already carried the Confidence
beat, so reusing it keeps every chapter identifier in the codebase stable. No renumbering.

## Placement

Between `Work` and `Future` in `src/app/page.tsx`:

```
Hero      who we are
About     why one studio
Work      the proof            ← centrepiece, unmoved
Process   the method           ← this section
Future    the close
Footer    contact
```

After the work, not before it. Placing it before would stack three telling sections ahead
of any showing, and push the centrepiece further down the page. After the work it answers
the question the work provokes — *how did you do that?* — so Chapter 8's "Let's create
something remarkable" lands on a visitor who now knows how it would be created.

## Composition

### The line is the section

One accent hairline, drawn across the section as it is scrolled, with the four stages as
stations on it. That is the whole visual idea. `design_direction.md` asks for thin lines
and for lines that become animation paths; `motion-system.md` requires movement that
communicates. Here the drawing *is* the argument — a process is a thing with an order, and
a line being drawn through four points states that order without a single word claiming it.

Deliberately not Chapter 3's language. About is radial: fields that bloom and gather.
Process is linear: one continuous stroke. Two abstract diagrams in one page have to read as
different instruments, and radial-versus-linear is the cleanest separation available. Both
use `--gradient-accent`, so they still read as one system.

### Why there is no rule above the heading

Chapter 3 opens with an eyebrow over a full-width accent rule. This section opens with the
eyebrow alone. The drawn line is this section's rule, and a second accent hairline sitting
static above a first one that draws would read as a mistake.

### Ground

`--color-paper` (`#f5f3ef`), one step off surface.

Not ink. `design-principles.md` Principle 2 asks for contrast, and Chapter 6 already spends
it — three full-bleed ink frames. A fourth dark slab would dilute those rather than add to
them, and Chapter 8's beam needs a light ground to fall on. Paper is the token whose
documented purpose is exactly this: one step off surface, read as a different material
rather than as a divider. The quieter ground also suits the content — this is the studio
talking about itself, and it should be quieter than the work.

### Desktop (≥ 820px)

Matches Chapter 6's breakpoint, so the two neighbouring sections change layout together.

Held with CSS `sticky`, following every other section on the page: an outer wrapper at
`h-[160vh]` gives the scrub its room, an inner `sticky top-0 h-screen` holds the
composition. No GSAP pin — nothing on this page pins, and sticky holds just as well without
taking the element out of flow or costing anything at `ScrollTrigger.refresh()`.

```
  HOW WE WORK

  <heading>

  01            02            03            04
  DISCOVER      DESIGN        BUILD         DELIVER
──●─────────────●─────────────●─────────────●──
  <line>        <line>        <line>        <line>
```

Names sit above the line and supporting lines below it, so the stroke reads as a baseline
the process stands on and the eye takes the four names as one left-to-right row. Names are
not alternated above and below the line: that is the timeline-infographic convention, and
it turns a stroke into a chart.

### Mobile (< 820px)

The same line, turned vertical — a spine down the left of the content column, stations
stacked against it, each dot on the spine with its number, name and line to the right.
Drawn top to bottom.

Not a shrunk desktop. Four stations across a phone would give each about 80px, which is not
a column. Vertical is the honest form at that width, and a spine reads as the same object
as the horizontal stroke because it is the same stroke.

## Motion

### Drawing

`clip-path` inset, revealing a fixed gradient — **not** `scaleX`.

Chapter 3's rule uses `scaleX`, and is right to: it is a single fast tween where a
momentarily compressed ramp is never seen. This line is drawn across a scrub the visitor
controls, so at 10% progress `scaleX` would show the entire five-stop ramp squeezed into a
tenth of the width, and every station would light at a colour it does not keep. Clipping
holds the gradient still and uncovers it, so each station is revealed at its true colour.

`clip-path` inset is also what Chapter 6's reveals already animate, so this is the page's
existing verb rather than a new one.

### Stations

Each station lights as the drawing front reaches it. Nothing arrives early, nothing waits —
the line is what delivers the content, which is what makes it a system rather than a
decoration laid over a list.

Timing lives in a pure module (see below) so the sequencing can be reasoned about and
tested without a DOM, following `chapter-beats.ts`.

### Reduced motion

Standard `still` branch, as every other section: line at full extent, all four stations
present at `opacity: 1`, nothing translated, and the section's `motion-safe:` height and
sticky drop away so it becomes an ordinary block. The four stages are content, not
decoration — they must all be readable with motion off.

### ScrollTrigger

Triggers are declared through the timeline config. **`ScrollTrigger` is not imported into
this file.** The plugin is registered once in `LenisProvider`, and `Future.tsx` records that
naming the symbol in a section file pulled a second copy into the page chunk and cost 17kB.

## Modules

### `src/lib/motion/process-stations.ts` (new)

Pure. No DOM. Expressed against the scrub's 0–1 progress, the same convention as
`chapter-beats.ts`.

```ts
export const DRAW_LEAD = 0.08;      // the section holds before the stroke starts
export const DRAW_END = 0.82;       // stroke complete, with scroll left to rest on it
export const STATION_REVEAL = 0.1;  // how long one station takes to arrive

drawExtent(progress: number): number
// how much of the line is drawn, 0–1, remapped through the lead and end.
// clamped via the existing clampProgress().

stationReveal(index: number, count: number): { start: number; end: number } | null
// when a station arrives. Its start is the scrub progress at which the drawing
// front reaches that station's own position on the line — the two are the same
// event by construction, not two sequences tuned to look aligned.
```

A separate module from `chapter-beats.ts` rather than a reuse of `beatWindow`. `beatWindow`
divides a scrub into equal consecutive slices for items that have no position; these
stations have positions on a line, and their timing is derived from those positions. Same
shape of concern, different meaning — sharing the function would force one of the two to
lie about what its numbers are.

### `src/lib/site/process.ts` (new)

The four stages, as content. `technical_architecture.md` requires content held apart from
components, and `src/lib/site/` is where this project already keeps it.

Stage names are settled: Discover, Design, Build, Deliver. The section heading and the four
supporting lines are written as a proposal and marked in-file as copy belonging to the
studio, the way `projects.ts` marks its placeholder data. Nothing in the layout depends on
the words.

### `src/components/sections/Process.tsx` (new)

Client component. `gsap.matchMedia` with `held` / `flowing` / `still` branches, matching
every other section. Cleanup via `mm.revert()` and explicit `scrollTrigger?.kill()`.

Reuses `SectionEyebrow` and `EYEBROW_LIFT_HEADROOM`; the section carries
`data-eyebrow-surface` so the eyebrow's letter-lift gets an honest hit area.

## Accessibility

- The stages are an `<ol>`. They are a sequence, and the semantics should say so rather
  than leaving it to four rendered digits.
- The line and the dots are `aria-hidden="true"`. They are decoration; the order is already
  carried by the list.
- The `01`–`04` numerals stay visible — they are a typographic element of the composition —
  but carry no meaning the list does not already carry.
- Supporting lines use `text-ink/70`, matching Chapter 3's stanza, which clears AA on paper.
- No hover-only content. Nothing in this section requires a pointer.
- Keyboard: the section contains no interactive elements, so there is nothing to trap or
  to focus.

## Performance

- No new dependencies. GSAP and ScrollTrigger are already on the page.
- `clip-path` and `transform` only. Nothing animated triggers layout.
- `will-change: transform` only on the nodes that actually move, cleared where the
  page's other sections clear it.
- No images, no media, no 3D. The section adds markup and one timeline.

## Also in this change

Two items of housekeeping, both approved alongside the section.

1. **`CLAUDE.md` repointed.** It names `brand-guidelines.md`, `design-principles.md`,
   `motion-system.md` and `website-story.md` as source of truth; all four had been deleted
   from the working tree while 26 code comments still cite them by name. The four are
   restored. The newer `docs/*_*.md` set is kept and described as reference rather than as
   source of truth, which is what the direction decision made it.

2. **`Problem.tsx` deleted.** Commented out of `page.tsx`, imported by nothing. It is a
   four-tile card grid, which `CLAUDE.md` forbids in as many words ("repetitive card
   grids", "remove anything that feels generic"), and Chapter 2's positioning is already
   carried by the Hero and Chapter 3. Dead code that contradicts the rules is worth
   removing rather than leaving for someone to revive.

`website-story.md` Chapter 7 is rewritten from its cut note to describe this section.

## Out of scope

- **The placeholder projects.** `projects.ts` says it best itself: "EVERY PROJECT BELOW IS A
  PLACEHOLDER … Replacing this array is the highest-value change available to this section —
  nothing about the layout will fix it." That is content, and it is the studio's.
- **Everything else in the new `/docs` set.** The dark/green/monospace identity, the 3D
  Cylent Engine, the IT-consulting positioning and the multi-page split all belong to a
  different company than the one this site is for. Kept as reference; not built.

## Verification

- `npm run typecheck`
- `npm run test` — including new coverage for `process-stations.ts`
- `npm run lint`
- `npm run build`
- Read the section at desktop and phone widths, and with `prefers-reduced-motion: reduce`.

## The test the checklist asks for

`quality_checklist.md`: *remove all animations — does the section still work?* With motion
off this is a numbered list of four stages under a heading, on a line, on paper. It reads.
The drawing is what makes it feel like a system; it is not what makes it legible.
