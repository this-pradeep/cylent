"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CircularButton } from "@/components/CircularButton";
import { Logo } from "@/components/Logo";
import { FOOTER_LINKS, goTo, hrefFor, isOnThisPage, type NavLink } from "@/lib/site/nav-links";
import {
  CONTACT_CHANNELS,
  CONTACT_EMAIL,
  mailtoHref,
} from "@/lib/site/contact";
import { IconGradientDefs, TracedIcon } from "@/components/icons/TracedIcon";
import { SocialDiscs } from "@/components/SocialDiscs";

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
  const markRef = useRef<HTMLDivElement>(null);
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

  /**
   * The watermark drifts against the scroll.
   *
   * A wordmark this size holding perfectly still would be the one fixed object on a page
   * where the beam sways and the ramp drifts, and it would read as a flat sticker laid over
   * the footer rather than as ground beneath it. Scrubbed rather than played: it is tied to
   * the scroll position, so it behaves like a layer at a different depth instead of an
   * animation that happens at you. 12% of its own height, inside motion-system.md's 5–20%
   * parallax band, and transform-only so it never costs a layout.
   */
  useEffect(() => {
    const mark = markRef.current;
    if (!mark) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const tween = gsap.fromTo(
      mark,
      { yPercent: 12 },
      {
        yPercent: -4,
        ease: "none",
        scrollTrigger: {
          trigger: mark,
          start: "top bottom",
          end: "bottom bottom",
          scrub: 0.6,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  const blurb = active ? BLURBS[active.id] : undefined;

  return (
    <footer
      id="contact"
      className="relative overflow-hidden border-t border-ink/10 bg-surface"
    >
      <IconGradientDefs />

      {/* The mark as ground, not as a graphic.

          The footer is the last thing anyone sees, and website-story.md asks it to leave a
          feeling rather than a list — so the studio's own name is what the closing chapter is
          built on top of. Full width and anchored to the foot, at an opacity where it reads
          as a tone in the paper rather than as a second logo competing with the one in the
          baseline strip: catch it and it resolves into the word, glance past it and it is
          just the page being warmer at the bottom.

          Out of the accessibility tree and out of the hit test — the name is already in the
          strip below it, and a decorative layer this large must never eat a click. */}
      <div
        ref={markRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 select-none opacity-[0.055]"
      >
        <Logo alt="" fit="width" />
      </div>
      <div className="relative px-6 pb-8 pt-[clamp(38px,5.5vw,74px)] md:px-[6vw]">
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
              {CONTACT_CHANNELS.map((channel) => (
                <a
                  key={channel.label}
                  href={channel.href}
                  aria-label={channel.label}
                  data-cursor
                  {...(channel.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="fx-ico group flex items-center gap-3.5 rounded-full border border-ink/15 px-5 py-3.5 outline-offset-4 transition-colors duration-300 hover:border-ink hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {/* The resting glyph drops to a ghost as the pill fills ink, and the
                      traced copy draws the mark back in over it in surface. The icon is
                      redrawn by the interaction rather than merely recoloured by it. */}
                  <TracedIcon
                    name={channel.icon}
                    className="h-[1.75rem] w-[1.75rem] shrink-0 text-ink-muted transition-colors duration-300 group-hover:text-surface/25"
                    traceClassName="text-surface"
                  />
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
              ))}

              {/* Directly under the channels, because they answer the question the
                  channels raise: before writing to us, go and look. */}
              <div className="mt-4">
                <SocialDiscs />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fine print, and only fine print.

          This row has been emptied twice over. First the colophon naming our typeface and
          framework went — technical trivia about us that no visitor needs, and the brand
          voice rules it out. Then the socials moved up beside the contact channels, where
          the decision they support is actually made.

          What went last was a small copy of the wordmark sitting at the left of this line.
          The watermark behind it is the mark now, at full width, and the two of them landed
          within a hundred pixels of each other — the same name twice, the big one reading as
          ground and the small one as a label for it. The dotted leader went with it: it was
          drawn to connect the mark to the legal line, and with one end gone it led nowhere.

          A page's last line should be the quietest thing on it. This one finally is. */}
      <div className="relative border-t border-ink/10 px-6 py-[clamp(18px,2.2vw,26px)] md:px-[6vw]">
        {/* Prerendered at build time, re-evaluated on the client; they differ only across a
            new year, before the next deploy rebuilds the export. */}
        <span
          suppressHydrationWarning
          className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-muted"
        >
          © {new Date().getFullYear()} Cylent Solutions Pvt Ltd
        </span>
      </div>
    </footer>
  );
}
