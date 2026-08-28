type BackgroundEmbedProps = {
  /** The player URL, already carrying its `video` parameter. */
  src: string;
  title: string;
};

/**
 * Player parameters that turn an embed into a background.
 *
 * `mute` is not a setting. Autoplay is only granted to muted video in the first place, and a
 * background that can make noise is not a background — a visitor who scrolls into a section
 * and gets sound has been interrupted by something they did not ask to play. It is fixed
 * here rather than defaulted so there is nowhere for it to be turned off.
 *
 * The rest strips the player back to picture: no controls, no logo, no start-screen
 * furniture, no queue, no sharing.
 */
function playerUrl(src: string): string {
  const join = src.includes("?") ? "&" : "?";
  return `${src}${join}${new URLSearchParams({
    mute: "true",
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

/**
 * A hosted player used as a section background: covering the frame, stripped of its own
 * interface, silent, and inert to the pointer. There is nothing here to click.
 *
 * The iframe carries `pointer-events: none`, which is what makes this a background rather
 * than an embed that happens to be large — without it a stray click lands in someone else's
 * player and takes the visitor with it.
 *
 * Sizing is the standard cover: 16:9 held against both axes with `min-w-full` and
 * `min-h-full`, so whichever dimension is short gets overflowed rather than letterboxed. An
 * iframe cannot be `object-fit`-ed; it has to be measured into place.
 *
 * There was a sound toggle here. It is gone, and with it the client component this had to be
 * — the whole thing renders on the server now. Unmuting also reloaded the player and
 * restarted the clip, because holding position would have meant loading Dailymotion's SDK on
 * first paint to issue a mute command; none of that has to be reasoned about any more.
 */
export function BackgroundEmbed({ src, title }: BackgroundEmbedProps) {
  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <iframe
          src={playerUrl(src)}
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
    </>
  );
}
