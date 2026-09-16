"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { LabBrainScene } from "@/components/lab/LabBrainScene";
import { STUDIO_LOCATION } from "@/lib/site/studio";

/**
 * LAB — throwaway. Three hero concepts, sharing one brain model.
 *
 * Each takes a different position on what the model is *for*, which is the actual question:
 * today it is a decorative object floating beside the headline, refracting a grid nobody can
 * see. `3D_interaction.md` — reference, not source of truth — still lands the rule worth
 * keeping: the 3D has to visualise something, not float.
 */

export type HeroVariant = "specimen" | "lens" | "masthead";

/** Word-by-word mask reveal, the entrance `motion-system.md` asks for over a fade. */
function useHeroEntrance(rootRef: React.RefObject<HTMLElement | null>, key: string) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const words = root.querySelectorAll<HTMLElement>("[data-word] > span");
    const rest = root.querySelectorAll<HTMLElement>("[data-fade]");
    const rules = root.querySelectorAll<HTMLElement>("[data-rule]");

    if (reduced) {
      gsap.set(words, { yPercent: 0 });
      gsap.set(rest, { opacity: 1, y: 0 });
      gsap.set(rules, { scaleX: 1 });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.fromTo(words, { yPercent: 108 }, { yPercent: 0, duration: 1.15, stagger: 0.055 }, 0)
      .fromTo(rules, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "power3.out" }, 0.25)
      .fromTo(
        rest,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" },
        0.5,
      );
    return () => {
      tl.kill();
    };
  }, [rootRef, key]);
}

/** A line of type whose words each ride in a clipped column. */
function MaskedLine({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`block ${className ?? ""}`}>
      {text.split(" ").map((word, i) => (
        <span
          key={`${word}-${i}`}
          data-word
          className="mr-[0.26em] inline-block overflow-hidden pb-[0.08em] align-bottom"
        >
          <span className="inline-block will-change-transform">{word}</span>
        </span>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ specimen */

/**
 * SPECIMEN — the model is an object under examination, and the type annotates it.
 *
 * The glass refracts the studio's own words, which is the thing the current hero's
 * transmission is wasted on. Small mono annotations sit around the object like plate
 * captions, and the camera looks around it as the pointer moves rather than spinning it.
 */
function Specimen() {
  const ref = useRef<HTMLElement>(null);
  useHeroEntrance(ref, "specimen");

  return (
    <section
      ref={ref}
      className="relative isolate flex min-h-svh flex-col justify-center overflow-hidden bg-surface"
    >
      <LabBrainScene
        framing="center"
        backdrop="text"
        size={2.6}
        text={["WORTH", "REMEMBERING"]}
        orbit
        className="inset-0"
      />

      {/* Plate captions. Deliberately small and deliberately off the object — the type is
          the label, and the object is the exhibit. */}
      <div className="pointer-events-none relative z-10 flex flex-1 flex-col justify-between px-6 py-[14vh] md:px-[6vw]">
        <div className="flex items-start justify-between">
          <p
            data-fade
            className="max-w-[18ch] font-mono text-[0.625rem] uppercase leading-[1.7] tracking-[0.2em] text-ink"
          >
            Fig. 01 — one studio,
            <br />
            three disciplines
          </p>
          <p
            data-fade
            className="max-w-[22ch] text-right font-mono text-[0.625rem] uppercase leading-[1.7] tracking-[0.2em] text-ink"
          >
            {STUDIO_LOCATION}
          </p>
        </div>

        <div className="flex flex-col items-center gap-5 text-center">
          <span data-rule aria-hidden="true" className="block h-px w-[34vw] origin-center bg-[image:var(--gradient-accent)]" />
          <h1 className="text-[clamp(2.25rem,6.5vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.045em] text-ink">
            <MaskedLine text="Websites, videos and designs" />
            <MaskedLine text="worth remembering." />
          </h1>
          <p
            data-fade
            className="max-w-[46ch] text-[clamp(0.9375rem,1.35vw,1.125rem)] leading-[1.55] text-ink"
          >
            A small studio building websites, video and visual identity for brands who care
            how they&rsquo;re experienced.
          </p>
        </div>

        <div className="flex items-end justify-between font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ink">
          <span data-fade>Move to look around</span>
          <span data-fade>Scroll ↓</span>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------- lens */

/**
 * LENS — the hero is almost empty, and the cursor is the only way in.
 *
 * The headline sits in outline. Everything else — the model, the colour, the dispersion — is
 * behind a mask that only the pointer opens. `brand-guidelines.md` wants a visitor to feel
 * Curious first; this is the one concept where the page does not show its hand until it is
 * touched.
 *
 * The reveal is a CSS mask driven by two custom properties, so a pointer move costs one
 * composited repaint and never touches layout.
 */
function Lens() {
  const ref = useRef<HTMLElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  useHeroEntrance(ref, "lens");

  useEffect(() => {
    const host = maskRef.current;
    if (!host) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // No pointer, or no motion wanted: the scene is simply open. The effect is a reward for
    // having a cursor, never a requirement for seeing the page.
    if (!fine || reduced) {
      host.style.setProperty("--r", "140%");
      return;
    }

    const target = { x: 0.5, y: 0.5, r: 0 };
    const shown = { x: 0.5, y: 0.5, r: 0 };
    let rafId = 0;

    const onMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      target.x = (event.clientX - rect.left) / rect.width;
      target.y = (event.clientY - rect.top) / rect.height;
      target.r = 26;
    };
    const onLeave = () => {
      target.r = 0;
    };

    const loop = () => {
      shown.x += (target.x - shown.x) * 0.12;
      shown.y += (target.y - shown.y) * 0.12;
      shown.r += (target.r - shown.r) * 0.07;
      host.style.setProperty("--x", `${(shown.x * 100).toFixed(2)}%`);
      host.style.setProperty("--y", `${(shown.y * 100).toFixed(2)}%`);
      host.style.setProperty("--r", `${shown.r.toFixed(2)}vmax`);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section
      ref={ref}
      className="relative isolate flex min-h-svh items-center overflow-hidden bg-surface"
    >
      {/* The scene, behind a mask the pointer opens. */}
      <div
        ref={maskRef}
        className="absolute inset-0"
        style={{
          ["--x" as string]: "50%",
          ["--y" as string]: "50%",
          ["--r" as string]: "0vmax",
          maskImage:
            "radial-gradient(circle var(--r) at var(--x) var(--y), #000 0%, #000 58%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(circle var(--r) at var(--x) var(--y), #000 0%, #000 58%, transparent 100%)",
        }}
      >
        <LabBrainScene
          framing="center"
          backdrop="chroma"
          size={3.0}
          orbit={false}
          className="inset-0"
        />
      </div>

      <div className="pointer-events-none relative z-10 w-full px-6 md:px-[6vw]">
        <h1
          className="text-[clamp(2.5rem,11vw,10rem)] font-semibold leading-[0.88] tracking-[-0.055em]"
          // Outline type, so the mask underneath is what fills it in. The fill is
          // transparent and the stroke carries the letterform.
          style={{
            color: "transparent",
            WebkitTextStroke: "1px var(--color-ink)",
          }}
        >
          <MaskedLine text="Worth" />
          <MaskedLine text="Remembering." />
        </h1>
        <div className="mt-[5vh] flex flex-wrap items-end justify-between gap-6">
          <p
            data-fade
            className="max-w-[34ch] text-[clamp(0.9375rem,1.35vw,1.125rem)] leading-[1.55] text-ink"
          >
            Websites, video and visual identity — from one studio in {STUDIO_LOCATION}.
          </p>
          <p
            data-fade
            className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ink"
          >
            Move your cursor →
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ masthead */

/**
 * MASTHEAD — a magazine cover. A hard vertical split, display type as the left column, the
 * model in its own aperture on the right.
 *
 * The most `design-principles.md` Principle 6 of the three: strong typography, structured
 * layout, a grid broken on purpose. The two panes parallax against each other, which is the
 * only depth cue used and the only thing the pointer does.
 */
function Masthead() {
  const ref = useRef<HTMLElement>(null);
  useHeroEntrance(ref, "masthead");

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const type = root.querySelector("[data-pane-type]");
    const aperture = root.querySelector("[data-pane-aperture]");
    if (!type || !aperture) return;

    const onMove = (event: PointerEvent) => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      // Opposed, and small. `motion-system.md` puts parallax at 5–20% and prefers subtle;
      // opposing the two panes doubles the apparent depth for half the movement each.
      gsap.to(type, { x: x * -18, y: y * -10, duration: 0.9, ease: "power3.out", overwrite: true });
      gsap.to(aperture, { x: x * 26, y: y * 14, duration: 0.9, ease: "power3.out", overwrite: true });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <section
      ref={ref}
      className="relative isolate min-h-svh overflow-hidden bg-surface pt-[24vh] md:pt-[18vh]"
    >
      <div className="grid min-h-[70svh] grid-cols-1 items-stretch gap-8 px-6 md:grid-cols-[1.55fr_1fr] md:gap-[4vw] md:px-[6vw]">
        <div data-pane-type className="flex flex-col justify-between">
          <h1 className="text-[clamp(2.75rem,8.5vw,8rem)] font-semibold leading-[0.86] tracking-[-0.055em] text-ink">
            <MaskedLine text="Websites." />
            <MaskedLine text="Video." />
            <MaskedLine text="Design." />
          </h1>
          <div className="mt-[6vh] flex flex-col gap-5">
            <span data-rule aria-hidden="true" className="block h-px w-full origin-left bg-[image:var(--gradient-accent)]" />
            <div className="flex flex-wrap items-start justify-between gap-6">
              <p
                data-fade
                className="max-w-[38ch] text-[clamp(1rem,1.5vw,1.25rem)] font-medium leading-[1.45] tracking-[-0.015em] text-ink"
              >
                One studio, no hand-offs. We build the thing, shoot the thing, and make it
                look like itself.
              </p>
              <p
                data-fade
                className="font-mono text-[0.625rem] uppercase leading-[1.7] tracking-[0.2em] text-ink"
              >
                Est. {STUDIO_LOCATION}
                <br />
                Scroll ↓
              </p>
            </div>
          </div>
        </div>

        {/* The aperture. A panel the model lives inside, so the right column is a window
            rather than a background — the model has an edge to be contained by, which is
            what stops it floating. */}
        <div
          data-pane-aperture
          className="relative min-h-[42svh] overflow-hidden rounded-[2px] bg-panel md:min-h-0"
        >
          <LabBrainScene
            framing="center"
            backdrop="grid"
            size={2.3}
            orbit
            className="inset-0"
          />
          <span className="absolute bottom-3 left-3 font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-ink opacity-50">
            Fig. 01
          </span>
        </div>
      </div>
    </section>
  );
}

export function LabHero({ variant }: { variant: HeroVariant }) {
  if (variant === "specimen") return <Specimen />;
  if (variant === "lens") return <Lens />;
  return <Masthead />;
}
