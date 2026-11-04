/* The app shell: loads settings, keeps the clock, and lays out the screen.
   Owns: app state (settings, the day on view, the sheet, toasts, the alert moment).
   Refuses: math (shared/), storage details (data/), and drawing (components/). */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { METHODS } from '@salat/shared/methods';
import { withDefaults, dayTimes, events, partsIn, shiftDay } from '@salat/shared/schedule';
import { loadSettings, saveSettings } from './data/store.js';
import { deriveTheme } from './core/theme.js';
import { buildICS } from './core/ics.js';
import { Button, IconSprite, StatusPill, Toast } from './ui/index.jsx';
import { Header, Hero, HighLatFlag, Ledger, NightCard } from './components/Today.jsx';
import { QiblaCard } from './components/QiblaCard.jsx';
import { SettingsSheet } from './components/SettingsSheet.jsx';
import { SkyBackdrop } from './components/SkyBackdrop.jsx';
import { AlertsCard } from './features/alerts/AlertsCard.jsx';
import { AlertMoment } from './features/alerts/AlertMoment.jsx';
import { useInAppAlerts } from './features/alerts/useInAppAlerts.js';

const DAY = 864e5;

function applyTheme(s) {
  const root = document.documentElement;
  root.style.cssText = '';
  root.setAttribute('data-theme', s.theme);
  if (s.theme === 'custom') {
    const t = deriveTheme(s.custom.bg, s.custom.accent, s.custom.warn, s.custom.ok);
    let css = '';
    for (const k in t) { root.style.setProperty(k, t[k]); css += k + ':' + t[k] + ';'; }
    try { localStorage.setItem('salat-customcss', css); } catch { /* flash only */ }
  }
  const bar = getComputedStyle(document.body).getPropertyValue('--statusbar').trim();
  if (bar) document.getElementById('themeColor')?.setAttribute('content', bar);
}

function useToast() {
  const [msg, setMsg] = useState('');
  const timer = useRef(0);
  const toast = useCallback((m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(''), 2600);
  }, []);
  return [msg, toast];
}

function useOfflineStatus() {
  const [status, setStatus] = useState('Checking offline cache');
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) { setStatus('Offline cache needs a hosted URL'); return; }
    if (import.meta.env.DEV) { setStatus('Offline cache is off while developing'); return; }
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      const ready = () => setStatus('ready');
      if (navigator.serviceWorker.controller) ready();
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => w.state === 'activated' && ready());
      });
      setTimeout(() => navigator.serviceWorker.controller && ready(), 2500);
    }).catch(() => setStatus('Offline cache unavailable'));
  }, []);
  return status;
}

export default function App() {
  const [s, setS] = useState(() => withDefaults());
  const [loaded, setLoaded] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [now, setNow] = useState(() => new Date());
  const [sheet, setSheet] = useState({ open: false, search: false });
  const [moment, setMoment] = useState(null);
  const [msg, toast] = useToast();
  const offline = useOfflineStatus();

  // load once, then save on every change
  useEffect(() => { loadSettings().then((v) => { if (v) setS(withDefaults(v)); setLoaded(true); }); }, []);
  useEffect(() => { if (loaded) saveSettings(s); applyTheme(s); }, [s, loaded]);
  const update = useCallback((patch) => setS((cur) => ({ ...cur, ...patch })), []);

  // the clock: one tick a second
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);

  useInAppAlerts(s, setMoment);

  // the day on view, and the prayers around now
  const minute = Math.floor(now.getTime() / 60000);
  const view = useMemo(() => {
    const vp = partsIn(viewDate, s.loc.zone);
    const tm = shiftDay(vp.y, vp.m, vp.d, 1);
    return { today: dayTimes(s, vp.y, vp.m, vp.d), tomorrow: dayTimes(s, tm.y, tm.m, tm.d) };
  }, [s, viewDate]);
  const evs = useMemo(() => events(s, viewDate, 3), [s, viewDate, minute]); // eslint-disable-line react-hooks/exhaustive-deps
  const ni = evs.findIndex((e) => e.date > now);
  const next = evs[ni] || evs[evs.length - 1];
  const cur = evs[ni - 1] || evs[0];

  // swipe left/right to change the day
  const touch = useRef(null);
  useEffect(() => {
    const start = (e) => { touch.current = [e.touches[0].clientX, e.touches[0].clientY]; };
    const end = (e) => {
      if (!touch.current || sheet.open || moment) return;
      const dx = e.changedTouches[0].clientX - touch.current[0], dy = e.changedTouches[0].clientY - touch.current[1];
      if (Math.abs(dx) > 80 && Math.abs(dy) < 35 && Math.abs(dx) > Math.abs(dy) * 2.5) setViewDate((d) => new Date(d.getTime() + (dx < 0 ? DAY : -DAY)));
      touch.current = null;
    };
    document.addEventListener('touchstart', start, { passive: true });
    document.addEventListener('touchend', end, { passive: true });
    return () => { document.removeEventListener('touchstart', start); document.removeEventListener('touchend', end); };
  }, [sheet.open, moment]);

  const downloadICS = () => {
    const blob = new Blob([buildICS(s, 30)], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'salat-30days.ics';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    toast('Downloaded. Open it to add to Calendar.');
  };

  const methodLabel = METHODS[s.method].name.split('(')[0].trim() + ' · ' + (s.asr === 2 ? 'Hanafi' : 'Standard') + ' Asr';

  return (
    <>
      <IconSprite />
      <SkyBackdrop loc={s.loc} />
      <main className="page">
        <Header s={s} viewDate={viewDate}
          onPrev={() => setViewDate((d) => new Date(d.getTime() - DAY))}
          onNext={() => setViewDate((d) => new Date(d.getTime() + DAY))}
          onToday={() => { setViewDate(new Date()); toast('Back to today'); }}
          onSettings={() => setSheet({ open: true, search: false })}
          onLocation={() => setSheet({ open: true, search: true })} />
        <Hero s={s} today={view.today} cur={cur} next={next} now={now} />
        <HighLatFlag s={s} today={view.today} />
        <Ledger s={s} today={view.today} cur={cur} next={next} now={now} />
        <AlertsCard settings={s} update={update} toast={toast} />
        <div className="duo">
          <QiblaCard loc={s.loc} toast={toast} />
          <NightCard s={s} today={view.today} tomorrow={view.tomorrow} />
        </div>
        <div className="stack">
          <Button variant="primary" size="lg" icon="cal" onClick={downloadICS}>Add 30 Days to Calendar</Button>
          <Button icon="target" onClick={() => setSheet({ open: true, search: false })}>{methodLabel}</Button>
        </div>
        <footer className="footnote">
          <StatusPill tone={offline === 'ready' ? 'good' : 'neutral'}>{offline === 'ready' ? 'Ready offline' : offline}</StatusPill>
          <p>Times are calculated on your device from solar position. No internet needed after the first load.<br />
          Hijri date is calendrical (Umm al-Qura). Confirm with your masjid for moon sighting.<br />
          Swipe left or right to change the day.</p>
        </footer>
      </main>
      <SettingsSheet open={sheet.open} focusSearch={sheet.search} s={s} update={update} toast={toast} onClose={() => setSheet({ open: false, search: false })} />
      <Toast message={msg} />
      {moment && <AlertMoment alert={moment} onClose={() => setMoment(null)} />}
    </>
  );
}

