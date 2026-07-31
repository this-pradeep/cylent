"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { scrollToId } from "@/lib/motion/scroll-to";

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

  useEffect(() => {
    if (typeof CSS !== "undefined" && CSS.supports("backdrop-filter", FILTER_BACKDROP)) {
      setBackdropFilter(FILTER_BACKDROP);
    }
  }, []);

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 md:top-6">
      <nav
        ref={navRef}
        className="relative flex w-full max-w-3xl items-center justify-between gap-6 rounded-full border border-ink/10 px-6 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]"
        style={{
          backdropFilter,
          WebkitBackdropFilter: backdropFilter,
          background: "color-mix(in srgb, var(--color-surface) 78%, transparent)",
        }}
      >
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
