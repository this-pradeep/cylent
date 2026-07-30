export const PIN_DISABLE_BREAKPOINT_PX = 768;

export function shouldPinSection(viewportWidthPx: number, prefersReducedMotion: boolean): boolean {
  if (prefersReducedMotion) {
    return false;
  }
  return viewportWidthPx >= PIN_DISABLE_BREAKPOINT_PX;
}
