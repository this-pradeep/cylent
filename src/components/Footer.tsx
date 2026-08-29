"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CircularButton } from "@/components/CircularButton";
import { FOOTER_LINKS, goTo, hrefFor, isOnThisPage, type NavLink } from "@/lib/site/nav-links";
import {
  CONTACT_CHANNELS,
  CONTACT_EMAIL,
  SOCIAL_LINKS,
  mailtoHref,
} from "@/lib/site/contact";
import {
  MailIcon,
  WhatsAppIcon,
} from "@/components/icons/ContactIcons";

/**
 * Both rows share these tracks, so the statement lines up above the index and the circular
 * button lines up above the contact block. The right column is a fixed width rather than a
 * fraction: as a fraction its narrower content floated in the middle of the track and left
 * dead space against the page edge.
 */
/**
 * One grid for the whole footer body rather than two stacked rows.
 *
 * Two rows could not reorder across the boundary between them: the button lives in row one
 * and the index in row two, so on a phone the button was always above the index no matter
 * what `order` was set within either row. As a single grid, the mobile order is `order-*` on
 * four children and the desktop arrangement is explicit row/column placement — the same
 * two-by-two it always was.
 */
const FOOTER_GRID =
  "grid gap-[clamp(28px,4vw,64px)] min-[860px]:grid-cols-[1fr_23rem] min-[860px]:items-start";

/** The second desktop row sits away from the first; on mobile the grid gap already does it. */
const SECOND_ROW = "min-[860px]:row-start-2 min-[860px]:pt-[clamp(30px,4.5vw,56px)]";

/** Shared by the two stacked copies of each index label, so their metrics match exactly. */
const INDEX_LABEL =
  "block text-[clamp(1.05rem,1.8vw,1.35rem)] font-semibold tracking-[-0.025em] whitespace-nowrap";

const CHANNEL_ICONS = {
  mail: MailIcon,
  whatsapp: WhatsAppIcon,
};

/**
 * Hovering an index row rewrites the largest line on the page. Split into two spans rather
 * than markup in a string, so nothing needs dangerouslySetInnerHTML.
 */
const BLURBS: Record<string, { lead: string; tail: string }> = {
  about: { lead: "Who we are, and", tail: "how we argue." },
  web: { lead: "Fast, modern, built from", tail: "a blank file." },
  video: { lead: "Stories that connect", tail: "emotionally." },
  graphics: { lead: "Identities that communicate", tail: "quality." },
  contact: { lead: "Tell us what it is", tail: "actually for." },
};

export function Footer() {
  const pitchRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<NavLink | null>(null);

  useEffect(() => {
    const pitch = pitchRef.current;
    if (!pitch) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      gsap.set(pitch, { yPercent: 0, opacity: 1 });
      return;
    }

    const tween = gsap.fromTo(
      pitch,
      { yPercent: 106, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 1.1,
        ease: "expo.out",
        scrollTrigger: {
          trigger: pitch,
          start: "top 92%",
          toggleActions: "play none none reverse",
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      ScrollTrigger.refresh();
    };
  }, []);

  const blurb = active ? BLURBS[active.id] : undefined;

  return (
    <footer id="contact" className="relative border-t border-ink/10 bg-surface">
      <div className="px-6 pb-8 pt-[clamp(38px,5.5vw,74px)] md:px-[6vw]">
        <p className="m-0 mb-[clamp(18px,2.6vw,28px)] font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ink-muted">
          Contact
        </p>

        <div className={`${FOOTER_GRID} pb-[clamp(22px,3vw,34px)]`}>
          <div
            className="fx-stage relative order-1 min-h-[clamp(110px,17vw,200px)] min-[860px]:col-start-1 min-[860px]:row-start-1"
            data-swapped={blurb ? "true" : "false"}
          >
            <div className="overflow-hidden">
              {/* The entrance tween owns this wrapper; the hover swap owns the <p> inside it.
                On one element GSAP's inline opacity would beat the swap's CSS rule and the
                old heading would never leave — which is exactly what it did. */}
              <div ref={pitchRef}>
                <p className="fx-pitch m-0 max-w-[15ch] text-[clamp(2.5rem,11.5vw,5.6rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-ink min-[860px]:text-[clamp(2rem,7.4vw,5.6rem)]">
                  Let&apos;s build something{" "}
                  {/* The tail carries the accent at rest, the same as Chapter 8's closing
                      word. It used to be muted ink, which meant the only gradient in this
                      section was on the swapped copy underneath — invisible until someone
                      hovered a row, so the statement read as grey by default. */}
                  <span className="text-gradient">worth remembering.</span>
                </p>
              </div>
            </div>
            <p
              aria-hidden="true"
              className="fx-alt pointer-events-none absolute inset-0 m-0 max-w-[15ch] text-[clamp(2.5rem,11.5vw,5.6rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-ink min-[860px]:text-[clamp(2rem,7.4vw,5.6rem)]"
            >
              {blurb ? (
                <>
                  {blurb.lead}{" "}
                  <span className="text-gradient">{blurb.tail}</span>
                </>
              ) : null}
            </p>
          </div>

          {/* Third on a phone, so the index is read before the button is offered. */}
          <div className="order-3 min-[860px]:col-start-2 min-[860px]:row-start-1">
            <CircularButton
              label="Start a conversation"
              href={mailtoHref(CONTACT_EMAIL, "New project")}
              size={150}
            />
          </div>

          <nav
            aria-label="Site index"
            className={`order-2 flex flex-col min-[860px]:col-start-1 ${SECOND_ROW}`}
          >
            {FOOTER_LINKS.map((link, index) => (
              <Link
                key={link.id}
                href={hrefFor(link)}
                data-cursor
                onClick={(event) => {
                  // In place when the section is here, a real navigation when it is not.
                  if (!isOnThisPage(link)) return;
                  event.preventDefault();
                  goTo(link);
                }}
                onPointerEnter={() => setActive(link)}
                onPointerLeave={() =>
                  setActive((current) => (current === link ? null : current))
                }
                onFocus={() => setActive(link)}
                onBlur={() =>
                  setActive((current) => (current === link ? null : current))
                }
                className="fx-row group flex items-baseline gap-3 border-b border-ink/[0.07] py-3.5 text-left"
              >
                <span className="relative">
                  <strong
                    className={`${INDEX_LABEL} text-ink transition-opacity duration-300 group-hover:opacity-0`}
                  >
                    {link.label}
                  </strong>
                  {/* background-image does not interpolate, so a colour cannot transition into
                      a gradient. The gradient copy cross-fades over the ink one instead.
                      aria-hidden, since it is the same word twice. */}
                  <strong
                    aria-hidden="true"
                    className={`${INDEX_LABEL} text-gradient absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  >
                    {link.label}
                  </strong>
                </span>
                <span className="fx-leader -translate-y-1 flex-1 border-b border-dotted border-ink/30" />
                <em className="font-mono text-[0.6rem] not-italic tracking-[0.14em] text-ink-muted tabular-nums transition-[color,transform] duration-500 group-hover:translate-x-1 group-hover:text-accent">
                  {String(index + 1).padStart(2, "0")}
                </em>
              </Link>
            ))}
          </nav>

          <div
            className={`order-4 flex flex-col gap-[clamp(24px,3vw,32px)] min-[860px]:col-start-2 ${SECOND_ROW}`}
          >
            <p className="m-0 max-w-[32ch] text-[0.9rem] leading-[1.68] text-ink-muted">
              Tell us what it is for and who has to feel something. We will tell
              you whether we are the right studio for it.
            </p>

            {/* Dedicated control per channel. Each carries one thing — the address, or what
              tapping it does — because pairing a label with a value read as a spreadsheet. */}
            <div className="flex flex-col gap-2.5">
              <p className="m-0 mb-0.5 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ink-muted">
                Or reach us direct
              </p>
              {CONTACT_CHANNELS.map((channel) => {
                const Icon = CHANNEL_ICONS[channel.icon];
                return (
                  <a
                    key={channel.label}
                    href={channel.href}
                    aria-label={channel.label}
                    data-cursor
                    {...(channel.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="group flex items-center gap-3.5 rounded-full border border-ink/15 px-5 py-3.5 transition-colors duration-300 hover:border-ink hover:bg-ink"
                  >
                    <Icon className="h-[1.05rem] w-[1.05rem] shrink-0 text-ink-muted transition-colors duration-300 group-hover:text-surface" />
                    <span className="flex-1 text-[clamp(1rem,1.3vw,1.15rem)] font-medium tracking-[-0.015em] text-ink transition-colors duration-300 group-hover:text-surface">
                      {channel.value}
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0 -translate-x-1.5 text-surface opacity-0 transition-[transform,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-0 group-hover:opacity-100"
                    >
                      <path
                        d="M7 17 L17 7 M9 7 H17 V15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        strokeLinecap="square"
                      />
                    </svg>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-7 gap-y-2.5 border-t border-ink/10 px-6 py-[clamp(16px,2vw,22px)] font-mono text-[0.6rem] uppercase tracking-[0.13em] text-ink-muted md:px-[6vw]">
        {/* Prerendered at build time, re-evaluated on the client; they differ only across a
            new year, before the next deploy rebuilds the export. */}
        <span suppressHydrationWarning>
          © {new Date().getFullYear()} Cylent Solutions Pvt Ltd
        </span>
        <span>Set in Manrope · Built with Next.js</span>
        {/* The separators are the list's own, drawn as a border on every item after the
            first, so the dots cannot outnumber or outlive the links they sit between. */}
        <ul className="m-0 flex list-none flex-wrap items-center gap-x-4 p-0">
          {SOCIAL_LINKS.map((social) => (
            <li
              key={social.label}
              className="before:mr-4 before:text-ink/30 before:content-['·'] first:before:hidden"
            >
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor
                className="transition-colors duration-300 hover:text-ink"
              >
                {social.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
