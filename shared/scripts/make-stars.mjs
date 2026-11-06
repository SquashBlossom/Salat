/* Builds shared/data/stars.js from d3-celestial's stars.6.json (BSD-3, Olaf Frohn).
   Usage: node shared/scripts/make-stars.mjs path/to/stars.6.json
   Source: https://github.com/ofrohn/d3-celestial (data/stars.6.json, from the Hipparcos/Yale catalogues). */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MAX_MAG = 4.5; // brighter than this: what a person sees from a dark place
const src = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const rows = src.features
  .filter((f) => f.properties.mag <= MAX_MAG)
  .map((f) => {
    const [ra, dec] = f.geometry.coordinates;
    return [+(((ra % 360) + 360) % 360).toFixed(3), +dec.toFixed(3), +f.properties.mag.toFixed(2), +(+f.properties.bv || 0).toFixed(2)];
  })
  .sort((a, b) => a[2] - b[2]); // brightest first
const out = `/* Bright stars (magnitude <= ${MAX_MAG}): [right ascension°, declination°, magnitude, B-V colour].
   MADE BY shared/scripts/make-stars.mjs. Data: d3-celestial by Olaf Frohn (BSD-3, see LICENSE-stars.md),
   from the Hipparcos and Yale Bright Star catalogues. ${rows.length} stars, brightest first. */
export const STARS = ${JSON.stringify(rows)};
`;
writeFileSync(join(import.meta.dirname, '..', 'data', 'stars.js'), out);
console.log(`${rows.length} stars written`);
