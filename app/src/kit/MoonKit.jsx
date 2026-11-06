/* Kit: the proposed moon. The living 3D sky with the moon at its real place and phase,
   a day and time to move through the month, and the flat MoonPhase for lists and readouts.
   Loaded only when this section renders, so the kit page stays light. */
import { useMemo, useState } from 'react';
import { dayTimes, partsIn, shiftDay, wallToDate, withDefaults } from '@salat/shared/schedule';
import { moonAltAz, moonPhase } from '@salat/shared/moon';
import { qiblaBearing } from '@salat/shared/solar';
import { SkyDome } from '../features/sky/SkyDome.jsx';
import { Label, MoonPhase, Notice, Slider } from '../ui/index.jsx';
import { compassName, fmtFull } from '../core/format.js';

const DAY_NAME = (y, m, d) => new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

/** A good first look: the first evening (from today) when the moon is up an hour and a half after Maghrib. */
function firstLook(s, today) {
  for (let n = 0; n <= 15; n++) {
    const q = shiftDay(today.y, today.m, today.d, n);
    const minute = Math.round((dayTimes(s, q.y, q.m, q.d).hours.maghrib + 1.5) * 60);
    const { alt } = moonAltAz(s.loc.lat, s.loc.lng, wallToDate(q.y, q.m, q.d, minute / 60, s.loc.zone));
    if (alt > 10) return { offset: n, minute };
  }
  return { offset: 0, minute: 21 * 60 };
}

export default function MoonKit({ theme }) {
  const s = useMemo(() => withDefaults({}), []); // Brooklyn: the app's default place
  const today = useMemo(() => partsIn(new Date(), s.loc.zone), [s]);
  const first = useMemo(() => firstLook(s, today), [s, today]);
  const [offset, setOffset] = useState(first.offset);
  const p = shiftDay(today.y, today.m, today.d, offset);
  const day = useMemo(() => dayTimes(s, p.y, p.m, p.d), [s, p.y, p.m, p.d]);
  const [minute, setMinute] = useState(first.minute);
  const hour = minute / 60;
  const when = wallToDate(p.y, p.m, p.d, hour, s.loc.zone);
  const ph = moonPhase(when);
  const pos = moonAltAz(s.loc.lat, s.loc.lng, when);
  const qibla = qiblaBearing(s.loc.lat, s.loc.lng);
  const south = s.loc.lat < 0;

  // The month ahead, one moon every ~3.7 days (eight steps of the 29.5-day cycle)
  const month = Array.from({ length: 8 }, (_, i) => {
    const q = shiftDay(today.y, today.m, today.d, Math.round(i * 3.69));
    const m = moonPhase(wallToDate(q.y, q.m, q.d, 21, s.loc.zone));
    return { ...m, when: DAY_NAME(q.y, q.m, q.d) };
  });

  return (
    <div className="kit-sky">
      <Label>Day · {offset === 0 ? 'today' : DAY_NAME(p.y, p.m, p.d)}</Label>
      <Slider label="Day" min={-15} max={15} value={offset} onChange={setOffset}
        valueText={offset === 0 ? 'Today' : DAY_NAME(p.y, p.m, p.d)} ticks={[{ at: 0, label: 'Today', tone: 'next' }]} />
      <Label>Time · {fmtFull(hour, 12)}</Label>
      <Slider label="Time" min={0} max={1439} value={minute} onChange={setMinute} valueText={fmtFull(hour, 12)} />
      <div className="kit-moon-read">
        <MoonPhase lit={ph.lit} waxing={ph.waxing} south={south} size="xl" label={ph.name} />
        <div>
          <div className="kit-sky-time figures">{offset === 0 ? 'Today' : DAY_NAME(p.y, p.m, p.d)} · {fmtFull(hour, 12)}</div>
          <div className="t-caption"><b>{ph.name}</b> · {Math.round(ph.lit * 100)}% lit · {ph.age.toFixed(1)} days old</div>
          <div className="t-caption">{pos.alt >= 0
            ? `Moon ${pos.alt.toFixed(0)}° high, ${compassName(pos.az)} (${pos.az.toFixed(0)}°)`
            : `Moon below the horizon (${compassName(pos.az)})`}</div>
        </div>
      </div>
      <div className="kit-moon-dome"><SkyDome loc={s.loc} day={day} hour={hour} nowHour={offset < 0 ? 24 : offset > 0 ? 0 : hour} fmt={12} qibla={qibla} theme={theme} living moon /></div>

      <Label>The month ahead · flat moon (MoonPhase, sizes md · lg · xl)</Label>
      <div className="kit-moon-month">
        {month.map((m) => (
          <figure key={m.when}><MoonPhase lit={m.lit} waxing={m.waxing} south={south} size="lg" label={m.name} />
            <figcaption><span className="t-caption">{m.name}</span><span className="t-caption figures">{m.when}</span></figcaption></figure>
        ))}
      </div>
      <Notice tone="info">Astronomy only. Salat calculates where the moon is and how much is lit. Whether a new month has begun is decided by people who sight the crescent, or by your masjid.</Notice>
    </div>
  );
}
