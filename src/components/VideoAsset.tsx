"use client";

import { useEffect, useRef } from "react";

type VideoAssetProps = {
  src: string;
  /** "fill" covers the nearest positioned ancestor edge to edge, with no frame. */
  aspectRatio: "16:9" | "1:1" | "9:16" | "fill";
  className?: string;
};

const ASPECT_CLASS: Record<VideoAssetProps["aspectRatio"], string> = {
  "16:9": "aspect-video",
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16]",
  /** Fill takes its size from the ancestor it is pinned to, so it has no aspect of its own. */
  fill: "",
};

/** A framed figure is a figure; a full-bleed frame is the ground, and a border round the
    ground reads as a mistake. */
const FRAME_CLASS = "rounded-sm border border-ink/10";

export function VideoAsset({ src, aspectRatio, className }: VideoAssetProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isFill = aspectRatio === "fill";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      return;
    }

    // Autoplay only while the clip is actually visible, per motion-system.md's
    // performance and mobile motion rules.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // preload="none" means there is nothing buffered until the first play, so the
          // load is deferred to the moment the clip is actually wanted.
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className={`overflow-hidden ${
        isFill ? "absolute inset-0" : `relative ${ASPECT_CLASS[aspectRatio]}`
      } ${
        isFill ? "bg-ink" : FRAME_CLASS
      } ${className ?? ""}`}
    >
      <video
        ref={videoRef}
        src={src}
        className="h-full w-full object-cover"
        muted
        loop
        playsInline
        // Nothing is fetched until the observer below says the clip is on screen. The one
        // clip in the library is 15MB, which is more than the entire rest of the page.
        preload="none"
      />
    </div>
  );
}
