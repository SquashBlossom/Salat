/* Day schedules: turn settings + a date into real moments in time.
   Owns: wall-clock <-> UTC conversion, one day's times, the list of upcoming alerts.
   Refuses: DOM, storage, network. The app and the server both call this,
   so a phone alert always matches what the screen shows. */
import { computeTimes, tzOffset, fixHour } from './solar.js';
import { METHODS, PRAYERS } from './methods.js';

export const DEFAULT_SETTINGS = {
  theme: 'midnight',
  custom: { bg: '#1A1033', accent: '#5FE3C8', warn: '#FFC94A', ok: '#48D597' },
  loc: { name: 'Brooklyn, NY, USA', lat: 40.6782, lng: -73.9442, zone: 'America/New_York' },
  method: 'isna', asr: 1, hiLat: 'angle', fmt: 12, alarm: 10,
  adj: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
  alerts: {
    enabled: false,
    lead: 0, // minutes before the prayer; 0 = at the adhan
    prayers: { fajr: true, sunrise: false, dhuhr: true, asr: true, maghrib: true, isha: true },
  },
};

/** Merge saved settings over the defaults, one level deep for nested groups. */
export function withDefaults(saved = {}) {
  const d = DEFAULT_SETTINGS;
  const a = saved.alerts || {};
  return {
    ...d, ...saved,
    loc: { ...d.loc, ...(saved.loc || {}) },
    adj: { ...d.adj, ...(saved.adj || {}) },
    custom: { ...d.custom, ...(saved.custom || {}) },
    alerts: { ...d.alerts, ...a, prayers: { ...d.alerts.prayers, ...(a.prayers || {}) } },
  };
}

/** Calendar parts of a moment, as seen on a wall clock in `zone`. */
export function partsIn(date, zone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
  const p = {};
  for (const { type, value } of dtf.formatToParts(date)) p[type] = value;
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, mi: +p.minute };
}

/** A wall-clock hour on a date in `zone`, as a real Date. */
export function wallToDate(y, m, d, hours, zone) {
  const off = tzOffset(new Date(Date.UTC(y, m - 1, d, 12)), zone);
  return new Date(Date.UTC(y, m - 1, d) + Math.round(hours * 3600000) - off * 3600000);
}

export function shiftDay(y, m, d, n) {
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

export function methodOpts(s) {
  const m = METHODS[s.method] || METHODS.isna;
  return { fajrAngle: m.fajrAngle, ishaAngle: m.ishaAngle, ishaMinutes: m.ishaMinutes, asrFactor: s.asr, hiLat: s.hiLat };
}

/** One day's prayer times (wall-clock hours) for the settings' location. */
export function dayTimes(s, y, m, d) {
  const { lat, lng, zone } = s.loc;
  const tz = tzOffset(new Date(Date.UTC(y, m - 1, d, 12)), zone);
  const raw = computeTimes(y, m, d, lat, lng, tz, methodOpts(s));
  const hours = { __adjusted: raw.__adjusted, __polar: raw.__polar };
  for (const k in raw) if (!k.startsWith('__')) hours[k] = raw[k] + (s.adj[k] || 0) / 60;
  return { hours, tz, y, m, d, zone };
}

/** Every prayer as a dated event, for `days` days starting the day before `from`. */
export function events(s, from = new Date(), days = 3) {
  const zone = s.loc.zone;
  const p = partsIn(from, zone);
  const out = [];
  for (let i = -1; i < days - 1; i++) {
    const dp = shiftDay(p.y, p.m, p.d, i);
    const day = dayTimes(s, dp.y, dp.m, dp.d);
    for (const pr of PRAYERS) {
      const h = day.hours[pr.k];
      if (!Number.isFinite(h)) continue;
      out.push({ ...pr, h: fixHour(h), date: wallToDate(dp.y, dp.m, dp.d, h, zone), dayKey: `${dp.y}-${dp.m}-${dp.d}` });
    }
  }
  return out.sort((a, b) => a.date - b.date);
}

/**
 * Upcoming alerts after `from`, honouring the alert settings.
 * @returns {{k:string, en:string, ar:string, h:number, prayerAt:number, at:number}[]}
 *   h = wall-clock hour at the place; prayerAt / at = UTC ms
 */
export function upcomingAlerts(s, from = new Date(), days = 2) {
  const a = s.alerts;
  if (!a || !a.enabled) return [];
  const lead = Math.max(0, Math.min(60, +a.lead || 0)) * 60000;
  return events(s, from, days + 1)
    .filter((e) => a.prayers[e.k])
    .map((e) => ({ k: e.k, en: e.en, ar: e.ar, h: e.h, prayerAt: e.date.getTime(), at: e.date.getTime() - lead }))
    .filter((e) => e.at > from.getTime());
}

/** The words on an alert. Short, so they fit a lock screen. */
export function alertText(alert, leadMin, fmtTime) {
  const when = fmtTime ? fmtTime(alert) : '';
  // \u2068…\u2069 isolate the Arabic, so "4:49 PM" never gets split around it.
  const body = (when ? when + ' · ' : '') + '\u2068' + alert.ar + '\u2069';
  if (leadMin > 0) return { title: `${alert.en} in ${leadMin} min`, body };
  return { title: `It's time for ${alert.en}`, body };
}
