/* Calendar export: 30 days of prayers as an .ics file, each with an alert.
   Owns: the ICS text. Refuses: downloading (the view does that). */
import { METHODS, PRAYERS } from '@salat/shared/methods';
import { dayTimes, partsIn, shiftDay, wallToDate } from '@salat/shared/schedule';
import { fmtFull } from './format.js';

const pad = (n) => String(n).padStart(2, '0');
const stamp = (d) => d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' +
  pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + '00Z';

export function buildICS(s, days = 30, now = new Date()) {
  const zone = s.loc.zone;
  const start = partsIn(now, zone);
  const st = stamp(now);
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Salat//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:Salat — ' + s.loc.name];
  for (let i = 0; i < days; i++) {
    const dp = shiftDay(start.y, start.m, start.d, i);
    const day = dayTimes(s, dp.y, dp.m, dp.d);
    for (const p of PRAYERS) {
      if (!p.obl) continue;
      const h = day.hours[p.k];
      if (!Number.isFinite(h)) continue;
      L.push('BEGIN:VEVENT',
        'UID:' + p.k + '-' + dp.y + pad(dp.m) + pad(dp.d) + '@salat',
        'DTSTAMP:' + st,
        'DTSTART:' + stamp(wallToDate(dp.y, dp.m, dp.d, h, zone)),
        'DURATION:PT15M',
        'SUMMARY:' + p.en + ' · ' + fmtFull(h, s.fmt),
        'DESCRIPTION:' + p.en + ' (' + p.ar + ') for ' + s.loc.name + '. ' + METHODS[s.method].name + ', ' +
          (s.asr === 2 ? 'Hanafi' : 'Standard') + ' Asr.',
        'BEGIN:VALARM', 'TRIGGER:-PT' + s.alarm + 'M', 'ACTION:DISPLAY', 'DESCRIPTION:' + p.en + ' in ' + s.alarm + ' minutes', 'END:VALARM',
        'END:VEVENT');
    }
  }
  L.push('END:VCALENDAR');
  return L.join('\r\n');
}
