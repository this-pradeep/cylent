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
    id: "specimen",
    name: "Specimen",
    nav: "plate",
    note: "The model is an exhibit and the glass refracts the headline itself. Type annotates it like plate captions. Pointer looks around the object rather than spinning it.",
  },
  {
    id: "lens",
    name: "Lens",
    nav: "letters",
    note: "Outline type on an almost empty page. The model, the colour and the dispersion are behind a mask only the cursor opens. Nothing is shown until the page is touched.",
  },
  {
    id: "masthead",
    name: "Masthead",
    nav: "masthead",
    note: "A magazine cover. Display type as the left column, the model in its own aperture on the right. The two panes parallax in opposition.",
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
