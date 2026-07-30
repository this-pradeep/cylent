# Homepage Cinematic Scroll-Narrative Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Cylent Solutions homepage as a fresh Next.js app implementing "The Reveal" — the cinematic scroll-narrative concept in `docs/superpowers/specs/2026-07-30-homepage-cinematic-scroll-narrative-design.md`.

**Architecture:** A single-page Next.js App Router site, statically exported. Nine section components render in narrative order inside `app/page.tsx`. A shared Lenis + GSAP ScrollTrigger provider drives scroll behavior; two sections (Three Pillars, Process) use pinned scroll-scrubbed sequences, the rest use scroll-triggered reveals. Motion math (breakpoint checks, scroll-progress mapping, reduced-motion mode) is extracted into pure, unit-tested functions, matching the project's prior testing pattern of testing logic, not GSAP timelines directly.

**Tech Stack:** Next.js (App Router, static export) + TypeScript + Tailwind CSS v4 + GSAP + ScrollTrigger + Lenis + Vitest.

## Global Constraints

- Static site only — `next.config.mjs` uses `output: "export"`. No backend, database, CMS, auth, or API routes (`CLAUDE.md`).
- No animation/UI libraries beyond GSAP, ScrollTrigger, Lenis, Tailwind (`CLAUDE.md`, `docs/motion-system.md`).
- Easing limited to `power2.out`, `power3.out`, `power4.out`, `expo.out` — never `bounce`, `elastic`, `back` (`docs/motion-system.md`).
- Every animated section must respect `prefers-reduced-motion: reduce` by disabling pinned/complex timelines (`docs/motion-system.md` Accessibility).
- Pinned sections (Three Pillars, Process) must degrade to non-pinned scroll-triggered reveals below the `768px` mobile breakpoint (`docs/superpowers/specs/2026-07-30-homepage-cinematic-scroll-narrative-design.md`, Performance & mobile strategy).
- All visuals are placeholders with documented asset slots (aspect ratio, content intent) — no stock photography, no fake realism (design spec, Visual style).
- Section order is fixed by `docs/website-story.md`'s nine chapters: First Impression → The Problem → Our Philosophy → Three Pillars → Process → Proof → Attention to Detail → The Future → Call to Action.
- Target Lighthouse Performance score > 90 (`CLAUDE.md`).

---

## File Structure

```
package.json
tsconfig.json
next.config.mjs
postcss.config.mjs
vitest.config.ts
.gitignore
src/
  app/
    layout.tsx
    page.tsx
    globals.css
  lib/
    motion/
      reduced-motion.ts
      breakpoint.ts
      scroll-progress.ts
      LenisProvider.tsx
  components/
    PlaceholderAsset.tsx
    sections/
      Hero.tsx
      Problem.tsx
      Philosophy.tsx
      Pillars.tsx
      pillars/
        BuildPanel.tsx
        CapturePanel.tsx
        MovePanel.tsx
      Process.tsx
      Proof.tsx
      AttentionToDetail.tsx
      Future.tsx
      CallToAction.tsx
tests/
  lib/
    reduced-motion.test.ts
    breakpoint.test.ts
    scroll-progress.test.ts
```

---

### Task 1: Project bootstrap + reduced-motion utility

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `postcss.config.mjs`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `src/lib/motion/reduced-motion.ts`
- Test: `tests/lib/reduced-motion.test.ts`

**Interfaces:**
- Produces: `getMotionMode(prefersReducedMotion: boolean): "full" | "reduced"` from `src/lib/motion/reduced-motion.ts`, used by every section component from Task 5 onward.
- Produces: working `npm run dev`, `npm run build`, `npm run typecheck`, `npm run test` scripts, relied on by every later task.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "cylent-website",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "gsap": "^3.12.5",
    "lenis": "^1.1.13"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
```

- [ ] **Step 4: Create `postcss.config.mjs`**

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [ ] **Step 5: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 6: Create `.gitignore`**

```
node_modules
.next
out
.DS_Store
*.local
```

- [ ] **Step 7: Write the failing test for the reduced-motion utility**

```ts
// tests/lib/reduced-motion.test.ts
import { describe, expect, it } from "vitest";
import { getMotionMode } from "@/lib/motion/reduced-motion";

describe("getMotionMode", () => {
  it("returns 'reduced' when the user prefers reduced motion", () => {
    expect(getMotionMode(true)).toBe("reduced");
  });

  it("returns 'full' when the user has no motion preference", () => {
    expect(getMotionMode(false)).toBe("full");
  });
});
```

- [ ] **Step 8: Install dependencies and run the test to verify it fails**

Run: `npm install`
Run: `npx vitest run tests/lib/reduced-motion.test.ts`
Expected: FAIL — `src/lib/motion/reduced-motion.ts` does not exist yet.

- [ ] **Step 9: Implement `src/lib/motion/reduced-motion.ts`**

```ts
export function getMotionMode(prefersReducedMotion: boolean): "full" | "reduced" {
  return prefersReducedMotion ? "reduced" : "full";
}
```

- [ ] **Step 10: Run the test to verify it passes**

Run: `npx vitest run tests/lib/reduced-motion.test.ts`
Expected: PASS

- [ ] **Step 11: Verify the toolchain end-to-end**

Run: `npm run typecheck` — expect no errors (note: this will fail until `src/app/layout.tsx` and `src/app/page.tsx` exist from Task 3; if so, create minimal stub files now — `src/app/layout.tsx` returning `<html><body>{children}</body></html>` and `src/app/page.tsx` returning `<main />` — so `npm run build` succeeds. Task 3 will replace the layout stub; Task 12 will replace the page stub.)
Run: `npm run build` — expect a successful static export into `out/`.

- [ ] **Step 12: Commit**

```bash
git add package.json tsconfig.json next.config.mjs postcss.config.mjs vitest.config.ts .gitignore src/lib/motion/reduced-motion.ts tests/lib/reduced-motion.test.ts src/app
git commit -m "chore: bootstrap Next.js project with reduced-motion utility"
```

---

### Task 2: Breakpoint and scroll-progress utilities

**Files:**
- Create: `src/lib/motion/breakpoint.ts`
- Create: `src/lib/motion/scroll-progress.ts`
- Test: `tests/lib/breakpoint.test.ts`
- Test: `tests/lib/scroll-progress.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `PIN_DISABLE_BREAKPOINT_PX: number` and `shouldPinSection(viewportWidthPx: number, prefersReducedMotion: boolean): boolean` from `src/lib/motion/breakpoint.ts`, used by Task 8 (Pillars) and Task 9 (Process).
- Produces: `clampProgress(value: number): number` and `mapScrollToStep(progress: number, stepCount: number): number` from `src/lib/motion/scroll-progress.ts`, used by Task 9 (Process).

- [ ] **Step 1: Write the failing tests**

```ts
// tests/lib/breakpoint.test.ts
import { describe, expect, it } from "vitest";
import { PIN_DISABLE_BREAKPOINT_PX, shouldPinSection } from "@/lib/motion/breakpoint";

describe("shouldPinSection", () => {
  it("pins above the breakpoint with no reduced-motion preference", () => {
    expect(shouldPinSection(PIN_DISABLE_BREAKPOINT_PX, false)).toBe(true);
    expect(shouldPinSection(1440, false)).toBe(true);
  });

  it("does not pin below the breakpoint", () => {
    expect(shouldPinSection(PIN_DISABLE_BREAKPOINT_PX - 1, false)).toBe(false);
    expect(shouldPinSection(375, false)).toBe(false);
  });

  it("never pins when the user prefers reduced motion, regardless of width", () => {
    expect(shouldPinSection(1440, true)).toBe(false);
  });
});
```

```ts
// tests/lib/scroll-progress.test.ts
import { describe, expect, it } from "vitest";
import { clampProgress, mapScrollToStep } from "@/lib/motion/scroll-progress";

describe("clampProgress", () => {
  it("clamps values below 0 to 0", () => {
    expect(clampProgress(-0.5)).toBe(0);
  });

  it("clamps values above 1 to 1", () => {
    expect(clampProgress(1.5)).toBe(1);
  });

  it("passes through in-range values unchanged", () => {
    expect(clampProgress(0.42)).toBe(0.42);
  });
});

describe("mapScrollToStep", () => {
  it("maps progress 0 to step 0", () => {
    expect(mapScrollToStep(0, 5)).toBe(0);
  });

  it("maps progress 1 to the last step, not stepCount", () => {
    expect(mapScrollToStep(1, 5)).toBe(4);
  });

  it("maps mid-range progress proportionally", () => {
    expect(mapScrollToStep(0.5, 5)).toBe(2);
  });

  it("clamps out-of-range progress before mapping", () => {
    expect(mapScrollToStep(-1, 5)).toBe(0);
    expect(mapScrollToStep(2, 5)).toBe(4);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/lib/breakpoint.test.ts tests/lib/scroll-progress.test.ts`
Expected: FAIL — modules don't exist yet.

- [ ] **Step 3: Implement `src/lib/motion/breakpoint.ts`**

```ts
export const PIN_DISABLE_BREAKPOINT_PX = 768;

export function shouldPinSection(viewportWidthPx: number, prefersReducedMotion: boolean): boolean {
  if (prefersReducedMotion) {
    return false;
  }
  return viewportWidthPx >= PIN_DISABLE_BREAKPOINT_PX;
}
```

- [ ] **Step 4: Implement `src/lib/motion/scroll-progress.ts`**

```ts
export function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function mapScrollToStep(progress: number, stepCount: number): number {
  const clamped = clampProgress(progress);
  return Math.min(stepCount - 1, Math.floor(clamped * stepCount));
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/lib/breakpoint.test.ts tests/lib/scroll-progress.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/motion/breakpoint.ts src/lib/motion/scroll-progress.ts tests/lib/breakpoint.test.ts tests/lib/scroll-progress.test.ts
git commit -m "feat: add breakpoint and scroll-progress motion utilities"
```

---

### Task 3: Design tokens, root layout, and LenisProvider

**Files:**
- Create: `src/app/globals.css`
- Modify: `src/app/layout.tsx` (replace Task 1's stub)
- Create: `src/lib/motion/LenisProvider.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: Tailwind utility classes bound to design tokens (`bg-surface`, `text-ink`, `text-ink-muted`, `bg-ink`, `text-surface`, `bg-accent`, `border-ink/10`, `font-sans`), used by every section component from Task 4 onward.
- Produces: `LenisProvider` component (named export) from `src/lib/motion/LenisProvider.tsx`, used by `src/app/layout.tsx`.

- [ ] **Step 1: Create `src/app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-surface: #faf9f7;
  --color-ink: #14120f;
  --color-ink-muted: #5c584f;
  --color-accent: #c9542c;
  --font-sans: var(--font-manrope), sans-serif;
}

html {
  scroll-behavior: auto;
}

body {
  background-color: var(--color-surface);
  color: var(--color-ink);
}
```

- [ ] **Step 2: Implement `src/lib/motion/LenisProvider.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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
    };
  }, []);

  return <>{children}</>;
}
```

- [ ] **Step 3: Replace `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { LenisProvider } from "@/lib/motion/LenisProvider";
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
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify the build**

Run: `npm run typecheck` — expect no errors.
Run: `npm run build` — expect a successful static export.

- [ ] **Step 5: Manual visual check**

Run: `npm run dev`, open `http://localhost:3000`, confirm the page loads with the surface background color and no console errors, and that scrolling feels smooth (Lenis active).

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/lib/motion/LenisProvider.tsx
git commit -m "feat: add design tokens, root layout, and Lenis/ScrollTrigger provider"
```

---

### Task 4: PlaceholderAsset component

**Files:**
- Create: `src/components/PlaceholderAsset.tsx`

**Interfaces:**
- Consumes: design tokens from Task 3.
- Produces: `PlaceholderAsset` component (named export), props `{ aspectRatio: "16:9" | "1:1" | "9:16"; label: string; variant: "grid" | "photo" | "film"; className?: string }`, used by Task 8 (Pillars) and Task 10 (Proof).

- [ ] **Step 1: Implement `src/components/PlaceholderAsset.tsx`**

```tsx
type PlaceholderAssetProps = {
  aspectRatio: "16:9" | "1:1" | "9:16";
  label: string;
  variant: "grid" | "photo" | "film";
  className?: string;
};

const ASPECT_CLASS: Record<PlaceholderAssetProps["aspectRatio"], string> = {
  "16:9": "aspect-video",
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16]",
};

const VARIANT_CLASS: Record<PlaceholderAssetProps["variant"], string> = {
  grid: "bg-[repeating-linear-gradient(0deg,transparent,transparent_23px,var(--color-ink)_24px),repeating-linear-gradient(90deg,transparent,transparent_23px,var(--color-ink)_24px)] bg-ink/5",
  photo: "bg-gradient-to-b from-accent/30 to-surface",
  film: "bg-gradient-to-r from-ink via-accent/50 to-ink",
};

export function PlaceholderAsset({ aspectRatio, label, variant, className }: PlaceholderAssetProps) {
  return (
    <div
      data-asset-slot={label}
      className={`relative overflow-hidden rounded-sm border border-ink/10 ${ASPECT_CLASS[aspectRatio]} ${VARIANT_CLASS[variant]} ${className ?? ""}`}
    >
      <span className="absolute bottom-2 left-2 text-xs uppercase tracking-widest text-ink-muted/80">
        {label}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run typecheck` — expect no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/PlaceholderAsset.tsx
git commit -m "feat: add PlaceholderAsset component for asset-slot visuals"
```

---

### Task 5: Hero section (Chapter 1 — First Impression)

**Files:**
- Create: `src/components/sections/Hero.tsx`

**Interfaces:**
- Consumes: nothing beyond design tokens (Task 3).
- Produces: `Hero` component (named export) from `src/components/sections/Hero.tsx`, used by Task 12.

- [ ] **Step 1: Implement `src/components/sections/Hero.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const HEADLINE_WORDS = ["We", "build", "experiences", "worth", "remembering."];

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const words = containerRef.current?.querySelectorAll<HTMLSpanElement>("[data-word]");
    const support = containerRef.current?.querySelector("[data-hero-support]");
    const cue = containerRef.current?.querySelector("[data-hero-scroll-cue]");
    if (!words || words.length === 0 || !support || !cue) return;

    if (prefersReducedMotion) {
      gsap.set([...words, support, cue], { opacity: 1, y: 0 });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.fromTo(words, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08 })
      .fromTo(support, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7 }, "-=0.3")
      .fromTo(cue, { opacity: 0 }, { opacity: 1, duration: 0.5 }, "-=0.2");

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center"
    >
      <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-ink md:text-7xl">
        {HEADLINE_WORDS.map((word, index) => (
          <span key={`${word}-${index}`} data-word className="inline-block pr-3">
            {word}
          </span>
        ))}
      </h1>
      <p data-hero-support className="mt-6 max-w-xl text-lg text-ink-muted">
        Cylent Solutions merges technology, visuals, and storytelling into one creative process.
      </p>
      <div
        data-hero-scroll-cue
        className="absolute bottom-10 text-sm uppercase tracking-widest text-ink-muted"
      >
        Scroll
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run typecheck` — expect no errors.

- [ ] **Step 3: Manual visual check**

Temporarily render `<Hero />` in `src/app/page.tsx`, run `npm run dev`, confirm the headline reveals word-by-word on load and the scroll cue fades in last. Revert the temporary render (Task 12 wires it in permanently).

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Hero.tsx
git commit -m "feat: add Hero section with word-by-word reveal sequence"
```

---

### Task 6: Problem section (Chapter 2 — The Problem)

**Files:**
- Create: `src/components/sections/Problem.tsx`

**Interfaces:**
- Consumes: `clampProgress` from `src/lib/motion/scroll-progress.ts` (Task 2).
- Produces: `Problem` component (named export), used by Task 12.

- [ ] **Step 1: Implement `src/components/sections/Problem.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { clampProgress } from "@/lib/motion/scroll-progress";

const PROBLEM_TILES = [
  { label: "Outdated websites", offset: { x: -60, y: -30, rotate: -6 } },
  { label: "Weak visual identity", offset: { x: 50, y: 20, rotate: 5 } },
  { label: "Forgettable presence", offset: { x: -40, y: 40, rotate: 4 } },
  { label: "Inconsistent experiences", offset: { x: 60, y: -20, rotate: -4 } },
];

export function Problem() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tiles = section.querySelectorAll<HTMLDivElement>("[data-tile]");

    if (prefersReducedMotion) {
      gsap.set(tiles, { x: 0, y: 0, rotate: 0, opacity: 1 });
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "center center",
      scrub: 1,
      onUpdate: (self) => {
        const progress = clampProgress(self.progress);
        tiles.forEach((tile, index) => {
          const { x, y, rotate } = PROBLEM_TILES[index].offset;
          gsap.set(tile, {
            x: x * (1 - progress),
            y: y * (1 - progress),
            rotate: rotate * (1 - progress),
            opacity: 0.3 + 0.7 * progress,
          });
        });
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="flex min-h-screen flex-col items-center justify-center gap-10 bg-surface px-6 py-24">
      <p className="max-w-2xl text-center text-2xl font-medium text-ink md:text-3xl">
        Most businesses are held back by the same things.
      </p>
      <div className="grid w-full max-w-3xl grid-cols-2 gap-4">
        {PROBLEM_TILES.map((tile) => (
          <div
            key={tile.label}
            data-tile
            className="flex aspect-[4/3] items-center justify-center rounded-sm border border-ink/10 bg-ink/5 px-4 text-center text-sm font-medium text-ink-muted"
          >
            {tile.label}
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run typecheck` — expect no errors.

- [ ] **Step 3: Manual visual check**

Temporarily render `<Problem />` in `src/app/page.tsx`, run `npm run dev`, scroll through the section, and confirm the four tiles drift from their offset positions into alignment as the section scrolls into view. Revert the temporary render.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Problem.tsx
git commit -m "feat: add Problem section with scroll-scrubbed tile alignment"
```

---

### Task 7: Philosophy section (Chapter 3 — Our Philosophy)

**Files:**
- Create: `src/components/sections/Philosophy.tsx`

**Interfaces:**
- Consumes: nothing beyond design tokens.
- Produces: `Philosophy` component (named export), used by Task 12.

- [ ] **Step 1: Implement `src/components/sections/Philosophy.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function Philosophy() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const techLayer = section.querySelector("[data-layer-tech]");
    const visualLayer = section.querySelector("[data-layer-visual]");
    const copy = section.querySelector("[data-philosophy-copy]");
    if (!techLayer || !visualLayer || !copy) return;

    if (prefersReducedMotion) {
      gsap.set([techLayer, visualLayer, copy], { x: 0, opacity: 1 });
      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 1 },
      scrollTrigger: {
        trigger: section,
        start: "top center",
        toggleActions: "play none none reverse",
      },
    });

    tl.fromTo(techLayer, { x: -80, opacity: 0 }, { x: 0, opacity: 1 })
      .fromTo(visualLayer, { x: 80, opacity: 0 }, { x: 0, opacity: 1 }, "<")
      .fromTo(copy, { opacity: 0, y: 20 }, { opacity: 1, y: 0 }, "-=0.4");

    return () => {
      ScrollTrigger.getAll().forEach((instance) => {
        if (instance.trigger === section) instance.kill();
      });
      tl.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface px-6 py-24"
    >
      <div className="relative flex w-full max-w-3xl items-center justify-center">
        <div
          data-layer-tech
          className="absolute h-40 w-40 rounded-sm border border-ink/10 bg-ink/5 md:h-56 md:w-56"
          style={{ left: "10%" }}
        />
        <div
          data-layer-visual
          className="absolute h-40 w-40 rounded-full bg-accent/20 md:h-56 md:w-56"
          style={{ right: "10%" }}
        />
        <p
          data-philosophy-copy
          className="relative z-10 max-w-lg text-center text-2xl font-medium text-ink md:text-3xl"
        >
          Technology creates functionality. Visuals create emotion. Together they create impact.
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run typecheck` — expect no errors.

- [ ] **Step 3: Manual visual check**

Temporarily render `<Philosophy />` in `src/app/page.tsx`, run `npm run dev`, scroll to the section, and confirm the two layers converge from opposite sides as the copy fades in. Revert the temporary render.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Philosophy.tsx
git commit -m "feat: add Philosophy section with converging-layer transition"
```

---

### Task 8: Three Pillars section (Chapter 4 — centerpiece)

**Files:**
- Create: `src/components/sections/pillars/BuildPanel.tsx`
- Create: `src/components/sections/pillars/CapturePanel.tsx`
- Create: `src/components/sections/pillars/MovePanel.tsx`
- Create: `src/components/sections/Pillars.tsx`

**Interfaces:**
- Consumes: `PlaceholderAsset` (Task 4), `shouldPinSection` from `src/lib/motion/breakpoint.ts` (Task 2).
- Produces: `Pillars` component (named export), used by Task 12.

- [ ] **Step 1: Implement `src/components/sections/pillars/BuildPanel.tsx`**

```tsx
import { PlaceholderAsset } from "@/components/PlaceholderAsset";

export function BuildPanel() {
  return (
    <div className="flex h-full w-screen flex-shrink-0 flex-col items-center justify-center gap-8 px-10">
      <PlaceholderAsset
        aspectRatio="16:9"
        label="Build — product UI capture"
        variant="grid"
        className="w-full max-w-3xl"
      />
      <div className="max-w-xl text-center">
        <h2 className="text-4xl font-semibold text-surface">Build.</h2>
        <p className="mt-3 text-lg text-surface/80">
          We create fast, modern, high-performance digital experiences.
        </p>
        <ul className="mt-4 flex flex-wrap justify-center gap-3 text-sm uppercase tracking-widest text-surface/60">
          <li>Performance</li>
          <li>Reliability</li>
          <li>Scalability</li>
          <li>User experience</li>
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `src/components/sections/pillars/CapturePanel.tsx`**

```tsx
import { PlaceholderAsset } from "@/components/PlaceholderAsset";

export function CapturePanel() {
  return (
    <div className="flex h-full w-screen flex-shrink-0 flex-col items-center justify-center gap-8 px-10">
      <PlaceholderAsset
        aspectRatio="1:1"
        label="Capture — brand identity still"
        variant="photo"
        className="w-full max-w-md"
      />
      <div className="max-w-xl text-center">
        <h2 className="text-4xl font-semibold text-surface">Capture.</h2>
        <p className="mt-3 text-lg text-surface/80">
          We create visual identities that communicate personality and quality.
        </p>
        <ul className="mt-4 flex flex-wrap justify-center gap-3 text-sm uppercase tracking-widest text-surface/60">
          <li>Branding</li>
          <li>Visual storytelling</li>
          <li>Creative direction</li>
          <li>Design systems</li>
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement `src/components/sections/pillars/MovePanel.tsx`**

```tsx
import { PlaceholderAsset } from "@/components/PlaceholderAsset";

export function MovePanel() {
  return (
    <div className="flex h-full w-screen flex-shrink-0 flex-col items-center justify-center gap-8 px-10">
      <PlaceholderAsset
        aspectRatio="16:9"
        label="Move — video loop"
        variant="film"
        className="w-full max-w-3xl"
      />
      <div className="max-w-xl text-center">
        <h2 className="text-4xl font-semibold text-surface">Move.</h2>
        <p className="mt-3 text-lg text-surface/80">
          We create stories that connect emotionally.
        </p>
        <ul className="mt-4 flex flex-wrap justify-center gap-3 text-sm uppercase tracking-widest text-surface/60">
          <li>Narrative</li>
          <li>Motion</li>
          <li>Engagement</li>
          <li>Brand storytelling</li>
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implement `src/components/sections/Pillars.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { shouldPinSection } from "@/lib/motion/breakpoint";
import { BuildPanel } from "./pillars/BuildPanel";
import { CapturePanel } from "./pillars/CapturePanel";
import { MovePanel } from "./pillars/MovePanel";

export function Pillars() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pin = shouldPinSection(window.innerWidth, prefersReducedMotion);

    if (!pin) {
      gsap.set(track, { x: 0 });
      section.classList.add("h-auto", "flex-col");
      track.classList.remove("flex-row");
      track.classList.add("w-full", "flex-col");
      return;
    }

    const distance = track.scrollWidth - section.clientWidth;

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => `+=${distance}`,
      pin: true,
      scrub: 1,
      animation: gsap.to(track, { x: -distance, ease: "none" }),
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative h-screen overflow-hidden bg-ink">
      <div ref={trackRef} className="flex h-full w-[300vw] flex-row">
        <BuildPanel />
        <CapturePanel />
        <MovePanel />
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Verify the build**

Run: `npm run typecheck` — expect no errors.

- [ ] **Step 6: Manual visual check**

Temporarily render `<Pillars />` in `src/app/page.tsx`, run `npm run dev` at a desktop viewport width (≥768px), confirm the section pins and the three panels pan horizontally as you scroll. Resize below 768px (or use DevTools device mode) and confirm the section un-pins and the panels stack vertically instead. Revert the temporary render.

- [ ] **Step 7: Commit**

```bash
git add src/components/sections/pillars src/components/sections/Pillars.tsx
git commit -m "feat: add Three Pillars pinned horizontal sequence"
```

---

### Task 9: Process section (Chapter 5 — pinned scroll-scrubbed timeline)

**Files:**
- Create: `src/components/sections/Process.tsx`

**Interfaces:**
- Consumes: `shouldPinSection` (Task 2), `mapScrollToStep` (Task 2).
- Produces: `Process` component (named export), used by Task 12.

- [ ] **Step 1: Implement `src/components/sections/Process.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { shouldPinSection } from "@/lib/motion/breakpoint";
import { mapScrollToStep } from "@/lib/motion/scroll-progress";

const PROCESS_STEPS = ["Discover", "Plan", "Create", "Refine", "Launch"];

export function Process() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pin = shouldPinSection(window.innerWidth, prefersReducedMotion);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "+=150%",
      pin,
      scrub: 1,
      onUpdate: (self) => {
        setActiveStep(mapScrollToStep(self.progress, PROCESS_STEPS.length));
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="flex min-h-screen flex-col items-center justify-center gap-12 bg-surface px-6">
      <p className="text-2xl font-medium text-ink md:text-3xl">How we work.</p>
      <ol className="flex w-full max-w-3xl flex-col gap-4 md:flex-row md:justify-between">
        {PROCESS_STEPS.map((step, index) => (
          <li
            key={step}
            data-step={index}
            className={`text-lg font-medium transition-colors duration-300 md:text-xl ${
              index <= activeStep ? "text-ink" : "text-ink-muted/40"
            }`}
          >
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run typecheck` — expect no errors.

- [ ] **Step 3: Manual visual check**

Temporarily render `<Process />` in `src/app/page.tsx`, run `npm run dev`, scroll through the section, and confirm each step highlights in sequence as you scroll (pinned on desktop widths, non-pinned scroll-through below 768px). Revert the temporary render.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Process.tsx
git commit -m "feat: add Process section with scroll-scrubbed step timeline"
```

---

### Task 10: Proof section (Chapter 6)

**Files:**
- Create: `src/components/sections/Proof.tsx`

**Interfaces:**
- Consumes: `PlaceholderAsset` (Task 4).
- Produces: `Proof` component (named export), used by Task 12.

- [ ] **Step 1: Implement `src/components/sections/Proof.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PlaceholderAsset } from "@/components/PlaceholderAsset";

const PROJECTS = [
  {
    name: "Project One",
    challenge: "A boutique hospitality group with an inconsistent digital presence across three properties.",
    process: "Unified brand identity, then a fast, image-led website built around each property's character.",
    solution: "One design system, three distinct property sites, shared component library.",
    result: "Consistent premium presence across every guest touchpoint.",
  },
  {
    name: "Project Two",
    challenge: "A product launch with strong technology but no visual story to match it.",
    process: "Combined brand photography, launch video, and a performance-first marketing site.",
    solution: "A single campaign built from one creative direction across web, video, and stills.",
    result: "A launch that felt like one story, not three separate deliverables.",
  },
];

export function Proof() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cards = section.querySelectorAll<HTMLDivElement>("[data-project-card]");

    if (prefersReducedMotion) {
      gsap.set(cards, { opacity: 1, clipPath: "inset(0 0 0 0)" });
      return;
    }

    const triggers = Array.from(cards).map((card) =>
      gsap.fromTo(
        card,
        { opacity: 0, clipPath: "inset(0 0 100% 0)" },
        {
          opacity: 1,
          clipPath: "inset(0 0 0% 0)",
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      )
    );

    return () => {
      triggers.forEach((tween) => tween.scrollTrigger?.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="flex flex-col gap-24 bg-surface px-6 py-24">
      {PROJECTS.map((project) => (
        <div key={project.name} data-project-card className="mx-auto flex w-full max-w-4xl flex-col gap-8">
          <PlaceholderAsset aspectRatio="16:9" label={`${project.name} — full-bleed capture`} variant="photo" />
          <div className="grid gap-6 md:grid-cols-2">
            <h3 className="text-3xl font-semibold text-ink">{project.name}</h3>
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="uppercase tracking-widest text-ink-muted">Challenge</dt>
                <dd className="mt-1 text-ink">{project.challenge}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-widest text-ink-muted">Process</dt>
                <dd className="mt-1 text-ink">{project.process}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-widest text-ink-muted">Solution</dt>
                <dd className="mt-1 text-ink">{project.solution}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-widest text-ink-muted">Result</dt>
                <dd className="mt-1 text-ink">{project.result}</dd>
              </div>
            </dl>
          </div>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run typecheck` — expect no errors.

- [ ] **Step 3: Manual visual check**

Temporarily render `<Proof />` in `src/app/page.tsx`, run `npm run dev`, scroll through, and confirm each project card mask-reveals from the top as it enters the viewport. Revert the temporary render.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Proof.tsx
git commit -m "feat: add Proof section with mask-reveal project cards"
```

---

### Task 11: Closing sections (Chapters 7–9 — Attention to Detail, The Future, Call to Action)

**Files:**
- Create: `src/components/sections/AttentionToDetail.tsx`
- Create: `src/components/sections/Future.tsx`
- Create: `src/components/sections/CallToAction.tsx`

**Interfaces:**
- Consumes: nothing beyond design tokens.
- Produces: `AttentionToDetail`, `Future`, `CallToAction` components (named exports), used by Task 12.

- [ ] **Step 1: Implement `src/components/sections/AttentionToDetail.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function AttentionToDetail() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stat = section?.querySelector("[data-detail-stat]");
    if (!section || !stat) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      gsap.set(stat, { scale: 1, opacity: 1 });
      return;
    }

    const tween = gsap.fromTo(
      stat,
      { scale: 0.85, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "top 70%",
          toggleActions: "play none none reverse",
        },
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
      <p data-detail-stat className="text-6xl font-semibold text-ink md:text-8xl">
        90+
      </p>
      <p className="max-w-md text-lg text-ink-muted">
        Every site we ship targets a Lighthouse performance score above 90 — craftsmanship you can measure, not just see.
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Implement `src/components/sections/Future.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function Future() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const copy = section?.querySelector("[data-future-copy]");
    if (!section || !copy) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      gsap.set(copy, { opacity: 1, scale: 1 });
      return;
    }

    const tween = gsap.fromTo(
      copy,
      { opacity: 0, scale: 1.05 },
      {
        opacity: 1,
        scale: 1,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 70%",
          toggleActions: "play none none reverse",
        },
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="flex min-h-[70vh] flex-col items-center justify-center bg-surface px-6 text-center">
      <p data-future-copy className="max-w-2xl text-3xl font-medium text-ink md:text-4xl">
        What could we create for your brand?
      </p>
    </section>
  );
}
```

- [ ] **Step 3: Implement `src/components/sections/CallToAction.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function CallToAction() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const content = section?.querySelector("[data-cta-content]");
    if (!section || !content) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      gsap.set(content, { opacity: 1, y: 0 });
      return;
    }

    const tween = gsap.fromTo(
      content,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-ink px-6 text-center">
      <div data-cta-content className="flex flex-col items-center gap-6">
        <p className="max-w-xl text-3xl font-medium text-surface md:text-4xl">
          Let&apos;s build something worth remembering.
        </p>
        <a
          href="mailto:hello@cylentsolutions.com"
          className="rounded-full bg-accent px-8 py-3 text-sm font-medium uppercase tracking-widest text-surface transition-opacity hover:opacity-90"
        >
          Start a conversation
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Verify the build**

Run: `npm run typecheck` — expect no errors.

- [ ] **Step 5: Manual visual check**

Temporarily render all three components in `src/app/page.tsx`, run `npm run dev`, scroll through, and confirm each reveals once as it enters the viewport, and that motion stops feeling "eventful" by the CTA (a single, calm entrance). Revert the temporary render.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/AttentionToDetail.tsx src/components/sections/Future.tsx src/components/sections/CallToAction.tsx
git commit -m "feat: add Attention to Detail, Future, and Call to Action sections"
```

---

### Task 12: Assemble the homepage and final QA pass

**Files:**
- Modify: `src/app/page.tsx` (replace Task 1's stub)

**Interfaces:**
- Consumes: `Hero`, `Problem`, `Philosophy`, `Pillars`, `Process`, `Proof`, `AttentionToDetail`, `Future`, `CallToAction` (Tasks 5–11).
- Produces: the complete homepage at `/`.

- [ ] **Step 1: Replace `src/app/page.tsx`**

```tsx
import { Hero } from "@/components/sections/Hero";
import { Problem } from "@/components/sections/Problem";
import { Philosophy } from "@/components/sections/Philosophy";
import { Pillars } from "@/components/sections/Pillars";
import { Process } from "@/components/sections/Process";
import { Proof } from "@/components/sections/Proof";
import { AttentionToDetail } from "@/components/sections/AttentionToDetail";
import { Future } from "@/components/sections/Future";
import { CallToAction } from "@/components/sections/CallToAction";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Problem />
      <Philosophy />
      <Pillars />
      <Process />
      <Proof />
      <AttentionToDetail />
      <Future />
      <CallToAction />
    </main>
  );
}
```

- [ ] **Step 2: Run the full test suite and typecheck**

Run: `npm run test` — expect all unit tests (reduced-motion, breakpoint, scroll-progress) to PASS.
Run: `npm run typecheck` — expect no errors.
Run: `npm run build` — expect a successful static export into `out/`.

- [ ] **Step 3: Manual end-to-end check at desktop width**

Run: `npm run dev`, open `http://localhost:3000` at a viewport ≥768px wide, and scroll through the full page top to bottom. Confirm:
- Sections appear in narrative order: First Impression → Problem → Philosophy → Pillars → Process → Proof → Attention to Detail → Future → CTA.
- Three Pillars and Process both pin and scrub as designed.
- No console errors.

- [ ] **Step 4: Manual mobile-fallback check**

Using DevTools device mode (or resizing below 768px), reload and scroll through the full page again. Confirm:
- Three Pillars no longer pins — panels stack vertically.
- Process no longer pins — steps still highlight in sequence as you scroll.
- No layout overflow or horizontal scrollbars.

- [ ] **Step 5: Manual reduced-motion check**

Enable "reduce motion" in the OS/browser accessibility settings (or DevTools' emulate `prefers-reduced-motion: reduce`), reload, and scroll through. Confirm every section's content is immediately visible with no pinning, parallax, or scroll-scrubbed movement, per `docs/motion-system.md`'s Accessibility section.

- [ ] **Step 6: Lighthouse performance check**

Run: `npm run build` (produces the static export in `out/`)
Run: `npx serve out` (or any static file server)
Open the served URL in Chrome, run a Lighthouse audit (DevTools → Lighthouse → Performance), and confirm the Performance score is above 90, per `CLAUDE.md`. If below 90, investigate before proceeding — do not ship an unmeasured regression.

- [ ] **Step 7: Motion review checklist**

For each animated section, confirm against `docs/motion-system.md`'s Motion Review Checklist: does it support the story, guide attention, feel smooth, feel performant, feel accessible, feel premium — and would removing it make the experience worse? Note any section that fails this check for follow-up.

- [ ] **Step 8: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: assemble homepage sections in narrative order"
```

---

## Self-Review Notes

- **Spec coverage:** All nine chapters from `website-story.md` have a corresponding task (Tasks 5–11) and are assembled in Task 12. The design spec's pinning strategy (Pillars, Process only), placeholder-asset approach, mobile-fallback requirement, and reduced-motion requirement are each implemented and manually verified in their respective tasks and in Task 12's final QA pass.
- **Placeholder scan:** No TBD/TODO markers; all code blocks are complete and runnable as written.
- **Type consistency:** `shouldPinSection(viewportWidthPx: number, prefersReducedMotion: boolean)` and `mapScrollToStep(progress: number, stepCount: number)` signatures are identical everywhere they're defined (Task 2) and consumed (Tasks 8, 9). `PlaceholderAsset` props are identical everywhere it's defined (Task 4) and consumed (Tasks 8, 10).
