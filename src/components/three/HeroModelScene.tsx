"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type HeroModelSceneProps = {
  /** 0 = Websites, 1 = Videos, 2 = Designs. Gives each discipline its own resting angle. */
  index: number;
  className?: string;
};

const MODEL_URL = "/images/hero-model.glb";
/** Longest edge of the model, in world units, after normalising. */
const TARGET_SIZE = 2.5;
const IDLE_SPEED = 0.055;
const POINTER_TILT = 0.42;
const DRAG_SENSITIVITY = 0.005;

function detectWebGLSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function HeroModelScene({ index, className }: HeroModelSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const indexRef = useRef(index);
  const [mode, setMode] = useState<"loading" | "webgl" | "static">("loading");

  indexRef.current = index;

  useEffect(() => {
    setMode(detectWebGLSupport() ? "webgl" : "static");
  }, []);

  useEffect(() => {
    if (mode !== "webgl") return;
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowPower = typeof nav.deviceMemory === "number" && nav.deviceMemory < 4;

    let disposed = false;
    let rafId: number | null = null;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !lowPower,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    // The model ships no textures and no lights, so a generated room environment does
    // the work: it gives the glossy and near-transparent materials something to
    // reflect. Cheaper and sharper than lights alone, and no HDR file to download.
    let envTexture: THREE.Texture | null = null;
    const pmrem = new THREE.PMREMGenerator(renderer);

    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(-2.4, 3.2, 2.6);
    const fill = new THREE.DirectionalLight(0xffffff, 0.35);
    fill.position.set(2.8, -1.4, -1.8);
    scene.add(key, fill, new THREE.AmbientLight(0xffffff, 0.25));

    const root = new THREE.Group();
    scene.add(root);

    const pointer = { x: 0, y: 0 };
    const target = { rx: 0, ry: 0, px: 0, py: 0 };
    const current = { rx: 0, ry: 0, px: 0, py: 0 };
    let dragging = false;
    let dragRy = 0;
    let dragRx = 0;
    let lastX = 0;
    let lastY = 0;

    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;

      if (dragging) {
        dragRy += (event.clientX - lastX) * DRAG_SENSITIVITY;
        dragRx += (event.clientY - lastY) * DRAG_SENSITIVITY;
        dragRx = Math.max(-0.9, Math.min(0.9, dragRx));
        lastX = event.clientX;
        lastY = event.clientY;
      }

      target.ry = pointer.x * POINTER_TILT;
      target.rx = pointer.y * POINTER_TILT * 0.55;
      target.px = pointer.x * 0.22;
      target.py = -pointer.y * 0.14;
    };
    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      host.style.cursor = "grabbing";
    };
    const onPointerUp = () => {
      dragging = false;
      host.style.cursor = "";
    };

    if (fine && !reduced) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      host.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointerup", onPointerUp);
    }

    const resize = () => {
      const rect = host.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    };
    resize();

    const start = performance.now();
    const render = () => {
      const t = (performance.now() - start) / 1000;
      const k = reduced ? 1 : 0.07;

      current.rx += (target.rx + dragRx - current.rx) * k;
      current.ry += (target.ry + dragRy - current.ry) * k;
      current.px += (target.px - current.px) * k;
      current.py += (target.py - current.py) * k;

      const idle = reduced ? 0 : t * IDLE_SPEED;
      const seat = (indexRef.current - 1) * 0.3;

      root.rotation.y = current.ry + idle + seat;
      root.rotation.x = current.rx;
      root.position.x = current.px;
      root.position.y = current.py + (reduced ? 0 : Math.sin(t * 0.5) * 0.05);

      renderer.render(scene, camera);
    };

    const tick = () => {
      render();
      rafId = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (rafId === null && !document.hidden && !disposed) rafId = requestAnimationFrame(tick);
    };
    const sleep = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    // Loaded on demand rather than bundled: GLTFLoader and the environment only cost
    // anything for visitors whose device actually renders the scene.
    void (async () => {
      const [{ GLTFLoader }, { RoomEnvironment }] = await Promise.all([
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        import("three/examples/jsm/environments/RoomEnvironment.js"),
      ]);
      if (disposed) return;

      envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTexture;

      const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
      if (disposed) return;

      const model = gltf.scene;

      // Authored at ~120 units across and off-centre, so normalise before adding:
      // centre on the origin, then scale the longest edge to TARGET_SIZE.
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const centre = box.getCenter(new THREE.Vector3());
      const longest = Math.max(size.x, size.y, size.z) || 1;
      model.position.sub(centre);

      const holder = new THREE.Group();
      holder.add(model);
      holder.scale.setScalar(TARGET_SIZE / longest);
      root.add(holder);

      model.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const material of materials) {
          const std = material as THREE.MeshStandardMaterial;
          std.envMapIntensity = 1.15;
          // Anything the author left near-transparent should read as glass rather
          // than as a hole: keep it transparent but stop it z-fighting with itself.
          if (std.transparent && std.opacity < 0.2) {
            std.depthWrite = false;
            std.opacity = Math.max(std.opacity, 0.08);
          }
          std.needsUpdate = true;
        }
      });

      // Fade in so nothing pops. Each material keeps its authored opacity as the
      // ceiling — the near-transparent one was deliberately set to 0.024 and must
      // not be faded up to solid.
      const fading: THREE.Material[] = [];
      root.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const material of materials) {
          material.userData.baseOpacity = material.transparent ? material.opacity : 1;
          material.transparent = true;
          material.opacity = 0;
          fading.push(material);
        }
      });

      const fadeStart = performance.now();
      const fade = () => {
        if (disposed) return;
        const p = Math.min(1, (performance.now() - fadeStart) / 900);
        const eased = 1 - Math.pow(1 - p, 3);
        for (const material of fading) {
          material.opacity = (material.userData.baseOpacity as number) * eased;
        }
        if (p < 1) requestAnimationFrame(fade);
      };
      fade();

      resize();
      if (reduced) render();
      else wake();
    })();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      render();
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
      disposed = true;
      sleep();
      resizeObserver.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);

      scene.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry?.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const material of materials) material?.dispose();
      });
      envTexture?.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [mode]);

  return (
    <div
      ref={hostRef}
      data-hero-creative
      aria-hidden="true"
      className={`absolute ${className ?? ""}`}
    >
      {mode === "webgl" && <canvas ref={canvasRef} className="h-full w-full" />}
    </div>
  );
}
