/* Where the moon is, and how much of it is lit.
   Owns: the moon's sky position (with parallax), its phase, and the phase's plain name.
   Refuses: drawing, and any religious meaning (whether a month has begun is for people who sight it).
   Pure math: the main terms of Meeus, "Astronomical Algorithms" ch. 47-48 (good to about 0.3°).
   Tested in shared/test/moon.test.js. */
import { D } from './solar.js';
import { julianDate, gmst } from './stars.js';

const sin = (a) => Math.sin(a * D), cos = (a) => Math.cos(a * D);
const fix = (a) => ((a % 360) + 360) % 360;
const SYNODIC = 29.530589; // days from new moon to new moon

/** The moon's ecliptic place, distance, and the angles the phase needs, at a moment. */
function moonParts(date) {
  const T = (julianDate(date) - 2451545.0) / 36525;
  const Lp = fix(218.3164477 + 481267.88123421 * T);  // mean longitude
  const Dm = fix(297.8501921 + 445267.1114034 * T);   // mean elongation from the sun
  const M = fix(357.5291092 + 35999.0502909 * T);     // sun's mean anomaly
  const Mp = fix(134.9633964 + 477198.8675055 * T);   // moon's mean anomaly
  const F = fix(93.2720950 + 483202.0175233 * T);     // argument of latitude
  const lon = fix(Lp + 6.288774 * sin(Mp) + 1.274027 * sin(2 * Dm - Mp) + 0.658314 * sin(2 * Dm) + 0.213618 * sin(2 * Mp)
    - 0.185116 * sin(M) - 0.114332 * sin(2 * F) + 0.058793 * sin(2 * Dm - 2 * Mp) + 0.057066 * sin(2 * Dm - M - Mp)
    + 0.053322 * sin(2 * Dm + Mp) + 0.045758 * sin(2 * Dm - M) - 0.040923 * sin(M - Mp) - 0.034720 * sin(Dm)
    - 0.030383 * sin(M + Mp));
  const lat = 5.128122 * sin(F) + 0.280602 * sin(Mp + F) + 0.277693 * sin(Mp - F) + 0.173237 * sin(2 * Dm - F)
    + 0.055413 * sin(2 * Dm - Mp + F) + 0.046271 * sin(2 * Dm - Mp - F) + 0.032573 * sin(2 * Dm + F) + 0.017198 * sin(2 * Mp + F);
  const km = 385000.56 - 20905.355 * cos(Mp) - 3699.111 * cos(2 * Dm - Mp) - 2955.968 * cos(2 * Dm) - 569.925 * cos(2 * Mp);
  // The sun's true longitude, for which side is lit
  const C = (1.914602 - 0.004817 * T) * sin(M) + 0.019993 * sin(2 * M) + 0.000289 * sin(3 * M);
  const sunLon = fix(280.46646 + 36000.76983 * T + C);
  const eps = 23.439291 - 0.0130042 * T; // tilt of the Earth's axis
  return { T, Dm, M, Mp, lon, lat, km, sunLon, eps };
}

/** The moon's right ascension and declination (degrees, from the Earth's centre) and distance (km). */
export function moonRaDec(date) {
  const { lon, lat, km, eps } = moonParts(date);
  const ra = fix(Math.atan2(sin(lon) * cos(eps) - Math.tan(lat * D) * sin(eps), cos(lon)) / D);
  const dec = Math.asin(sin(lat) * cos(eps) + cos(lat) * sin(eps) * sin(lon)) / D;
  return { ra, dec, km };
}

/** The moon's altitude and azimuth (degrees; azimuth clockwise from north) as seen from a place.
    Includes parallax: the moon is close, so it sits up to 1° lower than seen from the Earth's centre. */
export function moonAltAz(lat, lng, date) {
  const { ra, dec, km } = moonRaDec(date);
  const H = fix(gmst(date) + lng - ra);
  const geoAlt = Math.asin(sin(dec) * sin(lat) + cos(dec) * cos(lat) * cos(H)) / D;
  const az = fix(Math.atan2(sin(H), cos(H) * sin(lat) - Math.tan(dec * D) * cos(lat)) / D + 180);
  const alt = geoAlt - Math.asin((6378.14 / km) * cos(geoAlt)) / D;
  return { alt, az, km };
}

/**
 * The moon's phase at a moment.
 * lit: 0 (new) to 1 (full), the part of the disc lit by the sun.
 * waxing: true while it grows (new → full). age: days since the last new moon.
 * name: the plain English phase name.
 */
export function moonPhase(date) {
  const { Dm, M, Mp, lon, sunLon } = moonParts(date);
  const i = fix(180 - Dm - 6.289 * sin(Mp) + 2.100 * sin(M) - 1.274 * sin(2 * Dm - Mp)
    - 0.658 * sin(2 * Dm) - 0.214 * sin(2 * Mp) - 0.110 * sin(Dm)); // phase angle
  const lit = (1 + cos(i)) / 2;
  const elong = fix(lon - sunLon);
  const waxing = elong < 180;
  return { lit, waxing, age: (elong / 360) * SYNODIC, name: phaseName(lit, waxing) };
}

/** Plain names: New, Waxing crescent, First quarter, Waxing gibbous, Full, then the same waning. */
export function phaseName(lit, waxing) {
  if (lit < 0.02) return 'New moon';
  if (lit > 0.98) return 'Full moon';
  if (Math.abs(lit - 0.5) < 0.04) return waxing ? 'First quarter' : 'Last quarter';
  return (waxing ? 'Waxing ' : 'Waning ') + (lit < 0.5 ? 'crescent' : 'gibbous');
}
