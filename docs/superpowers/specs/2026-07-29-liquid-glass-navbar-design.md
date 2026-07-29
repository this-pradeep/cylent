# Liquid Glass Navbar — Design

Status: Approved
Date: 2026-07-29

## Purpose

Replace the current flat, edge-to-edge `backdrop-blur` navbar (`src/components/Nav.astro`) with a floating "liquid glass" pill that mimics Apple's iOS Liquid Glass material: real backdrop refraction/distortion (not just blur), a light-reactive sheen that responds to scroll and cursor movement, and a condensing behavior on scroll. Also closes an existing gap where mobile has no way to reach the nav links at all (they're just `hidden` below `md`).

## Non-goals

- No WebGL/shader-based refraction of the actual page DOM. True pixel-level distortion of arbitrary page content behind a fixed bar would require a live DOM-to-texture capture pipeline (fragile with scrolling/animated content, expensive, and a poor fit for a nav bar). Refraction is instead achieved via an SVG `feDisplacementMap` filter combined with `backdrop-filter`, which distorts the live backdrop natively in the browser's compositor.
- No new animation library. GSAP (already used site-wide for hero, featured-work tilt, and process timeline) drives all nav motion. anime.js is not introduced by this task.
- No full-screen mobile takeover — the mobile menu is a lightweight glass dropdown/sheet, not an overlay with focus trapping.

## Visual material: the glass

- An inline SVG (rendered once, scoped to the nav) defines `<filter id="liquid-glass">`:
  - `feTurbulence` (type `fractalNoise`) generates an organic noise map — this is what makes the distortion read as irregular/liquid rather than a uniform lens warp.
  - `feDisplacementMap` uses that noise map to displace the backdrop pixels showing through the pill.
  - A light `feGaussianBlur` softens the displaced result so it reads as frosted glass rather than a funhouse-mirror effect.
- The pill applies `backdrop-filter: url(#liquid-glass) blur(20px) saturate(1.4)` over a translucent light fill tuned to the site's warm off-white palette (`--color-bg: #FAFAF8`), plus:
  - An inset highlight (soft white inset box-shadow along the top edge) suggesting light catching a physical glass edge.
  - A slow, near-imperceptible rotating conic-gradient sheen around the border radius for a prismatic edge glint. Frozen under reduced motion.
- **Feature detection / fallback:** detect via `CSS.supports('backdrop-filter', 'url(#x) blur(1px)')`. When unsupported (e.g. older Firefox), drop the `url(#liquid-glass)` reference and fall back to plain `blur + saturate` — still reads as premium glass, just without pixel displacement. No user-agent sniffing.

## Layout & structure

- `<header>` is a fixed, centered flex container with margin on all sides (`top-4` / `md:top-6`, horizontal page padding) — not edge-to-edge.
- The `<nav>` inside it is the glass pill itself: `rounded-full`, capped max-width, holding logo, links, and CTA as today.
- **Condense on scroll:** past a small threshold (~24px of scroll), the pill reduces vertical padding and increases fill opacity slightly. Driven by a single scroll listener updating a CSS custom property (`--nav-scroll`, range 0–1) that padding/height/opacity derive from via `clamp()`/`calc()`; GSAP tweens the property for smoothing. Logo remains visible at all sizes (no logo-only collapsed state).

## Interactivity

- **Cursor-reactive highlight:** a soft radial-gradient "light" element inside the pill. On `pointermove` over the nav, relative x/y is computed (same pattern as `tilt-math.ts`) and `gsap.quickTo` smoothly moves the highlight toward the cursor. On `pointerleave`, it eases back to a resting center position.
- **Scroll-reactive distortion:** scroll position/velocity nudges the `feDisplacementMap`'s `scale` attribute and the turbulence's `baseFrequency` within a small range, rAF-throttled (not per-frame) — the refraction ripples slightly more while actively scrolling and settles when scrolling stops.
- **Reduced motion:** `prefersReducedMotion()` (existing helper in `src/scripts/reduced-motion.ts`) disables the cursor-follow lerp (snaps instead of easing) and freezes the turbulence/conic-sheen animation. The glass material itself remains; only continuous motion is suppressed.

## Mobile menu

- A hamburger button appears below the `md` breakpoint, in place of the currently-hidden link list.
- Tapping it opens a glass sheet below the pill (same SVG-filter + backdrop-blur material, rounded rectangle) containing the nav links stacked vertically plus the CTA.
- Opens/closes via a GSAP height+opacity tween. Closes on link click, outside click, or Escape. No overlay dimming or focus trap — lightweight dropdown, not a modal.

## Files

- `src/components/Nav.astro` — restructured markup: floating pill wrapper, inline SVG filter definition, cursor-highlight element, mobile hamburger + sheet markup.
- `src/scripts/liquid-nav.ts` — `initLiquidNav()`: wires scroll-condense, cursor highlight, scroll-driven distortion updates, and mobile menu toggle. Registered in `src/scripts/main.ts` alongside the other `init*` calls, following the existing pattern (`initFeaturedWorkEffects()`, `initProcessTimeline()`, etc.).
- `src/scripts/liquid-nav-math.ts` — pure helper functions extracted for unit testing (e.g. distortion-scale-from-scroll calculation, highlight position clamping), matching the existing convention in `tilt-math.ts` / `process-progress-math.ts`.
- `src/styles/global.css` — pill/glass CSS: custom properties for `--nav-scroll`, conic-sheen keyframes, `@supports`-gated fallback block.

## Testing

- Vitest unit tests for the pure math in `liquid-nav-math.ts` (`tests/liquid-nav-math.test.ts`), following the existing `tests/process-progress-math.test.ts` convention.
- Manual verification in-browser: visual glass/refraction effect, scroll condense behavior, cursor-reactive highlight, and the mobile menu — checked in both a Chromium-based browser and Firefox to confirm the `@supports` fallback path actually engages there.

## Decisions made during brainstorming

- True SVG-filter-based refraction over WebGL/DOM-capture (robustness and simplicity over pixel-perfect shader control).
- Both scroll- and cursor-reactivity (not scroll-only or static).
- Floating pill shape (not full-width bar), condensing on scroll.
- Mobile glass dropdown menu added as part of this task (closes existing gap, not deferred).
- GSAP reused for nav motion rather than introducing anime.js; anime.js remains for a future component where it's a better fit.
