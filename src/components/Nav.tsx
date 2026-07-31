"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { scrollToId } from "@/lib/motion/scroll-to";
import { getCondenseProgress } from "@/lib/motion/nav-scroll";

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
  const [reducedMotion, setReducedMotion] = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof CSS !== "undefined" && CSS.supports("backdrop-filter", FILTER_BACKDROP)) {
      setBackdropFilter(FILTER_BACKDROP);
    }
  }, []);

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

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 md:top-6">
      <nav
        ref={navRef}
        className="relative flex w-full max-w-3xl items-center justify-between gap-6 rounded-full border border-ink/10 px-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]"
        style={{
          backdropFilter,
          WebkitBackdropFilter: backdropFilter,
          background: "color-mix(in srgb, var(--color-surface) 78%, transparent)",
          paddingTop: "calc(0.75rem - var(--nav-condense, 0) * 0.25rem)",
          paddingBottom: "calc(0.75rem - var(--nav-condense, 0) * 0.25rem)",
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-surface"
          style={{ opacity: "calc(var(--nav-condense, 0) * 0.15)" }}
        />

        {!reducedMotion && (
          <div
            ref={highlightRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 h-24 w-24 -ml-12 -mt-12 rounded-full bg-accent/15 blur-2xl"
          />
        )}

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
