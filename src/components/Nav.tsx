"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { getCondenseProgress } from "@/lib/motion/nav-scroll";
import { Arrow } from "@/components/icons/Arrow";
import { useMagneticHover } from "@/lib/motion/useMagneticHover";
import { CONTACT_LINK, NAV_LINKS, goTo, hrefFor, isOnThisPage, type NavLink } from "@/lib/site/nav-links";

/**
 * Links, not buttons. The destination is a real href, so it scrolls in place when the
 * section is here and navigates to the homepage anchor when it is not — and it can be
 * opened in a new tab, read as a link, and followed without JavaScript.
 */
function useSectionLink() {
  return (event: React.MouseEvent, link: NavLink) => {
    if (!isOnThisPage(link)) return;
    event.preventDefault();
    goTo(link);
  };
}

export function Nav() {
  const navRef = useRef<HTMLElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLButtonElement>(null);
  const followSection = useSectionLink();

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
          className="relative flex flex-1 items-center justify-between gap-6 rounded-full border border-ink/10 bg-surface px-7 shadow-[0_8px_30px_rgba(20,18,15,0.10)]"
          style={{
            paddingTop: "calc(0.82rem - var(--nav-condense, 0) * 0.25rem)",
            paddingBottom: "calc(0.82rem - var(--nav-condense, 0) * 0.25rem)",
          }}
        >
          <Link
            href="/"
            className="text-[1.12rem] font-bold tracking-tight text-ink"
          >
            Cylent
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <Link
                  href={hrefFor(link)}
                  onClick={(event) => followSection(event, link)}
                  className="block rounded-full px-3.5 py-1.5 text-[0.95rem] font-medium text-ink/68 transition-colors hover:bg-ink/5 hover:text-ink"
                >
                  {link.label}
                </Link>
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
            <span className="h-0.5 w-5 bg-ink" />
            <span className="h-0.5 w-5 bg-ink" />
          </button>
        </nav>

        {/* Its own block beside the bar, matching height and radius so the two read as one
            system — but filled, not outlined. It had been wearing the bar's own styling:
            surface ground, hairline border, same shadow, which made the one action on the
            page look like a second navigation bar. design-principles.md settles it — buttons
            are ink. Ink against the bar's paper is the hierarchy the nav was missing.

            Carries `cbtn` so the arrow hand-off already described in globals.css applies
            here too, rather than a second copy of that rule under a new name. */}
        <button
          ref={contactRef}
          type="button"
          onClick={() => goTo(CONTACT_LINK)}
          className="cbtn group hidden shrink-0 items-center gap-2.5 rounded-full bg-ink pl-7 pr-6 text-[0.95rem] font-semibold text-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_8px_26px_rgba(20,18,15,0.24)] outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent md:inline-flex"
        >
          Contact
          <span className="relative grid h-3.5 w-3.5 place-items-center overflow-hidden">
            <Arrow className="cbtn-arrow cbtn-arrow-one h-3.5 w-3.5" />
            <Arrow className="cbtn-arrow cbtn-arrow-two absolute h-3.5 w-3.5" />
          </span>
        </button>
      </div>

      <div
        ref={sheetRef}
        id="mobile-nav-sheet"
        className="w-full max-w-4xl overflow-hidden rounded-3xl border border-ink/10 bg-surface shadow-[0_8px_30px_rgba(20,18,15,0.10)] md:hidden"
        style={{ display: "none" }}
      >
        <ul className="flex flex-col gap-2 px-5 py-5">
          {NAV_LINKS.map((link) => (
            <li key={link.id}>
              <Link
                href={hrefFor(link)}
                onClick={(event) => {
                  setMobileOpen(false);
                  followSection(event, link);
                }}
                className="block w-full rounded-full px-4 py-2.5 text-left text-base font-medium text-ink/68 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                goTo(CONTACT_LINK);
              }}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
            >
              Contact
            </button>
          </li>
        </ul>
      </div>
    </header>
  );
}
