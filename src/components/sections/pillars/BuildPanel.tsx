import { ImageAsset } from "@/components/ImageAsset";

export function BuildPanel() {
  return (
    <div className="flex h-full w-screen shrink-0 flex-col items-center justify-center gap-8 px-10">
      {/* Photo by Bernd Dittrich, Unsplash License (unsplash.com/photo-1774901128215-3549cc686921) */}
      <ImageAsset
        src="/images/build-code-workspace.jpg"
        alt="Dark-themed code editor displaying a web project on a laptop screen"
        aspectRatio="16:9"
        className="w-full max-w-3xl"
      />
      <div className="max-w-xl text-center">
        <h2 className="text-4xl font-semibold text-surface">Build.</h2>
        <p className="mt-3 text-lg text-surface/80">
          We create fast, modern, high-performance digital experiences.
        </p>
        <ul className="mt-4 flex flex-wrap justify-center gap-3 text-sm uppercase tracking-widest text-surface/60">
          <li>Performance</li>
          <li>Reliability</li>
          <li>Scalability</li>
          <li>User experience</li>
        </ul>
      </div>
    </div>
  );
}
