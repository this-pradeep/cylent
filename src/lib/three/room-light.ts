import { contrastRatio, type Rgb } from "@/lib/color/contrast";
import type { SunPosition } from "@/lib/three/sun";

/**
 * The sun's position turned into the room's light.
 *
 * One function, because the hour has to decide every part of the room at once and the parts
 * have to agree: the colour, the level, and where the shaft lands are all the same fact seen
 * three ways. `RoomScene` reads this and writes the result straight into shader uniforms.
 *
 * Pure and palette-injected. The tokens live in `globals.css` per `design-principles.md`
 * and the renderer reads them off the document, so nothing here knows a hex value.
 */

export type RoomPalette = {
  /** The unlit ground, `--color-surface`. */
  surface: Rgb;
  /** What the copy is set in, `--color-ink`. The clamp below exists to protect it. */
  ink: Rgb;
};

export type RoomLight = {
  /** How much light the sun is contributing, 0 when it is down. */
  sun: number;
  /** Kelvin of whatever is lighting the room. */
  temperature: number;
  /** True once the sun is below the horizon and the interior source carries the room. */
  interior: boolean;
  /** The lit ground, already clamped for legibility. */
  ground: Rgb;
  /**
   * The light's own colour at full strength, for the shaft and the motes in it.
   *
   * Separate from `ground` on purpose. The ground is held back to a cast so the room stays
   * on palette; the beam is allowed to be the colour the light actually is, because a shaft
   * is where warmth is supposed to live. Keeping both here means the renderer never has to
   * invent a colour of its own.
   */
  tint: Rgb;
  shaft: {
    /** Where the shaft's middle falls across the frame, 0 at the left edge, 1 at the right. */
    center: number;
    /** How much of the frame it covers. */
    width: number;
    /** 0 with the sun overhead, 1 with it on the horizon. Drives how far shadows throw. */
    rake: number;
  };
};

const DEG = Math.PI / 180;

/**
 * Amber on the horizon to near-white at the top. The ceiling is 40° rather than 90° because
 * daylight stops getting whiter well before the sun stops climbing, and a ramp that ran to
 * 90° would leave every hour that matters bunched at the amber end.
 */
const HORIZON_KELVIN = 2000;
const DAYLIGHT_KELVIN = 5600;
const KELVIN_PLATEAU_ELEVATION = 40;
/** A warm bulb. What the room is lit by when the sun is not available. */
const INTERIOR_KELVIN = 2700;

/** How much of the frame the shaft can travel either side of the meridian. */
const SHAFT_SPREAD = 0.42;
const SHAFT_WIDTH_HIGH = 0.3;
const SHAFT_WIDTH_LOW = 0.65;
/** The pool an interior source throws. Fixed, because a lamp does not track the sky. */
const INTERIOR_SHAFT_WIDTH = 0.55;

/**
 * Contrast the ground must hold against ink. Targeted a notch above the 4.5 that WCAG AA
 * requires, so the clamp lands clear of the boundary rather than on it.
 */
const TARGET_CONTRAST = 4.6;

/**
 * How much of the light's own colour reaches the ground.
 *
 * A 2000K sun applied at full strength puts the ground at rgb(185, 107, 26) — vivid orange,
 * a colour this palette does not contain, and `design-principles.md` is explicit that colour
 * supports the brand rather than dominating it. The light is blended toward neutral so it
 * warms the paper instead of repainting it.
 *
 * This is the difference between a cast and a wash, and it is the whole reason the room can
 * be lit by a 2000K sun and still look like the same site.
 */
const TINT_STRENGTH = 0.35;

/**
 * Tanner Helland's blackbody approximation, which is accurate enough for light this far
 * from a calibration target and costs nothing. Returned with red at full, which is true of
 * every temperature this room uses.
 */
function kelvinToRgb(kelvin: number): Rgb {
  const t = kelvin / 100;
  const green =
    t <= 66
      ? 99.4708025861 * Math.log(t) - 161.1195681661
      : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const blue =
    t >= 66
      ? 255
      : t <= 19
        ? 0
        : 138.5177312231 * Math.log(t - 10) - 305.0447927307;

  const clamp = (channel: number) => Math.min(255, Math.max(0, channel)) / 255;
  return [
    clamp(t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592)),
    clamp(green),
    clamp(blue),
  ];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/**
 * Lifts a ground that has gone too dark back toward the unlit surface until ink is legible
 * against it again.
 *
 * This is the reason the two-in-the-morning room is lamplit rather than dark, and it is a
 * deliberate trade: `accessibility.md` requires the copy stay readable, and a light
 * editorial site should not have one section that goes black.
 *
 * Bisection rather than algebra because contrast rises monotonically along the mix — the
 * surface is the brightest thing available and ink is far darker than anything on this path
 * — so twenty steps land inside a thousandth of the crossing without needing the luminance
 * curve inverted.
 */
function liftForLegibility(ground: Rgb, palette: RoomPalette): Rgb {
  if (contrastRatio(ground, palette.ink) >= TARGET_CONTRAST) return ground;

  let low = 0;
  let high = 1;
  for (let step = 0; step < 20; step += 1) {
    const mid = (low + high) / 2;
    if (contrastRatio(mix(ground, palette.surface, mid), palette.ink) >= TARGET_CONTRAST) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return mix(ground, palette.surface, high);
}

export function roomLight(sun: SunPosition, palette: RoomPalette): RoomLight {
  const interior = sun.elevation < 0;
  // Sine rather than the angle itself: it is how much of the light actually lands on a
  // horizontal surface, which is what the room is mostly made of.
  const height = interior ? 0 : Math.max(0, Math.sin(sun.elevation * DEG));

  const temperature = interior
    ? INTERIOR_KELVIN
    : lerp(
        HORIZON_KELVIN,
        DAYLIGHT_KELVIN,
        Math.min(1, sun.elevation / KELVIN_PLATEAU_ELEVATION),
      );

  // The dim end is set below what legibility allows on purpose, so the clamp is what decides
  // how dark the room gets rather than a number guessed here. Night is then as low as it can
  // be and still be read, which is the most the concept can have.
  const exposure = interior ? 0.52 : lerp(0.62, 1, height);
  const tint = kelvinToRgb(temperature);
  const cast = mix([1, 1, 1], tint, TINT_STRENGTH);
  const ground: Rgb = [
    palette.surface[0] * cast[0] * exposure,
    palette.surface[1] * cast[1] * exposure,
    palette.surface[2] * cast[2] * exposure,
  ];

  return {
    sun: height,
    temperature,
    interior,
    ground: liftForLegibility(ground, palette),
    tint,
    shaft: {
      // Measured off the meridian so an eastern sun and its mirrored western twin land
      // equally far either side of centre. The window does not move; the sun does.
      center: 0.5 + ((sun.azimuth - 180) / 180) * SHAFT_SPREAD,
      width: interior
        ? INTERIOR_SHAFT_WIDTH
        : lerp(SHAFT_WIDTH_LOW, SHAFT_WIDTH_HIGH, height),
      rake: 1 - height,
    },
  };
}
