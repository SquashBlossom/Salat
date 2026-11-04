/* A living sky behind the app, driven by the real sun at her location.
   Owns: the canvas animation. Refuses: layout and text.

   - Sun high:   a warm glow where the sun sits, no stars.
   - Twilight:   the glow sinks and reddens, the first stars fade in.
   - Night:      a slow field of twinkling stars, a few shooting stars.
   Everything is procedural (no images). It pauses when the page is hidden
   and draws one still frame when the person asks for reduced motion. */
import { useEffect, useRef } from 'react';
import { sunAltitude } from '@salat/shared/solar';
import { partsIn } from '@salat/shared/schedule';
import { tzOffset } from '@salat/shared/solar';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#5FE3C8';

function hexToRgb(h) {
  const m = h.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  return m ? m.slice(1).map((x) => parseInt(x, 16)) : [95, 227, 200];
}

/** A tiny seeded random, so the star field is the same every visit. */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function SkyBackdrop({ loc }) {
  const ref = useRef(null);
  const locRef = useRef(loc);
  locRef.current = loc;

  useEffect(() => {
    const cv = ref.current;
    const g = cv.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, dpr = 1, raf = 0, stars = [], meteors = [], sun = { alt: 30, frac: 0.5 }, lastSun = 0;

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const r = rng(7);
      const n = Math.round((w * h) / 2600);
      stars = Array.from({ length: n }, () => ({
        x: r() * w, y: r() * h * 0.85, s: 0.4 + r() * r() * 1.6, ph: r() * Math.PI * 2, sp: 0.6 + r() * 1.8,
      }));
    };

    const readSun = () => {
      const { lat, lng, zone } = locRef.current;
      const now = new Date();
      const p = partsIn(now, zone);
      const tz = tzOffset(now, zone);
      const hour = p.h + p.mi / 60;
      sun = { alt: sunAltitude(p.y, p.m, p.d, hour, lat, lng, tz), frac: hour / 24 };
    };

    const frame = (t) => {
      if (t - lastSun > 30000 || !lastSun) { readSun(); lastSun = t || 1; }
      g.clearRect(0, 0, w, h);
      const night = clamp((-sun.alt + 2) / 14, 0, 1); // 0 in daylight, 1 once the sun is 12° down
      const [wr, wg, wb] = hexToRgb(css('--warn'));
      const [ar, ag, ab] = hexToRgb(css('--accent'));

      // the sun's glow: x follows the time of day, y follows altitude
      const sx = w * (0.15 + 0.7 * clamp((sun.frac - 0.2) / 0.6, 0, 1));
      const sy = h * (0.42 - clamp(sun.alt, -18, 60) / 140);
      const rad = Math.max(w, h) * (0.55 - night * 0.2);
      const glow = g.createRadialGradient(sx, sy, 0, sx, sy, rad);
      const warmth = 0.13 * (1 - night * 0.7);
      glow.addColorStop(0, `rgba(${wr},${wg},${wb},${warmth})`);
      glow.addColorStop(0.5, `rgba(${wr},${wg},${wb},${warmth * 0.25})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = glow;
      g.fillRect(0, 0, w, h);

      // stars
      if (night > 0.02) {
        const time = (t || 0) / 1000;
        for (const st of stars) {
          const tw = reduce ? 0.8 : 0.55 + 0.45 * Math.sin(st.ph + time * st.sp);
          g.globalAlpha = night * tw * clamp(1 - st.y / (h * 0.95), 0.15, 1);
          g.fillStyle = '#fff';
          g.beginPath();
          g.arc(st.x, st.y, st.s, 0, Math.PI * 2);
          g.fill();
        }
        // now and then, a shooting star
        if (!reduce && night > 0.6 && Math.random() < 0.0025 && meteors.length < 2) {
          meteors.push({ x: Math.random() * w, y: Math.random() * h * 0.4, vx: 5 + Math.random() * 4, vy: 2 + Math.random() * 2, life: 1 });
        }
        for (const m of meteors) {
          g.globalAlpha = m.life * night;
          const grad = g.createLinearGradient(m.x, m.y, m.x - m.vx * 10, m.y - m.vy * 10);
          grad.addColorStop(0, `rgba(${ar},${ag},${ab},1)`);
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          g.strokeStyle = grad;
          g.lineWidth = 1.4;
          g.beginPath();
          g.moveTo(m.x, m.y);
          g.lineTo(m.x - m.vx * 10, m.y - m.vy * 10);
          g.stroke();
          m.x += m.vx; m.y += m.vy; m.life -= 0.02;
        }
        meteors = meteors.filter((m) => m.life > 0);
        g.globalAlpha = 1;
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    };

    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };
    resize();
    readSun();
    raf = requestAnimationFrame(frame);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={ref} className="sky" aria-hidden="true" />;
}
