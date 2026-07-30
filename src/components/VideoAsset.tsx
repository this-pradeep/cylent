"use client";

import { useEffect, useRef } from "react";

type VideoAssetProps = {
  src: string;
  aspectRatio: "16:9" | "1:1" | "9:16";
  className?: string;
};

const ASPECT_CLASS: Record<VideoAssetProps["aspectRatio"], string> = {
  "16:9": "aspect-video",
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16]",
};

export function VideoAsset({ src, aspectRatio, className }: VideoAssetProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

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
      className={`relative overflow-hidden rounded-sm border border-ink/10 ${ASPECT_CLASS[aspectRatio]} ${className ?? ""}`}
    >
      <video
        ref={videoRef}
        src={src}
        className="h-full w-full object-cover"
        muted
        loop
        playsInline
        preload="metadata"
      />
    </div>
  );
}
