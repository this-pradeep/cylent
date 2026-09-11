import { describe, expect, it } from "vitest";
import { contrastRatio, parseHex } from "@/lib/color/contrast";
import { roomLight } from "@/lib/three/room-light";
import { sunOverStudio } from "@/lib/three/sun";

/**
 * The palette the room is lit against.
 *
 * `design-principles.md` says these are defined once in `globals.css` and never hard-coded,
 * and `RoomScene` honours that by reading them off the document at runtime. A test is the
 * one place the literals belong, because what it asserts is a fact about these exact two
 * values rather than about whatever the page happens to be serving.
 */
const PALETTE = {
  surface: parseHex("#faf9f7"),
  ink: parseHex("#14120f"),
} as const;

const MINUTES_PER_DAY = 24 * 60;

/** Every minute of one UTC day, as sun positions over the studio. */
function everyMinuteOf(year: number, month: number, day: number) {
  return Array.from({ length: MINUTES_PER_DAY }, (_, minute) =>
    sunOverStudio(new Date(Date.UTC(year, month - 1, day, 0, minute))),
  );
}

describe("roomLight", () => {
  it("warms the light as the sun drops, and plateaus once it is high", () => {
    // Colour temperature is the only thing carrying the hour: a low sun is amber, a high
    // sun is near-white, and above 40° it stops changing because midday light does not keep
    // getting whiter.
    const low = roomLight({ elevation: 3, azimuth: 100 }, PALETTE);
    const mid = roomLight({ elevation: 20, azimuth: 140 }, PALETTE);
    const high = roomLight({ elevation: 45, azimuth: 180 }, PALETTE);
    const higher = roomLight({ elevation: 80, azimuth: 180 }, PALETTE);

    expect(low.temperature).toBeLessThan(mid.temperature);
    expect(mid.temperature).toBeLessThan(high.temperature);
    expect(higher.temperature).toBe(high.temperature);
  });

  it("holds ink at AA against the ground for every minute of the year's extremes", () => {
    // The room is the background of real body copy, so this is the constraint the whole
    // concept has to survive. Asserted across the sweep rather than at its ends, because
    // the failure this guards against is a dip in the middle.
    for (const [month, day] of [
      [6, 21],
      [9, 23],
      [12, 21],
    ]) {
      for (const sun of everyMinuteOf(2026, month, day)) {
        const { ground } = roomLight(sun, PALETTE);
        expect(contrastRatio(ground, PALETTE.ink)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("keeps the ground a warm cast rather than a colour wash", () => {
    // `design-principles.md`: "Color should support the brand. Not dominate the
    // experience." A 2000K sun applied at full strength turns the ground vivid orange,
    // which is a colour this palette does not contain. The light may warm the paper; it may
    // not repaint it.
    //
    // Bounded on channel spread, which is what separates a cast from a wash. The unlit
    // surface sits at 0.012, and a warm sepia around rgb(180,150,123) sits at 0.22.
    for (const [month, day] of [
      [6, 21],
      [9, 23],
      [12, 21],
    ]) {
      for (const sun of everyMinuteOf(2026, month, day)) {
        const { ground } = roomLight(sun, PALETTE);
        const spread = Math.max(...ground) - Math.min(...ground);
        expect(spread).toBeLessThanOrEqual(0.24);
      }
    }
  });

  it("reports the light's own colour alongside the cast it leaves", () => {
    // The shaft is allowed to be the colour the light actually is; only the ground is held
    // back to a cast. So the two are separate outputs, and the renderer never has to invent
    // a colour of its own.
    const low = roomLight({ elevation: 3, azimuth: 100 }, PALETTE);
    const high = roomLight({ elevation: 70, azimuth: 180 }, PALETTE);

    const spread = (c: readonly number[]) => Math.max(...c) - Math.min(...c);

    // A low sun is markedly warmer in the beam than on the floor.
    expect(spread(low.tint)).toBeGreaterThan(spread(low.ground));
    // A high sun is near enough white that the beam carries almost no colour.
    expect(spread(high.tint)).toBeLessThan(0.16);
    // Sunlight is never blue-dominant at this latitude.
    expect(low.tint[0]).toBeGreaterThan(low.tint[2]);
  });

  it("hands the room to the interior source once the sun is down", () => {
    const night = roomLight({ elevation: -14, azimuth: 20 }, PALETTE);
    const day = roomLight({ elevation: 30, azimuth: 200 }, PALETTE);

    expect(night.interior).toBe(true);
    expect(night.sun).toBe(0);
    expect(day.interior).toBe(false);
    expect(day.sun).toBeGreaterThan(0);
  });

  it("keeps the shaft on stage at every elevation", () => {
    for (let elevation = -20; elevation <= 90; elevation += 1) {
      const { shaft } = roomLight({ elevation, azimuth: 150 }, PALETTE);

      expect(shaft.width).toBeGreaterThan(0);
      // Some part of the shaft has to fall inside the frame, or the room has a light source
      // that lights nothing.
      expect(shaft.center + shaft.width / 2).toBeGreaterThan(0);
      expect(shaft.center - shaft.width / 2).toBeLessThan(1);
    }
  });

  it("throws the shaft across the room as the sun crosses the sky", () => {
    // An eastern sun comes through the window from one side and a western sun from the
    // other, so the shaft has to travel. Mirrored about the meridian, because the window
    // does not move.
    const morning = roomLight({ elevation: 25, azimuth: 100 }, PALETTE);
    const noon = roomLight({ elevation: 25, azimuth: 180 }, PALETTE);
    const evening = roomLight({ elevation: 25, azimuth: 260 }, PALETTE);

    expect(morning.shaft.center).toBeLessThan(noon.shaft.center);
    expect(noon.shaft.center).toBeLessThan(evening.shaft.center);
    expect(noon.shaft.center - morning.shaft.center).toBeCloseTo(
      evening.shaft.center - noon.shaft.center,
      6,
    );
  });
});
