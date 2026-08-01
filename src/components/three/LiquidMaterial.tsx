"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { createLiquidGeometry, createSparkleGeometry } from "@/lib/three/morphGeometry";
import { vertexShader, fragmentShader, sparkleVertexShader, sparkleFragmentShader } from "@/lib/three/shaders";
import { SLIDE_DURATION_S } from "@/lib/motion/rotator-timing";

type LiquidMaterialProps = {
  index: number;
};

type SceneState = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  sparkles: THREE.Points;
  sparkleMaterial: THREE.ShaderMaterial;
  clock: THREE.Clock;
  rafId: number | null;
};

function detectWebGLSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function LiquidMaterial({ index }: LiquidMaterialProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneState | null>(null);
  const stepRef = useRef(0);
  const isFirstIndexRender = useRef(true);
  const [mode, setMode] = useState<"loading" | "webgl" | "static">("loading");

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMode(prefersReducedMotion || !detectWebGLSupport() ? "static" : "webgl");
  }, []);

  useEffect(() => {
    if (mode !== "webgl") return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowPower = typeof nav.deviceMemory === "number" && nav.deviceMemory < 4;

    const detail = lowPower ? 3 : 5;
    const sparkleCount = lowPower ? 24 : 60;
    const pixelRatioCap = lowPower ? 1.5 : 2;

    const { geometry, webPositions } = createLiquidGeometry(detail);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uInfluence0: { value: 0 },
        uInfluence1: { value: 0 },
        uTime: { value: 0 },
        uWobbleAmp: { value: 0.045 },
        uOpacity: { value: 0.95 },
        uRimPower: { value: 2.2 },
        uDispersion: { value: 0.4 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    const mesh = new THREE.Mesh(geometry, material);

    const sparkleGeometry = createSparkleGeometry(webPositions, sparkleCount);
    const sparkleMaterial = new THREE.ShaderMaterial({
      vertexShader: sparkleVertexShader,
      fragmentShader: sparkleFragmentShader,
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sparkles = new THREE.Points(sparkleGeometry, sparkleMaterial);

    const scene = new THREE.Scene();
    scene.add(mesh);
    scene.add(sparkles);

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10);
    camera.position.set(0, 0, 3.4);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));

    const state: SceneState = {
      renderer,
      scene,
      camera,
      mesh,
      material,
      sparkles,
      sparkleMaterial,
      clock: new THREE.Clock(),
      rafId: null,
    };
    sceneRef.current = state;

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();

    const tick = () => {
      const t = state.clock.getElapsedTime();
      material.uniforms.uTime.value = t;
      sparkleMaterial.uniforms.uTime.value = t;
      mesh.rotation.y = t * 0.12;
      mesh.rotation.x = Math.sin(t * 0.18) * 0.15;
      sparkles.rotation.y = mesh.rotation.y;
      sparkles.rotation.x = mesh.rotation.x;
      renderer.render(scene, camera);
      state.rafId = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (state.rafId === null && !document.hidden) {
        state.rafId = requestAnimationFrame(tick);
      }
    };
    const sleep = () => {
      if (state.rafId !== null) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
      }
    };

    wake();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) wake();
        else sleep();
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    const handleVisibility = () => {
      if (document.hidden) sleep();
      else wake();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      sleep();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      geometry.dispose();
      material.dispose();
      sparkleGeometry.dispose();
      sparkleMaterial.dispose();
      renderer.dispose();
      sceneRef.current = null;
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== "webgl") return;
    if (isFirstIndexRender.current) {
      isFirstIndexRender.current = false;
      return;
    }

    stepRef.current += 1;
    const targetT = stepRef.current;
    const proxy = { t: targetT - 1 };

    const tween = gsap.to(proxy, {
      t: targetT,
      duration: SLIDE_DURATION_S,
      ease: "power3.out",
      onUpdate: () => {
        const state = sceneRef.current;
        if (!state) return;
        const cycled = ((proxy.t % 3) + 3) % 3;
        let i0 = 0;
        let i1 = 0;
        if (cycled < 1) {
          i0 = cycled;
        } else if (cycled < 2) {
          i0 = 2 - cycled;
          i1 = cycled - 1;
        } else {
          i1 = 3 - cycled;
        }
        state.material.uniforms.uInfluence0.value = i0;
        state.material.uniforms.uInfluence1.value = i1;
      },
    });

    return () => {
      tween.kill();
    };
  }, [index, mode]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      {mode === "webgl" && <canvas ref={canvasRef} className="h-full w-full" />}
      {mode === "static" && <div className="chromatic-ring h-2/3 w-2/3 max-w-xl rounded-full bg-ink/5" />}
    </div>
  );
}
