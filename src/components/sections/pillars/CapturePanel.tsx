import { ImageAsset } from "@/components/ImageAsset";

export function CapturePanel() {
  return (
    <div id="graphics" className="flex h-full w-screen shrink-0 flex-col items-center justify-center gap-8 px-10">
      {/* Unsplash License (unsplash.com/photo-1506863530036-1efeddceb993) */}
      <ImageAsset
        src="/images/capture-portrait.jpg"
        alt="Black-and-white editorial studio portrait"
        aspectRatio="1:1"
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
