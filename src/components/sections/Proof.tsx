"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ImageAsset } from "@/components/ImageAsset";

const PROJECTS = [
  {
    name: "Project One",
    challenge: "A boutique hospitality group with an inconsistent digital presence across three properties.",
    process: "Unified brand identity, then a fast, image-led website built around each property's character.",
    solution: "One design system, three distinct property sites, shared component library.",
    result: "Consistent premium presence across every guest touchpoint.",
    // Unsplash License (unsplash.com/photo-1758193783649-13371d7fb8dd)
    image: { src: "/images/proof-project-one-hotel.jpg", alt: "Elegant boutique hotel lobby interior" },
  },
  {
    name: "Project Two",
    challenge: "A product launch with strong technology but no visual story to match it.",
    process: "Combined brand photography, launch video, and a performance-first marketing site.",
    solution: "A single campaign built from one creative direction across web, video, and stills.",
    result: "A launch that felt like one story, not three separate deliverables.",
    // Unsplash License (unsplash.com/photo-1758846946191-dfe1cd91779b)
    image: { src: "/images/proof-project-two-architecture.jpg", alt: "Modern glass building facade reflecting the sky" },
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
          <ImageAsset src={project.image.src} alt={project.image.alt} aspectRatio="16:9" />
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
