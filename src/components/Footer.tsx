"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CircularButton } from "@/components/CircularButton";
import { FOOTER_LINKS, goTo, type NavLink } from "@/lib/site/nav-links";
import { CONTACT_CHANNELS, CONTACT_EMAIL, mailtoHref } from "@/lib/site/contact";

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

// TODO: real profile URLs before launch — these are placeholders.
const SOCIALS = [
  { label: "Instagram", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "Behance", href: "#" },
];

export function Footer() {
  const pitchRef = useRef<HTMLParagraphElement>(null);
  const [active, setActive] = useState<NavLink | null>(null);

  useEffect(() => {
    const pitch = pitchRef.current;
    if (!pitch) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
          Index
        </p>

        <div
          className="fx-stage relative min-h-[clamp(120px,20vw,230px)]"
          data-swapped={blurb ? "true" : "false"}
        >
          <div className="overflow-hidden">
            <p
              ref={pitchRef}
              className="fx-pitch m-0 max-w-[15ch] text-[clamp(2rem,7.4vw,5.6rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-ink"
            >
              Let&apos;s build something <span className="text-ink-muted">worth remembering.</span>
            </p>
          </div>
          <p
            aria-hidden="true"
            className="fx-alt pointer-events-none absolute inset-0 m-0 max-w-[15ch] text-[clamp(2rem,7.4vw,5.6rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-ink"
          >
            {blurb ? (
              <>
                {blurb.lead} <span className="text-accent">{blurb.tail}</span>
              </>
            ) : null}
          </p>
        </div>

        <div className="grid gap-[clamp(26px,5vw,72px)] pb-[clamp(22px,3vw,34px)] pt-[clamp(32px,4.5vw,58px)] min-[860px]:grid-cols-[1.15fr_0.85fr] min-[860px]:items-start">
          <nav aria-label="Site index" className="flex flex-col">
            {FOOTER_LINKS.map((link, index) => (
              <button
                key={link.id}
                type="button"
                data-cursor
                onClick={() => goTo(link)}
                onPointerEnter={() => setActive(link)}
                onPointerLeave={() => setActive((current) => (current === link ? null : current))}
                onFocus={() => setActive(link)}
                onBlur={() => setActive((current) => (current === link ? null : current))}
                className="fx-row group flex items-baseline gap-3 border-b border-ink/[0.07] py-3.5 text-left"
              >
                <strong className="text-[clamp(1.05rem,1.8vw,1.35rem)] font-semibold tracking-[-0.025em] text-ink transition-colors group-hover:text-accent">
                  {link.label}
                </strong>
                <span className="fx-leader -translate-y-1 flex-1 border-b border-dotted border-ink/30" />
                <em className="font-mono text-[0.6rem] not-italic tracking-[0.14em] text-ink-muted tabular-nums transition-[color,transform] duration-500 group-hover:translate-x-1 group-hover:text-accent">
                  {String(index + 1).padStart(2, "0")}
                </em>
              </button>
            ))}
          </nav>

          <div className="flex flex-col items-start gap-[clamp(20px,2.8vw,28px)]">
            <CircularButton
              label="Start a conversation"
              href={mailtoHref(CONTACT_EMAIL, "New project")}
              size={150}
            />
            <p className="m-0 max-w-[30ch] text-[0.9rem] leading-[1.72] text-ink-muted">
              Tell us what it is for and who has to feel something. We will tell you whether we are
              the right studio for it.
            </p>

            {/* Three ways in, quieter than the button so it stays the primary action. */}
            <div className="flex w-full max-w-[34ch] flex-col">
              <p className="m-0 mb-1.5 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ink-muted">
                Or reach us direct
              </p>
              {CONTACT_CHANNELS.map((channel) => (
                <a
                  key={channel.label}
                  href={channel.href}
                  data-cursor
                  {...(channel.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="group flex items-baseline justify-between gap-4 border-b border-ink/[0.07] py-2.5"
                >
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-muted transition-colors group-hover:text-accent">
                    {channel.label}
                  </span>
                  <span className="font-mono text-[0.72rem] tracking-[0.04em] text-ink transition-colors group-hover:text-accent">
                    {channel.value}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-7 gap-y-2.5 border-t border-ink/10 px-6 py-[clamp(16px,2vw,22px)] font-mono text-[0.6rem] uppercase tracking-[0.13em] text-ink-muted md:px-[6vw]">
        {/* Prerendered at build time, re-evaluated on the client; they differ only across a
            new year, before the next deploy rebuilds the export. */}
        <span suppressHydrationWarning>© {new Date().getFullYear()} Cylent Solutions Pvt Ltd</span>
        <span>Set in Manrope · Built with Next.js</span>
        <span className="flex gap-2">
          {SOCIALS.map((social, index) => (
            <span key={social.label} className="flex gap-2">
              <a href={social.href} className="transition-colors hover:text-ink">
                {social.label}
              </a>
              {index < SOCIALS.length - 1 ? <span aria-hidden="true">·</span> : null}
            </span>
          ))}
        </span>
      </div>
    </footer>
  );
}
