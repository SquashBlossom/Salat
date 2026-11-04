/* MOTION for canvas animations — the same vocabulary as styles/motion.css,
   for movement that CSS cannot draw (the sky, the ripples).
   Change a number here and every canvas animation follows. */
export const MOTION = {
  // RIPPLE: rings spreading from the centre in the prayer moment
  ripplePeriod: 7200,   // ms for one ring to travel out and fade
  rippleRings: 8,       // rings on screen at once
  rippleWobble: 0.025,  // how hand-drawn the rings look (0 = perfect circles)
  // TWINKLE: stars in the sky
  twinkleMin: 0.6,      // slowest twinkle speed (cycles per ~6 s)
  twinkleMax: 2.4,      // fastest
  // SHOOTING STAR: rare, only deep at night
  shootingChance: 0.0025, // per frame
  // SKY: how often the sun's position is re-read
  skyRefresh: 30000,    // ms
};

/** True when the person asked their device for less motion. */
export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
