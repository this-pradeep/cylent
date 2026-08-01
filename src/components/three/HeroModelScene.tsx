"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  prismLineFragmentShader,
  prismLineVertexShader,
} from "@/lib/three/prism-shaders";
import { CHROMATIC_PALETTE } from "@/lib/three/palette";
import { dot3, iorAt, refract3 } from "@/lib/three/prism-optics";

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

/** Wavelengths traced through the glass. Each is one ray of the emergent fan. */
const WAVELENGTHS = 20;
/** Where the light comes from. Fixed in world space, so the prism turns under it. */
const LIGHT_DIR = { x: 0.22, y: -1, z: 0.16 };
const BEAM_LEAD = 3.4;
const FAN_REACH = 5.5;

/** Red through violet — the palette the cursor lens and loader bar already use. */
const SPECTRUM = CHROMATIC_PALETTE.slice(0, 5);

function spectrumAt(t: number): [number, number, number] {
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

    // The beam and the spectrum it becomes. Added to the scene, NOT to root: the
    // light source is fixed in the world and the prism turns underneath it. Parenting
    // this to the model would carry the light around with the glass, which is what
    // makes drawn-on fans read as fake.
    let shellMesh: THREE.Mesh | null = null;
    const raycaster = new THREE.Raycaster();
    const lightDir = new THREE.Vector3(LIGHT_DIR.x, LIGHT_DIR.y, LIGHT_DIR.z).normalize();
    const normalMatrix = new THREE.Matrix3();

    // one incoming beam + per wavelength an interior and an exterior segment
    const BEAM_VERTS = (1 + WAVELENGTHS * 2) * 2;
    const beamPos = new Float32Array(BEAM_VERTS * 3);
    const beamCol = new Float32Array(BEAM_VERTS * 3);
    const beamAlpha = new Float32Array(BEAM_VERTS);

    const beamGeometry = new THREE.BufferGeometry();
    const beamPosAttr = new THREE.BufferAttribute(beamPos, 3).setUsage(
      THREE.DynamicDrawUsage,
    );
    const beamColAttr = new THREE.BufferAttribute(beamCol, 3).setUsage(
      THREE.DynamicDrawUsage,
    );
    const beamAlphaAttr = new THREE.BufferAttribute(beamAlpha, 1).setUsage(
      THREE.DynamicDrawUsage,
    );
    beamGeometry.setAttribute("position", beamPosAttr);
    beamGeometry.setAttribute("aColor", beamColAttr);
    beamGeometry.setAttribute("aAlpha", beamAlphaAttr);

    const beamMaterial = new THREE.ShaderMaterial({
      vertexShader: prismLineVertexShader,
      fragmentShader: prismLineFragmentShader,
      uniforms: { uOpacity: { value: 1 } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const beam = new THREE.LineSegments(beamGeometry, beamMaterial);
    beam.frustumCulled = false;
    beam.renderOrder = 4;
    scene.add(beam);

    // Reused every frame: traceBeam runs at 60fps and must not allocate.
    const tmpDir = new THREE.Vector3();
    const tmpOrigin = new THREE.Vector3();
    const tmpCentre = new THREE.Vector3();
    const entryNormalVec = new THREE.Vector3();
    const exitNormalVec = new THREE.Vector3();

    /**
     * Trace the beam through the pyramid for real: refract in at the face it hits,
     * cross the glass at a per-wavelength index, refract out at whichever face it
     * reaches. Total internal reflection simply drops that wavelength, so the fan
     * loses and regains colours as the model turns — which is the tell that it is
     * being computed rather than drawn.
     */
    const traceBeam = () => {
      let v = 0;
      const push = (
        x: number,
        y: number,
        z: number,
        colour: [number, number, number],
        alpha: number,
      ) => {
        beamPos[v * 3] = x;
        beamPos[v * 3 + 1] = y;
        beamPos[v * 3 + 2] = z;
        beamCol.set(colour, v * 3);
        beamAlpha[v] = alpha;
        v++;
      };
      const blank = () => {
        while (v < BEAM_VERTS) push(0, 0, 0, [0, 0, 0], 0);
      };

      if (!shellMesh) {
        blank();
        beamPosAttr.needsUpdate = true;
        beamColAttr.needsUpdate = true;
        beamAlphaAttr.needsUpdate = true;
        return;
      }

      scene.updateMatrixWorld(true);
      shellMesh.getWorldPosition(tmpCentre);
      tmpOrigin.copy(tmpCentre).addScaledVector(lightDir, -BEAM_LEAD);

      raycaster.set(tmpOrigin, lightDir);
      const entryHits = raycaster.intersectObject(shellMesh, false);
      if (entryHits.length === 0 || !entryHits[0].normal) {
        blank();
        beamPosAttr.needsUpdate = true;
        beamColAttr.needsUpdate = true;
        beamAlphaAttr.needsUpdate = true;
        return;
      }

      const entry = entryHits[0].point;
      normalMatrix.getNormalMatrix(shellMesh.matrixWorld);
      const entryNormal = entryNormalVec
        .copy(entryHits[0].normal!)
        .applyMatrix3(normalMatrix)
        .normalize();
      // Snell's law needs the surface normal facing the incoming ray.
      if (entryNormal.dot(lightDir) > 0) entryNormal.negate();

      const BEAM_INK: [number, number, number] = [0.36, 0.34, 0.31];
      push(tmpOrigin.x, tmpOrigin.y, tmpOrigin.z, BEAM_INK, 0);
      push(entry.x, entry.y, entry.z, BEAM_INK, 0.34);

      for (let i = 0; i < WAVELENGTHS; i++) {
        const t = i / (WAVELENGTHS - 1);
        const ior = iorAt(t);
        const colour = spectrumAt(t);

        const inside = refract3(lightDir, entryNormal, 1 / ior);
        if (!inside) continue;

        tmpDir.set(inside.x, inside.y, inside.z);
        raycaster.set(
          tmpOrigin.copy(entry).addScaledVector(tmpDir, 1e-4),
          tmpDir,
        );
        const exitHits = raycaster.intersectObject(shellMesh, false);
        if (exitHits.length === 0 || !exitHits[0].normal) continue;

        const exit = exitHits[0].point;
        const exitNormal = exitNormalVec
          .copy(exitHits[0].normal!)
          .applyMatrix3(normalMatrix)
          .normalize();
        if (dot3(exitNormal, inside) > 0) exitNormal.negate();

        const out = refract3(inside, exitNormal, ior);
        if (!out) continue;

        push(entry.x, entry.y, entry.z, colour, 0.26);
        push(exit.x, exit.y, exit.z, colour, 0.5);
        push(exit.x, exit.y, exit.z, colour, 0.62);
        push(
          exit.x + out.x * FAN_REACH,
          exit.y + out.y * FAN_REACH,
          exit.z + out.z * FAN_REACH,
          colour,
          0,
        );
      }

      blank();
      beamPosAttr.needsUpdate = true;
      beamColAttr.needsUpdate = true;
      beamAlphaAttr.needsUpdate = true;
    };

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

      traceBeam();
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
          shellMesh = mesh;
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
          shellMesh = mesh;
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
