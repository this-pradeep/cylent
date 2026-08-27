"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

type LoaderOrbProps = {
  /**
   * Live progress, 0–100. A ref rather than a prop because the loader advances this every
   * frame, and a prop would re-render React sixty times a second to move a mesh.
   */
  progressRef: RefObject<number>;
  className?: string;
};

/** Turns of the groove around the body, and how far it cuts in. */
const GROOVE_TURNS = 1.0;
const GROOVE_PITCH = 2.2;
const GROOVE_DEPTH = 0.15;
/** Sharpens the carve: lower is a tighter, more defined channel. */
const GROOVE_EDGE = 0.34;

const IDLE_SPIN = 0.24;

function detectWebGLSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * The loading screen's centrepiece: a glass body with a helical groove cut around it,
 * turning slowly under an iridescent shader.
 *
 * Three is imported dynamically rather than statically. This mounts before anything else on
 * the page, and the whole point of a loading screen is to cover a wait — making the cover
 * itself block on a 3D library would be the wrong way round. The orb fades in when it is
 * ready, which on a warm cache is immediately.
 *
 * The groove is carved by displacing a sphere rather than modelled: a helix is a closed
 * expression, so this costs one pass over the vertices at startup and no asset to download.
 */
export function LoaderOrb({ progressRef, className }: LoaderOrbProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setSupported(detectWebGLSupport());
  }, []);

  useEffect(() => {
    if (supported !== true) return;
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const [THREE, { RoomEnvironment }] = await Promise.all([
        import("three"),
        import("three/examples/jsm/environments/RoomEnvironment.js"),
      ]);
      if (disposed || !hostRef.current) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      hostRef.current.appendChild(renderer.domElement);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      camera.position.set(0, 0, 5.4);

      // The same room the hero lights its model with, so the two objects read as being in
      // one world rather than two renders that happen to share a page.
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envRT.texture;

      const geometry = new THREE.SphereGeometry(1, 200, 132);
      const position = geometry.attributes.position;
      const vertex = new THREE.Vector3();
      for (let i = 0; i < position.count; i += 1) {
        vertex.fromBufferAttribute(position, i);
        const radius = vertex.length();
        const phi = Math.acos(vertex.y / radius);
        const theta = Math.atan2(vertex.z, vertex.x);
        // A helix is constant along its own axis and varies across it, which is exactly the
        // channel wanted here.
        const band = Math.sin(GROOVE_PITCH * phi + GROOVE_TURNS * theta);
        const carve = Math.pow(Math.abs(band), GROOVE_EDGE);
        vertex.multiplyScalar(1 - GROOVE_DEPTH * (1 - carve));
        position.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
      geometry.computeVertexNormals();

      const material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.06,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        // Iridescence is what makes this glass rather than a chrome ball — thin-film
        // interference across the thickness range is the same physics as the site's
        // chromatic gradient, arrived at honestly.
        iridescence: 1,
        iridescenceIOR: 1.34,
        iridescenceThicknessRange: [120, 640],
        transmission: 0.62,
        thickness: 1.35,
        ior: 1.46,
        envMapIntensity: 1.5,
      });

      const orb = new THREE.Mesh(geometry, material);
      orb.rotation.set(0.36, 0.6, 0.22);
      scene.add(orb);

      const key = new THREE.DirectionalLight(0xffffff, 1.7);
      key.position.set(2.4, 3.1, 3.4);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xc9d6ff, 1.1);
      rim.position.set(-3, -1.6, -2.2);
      scene.add(rim);

      const resize = () => {
        const box = hostRef.current?.getBoundingClientRect();
        if (!box || box.width === 0) return;
        renderer.setSize(box.width, box.height, false);
        camera.aspect = box.width / box.height;
        camera.updateProjectionMatrix();
      };
      resize();

      const observer = new ResizeObserver(resize);
      observer.observe(hostRef.current);

      let frame = 0;
      let last = performance.now();

      const render = (now: number) => {
        const delta = Math.min((now - last) / 1000, 0.05);
        last = now;

        const progress = Math.min(Math.max(progressRef.current ?? 0, 0), 100) / 100;

        if (!reduced) {
          orb.rotation.y += delta * IDLE_SPIN;
          orb.rotation.x = 0.36 + Math.sin(now / 2600) * 0.07;
        }
        // Settles into itself as the page arrives, rather than reporting a number the
        // counter is already reporting.
        orb.scale.setScalar(0.9 + progress * 0.1);
        material.iridescenceIOR = 1.2 + progress * 0.22;

        renderer.render(scene, camera);
        frame = requestAnimationFrame(render);
      };
      frame = requestAnimationFrame(render);

      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        geometry.dispose();
        material.dispose();
        envRT.dispose();
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [supported, progressRef]);

  // Until WebGL is confirmed, and forever without it, the CSS lens stands in. It is the
  // cursor's own material, so the fallback is a family member rather than a placeholder.
  if (supported === false) {
    return (
      <div className="loader-lens" style={{ ["--p" as string]: 1 }}>
        <span className="loader-lens-bloom" />
        <span className="loader-lens-body" />
        <span className="loader-lens-ring" />
        <span className="loader-lens-spec" />
      </div>
    );
  }

  return <div ref={hostRef} className={className} />;
}
