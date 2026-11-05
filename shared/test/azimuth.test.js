// The sun's compass direction, checked against what the sky does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sunAltitude, sunAzimuth } from '../solar.js';
import { dayTimes, withDefaults } from '../schedule.js';

const B = { lat: 40.6782, lng: -73.9442 };
const s = withDefaults({});
const day = dayTimes(s, 2026, 11, 4); // Brooklyn, tz -5
const az = (h) => sunAzimuth(2026, 11, 4, h, B.lat, B.lng, day.tz);
const alt = (h) => sunAltitude(2026, 11, 4, h, B.lat, B.lng, day.tz);

test('at solar noon the sun is due south (north of the tropics)', () => {
  const noon = day.hours.dhuhr - 1 / 60; // Dhuhr is noon + 1 minute
  assert.ok(Math.abs(az(noon) - 180) < 0.3, `got ${az(noon)}`);
});

test('in November the sun rises south of east and sets south of west', () => {
  const rise = az(day.hours.sunrise), set = az(day.hours.maghrib);
  assert.ok(rise > 100 && rise < 120, `sunrise azimuth ${rise}`);   // published value for NYC early Nov: ~108°
  assert.ok(set > 240 && set < 260, `sunset azimuth ${set}`);
  assert.ok(Math.abs((rise - 180) + (set - 180)) < 1.5, 'symmetric about south');
});

test('morning is east of south, afternoon west of south', () => {
  assert.ok(az(9) < 180 && az(15) > 180);
});

test('at the June solstice in Brooklyn the sun rises north of east', () => {
  const june = dayTimes(s, 2026, 6, 21);
  const rise = sunAzimuth(2026, 6, 21, june.hours.sunrise, B.lat, B.lng, june.tz);
  assert.ok(rise > 55 && rise < 65, `got ${rise}`);                  // published: ~58°
});

test('south of the equator (Sydney) noon sun is due north', () => {
  const syd = withDefaults({ loc: { name: 'Sydney', lat: -33.8688, lng: 151.2093, zone: 'Australia/Sydney' } });
  const d = dayTimes(syd, 2026, 6, 21);
  const a = sunAzimuth(2026, 6, 21, d.hours.dhuhr - 1 / 60, -33.8688, 151.2093, d.tz);
  assert.ok(a < 0.5 || a > 359.5, `got ${a}`);
});

test('altitude is unchanged by the new function (sanity)', () => {
  assert.ok(alt(day.hours.dhuhr) > 30 && alt(day.hours.dhuhr) < 36); // Nov noon in NYC ~33°
});
