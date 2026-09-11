# Chapter 3 — The Room

Design spec. 2026-09-11.

Replaces the overlapping-fields treatment of Chapter 3 (Our Philosophy) with a WebGL room
lit by the real sun over Indore at the moment the visitor arrives.

## Why this section is being rebuilt

Three reasons, in descending order of importance.

### 1. The current section argues with the wrong instrument

`website-story.md` Chapter 3 gives this section one job: most companies treat development,
design, photography and video as separate services; we see them as parts of one experience.

The present implementation makes that argument as a diagram — three coloured fields drifting
until they intersect. `design-principles.md` warns against exactly this instinct, and
`overlap.ts` says it out loud in its own comment:

> an even triangle of three circles is a Venn diagram, and a Venn diagram is a consultancy
> slide.

The file then spends three paragraphs working around the consequences of the diagram it
built. `FIELD_FOCUS` records that the gather had to be stopped a third short of convergence
because three saturated fields multiplying at close range "drive the overlap toward mud …
the colour stops reading as glass and starts reading as a bruise."

A diagram of our philosophy is still us *explaining* it. `brand-guidelines.md` states the
goal as the opposite:

> "Cylent Solutions creates work that feels different." Not because of what we say. Because
> of what they experience.

### 2. The section is the page's likely jank source

`About.tsx` paints three radial gradients at 78% width (`min-width: 520px`) with
`mix-blend-multiply`, then writes `transform` to all three on every frame of the gather
scrub (`onUpdate: (self) => place(self.progress)`).

A `mix-blend-mode` layer cannot be composited independently of its backdrop, so each frame
requires re-rasterising and re-blending a near-fullscreen region. This is the prime suspect
for the homepage not feeling smooth. **It is a hypothesis, and the first implementation task
is to confirm it with a profile** — but the replacement removes the mechanism either way.

### 3. The section is too technical for what it is about

`brand-guidelines.md` requires the site feel Premium, Modern, Intentional, Creative and
**Human**, and explicitly not **Overly technical**. A colour-model demonstration is the
latter, in the one chapter that is about who we are.

## The concept

**The disciplines are one experience because they happen in one room.**

That is the least abstract possible statement of Chapter 3, and it requires no metaphor to
decode. The section becomes a room — and the room is **live**: lit by the actual sun
position over Indore at the minute the visitor arrives.

`studio.ts` already knows the studio is in Indore and that its zone is `Asia/Kolkata`, and
the loader already stamps a studio clock. The most human fact this site holds about itself
is currently an 11px mono line at the bottom of the section being replaced.

Someone opening the site from London at midnight sees the room lamplit and low. Someone
opening it mid-afternoon in Indore sees it bright and raking. It is the same room, and they
are seeing it now. Nothing about this is claimed in copy.

### Why this is not decoration

`3D_interaction.md` — reference rather than source of truth, and its black-and-green
identity is wrong for this light editorial site — lands one rule that is kept: 3D must
visualise the concept, not float a shape. The room *is* the concept. There is no object in
it, no diagram, and nothing that has to be interpreted.

## What is in the room

Enough architecture to read as a room, and not one detail more. No furniture, no skirting,
no ceiling, no corner.

| Element | Purpose |
| --- | --- |
| A wall with a window | The light needs an aperture, and a window is what makes it a room |
| A mullion | A window frame divides light. The cross of shadow it throws is what reads as real, far more than a bare rectangle would |
| A surface | What the light lands on, and what the copy sits on |
| Air, with dust | The detail that makes the room inhabited rather than rendered |
| The copy | The only thing in the room, and therefore the subject |

### The copy is the subject

`design-principles.md` holds that typography is a primary design tool, not just content.
With no object in the frame, the type is what the light falls on. The composition is
editorial — a warm surface, a shaft, and words in it — not an architectural render.

### Dust is the load-bearing detail

Dust drifting in a sunbeam is the most inhabited image available, it is unmistakably human,
and it costs a few hundred GPU points. If one thing in this section is built carefully, it
is this. A room with a shaft of light and no dust in it is a render; the same room with dust
is somewhere people work.

### Palette

The planes are `--color-surface` and `--color-paper`. **All warmth comes from the sun's own
colour temperature at that hour** and from nothing else. No new colour is introduced.

This also retires a documented exception. The current `About.tsx` comment concedes:

> This is a deliberate departure from the one-accent rule in design-principles.md. The
> accent gradient still owns every hairline and every piece of accented type on the page;
> these three are material for one section only.

The three RGB field colours go with the fields. Chapter 3 rejoins the one-accent rule, and
the accent gradient keeps the eyebrow's hairline as in every other chapter.

## The sun

### Computation

Solar elevation and azimuth are computed client-side from `Date` and Indore's coordinates
using the standard NOAA solar position equations — fractional year, equation of time,
declination, hour angle, zenith. Roughly forty lines of arithmetic.

- **Coordinates:** 22.7196° N, 75.8577° E
- **No library.** `CLAUDE.md` forbids additional dependencies, and this does not need one.
- **No API and no backend.** `CLAUDE.md` requires the site stay fully static. The visitor's
  clock supplies UTC; the maths supplies the rest.
- **Timezone-independent.** The sun is computed from UTC and Indore's longitude, so it is
  correct regardless of where the visitor is. `STUDIO_TIME_ZONE` is used only to display the
  studio's local clock.

### Light from elevation

A pure function maps solar elevation to the room's light: colour temperature, intensity, and
shaft geometry.

| Elevation | Reads as |
| --- | --- |
| Below 0° | Night. A single warm interior source, low key, long soft falloff |
| 0°–5° | Deep amber, very long raking shadow |
| 5°–15° | Warm, long shadow |
| 15°–40° | Neutral-warm, shadow shortening |
| Above 40° | Near-white, short shadow, the surface at its most flat |

### The legibility floor — a hard constraint

The rendered ground is the background of real body copy, so **the room's luminance is
clamped to a range whose darkest value still holds `--color-ink` at 4.5:1 or better.**

This means the 2am room is *lamplit and low-key rather than genuinely dark*. Paper stays
paper. That is a deliberate trade and it is the correct one twice over: legibility wins over
atmosphere, and a light editorial site should not have one section that goes black.

`brand-guidelines.md` sets the precedent for how this is verified — the accent ramp is
checked along its whole length, not just at its endpoints, because "interpolation can dip
below both of them." The same applies here: contrast is asserted across all 24 hours, not
only at the extremes.

Dust is rendered on the canvas, which sits **behind** the DOM type, so it can never reduce
text contrast beyond the clamped ground luminance.

## Choreography

One mechanism explains everything. **The type is not revealed; it is lit.**

### Entrance

Arrival trigger stays where it is (`start: "top 82%"`), for the reason the current file
already documents: a held section's scrub does not begin until its top reaches the top of
the viewport, so a reveal driven off the scrub leaves the section blank the whole way in.

1. The shaft enters at an azimuth offset 15° back from the true current one — roughly an
   hour earlier in the day — and **settles** into the correct position over ~1.4s on
   `expo.out`.
2. Dust wakes and begins drifting.
3. The eyebrow and accent hairline draw exactly as they do now. That furniture is shared
   with every Work chapter and must not change.
4. The headline reveals on the existing `clip-path` inset wipe — **re-timed and re-oriented
   so the wipe travels with the light.** The words appear because the light reaches them.

Point 4 is the whole idea. `motion-system.md` asks that every movement communicate
something; this is one event explaining two things instead of a reveal bolted onto a reveal.

### Scroll

The held scrub does exactly one physical thing: **the light rakes.**

Sun azimuth and elevation advance across the scrub by a bounded amount — approximately 25
minutes of real sun movement. Enough for the mullion shadow to visibly travel; not enough to
misrepresent the hour. The shadow sweeps the surface, the shaft's width breathes, dust
drifts through it.

Nothing translates. Nothing scales. Nothing fades.

Held with CSS `sticky`, as now. No section on this page uses a GSAP pin.

### Why this is the smooth version

The scrub writes **three floats to shader uniforms**. It does not write `transform` to three
near-fullscreen blended layers.

- One quad and one point cloud. Two draw calls.
- No layout, no re-blending of composited regions, no `mix-blend-mode` anywhere.
- The work per frame is constant and independent of viewport size.

### Pointer

A camera nudge of ~1.5% of frame, heavily lagged — enough to make the room a space rather
than an image. `motion-system.md` puts parallax at 5–20% and prefers subtle; this sits
deliberately below that range, because the hero already owns pointer interaction with its
drag and tilt.

`design-principles.md` asks the page to alternate motion and stillness. The hero is loud.
This chapter is the held breath.

### Exit

None. The section releases from sticky and the light stays where the scrub left it.

### Reduced motion

Light set straight to the true current angle. No settle, no rake, dust still. Copy fully
visible.

The room is still correct for the hour, so the concept survives intact rather than degrading
to nothing — the best available outcome under `accessibility.md`.

## Copy

**The user writes all copy.** This spec defines slots and ships placeholders to be
overwritten.

The section currently carries seven text elements. It goes to four, because the room needs
emptiness to work and `brand-guidelines.md` asks for strong headlines with short supporting
copy.

| Slot | What it is | Length |
| --- | --- | --- |
| `[EYEBROW]` | Chapter furniture, unchanged — currently "Who we are" | 2–3 words |
| `[HEADLINE]` | The thing the light falls on. Affirmative | 5–8 words |
| `[SUPPORT]` | Replaces the four-line stanza and both paragraphs | 12–18 words |
| Indore line | Promoted out of the footnote, with the studio's local clock beside it. Read from `studio.ts`, never typed | fixed |

### What is removed, and why

**The headline turns affirmative.** "Great work doesn't happen in silos" is a negative, and
it was the right copy for a section showing three separate things converge. The room already
shows one place, so the headline can state what is true rather than what is not.

**The four-line "between … between … between" stanza goes.** It was stating spatially what
it could not show. The room shows one space, so the stanza would narrate what is on screen.

**The three discipline labels — Websites, Videos, Designs — go.** This is doc-backed rather
than preference. `website-story.md` requires that "a discipline is claimed and evidenced in
one place, never twice." The hero's rotator claims all three by name and Chapter 6 gives each
one a chapter with real work under it. A third mention here annotates fields that no longer
exist.

**The Indore line stays read from `studio.ts`.** Its existing comment holds: "two copies of
somewhere we might move is two chances to be wrong about it."

## Implementation

### Rendering approach: analytic, not simulated

The room is **computed per pixel in a fragment shader**, not built as 3D geometry with a
shadow map. Shaft polygon, mullion cross, surface falloff and grain are all solved
analytically from the sun vector.

- No meshes, no shadow map, no depth buffer.
- Exact control of every gradient, which matters more here than physical accuracy — this is
  a composition in the brand's palette, not an architectural visualisation.
- Constant cost. A shadow-mapped room would be both slower and worse-looking at this level
  of abstraction.

`three` is used rather than raw WebGL because it is already bundled; that is a code-size
decision, not a capability one.

Scene: `OrthographicCamera` + one `PlaneGeometry(2, 2)` with a `ShaderMaterial`, plus one
`THREE.Points` of ~250 dust particles clipped to the shaft in the shader. Camera parallax is
a UV offset, not a camera move.

### House conventions to follow

`HeroModelScene.tsx` establishes the pattern and it is followed exactly:

- `"use client"`, loaded through `next/dynamic` with `ssr: false`
- `detectWebGLSupport()` before constructing anything, with a `"loading" | "webgl" | "static"`
  mode
- `renderer.setPixelRatio(Math.min(devicePixelRatio, lowPower ? 1.5 : 2))`
- `navigator.deviceMemory < 4` as the low-power signal; `antialias` off when low
- `ResizeObserver` for resize, `IntersectionObserver` for sleep/wake, `visibilitychange` for
  tab hiding
- Full disposal of geometry, materials and renderer on unmount

### Two contexts

The hero's scene sleeps on `IntersectionObserver` when scrolled past, and this one sleeps
when off screen. Both are briefly live at the boundary between them, which is acceptable —
this scene is two draw calls.

### Files

**New**

| Path | Contents |
| --- | --- |
| `src/lib/three/sun.ts` | NOAA solar position. Pure, no DOM, unit-tested |
| `src/lib/three/room-light.ts` | Elevation → colour temperature, intensity, shaft geometry, clamped ground luminance. Pure, unit-tested |
| `src/lib/three/room-shaders.ts` | Vertex and fragment sources for the room and the dust |
| `src/components/three/RoomScene.tsx` | The renderer component |

**Rewritten**

| Path | Change |
| --- | --- |
| `src/components/sections/About.tsx` | Fields, labels and gather removed; room mounted; copy reduced to four slots |

**Deleted**

| Path | Reason |
| --- | --- |
| `src/lib/motion/overlap.ts` | Only `About.tsx` imports it. Confirmed by grep |
| `tests/lib/overlap.test.ts` | Tests the deleted module |

`src/lib/motion/scroll-progress.ts` (`clampProgress`) is used by other modules and stays.

### Static fallback

`accessibility.md` requires all meaningful information live in HTML, and 3D be enhancement
only. All four copy slots are real DOM text in every mode.

Without WebGL the section renders the copy on `--color-surface` with the eyebrow hairline —
the composition without the room. No layout shift: the canvas is absolutely positioned
behind the content and the section's height does not depend on it.

## Testing

Pure modules are unit-tested, matching how `prism-optics.ts` and `process-stations.ts` are
covered.

`tests/lib/sun.test.ts`

- Solar noon at Indore falls between 12:10 and 12:43 IST on every day of the year. The
  bounds are not arbitrary: IST is keyed to 82.5° E, Indore sits at 75.8577° E, and 6.64° of
  longitude at 4 minutes per degree puts mean solar noon 26.6 minutes after 12:00 IST — then
  the equation of time moves it up to ±16 minutes either side. A test asserting a single
  clock time would fail for most of the year
- Elevation is negative through local night and positive through local day
- June and December solstice elevations bracket the year's range
- Azimuth is east of north in the morning and west of north in the afternoon
- The result is identical for the same instant regardless of the host machine's timezone

`tests/lib/room-light.test.ts`

- Colour temperature rises monotonically with elevation up to the 40° plateau
- **Ground luminance holds `--color-ink` at ≥4.5:1 for every minute of a 24-hour sweep** —
  asserted across the range, not only at the endpoints
- Night elevations select the interior source rather than a zero-intensity sun
- Shaft geometry stays on stage at every elevation

`npm run lint`, `npm run typecheck` and `npm test` must pass. Lighthouse performance must
stay above 90 per `CLAUDE.md`.

## Task order

1. **Profile the current section first** and record whether the blended-layer scrub is in
   fact the jank source. This is the one claim in this spec that is not yet verified, and
   the finding is worth keeping either way.
2. `sun.ts` and its tests.
3. `room-light.ts` and its tests, including the contrast sweep.
4. `room-shaders.ts` and `RoomScene.tsx` — the room, static at the current hour.
5. Dust.
6. Entrance timeline and the light-travelling headline wipe.
7. The rake scrub.
8. Pointer parallax.
9. Rewrite `About.tsx` copy to the four slots with placeholders.
10. Delete `overlap.ts` and its test.
11. Reduced-motion and no-WebGL paths.
12. Verify: lint, typecheck, tests, Lighthouse.

## Open items

- **Copy.** All three slots ship as placeholders for the user to write.
- **Window proportion and shaft angle** are composition decisions to be made against the
  real render, not specified here.
- **Dust density** to be tuned by eye; the count above is a starting point.
