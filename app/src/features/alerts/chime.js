/* A soft, procedurally made bell, so alerts need no audio file.
   Owns: sound. Refuses: deciding when to play.
   Each note is a few sine partials at bell-like ratios with a slow decay.
   Later: a licensed adhan recording can replace this (list it in LICENSES.md). */

let ctx = null;

/** Call once from a tap: browsers only allow sound after a person touches the page. */
export function unlockAudio() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { ctx = null; }
}

function bell(t0, freq, gain) {
  const partials = [[1, 1], [2.76, 0.42], [5.4, 0.18], [8.93, 0.07]];
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, t0);
  out.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  out.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.2);
  out.connect(ctx.destination);
  for (const [ratio, amp] of partials) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq * ratio;
    g.gain.value = amp;
    o.connect(g).connect(out);
    o.start(t0);
    o.stop(t0 + 3.3);
  }
}

/** Three rising notes (a gentle "it's time"). Returns false if sound is not available. */
export function playChime() {
  if (!ctx) unlockAudio();
  if (!ctx) return false;
  const t = ctx.currentTime + 0.05;
  bell(t, 440, 0.22);        // A4
  bell(t + 0.42, 554.37, 0.2); // C#5
  bell(t + 0.84, 659.25, 0.24); // E5
  return true;
}
