# Spine Section Redesign — The Draft Stack

Date: 2026-08-03
Status: Approved design, ready for implementation planning
Section: 02 — The Spine (`src/components/sections/Spine.tsx`, `#about`)

---

## 1. Why the current section is being replaced

The existing Spine renders three left-aligned text blocks at `max-w-[46ch]`, spaced `22vh` apart,
each revealed by an identical `opacity` + `y` fade-up, over a full-bleed `LightChainCanvas`.

Three failures against the source-of-truth documents:

- **`motion-system.md` → Section Entry Rules** explicitly says "avoid generic fade-ins" and asks for
  combinations of opacity, translate, scale, clip-path and mask reveals. The section currently uses
  the one technique the document forbids, three times.
- **`design-principles.md` → Principle 2 (Design Through Contrast)** requires contrast in scale,
  weight, spacing and density. All three movements are set at the same size, the same weight, the
  same measure, at the same horizontal anchor. Nothing is dominant, so nothing leads.
- **`design-principles.md` → Principle 6 (Editorial Thinking)** asks that every section feel designed
  rather than assembled. The canvas performs; the typography does not participate in it.

The light-chain metaphor is also being retired. It illustrated "refinement" abstractly while the
section's sharpest claim — *"we removed the hand-off, because nothing survives one intact"* — went
unexpressed. The replacement expresses that claim directly.

## 2. The concept

**One job, three drafts, one pile.**

The section is a stack of three drafts of the *same* piece of work, accumulating like proofs on a
studio desk. Draft 01 is the argument. Draft 02 is the build. Draft 03 is the finished thing, and it
is no longer ours.

This justifies the stacked-card mechanic the way `CLAUDE.md` requires — the section does not use a
card stack because other sites do, it uses one because the work genuinely accrues in layers and the
pile *is* the argument. It satisfies `design-principles.md` §7 (Depth Without Clutter): depth comes
from layering and spatial relationship, not from heavy shadows.

**The detail that carries the narrative:** drafts 01 and 02 carry an `OURS` stamp in the rail.
Draft 03 does not — it reads `Not ours`, `Day 058 — handed over`. The stamp disappearing states the
closing line before the visitor reads it.

## 3. Copy (final)

Compressed from ~45 words per movement to ~17. Approved.

| Slot | Text |
|---|---|
| Eyebrow | `Section 02 — The spine` |
| Section heading | `Imagine. Build. Inspire.` |
| Section sub | `One job, three drafts, one pile. Nobody hands it to anybody.` |
| 01 word | `Imagine.` |
| 01 body | `We start with an argument, not a mood board. What is this for? Who has to feel something?` |
| 01 note | `Q. What happens if we do nothing at all?` / struck: `Open Figma, start a moodboard` |
| 02 word | `Build.` |
| 02 body | `The people who imagined it are the people who build it. We removed the hand-off, because nothing survives one intact.` |
| 02 note | struck: `Brief the build team` / `— There is no build team. There is the team.` |
| 03 word | `Inspire.` |
| 03 body | `Then we leave. It has to work without us — on a Tuesday, on a bad connection, on someone else's phone.` |
| 03 note | `No notes.` / `— That's the whole test.` |
| Rails | `Draft 01 · Imagine` / `Ours` / `Day 004` · `Draft 02 · Build` / `Ours` / `Day 031` · `Draft 03 · Inspire` / `Not ours` / `Day 058 — handed over` |
| Outro | `Imagine and Build are ours.` + muted `Inspire is yours.` |

Rail day-counters and margin-note copy are marked provisional in §11.

## 4. Scroll skeleton

Flow order inside `<section id="about">`:

```
header      80vh   eyebrow + "Imagine. Build. Inspire." + sub
card 01     72vh   sticky, top: 11vh          gap after: 30vh
card 02     72vh   sticky, top: 11vh + 17px   gap after: 30vh
card 03     72vh   sticky, top: 11vh + 34px   gap after: 14vh
outro       84vh   closing line, alone on open surface
                   ────────────────────────────────────────
                   ≈ 450vh total
```

Rules:

- Cards are **direct siblings inside one `.stack` container** so they share a containing block and
  all three remain stuck until the container ends. Arrival spacing comes from `margin-bottom`, not
  from wrapper slots — wrapper slots create separate containing blocks and each card would unstick
  as its own slot ended.
- Each card sticks 17px lower than the one before, so previous cards keep a 17px strip visible above
  the front card. This is the edge-peek from the reference image.
- Total travel is a tuning knob. Target 420–470vh; adjust the two 30vh gaps first.

**Sticky, not GSAP `pin`.** `Pillars` pins immediately after this section. GSAP pinning injects
spacer elements and recalculates on every `ScrollTrigger.refresh()`; two pin instances competing
across a section boundary is a known source of jitter. CSS `position: sticky` is inert by
comparison and costs nothing at refresh time.

**Known cost, accepted:** the stack stops the page for ~250vh directly before `Pillars` stops it
again, which works against `design-principles.md` → Visual Rhythm. Mitigation: the outro gives a
full 84vh of released, open surface between the two, so the stops never touch.

## 5. Card anatomy

```
╭──────────────────────────────────────────────────────────╮  radius 24px
│  Draft 01 · Imagine      [Ours]           Day 004        │  rail
├────────────────────┬─────────────────────────────────────┤
│  Movement          │                                     │
│                    │   ┌───────────────────────────┐     │
│  Imagine.          │   │                           │     │
│                    │   │      creative slot        │     │  radius 14px
│  We start with     │   │                           │     │
│  an argument…      │   └───────────────────────────┘     │
│  ─────────────     │   Draft 01 · artefact         60%   │
│  Q. What happens…  │                                     │
╰────────────────────┴─────────────────────────────────────╯
     40% text                    60% creative
```

- **Radius:** 24px card, 14px inner slot — a nested pair, not one radius everywhere. 24px matches the
  `rounded-3xl` already present in `Proof.tsx`, so this introduces no new token.
- **Surface:** card `--cy-paper` (#f5f3ef, one step off `--cy-surface`), panel `--cy-panel` (#edeae3).
  Two materials, so the split reads as construction rather than as a divider line.
- **Rail:** mono, 9.5px, `0.16em` tracking, uppercase, `--cy-muted`. Three columns:
  draft label / stamp / day. Stamp is `--cy-accent` outlined, `rotate(-1.2deg)`, except on card 03
  where it is unstyled muted text.
- **Text side (40%):** label, word (`clamp(1.5rem, 3.2vw, 2.6rem)`, 600, `-0.04em`), body
  (`max-w-[26ch]`), margin note pinned to the bottom on a hairline rule.
- **Creative side (60%):** an empty `ArtefactSlot` — dashed hairline border, centred mono caption,
  plus a foot rail showing the artefact label and current width.

## 6. Hover interaction

**Behaviour:** hovering the front card advances the creative panel over the text side, 60% → 75%,
revealing a second content layer underneath.

**Implementation — transform only.**

```
.panel  { left: 25%; right: 0; transform: translate3d(20%, 0, 0); }   /* edge rests at 40% */
.is-open .panel { transform: translate3d(0, 0, 0); }                  /* edge moves to 25% */
```

The panel is a **fixed 75%-wide element**. `translateX(20%)` of 75% equals 15% of the card, placing
its leading edge at exactly 40%. Removing the translate places it at 25%.

**Why not animate `width` or `flex-basis`:** either recalculates layout every frame and reflows the
26ch paragraph into an unreadable ribbon as it narrows. `transform` is GPU-composited and touches no
layout, which is what holds the 60fps `motion-system.md` §Principle 4 requires and the Lighthouse
budget `CLAUDE.md` mandates.

**What happens to the copy:** the word sits in the leftmost 25% and is never covered. Body copy and
margin note occupy the strip the panel sweeps over, and fade out over 0.42s as it advances. No text
is ever squeezed, clipped mid-word, or reflowed.

**Timing:** 0.62s, `cubic-bezier(.22, 1, .36, 1)` (the shape of GSAP `expo.out`, which
`motion-system.md` lists as preferred). Slot layers crossfade at 0.42s. Card shadow deepens over
0.5s.

**Pointer targeting:** only the front card accepts pointer events. Cards that have arrived but are
covered, and cards not yet arrived, get `pointer-events: none` — otherwise the 17px peeking strips
would trigger a reveal nobody can see. A card that loses front status while open is force-closed.

*Front card* is defined as `a > 0.55 && covered < 0.25` — arrived past the midpoint of its own
entrance, and not yet meaningfully overlapped by the next card. The thresholds are disjoint, so at
most one card is front at any scroll position.

**Cursor:** cards carry `data-cursor`, which the existing `LiquidGlassCursor` already snaps to via
its `SNAP_SELECTOR`. No new cursor code.

## 7. Motion timeline (scroll)

Per-card arrival progress `a ∈ [0,1]`, derived from the card's own offset:

```
a = clamp01( (scrollTop - (card.offsetTop - vh * 0.88)) / (vh * 0.46) )
```

Driven values:

| Property | From | To | Notes |
|---|---|---|---|
| `translateY` | `9vh` | `0` | card rises into place |
| `rotate` | `-0.75° / 0.55° / -0.35°` | `0` | straightens as it settles — reads as paper, not UI |
| `scale` | `0.97` | `1.00` | minus `0.018 × covered` for depth falloff |
| `opacity` | `0.20` | `1.00` | |
| body `opacity` | `1` | `1 - 0.72 × covered` | covered cards recede |

Where `covered` is the *next* card's arrival progress. The section header fades to 0.15 and
translates `-10vh` across the first 0.8 viewport of scroll.

All scroll work runs through one `ScrollTrigger` with `scrub`, writing only `transform` and
`opacity`. No `clip-path`, no `width`, no `top`.

## 8. Component architecture

| File | Responsibility |
|---|---|
| `src/components/sections/Spine.tsx` | Section shell, movement data, ScrollTrigger orchestration |
| `src/components/sections/spine/DraftCard.tsx` | Presentational card — rail, text side, panel. No scroll logic |
| `src/components/sections/spine/ArtefactSlot.tsx` | Swappable creative slot: `base` and `detail` layers, both empty for now |
| `src/lib/motion/draft-stack.ts` | Pure functions — `arrivalProgress`, `cardTransform`, `isFrontCard`. Unit-testable |
| `tests/lib/draft-stack.test.ts` | Covers the pure functions above |

`Spine.tsx` is currently 112 lines and would roughly triple inline. Splitting keeps each unit under
the size where edits get unreliable, and matches the existing `sections/pillars/*Panel.tsx` pattern.

**Deletions** (verified: no other consumers):

- `src/components/light/LightChainCanvas.tsx` — `Spine.tsx` was its only importer.
- `src/lib/light/chain.ts` — after the above, used only by its own test.
- `tests/lib/light-chain.test.ts`

**Explicitly retained:** `src/lib/three/prism-optics.ts` and `src/lib/three/palette.ts` are still
imported by `src/components/three/PrismScene.tsx`, which is dormant but deliberately kept per the
comment at `src/components/sections/Hero.tsx:217`. `tests/lib/prism-optics.test.ts` stays.

## 9. Responsive

Breakpoint: **820px**.

Below it the split collapses — text side goes full width, panel stacks beneath it at a 190px minimum
height, cards lose `position: sticky` and become a normal vertical sequence with 22px gaps. The
hover reveal is disabled (no hover to drive it) and body copy is always at full opacity.

`motion-system.md` → Mobile Motion Rules: motion adapts rather than disappears. The card entrance
reveals are kept; only the stacking and the reveal are dropped.

## 10. Accessibility & performance

- **Reduced motion:** all transitions disabled, cards render un-stacked at full opacity, panel stays
  at 60%. Content fully available.
- **Touch:** no hover, so the detail layer is unreachable. **Rule: the detail layer may never hold
  information not available elsewhere.** It is supplementary by definition.
- **Keyboard:** cards are non-interactive content, not controls — they are not focusable and expose
  no hidden essential content, so no focus handling is required. If the slot later gains a link or
  video control, the reveal must also trigger on `focus-within`.
- **Semantics:** each card is an `<article>`; the section keeps `id="about"`; the movement word is an
  `<h3>` under the section `<h2>`.
- **Budget:** no canvas, no WebGL, no new dependencies. Scroll handler is rAF-throttled and writes
  only compositor properties. Lighthouse must stay above 90 — this is strictly cheaper than the
  `LightChainCanvas` it replaces, which ran a `requestAnimationFrame` loop continuously while in view.

## 11. Provisional — expected to change

Locked by this spec: the 40/60 geometry, the transform-only reveal, the nested 24/14px radii, the
fade-not-reflow behaviour, the stacking mechanic, the copy in §3.

Deliberately open, to be revisited when content exists:

- Contents of `ArtefactSlot` base and detail layers (currently empty with a caption).
- Rail day-counters (`Day 004` / `031` / `058`) — placeholder framing.
- Margin-note copy.
- Whether the detail layer is imagery, video, or a second typographic state.

`ArtefactSlot` is designed as a typed swappable component precisely so that filling it later is a
one-file change.

## 12. Verification

- `npx tsc --noEmit` clean.
- `npx eslint .` clean.
- `npx vitest run` — existing suites pass; `light-chain.test.ts` removed alongside its module; new
  `draft-stack.test.ts` covers arrival maths at boundaries (`a` clamps at 0 and 1, front-card
  selection is exclusive).
- `npx next build` succeeds and the static export in `out/` is produced.
- Manual: stack assembles and releases without jitter across the `Spine → Pillars` boundary; hover
  reveal runs at 60fps in devtools; layout does not shift during the reveal; 820px fallback stacks
  correctly; reduced-motion renders all three cards statically.
