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

    // A backdrop inside the scene, because transmission samples the scene — not the
    // page. With a transparent clear colour there is nothing behind the glass to
    // bend, so it refracts blank space and composites to a flat white shape. This
    // grid is nearly invisible directly (ink at 6%) but the volume magnifies,
    // displaces and disperses it, which is what actually reads as glass. Structure
    // and grids are also the Build pillar's own visual language.
    const gridGroup = new THREE.Group();
    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x14120f,
      transparent: true,
      opacity: 0.06,
    });
    const gridPoints: number[] = [];
    const EXTENT = 9;
    const STEP = 0.55;
    for (let v = -EXTENT; v <= EXTENT; v += STEP) {
      gridPoints.push(-EXTENT, v, 0, EXTENT, v, 0);
      gridPoints.push(v, -EXTENT, 0, v, EXTENT, 0);
    }
    const gridGeometry = new THREE.BufferGeometry();
    gridGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(gridPoints, 3),
    );
    const grid = new THREE.LineSegments(gridGeometry, gridMaterial);
    grid.position.z = -3.2;
    gridGroup.add(grid);
    scene.add(gridGroup);

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
      // Back to neutral. The brain uses the environment again, so raising this
      // would brighten it too — the glass gets its extra reflection from its own
      // envMapIntensity instead, which affects nothing else.
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

      // Respect what was authored; only repair what glTF cannot express.
      //
      // This export defines the shell as an alpha-blended veil at 6% opacity and
      // gives the contents a strong colour of their own. Both are deliberate, so
      // neither is overwritten. Earlier exports arrived with no material block at
      // all, which glTF defaults turn into opaque rough metal — that case, and only
      // that case, still gets a glass material substituted.
      model.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;

        const vertexCount = mesh.geometry?.getAttribute("position")?.count ?? 0;
        const previous = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const authored = previous[0] as THREE.MeshPhysicalMaterial | undefined;

        const authoredAsGlass =
          (authored?.transmission ?? 0) > 0 || authored?.transparent === true;
        const isShell = authoredAsGlass || vertexCount < 200;

        if (isShell && authored) {
          if (authoredAsGlass) {
            // Promoted to a physical material so the box can carry a clearcoat: that
            // is the layer that produces the crisp specular sheen a pane of glass
            // has. A standard material has no such lobe, so the shell could only ever
            // look like tinted haze.
            //
            // The authored colour and opacity are carried across untouched; what
            // changes is only how the surface responds to light.
            const glass = new THREE.MeshPhysicalMaterial({
              color: authored.color.clone(),
              opacity: authored.opacity,
              transparent: true,
              // The export omitted roughnessFactor, so glTF defaulted it to 1.0 —
              // fully rough, which cannot reflect anything sharply. Glass needs the
              // opposite end of that scale.
              roughness: 0.03,
              // Likewise metallicFactor defaults to 1.0 when omitted, and metals do
              // not transmit, so a see-through metal shell is a defaulting artifact.
              metalness: 0,
              ior: 1.5,
              clearcoat: 1,
              clearcoatRoughness: 0.02,
              specularIntensity: 1,
              // Reflections are the point here, so the box takes far more of the
              // environment than anything else in the scene.
              envMapIntensity: 2.6,
              side: THREE.DoubleSide,
              // A transparent shell that writes depth would occlude its own contents.
              depthWrite: false,
            });
            mesh.material = glass;
            for (const material of previous) material?.dispose();
            mesh.renderOrder = 2;
            return;
          }

          // No usable material came through: rebuild it as glass so a broken export
          // does not render as a dead metal box.
          mesh.material = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0,
            roughness: 0,
            transmission: 1,
            thickness: 2.4,
            ior: 1.55,
            dispersion: 3.2,
            clearcoat: 1,
            specularIntensity: 1,
            envMapIntensity: 1.1,
            transparent: false,
            side: THREE.DoubleSide,
          });
          mesh.renderOrder = 2;
          for (const material of previous) material?.dispose();
          return;
        }

        // The contents keep their authored material as exported — colour, roughness
        // and metalness all left alone, so the brain keeps the sheen it was given in
        // Blender. Only the environment response is set, and only so it sits in the
        // same light as the rest of the scene.
        //
        // The difference between the two is made on the box's side, not by dulling
        // this one: the shell gets a clearcoat and a much stronger environment, which
        // is what separates a pane of glass from a glossy solid.
        for (const material of previous) {
          const std = material as THREE.MeshStandardMaterial;
          std.envMapIntensity = 0.9;
          std.needsUpdate = true;
        }
        mesh.renderOrder = 1;
      });

      // A rim from behind separates the form from a pale background. The interior
      // point light that used to sit here is gone: the contents are opaque in this
      // export, so a light at their centre is trapped inside and lights nothing.
      const rim = new THREE.DirectionalLight(0xffffff, 0.9);
      rim.position.set(1.2, -0.6, -3);
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
