/* The sun's path today, with each prayer marked where the sun stands.
   Owns: the arc drawing. Refuses: computing prayer times (it receives them). */
import { useMemo } from 'react';
import { sunAltitude } from '@salat/shared/solar';
import { PRAYERS } from '@salat/shared/methods';
import { partsIn, wallToDate } from '@salat/shared/schedule';
import { fmtTime } from '../core/format.js';

const W = 360, padL = 16, padR = 16, top = 14, base = 108, minAlt = -22;

export function SunArc({ day, loc, now, fmt }) {
  const shape = useMemo(() => {
    const lo = Number.isFinite(day.hours.fajr) ? day.hours.fajr : day.hours.sunrise;
    const hiT = Number.isFinite(day.hours.isha) ? day.hours.isha : day.hours.maghrib;
    if (!Number.isFinite(lo) || !Number.isFinite(hiT)) return null;
    const t0 = Math.max(0, lo - 0.9), t1 = Math.min(24, hiT + 0.9);
    const alt = (t) => sunAltitude(day.y, day.m, day.d, t, loc.lat, loc.lng, day.tz);
    let maxAlt = -90;
    const pts = [];
    for (let i = 0; i <= 140; i++) {
      const t = t0 + ((t1 - t0) * i) / 140;
      const a = alt(t);
      maxAlt = Math.max(maxAlt, a);
      pts.push([t, a]);
    }
    const hi = Math.max(maxAlt + 4, 12);
    const X = (t) => padL + ((t - t0) / (t1 - t0)) * (W - padL - padR);
    const Y = (a) => base - ((a - minAlt) / (hi - minAlt)) * (base - top);
    const path = pts.map(([t, a], i) => (i ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Y(Math.max(a, minAlt)).toFixed(1)).join('');
    let lastX = -99, rowB = false;
    const marks = PRAYERS.filter((p) => Number.isFinite(day.hours[p.k]) && day.hours[p.k] >= t0 && day.hours[p.k] <= t1).map((p) => {
      const t = day.hours[p.k];
      const x = X(t), y = Y(Math.max(alt(t), minAlt));
      rowB = x - lastX < 44 ? !rowB : false;
      lastX = x;
      return { p, t, x, y, ly: rowB ? base + 34 : base + 14, lx: Math.max(20, Math.min(W - 20, x)) };
    });
    return { t0, t1, X, Y, alt, path, marks, y0: Y(0) };
  }, [day, loc]);

  if (!shape) return <svg className="arc" viewBox="0 0 360 162" aria-hidden="true" />;
  const { t0, t1, X, Y, alt, path, marks, y0 } = shape;

  const np = partsIn(now, day.zone);
  const isToday = np.y === day.y && np.m === day.m && np.d === day.d;
  const tn = np.h + np.mi / 60;
  const sun = isToday && tn >= t0 && tn <= t1 ? { x: X(tn), y: Y(Math.max(alt(tn), minAlt)) } : null;

  return (
    <svg className="arc" viewBox="0 0 360 162" preserveAspectRatio="xMidYMid meet"
      role="img" aria-label="Sun altitude through the day with prayer times marked">
      <defs>
        <linearGradient id="dayfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--next)', stopOpacity: 0.22 }} />
          <stop offset="100%" style={{ stopColor: 'var(--next)', stopOpacity: 0 }} />
        </linearGradient>
        <linearGradient id="arcline" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" style={{ stopColor: 'var(--now)' }} />
          <stop offset="50%" style={{ stopColor: 'var(--next)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--now)' }} />
        </linearGradient>
        <clipPath id="above"><rect x="0" y="0" width={W} height={y0.toFixed(1)} /></clipPath>
      </defs>
      <path d={`${path}L${X(t1).toFixed(1)} ${y0.toFixed(1)}L${X(t0).toFixed(1)} ${y0.toFixed(1)}Z`} fill="url(#dayfill)" clipPath="url(#above)" />
      <line x1={padL} y1={y0} x2={W - padR} y2={y0} style={{ stroke: 'var(--done)' }} strokeWidth="1" strokeOpacity=".55" strokeDasharray="3 4" />
      <text x={padL} y={y0 - 5} style={{ fill: 'var(--done)', fontFamily: 'var(--font-figures)' }} fontSize="7" letterSpacing="1.4" opacity=".75">HORIZON</text>
      <path className="m-draw" d={path} fill="none" stroke="url(#arcline)" strokeWidth="1.6" strokeLinecap="round" opacity=".9" />
      {marks.map(({ p, t, x, y, ly, lx }) => {
        const past = wallToDate(day.y, day.m, day.d, t, day.zone) < now;
        const c = past ? 'var(--done)' : 'var(--next)';
        return (
          <g key={p.k}>
            <line x1={x} y1={y} x2={x} y2={ly - 9} style={{ stroke: c }} strokeWidth=".7" strokeOpacity=".28" />
            <circle cx={x} cy={y} r="3" style={{ fill: 'var(--surface-sunk)', stroke: c }} strokeWidth="1.4" />
            <text x={lx} y={ly} textAnchor="middle" style={{ fill: c, fontFamily: 'var(--font-ui)' }} fillOpacity=".9" fontSize="7.5" letterSpacing="1">{p.en.toUpperCase()}</text>
            <text x={lx} y={ly + 10} textAnchor="middle" style={{ fill: 'var(--text-3)', fontFamily: 'var(--font-figures)' }} fontSize="7.5">{fmtTime(t, fmt).t}</text>
          </g>
        );
      })}
      {sun && (
        <g className="sun-now">
          <line x1={sun.x} y1={top} x2={sun.x} y2={base - 2} style={{ stroke: 'var(--now)' }} strokeWidth=".8" strokeOpacity=".45" />
          <circle className="m-breathe" cx={sun.x} cy={sun.y} r="7.5" style={{ fill: 'var(--now)' }} opacity=".16" />
          <circle cx={sun.x} cy={sun.y} r="3.6" style={{ fill: 'var(--now)' }} />
        </g>
      )}
    </svg>
  );
}
