import { PlaceholderAsset } from "@/components/PlaceholderAsset";

export function BuildPanel() {
  return (
    <div className="flex h-full w-screen flex-shrink-0 flex-col items-center justify-center gap-8 px-10">
      <PlaceholderAsset
        aspectRatio="16:9"
        label="Build — product UI capture"
        variant="grid"
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
