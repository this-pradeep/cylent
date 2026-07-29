# Liquid Glass Navbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat `backdrop-blur` navbar with a floating "liquid glass" pill that has real SVG-filter-based backdrop refraction, a scroll- and cursor-reactive sheen, a scroll-condense behavior, and a glass mobile dropdown menu — per `docs/superpowers/specs/2026-07-29-liquid-glass-navbar-design.md`.

**Architecture:** An inline SVG `<filter>` (feTurbulence → feDisplacementMap → feGaussianBlur) is referenced via `backdrop-filter: url(#liquid-glass) ...` on a floating pill-shaped `<nav>`, distorting whatever page content sits behind it. A single TypeScript module (`liquid-nav.ts`, following the existing `init*()`-per-module pattern in `main.ts`) drives all motion with GSAP: tweening a `--nav-scroll` CSS custom property for the condense effect, tweening the SVG filter's `scale`/`baseFrequency` attributes for scroll-reactive distortion, tweening `--mx`/`--my` custom properties for a cursor-following highlight, and handling the mobile menu's open/close animation. All pure numeric logic (progress clamping, delta-to-scale mapping) lives in a separate, unit-tested math module, matching the `tilt-math.ts` / `process-progress-math.ts` convention already used in this codebase.

**Tech Stack:** Astro component (`.astro`), TypeScript, Tailwind CSS v4 (utility classes) + hand-written CSS in `global.css` for the glass material, GSAP (already a dependency — no new animation library), Vitest for unit tests.

## Global Constraints

- No new animation library — all nav motion uses GSAP, already used site-wide. anime.js is not introduced by this work.
- No WebGL/shader/DOM-capture refraction — distortion comes only from the SVG `feDisplacementMap` + `backdrop-filter` technique.
- Fallback for browsers without support for `backdrop-filter: url(...)` is feature-detected via `CSS.supports(...)` in JS (no user-agent sniffing), toggling a `no-glass-filter` class on `<html>`.
- Every piece of nav motion must respect `prefers-reduced-motion`, using the existing `prefersReducedMotion()` helper in `src/scripts/reduced-motion.ts` for JS-driven motion, and the existing `@media (prefers-reduced-motion: reduce)` block in `src/styles/global.css` for CSS-driven motion.
- New client behavior is a single `init*()` function registered in `src/scripts/main.ts`, matching the existing pattern (`initHeroAnimation()`, `initFeaturedWorkEffects()`, `initProcessTimeline()`).
- Pure/testable logic is extracted into its own module and unit-tested with Vitest, matching `tilt-math.ts` / `process-progress-math.ts` and their corresponding files in `tests/`.
- `npx astro check` and `npm run build` must pass with zero errors at the end of every task that touches build-affecting files.
- Git commits in this project must **not** include a "Co-Authored-By: Claude" (or similar) trailer.

---

## Task 1: Pure math helpers for scroll progress, distortion, and highlight position

**Files:**
- Create: `src/scripts/liquid-nav-math.ts`
- Test: `tests/liquid-nav-math.test.ts`

**Interfaces:**
- Produces:
  - `clamp(value: number, min: number, max: number): number`
  - `navScrollProgress(scrollY: number, thresholdPx: number): number` — returns a 0–1 value for how "condensed" the pill should be.
  - `highlightPercent(rel: number): number` — converts a 0–1 relative pointer position into a 0–100 percentage for CSS.
  - `scaledByDelta(deltaY: number, base: number, max: number, sensitivity: number): number` — maps a scroll-delta magnitude onto a `[base, max]` range, used for both the SVG filter's `scale` and `baseFrequency`.

- [ ] **Step 1: Write the failing tests**

Create `tests/liquid-nav-math.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { clamp, navScrollProgress, highlightPercent, scaledByDelta } from '../src/scripts/liquid-nav-math';

describe('clamp', () => {
  it('returns the value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to the minimum', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps to the maximum', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('navScrollProgress', () => {
  it('is 0 at the top of the page', () => {
    expect(navScrollProgress(0, 24)).toBe(0);
  });

  it('is 1 at or past the threshold', () => {
    expect(navScrollProgress(24, 24)).toBe(1);
    expect(navScrollProgress(500, 24)).toBe(1);
  });

  it('is proportional between 0 and the threshold', () => {
    expect(navScrollProgress(12, 24)).toBe(0.5);
  });

  it('treats a non-positive threshold as an on/off switch', () => {
    expect(navScrollProgress(0, 0)).toBe(0);
    expect(navScrollProgress(1, 0)).toBe(1);
  });
});

describe('highlightPercent', () => {
  it('converts a 0-1 relative position to a 0-100 percent', () => {
    expect(highlightPercent(0)).toBe(0);
    expect(highlightPercent(0.5)).toBe(50);
    expect(highlightPercent(1)).toBe(100);
  });

  it('clamps out-of-range input', () => {
    expect(highlightPercent(-0.2)).toBe(0);
    expect(highlightPercent(1.2)).toBe(100);
  });
});

describe('scaledByDelta', () => {
  it('returns the base value when delta is 0', () => {
    expect(scaledByDelta(0, 36, 60, 0.6)).toBe(36);
  });

  it('scales up with the magnitude of delta, up to max', () => {
    expect(scaledByDelta(10, 36, 60, 0.6)).toBe(42);
  });

  it('treats negative delta the same as positive (uses magnitude)', () => {
    expect(scaledByDelta(-10, 36, 60, 0.6)).toBe(42);
  });

  it('never exceeds max regardless of delta size', () => {
    expect(scaledByDelta(1000, 36, 60, 0.6)).toBe(60);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/liquid-nav-math.test.ts`
Expected: FAIL — `src/scripts/liquid-nav-math.ts` does not exist yet.

- [ ] **Step 3: Implement the math module**

Create `src/scripts/liquid-nav-math.ts`:

```ts
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function navScrollProgress(scrollY: number, thresholdPx: number): number {
  if (thresholdPx <= 0) return scrollY > 0 ? 1 : 0;
  return clamp(scrollY / thresholdPx, 0, 1);
}

export function highlightPercent(rel: number): number {
  return clamp(rel, 0, 1) * 100;
}

export function scaledByDelta(deltaY: number, base: number, max: number, sensitivity: number): number {
  return base + clamp(Math.abs(deltaY) * sensitivity, 0, max - base);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/liquid-nav-math.test.ts`
Expected: PASS (13 tests)

- [ ] **Step 5: Commit**

```bash
git add src/scripts/liquid-nav-math.ts tests/liquid-nav-math.test.ts
git commit -m "feat: add liquid nav math helpers"
```

---

## Task 2: Floating glass pill markup and CSS

**Files:**
- Modify: `src/components/Nav.astro` (full rewrite)
- Modify: `src/styles/global.css` (append glass-material rules)

**Interfaces:**
- Produces DOM hooks consumed by Task 3 and Task 4:
  - `[data-liquid-nav-wrap]` — positioning wrapper for the pill + mobile sheet.
  - `[data-liquid-nav]` — the pill `<nav>` element itself (target for `--nav-scroll`, `--mx`, `--my`, and the `is-pointer-active` class).
  - `[data-liquid-highlight]` — the cursor-highlight overlay div.
  - `[data-liquid-turbulence]` — the SVG `<feTurbulence>` element (id-free; selected via attribute).
  - `[data-liquid-displacement]` — the SVG `<feDisplacementMap>` element.
  - `[data-nav-toggle]` — the mobile hamburger `<button>`.
  - `#mobile-nav-menu` / `[data-nav-menu]` — the mobile glass sheet.
- Produces CSS classes/custom properties consumed by Task 3 and Task 4: `.liquid-pill`, `.liquid-pill__highlight`, `.liquid-sheet`, `.no-glass-filter`, `--nav-scroll`, `--mx`, `--my`, `--sheen-angle`.

- [ ] **Step 1: Rewrite the Nav component**

Replace the full contents of `src/components/Nav.astro`:

```astro
---
const links = [
  { href: '#services', label: 'Services' },
  { href: '#work', label: 'Work' },
  { href: '#process', label: 'Process' },
  { href: '#contact', label: 'Contact' },
];
---
<header class="fixed inset-x-0 top-4 md:top-6 z-50 flex justify-center px-4">
  <svg aria-hidden="true" focusable="false" class="absolute h-0 w-0 overflow-hidden">
    <filter id="liquid-glass" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.012"
        numOctaves="2"
        seed="7"
        result="liquid-noise"
        data-liquid-turbulence
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="liquid-noise"
        scale="36"
        xChannelSelector="R"
        yChannelSelector="G"
        data-liquid-displacement
      />
      <feGaussianBlur stdDeviation="0.35" />
    </filter>
  </svg>

  <div class="relative w-full max-w-[1000px]" data-liquid-nav-wrap>
    <nav class="liquid-pill" data-liquid-nav>
      <div class="liquid-pill__highlight" data-liquid-highlight aria-hidden="true"></div>

      <a href="#top" class="relative text-xl font-medium tracking-tight">Cylent</a>

      <ul class="relative hidden md:flex gap-8 text-sm text-ink/70">
        {links.map((link) => (
          <li><a href={link.href} class="hover:text-ink transition-colors">{link.label}</a></li>
        ))}
      </ul>

      <a
        href="#contact"
        class="relative hidden md:inline-block rounded-full bg-ink text-bg text-sm px-5 py-2 hover:bg-accent transition-colors"
      >
        Start a project
      </a>

      <button
        type="button"
        class="relative md:hidden flex h-9 w-9 items-center justify-center rounded-full text-ink"
        data-nav-toggle
        aria-expanded="false"
        aria-controls="mobile-nav-menu"
      >
        <span class="sr-only">Toggle menu</span>
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true">
          <path d="M0 1h18M0 6h18M0 11h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
    </nav>

    <div id="mobile-nav-menu" class="liquid-sheet md:hidden" data-nav-menu hidden>
      <ul class="flex flex-col gap-1 text-sm text-ink/70">
        {links.map((link) => (
          <li><a href={link.href} class="block py-2 hover:text-ink transition-colors">{link.label}</a></li>
        ))}
      </ul>
      <a
        href="#contact"
        class="mt-2 block text-center rounded-full bg-ink text-bg text-sm px-5 py-2.5 hover:bg-accent transition-colors"
      >
        Start a project
      </a>
    </div>
  </div>
</header>
```

- [ ] **Step 2: Append the glass-material CSS**

Add the following to the end of `src/styles/global.css` (after the existing `@media (prefers-reduced-motion: reduce)` block):

```css
@property --sheen-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

.liquid-pill {
  --nav-scroll: 0;
  --mx: 50%;
  --my: 50%;
  --sheen-angle: 0deg;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: calc(5rem - 1.25rem * var(--nav-scroll));
  padding-inline: 1.5rem;
  border-radius: 9999px;
  border: 1px solid transparent;
  background:
    color-mix(in srgb, white calc(38% + 14% * var(--nav-scroll)), transparent) padding-box,
    conic-gradient(from var(--sheen-angle), transparent, rgba(255, 255, 255, 0.5), transparent 30%) border-box;
  backdrop-filter: url(#liquid-glass) blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 8px 30px -12px rgba(20, 20, 20, 0.25);
}

.no-glass-filter .liquid-pill,
.no-glass-filter .liquid-sheet {
  backdrop-filter: blur(20px) saturate(1.4);
}

@media (prefers-reduced-motion: no-preference) {
  .liquid-pill {
    animation: liquid-sheen-spin 14s linear infinite;
  }
}

@keyframes liquid-sheen-spin {
  to {
    --sheen-angle: 360deg;
  }
}

.liquid-pill__highlight {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: radial-gradient(140px circle at var(--mx) var(--my), rgba(255, 255, 255, 0.55), transparent 70%);
  mix-blend-mode: screen;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.liquid-pill.is-pointer-active .liquid-pill__highlight {
  opacity: 1;
}

.liquid-sheet {
  position: absolute;
  top: calc(100% + 0.75rem);
  left: 0;
  right: 0;
  border-radius: 1.5rem;
  padding: 1rem 1.25rem 1.25rem;
  background: color-mix(in srgb, white 55%, transparent);
  backdrop-filter: url(#liquid-glass) blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 20px 40px -20px rgba(20, 20, 20, 0.35);
  overflow: hidden;
}
```

- [ ] **Step 3: Verify the component compiles**

Run: `npx astro check`
Expected: 0 errors (existing pre-existing errors, if any, are unrelated and unchanged).

- [ ] **Step 4: Manual smoke check**

```bash
npx astro dev --background
```

Open the site and confirm: a floating rounded pill appears near the top of the page with a visibly blurred/refracted background, a hamburger icon shows in place of the nav links below the `md` breakpoint, and no console errors appear. The pill will not yet condense on scroll, react to the cursor, or open the mobile menu — that's expected, it's wired in later tasks.

```bash
npx astro dev stop
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Nav.astro src/styles/global.css
git commit -m "feat: rebuild navbar as a floating liquid glass pill"
```

---

## Task 3: Scroll-condense, scroll-reactive distortion, and cursor-reactive highlight

**Files:**
- Create: `src/scripts/liquid-nav.ts`
- Modify: `src/scripts/main.ts`

**Interfaces:**
- Consumes: `navScrollProgress`, `highlightPercent`, `scaledByDelta` from `src/scripts/liquid-nav-math.ts` (Task 1); `prefersReducedMotion()` from `src/scripts/reduced-motion.ts`; DOM hooks `[data-liquid-nav]`, `[data-liquid-turbulence]`, `[data-liquid-displacement]` from `src/components/Nav.astro` (Task 2).
- Produces: `initLiquidNav(): void`, exported from `src/scripts/liquid-nav.ts`, registered in `main.ts`. (Task 4 will extend this same file with mobile-menu behavior.)

- [ ] **Step 1: Create the liquid-nav behavior module**

Create `src/scripts/liquid-nav.ts`:

```ts
import gsap from 'gsap';
import { prefersReducedMotion } from './reduced-motion';
import { navScrollProgress, highlightPercent, scaledByDelta } from './liquid-nav-math';

const CONDENSE_THRESHOLD_PX = 24;

const DISTORTION_BASE_SCALE = 36;
const DISTORTION_MAX_SCALE = 60;
const DISTORTION_SENSITIVITY = 0.6;

const TURBULENCE_BASE_FREQ = 0.012;
const TURBULENCE_MAX_FREQ = 0.02;
const TURBULENCE_SENSITIVITY = 0.0003;

const IDLE_DECAY_MS = 180;

function supportsGlassFilter(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('backdrop-filter', 'url(#liquid-glass) blur(20px) saturate(1.4)')
  );
}

function initScrollCondense(nav: HTMLElement): void {
  const reduced = prefersReducedMotion();

  const applyProgress = (progress: number) => {
    if (reduced) {
      nav.style.setProperty('--nav-scroll', String(progress));
      return;
    }
    gsap.to(nav, {
      '--nav-scroll': progress,
      duration: 0.25,
      ease: 'power2.out',
      overwrite: true,
    });
  };

  applyProgress(navScrollProgress(window.scrollY, CONDENSE_THRESHOLD_PX));

  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        applyProgress(navScrollProgress(window.scrollY, CONDENSE_THRESHOLD_PX));
        ticking = false;
      });
    },
    { passive: true }
  );
}

function initScrollDistortion(
  turbulence: SVGFETurbulenceElement | null,
  displacement: SVGFEDisplacementMapElement | null
): void {
  if (!turbulence || !displacement || prefersReducedMotion()) return;

  let lastY = window.scrollY;
  let ticking = false;
  let decayTimer: ReturnType<typeof setTimeout> | undefined;

  const settle = () => {
    gsap.to(displacement, {
      attr: { scale: DISTORTION_BASE_SCALE },
      duration: 0.5,
      ease: 'power2.out',
      overwrite: true,
    });
    gsap.to(turbulence, {
      attr: { baseFrequency: TURBULENCE_BASE_FREQ },
      duration: 0.5,
      ease: 'power2.out',
      overwrite: true,
    });
  };

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const deltaY = currentY - lastY;
        lastY = currentY;

        gsap.to(displacement, {
          attr: { scale: scaledByDelta(deltaY, DISTORTION_BASE_SCALE, DISTORTION_MAX_SCALE, DISTORTION_SENSITIVITY) },
          duration: 0.4,
          ease: 'power2.out',
          overwrite: true,
        });
        gsap.to(turbulence, {
          attr: {
            baseFrequency: scaledByDelta(
              deltaY,
              TURBULENCE_BASE_FREQ,
              TURBULENCE_MAX_FREQ,
              TURBULENCE_SENSITIVITY
            ),
          },
          duration: 0.4,
          ease: 'power2.out',
          overwrite: true,
        });

        clearTimeout(decayTimer);
        decayTimer = setTimeout(settle, IDLE_DECAY_MS);

        ticking = false;
      });
    },
    { passive: true }
  );
}

function initCursorHighlight(nav: HTMLElement): void {
  const reduced = prefersReducedMotion();

  const moveHighlight = (mxPercent: number, myPercent: number) => {
    if (reduced) {
      nav.style.setProperty('--mx', `${mxPercent}%`);
      nav.style.setProperty('--my', `${myPercent}%`);
      return;
    }
    gsap.to(nav, {
      '--mx': `${mxPercent}%`,
      '--my': `${myPercent}%`,
      duration: 0.4,
      ease: 'power3',
      overwrite: true,
    });
  };

  nav.addEventListener('pointermove', (event) => {
    const rect = nav.getBoundingClientRect();
    const relX = (event.clientX - rect.left) / rect.width;
    const relY = (event.clientY - rect.top) / rect.height;
    moveHighlight(highlightPercent(relX), highlightPercent(relY));
    nav.classList.add('is-pointer-active');
  });

  nav.addEventListener('pointerleave', () => {
    moveHighlight(50, 50);
    nav.classList.remove('is-pointer-active');
  });
}

export function initLiquidNav(): void {
  const nav = document.querySelector<HTMLElement>('[data-liquid-nav]');
  if (!nav) return;

  if (!supportsGlassFilter()) {
    document.documentElement.classList.add('no-glass-filter');
  }

  const turbulence = document.querySelector<SVGFETurbulenceElement>('[data-liquid-turbulence]');
  const displacement = document.querySelector<SVGFEDisplacementMapElement>('[data-liquid-displacement]');

  initScrollCondense(nav);
  initScrollDistortion(turbulence, displacement);
  initCursorHighlight(nav);
}
```

- [ ] **Step 2: Register it in `main.ts`**

Replace the full contents of `src/scripts/main.ts`:

```ts
import { initSmoothScroll } from './lenis-setup';
import { initHeroAnimation } from './hero-animation';
import { initFeaturedWorkEffects } from './featured-work-effects';
import { initProcessTimeline } from './process-timeline';
import { initLiquidNav } from './liquid-nav';

initSmoothScroll();
initHeroAnimation();
initFeaturedWorkEffects();
initProcessTimeline();
initLiquidNav();
```

- [ ] **Step 3: Type-check**

Run: `npx astro check`
Expected: 0 errors.

- [ ] **Step 4: Manual verification**

```bash
npx astro dev --background
```

Open the site and confirm:
- Scrolling down ~24px or more visibly condenses the pill (shorter, slightly more opaque).
- Scrolling causes the glass distortion to ripple slightly, settling back to its resting look ~200ms after you stop scrolling.
- Moving the cursor across the pill produces a soft light highlight that follows the pointer; it fades out when the cursor leaves.

```bash
npx astro dev stop
```

- [ ] **Step 5: Commit**

```bash
git add src/scripts/liquid-nav.ts src/scripts/main.ts
git commit -m "feat: add scroll-condense, scroll-reactive distortion, and cursor highlight to nav"
```

---

## Task 4: Mobile glass menu

**Files:**
- Modify: `src/scripts/liquid-nav.ts` (full rewrite, extending Task 3's version)

**Interfaces:**
- Consumes: `[data-liquid-nav-wrap]`, `[data-nav-toggle]`, `[data-nav-menu]` from `src/components/Nav.astro` (Task 2); `initLiquidNav()` body from Task 3, extended here.
- Produces: mobile menu open/close behavior wired into the same `initLiquidNav()` entry point — no change to `main.ts` (already registered in Task 3).

- [ ] **Step 1: Add the mobile menu behavior**

Replace the full contents of `src/scripts/liquid-nav.ts`:

```ts
import gsap from 'gsap';
import { prefersReducedMotion } from './reduced-motion';
import { navScrollProgress, highlightPercent, scaledByDelta } from './liquid-nav-math';

const CONDENSE_THRESHOLD_PX = 24;

const DISTORTION_BASE_SCALE = 36;
const DISTORTION_MAX_SCALE = 60;
const DISTORTION_SENSITIVITY = 0.6;

const TURBULENCE_BASE_FREQ = 0.012;
const TURBULENCE_MAX_FREQ = 0.02;
const TURBULENCE_SENSITIVITY = 0.0003;

const IDLE_DECAY_MS = 180;

function supportsGlassFilter(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('backdrop-filter', 'url(#liquid-glass) blur(20px) saturate(1.4)')
  );
}

function initScrollCondense(nav: HTMLElement): void {
  const reduced = prefersReducedMotion();

  const applyProgress = (progress: number) => {
    if (reduced) {
      nav.style.setProperty('--nav-scroll', String(progress));
      return;
    }
    gsap.to(nav, {
      '--nav-scroll': progress,
      duration: 0.25,
      ease: 'power2.out',
      overwrite: true,
    });
  };

  applyProgress(navScrollProgress(window.scrollY, CONDENSE_THRESHOLD_PX));

  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        applyProgress(navScrollProgress(window.scrollY, CONDENSE_THRESHOLD_PX));
        ticking = false;
      });
    },
    { passive: true }
  );
}

function initScrollDistortion(
  turbulence: SVGFETurbulenceElement | null,
  displacement: SVGFEDisplacementMapElement | null
): void {
  if (!turbulence || !displacement || prefersReducedMotion()) return;

  let lastY = window.scrollY;
  let ticking = false;
  let decayTimer: ReturnType<typeof setTimeout> | undefined;

  const settle = () => {
    gsap.to(displacement, {
      attr: { scale: DISTORTION_BASE_SCALE },
      duration: 0.5,
      ease: 'power2.out',
      overwrite: true,
    });
    gsap.to(turbulence, {
      attr: { baseFrequency: TURBULENCE_BASE_FREQ },
      duration: 0.5,
      ease: 'power2.out',
      overwrite: true,
    });
  };

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const deltaY = currentY - lastY;
        lastY = currentY;

        gsap.to(displacement, {
          attr: { scale: scaledByDelta(deltaY, DISTORTION_BASE_SCALE, DISTORTION_MAX_SCALE, DISTORTION_SENSITIVITY) },
          duration: 0.4,
          ease: 'power2.out',
          overwrite: true,
        });
        gsap.to(turbulence, {
          attr: {
            baseFrequency: scaledByDelta(
              deltaY,
              TURBULENCE_BASE_FREQ,
              TURBULENCE_MAX_FREQ,
              TURBULENCE_SENSITIVITY
            ),
          },
          duration: 0.4,
          ease: 'power2.out',
          overwrite: true,
        });

        clearTimeout(decayTimer);
        decayTimer = setTimeout(settle, IDLE_DECAY_MS);

        ticking = false;
      });
    },
    { passive: true }
  );
}

function initCursorHighlight(nav: HTMLElement): void {
  const reduced = prefersReducedMotion();

  const moveHighlight = (mxPercent: number, myPercent: number) => {
    if (reduced) {
      nav.style.setProperty('--mx', `${mxPercent}%`);
      nav.style.setProperty('--my', `${myPercent}%`);
      return;
    }
    gsap.to(nav, {
      '--mx': `${mxPercent}%`,
      '--my': `${myPercent}%`,
      duration: 0.4,
      ease: 'power3',
      overwrite: true,
    });
  };

  nav.addEventListener('pointermove', (event) => {
    const rect = nav.getBoundingClientRect();
    const relX = (event.clientX - rect.left) / rect.width;
    const relY = (event.clientY - rect.top) / rect.height;
    moveHighlight(highlightPercent(relX), highlightPercent(relY));
    nav.classList.add('is-pointer-active');
  });

  nav.addEventListener('pointerleave', () => {
    moveHighlight(50, 50);
    nav.classList.remove('is-pointer-active');
  });
}

function initMobileMenu(navWrap: HTMLElement): void {
  const toggle = navWrap.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const menu = navWrap.querySelector<HTMLElement>('[data-nav-menu]');
  if (!toggle || !menu) return;

  let isOpen = false;

  const openMenu = () => {
    menu.hidden = false;
    const targetHeight = menu.scrollHeight;
    gsap.fromTo(
      menu,
      { height: 0, autoAlpha: 0 },
      {
        height: targetHeight,
        autoAlpha: 1,
        duration: 0.35,
        ease: 'power2.out',
        onComplete: () => {
          menu.style.height = 'auto';
        },
      }
    );
    toggle.setAttribute('aria-expanded', 'true');
    isOpen = true;
  };

  const closeMenu = () => {
    const currentHeight = menu.scrollHeight;
    gsap.fromTo(
      menu,
      { height: currentHeight, autoAlpha: 1 },
      {
        height: 0,
        autoAlpha: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          menu.hidden = true;
          menu.style.height = '';
        },
      }
    );
    toggle.setAttribute('aria-expanded', 'false');
    isOpen = false;
  };

  toggle.addEventListener('click', () => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (isOpen) closeMenu();
    });
  });

  document.addEventListener('click', (event) => {
    if (!isOpen) return;
    const target = event.target as Node;
    if (menu.contains(target) || toggle.contains(target)) return;
    closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) closeMenu();
  });
}

export function initLiquidNav(): void {
  const nav = document.querySelector<HTMLElement>('[data-liquid-nav]');
  const navWrap = document.querySelector<HTMLElement>('[data-liquid-nav-wrap]');
  if (!nav || !navWrap) return;

  if (!supportsGlassFilter()) {
    document.documentElement.classList.add('no-glass-filter');
  }

  const turbulence = document.querySelector<SVGFETurbulenceElement>('[data-liquid-turbulence]');
  const displacement = document.querySelector<SVGFEDisplacementMapElement>('[data-liquid-displacement]');

  initScrollCondense(nav);
  initScrollDistortion(turbulence, displacement);
  initCursorHighlight(nav);
  initMobileMenu(navWrap);
}
```

- [ ] **Step 2: Type-check**

Run: `npx astro check`
Expected: 0 errors.

- [ ] **Step 3: Manual verification**

```bash
npx astro dev --background
```

Resize the browser (or use device toolbar) to a mobile width and confirm:
- The hamburger button opens a glass dropdown sheet below the pill, with the same distorted-glass look, containing the nav links and the CTA.
- Clicking a link inside the sheet closes it.
- Clicking outside the sheet, or pressing Escape, closes it.
- Clicking the hamburger again toggles it closed.

```bash
npx astro dev stop
```

- [ ] **Step 4: Commit**

```bash
git add src/scripts/liquid-nav.ts
git commit -m "feat: add glass mobile menu to nav"
```

---

## Task 5: Reduced-motion gating for the mobile menu, and cross-browser verification

**Files:**
- Modify: `src/scripts/liquid-nav.ts` (only the `initMobileMenu` function changes)

**Interfaces:**
- Consumes: `prefersReducedMotion()` (already imported in this file since Task 3).
- Produces: no new exports — `initLiquidNav()`'s public signature is unchanged.

- [ ] **Step 1: Gate the mobile menu animation behind reduced motion**

In `src/scripts/liquid-nav.ts`, replace the `initMobileMenu` function with:

```ts
function initMobileMenu(navWrap: HTMLElement): void {
  const toggle = navWrap.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const menu = navWrap.querySelector<HTMLElement>('[data-nav-menu]');
  if (!toggle || !menu) return;

  const reduced = prefersReducedMotion();
  let isOpen = false;

  const openMenu = () => {
    menu.hidden = false;
    if (reduced) {
      menu.style.height = 'auto';
      gsap.set(menu, { autoAlpha: 1 });
    } else {
      const targetHeight = menu.scrollHeight;
      gsap.fromTo(
        menu,
        { height: 0, autoAlpha: 0 },
        {
          height: targetHeight,
          autoAlpha: 1,
          duration: 0.35,
          ease: 'power2.out',
          onComplete: () => {
            menu.style.height = 'auto';
          },
        }
      );
    }
    toggle.setAttribute('aria-expanded', 'true');
    isOpen = true;
  };

  const closeMenu = () => {
    if (reduced) {
      menu.hidden = true;
      gsap.set(menu, { autoAlpha: 0, height: '' });
    } else {
      const currentHeight = menu.scrollHeight;
      gsap.fromTo(
        menu,
        { height: currentHeight, autoAlpha: 1 },
        {
          height: 0,
          autoAlpha: 0,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            menu.hidden = true;
            menu.style.height = '';
          },
        }
      );
    }
    toggle.setAttribute('aria-expanded', 'false');
    isOpen = false;
  };

  toggle.addEventListener('click', () => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (isOpen) closeMenu();
    });
  });

  document.addEventListener('click', (event) => {
    if (!isOpen) return;
    const target = event.target as Node;
    if (menu.contains(target) || toggle.contains(target)) return;
    closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) closeMenu();
  });
}
```

- [ ] **Step 2: Type-check and run the full test suite**

```bash
npx astro check
npx vitest run
```

Expected: both pass with 0 errors/failures.

- [ ] **Step 3: Production build**

```bash
npm run build
```

Expected: build completes with 0 errors.

- [ ] **Step 4: Cross-browser manual verification**

```bash
npx astro dev --background
```

In a Chromium-based browser (Chrome/Edge):
- Confirm the pill shows real refraction/distortion of whatever scrolls behind it (not just blur) — text or images behind the pill should look visibly warped, not merely blurred.
- Confirm condense-on-scroll, cursor highlight, scroll-reactive ripple, and the mobile menu all work as in Tasks 3–4.

In Firefox:
- Confirm the `no-glass-filter` fallback path engages if `url(#liquid-glass)` isn't honored inside `backdrop-filter` (check via devtools that `html` has class `no-glass-filter`, and that the pill still reads as clean frosted glass — blur + saturation — with no visual breakage).
- Confirm condense-on-scroll, cursor highlight, and the mobile menu still work (these don't depend on the SVG filter).

With OS-level "reduce motion" enabled:
- Confirm the conic sheen animation stops (frozen, not animating).
- Confirm the condense/highlight changes still happen but snap instantly rather than easing.
- Confirm the mobile menu opens/closes instantly with no height/opacity tween.

```bash
npx astro dev stop
```

- [ ] **Step 5: Commit**

```bash
git add src/scripts/liquid-nav.ts
git commit -m "fix: respect prefers-reduced-motion in mobile menu transitions"
```
