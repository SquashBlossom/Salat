// The new shared math must give the exact answers the original single-file app gave.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { computeTimes, qiblaBearing } from '../solar.js';
import { CITIES } from '../cities.js';
import { METHODS } from '../methods.js';

const rows = JSON.parse(fs.readFileSync(new URL('./legacy-fixture.json', import.meta.url)));

test('prayer times match the original app in 100 cases', () => {
  for (const r of rows.filter((r) => r.t)) {
    const [y, m, d] = r.date;
    const t = computeTimes(y, m, d, r.lat, r.lng, r.tz, { ...r.m, asrFactor: r.asr, hiLat: 'angle' });
    for (const k of Object.keys(r.t)) assert.deepEqual(t[k], r.t[k], `${r.n} ${r.date} ${k}`);
  }
});

test('qibla bearings match the original app', () => {
  const coords = { Brooklyn: [40.6782, -73.9442], London: [51.5074, -0.1278], Stockholm: [59.3293, 18.0686],
    Sydney: [-33.8688, 151.2093], Mecca: [21.4225, 39.8262] };
  for (const [n, want] of rows.at(-1).qibla) assert.equal(qiblaBearing(...coords[n]), want, n);
  assert.equal(qiblaBearing(...coords.Brooklyn).toFixed(1), '58.5'); // the value in the README
});

test('data tables are complete', () => {
  assert.equal(CITIES.length, 278);
  assert.equal(Object.keys(METHODS).length, 13);
});
