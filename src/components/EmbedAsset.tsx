type EmbedAssetProps = {
  src: string;
  /** Describes the clip, not the widget. Screen readers announce this as the frame's name. */
  title: string;
  className?: string;
};

/**
 * A third-party video player, held at 16:9.
 *
 * Sized by height rather than width. The frames this sits in are wide and short, and a
 * width-driven 16:9 box overflows them — 88vw of a 1440 viewport wants 713px of height in a
 * slot that has 522. Driving from height and letting width follow keeps the whole player in
 * view; `max-w-full` is only a guard for boxes wider than they are tall.
 *
 * Lazy on purpose. An eager third-party iframe fetches the player, its assets and its
 * network on first paint, for a clip most visitors never scroll to.
 */
export function EmbedAsset({ src, title, className }: EmbedAssetProps) {
  return (
    <div className={`flex h-full w-full items-center justify-center ${className ?? ""}`}>
      <div className="relative aspect-video h-full w-auto max-w-full overflow-hidden rounded-lg bg-ink shadow-[0_30px_80px_-30px_rgba(0,0,0,0.75)] ring-1 ring-surface/12">
        <iframe
          src={src}
          title={title}
          loading="lazy"
          allow="web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    </div>
  );
}
