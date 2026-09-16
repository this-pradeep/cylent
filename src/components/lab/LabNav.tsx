"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { NAV_LINKS, CONTACT_LINK } from "@/lib/site/nav-links";
import { Logo } from "@/components/Logo";

/**
 * LAB — throwaway. Three navbar treatments, to be compared beside the hero concepts.
 *
 * All three exist because the current navbar is the most template-shaped thing on the site:
 * a centred floating pill with a rounded shadow is the default agency chrome of the moment,
 * and `design-principles.md` asks for layouts that feel designed rather than assembled.
 */

export type NavVariant = "plate" | "letters" | "masthead";

/** A link whose letters stagger on hover. Cheap, and it makes the nav feel handled. */
function StaggerLink({
  label,
  className,
  index,
}: {
  label: string;
  className?: string;
  index?: number;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const letters = el.querySelectorAll<HTMLElement>("[data-letter] > span");

    const enter = () =>
      gsap.to(letters, {
        yPercent: -100,
        duration: 0.34,
        ease: "power3.out",
        stagger: 0.018,
        overwrite: true,
      });
    const leave = () =>
      gsap.to(letters, {
        yPercent: 0,
        duration: 0.34,
        ease: "power3.out",
        stagger: 0.018,
        overwrite: true,
      });

    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <a ref={ref} href="#" className={`group relative inline-flex ${className ?? ""}`}>
      {typeof index === "number" && (
        <span className="mr-1.5 font-mono text-[0.5rem] tabular-nums opacity-40">
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      {/* Each letter is a two-deep column clipped to one line height. The copy underneath
          is what rises into place, so the label is never briefly absent. */}
      {label.split("").map((char, i) => (
        <span
          key={`${char}-${i}`}
          data-letter
          aria-hidden="true"
          className="relative block h-[1.15em] overflow-hidden"
        >
          <span className="block will-change-transform">
            <span className="block">{char}</span>
            <span className="block text-accent">{char}</span>
          </span>
        </span>
      ))}
      <span className="sr-only">{label}</span>
    </a>
  );
}

export function LabNav({ variant }: { variant: NavVariant }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * PLATE — the nav becomes a museum plate. Edge to edge on a single hairline, mono caps,
   * numbered. No container, no shadow, no pill: it reads as a caption to the page rather
   * than as a widget floating above it.
   */
  if (variant === "plate") {
    return (
      <header className="fixed inset-x-0 top-0 z-50">
        <div
          className="flex items-center justify-between gap-6 px-6 py-4 transition-[background-color,backdrop-filter] duration-500 md:px-[6vw]"
          style={{
            backgroundColor: scrolled ? "rgba(250,249,247,0.72)" : "transparent",
            backdropFilter: scrolled ? "blur(14px)" : "none",
          }}
        >
          <Logo alt="Cylent Solutions" priority className="h-[1.6rem]" />
          <nav className="hidden items-center gap-7 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ink md:flex">
            {NAV_LINKS.map((link, i) => (
              <StaggerLink key={link.label} label={link.label} index={i} />
            ))}
          </nav>
          <div className="flex items-center gap-5 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ink">
            <span className="hidden opacity-40 lg:inline">Indore</span>
            <StaggerLink label={CONTACT_LINK.label} />
          </div>
        </div>
        {/* The hairline is the whole chrome. It draws itself on load and is the only thing
            separating the nav from the page. */}
        <span
          aria-hidden="true"
          className="block h-px w-full origin-left bg-[image:var(--gradient-accent)] opacity-70"
          style={{ transform: `scaleX(${scrolled ? 1 : 0.999})` }}
        />
      </header>
    );
  }

  /**
   * LETTERS — no chrome at all. The wordmark, the links and the ask sit directly on the
   * page in the largest nav type on the site, and the only thing that happens is that they
   * shrink as you leave the hero. `design-principles.md` Principle 1: the container was not
   * carrying anything the type could not carry itself.
   */
  if (variant === "letters") {
    return (
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div className="pointer-events-auto flex items-baseline justify-between px-6 pt-7 md:px-[6vw]">
          <span
            className="font-semibold tracking-[-0.04em] text-ink transition-[font-size] duration-700 ease-out"
            style={{ fontSize: scrolled ? "1.05rem" : "1.6rem" }}
          >
            Cylent
          </span>
          <nav
            className="hidden items-baseline gap-8 font-medium tracking-[-0.02em] text-ink transition-[font-size] duration-700 ease-out md:flex"
            style={{ fontSize: scrolled ? "0.9rem" : "1.05rem" }}
          >
            {NAV_LINKS.map((link) => (
              <StaggerLink key={link.label} label={link.label} />
            ))}
            <StaggerLink label={CONTACT_LINK.label} className="font-semibold" />
          </nav>
        </div>
      </header>
    );
  }

  /**
   * MASTHEAD — a magazine's front matter. Three bands: the wordmark at display scale, a
   * rule, then the links in a row with the studio's own data at the far right. It claims
   * real vertical space instead of hiding, which is what a masthead is for, and collapses
   * to a single line on scroll.
   */
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className="overflow-hidden bg-surface/80 backdrop-blur-md transition-[max-height] duration-700 ease-out"
        style={{ maxHeight: scrolled ? "3.5rem" : "9rem" }}
      >
        <div className="flex items-end justify-between px-6 pt-5 md:px-[6vw]">
          <span
            className="font-semibold leading-[0.85] tracking-[-0.05em] text-ink transition-[font-size] duration-700 ease-out"
            style={{ fontSize: scrolled ? "1.1rem" : "clamp(2rem,5vw,3.5rem)" }}
          >
            Cylent
          </span>
          <span className="hidden pb-1 text-right font-mono text-[0.5625rem] uppercase leading-[1.6] tracking-[0.2em] text-ink opacity-50 md:block">
            Indore, India
            <br />
            Web · Video · Design
          </span>
        </div>
        <span
          aria-hidden="true"
          className="mt-4 block h-px w-full bg-[image:var(--gradient-accent)]"
        />
        <nav className="hidden items-center gap-8 px-6 py-3 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ink md:flex md:px-[6vw]">
          {NAV_LINKS.map((link, i) => (
            <StaggerLink key={link.label} label={link.label} index={i} />
          ))}
          <span className="ml-auto">
            <StaggerLink label={CONTACT_LINK.label} />
          </span>
        </nav>
      </div>
    </header>
  );
}
