/* The Alerts card on the main screen.
   Owns: the on/off switch, which prayers ring, how early, the test button,
   and one plain sentence about what this phone can do.
   Refuses: timers (useInAppAlerts) and the server (push.js). */
import { useEffect, useState } from 'react';
import { PRAYERS } from '@salat/shared/methods';
import { upcomingAlerts } from '@salat/shared/schedule';
import { Button, Card, Chip, ChipRow, Field, Icon, Notice, PopUpMenu, Switch } from '../../ui/index.jsx';
import { fmtFull } from '../../core/format.js';
import { askPermission, capability, syncPush, stopPush, testPush, isIOS } from './push.js';
import { playChime, unlockAudio } from './chime.js';

const LEADS = [0, 5, 10, 15, 30].map((m) => ({ value: m, label: m ? `${m} minutes before` : 'At the adhan' }));

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
    <Card padded aria-labelledby="alerts-title">
      <div className="alerts-head">
        <Icon name="bell" size="lg" />
        <div className="title">
          <b id="alerts-title">Prayer alerts</b>
          <span className="t-caption">{a.enabled ? 'A gentle chime and a notice at each prayer you choose.' : 'Get a notice at each prayer, on your lock screen.'}</span>
        </div>
        <Switch on={a.enabled} label="Prayer alerts" onChange={toggle} />
      </div>

      {a.enabled && (
        <div className="alerts-body">
          <Field label="Which prayers">
            <ChipRow>
              {PRAYERS.map((p) => (
                <Chip key={p.k} icon={p.k} on={a.prayers[p.k]}
                  onClick={() => setAlerts({ prayers: { ...a.prayers, [p.k]: !a.prayers[p.k] } })}>{p.en}</Chip>
              ))}
            </ChipRow>
          </Field>
          <Field label="When">
            <PopUpMenu look="boxed" label="When" items={LEADS} value={a.lead} onChange={(v) => setAlerts({ lead: v })} />
          </Field>
          {next && <div className="next-alert">Next alert: <b>{next.en} · {fmtFull(next.h - a.lead / 60, settings.fmt)}</b></div>}
          <Notice tone={shown.warn ? 'caution' : 'info'} icon={shown.icon}>
            {shown.text}{isIOS() && cap === 'push' ? ' Keep Salat on your Home Screen; removing it turns alerts off.' : ''}
          </Notice>
          <Button variant="tinted" icon="bell" onClick={test}>Test the Alert</Button>
        </div>
      )}
      {!a.enabled && cap === 'needs-home-screen' && (
        <div className="alerts-body"><Notice tone="caution" icon="share">{STATUS['needs-home-screen'].text}</Notice></div>
      )}
    </Card>
  );
}
