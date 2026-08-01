# Hero Composition — Design Spec

Date: 2026-08-01
Status: Draft — pending review
Scope: `Hero` section only. No other section changes.

---

## 1. Why

The current hero is a centred stack — headline, subhead, paragraph, SCROLL — symmetrical and template-shaped. Measured against the source-of-truth docs it fails on four counts:

- **website-story.md, Ch.1** lists "generic hero sections" under Avoid. A centred stack is the generic hero.
- **design-principles.md, P2 (Design Through Contrast)** — three near-equal type sizes (`text-5xl` pill, `text-6xl` tail, `text-5xl` deck) compete rather than rank.
- **design-principles.md, P4 (Visual Hierarchy First)** — nothing in the composition tells the visitor what to read second.
- **design-principles.md, P7 (Depth Without Clutter)** — the rotator pill uses a chromatic ring, two inset highlights and a drop shadow. P7 names "overused glassmorphism" and "heavy shadows" explicitly.

There is also no room in the composition for a hero-scale creative. Anything added today can only sit behind the text as wallpaper.

## 2. Decisions locked

| Decision | Resolution |
|---|---|
| Composition | **C2 "Eclipse" + S3 "Corner anchor"** — cinematic, bottom-anchored type, creative cropped by the top edge |
| Rotating pill | **Kept**, re-materialised as solid ink fill |
| Rail wording | **Imagine / Build / Inspire**, static (not an active-state indicator) |
| Existing hero WebGL | **Both out of the hero** — `FlutedGlassBackground` (deleted) and the `LiquidMaterial` blob (not mounted; see §6) |
| New creative | A new 3D object will occupy the slot. Out of scope for this spec; the slot and its contract are in scope. |
| Content | All current copy retained |

### 2.1 Why the rail is static

`Build / Capture / Move` are the three pillars from website-story.md Ch.4, and in earlier iterations the rail doubled as the active-state indicator for the pill rotation. `Imagine / Build / Inspire` is an ethos triad, not a discipline list, and "Build" would carry two different meanings in one frame. The rail is therefore a fixed mark at the base of the composition, and the rotation is carried by the pill and the creative alone — one rotation on the page, not two competing ones.

---

## 3. Composition

### 3.1 Desktop (≥1024px)

```
                  [ nav pill ]

        ((  creative slot — 60vw square, centred 52%,   ))
        ((  top -14vh, cropped by the top edge, z-0     ))

  [Videos] worth
  remembering.                          Cylent Solutions merges
  Three disciplines. One studio.        technology, visuals, and
  No hand-offs.                         storytelling into one
                                        creative process.

  IMAGINE / BUILD / INSPIRE                            SCROLL ↓
```

Section: `min-height: 100svh`, `position: relative`, `overflow: hidden`, background `--color-surface`. Page gutter `6vw` (floor 24px).

| Element | Placement |
|---|---|
| Creative slot | `absolute`, `left: 52%`, `translateX(-50%)`, `top: -14vh`, `width: 60vw`, `aspect-ratio: 1`, `z-0` |
| Headline block | `absolute`, `left: gutter`, `bottom: 13.5vh`, `width: min(56%, 60ch)`, `z-10` |
| Deck | In flow directly under H1, same left edge |
| Support paragraph | `absolute`, `right: gutter`, `bottom: 13.5vh`, `width: 24%`, `max-width: 28ch`, **right-aligned**, `z-10` |
| Rail | `absolute`, `left/right: gutter`, `bottom: 5.5vh`, `flex`, `justify-between`, `z-10` |

Two structural rules that carry the design:

1. **Shared baseline.** The support paragraph's bottom edge aligns with the headline block's bottom edge (`13.5vh`). The two corners are far apart but locked to one line — that is what makes the emptiness between them read as composition rather than as a gap.
2. **The overlap.** The H1's cap-height crosses the creative's lower edge. Type in front, creative behind, no rule or scrim between them. This is depth through layering (P7) rather than through shadows and gradients.

H1 breaks to two lines: `[pill] worth` / `remembering.`

### 3.2 Tablet (768–1023px)

Two-corner arrangement retained — it is the identity of S3. Creative slot `width: 82vw`, `top: -8vh`. Headline block `width: 72%`. Paragraph `width: 30%`, `max-width: 26ch`.

### 3.3 Mobile (<768px)

The right column has no room, so the paragraph moves into the left stack. The crop intensifies instead — the creative is wider than the viewport and cropped on three sides, which preserves the cinematic character rather than shrinking it.

| Element | Placement |
|---|---|
| Creative slot | `left: 50%`, `translateX(-50%)`, `top: -6vh`, `width: 130vw`, `aspect-ratio: 1` |
| Content stack | `left/right: 24px`, `bottom: 8vh`, left-aligned: H1 (3 lines) → deck → paragraph |
| Rail | `bottom: 4vh`, triad only — **scroll cue hidden** (no room, and the gesture is native on touch) |

### 3.4 Type scale

| Role | Size | Weight | Leading | Tracking | Colour |
|---|---|---|---|---|---|
| H1 | `clamp(2.25rem, 6vw, 6rem)` | 600 | 1.02 | -0.03em | `--color-ink` |
| Deck | `clamp(1.0625rem, 2.1vw, 1.75rem)` | 600 | 1.2 | -0.02em | `--color-ink` |
| Paragraph | `clamp(0.8125rem, 1.15vw, 1rem)` | 400 | 1.6 | -0.005em | `--color-ink-muted` |
| Rail / scroll | `0.6875rem` | 500 | 1 | 0.22em, uppercase | `--color-ink-muted` |

Ranking is 4:1.7:1 across H1 → deck → paragraph. Nothing in the frame sits at a size close to its neighbour, which is what P2 and P4 ask for and what the current hero lacks.

---

## 4. The pill

Retains its current mechanic: measure the incoming content's natural width, restore the locked width, then tween to the target (`power3.out`) while the content crossfades. Retains `WebIcon` / `VideoIcon` / `GraphicsIcon`.

Changes:

- Fill `--color-ink`; text and icon `--color-surface` via `currentColor`.
- Remove `chromatic-ring`, `bg-ink/5`, and the `shadow-[inset…,inset…,0 8px 24px…]` stack.
- Padding tuned so the pill sits on the H1 baseline rather than displacing it.

Rationale: it becomes the densest, darkest mark in a pale frame — the strongest element on the screen, which is the impact the current glass pill is reaching for and missing. It also removes the P7 violation. `chromatic-ring` stays in `globals.css`; `Loader.tsx:194` still uses it.

---

## 5. The creative slot

The new 3D object is out of scope here. What is in scope is the contract it must satisfy, so it can be dropped in without touching the layout.

```ts
type HeroCreativeProps = {
  /** 0 = Websites, 1 = Videos, 2 = Brands — the same state that drives the pill. */
  index: number;
  /** Position, size and crop are supplied by Hero. The component must not position itself. */
  className?: string;
};
```

Requirements on any component mounted in the slot:

- Fills the box given by `className`. Does not set its own `position`, size or offset.
- `aria-hidden="true"`, `pointer-events: none`.
- Reacts to `index` changes. Never resets to a neutral state between transitions — it moves directly from one discipline's form to the next. That continuity *is* the sentence "Three disciplines. One studio. No hand-offs.", shown rather than claimed (website-story.md Ch.1: the story should be experienced, not explained).
- Ships a non-WebGL fallback for unsupported contexts.
- Suspends its RAF loop when offscreen (`IntersectionObserver`) or when `document.hidden`.
- Disposes geometry, materials and renderer on unmount.
- Honours `prefers-reduced-motion`: static pose, no idle animation, no transition tween.
- Caps `devicePixelRatio` at 2, or 1.5 when `navigator.deviceMemory < 4`.
- Transparent clear colour — the hero surface shows through.
- Does **not** animate its own entrance. `Hero` animates the slot wrapper's opacity and scale as part of the entrance timeline.

**Interim state:** until the object exists, the slot renders nothing visible and the upper ~55% of the hero is empty. This is expected and acceptable — S3 was chosen partly because the typography holds the frame on its own — but it must be understood that the hero ships visually incomplete until the creative lands.

---

## 6. Removals

| Target | Action | Reason |
|---|---|---|
| `FlutedGlassBackground` in `Hero.tsx` | Remove usage, delete `src/components/three/FlutedGlassBackground.tsx` | Nothing else imports it |
| `flutedVertexShader`, `flutedFragmentShader` | Delete from `src/lib/three/shaders.ts` | Only consumer was the above |
| `LiquidMaterial` | Not mounted in the hero | Superseded by the new object |

`LiquidMaterial.tsx`, `morphGeometry.ts`, `palette.ts` and the remaining shader exports are **retained on disk, unwired**. `LiquidMaterial` already solves the hard parts of the slot contract — index-driven crossfade between three morph targets, WebGL fallback, RAF sleep, DPR capping, full disposal — so it is the natural starting point for the new object. If the new object is built without it, all four files should be deleted in that same pass rather than left as dead code.

---

## 7. Motion

### 7.1 Entrance

Triggered by `onLoaderReady`, following the sequence in motion-system.md ("Hero Animation Strategy"), overlapped so it reads as one movement rather than a five-step queue.

| Start | End | Element | Technique |
|---|---|---|---|
| 0.00 | 1.05 | H1, two lines | clip-path mask reveal, `y: 110% → 0`, stagger 0.14, `expo.out` |
| 0.30 | 1.50 | Creative slot wrapper | `opacity: 0 → 1`, `scale: 0.94 → 1`, `expo.out` |
| 0.85 | 1.55 | Deck | `y: 16 → 0` + opacity, `expo.out` |
| 1.00 | 1.70 | Paragraph | `y: 16 → 0` + opacity, `expo.out` |
| 1.45 | 1.95 | Rail + scroll cue | opacity, `power2.out` |

Total ≈ 2.0s — inside the doc's 2–4s window. Line reveals over word or character staggering, per motion-system.md "Typography Motion". Pill rotation begins on timeline complete, as it does today.

While the slot is empty, its step still runs on the wrapper; it simply has nothing to reveal.

### 7.2 Rotation timing

Current values are wrong for a hero-scale creative:

```
ROTATE_INTERVAL_MS = 1500   →   3000
SLIDE_DURATION_S   = 0.45   →   0.9   (add MORPH_DURATION_S = 0.9)
```

At 1500ms with a 0.45s transition the object would never settle before being pulled to the next state, and three words cycle in 4.5s — frantic, not cinematic. 3000ms gives roughly two seconds of stillness per state.

Pill and creative share the same 0.9s duration so the word and the form change as a single gesture, but not the same easing: the pill uses `power3.out` and the creative `expo.out`. Same start, same end, different settle — the word resolves and becomes readable while the form is still coming to rest behind it. Matching both easings would make the pill's width tween feel sluggish for what is a small inline element.

### 7.3 Parallax

Cursor parallax on the slot at **±3%**. motion-system.md specifies 5–20%; the low end is deliberate here because the creative sits directly behind live type, and larger offsets would make the overlap read as drift.

### 7.4 Reduced motion

- No entrance timeline — all elements set to final state.
- No parallax.
- **Rotation continues.** `prefers-reduced-motion` asks for less *movement* — sliding, spinning, scaling, parallax, the things that trigger vestibular responses. A word being replaced by another word is a content change, not a movement. Suppressing the rotation entirely would discard the hero's strongest beat for a stricter reading than the preference requires. Current behaviour (rotation runs regardless) is correct on this point and is kept.
- **The animation around the rotation stops.** The pill's width snaps to the new value instead of tweening; the content crossfades on opacity only, with no `y` offset. Opacity is not a vestibular trigger and is the standard reduced-motion-safe transition.
- Creative slot renders its static fallback and **holds a single pose** — it does not change state with the index. A hero-scale form snapping between geometries is precisely the large-area movement the preference exists to suppress, and it cannot be softened to an opacity crossfade the way the pill can. The pill carries the rotation alone in this mode.

### 7.5 Accessibility of the rotator

Two obligations that apply in **all** modes, not just reduced motion — both are consequences of keeping the rotation, and neither is currently handled:

- **Stable accessible name.** The rotating word sits inside the `h1`, so today the page's primary heading changes every rotation and assistive tech re-announces it. The visual rotator gets `aria-hidden="true"`; the `h1` gets one fixed, visually-hidden accessible name covering all three states — "Websites, videos and brands worth remembering. Three disciplines. One studio. No hand-offs."
- **Pause on hover and focus.** WCAG 2.2 SC 2.2.2 (Pause, Stop, Hide) applies to any auto-updating content that starts automatically, runs beyond five seconds and sits alongside other content. An indefinitely cycling rotator qualifies regardless of the motion preference. Hovering or keyboard-focusing the pill pauses the interval; leaving resumes it. This is the standard mitigation and costs almost nothing.

---

## 8. Performance

Budget: Lighthouse > 90, per CLAUDE.md.

- One WebGL context in the hero, not two. Removing `FlutedGlassBackground` is a net reduction against today even after the new object lands.
- Slot mounts after `onLoaderReady`, so it never competes with first paint.
- RAF suspended offscreen and on tab hide.
- Transforms and opacity only in the entrance timeline — no animated layout properties. The pill's width tween is the one exception and is confined to a small inline element.
- `will-change` applied only for the duration of the entrance, then cleared.

---

## 9. Files

| File | Change |
|---|---|
| `src/components/sections/Hero.tsx` | Rewrite — composition, slot mount, retuned timeline |
| `src/components/sections/hero/HeroCreativeSlot.tsx` | New — typed slot boundary + empty placeholder |
| `src/lib/motion/rotator-timing.ts` | Retune constants; add `MORPH_DURATION_S` |
| `src/components/three/FlutedGlassBackground.tsx` | Delete |
| `src/lib/three/shaders.ts` | Remove the two fluted exports |
| `tests/lib/rotator-timing.test.ts` | New — assert timing invariants |

`globals.css` is unchanged: `chromatic-ring` remains in use by `Loader.tsx`.

### 9.1 Testing

The repo tests pure logic under `tests/lib/` (vitest, 5 existing files) and does not test components. This work follows that pattern:

- Assert `MORPH_DURATION_S < ROTATE_INTERVAL_MS / 1000` — the invariant that keeps a state from being pulled before it settles.
- Any pure helper extracted for slot positioning or index cycling gets unit tests.
- Layout and motion are verified by running the app, not by test.

---

## 10. Out of scope

- The new 3D object's design and implementation.
- Every other section. The user has stated the rest of the site needs its own pass; nothing here should pre-empt it.
- Nav, loader and cursor, except that the hero must not regress them.

---

## 11. Open items

1. Who builds the new creative, and whether it extends `LiquidMaterial` or replaces it — determines whether the four retained WebGL files stay or get deleted.
2. Whether the hero ships with the slot empty or waits for the object.
