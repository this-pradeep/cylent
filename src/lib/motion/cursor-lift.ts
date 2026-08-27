/**
 * The section label answers the cursor: letters rise and tilt as the pointer passes, then
 * settle behind it.
 *
 * The maths lives here rather than in the hook so the falloff can be reasoned about without
 * a pointer — the shape of that curve is the whole feel of the effect, and it is the part
 * worth being sure about.
 */

/** How far from a letter the pointer still reaches it. */
export const LIFT_RADIUS_PX = 105;
/** How far a letter rises at full strength. */
export const LIFT_RISE_PX = 11;
/** How far it leans away from the pointer at full strength. */
export const LIFT_TILT_DEG = 4;
/** Fraction of the remaining distance covered each frame. */
export const LIFT_EASE = 0.16;

/**
 * Smoothstep, not a linear ramp. A linear falloff makes letters flick into motion the
 * instant the pointer crosses the radius; flattening both ends means they drift in and come
 * to rest instead of arriving and leaving abruptly.
 */
export function liftStrength(distancePx: number, radiusPx: number = LIFT_RADIUS_PX): number {
  if (radiusPx <= 0) return 0;
  const t = Math.min(1, Math.max(0, 1 - Math.abs(distancePx) / radiusPx));
  return t * t * (3 - 2 * t);
}

export type LiftTransform = {
  /** Negative is up. */
  y: number;
  rotate: number;
};

/**
 * `direction` is which side of the pointer the letter sits on: 1 to the right, -1 to the
 * left, 0 directly beneath. The two sides lean apart, so the line opens around the cursor
 * rather than tipping as one block.
 */
export function liftTransform(strength: number, direction: number): LiftTransform {
  return {
    // The `+ 0` normalises negative zero. At rest the multiplication yields -0, which is
    // harmless arithmetic but writes `translateY(-0px)` into the style attribute.
    y: -LIFT_RISE_PX * strength + 0,
    rotate: LIFT_TILT_DEG * strength * Math.sign(direction) + 0,
  };
}

/** One frame of easing toward a target. Approaches without ever passing it. */
export function stepToward(current: number, target: number, ease: number = LIFT_EASE): number {
  return current + (target - current) * ease;
}
