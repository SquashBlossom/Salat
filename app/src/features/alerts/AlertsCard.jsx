/* The Alerts card on the main screen.
   Owns: the on/off switch, which prayers ring, how early, the test button,
   and one plain sentence about what this phone can do.
   Refuses: timers (useInAppAlerts) and the server (push.js). */
import { useEffect, useState } from 'react';
import { PRAYERS } from '@salat/shared/methods';
import { upcomingAlerts } from '@salat/shared/schedule';
import { Icon } from '../../components/Icons.jsx';
import { fmtFull } from '../../core/format.js';
import { askPermission, capability, syncPush, stopPush, testPush, isIOS } from './push.js';
import { playChime, unlockAudio } from './chime.js';

const LEADS = [[0, 'At adhan'], [5, '5 min'], [10, '10 min'], [15, '15 min'], [30, '30 min']];

const STATUS = {
  'needs-home-screen': { warn: true, icon: 'share', text: 'On iPhone and iPad, alerts work after you add Salat to your Home Screen. In Safari, tap Share, then Add to Home Screen, then open Salat from there.' },
  unsupported: { warn: true, icon: 'alert', text: 'This browser cannot show alerts. Salat will still chime while it is open.' },
  denied: { warn: true, icon: 'alert', text: 'Notifications are blocked for Salat. Turn them on in your device settings, then come back.' },
  'in-app': { icon: 'bell', text: 'Salat chimes at each prayer while it is open. Lock-screen alerts switch on when the Salat server goes live.' },
  push: { icon: 'lock', text: 'Lock-screen alerts are on. They arrive even when Salat is closed.' },
  'push-failed': { warn: true, icon: 'alert', text: 'Could not reach the Salat server. Salat will chime while it is open. Try again later.' },
};

export function AlertsCard({ settings, update, toast }) {
  const a = settings.alerts;
  const [cap, setCap] = useState(() => capability());
  const [pushOk, setPushOk] = useState(null);

  // Keep the server's copy of the settings fresh whenever they change.
  useEffect(() => {
    if (!a.enabled || cap !== 'push') return;
    let live = true;
    syncPush(settings).then((r) => live && setPushOk(r.ok)).catch(() => live && setPushOk(false));
    return () => { live = false; };
  }, [a.enabled, cap, settings]);

  const setAlerts = (patch) => update({ alerts: { ...a, ...patch } });

  async function toggle() {
    unlockAudio(); // the tap lets us play sound later
    if (a.enabled) {
      setAlerts({ enabled: false });
      await stopPush();
      toast('Alerts off');
      return;
    }
    const perm = await askPermission();
    setCap(capability());
    setAlerts({ enabled: true });
    toast(perm === 'granted' ? 'Alerts on' : 'Alerts on while Salat is open');
  }

  async function test() {
    unlockAudio();
    if (cap === 'push' && pushOk) {
      try { await testPush(); toast('Test sent. Lock your phone to see it.'); return; } catch { /* fall through */ }
    }
    playChime();
    toast('This is how the alert sounds');
  }

  const next = a.enabled ? upcomingAlerts(settings, new Date(), 2)[0] : null;
  const shown = STATUS[cap === 'push' && pushOk === false ? 'push-failed' : cap];

  return (
    <section className="card pad alerts" aria-labelledby="alerts-title">
      <div className="head">
        <Icon name="bell" />
        <div className="title">
          <b id="alerts-title">Prayer alerts</b>
          <span>{a.enabled ? 'A gentle chime and a notice at each prayer you choose.' : 'Get a notice at each prayer, on your lock screen.'}</span>
        </div>
        <button className="switch" role="switch" aria-checked={a.enabled} aria-label="Prayer alerts" onClick={toggle} />
      </div>

      {a.enabled && (
        <div className="body">
          <div>
            <div className="eyebrow" style={{ marginBottom: 7 }}>Which prayers</div>
            <div className="pchips">
              {PRAYERS.map((p) => (
                <button key={p.k} className="chip" aria-pressed={!!a.prayers[p.k]}
                  onClick={() => setAlerts({ prayers: { ...a.prayers, [p.k]: !a.prayers[p.k] } })}>
                  <Icon name={p.k} />{p.en}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 7 }}>When</div>
            <div className="seg">
              {LEADS.map(([v, label]) => (
                <button key={v} aria-pressed={a.lead === v} onClick={() => setAlerts({ lead: v })}>{label}</button>
              ))}
            </div>
          </div>
          {next && (
            <div className="nextline">Next alert: <b>{next.en} · {fmtFull(next.h - a.lead / 60, settings.fmt)}</b></div>
          )}
          <div className={'status' + (shown.warn ? ' warn' : '')}>
            <Icon name={shown.icon} />
            <span>{shown.text}{isIOS() && cap === 'push' ? ' Keep Salat on your Home Screen; removing it turns alerts off.' : ''}</span>
          </div>
          <button className="btn" onClick={test}><Icon name="bell" />Test the alert</button>
        </div>
      )}
      {!a.enabled && cap === 'needs-home-screen' && (
        <div className="body"><div className="status warn"><Icon name="share" /><span>{STATUS['needs-home-screen'].text}</span></div></div>
      )}
    </section>
  );
}
