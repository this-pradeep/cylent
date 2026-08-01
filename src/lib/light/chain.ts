/**
 * The optical chain for Section 02.
 *
 * Three stations, one beam. Each station does to the light what the movement does to
 * the work: Imagine scatters a single beam into possibilities, Build gathers them
 * into something aligned and structured, Inspire releases it as a spectrum that
 * leaves the frame. The argument is carried by the optics, not captioned next to it.
 *
 * Pure geometry — no canvas, no three.js — so the behaviour can be tested.
 */

import { type Vec2, add, normalize, scale, sub, v2 } from "@/lib/three/prism-optics";

export type Segment = { a: Vec2; b: Vec2 };

/**
 * Deterministic pseudo-random in [-1, 1]. Scatter has to look organic but must be
 * identical on every frame and every reload, or the fan would boil.
 */
export function jitter(i: number): number {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}

/** Unit vector perpendicular to `d`. */
export function perp(d: Vec2): Vec2 {
  return v2(-d.y, d.x);
}

/**
 * Station one — Imagine. A single beam arrives and leaves as `count` rays spread
 * across an aperture at `target`: the fan is wide, uneven, and every ray is still a
 * possibility rather than a decision.
 */
export function scatter(
  from: Vec2,
  target: Vec2,
  count: number,
  apertureHalfWidth: number,
  wobble = 0.35,
): Segment[] {
  const axis = normalize(sub(target, from));
  const across = perp(axis);
  const out: Segment[] = [];

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : (i / (count - 1)) * 2 - 1;
    const offset = (t + jitter(i) * wobble * (1 / count) * 4) * apertureHalfWidth;
    out.push({ a: from, b: add(target, scale(across, offset)) });
  }
  return out;
}

/**
 * Station two — Build. The scattered arrivals leave as a parallel, evenly spaced
 * band: same light, now structured. Spacing is uniform by construction, which is the
 * visible difference between this station and the one before it.
 */
export function collimate(
  at: Vec2,
  direction: Vec2,
  count: number,
  bandHalfWidth: number,
  length: number,
): Segment[] {
  const axis = normalize(direction);
  const across = perp(axis);
  const out: Segment[] = [];

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : (i / (count - 1)) * 2 - 1;
    const origin = add(at, scale(across, t * bandHalfWidth));
    out.push({ a: origin, b: add(origin, scale(axis, length)) });
  }
  return out;
}

/** Even points across an aperture — where the scattered rays land, and the band starts. */
export function aperturePoints(
  at: Vec2,
  direction: Vec2,
  count: number,
  halfWidth: number,
): Vec2[] {
  const across = perp(normalize(direction));
  const points: Vec2[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : (i / (count - 1)) * 2 - 1;
    points.push(add(at, scale(across, t * halfWidth)));
  }
  return points;
}

/**
 * The angle, in radians, to rotate the prism so an incoming band meets it at the
 * incidence that disperses cleanly.
 *
 * The hero's sweep established that a beam at -80° against a prism at 0° puts every
 * wavelength through without total internal reflection. That relationship is what
 * matters, not the absolute angles, so holding it constant lets the station point
 * anywhere while still using the configuration that was actually measured.
 */
export function prismRotationFor(bandDirection: Vec2): number {
  const bandAngle = Math.atan2(bandDirection.y, bandDirection.x);
  return bandAngle + (80 * Math.PI) / 180;
}
