"use client";

import { useEffect, useRef, useState } from "react";
import { useLiquidGlassRefraction } from "@/lib/glass/useLiquidGlassRefraction";

const SNAP_SELECTOR = "a, button, [data-cursor]";
const LENS_SIZE = 76;
const LENS_RADIUS = 38;
const PAD = 7;
const HIGHLIGHT_FILTER = "saturate(1.45) brightness(1.14)";

type CursorState = {
  mx: number;
  my: number;
  cx: number;
  cy: number;
  raf: number | null;
  snapEl: Element | null;
  snapRadius: number;
  lastW: number;
  lastH: number;
  lastR: number;
};

export function LiquidGlassCursor() {
  const [active, setActive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [canRefract, setCanRefract] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);

  const refractionUrl = useLiquidGlassRefraction(
    lensRef,
    { depth: 62, sat: 1.55, band: 15, ca: 0.4, radius: LENS_RADIUS },
    active && canRefract
  );

  useEffect(() => {
    setCanRefract(typeof CSS !== "undefined" && CSS.supports("backdrop-filter", "url(#x)"));
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowPower = typeof nav.deviceMemory === "number" && nav.deviceMemory < 4;
    setActive(finePointer && !lowPower);
  }, []);

  useEffect(() => {
    if (!active) return;
    document.body.classList.add("has-cursor");
    return () => {
      document.body.classList.remove("has-cursor");
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const cursor = cursorRef.current;
    const lens = lensRef.current;
    if (!cursor || !lens) return;

    const ease = reducedMotion ? 1 : 0.18;
    const state: CursorState = {
      mx: window.innerWidth / 2,
      my: window.innerHeight / 2,
      cx: window.innerWidth / 2,
      cy: window.innerHeight / 2,
      raf: null,
      snapEl: null,
      snapRadius: 12,
      lastW: 0,
      lastH: 0,
      lastR: 0,
    };

    const setLensSize = (w: number, h: number, r: number) => {
      if (w !== state.lastW) {
        lens.style.width = `${w}px`;
        state.lastW = w;
      }
      if (h !== state.lastH) {
        lens.style.height = `${h}px`;
        state.lastH = h;
      }
      if (r !== state.lastR) {
        lens.style.borderRadius = `${r}px`;
        state.lastR = r;
      }
    };

    setLensSize(LENS_SIZE, LENS_SIZE, LENS_RADIUS);

    const tick = () => {
      let tx: number;
      let ty: number;
      if (state.snapEl) {
        const rect = state.snapEl.getBoundingClientRect();
        const ecx = rect.left + rect.width / 2;
        const ecy = rect.top + rect.height / 2;
        tx = ecx + (state.mx - ecx) * 0.14;
        ty = ecy + (state.my - ecy) * 0.14;
        const w = rect.width + PAD * 2;
        const h = rect.height + PAD * 2;
        setLensSize(w, h, state.snapRadius >= rect.height / 2 ? h / 2 : state.snapRadius + PAD);
      } else {
        tx = state.mx;
        ty = state.my;
      }

      state.cx += (tx - state.cx) * ease;
      state.cy += (ty - state.cy) * ease;
      cursor.style.transform = `translate3d(${state.cx}px, ${state.cy}px, 0)`;

      if (Math.abs(tx - state.cx) > 0.12 || Math.abs(ty - state.cy) > 0.12 || state.snapEl) {
        state.raf = requestAnimationFrame(tick);
      } else {
        state.raf = null;
      }
    };

    const wake = () => {
      if (state.raf === null && !document.hidden) {
        state.raf = requestAnimationFrame(tick);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      state.mx = event.clientX;
      state.my = event.clientY;
      cursor.classList.add("on");
      wake();
    };

    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const el = target?.closest(SNAP_SELECTOR);
      if (!el || el === state.snapEl) return;
      state.snapEl = el;
      state.snapRadius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 10;
      cursor.classList.add("snapped");
      lens.style.backdropFilter = HIGHLIGHT_FILTER;
      lens.style.setProperty("-webkit-backdrop-filter", HIGHLIGHT_FILTER);
      wake();
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (!state.snapEl) return;
      const leavingTo = event.relatedTarget as Node | null;
      if (leavingTo && state.snapEl.contains(leavingTo)) return;
      const leavingToEl = leavingTo as Element | null;
      if (leavingToEl?.closest && leavingToEl.closest(SNAP_SELECTOR) === state.snapEl) return;
      state.snapEl = null;
      cursor.classList.remove("snapped");
      setLensSize(LENS_SIZE, LENS_SIZE, LENS_RADIUS);
      const base = refractionUrl ?? "";
      if (base) {
        lens.style.backdropFilter = base;
        lens.style.setProperty("-webkit-backdrop-filter", base);
      } else {
        lens.style.removeProperty("backdrop-filter");
        lens.style.removeProperty("-webkit-backdrop-filter");
      }
      wake();
    };

    const handlePointerDown = () => cursor.classList.add("pressing");
    const handlePointerUp = () => cursor.classList.remove("pressing");
    const handleVisibilityChange = () => {
      if (document.hidden && state.raf !== null) {
        cancelAnimationFrame(state.raf);
        state.raf = null;
      } else if (!document.hidden) {
        wake();
      }
    };
    const handleMouseLeaveDoc = () => cursor.classList.remove("on");
    const handleMouseEnterDoc = () => cursor.classList.add("on");

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerover", handlePointerOver, { passive: true } as AddEventListenerOptions);
    document.addEventListener("pointerout", handlePointerOut, { passive: true } as AddEventListenerOptions);
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("scroll", wake, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.documentElement.addEventListener("mouseleave", handleMouseLeaveDoc);
    document.documentElement.addEventListener("mouseenter", handleMouseEnterDoc);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointerout", handlePointerOut);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("scroll", wake);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeaveDoc);
      document.documentElement.removeEventListener("mouseenter", handleMouseEnterDoc);
      if (state.raf !== null) cancelAnimationFrame(state.raf);
    };
  }, [active, reducedMotion, refractionUrl]);

  if (!active) return null;

  return (
    <div ref={cursorRef} aria-hidden="true" className="liquid-cursor">
      <div
        ref={lensRef}
        className="liquid-cursor-lens"
        style={{
          width: LENS_SIZE,
          height: LENS_SIZE,
          backdropFilter: refractionUrl ?? undefined,
          WebkitBackdropFilter: refractionUrl ?? undefined,
        }}
      />
    </div>
  );
}
