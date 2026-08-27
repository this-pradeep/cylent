import Image from "next/image";

type ImageAssetProps = {
  src: string;
  alt: string;
  /** "fill" covers the nearest positioned ancestor edge to edge, with no frame. */
  aspectRatio: "16:9" | "1:1" | "9:16" | "fill";
  className?: string;
  priority?: boolean;
  /** Defaults suit a half-width figure; a full-bleed frame must say so or it is served an undersized file. */
  sizes?: string;
  /**
   * "cover" fills and crops, which is right for a photograph. "contain" fits the whole
   * frame in, which is the only correct treatment for a product shot — cropping a device
   * mockup cuts the device.
   */
  fit?: "cover" | "contain";
};

const ASPECT_CLASS: Record<ImageAssetProps["aspectRatio"], string> = {
  "16:9": "aspect-video",
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16]",
  /** Fill takes its size from the ancestor it is pinned to, so it has no aspect of its own. */
  fill: "",
};

/** A framed figure is a figure; a full-bleed frame is the ground, and a border round the
    ground reads as a mistake. */
const FRAME_CLASS = "rounded-sm border border-ink/10";

export function ImageAsset({
  src,
  alt,
  aspectRatio,
  className,
  priority,
  sizes,
  fit = "cover",
}: ImageAssetProps) {
  const isFill = aspectRatio === "fill";

  return (
    <div
      className={`overflow-hidden ${
        isFill ? "absolute inset-0" : `relative ${ASPECT_CLASS[aspectRatio]}`
      } ${
        isFill ? "" : FRAME_CLASS
      } ${className ?? ""}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? (isFill ? "100vw" : "(min-width: 768px) 50vw, 100vw")}
        className={fit === "contain" ? "object-contain" : "object-cover"}
        priority={priority}
      />
    </div>
  );
}
