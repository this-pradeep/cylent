import Image from "next/image";

type ImageAssetProps = {
  src: string;
  alt: string;
  aspectRatio: "16:9" | "1:1" | "9:16";
  className?: string;
  priority?: boolean;
};

const ASPECT_CLASS: Record<ImageAssetProps["aspectRatio"], string> = {
  "16:9": "aspect-video",
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16]",
};

export function ImageAsset({ src, alt, aspectRatio, className, priority }: ImageAssetProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-sm border border-ink/10 ${ASPECT_CLASS[aspectRatio]} ${className ?? ""}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="object-cover"
        priority={priority}
      />
    </div>
  );
}
