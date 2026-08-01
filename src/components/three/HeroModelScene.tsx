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
const TARGET_SIZE = 2.1;
const IDLE_SPEED = 0.055;
const POINTER_TILT = 0.42;
const DRAG_SENSITIVITY = 0.005;

/**
 * Backdrop dials. POOL_SIZE is deliberately smaller than the frustum at this depth:
 * a pool wider than the viewport would put a dark field behind the ink headline and
 * make it unreadable. Kept as a tight halo around the prism instead, so the rest of
 * the hero stays on the page's own surface colour.
 */
const POOL_SIZE = 5.6;
const POOL_DISTANCE = 3.4;

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
    renderer.toneMappingExposure = 0.92;

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

    // ---- studio backdrop -------------------------------------------------
    // Glass is only visible through what is behind it. On a near-white page there
    // is nothing to refract, which is why the prism read as a flat shape.
    //
    // Everything here is OPAQUE on purpose: three's transmission pass samples the
    // opaque and transmissive lists only, so a translucent backdrop would be
    // invisible to the glass no matter how it looked on screen.

    // A pool of deep tone directly behind the prism, fading to exactly the page
    // colour at its rim so it dissolves into the hero rather than sitting on it as
    // a visible disc.
    const poolCanvas = document.createElement("canvas");
    poolCanvas.width = 512;
    poolCanvas.height = 512;
    const poolCtx = poolCanvas.getContext("2d");
    if (poolCtx) {
      const gradient = poolCtx.createRadialGradient(256, 256, 0, 256, 256, 256);
      gradient.addColorStop(0, "rgb(24, 22, 19)");
      gradient.addColorStop(0.42, "rgb(58, 55, 50)");
      gradient.addColorStop(0.72, "rgb(176, 172, 165)");
      gradient.addColorStop(1, "rgb(250, 249, 247)");
      poolCtx.fillStyle = gradient;
      poolCtx.fillRect(0, 0, 512, 512);
    }
    const poolTexture = new THREE.CanvasTexture(poolCanvas);
    poolTexture.colorSpace = THREE.SRGBColorSpace;

    const pool = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: poolTexture, toneMapped: false }),
    );
    pool.scale.setScalar(POOL_SIZE);
    pool.position.set(0, 0, -POOL_DISTANCE);
    pool.renderOrder = -2;
    scene.add(pool);

    // Bright bars raking across the pool. Glass reads as glass largely through the
    // streaks it draws from hard light sources, and these give the volume something
    // with edges to bend, reflect and split.
    const barMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      toneMapped: false,
    });
    const bars = new THREE.Group();
    const BAR_LAYOUT: Array<[number, number, number, number, number]> = [
      // x, y, width, height, rotation
      [-1.35, 0.95, 0.1, 5.2, 0.42],
      [0.55, -0.2, 0.055, 4.4, -0.3],
      [1.5, 1.15, 0.075, 3.6, 0.62],
    ];
    for (const [x, y, w, h, rotation] of BAR_LAYOUT) {
      const bar = new THREE.Mesh(new THREE.PlaneGeometry(w, h), barMaterial);
      bar.position.set(x, y, -POOL_DISTANCE + 0.35);
      bar.rotation.z = rotation;
      bar.renderOrder = -1;
      bars.add(bar);
    }
    scene.add(bars);

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

      // Blur 0 keeps the environment's bright panels sharp, so the glass has crisp
      // highlights to reflect rather than a soft grey wash.
      envTexture = pmrem.fromScene(new RoomEnvironment(), 0).texture;
      scene.environment = envTexture;
      scene.environmentIntensity = 0.85;

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

      // The export now carries KHR_materials_transmission, so the shell arrives as
      // real glass. What glTF does not carry is volume, index of refraction or
      // dispersion — without those, transmission alone renders a flat pane. Those
      // are added on top here rather than replacing the authored material, so the
      // colour and roughness chosen in Blender survive.
      model.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;

        const vertexCount = mesh.geometry?.getAttribute("position")?.count ?? 0;
        const previous = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const authored = previous[0] as THREE.MeshPhysicalMaterial | undefined;
        // Prefer what the export says; fall back to "the low-poly one" for models
        // that lose their transmission on the way out, as an earlier export did.
        const isShell =
          (authored?.transmission ?? 0) > 0 || vertexCount < 200;

        if (isShell && authored?.isMeshPhysicalMaterial) {
          authored.transmission = 1;
          // Dispersion is integrated through the volume: with zero thickness there
          // is no path length, and no wavelength split.
          authored.thickness = 2.4;
          authored.ior = 1.55;
          authored.dispersion = 3.2;
          authored.attenuationDistance = 8;
          authored.attenuationColor = new THREE.Color(0xf2f4ff);
          authored.roughness = Math.min(authored.roughness, 0.02);
          authored.metalness = 0;
          authored.clearcoat = 1;
          authored.clearcoatRoughness = 0;
          authored.specularIntensity = 1;
          authored.envMapIntensity = 1.1;
          authored.transparent = false;
          authored.side = THREE.DoubleSide;
          authored.needsUpdate = true;
          mesh.renderOrder = 2;
          return;
        }

        if (isShell) {
          mesh.material = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0,
            // Sharp glass. Any roughness here blurs both the reflections and the
            // model inside, which is the whole reason the volume exists.
            roughness: 0,
            transmission: 1,
            // A volume, not a shell. Dispersion is computed through thickness, so
            // this must be non-zero or the chromatic split never happens.
            thickness: 2.4,
            attenuationDistance: 8,
            attenuationColor: new THREE.Color(0xf2f4ff),
            ior: 1.55,
            // The actual chromatic aberration: each wavelength refracts at its own
            // angle through the volume. Real crown glass sits near 0.3; this is
            // pushed well past it so the split reads at hero scale, the same
            // exaggeration the line-traced prism needed. This is the dial to turn.
            dispersion: 3.2,
            clearcoat: 1,
            clearcoatRoughness: 0,
            specularIntensity: 1,
            envMapIntensity: 1.1,
            // Deliberately not `transparent`: transmission is the physical route and
            // wants the opaque pass, where it can sample the buffer behind it.
            transparent: false,
            side: THREE.DoubleSide,
          });
          mesh.renderOrder = 2;
          for (const material of previous) material?.dispose();
          return;
        }

        // The content: lifted off black so it stays legible through the glass.
        for (const material of previous) {
          const std = material as THREE.MeshStandardMaterial;
          std.envMapIntensity = 0.55;
          std.metalness = 0.15;
          std.roughness = 0.62;
          std.emissive = new THREE.Color(0x7a6cff);
          std.emissiveIntensity = 0.09;
          std.needsUpdate = true;
        }
        mesh.renderOrder = 1;
      });

      // Light thrown from inside the prism, so the content reads through the glass
      // rather than being lit only from outside and swallowed by refraction.
      const core = new THREE.PointLight(0xffffff, 6, 9, 2);
      const rim = new THREE.DirectionalLight(0xffffff, 0.9);
      rim.position.set(1.2, -0.6, -3);
      holder.add(core);
      root.add(rim);

      // No per-material fade. Three renders only opaque objects into the buffer that
      // transmission samples, so marking the content `transparent` to fade it would
      // erase it from inside the glass — the exact thing this scene exists to show.
      // The entrance is handled by Hero, which tweens the wrapper's CSS opacity.

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

      // Meshes and lines both hold GPU resources — checking isMesh alone would leak
      // the backdrop grid every time this section unmounts.
      scene.traverse((child) => {
        const node = child as THREE.Mesh | THREE.LineSegments;
        if (!node.geometry && !node.material) return;
        node.geometry?.dispose();
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        for (const material of materials) material?.dispose();
      });
      envTexture?.dispose();
      poolTexture.dispose();
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
