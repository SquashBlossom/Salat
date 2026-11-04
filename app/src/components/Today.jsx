/* The main screen's top half: header, next-prayer hero, the day's list, and the night card.
   Owns: how today looks. Refuses: computing times (it receives `day` and `events`). */
import { PRAYERS } from '@salat/shared/methods';
import { wallToDate, partsIn } from '@salat/shared/schedule';
import { Card, Icon, IconButton, Notice, Tag } from '../ui/index.jsx';
import { SunArc } from './SunArc.jsx';
import { fmtTime, fmtFull, gregorian, hijri, countdownParts } from '../core/format.js';

export function Header({ s, viewDate, onPrev, onNext, onToday, onSettings, onLocation }) {
  return (
    <header className="app-header">
      <div>
        <button className="place" onClick={onLocation}><Icon name="pin" size="sm" /><span>{s.loc.name}</span></button>
        <div className="dateline"><b>{gregorian(viewDate, s.loc.zone)}</b></div>
        <div className="dateline hijri">{hijri(viewDate, s.loc.zone)}</div>
      </div>
      <div className="header-actions">
        <IconButton icon="left" label="Previous day" onClick={onPrev} />
        <IconButton icon="today" label="Back to today" onClick={onToday} />
        <IconButton icon="right" label="Next day" onClick={onNext} />
        <IconButton icon="gear" label="Settings" onClick={onSettings} />
      </div>
    </header>
  );
}

export function Hero({ s, today, cur, next, now }) {
  if (!next) return null;
  const ms = next.date - now;
  const span = next.date - cur.date;
  const pct = Math.max(0, Math.min(100, ((now - cur.date) / span) * 100));
  const soon = ms < 10 * 60000;
  return (
    <Card>
      <div className="hero">
        <div className="hero-top">
          <h2 className="next-name t-title-2"><Icon name={next.k} size="lg" /><span>{next.en}</span></h2>
          <div className="next-at figures">{fmtFull(next.h, s.fmt)}</div>
        </div>
        <div className={'countdown' + (soon ? ' soon m-glow' : '')} aria-live="off">
          {countdownParts(ms).map(([v, u]) => <span key={u}>{v}<small>{u}</small> </span>)}
        </div>
        <div className="countdown-label">until <b>{next.en}</b></div>
        <SunArc day={today} loc={s.loc} now={now} fmt={s.fmt} />
      </div>
      <div className="progress">
        <div className="progress-bar"><div className="progress-fill" style={{ width: pct.toFixed(2) + '%' }} /></div>
        <div className="progress-meta"><span>{cur.en} {fmtFull(cur.h, s.fmt)}</span><span>{next.en} {fmtFull(next.h, s.fmt)}</span></div>
      </div>
    </Card>
  );
}

export function HighLatFlag({ s, today }) {
  if (!today.hours.__polar && !today.hours.__adjusted) return null;
  const rule = { angle: 'angle based', seventh: 'one seventh of the night', middle: 'middle of the night' }[s.hiLat];
  return (
    <Notice tone="caution">
      {today.hours.__polar
        ? 'The sun does not rise or set here today, so sunrise and sunset cannot be computed. Follow the timetable of the nearest city where it does, as your scholars advise.'
        : `At this latitude the sun stays too high for Fajr or Isha to occur by calculation today. Those two are estimated using the ${rule} rule.`}
    </Notice>
  );
}

export function Ledger({ s, today, cur, next, now }) {
  const key = today.y + '-' + today.m + '-' + today.d;
  return (
    <Card aria-label="Today's prayers">
      <div className="prayers">
        {PRAYERS.map((p) => {
          const h = today.hours[p.k];
          let cls = 'prayer', tag = null;
          if (Number.isFinite(h)) {
            const d = wallToDate(today.y, today.m, today.d, h, today.zone);
            const isNow = cur && cur.k === p.k && cur.dayKey === key;
            const isNext = next && next.k === p.k && next.dayKey === key;
            if (isNow) { cls += ' now'; tag = <Tag tone="now">now</Tag>; }
            else if (isNext) { cls += ' next'; tag = <Tag tone="next">next</Tag>; }
            else if (d < now) cls += ' done';
          }
          const f = fmtTime(h, s.fmt);
          return (
            <div className={cls} key={p.k}>
              <Icon name={p.k} />
              <div className="prayer-name"><div className="en">{p.en}{tag}</div><div className="sub">{p.sub}</div></div>
              <div className="prayer-ar ar" lang="ar">{p.ar}</div>
              <div className="prayer-time">{f.t}{f.ap && <span className="ap">{f.ap}</span>}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function NightCard({ s, today, tomorrow }) {
  let rows;
  if (Number.isFinite(today.hours.maghrib) && Number.isFinite(tomorrow.hours.fajr)) {
    const sunset = wallToDate(today.y, today.m, today.d, today.hours.maghrib, today.zone);
    const fajr = wallToDate(tomorrow.y, tomorrow.m, tomorrow.d, tomorrow.hours.fajr, today.zone);
    const night = fajr - sunset;
    const asHour = (dt) => { const p = partsIn(dt, today.zone); return p.h + p.mi / 60; };
    rows = [
      ['Duha begins', fmtFull(today.hours.sunrise + 20 / 60, s.fmt)],
      ['Imsak', fmtFull(today.hours.fajr - 10 / 60, s.fmt)],
      ['Half of night', fmtFull(asHour(new Date(sunset.getTime() + night / 2)), s.fmt)],
      ['Last third', fmtFull(asHour(new Date(sunset.getTime() + (night * 2) / 3)), s.fmt)],
      ['Night length', Math.floor(night / 3600000) + 'h ' + Math.round((night % 3600000) / 60000) + 'm'],
    ];
  }
  return (
    <Card padded as="div">
      <div className="t-label">Night &amp; sunnah</div>
      <div className="night-list">
        {rows ? rows.map(([a, b]) => <div key={a}><span>{a}</span><b>{b}</b></div>)
          : <div><span>Not available at this latitude today</span></div>}
      </div>
    </Card>
  );
}
