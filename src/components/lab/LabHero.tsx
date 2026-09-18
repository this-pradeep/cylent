"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LabBrainScene } from "@/components/lab/LabBrainScene";

/**
 * LAB — throwaway. Three hero concepts, second pass.
 *
 * The first pass was centre-aligned, captioned with `Fig. 01` plate labels and set in mono —
 * an archival register, and the one the studio had already rejected once. Current
 * award-listed agency work is consistently the opposite: type-first, asymmetric, editorial
 * grids, headlines at 80–120px, negative space carrying the composition, and explicitly away
 * from centre-aligned templates.
 *
 * So all three below are type-first and asymmetric, carry no label furniture at all, and each
 * is built on one distinct tactile idea rather than on a layout gimmick:
 *
 *   1. DISPLACE  — the words physically move away from the cursor
 *   2. DRIFT     — an oversized line the scroll pulls sideways, skewing with velocity
 *   3. STACK     — a staircase of lines that spreads as you scroll, the model in its gap
 *
 * All three parallax on scroll with per-layer rates, which is what `motion-system.md` means
 * by depth through layering rather than through effects.
 */

gsap.registerPlugin(ScrollTrigger);

export type HeroVariant = "displace" | "drift" | "stack";

/**
 * Film grain, as a data URI so it costs no request.
 *
 * `design-principles.md` warns off decorative effects, and this is not one: a flat expanse of
 * #faf9f7 reads as a screen, and the same expanse with a trace of grain reads as paper. It is
 * the cheapest material cue available and the difference is the whole gap between a page and
 * a printed thing.
 */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E\")";

function Grain() {
  return (
    <span
      aria-hidden="true"
      // No mix-blend-mode, deliberately. Multiply looks marginally more like ink in paper,
      // but a blended layer cannot be composited apart from its backdrop — and the backdrop
      // here is a WebGL canvas redrawing every frame, so it would re-blend the whole
      // viewport on every tick. That is the same mechanism that made the old About section
      // stutter. A plain low-opacity overlay gets its own layer and costs nothing.
      className="pointer-events-none absolute inset-0 z-20 opacity-[0.05]"
      style={{ backgroundImage: GRAIN, backgroundSize: "160px 160px" }}
    />
  );
}

/** True when the visitor has a real pointer and wants motion. */
function interactive(): boolean {
  return (
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * The entrance. Lines rise out of their own clipping boxes, which is the reveal
 * `motion-system.md` asks for in place of a fade.
 */
function useEntrance(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const lines = root.querySelectorAll<HTMLElement>("[data-line] > span");
    const rest = root.querySelectorAll<HTMLElement>("[data-fade]");
    const rules = root.querySelectorAll<HTMLElement>("[data-rule]");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(lines, { yPercent: 0 });
      gsap.set(rest, { opacity: 1, y: 0 });
      gsap.set(rules, { scaleX: 1 });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.fromTo(lines, { yPercent: 112 }, { yPercent: 0, duration: 1.25, stagger: 0.09 }, 0)
      .fromTo(rules, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "power3.out" }, 0.4)
      .fromTo(
        rest,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: "power3.out" },
        0.65,
      );
    return () => {
      tl.kill();
    };
  }, [rootRef]);
}

/**
 * Per-layer scroll parallax.
 *
 * Every layer leaves at its own rate, so the hero comes apart as it goes rather than sliding
 * away in one piece. That separation is the depth — nothing here is scaled or blurred to fake
 * it.
 */
function useScrollParallax(
  rootRef: React.RefObject<HTMLElement | null>,
  layers: { selector: string; y: number; scale?: number }[],
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tweens = layers.flatMap(({ selector, y, scale }) => {
      const targets = Array.from(root.querySelectorAll<HTMLElement>(selector));
      if (!targets.length) return [];
      return [
        gsap.to(targets, {
          yPercent: y,
          ...(scale === undefined ? {} : { scale }),
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        }),
      ];
    });

    return () => {
      for (const tween of tweens) {
        tween.scrollTrigger?.kill();
        tween.kill();
      }
    };
  }, [rootRef, layers]);
}

/* ------------------------------------------------------------------ displace */

/**
 * DISPLACE — the words get out of the cursor's way.
 *
 * The headline is the composition: three left-aligned lines at 11vw with the model sitting
 * large behind them, deliberately occluded by the type. Overlap is the depth cue, and letting
 * the type cross the object is what stops the object reading as a sticker beside a headline.
 *
 * The cursor pushes each word aside by an amount that falls off with distance, and the words
 * spring back. It is the most physical thing on the site and it makes an otherwise still hero
 * feel alive under the hand.
 */
function Displace() {
  const ref = useRef<HTMLElement>(null);
  useEntrance(ref);
  useScrollParallax(ref, [
    { selector: "[data-p-1]", y: -26 },
    { selector: "[data-p-2]", y: -17 },
    { selector: "[data-p-3]", y: -9 },
    { selector: "[data-p-foot]", y: -4 },
    // The model leaves slowest and shrinks a touch, so it recedes as the type overtakes it.
    { selector: "[data-p-model]", y: 12, scale: 0.93 },
  ]);

  useEffect(() => {
    const root = ref.current;
    if (!root || !interactive()) return;

    const words = Array.from(root.querySelectorAll<HTMLElement>("[data-word]"));
    // quickTo keeps one interpolator per property per element, so a pointer move mutates a
    // running tween instead of queueing a new one per frame.
    const movers = words.map((word) => ({
      el: word,
      x: gsap.quickTo(word, "x", { duration: 0.55, ease: "power3.out" }),
      y: gsap.quickTo(word, "y", { duration: 0.55, ease: "power3.out" }),
    }));

    const RADIUS = 190;
    const PUSH = 34;

    const onMove = (event: PointerEvent) => {
      for (const mover of movers) {
        const rect = mover.el.getBoundingClientRect();
        const dx = rect.left + rect.width / 2 - event.clientX;
        const dy = rect.top + rect.height / 2 - event.clientY;
        const distance = Math.hypot(dx, dy);
        if (distance > RADIUS) {
          mover.x(0);
          mover.y(0);
          continue;
        }
        // Falls off toward the edge of the radius, so a word never snaps as the cursor
        // crosses the threshold.
        const force = (1 - distance / RADIUS) ** 2 * PUSH;
        mover.x((dx / (distance || 1)) * force);
        mover.y((dy / (distance || 1)) * force);
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <section
      ref={ref}
      className="relative isolate flex min-h-svh flex-col justify-end overflow-hidden bg-surface pb-[9vh]"
    >
      <div data-p-model className="absolute inset-0">
        <LabBrainScene
          framing="right"
          backdrop="text"
          size={3.4}
          text={["WORTH", "REMEMBERING"]}
          orbit={false}
          className="inset-0"
        />
        {/* Grounding shadow. An object with no shadow floats, and floating is the thing that
            made the old hero read as a stock 3D asset dropped on a page. */}
        <span
          aria-hidden="true"
          className="absolute left-[58%] top-[62%] h-[16vh] w-[42vw] -translate-x-1/2 rounded-[50%] opacity-[0.09] blur-2xl"
          style={{ background: "radial-gradient(ellipse, var(--color-ink), transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 px-6 md:px-[6vw]">
        <h1 className="text-[clamp(3rem,11vw,10.5rem)] font-semibold leading-[0.84] tracking-[-0.055em] text-ink">
          {[
            { text: "Websites,", p: "data-p-1" },
            { text: "videos and designs", p: "data-p-2" },
            { text: "worth remembering.", p: "data-p-3" },
          ].map((line) => (
            <span
              key={line.text}
              data-line
              {...{ [line.p]: true }}
              className="block overflow-hidden pb-[0.06em]"
            >
              <span className="block will-change-transform">
                {line.text.split(" ").map((word, i) => (
                  <span
                    key={`${word}-${i}`}
                    data-word
                    className="mr-[0.22em] inline-block will-change-transform"
                  >
                    {word}
                  </span>
                ))}
              </span>
            </span>
          ))}
        </h1>

        <div
          data-p-foot
          className="mt-[6vh] flex flex-wrap items-end justify-between gap-6"
        >
          <p
            data-fade
            className="max-w-[40ch] text-[clamp(1rem,1.5vw,1.3125rem)] font-medium leading-[1.45] tracking-[-0.015em] text-ink"
          >
            One studio for the build, the film and the identity. No hand-offs, no
            translation loss.
          </p>
          <p data-fade className="text-[0.9375rem] font-medium text-ink opacity-50">
            Scroll
          </p>
        </div>
      </div>

      <Grain />
    </section>
  );
}

/* --------------------------------------------------------------------- drift */

/**
 * DRIFT — one line, wider than the screen, pulled sideways by the scroll.
 *
 * The headline is a single enormous line that does not fit and is not meant to. Scrolling
 * pulls it horizontally while the second line pulls the other way, so the hero shears apart
 * as you leave it. The model sits between the two lines, in the only still part of the frame.
 *
 * The cursor's contribution is skew driven by pointer *velocity* rather than position: move
 * slowly and nothing happens, move fast and the type leans and recovers. A hero that responds
 * to how you move, not just where you are.
 */
function Drift() {
  const ref = useRef<HTMLElement>(null);
  useEntrance(ref);
  useScrollParallax(ref, [
    { selector: "[data-p-model]", y: 8, scale: 0.95 },
    { selector: "[data-p-foot]", y: -6 },
  ]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Horizontal drift is its own scrub, because it moves on x where the parallax helper
    // moves layers on y.
    const lineA = root.querySelector("[data-drift-a]");
    const lineB = root.querySelector("[data-drift-b]");
    const tweens: gsap.core.Tween[] = [];
    if (lineA && lineB) {
      const options = {
        ease: "none" as const,
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true,
        },
      };
      tweens.push(gsap.to(lineA, { xPercent: -12, ...options }));
      tweens.push(gsap.to(lineB, { xPercent: 10, ...options }));
    }

    let skewCleanup: (() => void) | undefined;
    if (interactive()) {
      const type = root.querySelectorAll<HTMLElement>("[data-skew]");
      const setSkew = gsap.quickTo(type, "skewX", { duration: 0.7, ease: "power3.out" });
      let lastX = 0;
      let lastT = 0;

      const onMove = (event: PointerEvent) => {
        const now = performance.now();
        const dt = Math.max(1, now - lastT);
        // Pixels per millisecond, clamped. Unclamped it spikes hard on a flick and the type
        // snaps rather than leans.
        const velocity = (event.clientX - lastX) / dt;
        lastX = event.clientX;
        lastT = now;
        setSkew(gsap.utils.clamp(-9, 9, -velocity * 5));
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      // Recovers to upright whenever the pointer is still, so the lean never sticks.
      const settle = window.setInterval(() => {
        if (performance.now() - lastT > 90) setSkew(0);
      }, 120);

      skewCleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.clearInterval(settle);
      };
    }

    return () => {
      for (const tween of tweens) {
        tween.scrollTrigger?.kill();
        tween.kill();
      }
      skewCleanup?.();
    };
  }, []);

  return (
    <section
      ref={ref}
      className="relative isolate flex min-h-svh flex-col justify-center overflow-hidden bg-surface"
    >
      <div data-p-model className="absolute inset-0">
        <LabBrainScene
          framing="center"
          backdrop="grid"
          size={2.8}
          orbit
          className="inset-0"
        />
      </div>

      <div className="relative z-10 flex flex-col gap-[3vh]">
        {/* Deliberately past the edge. A line that runs off the frame reads as confident;
            a line shrunk to fit reads as cautious. */}
        <span
          data-drift-a
          data-line
          data-skew
          className="block overflow-hidden whitespace-nowrap pb-[0.06em] pl-6 will-change-transform md:pl-[6vw]"
        >
          <span className="block text-[clamp(3.5rem,15vw,16rem)] font-semibold leading-[0.8] tracking-[-0.06em] text-ink will-change-transform">
            Worth Remembering
          </span>
        </span>

        <span
          data-drift-b
          data-line
          data-skew
          className="block overflow-hidden whitespace-nowrap pb-[0.06em] pl-[22vw] will-change-transform"
        >
          <span className="block text-[clamp(3.5rem,15vw,16rem)] font-semibold leading-[0.8] tracking-[-0.06em] text-ink opacity-[0.16] will-change-transform">
            Worth Remembering
          </span>
        </span>
      </div>

      <div
        data-p-foot
        className="absolute inset-x-0 bottom-[8vh] z-10 flex flex-wrap items-end justify-between gap-6 px-6 md:px-[6vw]"
      >
        <p
          data-fade
          className="max-w-[36ch] text-[clamp(1rem,1.5vw,1.3125rem)] font-medium leading-[1.45] tracking-[-0.015em] text-ink"
        >
          Websites, video and visual identity — built by one studio that does all three.
        </p>
        <p data-fade className="text-[0.9375rem] font-medium text-ink opacity-50">
          Scroll
        </p>
      </div>

      <Grain />
    </section>
  );
}

/* --------------------------------------------------------------------- stack */

/**
 * STACK — a staircase of lines, and the model in the gap the staircase leaves.
 *
 * Four short lines, each indented further than the last. The indent is what makes the
 * composition asymmetric, and the triangle of empty paper it opens on the right is not
 * leftover space — it is where the object goes. The layout makes the hole; the model fills
 * it. `design-principles.md` Principle 3: the white space is doing the work.
 *
 * On scroll the staircase *spreads* — each line slides further right than the one above — so
 * the composition opens out as it leaves rather than merely translating.
 *
 * The cursor moves a light source. The model's shadow swings opposite the pointer, which is
 * the cue that reads as a real object on a real surface.
 */
function Stack() {
  const ref = useRef<HTMLElement>(null);
  useEntrance(ref);
  useScrollParallax(ref, [
    { selector: "[data-p-model]", y: -14, scale: 1.04 },
    { selector: "[data-p-foot]", y: -5 },
  ]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tweens: gsap.core.Tween[] = [];

    if (!reduced) {
      // The spread. Each line takes a larger share, so the staircase widens rather than
      // sliding as a block.
      const lines = Array.from(root.querySelectorAll<HTMLElement>("[data-stair]"));
      lines.forEach((line, i) => {
        tweens.push(
          gsap.to(line, {
            x: () => window.innerWidth * 0.035 * i,
            yPercent: -8 - i * 3,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          }),
        );
      });
    }

    let shadowCleanup: (() => void) | undefined;
    if (interactive()) {
      const shadow = root.querySelector<HTMLElement>("[data-shadow]");
      if (shadow) {
        const x = gsap.quickTo(shadow, "x", { duration: 0.8, ease: "power2.out" });
        const y = gsap.quickTo(shadow, "y", { duration: 0.8, ease: "power2.out" });
        const onMove = (event: PointerEvent) => {
          // Opposite the pointer: the cursor is the lamp, so the shadow falls away from it.
          x((0.5 - event.clientX / window.innerWidth) * 120);
          y((0.5 - event.clientY / window.innerHeight) * 40);
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        shadowCleanup = () => window.removeEventListener("pointermove", onMove);
      }
    }

    return () => {
      for (const tween of tweens) {
        tween.scrollTrigger?.kill();
        tween.kill();
      }
      shadowCleanup?.();
    };
  }, []);

  return (
    <section
      ref={ref}
      className="relative isolate flex min-h-svh flex-col justify-center overflow-hidden bg-surface"
    >
      {/* Parked in the triangle the staircase opens: upper right, clear of every line. */}
      <div data-p-model className="absolute inset-0">
        <LabBrainScene
          framing="right"
          backdrop="text"
          size={2.4}
          text={["ONE", "STUDIO"]}
          orbit
          className="inset-0 bottom-[30%] md:bottom-[22%]"
        />
        <span
          data-shadow
          aria-hidden="true"
          className="absolute right-[8%] top-[46%] h-[10vh] w-[26vw] rounded-[50%] opacity-[0.11] blur-2xl will-change-transform"
          style={{ background: "radial-gradient(ellipse, var(--color-ink), transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 px-6 md:px-[6vw]">
        <h1 className="text-[clamp(2.5rem,8.5vw,8rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-ink">
          {["We build.", "We film.", "We design.", "One studio."].map((line, i) => (
            <span
              key={line}
              data-stair
              className="block will-change-transform"
              // The staircase. Each line starts further in than the last, which is the whole
              // asymmetry of the composition.
              style={{ paddingLeft: `${i * 7}%` }}
            >
              <span data-line className="block overflow-hidden pb-[0.06em]">
                <span
                  className="block will-change-transform"
                  // The last line is the claim the first three earn, so it is the only one
                  // that takes the accent.
                  style={
                    i === 3
                      ? {
                          backgroundImage: "var(--gradient-accent)",
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          color: "transparent",
                        }
                      : undefined
                  }
                >
                  {line}
                </span>
              </span>
            </span>
          ))}
        </h1>

        <div data-p-foot className="mt-[7vh] flex flex-col gap-5">
          <span
            data-rule
            aria-hidden="true"
            className="block h-px w-full origin-left bg-[image:var(--gradient-accent)]"
          />
          <div className="flex flex-wrap items-start justify-between gap-6">
            <p
              data-fade
              className="max-w-[38ch] text-[clamp(1rem,1.5vw,1.3125rem)] font-medium leading-[1.45] tracking-[-0.015em] text-ink"
            >
              Websites, video and visual identity for brands who care how they&rsquo;re
              experienced.
            </p>
            <p data-fade className="text-[0.9375rem] font-medium text-ink opacity-50">
              Scroll
            </p>
          </div>
        </div>
      </div>

      <Grain />
    </section>
  );
}

export function LabHero({ variant }: { variant: HeroVariant }) {
  if (variant === "displace") return <Displace />;
  if (variant === "drift") return <Drift />;
  return <Stack />;
}
