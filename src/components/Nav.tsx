"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { scrollToId, scrollToPillar } from "@/lib/motion/scroll-to";
import { getCondenseProgress } from "@/lib/motion/nav-scroll";
import { useMagneticHover } from "@/lib/motion/useMagneticHover";

type NavLink = {
  label: string;
  id: string;
  /** Pillar panels live inside a pinned horizontal track and need the mapped scroll. */
  pillar?: boolean;
};

const NAV_LINKS: NavLink[] = [
  { label: "About", id: "about" },
  { label: "Web", id: "web", pillar: true },
  { label: "Videos", id: "video", pillar: true },
  { label: "Design", id: "graphics", pillar: true },
];

function goTo(link: NavLink) {
  if (link.pillar) {
    scrollToPillar(link.id);
    return;
  }
  scrollToId(link.id);
}

export function Nav() {
  const navRef = useRef<HTMLElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLButtonElement>(null);

  useMagneticHover(contactRef, reducedMotion);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

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
      <div className="flex w-full max-w-4xl items-stretch justify-center gap-2.5">
        <nav
          ref={navRef}
          className="relative flex flex-1 items-center justify-between gap-6 rounded-full bg-ink px-7 shadow-[0_8px_30px_rgba(20,18,15,0.18)]"
          style={{
            paddingTop: "calc(0.82rem - var(--nav-condense, 0) * 0.25rem)",
            paddingBottom: "calc(0.82rem - var(--nav-condense, 0) * 0.25rem)",
          }}
        >
          <Link
            href="/"
            className="text-[1.12rem] font-bold tracking-tight text-surface"
          >
            Cylent
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <button
                  type="button"
                  onClick={() => goTo(link)}
                  className="rounded-full px-3.5 py-1.5 text-[0.95rem] font-medium text-surface/68 transition-colors hover:bg-surface/10 hover:text-surface"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-sheet"
            className="inline-flex flex-col items-center justify-center gap-1 rounded-full p-2 md:hidden"
          >
            <span className="sr-only">Toggle menu</span>
            <span className="h-0.5 w-5 bg-surface" />
            <span className="h-0.5 w-5 bg-surface" />
          </button>
        </nav>

        {/* Its own block beside the bar, matching height and radius so the two read as
            one system. Keeps the magnetic hover the previous Contact button had. */}
        <button
          ref={contactRef}
          type="button"
          onClick={() => scrollToId("cta")}
          className="hidden shrink-0 items-center rounded-full bg-ink px-7 text-[0.95rem] font-semibold text-surface shadow-[0_8px_30px_rgba(20,18,15,0.18)] transition-colors hover:bg-[#211d18] md:inline-flex"
        >
          Contact
        </button>
      </div>

      <div
        ref={sheetRef}
        id="mobile-nav-sheet"
        className="w-full max-w-4xl overflow-hidden rounded-3xl bg-ink shadow-[0_8px_30px_rgba(20,18,15,0.18)] md:hidden"
        style={{ display: "none" }}
      >
        <ul className="flex flex-col gap-2 px-5 py-5">
          {NAV_LINKS.map((link) => (
            <li key={link.id}>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  goTo(link);
                }}
                className="block w-full rounded-full px-4 py-2.5 text-left text-base font-medium text-surface/68 transition-colors hover:bg-surface/10 hover:text-surface"
              >
                {link.label}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                scrollToId("cta");
              }}
              className="mt-1 w-full rounded-full bg-surface px-5 py-3 text-sm font-semibold text-ink"
            >
              Contact
            </button>
          </li>
        </ul>
      </div>
    </header>
  );
}
