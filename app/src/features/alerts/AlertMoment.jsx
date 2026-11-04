/* The moment a prayer arrives while Salat is open: the screen fills with
   slow rings rising from the centre, the prayer's name in Arabic and English.
   Owns: the overlay and its ripple animation. Refuses: deciding when to show. */
import { useEffect, useRef } from 'react';

function Ripples() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    const g = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#5FE3C8';
    let raf = 0;
    const size = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size();
    const draw = (t) => {
      const w = cv.clientWidth, h = cv.clientHeight, cx = w / 2, cy = h * 0.42;
      const maxR = Math.hypot(w, h) * 0.6;
      g.clearRect(0, 0, w, h);
      g.strokeStyle = accent;
      // eight rings, each born every 0.9 s, growing and fading on an ease-out curve
      for (let i = 0; i < 8; i++) {
        const p = (((t || 0) / 7200 + i / 8) % 1);
        const e = 1 - Math.pow(1 - p, 3);
        g.globalAlpha = (1 - p) * 0.35;
        g.lineWidth = 1 + (1 - p) * 1.5;
        g.beginPath();
        // a gentle eight-fold wobble, like a rosette, so the rings feel hand-drawn
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 90) {
          const r = e * maxR * (1 + 0.025 * Math.sin(a * 8 + p * 6));
          const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
          if (a === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.stroke();
      }
      g.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    window.addEventListener('resize', size);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); };
  }, []);
  return <canvas ref={ref} aria-hidden="true" />;
}

export function AlertMoment({ alert, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 90000); // close itself after 90 s
    const key = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    navigator.vibrate?.([120, 80, 120]);
    return () => { clearTimeout(t); window.removeEventListener('keydown', key); };
  }, [onClose]);

  return (
    <div className="moment" role="alertdialog" aria-modal="true" aria-label={alert.title}>
      <Ripples />
      <div className="inner">
        <div className="ar" lang="ar">{alert.ar}</div>
        <h2>{alert.title}</h2>
        <p>{alert.body}</p>
        <button className="btn primary" onClick={onClose} autoFocus>Alhamdulillah</button>
      </div>
    </div>
  );
}
