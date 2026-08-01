/**
 * 2D geometric optics for the hero prism.
 *
 * The prism is a triangular cross-section, so dispersion is a plane problem —
 * the same way it is taught. Keeping the maths here (pure, no three.js) means the
 * physics can be tested, and the scene component only has to draw the result.
 */

export type Vec2 = { x: number; y: number };

/**
 * Refractive index at the red and violet ends of the spectrum. The gap between
 * them is what fans white light out.
 *
 * Real crown glass spans roughly 1.51–1.53, which disperses a beam by about five
 * degrees — a rainbow too narrow to read at hero scale. These are widened well past
 * any real glass so the fan is legible. The optics below are exact; only the
 * material is exaggerated.
 */
export const IOR_RED = 1.44;
export const IOR_VIOLET = 1.7;

/**
 * The working configuration, measured rather than guessed.
 *
 * A 60° prism at n≈1.5 needs roughly 48° of incidence: any shallower and the violet
 * end passes the critical angle at the exit face and total-internally reflects, so
 * nothing leaves the glass. Sweeping beam angle against an apex-up prism gives a
 * clean band from -74° to -90°, all 26 wavelengths surviving, 26° of spread, leaving
 * down and to the right. Outside it the beam switches exit face and the whole fan
 * jumps direction, so rotation is clamped to stay on one branch.
 *
 * Apex-up is the orientation that reads as a prism rather than as a stray triangle,
 * and it is only available because the beam falls steeply from above.
 */
export const BASE_ROTATION = 0;
export const ROTATION_RANGE = (6 * Math.PI) / 180;

/** Incoming beam direction: steeply downward, drifting right. */
export const BEAM_DIRECTION: Vec2 = {
  x: Math.cos((-80 * Math.PI) / 180),
  y: Math.sin((-80 * Math.PI) / 180),
};

export const v2 = (x: number, y: number): Vec2 => ({ x, y });
export const sub = (a: Vec2, b: Vec2): Vec2 => v2(a.x - b.x, a.y - b.y);
export const add = (a: Vec2, b: Vec2): Vec2 => v2(a.x + b.x, a.y + b.y);
export const scale = (a: Vec2, k: number): Vec2 => v2(a.x * k, a.y * k);
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
export const length = (a: Vec2): number => Math.hypot(a.x, a.y);

export function normalize(a: Vec2): Vec2 {
  const l = length(a);
  return l === 0 ? v2(0, 0) : v2(a.x / l, a.y / l);
}

/** Index of refraction for a ray at position `t` across the spectrum (0 = red, 1 = violet). */
export function iorAt(t: number): number {
  return IOR_RED + (IOR_VIOLET - IOR_RED) * Math.min(1, Math.max(0, t));
}

/** Equilateral triangle centred on `center`, `radius` from centre to each vertex. */
export function trianglePoints(
  center: Vec2,
  radius: number,
  rotation: number,
): [Vec2, Vec2, Vec2] {
  const corner = (i: number): Vec2 => {
    const a = rotation + Math.PI / 2 + (i * Math.PI * 2) / 3;
    return v2(center.x + Math.cos(a) * radius, center.y + Math.sin(a) * radius);
  };
  return [corner(0), corner(1), corner(2)];
}

/**
 * Snell's law. `normal` must oppose `incident` (dot < 0). `eta` is the ratio of the
 * incoming medium's index to the outgoing one. Returns null on total internal
 * reflection — which is not an error case here but a visible one: rays wink out as
 * the prism turns past the critical angle.
 */
export function refract(incident: Vec2, normal: Vec2, eta: number): Vec2 | null {
  const cosi = -dot(normal, incident);
  const sin2t = eta * eta * (1 - cosi * cosi);
  if (sin2t > 1) return null;
  const cost = Math.sqrt(1 - sin2t);
  return normalize(add(scale(incident, eta), scale(normal, eta * cosi - cost)));
}

export type EdgeHit = { t: number; point: Vec2; normal: Vec2 };

/**
 * Nearest intersection of a ray with the triangle's edges, ignoring hits closer
 * than `minT` (used to step off a surface the ray is already sitting on).
 * `normal` points out of the triangle.
 */
export function intersectTriangle(
  origin: Vec2,
  dir: Vec2,
  tri: readonly Vec2[],
  minT = 1e-6,
): EdgeHit | null {
  const centroid = v2(
    (tri[0].x + tri[1].x + tri[2].x) / 3,
    (tri[0].y + tri[1].y + tri[2].y) / 3,
  );

  let best: EdgeHit | null = null;

  for (let i = 0; i < 3; i++) {
    const a = tri[i];
    const b = tri[(i + 1) % 3];
    const e = sub(b, a);

    const denom = dir.x * e.y - dir.y * e.x;
    if (Math.abs(denom) < 1e-12) continue;

    const diff = sub(a, origin);
    const t = (diff.x * e.y - diff.y * e.x) / denom;
    const s = (diff.x * dir.y - diff.y * dir.x) / denom;
    if (t <= minT || s < 0 || s > 1) continue;
    if (best && t >= best.t) continue;

    let normal = normalize(v2(e.y, -e.x));
    if (dot(normal, sub(a, centroid)) < 0) normal = scale(normal, -1);

    best = { t, point: add(origin, scale(dir, t)), normal };
  }

  return best;
}

export type RayPath = {
  entry: Vec2;
  exit: Vec2;
  /** Direction the ray leaves the prism travelling in. */
  outDir: Vec2;
};

/**
 * Trace one wavelength through the prism: refract in, cross the glass, refract out.
 * Returns null if the ray misses, or is trapped by total internal reflection.
 */
export function tracePrism(
  origin: Vec2,
  dir: Vec2,
  tri: readonly Vec2[],
  ior: number,
): RayPath | null {
  const d = normalize(dir);

  const entryHit = intersectTriangle(origin, d, tri);
  if (!entryHit) return null;

  // Orient the surface normal against the incoming ray.
  const nIn = dot(entryHit.normal, d) > 0 ? scale(entryHit.normal, -1) : entryHit.normal;
  const inside = refract(d, nIn, 1 / ior);
  if (!inside) return null;

  const exitHit = intersectTriangle(entryHit.point, inside, tri, 1e-5);
  if (!exitHit) return null;

  const nOut = dot(exitHit.normal, inside) > 0 ? scale(exitHit.normal, -1) : exitHit.normal;
  const outDir = refract(inside, nOut, ior);
  if (!outDir) return null;

  return { entry: entryHit.point, exit: exitHit.point, outDir };
}

// ---------------------------------------------------------------------------
// 3D refraction, for tracing a real beam through the hero model's pyramid.
// The 2D routines above solve a cross-section; these work against actual faces,
// so the spectrum responds to the model turning in any axis.
// ---------------------------------------------------------------------------

export type Vec3 = { x: number; y: number; z: number };

export function dot3(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function normalize3(a: Vec3): Vec3 {
  const l = Math.hypot(a.x, a.y, a.z);
  return l === 0 ? { x: 0, y: 0, z: 0 } : { x: a.x / l, y: a.y / l, z: a.z / l };
}

/**
 * Snell's law in three dimensions. `normal` must oppose `incident`. Returns null
 * on total internal reflection, which is a visible state here rather than an error:
 * as the pyramid turns, wavelengths drop out of the fan one at a time.
 */
export function refract3(incident: Vec3, normal: Vec3, eta: number): Vec3 | null {
  const i = normalize3(incident);
  const n = normalize3(normal);
  const cosi = -dot3(n, i);
  const sin2t = eta * eta * (1 - cosi * cosi);
  if (sin2t > 1) return null;
  const cost = Math.sqrt(1 - sin2t);
  const k = eta * cosi - cost;
  return normalize3({
    x: i.x * eta + n.x * k,
    y: i.y * eta + n.y * k,
    z: i.z * eta + n.z * k,
  });
}
