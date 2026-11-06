// The moon, checked against Meeus's worked examples and dates anyone can look up.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moonRaDec, moonAltAz, moonPhase, phaseName } from '../moon.js';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) < tol, `${msg}: ${a} vs ${b}`);
const B = { lat: 40.6782, lng: -73.9442 }; // Brooklyn

test('Meeus example 47.a (1992 April 12): place and distance', () => {
  const { ra, dec, km } = moonRaDec(new Date('1992-04-11T23:58:59Z')); // 0h dynamical time
  near(ra, 134.688470, 0.3, 'right ascension');
  near(dec, 13.768368, 0.3, 'declination');
  near(km, 368409.7, 300, 'distance');
});

test('Meeus example 48.a (1992 April 12): 68% lit, waxing', () => {
  const p = moonPhase(new Date('1992-04-11T23:58:59Z'));
  near(p.lit, 0.6786, 0.005, 'lit');
  assert.equal(p.waxing, true);
  assert.equal(p.name, 'Waxing gibbous');
});

test('January 2024: new on the 11th, first quarter on the 18th, full on the 25th', () => {
  const n = moonPhase(new Date('2024-01-11T11:57:00Z'));
  near(n.lit, 0, 0.005, 'new'); assert.equal(n.name, 'New moon');
  assert.ok(n.age < 0.3 || n.age > 29.2, `age ${n.age}`);
  const q = moonPhase(new Date('2024-01-18T03:53:00Z'));
  near(q.lit, 0.5, 0.02, 'first quarter'); assert.equal(q.name, 'First quarter');
  const f = moonPhase(new Date('2024-01-25T17:54:00Z'));
  near(f.lit, 1, 0.005, 'full'); assert.equal(f.name, 'Full moon');
  assert.equal(moonPhase(new Date('2024-01-14T12:00:00Z')).name, 'Waxing crescent');
  assert.equal(moonPhase(new Date('2024-01-30T12:00:00Z')).name, 'Waning gibbous');
});

test('a full moon stands high in the south around midnight', () => {
  const { alt, az } = moonAltAz(B.lat, B.lng, new Date('2024-01-26T05:00:00Z'));
  assert.ok(alt > 50, `alt ${alt}`);
  assert.ok(az > 150 && az < 210, `az ${az}`);
});

test('a new moon is up in the daytime, near the sun', () => {
  const { alt } = moonAltAz(B.lat, B.lng, new Date('2024-01-11T17:00:00Z')); // noon in Brooklyn
  assert.ok(alt > 15, `alt ${alt}`);
});

test('phase names', () => {
  assert.equal(phaseName(0.01, true), 'New moon');
  assert.equal(phaseName(0.2, false), 'Waning crescent');
  assert.equal(phaseName(0.51, false), 'Last quarter');
  assert.equal(phaseName(0.99, false), 'Full moon');
});
