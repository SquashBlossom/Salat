/* SKY SHEET — the 3D sky in a sheet, with a time slider and a plain readout.
   Owns: which moment is shown, the words under the dome. Refuses: 3D (SkyDome) and math (shared/).
   Loaded only when opened, so the 3D library never slows the main screen. */
import { useEffect, useMemo, useState } from 'react';
import { PRAYERS } from '@salat/shared/methods';
import { partsIn } from '@salat/shared/schedule';
import { sunAltitude, sunAzimuth, qiblaBearing } from '@salat/shared/solar';
import { moonAltAz, moonPhase } from '@salat/shared/moon';
import { wallToDate } from '@salat/shared/schedule';
import { Button, MoonPhase, Notice, Sheet, Slider } from '../../ui/index.jsx';
import { compassName, fmtFull } from '../../core/format.js';
import { SkyDome } from './SkyDome.jsx';
import PointView from './PointView.jsx';

export default function SkySheet({ open, onClose, s, today }) {
  // Mount closed, then open on the next frame, so the sheet slides up the first time too.
  const [shown, setShown] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setShown(open)); return () => cancelAnimationFrame(id); }, [open]);

  const nowParts = partsIn(new Date(), s.loc.zone);
  const isToday = nowParts.y === today.y && nowParts.m === today.m && nowParts.d === today.d;
  const nowMin = nowParts.h * 60 + nowParts.mi;
  const nowHour = isToday ? nowMin / 60 : 12;
  const [minute, setMinute] = useState(isToday ? nowMin : 12 * 60);
  const [ok, setOk] = useState(true);
  const [point, setPoint] = useState(false);
  useEffect(() => { if (!open) setPoint(false); }, [open]);
  useEffect(() => { if (open) setMinute(isToday ? nowMin : 12 * 60); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const hour = minute / 60;
  const alt = sunAltitude(today.y, today.m, today.d, hour, s.loc.lat, s.loc.lng, today.tz);
  const az = sunAzimuth(today.y, today.m, today.d, hour, s.loc.lat, s.loc.lng, today.tz);
  const qibla = useMemo(() => qiblaBearing(s.loc.lat, s.loc.lng), [s.loc]);
  const ticks = PRAYERS.filter((p) => Number.isFinite(today.hours[p.k]))
    .map((p) => ({ at: Math.round(today.hours[p.k] * 60), label: p.en, tone: isToday && today.hours[p.k] < nowHour ? 'done' : 'next' }));
  const when = wallToDate(today.y, today.m, today.d, hour, today.zone);
  const moon = moonPhase(when), moonAt = moonAltAz(s.loc.lat, s.loc.lng, when);
  const at = PRAYERS.find((p) => Math.abs(today.hours[p.k] * 60 - minute) <= 2);

  return (
    <Sheet open={open && shown} title="Sky Today" onClose={onClose}>
      {ok
        ? <SkyDome loc={s.loc} day={today} hour={hour} nowHour={nowHour} fmt={s.fmt} qibla={qibla} theme={s.theme + JSON.stringify(s.custom)} onReady={setOk} living moon />
        : <Notice tone="caution">3D is not available on this device. The sun arc on the main screen shows the same day.</Notice>}
      <div className="sky-readout">
        <div className="sky-time figures">{fmtFull(hour, s.fmt)}</div>
        <div className="t-caption">
          {at ? <b>{at.en} · </b> : null}
          {alt >= 0 ? `Sun ${alt.toFixed(0)}° high, ${compassName(az)} (${az.toFixed(0)}°)` : `Sun ${(-alt).toFixed(0)}° below the horizon, ${compassName(az)}`}
        </div>
        <div className="sky-moon t-caption">
          <MoonPhase lit={moon.lit} waxing={moon.waxing} south={s.loc.lat < 0} label={moon.name} />
          <span>{moon.name}, {Math.round(moon.lit * 100)}% lit · {moonAt.alt >= 0 ? `${moonAt.alt.toFixed(0)}° high, ${compassName(moonAt.az)}` : 'below the horizon'}</span>
        </div>
      </div>
      <Slider label="Time of day" min={0} max={1439} step={1} value={minute} onChange={setMinute} ticks={ticks}
        valueText={fmtFull(hour, s.fmt)} />
      <div className="sky-actions">
        {isToday && <Button variant="tinted" size="sm" icon="today" onClick={() => setMinute(nowMin)}>Now</Button>}
        <span className="t-caption">Drag the sky to look around. Pinch to zoom. The dashed line on the ground points to the Qibla ({qibla.toFixed(0)}°).</span>
      </div>
      {isToday && <Button variant="tinted" icon="target" onClick={() => setPoint(true)}>Point at the Sky</Button>}
      <PointView open={point} onClose={() => setPoint(false)} s={s} today={today} />
    </Sheet>
  );
}
