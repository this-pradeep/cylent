"use client";

import { useEffect, useState } from "react";
import { LabHero, type HeroVariant } from "@/components/lab/LabHero";
import { LabNav, type NavVariant } from "@/components/lab/LabNav";

/**
 * LAB — throwaway. A switcher so hero and navbar concepts can be looked at in the real
 * stack, with the real model, the real tokens and the real type, rather than judged from a
 * description.
 *
 * Delete `src/app/lab` and `src/components/lab` once a direction is chosen. Nothing else
 * imports either.
 */

const HEROES: { id: HeroVariant; name: string; nav: NavVariant; note: string }[] = [
  {
    id: "displace",
    name: "Displace",
    nav: "plate",
    note: "Three lines at 11vw, model large behind them and deliberately occluded by the type. CURSOR: the words physically push away from your pointer and spring back. SCROLL: each line leaves at its own rate while the model recedes.",
  },
  {
    id: "drift",
    name: "Drift",
    nav: "letters",
    note: "One line at 15vw, wider than the screen and not meant to fit. CURSOR: the type skews with pointer VELOCITY — move slowly, nothing; flick, it leans and recovers. SCROLL: the two lines shear apart horizontally.",
  },
  {
    id: "stack",
    name: "Stack",
    nav: "masthead",
    note: "A staircase of four short lines; the model sits in the triangle of empty paper the indents open. CURSOR: your pointer is the light source and the shadow swings away from it. SCROLL: the staircase spreads open as it leaves.",
  },
];

export default function HeroLabPage() {
  const [index, setIndex] = useState(0);
  const [navOverride, setNavOverride] = useState<NavVariant | null>(null);
  const current = HEROES[index];
  const nav = navOverride ?? current.nav;

  // Number keys switch concepts, so the three can be flicked between while looking at the
  // same spot on the page.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const n = Number(event.key);
      if (n >= 1 && n <= HEROES.length) setIndex(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <LabNav key={`nav-${nav}`} variant={nav} />
      <main>
        <LabHero key={`hero-${current.id}`} variant={current.id} />
        {/* Something to scroll into, so the navbar's scrolled state can be judged. */}
        <section className="flex min-h-[70svh] items-start bg-paper px-6 py-[14vh] md:px-[6vw]">
          <p className="max-w-[40ch] text-[clamp(1rem,1.5vw,1.25rem)] leading-[1.5] text-ink">
            Scroll past the fold to see what each navbar does. The plate fades in a blurred
            ground, the letters shrink, and the masthead collapses to a single line.
          </p>
        </section>
      </main>

      {/* The switcher. Fixed, dark, deliberately not in the brand's language so it is never
          mistaken for part of the design being judged. */}
      <div className="fixed bottom-4 left-1/2 z-[100] w-[min(92vw,44rem)] -translate-x-1/2 rounded-2xl bg-[#14120f] p-3 text-[#faf9f7] shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
        <div className="flex flex-wrap items-center gap-2">
          {HEROES.map((hero, i) => (
            <button
              key={hero.id}
              type="button"
              onClick={() => {
                setIndex(i);
                setNavOverride(null);
              }}
              className="rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold transition-colors"
              style={{
                backgroundColor: i === index ? "#faf9f7" : "rgba(250,249,247,0.1)",
                color: i === index ? "#14120f" : "#faf9f7",
              }}
            >
              {i + 1}. {hero.name}
            </button>
          ))}
          <span className="ml-auto font-mono text-[0.5625rem] uppercase tracking-[0.18em] opacity-50">
            keys 1–3
          </span>
        </div>

        <p className="mt-2.5 text-[0.75rem] leading-[1.5] opacity-70">{current.note}</p>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-2.5">
          <span className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] opacity-50">
            Navbar
          </span>
          {(["plate", "letters", "masthead"] as NavVariant[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setNavOverride(option)}
              className="rounded-full px-2.5 py-1 text-[0.6875rem] font-medium capitalize transition-colors"
              style={{
                backgroundColor: nav === option ? "rgba(250,249,247,0.9)" : "rgba(250,249,247,0.1)",
                color: nav === option ? "#14120f" : "#faf9f7",
              }}
            >
              {option}
            </button>
          ))}
          <span className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] opacity-40">
            mix any nav with any hero
          </span>
        </div>
      </div>
    </>
  );
}
