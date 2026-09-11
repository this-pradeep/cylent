/**
 * Where the studio actually is.
 *
 * Held as parts rather than as one string because two consumers need different shapes of
 * it: the loader and the About section want the human line, and the Organization schema
 * wants a locality and a country code as separate fields. Deriving the line from the parts
 * keeps that one fact in one place — two copies of a place we might move is two chances to
 * be wrong about it.
 */
export const STUDIO_CITY = "Indore";

/** ISO 3166-1 alpha-2, which is the form schema.org's addressCountry expects. */
export const STUDIO_COUNTRY_CODE = "IN";
export const STUDIO_COUNTRY = "India";

/** The line the loader stamps beside the studio clock, and the one About names. */
export const STUDIO_LOCATION = `${STUDIO_CITY}, ${STUDIO_COUNTRY}`;

/**
 * The studio's own clock, not the visitor's. A zone names a zone rather than a city, which
 * is why this is stated instead of derived.
 */
export const STUDIO_TIME_ZONE = "Asia/Kolkata";

/** The registered entity. The site says "Cylent"; the filings say this. */
export const LEGAL_NAME = "Cylent Solutions Pvt Ltd";
export const STUDIO_NAME = "Cylent Solutions";

/**
 * Where the studio is, to the degree the sun cares about.
 *
 * Here rather than in the renderer that consumes them, for the same reason the city is
 * here: this file is the one description of where the studio is, and coordinates are that
 * same fact at a finer resolution. `lib/three/sun.ts` reads them to place the sun over
 * Chapter 3's room.
 */
export const STUDIO_LATITUDE = 22.7196;
export const STUDIO_LONGITUDE = 75.8577;
