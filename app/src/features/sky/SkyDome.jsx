/* SKY DOME — today's sky over her city, in 3D (Three.js).
   Owns: the 3D scene: dome, horizon with N/E/S/W, the sun's path, each prayer where the
   sun stands, the sun at the chosen moment, and the Qibla direction on the ground.
   Refuses: prayer math (shared/), the time slider and words (SkySheet).

   Colours come from the theme tokens, so every theme works. The scene is built once
   per day/place/theme; moving the slider only moves the sun. Drawing pauses while the
   page is hidden, and everything is freed when the sheet closes. */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { sunAltitude, sunAzimuth } from '@salat/shared/solar';
import { PRAYERS } from '@salat/shared/methods';
import { fmtTime } from '../../core/format.js';
import { reducedMotion } from '../../ui/motion.js';

const R = 10; // dome radius in scene units

/** Altitude/azimuth (degrees) to a point on the dome. North is -z, east is +x, up is +y. */
export function domePoint(alt, az, r = R) {
  const a = THREE.MathUtils.degToRad(alt), z = THREE.MathUtils.degToRad(az);
  return new THREE.Vector3(r * Math.cos(a) * Math.sin(z), r * Math.sin(a), -r * Math.cos(a) * Math.cos(z));
}

const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const color = (n) => new THREE.Color(css(n) || 'gray');

/** A text label pinned to a 3D point. The inner span is nudged on screen (CSS) so pairs never overlap. */
function label(text, cls) {
  const el = document.createElement('div');
  el.className = 'sky-label ' + (cls || '');
  const span = document.createElement('span');
  span.textContent = text;
  el.appendChild(span);
  return new CSS2DObject(el);
}

function ring(radius, y, col, opacity) {
  const pts = [];
  for (let i = 0; i <= 128; i++) { const t = (i / 128) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(t) * radius, y, Math.sin(t) * radius)); }
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: col, transparent: true, opacity }));
}

/** Split the day's path into runs above and below the horizon, so each can be drawn its own way. */
function pathRuns(day, loc) {
  const runs = [];
  let cur = null;
  for (let m = 0; m <= 24 * 60; m += 4) {
    const h = m / 60;
    const alt = sunAltitude(day.y, day.m, day.d, h, loc.lat, loc.lng, day.tz);
    const az = sunAzimuth(day.y, day.m, day.d, h, loc.lat, loc.lng, day.tz);
    const up = alt >= 0;
    if (!cur || cur.up !== up) { cur = { up, pts: cur ? [cur.pts.at(-1)] : [] }; runs.push(cur); }
    cur.pts.push(domePoint(alt, az));
  }
  return runs;
}

export function SkyDome({ loc, day, hour, nowHour, fmt, qibla, theme, onReady }) {
  const host = useRef(null);
  const api = useRef(null);

  // Build the scene for this place, day and theme.
  useEffect(() => {
    const el = host.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      onReady?.(false);
      return undefined;
    }
    const w = el.clientWidth, h = el.clientHeight;
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(w, h);
    el.appendChild(renderer.domElement);
    const labels = new CSS2DRenderer();
    labels.setSize(w, h);
    labels.domElement.className = 'sky-labels';
    el.appendChild(labels.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 200);
    camera.position.copy(domePoint(34, 192, 31)); // from the south, looking down into the sky a little
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.5, 0);
    controls.enablePan = false;
    controls.enableDamping = !reducedMotion();
    controls.minDistance = 16; controls.maxDistance = 42;
    controls.minPolarAngle = 0.12; controls.maxPolarAngle = Math.PI / 2 - 0.03; // never under the ground
    controls.update();

    const cNow = color('--now'), cNext = color('--next'), cDone = color('--done');
    const cLine = color('--line-strong'), cText3 = color('--text-3'), cGround = color('--surface-sunk'), cGlow = color('--glow-1');

    // Ground and dome
    const ground = new THREE.Mesh(new THREE.CircleGeometry(R * 1.04, 96), new THREE.MeshBasicMaterial({ color: cGround, transparent: true, opacity: 0.92 }));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: cGlow, transparent: true, opacity: 0.10, side: THREE.BackSide, depthWrite: false }));
    scene.add(dome);
    scene.add(ring(R, 0.01, cLine, 0.9));                                   // horizon
    for (const alt of [30, 60]) scene.add(ring(R * Math.cos(alt * Math.PI / 180), R * Math.sin(alt * Math.PI / 180), cLine, 0.35));
    for (const [txt, az] of [['N', 0], ['E', 90], ['S', 180], ['W', 270]]) {
      const l = label(txt, 'compass'); l.position.copy(domePoint(0, az, R * 1.1)); scene.add(l);
    }
    const you = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), new THREE.MeshBasicMaterial({ color: cText3 }));
    you.rotation.x = -Math.PI / 2; you.position.y = 0.02; scene.add(you);

    // Qibla on the ground
    const q = domePoint(0, qibla, R * 0.92); q.y = 0.03;
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.03, 0), q]),
      new THREE.LineDashedMaterial({ color: cNow, dashSize: 0.5, gapSize: 0.3 })).computeLineDistances());
    const ql = label('Qibla', 'qibla over'); ql.position.copy(domePoint(0, qibla, R * 0.98)); scene.add(ql);

    // The sun's path: bright above the horizon, faint and dashed below
    for (const run of pathRuns(day, loc)) {
      if (run.pts.length < 2) continue;
      const geo = new THREE.BufferGeometry().setFromPoints(run.pts);
      const line = run.up
        ? new THREE.Line(geo, new THREE.LineBasicMaterial({ color: cNext }))
        : new THREE.Line(geo, new THREE.LineDashedMaterial({ color: cNext, dashSize: 0.35, gapSize: 0.35, transparent: true, opacity: 0.35 }));
      if (!run.up) line.computeLineDistances();
      scene.add(line);
    }

    // Each prayer where the sun stands at that moment
    const prayerLabels = [];
    for (const p of PRAYERS) {
      const ph = day.hours[p.k];
      if (!Number.isFinite(ph)) continue;
      const past = ph < nowHour;
      const pos = domePoint(sunAltitude(day.y, day.m, day.d, ph, loc.lat, loc.lng, day.tz), sunAzimuth(day.y, day.m, day.d, ph, loc.lat, loc.lng, day.tz));
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshBasicMaterial({ color: past ? cDone : cNext }));
      dot.position.copy(pos); scene.add(dot);
      // Prayers below the horizon (Fajr, Isha) label under their dot, the rest above, so pairs never overlap.
      const below = pos.y < -0.1;
      const l = label(`${p.en} ${fmtTime(ph, fmt).t}`, (past ? 'done' : 'next') + (below ? ' under' : ' over'));
      l.position.copy(pos); scene.add(l);
      prayerLabels.push(l.element);
    }
    prayerLabels.push(ql.element); // the Qibla label takes part in untangling too

    /** After each frame: if two prayer labels overlap on screen, slide the lower one down until they don't. */
    const untangle = () => {
      for (const el of prayerLabels) el.style.setProperty('--nudge', '0px');
      const boxes = prayerLabels.map((el) => ({ el, r: el.firstChild.getBoundingClientRect() }))
        .filter((b) => b.r.width).sort((a, b) => a.r.top - b.r.top);
      const placed = [];
      for (const b of boxes) {
        let top = b.r.top, bottom = b.r.bottom, moved = 0;
        for (let guard = 0; guard < 6; guard++) {
          const hit = placed.find((p) => b.r.left < p.right && b.r.right > p.left && top < p.bottom && bottom > p.top);
          if (!hit) break;
          const step = hit.bottom - top + 2;
          top += step; bottom += step; moved += step;
        }
        if (moved) b.el.style.setProperty('--nudge', moved + 'px');
        placed.push({ left: b.r.left, right: b.r.right, top, bottom });
      }
    };

    // The sun, with a soft glow
    const sun = new THREE.Group();
    sun.add(new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), new THREE.MeshBasicMaterial({ color: cNow })));
    const glowTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const g = c.getContext('2d'), grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      const [r, gg, b] = color('--star').toArray().map((v) => Math.round(v * 255)); // white, from the tokens
      grad.addColorStop(0, `rgba(${r},${gg},${b},0.9)`); grad.addColorStop(0.25, `rgba(${r},${gg},${b},0.35)`); grad.addColorStop(1, 'transparent');
      g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    })();
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: cNow, transparent: true, depthWrite: false }));
    glow.scale.set(3.2, 3.2, 1); sun.add(glow);
    scene.add(sun);
    const shadowLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
      new THREE.LineBasicMaterial({ color: cNow, transparent: true, opacity: 0.35 }));
    scene.add(shadowLine);

    let raf = 0, dirty = true;
    const render = () => { renderer.render(scene, camera); labels.render(scene, camera); untangle(); };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (controls.update() || dirty) { render(); dirty = false; }
    };
    controls.addEventListener('change', () => { dirty = true; });
    const onVis = () => { cancelAnimationFrame(raf); if (!document.hidden) loop(); };
    document.addEventListener('visibilitychange', onVis);
    const ro = new ResizeObserver(() => {
      const W = el.clientWidth, H = el.clientHeight;
      if (!W || !H) return;
      camera.aspect = W / H; camera.updateProjectionMatrix();
      renderer.setSize(W, H); labels.setSize(W, H); dirty = true;
    });
    ro.observe(el);
    loop();

    api.current = {
      setHour(hh) {
        const alt = sunAltitude(day.y, day.m, day.d, hh, loc.lat, loc.lng, day.tz);
        const az = sunAzimuth(day.y, day.m, day.d, hh, loc.lat, loc.lng, day.tz);
        const p = domePoint(alt, az);
        sun.position.copy(p);
        sun.visible = true;
        glow.material.opacity = alt >= 0 ? 1 : 0.35;              // dimmer below the horizon
        const foot = p.clone(); foot.y = 0;                          // a line down to the horizon
        shadowLine.geometry.setFromPoints([p, foot]);
        dirty = true;
        return { alt, az };
      },
    };
    onReady?.(true);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      ro.disconnect();
      controls.dispose();
      scene.traverse((o) => { o.geometry?.dispose(); if (o.material) { o.material.map?.dispose(); o.material.dispose(); } });
      renderer.dispose();
      el.innerHTML = '';
      api.current = null;
    };
  }, [loc, day, qibla, theme, fmt, nowHour]); // eslint-disable-line react-hooks/exhaustive-deps

  // Moving the slider only moves the sun.
  const info = useRef(null);
  useEffect(() => { info.current = api.current?.setHour(hour); }, [hour, loc, day, theme, fmt, nowHour]);

  return <div ref={host} className="sky-dome" role="img" aria-label="3D view of today's sky with the sun's path and each prayer marked" />;
}
