"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * LAB — throwaway. The brain scene, rebuilt so three hero concepts can be compared against
 * each other in the same session. Delete with the rest of `components/lab` once a concept
 * is chosen; whatever wins gets folded into `HeroModelScene` properly.
 *
 * The one real capability added over `HeroModelScene` is the text backdrop. The hero's glass
 * currently refracts a faint grid, which is invisible enough that the transmission is doing
 * work nobody can see. Putting the headline back there instead means the model magnifies,
 * displaces and disperses the studio's own words — the reason for the glass becomes legible.
 */

export type Framing = "center" | "right" | "left";
export type Backdrop = "text" | "chroma" | "grid";

type LabBrainSceneProps = {
  framing: Framing;
  backdrop: Backdrop;
  /** Longest edge of the model in world units. */
  size?: number;
  /** Words the glass refracts, for `backdrop: "text"`. */
  text?: string[];
  className?: string;
  /** Pointer drives the camera rather than the model. Reads as looking around an object. */
  orbit?: boolean;
};

const MODEL_URL = "/images/hero-model.glb";

function detectWebGLSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** The headline, drawn to a canvas so the glass has something worth bending. */
function makeTextTexture(lines: string[]): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#faf9f7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const step = canvas.height / (lines.length + 0.6);
  ctx.fillStyle = "#14120f";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((line, i) => {
    const size = step * 0.72;
    ctx.font = `800 ${size}px Manrope, system-ui, sans-serif`;
    ctx.fillText(line, canvas.width / 2, step * (i + 0.9));
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function LabBrainScene({
  framing,
  backdrop,
  size = 2.1,
  text = ["WORTH", "REMEMBERING"],
  className,
  orbit = true,
}: LabBrainSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"loading" | "webgl" | "static">("loading");

  useEffect(() => {
    setMode(detectWebGLSupport() ? "webgl" : "static");
  }, []);

  useEffect(() => {
    if (mode !== "webgl") return;
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowPower = typeof nav.deviceMemory === "number" && nav.deviceMemory < 4;

    let disposed = false;
    let rafId: number | null = null;
    let envTexture: THREE.Texture | null = null;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !lowPower });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;

    const pmrem = new THREE.PMREMGenerator(renderer);

    scene.add(
      new THREE.AmbientLight(0xffffff, 0.25),
      (() => {
        const key = new THREE.DirectionalLight(0xffffff, 1.15);
        key.position.set(-2.4, 3.2, 2.6);
        return key;
      })(),
      (() => {
        const fill = new THREE.DirectionalLight(0xffffff, 0.35);
        fill.position.set(2.8, -1.4, -1.8);
        return fill;
      })(),
    );

    const root = new THREE.Group();
    scene.add(root);

    // Transmission samples the scene, not the page — so whatever the glass is meant to bend
    // has to exist inside the scene, behind the model.
    const backdropGroup = new THREE.Group();
    backdropGroup.position.z = -3.2;
    scene.add(backdropGroup);

    let textTexture: THREE.CanvasTexture | null = null;

    if (backdrop === "text") {
      textTexture = makeTextTexture(text);
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(16, 8),
        new THREE.MeshBasicMaterial({ map: textTexture, transparent: true, opacity: 0.5 }),
      );
      backdropGroup.add(plane);
    } else if (backdrop === "chroma") {
      // A coarse chromatic field. Undispersed it is nearly invisible; through the volume it
      // separates, which is the whole point of putting it there.
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 256;
      const ctx = canvas.getContext("2d")!;
      const grad = ctx.createLinearGradient(0, 0, 256, 256);
      grad.addColorStop(0, "#ff5ca8");
      grad.addColorStop(0.34, "#8b7bff");
      grad.addColorStop(0.68, "#4ed6e8");
      grad.addColorStop(1, "#8cffd6");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      textTexture = texture;
      backdropGroup.add(
        new THREE.Mesh(
          new THREE.PlaneGeometry(18, 18),
          new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.85 }),
        ),
      );
    } else {
      const points: number[] = [];
      const EXTENT = 9;
      for (let v = -EXTENT; v <= EXTENT; v += 0.55) {
        points.push(-EXTENT, v, 0, EXTENT, v, 0, v, -EXTENT, 0, v, EXTENT, 0);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
      backdropGroup.add(
        new THREE.LineSegments(
          geometry,
          new THREE.LineBasicMaterial({ color: 0x14120f, transparent: true, opacity: 0.06 }),
        ),
      );
    }

    const homeX = framing === "center" ? 0 : framing === "right" ? 0.34 : -0.34;
    const pointer = { x: 0, y: 0 };
    const current = { rx: 0, ry: 0 };
    let start = performance.now();

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    if (!reduced) window.addEventListener("pointermove", onPointerMove, { passive: true });

    const frame = () => {
      const { clientWidth: w, clientHeight: h } = host;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);

      // Park the model in the composition by world units rather than by CSS, so the type
      // beside it keeps its column at any width.
      const halfHeight = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
      root.position.x = homeX * halfHeight * camera.aspect;
    };

    const render = () => renderer.render(scene, camera);

    const tick = (now: number) => {
      if (disposed) return;
      const t = (now - start) / 1000;

      current.ry += (pointer.x * 0.42 - current.ry) * 0.045;
      current.rx += (pointer.y * 0.24 - current.rx) * 0.045;

      if (orbit) {
        // The camera moves, not the object. Looking around a thing on a plinth reads as
        // presence; spinning the thing reads as a product configurator.
        camera.position.x = current.ry * 1.5;
        camera.position.y = -current.rx * 1.1;
        camera.lookAt(root.position.x, 0, 0);
      } else {
        root.rotation.y = current.ry;
        root.rotation.x = current.rx;
      }

      root.rotation.y += reduced ? 0 : 0.0016;
      root.position.y = Math.sin(t * 0.5) * 0.045;
      if (backdrop === "chroma") backdropGroup.rotation.z = t * 0.02;

      render();
      rafId = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (rafId === null && !disposed) rafId = requestAnimationFrame(tick);
    };
    const sleep = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    void (async () => {
      const [{ GLTFLoader }, { RoomEnvironment }] = await Promise.all([
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        import("three/examples/jsm/environments/RoomEnvironment.js"),
      ]);
      if (disposed) return;

      envTexture = pmrem.fromScene(new RoomEnvironment(), 0).texture;
      scene.environment = envTexture;

      const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
      if (disposed) return;
      const model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const span = box.getSize(new THREE.Vector3());
      const scale = size / Math.max(span.x, span.y, span.z);
      model.scale.setScalar(scale);
      const centre = box.getCenter(new THREE.Vector3()).multiplyScalar(scale);
      model.position.sub(centre);
      root.add(model);

      // Same reasoning as HeroModelScene: the authored glass keeps its colour and opacity
      // and gains the clearcoat that makes it read as a pane, and only a broken export with
      // no usable material gets rebuilt from scratch.
      model.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        const vertexCount = mesh.geometry?.getAttribute("position")?.count ?? 0;
        const previous = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const authored = previous[0] as THREE.MeshPhysicalMaterial | undefined;
        const asGlass = (authored?.transmission ?? 0) > 0 || authored?.transparent === true;

        if (asGlass && authored) {
          mesh.material = new THREE.MeshPhysicalMaterial({
            color: authored.color.clone(),
            opacity: authored.opacity,
            transparent: true,
            roughness: 0.03,
            metalness: 0,
            ior: 1.5,
            clearcoat: 1,
            clearcoatRoughness: 0.02,
            specularIntensity: 1,
            envMapIntensity: 2.6,
            side: THREE.DoubleSide,
            depthWrite: false,
          });
          for (const m of previous) m?.dispose();
          mesh.renderOrder = 2;
          return;
        }
        if (vertexCount < 200 && authored) {
          // A refracting volume, so the backdrop behind it is magnified and dispersed
          // rather than merely tinted. This is what the text backdrop exists for.
          mesh.material = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0,
            roughness: 0,
            transmission: 1,
            thickness: 2.4,
            ior: 1.55,
            dispersion: 3.4,
            clearcoat: 1,
            specularIntensity: 1,
            envMapIntensity: 1.1,
            side: THREE.DoubleSide,
          });
          for (const m of previous) m?.dispose();
          mesh.renderOrder = 2;
          return;
        }
        for (const m of previous) {
          const std = m as THREE.MeshStandardMaterial;
          std.envMapIntensity = 0.9;
          std.needsUpdate = true;
        }
        mesh.renderOrder = 1;
      });

      const rim = new THREE.DirectionalLight(0xffffff, 0.9);
      rim.position.set(1.2, -0.6, -3);
      root.add(rim);

      start = performance.now();
      frame();
      if (reduced) render();
      else wake();
      host.dataset.ready = "true";
    })();

    const resizeObserver = new ResizeObserver(() => {
      frame();
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

    return () => {
      disposed = true;
      sleep();
      resizeObserver.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      scene.traverse((child) => {
        const node = child as THREE.Mesh;
        node.geometry?.dispose();
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        for (const m of materials) m?.dispose();
      });
      textTexture?.dispose();
      envTexture?.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [mode, framing, backdrop, size, orbit, text]);

  return (
    <div ref={hostRef} aria-hidden="true" className={`absolute ${className ?? ""}`}>
      {mode === "webgl" && <canvas ref={canvasRef} className="h-full w-full" />}
    </div>
  );
}
