"use client";

import { Fragment, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CARD_TILTS_DEG,
  STACK_BREAKPOINT_PX,
  arrivalProgress,
  cardTransform,
  isFrontCard,
} from "@/lib/motion/draft-stack";
import { clampProgress } from "@/lib/motion/scroll-progress";
import { DraftCard, type Draft } from "./spine/DraftCard";

/**
 * One job, three drafts, one pile. The stamp reads OURS on 01 and 02 and disappears on 03,
 * which states the closing line before the visitor reads it.
 */
const DRAFTS: Draft[] = [
  {
    rail: "Draft 01 · Imagine",
    day: "Day 004",
    stamp: "Ours",
    owned: true,
    word: "Imagine.",
    body: "We start with an argument, not a mood board. What is this for? Who has to feel something?",
    note: [
      { lead: "Q.", text: "What happens if we do nothing at all?" },
      { text: "Open Figma, start a moodboard", struck: true },
    ],
    slotLabel: "Draft 01 · artefact",
  },
  {
    rail: "Draft 02 · Build",
    day: "Day 031",
    stamp: "Ours",
    owned: true,
    word: "Build.",
    body: "The people who imagined it are the people who build it. We removed the hand-off, because nothing survives one intact.",
    note: [
      { text: "Brief the build team", struck: true },
      { lead: "—", text: "There is no build team. There is the team." },
    ],
    slotLabel: "Draft 02 · artefact",
  },
  {
    rail: "Draft 03 · Inspire",
    day: "Day 058 — handed over",
    stamp: "Not ours",
    owned: false,
    word: "Inspire.",
    body: "Then we leave. It has to work without us — on a Tuesday, on a bad connection, on someone else's phone.",
    note: [{ text: "No notes." }, { lead: "—", text: "That's the whole test." }],
    slotLabel: "Draft 03 · artefact",
  },
];

/** Scroll distance after each card before the next one arrives. */
const CARD_GAPS = ["30vh", "30vh", "14vh"];

export function Spine() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const cards = Array.from(section.querySelectorAll<HTMLElement>("[data-draft-card]"));
    const bodies = Array.from(section.querySelectorAll<HTMLElement>("[data-draft-body]"));
    // Zero-height siblings sitting at each card's flow position. The cards themselves are
    // sticky, so their own measured position shifts as they stick; the markers do not.
    const markers = Array.from(section.querySelectorAll<HTMLElement>("[data-draft-marker]"));
    const header = headerRef.current;
    if (!cards.length) return;

    const mm = gsap.matchMedia();

    mm.add(
      `(min-width: ${STACK_BREAKPOINT_PX}px) and (prefers-reduced-motion: no-preference)`,
      () => {
        let markerTops: number[] = [];
        let sectionTop = 0;

        // Measured on refresh only, so the scroll handler reads no layout at all.
        const measure = () => {
          const scrollY = window.scrollY;
          markerTops = markers.map((marker) => marker.getBoundingClientRect().top + scrollY);
          sectionTop = section.getBoundingClientRect().top + scrollY;
        };

        const update = () => {
          const viewportHeight = window.innerHeight;
          const scrollTop = window.scrollY;
          const arrivals = markerTops.map((top) =>
            arrivalProgress(scrollTop, top, viewportHeight),
          );

          cards.forEach((card, index) => {
            const arrival = arrivals[index];
            const covered = arrivals[index + 1] ?? 0;
            const next = cardTransform(
              arrival,
              covered,
              CARD_TILTS_DEG[index] ?? 0,
              viewportHeight,
            );

            gsap.set(card, {
              y: next.y,
              rotation: next.rotate,
              scale: next.scale,
              opacity: next.opacity,
            });
            if (bodies[index]) gsap.set(bodies[index], { opacity: next.bodyOpacity });

            // Buried cards must not answer the pointer, or their 17px peeking strip would
            // open a reveal happening entirely out of sight.
            card.style.pointerEvents = isFrontCard(arrival, covered) ? "auto" : "none";
          });

          if (header) {
            const headerProgress = clampProgress(
              (scrollTop - sectionTop) / (viewportHeight * 0.8),
            );
            gsap.set(header, {
              opacity: 1 - headerProgress * 0.85,
              y: -headerProgress * viewportHeight * 0.1,
            });
          }
        };

        const trigger = ScrollTrigger.create({
          id: "spine-drafts",
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          onRefresh: () => {
            measure();
            update();
          },
          onUpdate: update,
        });

        return () => {
          trigger.kill();
          cards.forEach((card) => {
            card.style.pointerEvents = "";
          });
        };
      },
    );

    // Below the breakpoint the cards do not stack, so depth falloff would dim cards that are
    // still fully visible. Motion adapts rather than disappears: a plain staggered entrance.
    mm.add(
      `(max-width: ${STACK_BREAKPOINT_PX - 1}px) and (prefers-reduced-motion: no-preference)`,
      () => {
        const tweens = cards.map((card) =>
          gsap.fromTo(
            card,
            { opacity: 0, y: 28 },
            {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: "expo.out",
              scrollTrigger: {
                trigger: card,
                start: "top 88%",
                toggleActions: "play none none reverse",
              },
            },
          ),
        );

        return () => {
          tweens.forEach((tween) => {
            tween.scrollTrigger?.kill();
            tween.kill();
          });
        };
      },
    );

    return () => {
      mm.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} id="about" className="relative isolate bg-surface">
      <div
        ref={headerRef}
        className="flex flex-col justify-center gap-4.5 px-6 py-[14vh] md:px-[6vw] min-[820px]:h-[80vh] min-[820px]:py-0"
      >
        <p className="m-0 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-ink-muted">
          Section 02 — The spine
        </p>
        <h2 className="m-0 text-[clamp(2rem,5.2vw,4rem)] font-semibold leading-none tracking-[-0.04em] text-ink">
          Imagine. Build. Inspire.
        </h2>
        <p className="m-0 max-w-[36ch] text-[0.9375rem] leading-[1.75] text-ink-muted">
          One job, three drafts, one pile. Nobody hands it to anybody.
        </p>
      </div>

      <div className="relative px-4 md:px-[3.4vw]">
        {DRAFTS.map((draft, index) => (
          <Fragment key={draft.rail}>
            <div data-draft-marker aria-hidden="true" className="h-0" />
            <DraftCard
              draft={draft}
              top={`calc(11vh + ${index * 17}px)`}
              gap={CARD_GAPS[index]}
              zIndex={3 + index}
            />
          </Fragment>
        ))}
      </div>

      <div className="relative z-6 flex items-center px-6 py-[16vh] md:px-[6vw] min-[820px]:h-[84vh] min-[820px]:py-0">
        <p className="m-0 max-w-[20ch] text-[clamp(1.3rem,3vw,2.3rem)] font-semibold leading-[1.22] tracking-[-0.035em] text-ink">
          Imagine and Build are ours. <span className="text-ink-muted">Inspire is yours.</span>
        </p>
      </div>
    </section>
  );
}
