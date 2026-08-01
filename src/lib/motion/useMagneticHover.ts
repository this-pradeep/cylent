"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";

const MAGNETIC_STRENGTH = 0.35;

export function useMagneticHover(ref: RefObject<HTMLElement | null>, disabled: boolean): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canHover) return;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const offsetX = (event.clientX - (rect.left + rect.width / 2)) * MAGNETIC_STRENGTH;
      const offsetY = (event.clientY - (rect.top + rect.height / 2)) * MAGNETIC_STRENGTH;
      gsap.to(el, { x: offsetX, y: offsetY, duration: 0.3, ease: "power2.out", overwrite: true });
    };

    const handlePointerLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.3, ease: "power2.out", overwrite: true });
    };

    el.addEventListener("pointermove", handlePointerMove);
    el.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      el.removeEventListener("pointermove", handlePointerMove);
      el.removeEventListener("pointerleave", handlePointerLeave);
      gsap.killTweensOf(el);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [ref, disabled]);
}
