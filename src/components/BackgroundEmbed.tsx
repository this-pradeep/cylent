"use client";

import { useEffect, useRef } from "react";

type BackgroundEmbedProps = {
  /** The clip as plain files — see ProjectMedia for why a backdrop does not take the player. */
  sources: { webm: string; mp4: string };
  /** Frame zero. What stands in before the clip loads, and what stands in for it entirely
      under reduced motion. Required for that second reason: without it the frame is black. */
  poster: string;
  title: string;
};

/**
 * Footage used as a section ground: covering the frame, silent, looping, and inert to the
 * pointer. There is nothing here to click.
 *
 * This used to be a hosted player in an iframe, stripped of its interface with a dozen
 * `player[...]` parameters until it behaved like footage. It was the most expensive thing on
 * the site. `loading="lazy"` looked like it deferred the cost and did not — Chrome's lazy
 * threshold is generous enough that a Lighthouse run fetched the whole thing during page
 * load: 4.3MB of video, a 140KB player bundle from a third CDN, the player's own config and
 * poster round-trips, and an analytics beacon, for a muted loop under a scrim that nobody
 * had scrolled to. It was 64% of the page's weight and it arrived before the hero had
 * finished painting.
 *
 * A `<video>` renders the same picture with no script at all, so that is what this is now.
 * The deferral is the same one VideoAsset uses and works for the same reason: `preload` is
 * `none`, so nothing is fetched until the observer says the section is actually on screen.
 *
 * Client, where it had become a server component. That is the cost of the observer, and it
 * is worth it — the alternative is an `autoplay` attribute, which asks the browser to start
 * fetching as soon as it thinks it can, which is the behaviour being removed.
 *
 * Sizing is the standard cover: `object-fit` does the work an iframe had to be measured
 * into place for.
 */
export function BackgroundEmbed({ sources, poster, title }: BackgroundEmbedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Under reduced motion the poster is the backdrop. motion-system.md is explicit that
    // motion is never the only carrier of meaning, and here it carries none: the frame is
    // a graded ground for the type either way.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      // Lower than VideoAsset's 0.25: this frame is the full height of the viewport, so a
      // quarter of it is most of a screen and the clip would still be still when the type
      // over it has been readable for a while.
      { threshold: 0.05 },
    );
    observer.observe(video);

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          poster={poster}
          title={title}
          muted
          loop
          playsInline
          preload="none"
          tabIndex={-1}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        >
          <source src={sources.webm} type="video/webm" />
          <source src={sources.mp4} type="video/mp4" />
        </video>
      </div>

      {/* Same grade a photograph gets, and for the same reason: white type over footage
          nobody has colour-graded has to hold against its brightest frame. */}
      <div aria-hidden="true" className="absolute inset-0 bg-ink/[0.78]" />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[62%] bg-[linear-gradient(to_top,rgba(20,18,15,0.68)_0%,rgba(20,18,15,0.42)_38%,transparent_100%)]"
      />
    </>
  );
}
