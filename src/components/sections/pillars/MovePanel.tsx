import { VideoAsset } from "@/components/VideoAsset";

export function MovePanel() {
  return (
    <div className="flex h-full w-screen shrink-0 flex-col items-center justify-center gap-8 px-10">
      {/* Video by Trev W. Adams, Pexels License (pexels.com/video/night-traffic-in-city-13567267), 15MB — candidate for re-encoding/compression before production */}
      <VideoAsset
        src="/videos/move-city-night.mp4"
        aspectRatio="9:16"
        className="h-[60vh] max-h-130 w-auto"
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
