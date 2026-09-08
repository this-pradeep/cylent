type BackgroundEmbedProps = {
  /** The player URL, already identifying the clip it plays. */
  src: string;
  title: string;
};

/**
 * Player parameters that turn an embed into a background.
 *
 * Written in the embedder's own syntax: every option the player API documents in camelCase
 * arrives here snake-cased and nested under `player[...]`, and URLSearchParams encodes the
 * brackets on the way out.
 *
 * `muted` is not a setting. Autoplay is only granted to muted video in the first place, and
 * a background that can make noise is not a background — a visitor who scrolls into a
 * section and gets sound has been interrupted by something they did not ask to play. It is
 * fixed here rather than defaulted so there is nowhere for it to be turned off.
 *
 * The rest strips the player back to picture: no controls, no play button, no logo, and no
 * context menu on a frame that is not meant to be clickable in the first place.
 */
function playerUrl(src: string): string {
  const join = src.includes("?") ? "&" : "?";
  return `${src}${join}${new URLSearchParams({
    "player[muted]": "true",
    "player[autoplay_mode]": "always",
    "player[loop]": "true",
    "player[controls]": "false",
    "player[big_play_button]": "false",
    "player[show_logo]": "false",
    "player[hide_context_menu]": "true",
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
 * restarted the clip, because holding position would have meant loading the player's SDK on
 * first paint to issue a mute command; none of that has to be reasoned about any more.
 */
export function BackgroundEmbed({ src, title }: BackgroundEmbedProps) {
  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <iframe
          src={playerUrl(src)}
          title={title}
          /**
           * Lazy, for the same reason EmbedAsset is, which this component should have been
           * from the start. It sits in a section below the fold, and eager it fetched on
           * first paint: against the player this replaced, a Lighthouse run put close to a
           * megabyte of player, ad SDK and player fonts on the homepage's initial load and
           * three of those fonts on the critical path, for a 13.3 s Speed Index.
           *
           * A muted background loop nobody has scrolled to has no business doing any of that
           * before the hero has finished painting.
           */
          loading="lazy"
          allow="autoplay; encrypted-media"
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
