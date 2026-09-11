/**
 * WCAG contrast, for guarding a background that moves.
 *
 * Chapter 3's room is lit by the sun over Indore, which means the background behind real
 * body copy changes with the hour. `design-principles.md` treats the accent ramp the same
 * way and says why the check has to cover the whole range rather than its ends:
 *
 *   > re-derive every stop the same way and re-check the whole ramp, not just the
 *   > endpoints: interpolation can dip below both of them.
 *
 * A day of sunlight is exactly such a ramp, so `room-light.ts` uses this to clamp it.
 */

export type Rgb = readonly [number, number, number];

/** Six-digit hex, with or without the hash, as unit floats. */
export function parseHex(hex: string): Rgb {
  const body = hex.startsWith("#") ? hex.slice(1) : hex;
  return [
    parseInt(body.slice(0, 2), 16) / 255,
    parseInt(body.slice(2, 4), 16) / 255,
    parseInt(body.slice(4, 6), 16) / 255,
  ];
}

/** Undoes the sRGB transfer function for one channel, per WCAG 2.x. */
function linearise(channel: number): number {
  return channel <= 0.03928
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
}

export function relativeLuminance([r, g, b]: Rgb): number {
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}
