import { PlaceholderAsset } from "@/components/PlaceholderAsset";

export function CapturePanel() {
  return (
    <div className="flex h-full w-screen flex-shrink-0 flex-col items-center justify-center gap-8 px-10">
      <PlaceholderAsset
        aspectRatio="1:1"
        label="Capture — brand identity still"
        variant="photo"
        className="w-full max-w-md"
      />
      <div className="max-w-xl text-center">
        <h2 className="text-4xl font-semibold text-surface">Capture.</h2>
        <p className="mt-3 text-lg text-surface/80">
          We create visual identities that communicate personality and quality.
        </p>
        <ul className="mt-4 flex flex-wrap justify-center gap-3 text-sm uppercase tracking-widest text-surface/60">
          <li>Branding</li>
          <li>Visual storytelling</li>
          <li>Creative direction</li>
          <li>Design systems</li>
        </ul>
      </div>
    </div>
  );
}
