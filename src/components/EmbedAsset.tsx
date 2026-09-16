"use client";

import { useState } from "react";
import Image from "next/image";

type EmbedAssetProps = {
  src: string;
  /** Describes the clip, not the widget. Screen readers announce this as the frame's name. */
  title: string;
  /** Frame zero, served from our own origin. See ProjectMedia for why it is not optional. */
  poster: string;
  className?: string;
};

/**
 * A third-party video player, held at 16:9, that does not exist until it is asked for.
 *
 * Sized by height rather than width. The frames this sits in are wide and short, and a
 * width-driven 16:9 box overflows them — 88vw of a 1440 viewport wants 713px of height in a
 * slot that has 522. Driving from height and letting width follow keeps the whole player in
 * view; `max-w-full` is only a guard for boxes wider than they are tall.
 *
 * It used to be a bare `loading="lazy"` iframe, which was not the deferral it looked like:
 * Chrome's lazy threshold is generous enough that the player, its script and 4.3MB of video
 * were all fetched during page load — 64% of the page's weight, for a clip nobody had
 * clicked. A poster with a play control is the whole fix. Nothing crosses to the video host
 * until the visitor presses it, and then the clip plays, because pressing play is a request
 * to watch and a second click to confirm it would be a worse experience than the one we
 * started with.
 *
 * The control is ink on the still, per design-principles.md "Buttons are always ink" — the
 * accent is kept to type, states and hairlines and never has to carry a fill this size.
 */
export function EmbedAsset({ src, title, poster, className }: EmbedAssetProps) {
  const [playing, setPlaying] = useState(false);

  // The player reads its own query string, so the autoplay flag joins whatever is already
  // there rather than assuming this is the first parameter.
  const playerSrc = `${src}${src.includes("?") ? "&" : "?"}autoplay=true`;

  return (
    <div className={`flex h-full w-full items-center justify-center ${className ?? ""}`}>
      <div className="relative aspect-video h-full w-auto max-w-full overflow-hidden rounded-lg bg-ink shadow-[0_30px_80px_-30px_rgba(0,0,0,0.75)] ring-1 ring-surface/12">
        {playing ? (
          <iframe
            src={playerSrc}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${title}`}
            className="group absolute inset-0 grid h-full w-full place-items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Image
              src={poster}
              alt=""
              fill
              sizes="(min-width: 768px) 70vw, 100vw"
              className="object-cover"
            />
            {/* Scrim: the still is a night exterior in places and a daylit interior in
                others, and the control has to read on both. A wash this light does not
                grade the image, it just guarantees the circle never sits on its own value. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-ink/15 transition-colors duration-300 group-hover:bg-ink/25"
            />
            <span
              aria-hidden="true"
              className="relative grid h-16 w-16 place-items-center rounded-full bg-ink text-surface shadow-[0_12px_32px_-12px_rgba(0,0,0,0.7)] transition-transform duration-300 ease-out group-hover:scale-[1.08] motion-reduce:transition-none motion-reduce:group-hover:scale-100 md:h-20 md:w-20"
            >
              {/* Nudged right by a hair: a triangle centred on its bounding box reads as
                  sitting left of centre inside a circle. */}
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 translate-x-[1px] fill-current md:h-7 md:w-7"
                aria-hidden="true"
              >
                <path d="M8 5.5l11 6.5-11 6.5z" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
