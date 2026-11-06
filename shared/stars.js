/* Where the stars are, and which ones you can see.
   Owns: sidereal time, star altitude/azimuth, and how twilight hides faint stars.
   Refuses: drawing. Pure math, tested in shared/test/stars.test.js. */
import { D } from './solar.js';

const sin = (a) => Math.sin(a * D), cos = (a) => Math.cos(a * D), tan = (a) => Math.tan(a * D);
const fix = (a) => ((a % 360) + 360) % 360;

/** Julian date of a moment. */
export const julianDate = (date) => date.getTime() / 86400000 + 2440587.5;

/** Greenwich mean sidereal time in degrees (accurate to well under a second for centuries around 2000). */
export function gmst(date) {
  const d = julianDate(date) - 2451545.0, T = d / 36525;
  return fix(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - (T * T * T) / 38710000);
}

/** A star's altitude and azimuth (degrees; azimuth clockwise from north) at a place and moment. */
export function starAltAz(raDeg, decDeg, lat, lng, date) {
  const H = fix(gmst(date) + lng - raDeg); // hour angle
  const alt = Math.asin(sin(decDeg) * sin(lat) + cos(decDeg) * cos(lat) * cos(H)) / D;
  const az = fix(Math.atan2(sin(H), cos(H) * sin(lat) - tan(decDeg) * cos(lat)) / D + 180);
  return { alt, az };
}

/* Twilight: how faint a star can be and still show, by how far the sun is below the horizon.
   The anchors are the twilight angles the prayer methods use:
   -6° civil (only the brightest), -12° nautical, -18° astronomical (full night). */
const LIMITS = [[-4, -1.6], [-6, 1.0], [-12, 3.0], [-18, 4.5]];

/** The faintest magnitude visible with the sun at `sunAlt` degrees. Below -18°, everything in the list. */
export function limitingMagnitude(sunAlt) {
  if (sunAlt >= LIMITS[0][0]) return LIMITS[0][1];
  for (let i = 1; i < LIMITS.length; i++) {
    const [a1, m1] = LIMITS[i - 1], [a2, m2] = LIMITS[i];
    if (sunAlt >= a2) return m1 + ((sunAlt - a1) / (a2 - a1)) * (m2 - m1);
  }
  return LIMITS.at(-1)[1];
}

/** 0 (hidden) to 1 (fully shown): a star fades in over 0.8 magnitudes as the sky darkens. */
export function starVisibility(mag, sunAlt) {
  return Math.max(0, Math.min(1, (limitingMagnitude(sunAlt) - mag) / 0.8));
}
