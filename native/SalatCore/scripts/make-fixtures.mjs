/* Saves the JavaScript's answers so the Swift tests can check they match.
   Run from the repo root:  node native/SalatCore/scripts/make-fixtures.mjs
   Re-run whenever shared/ changes. */
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { dayTimes, upcomingAlerts, withDefaults, alertText, wallToDate } from '../../../shared/schedule.js';
import { sunAltitude, qiblaBearing, tzOffset } from '../../../shared/solar.js';

const here = import.meta.dirname;
const out = join(here, '..', 'Tests', 'SalatCoreTests', 'Fixtures');

// 1. The original single-file app's 100 answers (already checked against the JS by shared/test).
copyFileSync(join(here, '../../../shared/test/legacy-fixture.json'), join(out, 'legacy-fixture.json'));

// 2. The full schedule, as the app and server compute it today.
const fmtFull = (h, fmt) => {               // same as app/src/core/format.js
  const fix = ((h % 24) + 24) % 24, mins = Math.round(fix * 60), hh = Math.floor(mins / 60) % 24, mm = mins % 60;
  if (fmt === 24) return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  let h12 = hh % 12; if (h12 === 0) h12 = 12;
  return h12 + ':' + String(mm).padStart(2, '0') + ' ' + (hh < 12 ? 'AM' : 'PM');
};
const places = {
  brooklyn: { name: 'Brooklyn', lat: 40.6782, lng: -73.9442, zone: 'America/New_York' },
  london: { name: 'London', lat: 51.5074, lng: -0.1278, zone: 'Europe/London' },
  stockholm: { name: 'Stockholm', lat: 59.3293, lng: 18.0686, zone: 'Europe/Stockholm' },
  sydney: { name: 'Sydney', lat: -33.8688, lng: 151.2093, zone: 'Australia/Sydney' },
  mecca: { name: 'Mecca', lat: 21.4225, lng: 39.8262, zone: 'Asia/Riyadh' },
  tehran: { name: 'Tehran', lat: 35.6892, lng: 51.389, zone: 'Asia/Tehran' },           // half-hour zone
  reykjavik: { name: 'Reykjavik', lat: 64.1466, lng: -21.9426, zone: 'Atlantic/Reykjavik' },
};
const cases = [
  { place: 'brooklyn', s: {}, from: '2026-11-04T17:00:00Z' },
  { place: 'brooklyn', s: {}, from: '2026-11-01T04:00:00Z' },                             // clocks fall back
  { place: 'brooklyn', s: { asr: 2, alerts: { lead: 10 } }, from: '2026-03-08T05:00:00Z' }, // clocks spring forward
  { place: 'london', s: { method: 'mwl', hiLat: 'angle' }, from: '2026-06-21T10:00:00Z' },
  { place: 'london', s: { method: 'mwl', hiLat: 'seventh' }, from: '2026-06-21T10:00:00Z' },
  { place: 'stockholm', s: { method: 'mwl', hiLat: 'middle', alerts: { prayers: { sunrise: true } } }, from: '2026-06-21T10:00:00Z' },
  { place: 'reykjavik', s: { method: 'isna', hiLat: 'none' }, from: '2026-06-21T12:00:00Z' }, // Fajr/Isha impossible
  { place: 'sydney', s: { method: 'mwl', adj: { fajr: 2, isha: -3 } }, from: '2026-10-04T00:00:00Z' },
  { place: 'mecca', s: { method: 'makkah', fmt: 24, alerts: { lead: 30 } }, from: '2026-11-04T09:00:00Z' },
  { place: 'tehran', s: { method: 'jafari' }, from: '2026-03-21T06:00:00Z' },
];
const rows = cases.map(({ place, s, from }) => {
  const settings = withDefaults({ ...s, loc: places[place], alerts: { enabled: true, ...(s.alerts || {}) } });
  const f = new Date(from);
  const day = dayTimes(settings, f.getUTCFullYear(), f.getUTCMonth() + 1, f.getUTCDate());
  const hours = Object.fromEntries(Object.entries(day.hours).map(([k, v]) => [k, typeof v === 'number' && !Number.isFinite(v) ? null : v]));
  const alerts = upcomingAlerts(settings, f, 2).map((a) => ({ ...a, ...alertText(a, settings.alerts.lead, (x) => fmtFull(x.h, settings.fmt)) }));
  return {
    place, settings, from, date: [day.y, day.m, day.d], tz: day.tz, hours,
    wall: Number.isFinite(day.hours.dhuhr) ? wallToDate(day.y, day.m, day.d, day.hours.dhuhr, settings.loc.zone).getTime() : null,
    alerts,
    altitudeAtNoonLocal: sunAltitude(day.y, day.m, day.d, 12, settings.loc.lat, settings.loc.lng, day.tz),
    qibla: qiblaBearing(settings.loc.lat, settings.loc.lng),
    tzAt: tzOffset(f, settings.loc.zone),
  };
});
writeFileSync(join(out, 'schedule-fixture.json'), JSON.stringify(rows, null, 1));
console.log(`${rows.length} schedule cases, ${rows.reduce((n, r) => n + r.alerts.length, 0)} alerts saved`);
