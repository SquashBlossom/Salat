/* The main screen's top half: header, next-prayer hero, the day's list, and the night card.
   Owns: how today looks. Refuses: computing times (it receives `day` and `events`). */
import { PRAYERS } from '@salat/shared/methods';
import { wallToDate, partsIn } from '@salat/shared/schedule';
import { Icon } from './Icons.jsx';
import { SunArc } from './SunArc.jsx';
import { fmtTime, fmtFull, gregorian, hijri, countdownParts } from '../core/format.js';

export function Header({ s, viewDate, onPrev, onNext, onToday, onSettings, onLocation }) {
  return (
    <header>
      <div>
        <button className="locbtn" onClick={onLocation}><Icon name="pin" /><span>{s.loc.name}</span></button>
        <div className="dateline"><b>{gregorian(viewDate, s.loc.zone)}</b></div>
        <div className="dateline hijri">{hijri(viewDate, s.loc.zone)}</div>
      </div>
      <div className="hdr-actions">
        <button className="iconbtn" onClick={onPrev} aria-label="Previous day"><Icon name="left" /></button>
        <button className="iconbtn" onClick={onToday} aria-label="Back to today"><Icon name="today" /></button>
        <button className="iconbtn" onClick={onNext} aria-label="Next day"><Icon name="right" /></button>
        <button className="iconbtn" onClick={onSettings} aria-label="Settings"><Icon name="gear" /></button>
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
    <section className="card">
      <div className="hero">
        <div className="hero-top">
          <div className="next-name"><Icon name={next.k} /><span>{next.en}</span></div>
          <div className="next-at mono">{fmtFull(next.h, s.fmt)}</div>
        </div>
        <div className={'count mono' + (soon ? ' soon' : '')} aria-live="off">
          {countdownParts(ms).map(([v, u]) => <span key={u}>{v}<small>{u}</small> </span>)}
        </div>
        <div className="count-lbl">until <b>{next.en}</b></div>
        <SunArc day={today} loc={s.loc} now={now} fmt={s.fmt} />
      </div>
      <div className="progwrap">
        <div className="progbar"><div className="progfill" style={{ width: pct.toFixed(2) + '%' }} /></div>
        <div className="progmeta"><span>{cur.en} {fmtFull(cur.h, s.fmt)}</span><span>{next.en} {fmtFull(next.h, s.fmt)}</span></div>
      </div>
    </section>
  );
}

export function HighLatFlag({ s, today }) {
  if (!today.hours.__polar && !today.hours.__adjusted) return null;
  const rule = { angle: 'angle based', seventh: 'one seventh of the night', middle: 'middle of the night' }[s.hiLat];
  return (
    <div className="flag" role="note">
      <Icon name="alert" />
      <span>{today.hours.__polar
        ? 'The sun does not rise or set here today, so sunrise and sunset cannot be computed. Follow the timetable of the nearest city where it does, as your scholars advise.'
        : `At this latitude the sun stays too high for Fajr or Isha to occur by calculation today. Those two are estimated using the ${rule} rule.`}</span>
    </div>
  );
}

export function Ledger({ s, today, cur, next, now }) {
  const key = today.y + '-' + today.m + '-' + today.d;
  return (
    <section className="card">
      <div className="ledger">
        {PRAYERS.map((p) => {
          const h = today.hours[p.k];
          let cls = 'row', tag = null;
          if (Number.isFinite(h)) {
            const d = wallToDate(today.y, today.m, today.d, h, today.zone);
            const isNow = cur && cur.k === p.k && cur.dayKey === key;
            const isNext = next && next.k === p.k && next.dayKey === key;
            if (isNow) { cls += ' now'; tag = <span className="tag now">now</span>; }
            else if (isNext) { cls += ' next'; tag = <span className="tag next">next</span>; }
            else if (d < now) cls += ' done';
          }
          const f = fmtTime(h, s.fmt);
          return (
            <div className={cls} key={p.k}>
              <Icon name={p.k} />
              <div className="row-name"><div className="en">{p.en}{tag}</div><div className="sub">{p.sub}</div></div>
              <div className="row-ar ar" lang="ar">{p.ar}</div>
              <div className="row-time">{f.t}{f.ap && <span className="ap">{f.ap}</span>}</div>
            </div>
          );
        })}
      </div>
    </section>
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
    <div className="card pad">
      <div className="eyebrow">Night &amp; sunnah</div>
      <div className="nightlist">
        {rows ? rows.map(([a, b]) => <div key={a}><span>{a}</span><b>{b}</b></div>)
          : <div><span>Not available at this latitude today</span></div>}
      </div>
    </div>
  );
}
