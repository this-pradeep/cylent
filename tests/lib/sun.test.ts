import { describe, expect, it } from "vitest";
import { STUDIO_LATITUDE, STUDIO_LONGITUDE } from "@/lib/site/studio";
import { sunOverStudio } from "@/lib/three/sun";

/**
 * Every assertion here is checked against something derived independently of the
 * implementation — longitude arithmetic, or the textbook noon-elevation identity — rather
 * than against numbers this module produced. A test that asserts what the code already does
 * proves only that the code has not changed.
 */

const MINUTES_PER_DAY = 24 * 60;
/** IST is UTC+5:30. Held as minutes so the conversion stays integer arithmetic. */
const IST_OFFSET_MINUTES = 330;

/** The UTC minute of the day at which the sun is highest over the studio. */
function solarNoonUtcMinute(year: number, month: number, day: number): number {
  let best = 0;
  let bestElevation = -Infinity;
  for (let minute = 0; minute < MINUTES_PER_DAY; minute += 1) {
    const at = new Date(Date.UTC(year, month - 1, day, 0, minute));
    const { elevation } = sunOverStudio(at);
    if (elevation > bestElevation) {
      bestElevation = elevation;
      best = minute;
    }
  }
  return best;
}

/**
 * Declination from the day of the year, to about half a degree. Deliberately a different
 * formula from the one the module uses, so it can disagree.
 */
function approximateDeclination(dayOfYear: number): number {
  return -23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10));
}

describe("sunOverStudio", () => {
  it("puts solar noon where the studio's longitude says it must be", () => {
    // IST is keyed to 82.5°E and Indore sits at 75.8577°E. That is 6.6423° of longitude,
    // and at four minutes per degree the sun crosses Indore's meridian 26.6 minutes after
    // it crosses IST's — so mean solar noon is 12:26:36 IST, which is 06:56:36 UTC.
    //
    // Mid-April is chosen because the equation of time passes through zero there, so mean
    // and true solar noon coincide and the expected minute is exact rather than a range.
    const degreesFromIstMeridian = 82.5 - STUDIO_LONGITUDE;
    // 12:00 IST expressed in UTC minutes, then pushed east-to-west by four minutes per
    // degree of longitude.
    const expected = 12 * 60 - IST_OFFSET_MINUTES + 4 * degreesFromIstMeridian;

    // Three minutes of slack covers the minute-resolution search and what little the
    // equation of time still contributes mid-April. A longitude mistake would be 26 minutes
    // out, so this catches the failure it exists to catch.
    expect(Math.abs(solarNoonUtcMinute(2026, 4, 15) - expected)).toBeLessThanOrEqual(3);
  });

  it("keeps solar noon inside the band the equation of time allows, all year", () => {
    // Mean solar noon is 12:26:36 IST and the equation of time moves true noon up to about
    // ±16 minutes either side of it. Nothing in the year may fall outside that.
    for (const [month, day] of [
      [1, 15],
      [2, 11],
      [4, 15],
      [6, 21],
      [7, 26],
      [9, 1],
      [11, 3],
      [12, 21],
    ]) {
      const istMinute = solarNoonUtcMinute(2026, month, day) + IST_OFFSET_MINUTES;
      expect(istMinute).toBeGreaterThanOrEqual(12 * 60 + 10);
      expect(istMinute).toBeLessThanOrEqual(12 * 60 + 43);
    }
  });

  it("reaches the noon elevation the latitude and declination require", () => {
    // At solar noon the sun stands at 90° minus the angle between the latitude and the
    // declination. That identity is independent of how the module gets there.
    for (const [month, day, dayOfYear] of [
      [6, 21, 172],
      [12, 21, 355],
      [3, 20, 79],
    ]) {
      const minute = solarNoonUtcMinute(2026, month, day);
      const { elevation } = sunOverStudio(new Date(Date.UTC(2026, month - 1, day, 0, minute)));
      const expected = 90 - Math.abs(STUDIO_LATITUDE - approximateDeclination(dayOfYear));

      // The reference declination above is a one-term approximation, good to about a
      // degree — so this is a sanity bound on the identity, not a precision check.
      expect(Math.abs(elevation - expected)).toBeLessThanOrEqual(1.5);
    }
  });

  it("puts the sun below the horizon at local midnight and above it at local noon", () => {
    // Local midnight in Indore is 18:30 UTC the previous day.
    const midnight = sunOverStudio(new Date("2026-09-10T18:30:00Z"));
    const noon = sunOverStudio(new Date("2026-09-11T06:56:00Z"));

    expect(midnight.elevation).toBeLessThan(0);
    expect(noon.elevation).toBeGreaterThan(0);
  });

  it("swings the azimuth from east of north to west of north across the day", () => {
    // 09:00 and 16:00 IST, as UTC. Azimuth is measured clockwise from north, so a morning
    // sun is under 180° and an afternoon sun is over it.
    const morning = sunOverStudio(new Date("2026-09-11T03:30:00Z"));
    const afternoon = sunOverStudio(new Date("2026-09-11T10:30:00Z"));

    expect(morning.azimuth).toBeGreaterThan(0);
    expect(morning.azimuth).toBeLessThan(180);
    expect(afternoon.azimuth).toBeGreaterThan(180);
    expect(afternoon.azimuth).toBeLessThan(360);
  });

  it("depends on the instant alone, not on the host machine's clock", () => {
    // Two Dates for the same instant, written in different offsets. Any implementation
    // reaching for getHours() instead of getUTCHours() reads the host's zone here, and the
    // golden elevation below is what catches it: it is fixed in UTC, so a test machine in
    // any other zone would produce a different number.
    const asUtc = sunOverStudio(new Date("2026-09-11T06:56:00Z"));
    const asIst = sunOverStudio(new Date("2026-09-11T12:26:00+05:30"));

    expect(asIst.elevation).toBe(asUtc.elevation);
    expect(asIst.azimuth).toBe(asUtc.azimuth);

    // 11 September is twelve days before the September equinox, and declination changes by
    // about 0.39° a day there — so the sun is tilted roughly +4.7°, and at noon it stands
    // near 90 - |22.72 - 4.7| = 72.0°. The bound is wide enough for the half-degree the
    // NOAA series itself is worth.
    expect(Math.abs(asUtc.elevation - 72.0)).toBeLessThanOrEqual(0.6);
  });
});
