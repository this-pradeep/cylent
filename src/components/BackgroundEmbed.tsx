"use client";

import { useState } from "react";

type BackgroundEmbedProps = {
  /** The player URL, already carrying its `video` parameter. */
  src: string;
  title: string;
};

/**
 * Player parameters that turn an embed into a background.
 *
 * Autoplay is only granted to muted video, which is why `mute` starts true rather than as a
 * stylistic choice. The rest strips the player back to picture: no controls, no logo, no
 * start-screen furniture, no queue, no sharing.
 */
function playerUrl(src: string, muted: boolean): string {
  const join = src.includes("?") ? "&" : "?";
  return `${src}${join}${new URLSearchParams({
    mute: String(muted),
    autoplay: "true",
    loop: "true",
    controls: "false",
    "ui-logo": "false",
    "ui-start-screen-info": "false",
    "queue-enable": "false",
    "queue-autoplay-next": "false",
    "sharing-enable": "false",
  })}`;
}

function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        d="M4 9.5h3.2L12 5.5v13L7.2 14.5H4z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      {muted ? (
        <path d="M16 9.5l4.5 5M20.5 9.5l-4.5 5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" fill="none" />
      ) : (
        <path d="M15.8 9a4.2 4.2 0 010 6M18.4 6.6a7.6 7.6 0 010 10.8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" fill="none" />
      )}
    </svg>
  );
}

/**
 * A hosted player used as a section background: covering the frame, stripped of its own
 * interface, and inert to the pointer. The only thing anyone can click is the sound.
 *
 * The iframe carries `pointer-events: none`, which is what makes this a background rather
 * than an embed that happens to be large — without it a stray click lands in someone else's
 * player and takes the visitor with it.
 *
 * Sizing is the standard cover: 16:9 held against both axes with `min-w-full` and
 * `min-h-full`, so whichever dimension is short gets overflowed rather than letterboxed. An
 * iframe cannot be `object-fit`-ed; it has to be measured into place.
 *
 * ⚠ Unmuting reloads the player, so the clip restarts. Holding position would mean loading
 * Dailymotion's SDK to issue a mute command — a third-party script on first paint, for a
 * looping background reel where restarting is barely visible. Swapping the parameter is the
 * cheaper trade.
 */
export function BackgroundEmbed({ src, title }: BackgroundEmbedProps) {
  const [muted, setMuted] = useState(true);

  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <iframe
          key={muted ? "muted" : "audible"}
          src={playerUrl(src, muted)}
          title={title}
          allow="autoplay; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          tabIndex={-1}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
        />
      </div>

      {/* Same grade a photograph gets, and for the same reason: white type over footage
          nobody has colour-graded has to hold against its brightest frame. */}
      <div aria-hidden="true" className="absolute inset-0 bg-ink/[0.78]" />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[62%] bg-[linear-gradient(to_top,rgba(20,18,15,0.68)_0%,rgba(20,18,15,0.42)_38%,transparent_100%)]"
      />

      <button
        type="button"
        onClick={() => setMuted((value) => !value)}
        aria-pressed={!muted}
        className="absolute right-6 top-[13vh] z-10 inline-flex items-center gap-2 rounded-full border border-surface/25 bg-ink/50 px-4 py-2 font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-surface backdrop-blur-sm transition-colors hover:bg-ink/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-surface md:right-[6vw]"
      >
        <SoundIcon muted={muted} />
        {muted ? "Sound off" : "Sound on"}
      </button>
    </>
  );
}
