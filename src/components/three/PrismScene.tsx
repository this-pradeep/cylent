"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  BASE_ROTATION,
  BEAM_DIRECTION,
  ROTATION_RANGE,
  type Vec2,
  add,
  dot,
  iorAt,
  normalize,
  scale,
  sub,
  tracePrism,
  trianglePoints,
  v2,
} from "@/lib/three/prism-optics";
import {
  prismLineFragmentShader,
  prismLineVertexShader,
} from "@/lib/three/prism-shaders";
import { CHROMATIC_PALETTE } from "@/lib/three/palette";

type PrismSceneProps = {
  /** 0 = Websites, 1 = Videos, 2 = Brands. Shifts the prism slightly per discipline. */
  index: number;
  className?: string;
};

/** Wavelengths traced through the glass. Each one is a ray in the fan. */
const RAY_COUNT = 26;
/** Parallel rays drawn for the incoming beam, so it reads as a beam and not a line. */
const BEAM_LINES = 3;
const BEAM_HALF_WIDTH = 0.055;

const PRISM_RADIUS = 0.4;
const INCOMING_DIR = normalize(BEAM_DIRECTION);
const INCOMING_LENGTH = 3.4;
const OUTGOING_LENGTH = 4.2;

/**
 * Screen-space extrusion. The prism is solved as a 2D cross-section, so depth is
 * drawn rather than simulated: offsetting a second triangle up and to the right and
 * joining the two gives the receding faces that make it read as a wedge of glass
 * instead of a filled triangle.
 */
const DEPTH = scale(normalize(v2(Math.cos(1.19), Math.sin(1.19))), PRISM_RADIUS * 0.46);
/** Key light, upper left — decides which receding face is bright and which is shaded. */
const LIGHT = normalize(v2(-0.45, 0.89));

const PAN_X = 0.07;
const PAN_Y = 0.05;
const IDLE_ROTATION = (2.1 * Math.PI) / 180;

const MAX_QUADS = RAY_COUNT * 2 + BEAM_LINES + 20;
const VERTS = MAX_QUADS * 4;

/** Red through violet, taken from the palette the cursor lens and loader bar use. */
const SPECTRUM = CHROMATIC_PALETTE.slice(0, 5);

function spectrumColor(t: number): [number, number, number] {
  const x = Math.min(0.9999, Math.max(0, t)) * (SPECTRUM.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = SPECTRUM[i];
  const b = SPECTRUM[i + 1];
  return [
    a[0] + (b[0] - a[0]) * f,
    a[1] + (b[1] - a[1]) * f,
    a[2] + (b[2] - a[2]) * f,
  ];
}

function detectWebGLSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function PrismScene({ index, className }: PrismSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const indexRef = useRef(index);
  const reducedRef = useRef(false);
  const [mode, setMode] = useState<"loading" | "webgl" | "static">("loading");

  indexRef.current = index;

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMode(detectWebGLSupport() ? "webgl" : "static");
  }, []);

  useEffect(() => {
    if (mode !== "webgl") return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowPower = typeof nav.deviceMemory === "number" && nav.deviceMemory < 4;

    const positions = new Float32Array(VERTS * 3);
    const colors = new Float32Array(VERTS * 3);
    const alphas = new Float32Array(VERTS);
    const indices = new Uint16Array(MAX_QUADS * 6);
    for (let q = 0; q < MAX_QUADS; q++) {
      const v = q * 4;
      indices.set([v, v + 1, v + 2, v, v + 2, v + 3], q * 6);
    }

    const geometry = new THREE.BufferGeometry();
    const positionAttr = new THREE.BufferAttribute(positions, 3).setUsage(
      THREE.DynamicDrawUsage,
    );
    const colorAttr = new THREE.BufferAttribute(colors, 3).setUsage(
      THREE.DynamicDrawUsage,
    );
    const alphaAttr = new THREE.BufferAttribute(alphas, 1).setUsage(
      THREE.DynamicDrawUsage,
    );
    geometry.setAttribute("position", positionAttr);
    geometry.setAttribute("aColor", colorAttr);
    geometry.setAttribute("aAlpha", alphaAttr);
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader: prismLineVertexShader,
      fragmentShader: prismLineFragmentShader,
      uniforms: { uOpacity: { value: 1 } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;

    const scene = new THREE.Scene();
    scene.add(mesh);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !lowPower,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2));

    let aspect = 1;
    let unitsPerPixel = 1 / 400;

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height, false);
      aspect = width / height;
      camera.left = -aspect;
      camera.right = aspect;
      camera.top = 1;
      camera.bottom = -1;
      camera.updateProjectionMatrix();
      unitsPerPixel = 2 / height;
    };
    resize();

    // ---- geometry writing -------------------------------------------------
    let quad = 0;
    const writeQuad = (
      a: Vec2,
      b: Vec2,
      widthPx: number,
      color: [number, number, number],
      alphaA: number,
      alphaB: number,
    ) => {
      if (quad >= MAX_QUADS) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len < 1e-6) return;
      const half = (widthPx * unitsPerPixel) / 2;
      const nx = (-dy / len) * half;
      const ny = (dx / len) * half;

      const v = quad * 4;
      const p = [
        a.x + nx, a.y + ny, 0,
        a.x - nx, a.y - ny, 0,
        b.x - nx, b.y - ny, 0,
        b.x + nx, b.y + ny, 0,
      ];
      positions.set(p, v * 3);
      for (let i = 0; i < 4; i++) colors.set(color, (v + i) * 3);
      alphas[v] = alphaA;
      alphas[v + 1] = alphaA;
      alphas[v + 2] = alphaB;
      alphas[v + 3] = alphaB;
      quad++;
    };

    /** An arbitrary quad, used for the prism's faces. Corners must be in order. */
    const writeFace = (
      a: Vec2,
      b: Vec2,
      c: Vec2,
      d: Vec2,
      color: [number, number, number],
      alpha: number,
    ) => {
      if (quad >= MAX_QUADS) return;
      const v = quad * 4;
      positions.set(
        [a.x, a.y, 0, b.x, b.y, 0, c.x, c.y, 0, d.x, d.y, 0],
        v * 3,
      );
      for (let i = 0; i < 4; i++) {
        colors.set(color, (v + i) * 3);
        alphas[v + i] = alpha;
      }
      quad++;
    };

    const INK: [number, number, number] = [0.08, 0.07, 0.06];
    const BEAM: [number, number, number] = [0.34, 0.32, 0.29];
    const GLASS: [number, number, number] = [0.46, 0.52, 0.63];

    const build = (rotation: number, center: Vec2) => {
      quad = 0;
      const tri = trianglePoints(center, PRISM_RADIUS, rotation);
      const back: Vec2[] = tri.map((p) => add(p, DEPTH));
      const centroid = v2(
        (tri[0].x + tri[1].x + tri[2].x) / 3,
        (tri[0].y + tri[1].y + tri[2].y) / 3,
      );

      // --- the solid -------------------------------------------------------
      // Faces first so the ribbons and edges draw over them: one indexed draw
      // call renders in index order, which is the only depth ordering here.
      const sideVisible: boolean[] = [];
      for (let i = 0; i < 3; i++) {
        const a = tri[i];
        const b = tri[(i + 1) % 3];
        let n = normalize(v2(b.y - a.y, -(b.x - a.x)));
        if (dot(n, sub(a, centroid)) < 0) n = scale(n, -1);
        const visible = dot(n, DEPTH) > 0;
        sideVisible.push(visible);
        if (!visible) continue;

        // Lambert-ish: the face turned toward the key light is the one that lets
        // most light through, so it is the least tinted.
        const lit = Math.max(0, dot(n, LIGHT));
        writeFace(a, b, back[(i + 1) % 3], back[i], GLASS, 0.17 - lit * 0.1);
      }

      // Front triangular face, written as a degenerate quad.
      writeFace(tri[0], tri[1], tri[2], tri[2], GLASS, 0.085);

      // Incoming beam: a few parallel rays offset across the beam's width.
      const perp = v2(-INCOMING_DIR.y, INCOMING_DIR.x);
      for (let i = 0; i < BEAM_LINES; i++) {
        const o = (i / (BEAM_LINES - 1) - 0.5) * 2 * BEAM_HALF_WIDTH;
        const through = add(center, scale(perp, o));
        const start = add(through, scale(INCOMING_DIR, -INCOMING_LENGTH));
        const hit = tracePrism(start, INCOMING_DIR, tri, 1.5);
        const end = hit ? hit.entry : through;
        writeQuad(start, end, 1.1, BEAM, 0, 0.3);
      }

      // One entry point, many wavelengths: the fan comes from the glass, not from
      // drawing a fan.
      const beamStart = add(center, scale(INCOMING_DIR, -INCOMING_LENGTH));
      for (let i = 0; i < RAY_COUNT; i++) {
        const t = i / (RAY_COUNT - 1);
        const path = tracePrism(beamStart, INCOMING_DIR, tri, iorAt(t));
        if (!path) continue;
        const color = spectrumColor(t);
        writeQuad(path.entry, path.exit, 1.2, color, 0.28, 0.5);
        const far = add(path.exit, scale(path.outDir, OUTGOING_LENGTH));
        writeQuad(path.exit, far, 1.5, color, 0.62, 0);
      }

      // --- edges, last so they sit crisply over everything ------------------
      // On a near-white surface a glass highlight would be invisible, so the form
      // is carried entirely by ink weight: near edges dark, receding edges faint.
      for (let i = 0; i < 3; i++) {
        if (!sideVisible[i]) continue;
        writeQuad(back[i], back[(i + 1) % 3], 1, INK, 0.14, 0.14);
      }
      for (let i = 0; i < 3; i++) {
        // Only the corners between a visible and a hidden face show a joining edge.
        if (sideVisible[i] === sideVisible[(i + 2) % 3]) continue;
        writeQuad(tri[i], back[i], 1, INK, 0.3, 0.13);
      }
      for (let i = 0; i < 3; i++) {
        writeQuad(tri[i], tri[(i + 1) % 3], 1.3, INK, 0.36, 0.36);
      }

      geometry.setDrawRange(0, quad * 6);
      positionAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
      alphaAttr.needsUpdate = true;
    };

    // ---- interaction ------------------------------------------------------
    const pointer = { x: 0, y: 0 };
    const target = { rot: 0, panX: 0, panY: 0 };
    const current = { rot: 0, panX: 0, panY: 0 };
    let dragging = false;
    let dragRot = 0;
    let lastDragX = 0;

    const clampRot = (r: number) =>
      Math.max(-ROTATION_RANGE, Math.min(ROTATION_RANGE, r));

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;

      if (dragging) {
        dragRot = clampRot(dragRot + (event.clientX - lastDragX) * 0.0022);
        lastDragX = event.clientX;
      }
      target.panX = pointer.x * PAN_X;
      target.panY = -pointer.y * PAN_Y;
      target.rot = clampRot(dragRot + pointer.x * ROTATION_RANGE * 0.45);
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      lastDragX = event.clientX;
    };
    const onPointerUp = () => {
      dragging = false;
    };
    const onPointerLeave = () => {
      dragging = false;
      target.panX = 0;
      target.panY = 0;
      target.rot = clampRot(dragRot);
    };

    const interactive = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (interactive && !reducedRef.current) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      container.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointerup", onPointerUp);
      container.addEventListener("pointerleave", onPointerLeave);
    }

    // ---- loop -------------------------------------------------------------
    const startedAt = performance.now();
    let rafId: number | null = null;

    const draw = () => {
      const time = (performance.now() - startedAt) / 1000;
      const idle = reducedRef.current ? 0 : Math.sin(time * 0.34) * IDLE_ROTATION;
      // Each discipline gets a slightly different seat in the safe rotation band.
      const disciplineOffset = (indexRef.current - 1) * ROTATION_RANGE * 0.22;

      const k = reducedRef.current ? 1 : 0.06;
      current.rot += (target.rot - current.rot) * k;
      current.panX += (target.panX - current.panX) * k;
      current.panY += (target.panY - current.panY) * k;

      const center = v2(aspect * 0.2 + current.panX, 0.3 + current.panY);
      build(BASE_ROTATION + clampRot(current.rot + idle + disciplineOffset), center);
      renderer.render(scene, camera);
    };

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

    if (reducedRef.current) {
      draw();
    } else {
      wake();
    }

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw();
    });
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (reducedRef.current) return;
        if (entries[0].isIntersecting) wake();
        else sleep();
      },
      { threshold: 0.02 },
    );
    intersectionObserver.observe(container);

    const onVisibility = () => {
      if (reducedRef.current) return;
      if (document.hidden) sleep();
      else wake();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      sleep();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointerleave", onPointerLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [mode]);

  return (
    <div
      ref={containerRef}
      data-hero-creative
      aria-hidden="true"
      className={`absolute ${className ?? ""}`}
    >
      {mode === "webgl" && <canvas ref={canvasRef} className="h-full w-full" />}
    </div>
  );
}
