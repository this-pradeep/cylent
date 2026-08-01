"use client";

import { useEffect, useRef } from "react";
import {
  aperturePoints,
  collimate,
  prismRotationFor,
  scatter,
  type Segment,
} from "@/lib/light/chain";
import {
  type Vec2,
  add,
  iorAt,
  length,
  normalize,
  scale,
  sub,
  tracePrism,
  trianglePoints,
  v2,
} from "@/lib/three/prism-optics";
import { CHROMATIC_PALETTE } from "@/lib/three/palette";

const SCATTER_RAYS = 20;
const BAND_RAYS = 9;
const SPECTRUM_RAYS = 26;

/** Red through violet — the same five stops as the cursor lens and the loader bar. */
const SPECTRUM = CHROMATIC_PALETTE.slice(0, 5);

function spectrumCss(t: number, alpha: number): string {
  const x = Math.min(0.9999, Math.max(0, t)) * (SPECTRUM.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = SPECTRUM[i];
  const b = SPECTRUM[i + 1];
  const c = (k: number) => Math.round((a[k] + (b[k] - a[k]) * f) * 255);
  return `rgba(${c(0)}, ${c(1)}, ${c(2)}, ${alpha})`;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Draw a segment truncated to `progress` of its length, fading out along the way. */
function stroke(
  ctx: CanvasRenderingContext2D,
  s: Segment,
  progress: number,
  color: string,
  width: number,
) {
  if (progress <= 0.001) return;
  const end = add(s.a, scale(sub(s.b, s.a), Math.min(1, progress)));
  ctx.beginPath();
  ctx.moveTo(s.a.x, s.a.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

export function LightChainCanvas({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Pointer bends the beam; everything downstream re-solves from it.
    const target = { bend: 0, drift: 0 };
    const current = { bend: 0, drift: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      target.bend = nx * 0.1;
      target.drift = ny * 0.02;
    };
    if (fine && !reduced) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    const draw = () => {
      if (w === 0 || h === 0) return;
      ctx.clearRect(0, 0, w, h);

      // How far the section has travelled through the viewport drives how far the
      // light has got: the chain builds as you descend rather than sitting finished.
      const rect = host.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const raw = (vh - rect.top) / (rect.height + vh);
      const p = reduced ? 1 : Math.min(1, Math.max(0, raw));

      const pScatter = reduced ? 1 : smoothstep(0.08, 0.42, p);
      const pBand = reduced ? 1 : smoothstep(0.32, 0.66, p);
      const pFan = reduced ? 1 : smoothstep(0.58, 0.94, p);

      const k = reduced ? 1 : 0.08;
      current.bend += (target.bend - current.bend) * k;
      current.drift += (target.drift - current.drift) * k;

      // --- stations ---
      const s1 = v2(w * (0.6 + current.bend * 0.1), h * (0.15 + current.drift));
      const s2 = v2(w * (0.74 + current.bend * 0.05), h * (0.5 + current.drift * 0.6));
      const s3 = v2(w * (0.58 - current.bend * 0.06), h * (0.84 + current.drift * 0.3));
      const source = v2(w * (0.36 + current.bend * 0.3), -h * 0.08);

      const INK = (a: number) => `rgba(20, 18, 15, ${a})`;

      // --- one beam arrives (Imagine, before it is anything) ---
      stroke(ctx, { a: source, b: s1 }, Math.min(1, p * 4), INK(0.3), 1);

      // --- Imagine: it becomes possibilities ---
      const fan = scatter(s1, s2, SCATTER_RAYS, h * 0.1);
      fan.forEach((s, i) => {
        const lag = (i % 5) * 0.05;
        stroke(ctx, s, (pScatter - lag) / (1 - lag), INK(0.055 + (i % 3) * 0.016), 1);
      });

      // --- Build: they become one aligned, evenly spaced structure ---
      const bandDir = normalize(sub(s3, s2));
      const bandLength = length(sub(s3, s2));
      const band = collimate(s2, bandDir, BAND_RAYS, h * 0.028, bandLength);
      for (const s of band) stroke(ctx, s, pBand, INK(0.2), 1);

      // Aperture marks: the only apparatus drawn, one hairline per station.
      if (pBand > 0.02) {
        const across = aperturePoints(s2, bandDir, 2, h * 0.036);
        ctx.beginPath();
        ctx.moveTo(across[0].x, across[0].y);
        ctx.lineTo(across[1].x, across[1].y);
        ctx.strokeStyle = INK(0.34 * pBand);
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // --- Inspire: it leaves as a spectrum, and it is no longer ours ---
      const prismRadius = h * 0.05;
      const rotation = prismRotationFor(bandDir);
      const tri = trianglePoints(s3, prismRadius, rotation);

      if (pFan > 0.01) {
        ctx.beginPath();
        ctx.moveTo(tri[0].x, tri[0].y);
        ctx.lineTo(tri[1].x, tri[1].y);
        ctx.lineTo(tri[2].x, tri[2].y);
        ctx.closePath();
        ctx.strokeStyle = INK(0.3 * pFan);
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      const entry = add(s3, scale(bandDir, -prismRadius * 4));
      const far = Math.hypot(w, h) * 1.1;
      for (let i = 0; i < SPECTRUM_RAYS; i++) {
        const t = i / (SPECTRUM_RAYS - 1);
        const path = tracePrism(entry, bandDir, tri, iorAt(t));
        if (!path) continue;

        const end: Vec2 = add(path.exit, scale(path.outDir, far));
        const lag = t * 0.12;
        const local = Math.min(1, Math.max(0, (pFan - lag) / (1 - lag)));
        if (local <= 0.01) continue;

        const tip = add(path.exit, scale(sub(end, path.exit), local));
        const grad = ctx.createLinearGradient(path.exit.x, path.exit.y, tip.x, tip.y);
        grad.addColorStop(0, spectrumCss(t, 0.6));
        grad.addColorStop(1, spectrumCss(t, 0));
        ctx.beginPath();
        ctx.moveTo(path.exit.x, path.exit.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    };

    let rafId: number | null = null;
    const tick = () => {
      draw();
      rafId = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (rafId === null && !document.hidden) rafId = requestAnimationFrame(tick);
    };
    const sleep = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    if (reduced) draw();
    else wake();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw();
    });
    resizeObserver.observe(host);

    const io = new IntersectionObserver(
      (entries) => {
        if (reduced) return;
        if (entries[0].isIntersecting) wake();
        else sleep();
      },
      { threshold: 0 },
    );
    io.observe(host);

    const onVisibility = () => {
      if (reduced) return;
      if (document.hidden) sleep();
      else wake();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      sleep();
      resizeObserver.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <div ref={hostRef} aria-hidden="true" className={className}>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
