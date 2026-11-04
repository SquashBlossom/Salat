/* The alert clock: every 20 s, send each alert that has come due.
   Owns: deciding what to send now. Refuses: HTTP routes and storage details.

   It runs the same shared math as the app, so the lock screen says exactly
   what the screen says. An alert counts as due for 3 minutes after its time
   (a restart or a slow tick still sends it); `claim` stops any repeat. */
import { upcomingAlerts, alertText, withDefaults } from '@salat/shared/schedule';
import { fixHour } from '@salat/shared/solar';

const WINDOW = 3 * 60000;

function fmt(h, f) {
  const mins = Math.round(fixHour(h) * 60), hh = Math.floor(mins / 60) % 24, mm = String(mins % 60).padStart(2, '0');
  if (f === 24) return String(hh).padStart(2, '0') + ':' + mm;
  return ((hh % 12) || 12) + ':' + mm + (hh < 12 ? ' AM' : ' PM');
}

/** The alerts due for one subscription at `now` (pure: easy to test). */
export function dueFor(settings, now) {
  const s = withDefaults(settings);
  return upcomingAlerts(s, new Date(now - WINDOW), 1)
    .filter((a) => a.at <= now && now - a.at < WINDOW)
    .map((a) => ({ ...a, ...alertText(a, s.alerts.lead, (x) => fmt(x.h, s.fmt)) }));
}

/**
 * One pass over every subscription.
 * @param {ReturnType<import('./db.js').openDb>} db
 * @param {(sub: object, payload: object) => Promise<void>} send  throws {statusCode} on failure
 */
export async function tick(db, send, now = Date.now(), log = () => {}) {
  let sent = 0;
  for (const row of db.all()) {
    for (const a of dueFor(row.settings, now)) {
      if (!db.claim(row.id, a.at, a.k)) continue;
      try {
        await send(row, { title: a.title, body: a.body, k: a.k, at: a.prayerAt });
        sent++;
      } catch (e) {
        // 404/410: the phone removed Salat or turned alerts off. Forget it.
        if (e.statusCode === 404 || e.statusCode === 410) { db.remove(row.id); log(`removed ${row.id}: gone`); }
        else log(`send failed for ${row.id}: ${e.statusCode || e.message}`);
      }
    }
  }
  db.prune(now - 3 * 864e5);
  return sent;
}

export function start(db, send, log) {
  const run = () => tick(db, send, Date.now(), log).catch((e) => log('tick failed: ' + e.message));
  run();
  return setInterval(run, 20000);
}
