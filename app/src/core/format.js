/* Words and numbers on screen: times, dates, compass names.
   Owns: formatting. Refuses: math and state. */
import { fixHour } from '@salat/shared/solar';

export function fmtTime(h, fmt = 12) {
  if (!Number.isFinite(h)) return { t: '--:--', ap: '' };
  const mins = Math.round(fixHour(h) * 60);
  const hh = Math.floor(mins / 60) % 24;
  const mm = mins % 60;
  if (fmt === 24) return { t: String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'), ap: '' };
  const ap = hh < 12 ? 'AM' : 'PM';
  let h12 = hh % 12;
  if (h12 === 0) h12 = 12;
  return { t: h12 + ':' + String(mm).padStart(2, '0'), ap };
}

export const fmtFull = (h, fmt) => {
  const f = fmtTime(h, fmt);
  return f.t + (f.ap ? ' ' + f.ap : '');
};

export function hijri(date, zone) {
  for (const cal of ['islamic-umalqura', 'islamic']) {
    try {
      return new Intl.DateTimeFormat('en-u-ca-' + cal, { day: 'numeric', month: 'long', year: 'numeric', timeZone: zone })
        .format(date).replace(' AH', '') + ' AH';
    } catch { /* try the next calendar */ }
  }
  return '';
}

export function gregorian(date, zone) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: zone }).format(date);
}

const POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
export const compassName = (b) => POINTS[Math.round(b / 22.5) % 16];

/** "1h 04m 09s" pieces for a countdown, so the view can style the units. */
export function countdownParts(ms) {
  const h = Math.floor(ms / 3600000);
  const mi = Math.floor((ms % 3600000) / 60000);
  const se = Math.floor((ms % 60000) / 1000);
  const p = (n) => String(n).padStart(2, '0');
  return h > 0 ? [[h, 'h'], [p(mi), 'm'], [p(se), 's']] : [[p(mi), 'm'], [p(se), 's']];
}
