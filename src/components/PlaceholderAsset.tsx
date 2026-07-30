type PlaceholderAssetProps = {
  aspectRatio: "16:9" | "1:1" | "9:16";
  label: string;
  variant: "grid" | "photo" | "film";
  className?: string;
};

const ASPECT_CLASS: Record<PlaceholderAssetProps["aspectRatio"], string> = {
  "16:9": "aspect-video",
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16]",
};

const VARIANT_CLASS: Record<PlaceholderAssetProps["variant"], string> = {
  grid: "bg-[repeating-linear-gradient(0deg,transparent,transparent_23px,var(--color-ink)_24px),repeating-linear-gradient(90deg,transparent,transparent_23px,var(--color-ink)_24px)] bg-ink/5",
  photo: "bg-gradient-to-b from-accent/30 to-surface",
  film: "bg-gradient-to-r from-ink via-accent/50 to-ink",
};

export function PlaceholderAsset({ aspectRatio, label, variant, className }: PlaceholderAssetProps) {
  return (
    <div
      data-asset-slot={label}
      className={`relative overflow-hidden rounded-sm border border-ink/10 ${ASPECT_CLASS[aspectRatio]} ${VARIANT_CLASS[variant]} ${className ?? ""}`}
    >
      <span className="absolute bottom-2 left-2 text-xs uppercase tracking-widest text-ink-muted/80">
        {label}
      </span>
    </div>
  );
}
