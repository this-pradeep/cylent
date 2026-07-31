# Liquid Glass Navbar — Design

## Status

Design approved. Not yet planned or implemented.

## Source of truth

This design is derived from and must remain consistent with:

- `docs/brand-guidelines.md`
- `docs/design-principles.md`
- `docs/motion-system.md`
- `docs/website-story.md`

Any conflict between this document and those four should be resolved in favor of those four.

## Purpose

The homepage currently has no navigation bar. This adds one, styled after a "liquid glass" material referenced from creativeglu.ai/home — a floating, translucent pill with real backdrop refraction (not just blur), a light-reactive cursor highlight, and a condensing behavior on scroll.

## Relationship to prior art

An earlier, more elaborate liquid-glass navbar was designed and implemented against this project's previous Astro-based codebase (now fully superseded by the Next.js rebuild — see `docs/superpowers/plans/2026-07-30-homepage-cinematic-scroll-narrative.md`). That branch (`worktree-liquid-glass-navbar`) is explicitly left alone and not merged or ported from. This design reuses only the *validated technical concept* from that earlier work — SVG-filter-based backdrop refraction rather than WebGL — rebuilt from scratch for the current React/Tailwind stack, with a lighter palette and a deliberately less intense distortion effect than both that prior implementation and the creativeglu.ai reference.

## Divergence from the creativeglu.ai reference

The reference navbar is full-width and flush with the top edge, dark glass regardless of page background, and uses a bold, chromatic-aberration-heavy distortion (visibly doubled, RGB-split text where the background bleeds through). Per explicit decisions made during design review, this build diverges on all three:

- **Shape:** floating centered pill with margin on all sides, not edge-to-edge — closer to `design-principles.md`'s general preference for restraint and breathing room over the reference's full-bleed bar.
- **Tone:** light glass built from this site's existing `--color-surface`/`--color-ink` tokens, not dark glass, so the nav reads as part of this site rather than an unrelated dark UI dropped onto a light page.
- **Intensity:** subtle, organic backdrop warping only — no RGB channel splitting or glitch-style doubling. `brand-guidelines.md`'s aesthetic keywords ("elegant," avoid "overdecorated") take precedence over literal fidelity to the reference's boldness.

The core "liquid glass" identity — real pixel-level backdrop distortion via an SVG filter, not just `backdrop-filter: blur()` — is preserved, since that distortion is what makes the effect read as "liquid glass" rather than plain glassmorphism.

## Visual material: the glass

- An inline SVG (rendered once, scoped to the nav) defines `<filter id="liquid-glass-nav">`:
  - `feTurbulence` (type `fractalNoise`, low `baseFrequency`, e.g. `0.008`) generates a gentle, organic noise map.
  - `feDisplacementMap` uses that noise map to displace the backdrop pixels showing through the pill, at a small `scale` (subtle warping, not a funhouse-mirror effect).
  - A light `feGaussianBlur` softens the displaced result so it reads as frosted glass.
- No color-channel splitting (`feColorMatrix`/multi-channel displacement) — this is what would produce the reference's chromatic-aberration look, deliberately excluded per the "toned down" decision.
- The pill applies `backdrop-filter: url(#liquid-glass-nav) blur(20px) saturate(1.3)` over a translucent fill built from `--color-surface` at roughly 78% opacity, plus a soft white inset highlight along the top edge (a 1px inset box-shadow) suggesting a physical glass edge, per `design-principles.md` Principle 7 ("Depth Without Clutter" — layering and light, not heavy shadows or gradients).
- **Feature detection:** `CSS.supports('backdrop-filter', 'url(#liquid-glass-nav) blur(1px)')`. Where unsupported, drop the `url(#liquid-glass-nav)` reference and fall back to plain `blur() saturate()` — still reads as glass, without the pixel displacement. No user-agent sniffing.

## Layout & structure

- A `<header>` fixed at `top-4` (`md:top-6`), horizontally centered, with page-edge margin on small screens — a floating pill, not edge-to-edge.
- Inside it, the pill itself (`rounded-full`, capped max-width) holds, left to right: logo, three service links, Contact button.
- **Logo:** "Cylent" wordmark, far left, links to `/` (top of homepage).
- **Service links:** Build, Capture, Move — real `<a href="/build">`, `<a href="/capture">`, `<a href="/move">` links. These pages do not exist yet; that is out of scope for this task and will 404 until built separately. Labels and order match the Three Pillars section (`website-story.md` Chapter 4) exactly.
- **Contact:** a pill-style button, right-aligned, that smooth-scrolls to the existing `CallToAction` section on the homepage (`src/components/sections/CallToAction.tsx`) rather than linking elsewhere — that section already has the live `mailto:` action.

## Interactivity

- **Cursor-reactive highlight:** a soft radial-gradient "light" element inside the pill. On `pointermove` over the nav, relative x/y is computed and a GSAP `quickTo` smoothly moves the highlight toward the cursor; on `pointerleave`, it eases back to a resting center position. This is an explicitly approved pattern under `motion-system.md`'s Hover System ("cursor-follow effects").
- **Scroll-condense:** past a small scroll threshold (~24px), the pill reduces vertical padding and increases fill opacity slightly. A pure helper function maps scroll position to a 0–1 condense progress value (unit tested, following this codebase's existing `src/lib/motion/scroll-progress.ts` convention); a scroll listener updates a CSS custom property (`--nav-condense`) that padding/opacity derive from via `calc()`, tweened through GSAP for smoothing.
- **Reduced motion:** disables the cursor-follow lerp (the highlight simply doesn't track the pointer) and freezes any continuous animation. The glass material and scroll-condense state remain — only continuous/pointer-driven motion is suppressed, consistent with how every other section on this site already handles `prefers-reduced-motion`.

## Mobile

- Below `md`, the three service links and Contact button are replaced by a hamburger toggle.
- Tapping it opens a glass dropdown sheet directly below the pill (same SVG-filter + backdrop-blur material, rounded rectangle) containing the three links stacked vertically, plus Contact.
- Opens/closes via a GSAP height+opacity tween. Closes on link click, outside click, or Escape.

## Files

- `src/components/Nav.tsx` — pill markup, inline SVG filter definition, cursor-highlight element, service links, Contact button, mobile hamburger + sheet.
- `src/lib/motion/nav-scroll.ts` — pure helper(s) for scroll-condense progress, unit tested (e.g. `getCondenseProgress(scrollY: number, thresholdPx: number): number`).
- `src/app/layout.tsx` — modified to render `<Nav />` above `{children}`.

## Testing

- Vitest unit tests for `getCondenseProgress` in `tests/lib/nav-scroll.test.ts`, following this project's existing `tests/lib/*.test.ts` convention.
- `npm run typecheck` and `npm run build` (static export) must stay green.
- Manual verification: glass/refraction effect renders, scroll-condense behavior, cursor-reactive highlight, mobile hamburger + sheet, and the `@supports` fallback path. This environment has no browser tool available this session — manual verification will rely on markup/asset checks via `curl` against the dev server, with the visual/interactive behavior flagged as needing a real-browser check before shipping, same caveat as the rest of this homepage build.

## Explicitly out of scope for this design

- The `/build`, `/capture`, `/move` pages the service links point to — a separate future task.
- Any change to the `worktree-liquid-glass-navbar` branch or its Astro-based implementation — left untouched.
- Full-width/edge-to-edge bar shape, dark glass tone, and chromatic-aberration-style distortion — all explicitly declined in favor of the floating/light/subtle treatment described above.
