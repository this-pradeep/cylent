import { STUDIO_LATITUDE, STUDIO_LONGITUDE } from "@/lib/site/studio";

/**
 * Where the sun is over the studio, right now.
 *
 * Chapter 3 is a room lit by Indore's actual light at the moment a visitor arrives, so this
 * is the one input the whole section depends on. The NOAA solar position equations, which
 * are arithmetic — no library, and nothing to fetch. `CLAUDE.md` requires the site stay
 * deployable as static files, so a sun that needed a request would have disqualified the
 * concept.
 *
 * Everything here reads the instant in UTC and never in local time. The sun over Indore is
 * the same sun whether the page is open in Indore or in London, and a `getHours()` anywhere
 * in this file would silently make the room follow the visitor instead of the studio.
 */

export type SunPosition = {
  /** Degrees above the horizon. Negative below it. */
  elevation: number;
  /** Degrees clockwise from north: 90 is due east, 180 due south, 270 due west. */
  azimuth: number;
};

const DEG = Math.PI / 180;
const MINUTES_PER_DAY = 24 * 60;
/** Minutes of arc the earth turns in a minute of time, expressed as NOAA does it. */
const MINUTES_PER_DEGREE = 4;

function dayOfYear(at: Date): number {
  const startOfYear = Date.UTC(at.getUTCFullYear(), 0, 1);
  return Math.floor((at.getTime() - startOfYear) / 86_400_000) + 1;
}

function utcMinuteOfDay(at: Date): number {
  return (
    at.getUTCHours() * 60 + at.getUTCMinutes() + at.getUTCSeconds() / 60
  );
}

/**
 * The year as an angle, which is what the two series below are expansions of. Offset by the
 * hour so the declination is right for the moment rather than for midnight.
 */
function fractionalYear(at: Date): number {
  const days = dayOfYear(at) - 1 + (utcMinuteOfDay(at) / 60 - 12) / 24;
  return ((2 * Math.PI) / 365) * days;
}

/**
 * How far ahead or behind the sun runs against clock time, in minutes. It is the reason
 * solar noon wanders by about half an hour across the year, and the reason the room's light
 * is not simply a function of the hour.
 */
function equationOfTime(gamma: number): number {
  return (
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma))
  );
}

/** The sun's tilt for the day, in radians. Swings ±23.44° over the year. */
function declination(gamma: number): number {
  return (
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma)
  );
}

export function sunOverStudio(at: Date): SunPosition {
  const gamma = fractionalYear(at);
  const decl = declination(gamma);

  // True solar time at the studio's own meridian, in minutes. Working from UTC means the
  // longitude term is the whole timezone correction — there is no zone offset to subtract,
  // and so no zone to get wrong.
  const trueSolarMinutes =
    utcMinuteOfDay(at) +
    equationOfTime(gamma) +
    MINUTES_PER_DEGREE * STUDIO_LONGITUDE;

  // Hour angle: zero when the sun crosses the meridian, negative before, positive after.
  const hourAngle = (trueSolarMinutes / MINUTES_PER_DEGREE - 180) * DEG;

  const lat = STUDIO_LATITUDE * DEG;
  const cosZenith =
    Math.sin(lat) * Math.sin(decl) +
    Math.cos(lat) * Math.cos(decl) * Math.cos(hourAngle);
  const zenith = Math.acos(Math.min(1, Math.max(-1, cosZenith)));

  // atan2 rather than the acos form NOAA also gives, because acos loses the sign and needs
  // the hour angle patched back in afterwards to tell morning from afternoon. This is
  // measured from south, so the half turn puts it back on north.
  const azimuthFromSouth = Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(lat) - Math.tan(decl) * Math.cos(lat),
  );

  return {
    elevation: 90 - zenith / DEG,
    azimuth: (azimuthFromSouth / DEG + 180 + 360) % 360,
  };
}

/**
 * The studio's own wall clock, as hours and minutes, for the line stamped beside the room.
 * Derived from the same instant the sun is, so the two can never disagree.
 */
export function studioClock(at: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(at);
}

/** Exported for the rake: how far the scrub is allowed to move the sun. */
export const RAKE_MINUTES = 25;

/** The sun as it will be `minutes` from `at`, for the entrance settle and the rake. */
export function sunOffsetBy(at: Date, minutes: number): SunPosition {
  return sunOverStudio(new Date(at.getTime() + minutes * 60_000));
}

export { MINUTES_PER_DAY };
