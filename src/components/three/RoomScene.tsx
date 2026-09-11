"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { parseHex, type Rgb } from "@/lib/color/contrast";
import { roomLight, type RoomPalette } from "@/lib/three/room-light";
import {
  dustFragmentShader,
  dustVertexShader,
  roomFragmentShader,
  roomVertexShader,
} from "@/lib/three/room-shaders";
import { RAKE_MINUTES, sunOffsetBy } from "@/lib/three/sun";


/**
 * Chapter 3's room.
 *
 * Lit by the sun over Indore at the minute the visitor arrives. `website-story.md` Chapter 3
 * argues the disciplines are one experience; this makes that spatial rather than diagrammed
 * — they are one because they happen in one room, under one light, in one place.
 *
 * The section this replaced argued the same thing as three overlapping colour fields, and
 * `overlap.ts` recorded the cost in its own comments: an even triangle of three circles is a
 * Venn diagram, and a Venn diagram is a consultancy slide.
 *
 * Two draw calls. Everything the scroll does is a uniform write.
 */

type RoomSceneProps = {
  /** The element whose scroll drives the rake. */
  sectionRef: React.RefObject<HTMLElement | null>;
  className?: string;
};

const DUST_COUNT = 260;
/** How far back the entrance starts, in degrees of azimuth. Roughly an hour of sun. */
const SETTLE_AZIMUTH = 15;

function detectWebGLSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * The palette, read off the document rather than written here.
 *
 * `design-principles.md` says the tokens are defined once in `globals.css` and never
 * hard-coded. The fallbacks exist only for the case where the custom properties cannot be
 * resolved at all, which would otherwise render the room black.
 */
function readPalette(): RoomPalette {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string): Rgb => {
    const value = styles.getPropertyValue(name).trim();
    return parseHex(/^#?[0-9a-f]{6}$/i.test(value) ? value : fallback);
  };
  return {
    surface: token("--color-surface", "#faf9f7"),
    ink: token("--color-ink", "#14120f"),
  };
}

export function RoomScene({ sectionRef, className }: RoomSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"loading" | "webgl" | "static">("loading");

  useEffect(() => {
    setMode(detectWebGLSupport() ? "webgl" : "static");
  }, []);

  useEffect(() => {
    if (mode !== "webgl") return;
    // Registered here rather than at module scope. ScrollTrigger reaches for `document` as
    // it registers, and there is none while Next prerenders — which surfaces as the
    // misleading "<Html> should not be imported outside of pages/_document" and fails the
    // static export of /404. Inside the effect it can only ever run in a browser.
    //
    // `registerPlugin` is idempotent, so doing it here as well as in LenisProvider costs
    // nothing and means this component does not depend on another module's side effect
    // having happened first.
    gsap.registerPlugin(ScrollTrigger);

    const host = hostRef.current;
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!host || !canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowPower = typeof nav.deviceMemory === "number" && nav.deviceMemory < 4;

    let disposed = false;
    let rafId: number | null = null;

    const palette = readPalette();
    // Fixed at mount. The room is the studio at the moment of arrival, and a room that
    // re-read the clock every frame would drift while being looked at for no visible gain —
    // the sun moves a quarter of a degree a minute.
    const arrivedAt = new Date();

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    const pixelRatio = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2);
    renderer.setPixelRatio(pixelRatio);
    // Colour management off, and the ground fed in as raw floats rather than as THREE.Color.
    //
    // `room-light` clamps the ground in sRGB so that --color-ink holds 4.5:1 against it, and
    // that guarantee only means anything if the number it computed is the number that lands
    // on screen. Three's default working space would convert on the way in and encode again
    // on the way out, and the legibility floor would be protecting a colour nobody sees.
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    const uniforms = {
      uGround: { value: new THREE.Vector3() },
      uTint: { value: new THREE.Vector3() },
      uCenter: { value: 0.5 },
      uWidth: { value: 0.5 },
      uRake: { value: 0.5 },
      uInterior: { value: 0 },
      uReveal: { value: reduced ? 1 : 0 },
      uParallax: { value: new THREE.Vector2() },
      uAspect: { value: 1 },
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
    };

    const room = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: roomVertexShader,
        fragmentShader: roomFragmentShader,
        uniforms,
        depthTest: false,
        depthWrite: false,
      }),
    );
    scene.add(room);

    // Uploaded once. Drift happens in the vertex shader, so there is no per-frame buffer
    // write and no CPU cost that scales with the mote count.
    const seeds = new Float32Array(DUST_COUNT * 3);
    for (let i = 0; i < DUST_COUNT; i += 1) {
      seeds[i * 3] = Math.random() * 2 - 1;
      seeds[i * 3 + 1] = Math.random() * 2 - 1;
      seeds[i * 3 + 2] = Math.random();
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("seed", new THREE.BufferAttribute(seeds, 3));
    // `position` is required by three even though the vertex shader never reads it.
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(DUST_COUNT * 3), 3));

    const dust = new THREE.Points(
      dustGeometry,
      new THREE.ShaderMaterial({
        vertexShader: dustVertexShader,
        fragmentShader: dustFragmentShader,
        uniforms,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    scene.add(dust);

    /**
     * The one place the sun becomes the room.
     *
     * `minutesAhead` is how far the scrub has pushed the light; `azimuthBack` is the
     * entrance, which starts the shaft short of where it belongs and lets it settle.
     */
    const applyLight = (minutesAhead: number, azimuthBack: number) => {
      const sun = sunOffsetBy(arrivedAt, minutesAhead);
      const light = roomLight(
        { elevation: sun.elevation, azimuth: sun.azimuth - azimuthBack },
        palette,
      );

      uniforms.uGround.value.set(...light.ground);
      uniforms.uTint.value.set(...light.tint);
      uniforms.uCenter.value = light.shaft.center;
      uniforms.uWidth.value = light.shaft.width;
      uniforms.uRake.value = light.shaft.rake;
      uniforms.uInterior.value = light.interior ? 1 : 0;
    };

    const render = () => {
      renderer.render(scene, camera);
    };

    const tick = (now: number) => {
      if (disposed) return;
      uniforms.uTime.value = now / 1000;
      // Pointer parallax is eased here rather than tweened, so it costs nothing when the
      // pointer is still and never queues a timeline per move.
      uniforms.uParallax.value.x += (parallaxTarget.x - uniforms.uParallax.value.x) * 0.045;
      uniforms.uParallax.value.y += (parallaxTarget.y - uniforms.uParallax.value.y) * 0.045;
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

    const resize = () => {
      const { clientWidth, clientHeight } = host;
      if (clientWidth === 0 || clientHeight === 0) return;
      renderer.setSize(clientWidth, clientHeight, false);
      uniforms.uAspect.value = clientWidth / Math.max(1, clientHeight);
    };

    /**
     * Deliberately far below the 5–20% `motion-system.md` sets for parallax. The hero owns
     * pointer interaction on this page with its drag and tilt; this is only enough to make
     * the room a space rather than an image.
     */
    const parallaxTarget = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      parallaxTarget.x = ((event.clientX - rect.left) / rect.width - 0.5) * -0.015;
      parallaxTarget.y = ((event.clientY - rect.top) / rect.height - 0.5) * 0.010;
    };
    if (fine && !reduced) window.addEventListener("pointermove", onPointerMove, { passive: true });

    applyLight(0, reduced ? 0 : SETTLE_AZIMUTH);
    resize();

    // With motion removed the room is simply correct for the hour. The concept survives
    // whole rather than degrading to nothing, which is the best outcome available under
    // accessibility.md.
    if (reduced) {
      applyLight(0, 0);
      render();
    } else {
      wake();
    }

    const cleanups: (() => void)[] = [];

    if (!reduced && section) {
      // The entrance is the light arriving: the shaft settles into the angle it should
      // already be at. The headline's own wipe is timed against this in About, so the words
      // appear because the light reaches them.
      // Declared before the entrance because the entrance's onUpdate reads it: the settle
      // and the rake both write the same light, and whichever runs has to see the other's
      // current value or the shaft jumps between them.
      const rake = { minutes: 0 };
      const settle = { back: SETTLE_AZIMUTH };
      const entrance = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      });
      entrance
        .to(uniforms.uReveal, { value: 1, duration: 1.1, ease: "power2.out" }, 0)
        .to(
          settle,
          {
            back: 0,
            duration: 1.4,
            ease: "expo.out",
            onUpdate: () => applyLight(rake.minutes, settle.back),
          },
          0,
        );
      cleanups.push(() => {
        entrance.scrollTrigger?.kill();
        entrance.kill();
      });

      // The rake. The only thing the scroll does, and it writes a handful of floats.
      const raking = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.9,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          rake.minutes = self.progress * RAKE_MINUTES;
          applyLight(rake.minutes, settle.back);
        },
      });
      cleanups.push(() => raking.kill());
    }

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
      for (const cleanup of cleanups) cleanup();
      resizeObserver.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);

      scene.traverse((child) => {
        const node = child as THREE.Mesh | THREE.Points;
        node.geometry?.dispose();
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        for (const material of materials) material?.dispose();
      });
      renderer.dispose();
    };
  }, [mode, sectionRef]);

  return (
    <div ref={hostRef} aria-hidden="true" className={`absolute inset-0 ${className ?? ""}`}>
      {mode === "webgl" && <canvas ref={canvasRef} className="h-full w-full" />}
    </div>
  );
}
