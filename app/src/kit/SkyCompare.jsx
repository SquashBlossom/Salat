/* Kit: compare the 3D sky as it is now ("Classic") with the proposed "Living" sky.
   Loaded only when this section renders, so the kit page stays light. */
import { useMemo, useState } from 'react';
import { dayTimes, partsIn, withDefaults } from '@salat/shared/schedule';
import { qiblaBearing } from '@salat/shared/solar';
import { SkyDome } from '../features/sky/SkyDome.jsx';
import { Label, Segmented, Slider } from '../ui/index.jsx';
import { fmtFull } from '../core/format.js';

export default function SkyCompare({ theme }) {
  const s = useMemo(() => withDefaults({}), []); // Brooklyn, ISNA: the app's defaults
  const today = useMemo(() => { const p = partsIn(new Date(), s.loc.zone); return dayTimes(s, p.y, p.m, p.d); }, [s]);
  const presets = [
    ['fajr', 'Fajr', today.hours.fajr + 0.05],
    ['sunrise', 'Sunrise', today.hours.sunrise],
    ['noon', 'Noon', today.hours.dhuhr],
    ['maghrib', 'Maghrib', today.hours.maghrib + 0.1],
    ['night', 'Night', today.hours.isha + 2],
  ];
  const [minute, setMinute] = useState(Math.round(presets[0][2] * 60));
  const active = presets.find(([, , h]) => Math.abs(h * 60 - minute) < 2)?.[0];
  const hour = minute / 60;
  const qibla = qiblaBearing(s.loc.lat, s.loc.lng);
  const common = { loc: s.loc, day: today, hour, nowHour: hour, fmt: 12, qibla, theme };

  return (
    <div className="kit-sky">
      <Segmented label="Time of day" value={active} options={presets.map(([k, l]) => [k, l])}
        onChange={(k) => setMinute(Math.round(presets.find(([p]) => p === k)[2] * 60))} />
      <Slider label="Time" min={0} max={1439} value={minute} onChange={setMinute} valueText={fmtFull(hour, 12)}
        ticks={presets.map(([k, l, h]) => ({ at: Math.round(h * 60), label: l, tone: 'next' }))} />
      <div className="kit-sky-time figures">{fmtFull(hour, 12)} · Brooklyn, today</div>
      <div className="kit-sky-pair">
        <figure><Label>Before · classic</Label><SkyDome {...common} /></figure>
        <figure><Label>After · living sky</Label><SkyDome {...common} living /></figure>
      </div>
    </div>
  );
}
