import { PlaceholderAsset } from "@/components/PlaceholderAsset";

export function MovePanel() {
  return (
    <div className="flex h-full w-screen flex-shrink-0 flex-col items-center justify-center gap-8 px-10">
      <PlaceholderAsset
        aspectRatio="16:9"
        label="Move — video loop"
        variant="film"
        className="w-full max-w-3xl"
      />
      <div className="max-w-xl text-center">
        <h2 className="text-4xl font-semibold text-surface">Move.</h2>
        <p className="mt-3 text-lg text-surface/80">
          We create stories that connect emotionally.
        </p>
        <ul className="mt-4 flex flex-wrap justify-center gap-3 text-sm uppercase tracking-widest text-surface/60">
          <li>Narrative</li>
          <li>Motion</li>
          <li>Engagement</li>
          <li>Brand storytelling</li>
        </ul>
      </div>
    </div>
  );
}
