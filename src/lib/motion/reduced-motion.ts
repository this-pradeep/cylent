export function getMotionMode(prefersReducedMotion: boolean): "full" | "reduced" {
  return prefersReducedMotion ? "reduced" : "full";
}
