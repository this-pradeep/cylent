"use client";

import { useEffect, useRef, useState } from "react";
import { TracedIcon } from "@/components/icons/TracedIcon";
import { SOCIAL_LINKS, type SocialLink } from "@/lib/site/contact";
import { useMagneticHover } from "@/lib/motion/useMagneticHover";

/**
 * The profiles, as discs rather than as a line of small links.
 *
 * They were 17px glyphs beside 13px labels, which is the size a footer gives something it
 * does not really mean. This is the one place on the page where a visitor decides to go and
 * look at the work first, so it is given the weight of that decision — and it is where the
 * site's own vocabulary collects: the chromatic ring the hero pill wears, the accent ramp
 * that runs through display type, the magnetic pull on the nav's contact button, and the
 * traced draw the channel buttons use. Nothing here is imported; it is the rest of the site,
 * gathered.
 *
 * design-principles.md, Principle 2 — the discs are the loud thing, so the two channel
 * buttons above them stay monochrome. Only one element in this column gets to be bold.
 */
function SocialDisc({ social }: { social: SocialLink }) {
  const discRef = useRef<HTMLSpanElement>(null);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // The disc chases the pointer, the label under it does not — the mark is the thing being
  // reached for, and a caption that slid around with it would read as drift rather than pull.
  useMagneticHover(discRef, reducedMotion);

  return (
    <li>
      <a
        href={social.href}
        target="_blank"
        rel="noopener noreferrer"
        data-cursor
        aria-label={`${social.label}, opens in a new tab`}
        className="fx-ico group flex flex-col items-center gap-2.5 rounded-2xl outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span
          ref={discRef}
          className="fx-disc chromatic-ring grid h-[3.75rem] w-[3.75rem] place-items-center rounded-full border border-ink/12 bg-paper transition-colors duration-500"
        >
          <TracedIcon
            name={social.icon}
            className="h-[1.7rem] w-[1.7rem] text-ink-muted transition-colors duration-500 group-hover:text-ink/10"
            tracePaint="url(#ico-ramp)"
          />
        </span>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink-muted transition-colors duration-300 group-hover:text-ink">
          {social.label}
        </span>
      </a>
    </li>
  );
}

export function SocialDiscs() {
  return (
    <ul className="m-0 flex list-none flex-wrap items-start gap-x-5 gap-y-4 p-0">
      {SOCIAL_LINKS.map((social) => (
        <SocialDisc key={social.label} social={social} />
      ))}
    </ul>
  );
}
