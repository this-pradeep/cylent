import { getLenisInstance } from "@/lib/motion/LenisProvider";

export function scrollToId(id: string): void {
  const target = document.getElementById(id);
  if (!target) return;

  const lenis = getLenisInstance();
  if (lenis) {
    lenis.scrollTo(target);
    return;
  }

  target.scrollIntoView({ behavior: "auto" });
}
