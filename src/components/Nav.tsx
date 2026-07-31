"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { scrollToId } from "@/lib/motion/scroll-to";
import { getCondenseProgress } from "@/lib/motion/nav-scroll";
import { useLiquidGlassRefraction } from "@/lib/glass/useLiquidGlassRefraction";

const SERVICE_LINKS = [
  { label: "Build", href: "/build" },
  { label: "Capture", href: "/capture" },
  { label: "Move", href: "/move" },
];

const FALLBACK_BACKDROP = "blur(20px) saturate(1.3)";
const CHROMATIC_GLASS_OPTIONS = { depth: 24, sat: 1.65, band: 12, ca: 0.35 };

export function Nav() {
  const navRef = useRef<HTMLElement>(null);
  const [canRefract, setCanRefract] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const refractionUrl = useLiquidGlassRefraction(navRef, CHROMATIC_GLASS_OPTIONS, canRefract);
  const backdropFilter = refractionUrl ?? FALLBACK_BACKDROP;

  useEffect(() => {
    setCanRefract(typeof CSS !== "undefined" && CSS.supports("backdrop-filter", "url(#x)"));
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
      </nav>

      <div
        ref={sheetRef}
        id="mobile-nav-sheet"
        className="w-full max-w-3xl overflow-hidden rounded-3xl border border-ink/10 md:hidden"
        style={{
          display: "none",
          backdropFilter: FALLBACK_BACKDROP,
          WebkitBackdropFilter: FALLBACK_BACKDROP,
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
    </header>
  );
}
