# Homepage Design — "The Reveal" (Cinematic Scroll-Narrative)

## Status

Design approved. Not yet planned or implemented.

## Source of truth

This design is derived from and must remain consistent with:

- `docs/brand-guidelines.md`
- `docs/design-principles.md`
- `docs/motion-system.md`
- `docs/website-story.md`

Any conflict between this document and those four should be resolved in favor of those four.

## Concept summary

The scroll itself is the storyteller. Each of the nine narrative chapters in `website-story.md` is staged as a scene rather than a static section — pacing, layering, and reveals are driven by scroll position (Lenis + ScrollTrigger), not simple fade-ins. This was chosen over two other candidate concepts (an editorial-minimal direction and a pillar-structural direction) because it best expresses Motion System's "Scroll Storytelling" principle and Website Story's instruction that "the story should be experienced, not explained."

Motion intensity: **full cinematic**, including pinned scroll sequences. This carries real performance risk against the Lighthouse >90 requirement in `CLAUDE.md`, so pinning is deliberately limited to the two sections where it earns its cost (Three Pillars, Process) rather than applied everywhere.

Asset status: **no real photography/video exists yet.** Every visual is a placeholder with a documented "asset slot" (aspect ratio, motion behavior, content intent) so real assets can be swapped in later without a redesign.

## Section-by-section design

### 1. First Impression

- **Story objective** (Chapter 1): capture attention immediately; establish "this doesn't feel like a typical agency website."
- **Structure**: fixed-duration intro sequence, not scroll-pinned (per Motion System's "Hero Animation Strategy," which specs this as a timed sequence: preloader exit → headline → supporting content → visual asset → scroll cue).
- **Visual**: headline builds word-by-word rather than all at once. Background is a slow, subtly layered gradient/geometric placeholder — no attempt at photorealism.
- **Motion**: 2–4s total sequence, `expo.out` easing, per Hero Animation Strategy.
- **Copy tone**: single confident statement, no buzzwords, per Chapter 1's explicit "avoid generic hero sections / buzzword-heavy headlines."

### 2. The Problem

- **Story objective** (Chapter 2): visitor recognizes themselves — "that's exactly what we're struggling with."
- **Structure**: non-pinned, scroll-scrubbed.
- **Visual**: fragmented, misaligned placeholder tiles (representing "outdated, inconsistent") drift and settle into alignment as the visitor scrolls — a structural metaphor rather than a literal "bad website" screenshot.
- **Motion**: scroll-scrubbed transform (position/scale), Medium timing band (0.5–0.8s equivalent scrub distance).

### 3. Our Philosophy

- **Story objective** (Chapter 3): "this approach makes sense" — tech + visuals are one process, not separate services.
- **Structure**: non-pinned. Split-layer scene.
- **Visual**: two abstract layers (representing technology and visuals) converge into one as the copy states the thesis.
- **Motion**: layer transition with mask reveal, Slow timing band (0.8–1.5s).

### 4. Three Pillars — centerpiece (fully specced)

- **Story objective** (Chapter 4): "they offer everything needed to create a strong brand presence."
- **Structure**: **pinned**, horizontally-progressing sequence. Order fixed as Build → Capture → Move, matching `website-story.md`. Each pillar occupies the full viewport for its portion of the pin.

**Build (Web Development)**
- Represents (per Brand Guidelines): Precision, Logic, Performance, Innovation.
- Placeholder visual: a grid of rectangular blocks/lines that draw and snap into alignment as the pillar scrolls into view — embodies "grids, structure, clean layouts" without needing real screenshots.
- Motion: grid-transform, systematic movement (per Motion System's per-service spec for Web Development).
- Headline: "Build." Subhead: "We create fast, modern, high-performance digital experiences." Focus points (verbatim from Website Story): Performance, Reliability, Scalability, User experience.
- Asset slot: eventual real content is UI/product screenshots or interactive demo captures, widescreen (16:9 or wider).

**Capture (Photography & Design)**
- Represents: Creativity, Identity, Visual impact, Detail.
- Placeholder visual: a single framed rectangle with a top-to-bottom mask-reveal wipe over an abstract duotone/gradient panel, styled with an editorial caption treatment (like a magazine photo credit) so it reads clearly as "photography goes here," not generic filler.
- Motion: image mask reveal, editorial motion (per Motion System's per-service spec for Photography & Design).
- Headline: "Capture." Subhead: "We create visual identities that communicate personality and quality." Focus points: Branding, Visual storytelling, Creative direction, Design systems.
- Asset slot: eventual real content is portrait-or-square photography/brand identity stills.

**Move (Videography)**
- Represents: Storytelling, Emotion, Movement, Narrative.
- Placeholder visual: a horizontally-panning duotone "filmstrip" panel within a letterboxed (cinematic aspect) frame, animating like a scrub through footage.
- Motion: cinematic transitions, horizontal progression (per Motion System's per-service spec for Videography).
- Headline: "Move." Subhead: "We create stories that connect emotionally." Focus points: Narrative, Motion, Engagement, Brand storytelling.
- Asset slot: eventual real content is video loops or cinemagraphs, 16:9 letterboxed.

### 5. Process

- **Story objective** (Chapter 5): "they have a clear system"; process feels collaborative, not transactional.
- **Structure**: **pinned**, scroll-scrubbed.
- **Visual**: Discover → Plan → Create → Refine → Launch path draws itself progressively as the visitor scrolls.
- **Motion**: ScrollTrigger progressive reveal, Medium timing band.

### 6. Proof

- **Story objective** (Chapter 6): "their work speaks for itself"; quality over quantity.
- **Structure**: non-pinned, scroll-triggered, full-bleed, one project at a time (2–3 projects max — no grid).
- **Visual**: mask transitions between projects. Since imagery is placeholder, copy (Challenge / Process / Solution / Result per Portfolio Philosophy) carries proportionally more weight until real case studies exist.
- **Motion**: mask reveal per project, Slow timing band.

### 7. Attention to Detail

- **Story objective** (Chapter 7): "they genuinely care about quality."
- **Structure**: non-pinned.
- **Visual**: a single scroll-scrubbed close-in zoom on one craft statistic or detail — not a list.
- **Motion**: scroll-scrubbed scale, Fast–Medium timing band.

### 8. The Future

- **Story objective** (Chapter 8): focus shifts from us to them — "what could they create for us?"
- **Structure**: non-pinned.
- **Visual**: layered depth recedes ("camera pulls back"), copy shifts to second-person address.
- **Motion**: layer transition, Slow timing band.

### 9. Call to Action

- **Story objective** (Chapter 9): "I should reach out" — confidence and simplicity, no hard selling.
- **Structure**: non-pinned. Motion deliberately stops here — stillness signals "decision moment," in contrast to the rest of the page.
- **Visual**: one line, one button, nothing else competing.
- **Motion**: single entrance reveal only.

## Visual style

- High-contrast, layered placeholder graphics (gradient/geometric) standing in for photography and video — never generic stock imagery or literal mockups, per Design Principles' Imagery Principles.
- One accent color used sparingly, per Color Principles ("support the brand, not dominate").
- Typography carries proportionally more narrative weight than usual while assets are placeholders — strong headlines, editorial structure (per Typography Principles).
- Grid discipline maintained as a foundation even in placeholder graphics; broken intentionally (e.g. the Problem section's misaligned tiles), never randomly.

## Performance & mobile strategy

Required given the "full cinematic" motion choice, per `CLAUDE.md`'s Lighthouse >90 requirement and Motion System's Principle 4 (Performance First) and Mobile Motion Rules:

- Pinned sequences (Three Pillars, Process) degrade to normal (non-pinned) scroll-triggered reveals below a defined mobile breakpoint — same motion language, no scroll-hijacking on small screens.
- Placeholder visuals are CSS/SVG-driven where possible rather than image/video-based, so the heaviest performance cost (real video) isn't paid until real footage exists to justify it.
- `prefers-reduced-motion: reduce` disables both pinned sequences entirely and falls back to simple, accessible reveals, per Motion System's Accessibility section.

## Explicitly out of scope for this design

- No backend, database, CMS, auth, or API routes (static site, per `CLAUDE.md`).
- No real photography/video asset sourcing — that's a separate content workstream. This design only defines the slots.
- No implementation plan or code yet — this document is design-only.
