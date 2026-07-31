# Liquid Glass Navbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a floating "liquid glass" navbar to the homepage, per `docs/superpowers/specs/2026-07-31-liquid-glass-navbar-design.md`.

**Architecture:** A single `Nav` client component rendered above `{children}` in `src/app/layout.tsx`. Real backdrop refraction comes from an inline SVG `feTurbulence`/`feDisplacementMap` filter applied via `backdrop-filter`, feature-detected with a plain-blur fallback. Scroll-condense and the cursor-reactive highlight are both GSAP-driven; the condense progress calculation is extracted as a pure, unit-tested function following this codebase's existing `src/lib/motion/*.ts` convention. The existing `LenisProvider` is extended to expose its Lenis instance so the Contact button can smooth-scroll without fighting Lenis's own scroll loop.

**Tech Stack:** Next.js (App Router) + TypeScript + Tailwind CSS v4 + GSAP + Lenis + Vitest (all already in the project — no new dependencies).

## Global Constraints

- No WebGL and no new animation library — refraction is SVG-filter-based (`feDisplacementMap`), motion is GSAP, per `docs/superpowers/specs/2026-07-31-liquid-glass-navbar-design.md`.
- No color-channel splitting / chromatic aberration in the distortion filter — explicitly excluded per the approved "toned down" design decision.
- Floating centered pill with margin on all sides — not edge-to-edge.
- Light glass built from existing `--color-surface`/`--color-ink` tokens (defined in `src/app/globals.css`) — not dark glass.
- Easing limited to `power2.out`, `power3.out`, `power4.out`, `expo.out` — never `bounce`, `elastic`, `back` (`docs/motion-system.md`).
- Every animated interaction must respect `prefers-reduced-motion: reduce` (`docs/motion-system.md` Accessibility).
- The three service links point to `/build`, `/capture`, `/move` — these pages do not exist yet and are explicitly out of scope for this plan.
- Static export must keep working — no server dependencies (`next.config.mjs` has `output: "export"`).
- Target Lighthouse Performance score > 90 (`CLAUDE.md`).
- No browser tool is available in this environment this session — manual visual/interaction verification steps in this plan describe what to check, but must be run by whoever executes this plan in a real browser (via `npm run dev`) before shipping.

---

## File Structure

```
src/
  app/
    layout.tsx                 (modified — renders <Nav /> above {children})
  components/
    Nav.tsx                    (new)
  lib/
    motion/
      LenisProvider.tsx        (modified — exposes the active Lenis instance)
      scroll-to.ts              (new)
      nav-scroll.ts             (new)
  components/
    sections/
      CallToAction.tsx          (modified — adds id="cta")
tests/
  lib/
    nav-scroll.test.ts          (new)
```

---

### Task 1: Lenis-aware scroll-to helper

**Files:**
- Modify: `src/lib/motion/LenisProvider.tsx`
- Create: `src/lib/motion/scroll-to.ts`
- Modify: `src/components/sections/CallToAction.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `getLenisInstance(): Lenis | null` (named export) from `LenisProvider.tsx`, consumed by `scroll-to.ts`. Produces: `scrollToId(id: string): void` from `scroll-to.ts`, used by Task 3's Contact button and Task 6's mobile Contact button. `CallToAction.tsx`'s root `<section>` gains `id="cta"`, which `scrollToId("cta")` targets.

- [ ] **Step 1: Add instance exposure to `LenisProvider.tsx`**

Modify `src/lib/motion/LenisProvider.tsx` to track the active Lenis instance in module scope and expose a getter:

```tsx
"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let activeLenis: Lenis | null = null;

export function getLenisInstance(): Lenis | null {
  return activeLenis;
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    });
    activeLenis = lenis;

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(onTick);
      lenis.destroy();
      activeLenis = null;
    };
  }, []);

  return <>{children}</>;
}
```

- [ ] **Step 2: Create `src/lib/motion/scroll-to.ts`**

```ts
import { getLenisInstance } from "@/lib/motion/LenisProvider";

export function scrollToId(id: string): void {
  const target = document.getElementById(id);
  if (!target) return;

  const lenis = getLenisInstance();
  if (lenis) {
    lenis.scrollTo(target);
    return;
  }

  target.scrollIntoView({ behavior: "auto" });
}
```

The fallback (`scrollIntoView({ behavior: "auto" })`, an instant jump) fires whenever Lenis isn't running — which is exactly the `prefers-reduced-motion` case, since `LenisProvider` skips creating a Lenis instance under reduced motion. This gives reduced-motion users an instant jump instead of a competing native smooth-scroll animation fighting Lenis, with no extra reduced-motion check needed in this file.

- [ ] **Step 3: Add `id="cta"` to `CallToAction.tsx`**

In `src/components/sections/CallToAction.tsx`, add `id="cta"` to the root `<section>` element (alongside its existing `ref={sectionRef}` and `className`).

- [ ] **Step 4: Verify the build**

Run: `npm run typecheck` — expect no errors.
Run: `npm run build` — expect a successful static export.

- [ ] **Step 5: Commit**

```bash
git add src/lib/motion/LenisProvider.tsx src/lib/motion/scroll-to.ts src/components/sections/CallToAction.tsx
git commit -m "feat: expose Lenis instance and add scroll-to helper for nav"
```

---

### Task 2: Scroll-condense pure helper

**Files:**
- Create: `src/lib/motion/nav-scroll.ts`
- Test: `tests/lib/nav-scroll.test.ts`

**Interfaces:**
- Consumes: `clampProgress` from `src/lib/motion/scroll-progress.ts` (existing).
- Produces: `getCondenseProgress(scrollY: number, thresholdPx: number): number`, used by Task 5.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/nav-scroll.test.ts
import { describe, expect, it } from "vitest";
import { getCondenseProgress } from "@/lib/motion/nav-scroll";

describe("getCondenseProgress", () => {
  it("returns 0 at the top of the page", () => {
    expect(getCondenseProgress(0, 24)).toBe(0);
  });

  it("returns 1 once scroll passes the threshold", () => {
    expect(getCondenseProgress(24, 24)).toBe(1);
    expect(getCondenseProgress(100, 24)).toBe(1);
  });

  it("returns a proportional value mid-threshold", () => {
    expect(getCondenseProgress(12, 24)).toBe(0.5);
  });

  it("treats a zero or negative threshold as fully condensed", () => {
    expect(getCondenseProgress(0, 0)).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/lib/nav-scroll.test.ts`
Expected: FAIL — module doesn't exist yet.

- [ ] **Step 3: Implement `src/lib/motion/nav-scroll.ts`**

```ts
import { clampProgress } from "@/lib/motion/scroll-progress";

export function getCondenseProgress(scrollY: number, thresholdPx: number): number {
  if (thresholdPx <= 0) return 1;
  return clampProgress(scrollY / thresholdPx);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/lib/nav-scroll.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/motion/nav-scroll.ts tests/lib/nav-scroll.test.ts
git commit -m "feat: add scroll-condense pure helper for nav"
```

---

### Task 3: Nav shell — static glass pill, desktop layout

**Files:**
- Create: `src/components/Nav.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `scrollToId` (Task 1).
- Produces: `Nav` component (named export) from `src/components/Nav.tsx`, rendered in `layout.tsx`. Exposes `navRef` (internal) that Tasks 4–6 attach behavior to.

- [ ] **Step 1: Implement `src/components/Nav.tsx` (static shell only — no cursor highlight, no condense, no mobile menu yet)**

```tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { scrollToId } from "@/lib/motion/scroll-to";

const SERVICE_LINKS = [
  { label: "Build", href: "/build" },
  { label: "Capture", href: "/capture" },
  { label: "Move", href: "/move" },
];

const FILTER_BACKDROP = "url(#liquid-glass-nav) blur(20px) saturate(1.3)";
const FALLBACK_BACKDROP = "blur(20px) saturate(1.3)";

export function Nav() {
  const navRef = useRef<HTMLElement>(null);
  const [backdropFilter, setBackdropFilter] = useState(FALLBACK_BACKDROP);

  useEffect(() => {
    if (typeof CSS !== "undefined" && CSS.supports("backdrop-filter", FILTER_BACKDROP)) {
      setBackdropFilter(FILTER_BACKDROP);
    }
  }, []);

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 md:top-6">
      <nav
        ref={navRef}
        className="relative flex w-full max-w-3xl items-center justify-between gap-6 rounded-full border border-ink/10 px-6 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]"
        style={{
          backdropFilter,
          WebkitBackdropFilter: backdropFilter,
          background: "color-mix(in srgb, var(--color-surface) 78%, transparent)",
        }}
      >
        <svg aria-hidden="true" className="absolute h-0 w-0">
          <filter id="liquid-glass-nav">
            <feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation="0.4" />
          </filter>
        </svg>

        <Link href="/" className="text-lg font-semibold tracking-tight text-ink">
          Cylent
        </Link>

        <ul className="hidden items-center gap-6 md:flex">
          {SERVICE_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => scrollToId("cta")}
          className="hidden rounded-full bg-ink px-5 py-2 text-sm font-medium text-surface transition-opacity hover:opacity-90 md:inline-flex"
        >
          Contact
        </button>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Wire `Nav` into `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { LenisProvider } from "@/lib/motion/LenisProvider";
import { Nav } from "@/components/Nav";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Cylent Solutions",
  description: "We create digital experiences.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} font-sans antialiased`}>
        <LenisProvider>
          <Nav />
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify the build**

Run: `npm run typecheck` — expect no errors.
Run: `npm run build` — expect a successful static export.

- [ ] **Step 4: Manual visual check**

Run: `npm run dev`, open `http://localhost:3000`, confirm the pill renders centered near the top with a visibly frosted/blurred background (the busy homepage content behind it should be softly distorted, not sharply visible), logo left, three service links + Contact button right, at a desktop viewport width. Clicking Contact should scroll to the CTA section at the bottom.

- [ ] **Step 5: Commit**

```bash
git add src/components/Nav.tsx src/app/layout.tsx
git commit -m "feat: add static liquid glass nav shell"
```

---

### Task 4: Cursor-reactive highlight

**Files:**
- Modify: `src/components/Nav.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing consumed elsewhere — self-contained interaction.

- [ ] **Step 1: Add the highlight element and pointer-tracking effect to `Nav.tsx`**

Add `import { gsap } from "gsap";` to the top of the file, add a `highlightRef` and a `reducedMotion` state, and add the highlight markup plus effect:

```tsx
const [reducedMotion, setReducedMotion] = useState(false);
const highlightRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}, []);

useEffect(() => {
  const nav = navRef.current;
  const highlight = highlightRef.current;
  if (!nav || !highlight || reducedMotion) return;

  gsap.set(highlight, { x: nav.clientWidth / 2, y: nav.clientHeight / 2 });

  const moveX = gsap.quickTo(highlight, "x", { duration: 0.5, ease: "power3.out" });
  const moveY = gsap.quickTo(highlight, "y", { duration: 0.5, ease: "power3.out" });

  const handlePointerMove = (event: PointerEvent) => {
    const rect = nav.getBoundingClientRect();
    moveX(event.clientX - rect.left);
    moveY(event.clientY - rect.top);
  };

  const handlePointerLeave = () => {
    moveX(nav.clientWidth / 2);
    moveY(nav.clientHeight / 2);
  };

  nav.addEventListener("pointermove", handlePointerMove);
  nav.addEventListener("pointerleave", handlePointerLeave);

  return () => {
    nav.removeEventListener("pointermove", handlePointerMove);
    nav.removeEventListener("pointerleave", handlePointerLeave);
  };
}, [reducedMotion]);
```

Add the highlight element as the first child inside `<nav>`, before the `<svg>` filter definition:

```tsx
{!reducedMotion && (
  <div
    ref={highlightRef}
    aria-hidden="true"
    className="pointer-events-none absolute left-0 top-0 h-24 w-24 -ml-12 -mt-12 rounded-full bg-accent/15 blur-2xl"
  />
)}
```

(Margin-based centering, not a Tailwind `translate` utility class, is used deliberately — GSAP's `x`/`y` tweens manage the element's `transform` directly, and a class-based `transform` would be overwritten by GSAP's own transform cache.)

- [ ] **Step 2: Verify the build**

Run: `npm run typecheck` — expect no errors.

- [ ] **Step 3: Manual visual check**

Run: `npm run dev`, move the cursor across the nav pill at a desktop width, confirm a soft glow follows the pointer smoothly and eases back to center on leave. Enable "reduce motion" in OS/browser accessibility settings, reload, confirm the highlight does not render at all.

- [ ] **Step 4: Commit**

```bash
git add src/components/Nav.tsx
git commit -m "feat: add cursor-reactive highlight to nav"
```

---

### Task 5: Scroll-condense behavior

**Files:**
- Modify: `src/components/Nav.tsx`

**Interfaces:**
- Consumes: `getCondenseProgress` from `src/lib/motion/nav-scroll.ts` (Task 2).
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Add the condense effect to `Nav.tsx`**

Add `import { getCondenseProgress } from "@/lib/motion/nav-scroll";`, and a new effect:

```tsx
useEffect(() => {
  const nav = navRef.current;
  if (!nav) return;

  const CONDENSE_THRESHOLD_PX = 24;

  const update = () => {
    const progress = getCondenseProgress(window.scrollY, CONDENSE_THRESHOLD_PX);
    gsap.to(nav, { "--nav-condense": progress, duration: 0.3, ease: "power2.out", overwrite: true });
  };

  update();
  window.addEventListener("scroll", update, { passive: true });

  return () => {
    window.removeEventListener("scroll", update);
    gsap.killTweensOf(nav);
  };
}, []);
```

- [ ] **Step 2: Derive padding and an extra opacity layer from `--nav-condense`**

Remove `py-3` from the `<nav>`'s `className` (padding is now computed inline) and add `paddingTop`/`paddingBottom` to its `style` object:

```tsx
style={{
  backdropFilter,
  WebkitBackdropFilter: backdropFilter,
  background: "color-mix(in srgb, var(--color-surface) 78%, transparent)",
  paddingTop: "calc(0.75rem - var(--nav-condense, 0) * 0.25rem)",
  paddingBottom: "calc(0.75rem - var(--nav-condense, 0) * 0.25rem)",
}}
```

Add an extra translucent layer behind the content (as the first child inside `<nav>`, before the highlight div) so opacity visibly increases as the pill condenses:

```tsx
<span
  aria-hidden="true"
  className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-surface"
  style={{ opacity: "calc(var(--nav-condense, 0) * 0.15)" }}
/>
```

- [ ] **Step 3: Verify the build**

Run: `npm run typecheck` — expect no errors.

- [ ] **Step 4: Manual visual check**

Run: `npm run dev`, scroll down from the top of the page, confirm the pill visibly tightens (less vertical padding) and looks slightly more opaque within the first ~24px of scroll, then holds steady — and relaxes back when scrolling back to the top.

- [ ] **Step 5: Commit**

```bash
git add src/components/Nav.tsx
git commit -m "feat: add scroll-condense behavior to nav"
```

---

### Task 6: Mobile hamburger + glass sheet

**Files:**
- Modify: `src/components/Nav.tsx`

**Interfaces:**
- Consumes: `scrollToId` (Task 1, already imported).
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Add mobile state, the hamburger button, and the sheet effect to `Nav.tsx`**

```tsx
const [mobileOpen, setMobileOpen] = useState(false);
const sheetRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const sheet = sheetRef.current;
  if (!sheet) return;

  if (mobileOpen) {
    gsap.set(sheet, { display: "block" });
    gsap.fromTo(
      sheet,
      { height: 0, opacity: 0 },
      { height: "auto", opacity: 1, duration: reducedMotion ? 0 : 0.4, ease: "power2.out" }
    );
  } else {
    gsap.to(sheet, {
      height: 0,
      opacity: 0,
      duration: reducedMotion ? 0 : 0.3,
      ease: "power2.out",
      onComplete: () => gsap.set(sheet, { display: "none" }),
    });
  }
}, [mobileOpen, reducedMotion]);

useEffect(() => {
  if (!mobileOpen) return;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") setMobileOpen(false);
  };
  const handleOutsideClick = (event: MouseEvent) => {
    if (navRef.current && !navRef.current.contains(event.target as Node)) {
      setMobileOpen(false);
    }
  };

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("mousedown", handleOutsideClick);

  return () => {
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("mousedown", handleOutsideClick);
  };
}, [mobileOpen]);

useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth >= 768 && mobileOpen) {
      setMobileOpen(false);
    }
  };
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, [mobileOpen]);
```

- [ ] **Step 2: Add the hamburger button inside `<nav>`, after the Contact button**

```tsx
<button
  type="button"
  onClick={() => setMobileOpen((open) => !open)}
  aria-expanded={mobileOpen}
  aria-controls="mobile-nav-sheet"
  className="inline-flex flex-col items-center justify-center gap-1 rounded-full p-2 md:hidden"
>
  <span className="sr-only">Toggle menu</span>
  <span className="h-0.5 w-5 bg-ink" />
  <span className="h-0.5 w-5 bg-ink" />
</button>
```

- [ ] **Step 3: Add the sheet markup as a sibling of `<nav>`, inside `<header>`, after `</nav>`**

```tsx
<div
  ref={sheetRef}
  id="mobile-nav-sheet"
  className="w-full max-w-3xl overflow-hidden rounded-3xl border border-ink/10 md:hidden"
  style={{
    display: "none",
    backdropFilter,
    WebkitBackdropFilter: backdropFilter,
    background: "color-mix(in srgb, var(--color-surface) 90%, transparent)",
  }}
>
  <ul className="flex flex-col gap-4 px-6 py-6">
    {SERVICE_LINKS.map((link) => (
      <li key={link.href}>
        <Link href={link.href} onClick={() => setMobileOpen(false)} className="text-base font-medium text-ink">
          {link.label}
        </Link>
      </li>
    ))}
    <li>
      <button
        type="button"
        onClick={() => {
          setMobileOpen(false);
          scrollToId("cta");
        }}
        className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-surface"
      >
        Contact
      </button>
    </li>
  </ul>
</div>
```

- [ ] **Step 4: Verify the build**

Run: `npm run typecheck` — expect no errors.
Run: `npm run build` — expect a successful static export.

- [ ] **Step 5: Manual visual check**

Using DevTools device mode (viewport below 768px), run `npm run dev`, confirm the desktop links/Contact button are hidden and a hamburger button appears. Tapping it should open a glass sheet below the pill with the three links and Contact stacked; tapping a link, clicking outside, or pressing Escape should close it. Resize the viewport back above 768px while the sheet is open and confirm it closes automatically.

- [ ] **Step 6: Commit**

```bash
git add src/components/Nav.tsx
git commit -m "feat: add mobile hamburger and glass sheet to nav"
```

---

### Task 7: Final QA pass

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite, typecheck, and build**

Run: `npm run test` — expect all unit tests (including the new `nav-scroll` tests) to PASS.
Run: `npm run typecheck` — expect no errors.
Run: `npm run build` — expect a successful static export.

- [ ] **Step 2: Manual end-to-end check at desktop width**

Run: `npm run dev`, open `http://localhost:3000` at a viewport ≥768px, and confirm: the pill renders with visible backdrop distortion (not just blur), logo/links/Contact all present and correctly styled, cursor highlight tracks smoothly, scroll-condense engages within the first ~24px of scroll, and Contact scrolls to the CTA section.

- [ ] **Step 3: Manual mobile check**

At a viewport <768px, confirm the hamburger appears, the glass sheet opens/closes correctly (tap toggle, link click, outside click, Escape), and Contact in the sheet also scrolls to the CTA section.

- [ ] **Step 4: Manual reduced-motion check**

Enable "reduce motion" in OS/browser accessibility settings, reload, and confirm: the cursor highlight does not render, the mobile sheet opens/closes instantly (no tween), and Contact scrolling is an instant jump rather than smooth. The glass material itself (blur/distortion) should remain visible — only continuous/animated motion is suppressed.

- [ ] **Step 5: `@supports` fallback check**

If a non-Chromium/Firefox-with-filter-support browser is available, confirm the nav still reads as frosted glass (plain blur, no distortion) rather than breaking or showing an opaque/unstyled bar. If no such browser is available in this environment, note that this check is deferred to a real-browser pass before shipping.

- [ ] **Step 6: Motion review checklist**

Per `docs/motion-system.md`'s Motion Review Checklist: does the nav's motion support the story, guide attention, feel smooth, feel performant, feel accessible, feel premium — and would removing any of it make the experience worse? Note anything that fails this check for follow-up.

---

## Self-Review Notes

- **Spec coverage:** every section of `docs/superpowers/specs/2026-07-31-liquid-glass-navbar-design.md` maps to a task — glass material and feature detection (Task 3), layout/content (Task 3), cursor highlight (Task 4), scroll-condense (Task 2 + 5), mobile menu (Task 6), and the divergences from the creativeglu.ai reference (floating pill, light glass, no chromatic aberration) are all implemented as specified, not the bolder reference version.
- **Placeholder scan:** no TBD/TODO markers; all code blocks are complete and runnable as written.
- **Type consistency:** `scrollToId(id: string): void` and `getCondenseProgress(scrollY: number, thresholdPx: number): number` signatures are identical everywhere they're defined (Tasks 1–2) and consumed (Tasks 3, 5, 6).
- **Known limitation carried into Task 7:** this environment has no browser tool available this session, so the manual verification steps throughout this plan describe what to check but cannot be executed by an agent working here — they must be run by whoever executes this plan, in a real browser, before considering the feature shippable.
