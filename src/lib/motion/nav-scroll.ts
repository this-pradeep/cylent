import { clampProgress } from "@/lib/motion/scroll-progress";

export function getCondenseProgress(scrollY: number, thresholdPx: number): number {
  if (thresholdPx <= 0) return 1;
  return clampProgress(scrollY / thresholdPx);
}
