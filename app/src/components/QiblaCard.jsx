/* Qibla: the true bearing to the Kaaba, a dial, and a live compass.
   Owns: the dial and the compass permission. Refuses: the bearing math (shared/solar). */
import { useState } from 'react';
import { D, qiblaBearing } from '@salat/shared/solar';
import { compassName } from '../core/format.js';
import { Button, Card } from '../ui/index.jsx';

function Dial({ bearing, heading }) {
  const c = 60, r = 44;
  const rot = heading == null ? 0 : -heading;
  const ang = (bearing + rot - 90) * D;
  const kx = c + (r - 6) * Math.cos(ang), ky = c + (r - 6) * Math.sin(ang);
  const ticks = Array.from({ length: 24 }, (_, i) => {
    const a = (i * 15 - 90) * D, r1 = i % 6 === 0 ? r - 8 : r - 4;
    return <line key={i} x1={c + r1 * Math.cos(a)} y1={c + r1 * Math.sin(a)} x2={c + r * Math.cos(a)} y2={c + r * Math.sin(a)}
      style={{ stroke: i % 6 === 0 ? 'var(--label)' : 'var(--line)' }} strokeWidth="1" />;
  });
  return (
    <svg className="dial" viewBox="0 0 120 120" role="img" aria-label={`Qibla direction dial, ${bearing.toFixed(0)} degrees`}>
      <g transform={`rotate(${rot} 60 60)`}>
        <circle cx="60" cy="60" r={r} fill="none" style={{ stroke: 'var(--line)' }} strokeWidth="1" />
        {ticks}
        <text x="60" y="14" textAnchor="middle" fontSize="9" style={{ fill: 'var(--text-3)', fontFamily: 'var(--font-ui)' }}>N</text>
      </g>
      <line x1="60" y1="60" x2={kx} y2={ky} style={{ stroke: 'var(--now)' }} strokeWidth="2.4" strokeLinecap="round" />
      <rect x={kx - 4.5} y={ky - 4.5} width="9" height="9" rx="1.5" style={{ fill: 'var(--next)' }} transform={`rotate(${bearing + rot} ${kx} ${ky})`} />
      <circle cx="60" cy="60" r="3" style={{ fill: 'var(--surface-sunk)', stroke: 'var(--now)' }} strokeWidth="1.6" />
    </svg>
  );
}

export function QiblaCard({ loc, toast }) {
  const [heading, setHeading] = useState(null);
  const qb = qiblaBearing(loc.lat, loc.lng);

  async function startCompass() {
    const start = () => {
      window.addEventListener('deviceorientation', (e) => {
        const h = e.webkitCompassHeading != null ? e.webkitCompassHeading : e.alpha != null ? 360 - e.alpha : null;
        if (h != null) setHeading(h);
      }, true);
      toast('Compass on. Hold the phone flat.');
    };
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
        const r = await DeviceOrientationEvent.requestPermission();
        if (r === 'granted') start(); else toast('Compass permission denied');
      } else start();
    } catch { toast('Compass not available on this device'); }
  }

  return (
    <Card padded as="div">
      <div className="t-label">Qibla from here</div>
      <div className="t-figure qibla-figure">{qb.toFixed(1)}°</div>
      <div className="t-caption">{heading == null ? compassName(qb) + ' · true north' : 'hold flat · point to the marker'}</div>
      <Dial bearing={qb} heading={heading} />
      <Button size="sm" icon="compass" onClick={startCompass}>Live Compass</Button>
    </Card>
  );
}
