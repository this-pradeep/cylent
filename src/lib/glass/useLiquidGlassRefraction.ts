"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { buildChromaticFilter, type ChromaticGlassOptions } from "@/lib/glass/build-filter";

let uid = 0;

export function useLiquidGlassRefraction(
  targetRef: RefObject<HTMLElement | null>,
  options: ChromaticGlassOptions,
  enabled: boolean
): string | null {
  const [filterUrl, setFilterUrl] = useState<string | null>(null);
  const filterIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = targetRef.current;
    if (!el) return;

    const defs = document.getElementById("glass-defs");
    if (!defs) return;

    const rebuild = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.max(4, Math.round(rect.width));
      const height = Math.max(4, Math.round(rect.height));
      const radius = options.radius ?? (parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0);
      const clampedRadius = Math.min(radius, width / 2, height / 2);

      const id = filterIdRef.current ?? `lg-${++uid}`;
      filterIdRef.current = id;

      document.getElementById(id)?.remove();

      const filter = buildChromaticFilter(id, width, height, clampedRadius, options);
      defs.appendChild(filter);
      setFilterUrl(`url(#${id})`);
    };

    rebuild();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(rebuild, 180);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
      const id = filterIdRef.current;
      if (id) document.getElementById(id)?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, options.depth, options.sat, options.band, options.ca, options.radius]);

  return filterUrl;
}
