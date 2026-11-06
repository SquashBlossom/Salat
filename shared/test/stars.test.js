// Star positions and twilight, checked against facts anyone can verify.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STARS } from '../data/stars.js';
import { gmst, starAltAz, starVisibility, limitingMagnitude } from '../stars.js';

const B = { lat: 40.6782, lng: -73.9442 };
const find = (ra, dec) => STARS.find((s) => Math.abs(s[0] - ra) < 0.1 && Math.abs(s[1] - dec) < 0.1);

test('the list holds the bright stars, brightest first', () => {
  assert.equal(STARS.length, 921);
  assert.ok(STARS[0][2] < -1.4, 'Sirius first');
  for (let i = 1; i < STARS.length; i++) assert.ok(STARS[i][2] >= STARS[i - 1][2]);
});

test('sidereal time at the J2000 epoch is 280.46°', () => {
  assert.ok(Math.abs(gmst(new Date('2000-01-01T12:00:00Z')) - 280.46061837) < 1e-6);
});

test('Polaris stands at about your latitude, all night, every night', () => {
  const polaris = find(37.955, 89.264);
  for (const t of ['2026-11-06T02:00:00Z', '2026-11-06T10:00:00Z', '2026-06-21T04:00:00Z']) {
    const { alt, az } = starAltAz(polaris[0], polaris[1], B.lat, B.lng, new Date(t));
    assert.ok(Math.abs(alt - B.lat) < 1, `alt ${alt}`);
    assert.ok(az < 2 || az > 358, `az ${az}`);
  }
});

test('Sirius peaks due south at 90 − latitude + declination (≈32.6° in Brooklyn)', () => {
  const sirius = STARS[0];
  let best = { alt: -90 };
  for (let m = 0; m < 24 * 60; m += 2) {
    const p = starAltAz(sirius[0], sirius[1], B.lat, B.lng, new Date(Date.UTC(2026, 0, 1, 0, m)));
    if (p.alt > best.alt) best = p;
  }
  assert.ok(Math.abs(best.alt - (90 - B.lat + sirius[1])) < 0.1, `peak ${best.alt}`);
  assert.ok(Math.abs(best.az - 180) < 1, `az ${best.az}`);
});

test('twilight hides faint stars: none in daylight, the brightest at -6°, all at -18°', () => {
  assert.equal(starVisibility(-1.44, 10), 0);
  assert.equal(limitingMagnitude(-6), 1.0);
  assert.equal(limitingMagnitude(-12), 3.0);
  assert.equal(limitingMagnitude(-18), 4.5);
  assert.equal(starVisibility(0, -6), 1);       // Vega shows at civil twilight's end
  assert.equal(starVisibility(4.0, -12), 0);    // a faint star does not yet
  assert.ok(starVisibility(4.0, -18) > 0.5);    // it does in full night
});
