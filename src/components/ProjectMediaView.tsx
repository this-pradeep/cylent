import { EmbedAsset } from "@/components/EmbedAsset";
import { ImageAsset } from "@/components/ImageAsset";
import { VideoAsset } from "@/components/VideoAsset";
import type { ProjectMedia } from "@/lib/site/projects";

type ProjectMediaViewProps = {
  media: ProjectMedia;
  /** "fill" pins to the nearest positioned ancestor; "16:9" holds its own box. */
  aspectRatio: "fill" | "16:9";
  priority?: boolean;
};

/**
 * Renders whichever of the three media kinds a project carries.
 *
 * One place, because there are three surfaces showing projects and the branch had been
 * copied into all of them. The compiler caught it the moment a third kind appeared — three
 * copies of a two-way branch is three chances to forget the new case.
 */
export function ProjectMediaView({ media, aspectRatio, priority }: ProjectMediaViewProps) {
  if (media.kind === "embed") {
    // A player needs a box with height before it can size itself into one.
    return (
      <div className={aspectRatio === "16:9" ? "aspect-video w-full" : "h-full w-full"}>
        <EmbedAsset src={media.src} title={media.title} />
      </div>
    );
  }

  if (media.kind === "video") {
    return <VideoAsset src={media.src} aspectRatio={aspectRatio} />;
  }

  return (
    <ImageAsset
      src={media.src}
      alt={media.alt}
      aspectRatio={aspectRatio}
      priority={priority}
      fit={media.fit}
      // A contained shot needs something behind it; the transparency would otherwise sit
      // straight on whatever ground the frame happens to have.
      className={media.fit === "contain" && aspectRatio === "16:9" ? "bg-panel" : undefined}
    />
  );
}
