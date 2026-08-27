"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let activeLenis: Lenis | null = null;

export function getLenisInstance(): Lenis | null {
  return activeLenis;
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  /**
   * Re-measure everything when the route changes.
   *
   * Navigation here is client-side, and the layout does not unmount across it — the footer
   * in particular survives every route change. Its ScrollTrigger therefore keeps the start
   * position it measured on whatever page it was created on, and on the homepage that is
   * thousands of pixels down a page a work route does not have. The trigger simply never
   * fires, and the footer's heading stays at the opacity its reveal starts from.
   *
   * Deferred by a frame because the new route has to be laid out before there is anything
   * correct to measure. Lenis is resized alongside, since it caches document height too.
   */
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      activeLenis?.resize();
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    });
    activeLenis = lenis;

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(onTick);
      lenis.destroy();
      activeLenis = null;
    };
  }, []);

  return <>{children}</>;
}
