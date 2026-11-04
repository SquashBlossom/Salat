/* In-app alerts: while Salat is open, ring at each prayer.
   Owns: the timer, the chime, a system notification if allowed, and the "moment" overlay.
   Refuses: lock-screen alerts when Salat is closed (that is the server's job, push.js).

   Timers in a background tab can be late or skipped, so this checks every 5 s
   against real time instead of trusting one long setTimeout. */
import { useEffect, useRef } from 'react';
import { upcomingAlerts, alertText } from '@salat/shared/schedule';
import { playChime } from './chime.js';
import { log } from '../../data/store.js';
import { fmtFull } from '../../core/format.js';

export function useInAppAlerts(settings, onFire) {
  const fired = useRef(new Set());
  const fireRef = useRef(onFire);
  fireRef.current = onFire;

  useEffect(() => {
    if (!settings.alerts.enabled) return undefined;
    let queue = upcomingAlerts(settings, new Date(), 2);
    const check = async () => {
      const now = Date.now();
      // An alert counts if it came due in the last 2 minutes (a phone asleep longer than that missed it).
      const due = queue.filter((a) => a.at <= now && now - a.at < 120000 && !fired.current.has(a.k + a.at));
      for (const a of due) {
        fired.current.add(a.k + a.at);
        const text = alertText(a, settings.alerts.lead, (x) => fmtFull(x.h, settings.fmt));
        playChime();
        fireRef.current?.({ ...a, ...text });
        log({ type: 'alert', k: a.k, prayerAt: a.prayerAt, via: 'in-app' });
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          try {
            const reg = await navigator.serviceWorker?.ready;
            reg?.showNotification(text.title, { body: text.body, icon: './icon-180.png', tag: 'prayer-' + a.k });
          } catch { /* the overlay still shows when she comes back */ }
        }
      }
      if (queue.length < 4 || queue.every((a) => a.at <= now)) queue = upcomingAlerts(settings, new Date(), 2);
    };
    const id = setInterval(check, 5000);
    document.addEventListener('visibilitychange', check);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', check); };
  }, [settings]);
}
