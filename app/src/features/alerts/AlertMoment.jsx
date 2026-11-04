/* The moment a prayer arrives while Salat is open: the screen fills with
   slow rings rising from the centre, the prayer's name in Arabic and English.
   Owns: the overlay and its ripple animation. Refuses: deciding when to show. */
import { useEffect, useRef } from 'react';
import { Button } from '../../ui/index.jsx';
import { MOTION, reducedMotion } from '../../ui/motion.js';

function Ripples() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    const g = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const reduce = reducedMotion();
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--now').trim();
    let raf = 0;
    const size = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size();
    const draw = (t) => {
      const w = cv.clientWidth, h = cv.clientHeight, cx = w / 2, cy = h * 0.42;
      const maxR = Math.hypot(w, h) * 0.6;
      g.clearRect(0, 0, w, h);
      g.strokeStyle = accent;
      // eight rings, each born every 0.9 s, growing and fading on an ease-out curve
      for (let i = 0; i < MOTION.rippleRings; i++) {
        const p = (((t || 0) / MOTION.ripplePeriod + i / MOTION.rippleRings) % 1);
        const e = 1 - Math.pow(1 - p, 3);
        g.globalAlpha = (1 - p) * 0.35;
        g.lineWidth = 1 + (1 - p) * 1.5;
        g.beginPath();
        // a gentle eight-fold wobble, like a rosette, so the rings feel hand-drawn
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 90) {
          const r = e * maxR * (1 + MOTION.rippleWobble * Math.sin(a * 8 + p * 6));
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
    <div className="moment m-fade" role="alertdialog" aria-modal="true" aria-label={alert.title}>
      <Ripples />
      <div className="moment-inner">
        <div className="moment-ar ar m-rise" lang="ar">{alert.ar}</div>
        <h2 className="t-title-1 m-rise-2">{alert.title}</h2>
        <p className="m-rise-3">{alert.body}</p>
        <Button variant="primary" onClick={onClose} autoFocus>Alhamdulillah</Button>
      </div>
    </div>
  );
}
