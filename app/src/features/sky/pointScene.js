/* POINT AT THE SKY — the 3D scene seen from where you stand.
   Owns: the scene around the viewer (horizon, compass points, the sun's path with each prayer,
   the sun, the moon, the Qibla), the camera that follows the device, and drawing.
   Refuses: permissions, the camera feed and words on screen (PointView), and the math (shared/).

   The viewer stands at the centre. North is -z, east +x, up +y (the same as the dome).
   The device's orientation becomes the camera's direction (orientationQuaternion). */
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { sunAltitude, sunAzimuth } from '@salat/shared/solar';
import { PRAYERS } from '@salat/shared/methods';
import { wallToDate } from '@salat/shared/schedule';
import { fmtTime } from '../../core/format.js';
import { createMoon } from './moon3d.js';
import { domePoint } from './SkyDome.jsx';

const R = 100; // the sky's radius around the viewer
const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const color = (n) => new THREE.Color(css(n) || 'gray');
const fix = (a) => ((a % 360) + 360) % 360;

/* Device orientation (degrees) to a camera direction. alpha must be absolute: 0 = the back of the
   device faces north when held upright (or its top, when flat). screenDeg: the screen's rotation. */
const zee = new THREE.Vector3(0, 0, 1);
const euler = new THREE.Euler();
const q0 = new THREE.Quaternion();
const backOfDevice = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // look out of the back, not the top
export function orientationQuaternion(alpha, beta, gamma, screenDeg, out = new THREE.Quaternion()) {
  const d = THREE.MathUtils.degToRad;
  euler.set(d(beta), d(alpha), -d(gamma), 'YXZ');
  out.setFromEuler(euler);
  out.multiply(backOfDevice);
  out.multiply(q0.setFromAxisAngle(zee, -d(screenDeg)));
  return out;
}

/** Looking toward azimuth `yaw` (clockwise from north) and `pitch` degrees up (for drag mode). */
export function lookQuaternion(yaw, pitch, out = new THREE.Quaternion()) {
  const d = THREE.MathUtils.degToRad;
  return out.setFromEuler(euler.set(d(pitch), -d(yaw), 0, 'YXZ'));
}

function label(text, cls) {
  const el = document.createElement('div');
  el.className = 'sky-label ' + (cls || '');
  const span = document.createElement('span');
  span.textContent = text;
  el.appendChild(span);
  return new CSS2DObject(el);
}

function glowTexture(stops) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [at, col] of stops) grad.addColorStop(at, col);
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/**
 * Builds the scene inside `host`. Returns:
 *   setTarget(quaternion, snap): where the camera should look (it eases there each frame)
 *   setFov(verticalDegrees), facing(): { az, alt } of the screen's centre, dispose()
 * onFrame(facing) is called a few times a second for the words on screen.
 */
export function createPointScene(host, { loc, day, hour, nowHour, fmt, qibla, onFrame }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearColor(0x000000, 0);
  const w = host.clientWidth, h = host.clientHeight;
  renderer.setSize(w, h);
  host.appendChild(renderer.domElement);
  const labels = new CSS2DRenderer();
  labels.setSize(w, h);
  labels.domElement.className = 'sky-labels';
  host.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);

  const cNow = color('--now'), cNext = color('--next'), cDone = color('--done'), cLine = color('--text-2');
  const sunPos = (hh) => {
    const alt = sunAltitude(day.y, day.m, day.d, hh, loc.lat, loc.lng, day.tz);
    const az = sunAzimuth(day.y, day.m, day.d, hh, loc.lat, loc.lng, day.tz);
    return { alt, az, p: domePoint(alt, az, R) };
  };

  // The horizon, and the compass points on it
  const ring = [];
  for (let i = 0; i <= 180; i++) ring.push(domePoint(0, i * 2, R));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring), new THREE.LineBasicMaterial({ color: cLine, transparent: true, opacity: 0.8 })));
  for (const [t, az] of [['N', 0], ['NE', 45], ['E', 90], ['SE', 135], ['S', 180], ['SW', 225], ['W', 270], ['NW', 315]]) {
    const l = label(t, 'compass' + (t.length > 1 ? ' minor' : '')); l.position.copy(domePoint(-1.5, az, R)); scene.add(l);
  }

  // The Qibla: an upright line on the horizon, and its name
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([domePoint(0, qibla, R), domePoint(28, qibla, R)]),
    new THREE.LineBasicMaterial({ color: cNow })));
  const ql = label('Qibla', 'qibla over'); ql.position.copy(domePoint(3, qibla, R)); scene.add(ql); // near the horizon, where you look

  // The sun's path today: bright above the horizon, faint and dashed below
  let run = null;
  const runs = [];
  for (let m = 0; m <= 1440; m += 4) {
    const { alt, p } = sunPos(m / 60), up = alt >= 0;
    if (!run || run.up !== up) { run = { up, pts: run ? [run.pts.at(-1)] : [] }; runs.push(run); }
    run.pts.push(p);
  }
  for (const r of runs) {
    if (r.pts.length < 2) continue;
    const geo = new THREE.BufferGeometry().setFromPoints(r.pts);
    const line = r.up ? new THREE.Line(geo, new THREE.LineBasicMaterial({ color: cNext }))
      : new THREE.Line(geo, new THREE.LineDashedMaterial({ color: cNext, dashSize: 2, gapSize: 2, transparent: true, opacity: 0.45 }));
    if (!r.up) line.computeLineDistances();
    scene.add(line);
  }

  // Each prayer where the sun stands at that moment
  for (const pr of PRAYERS) {
    const ph = day.hours[pr.k];
    if (!Number.isFinite(ph)) continue;
    const past = ph < nowHour, { p } = sunPos(ph);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12), new THREE.MeshBasicMaterial({ color: past ? cDone : cNext }));
    dot.position.copy(p); scene.add(dot);
    const l = label(`${pr.en} ${fmtTime(ph, fmt).t}`, (past ? 'done' : 'next') + ' over'); l.position.copy(p); scene.add(l);
  }

  // The sun now
  const sun = new THREE.Group();
  const [r, g, b] = color('--sun').toArray().map((v) => Math.round(v * 255));
  const [gr, gg, gb] = color('--sun-glow').toArray().map((v) => Math.round(v * 255));
  sun.add(new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture([[0, `rgba(${gr},${gg},${gb},0.55)`], [0.3, `rgba(${gr},${gg},${gb},0.18)`], [1, 'transparent']]), depthWrite: false })));
  sun.children[0].scale.set(16, 16, 1);
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture([[0, `rgba(${r},${g},${b},1)`], [0.82, `rgba(${r},${g},${b},1)`], [0.9, `rgba(${gr},${gg},${gb},0.9)`], [1, 'transparent']]), depthWrite: false }));
  core.scale.set(4.4, 4.4, 1); sun.add(core);
  const now = sunPos(hour);
  sun.position.copy(now.p); scene.add(sun);
  const sl = label('Sun', 'sun under'); sl.position.copy(now.p); scene.add(sl);

  // The moon now, a little larger than life so it is easy to find
  const moon = createMoon(scene, { radius: R, size: 13 });
  const moonNow = moon.update(wallToDate(day.y, day.m, day.d, hour, day.zone), loc.lat, loc.lng, now.alt, now.az, (alt, az, rr) => domePoint(alt, az, rr));
  const ml = label('Moon', 'moon under'); ml.position.copy(moon.position); ml.visible = moonNow.alt > -1; scene.add(ml);

  // Drawing: the camera eases toward where the device points
  const target = new THREE.Quaternion();
  let haveTarget = false, raf = 0, frame = 0;
  const fwd = new THREE.Vector3();
  const facing = () => {
    fwd.set(0, 0, -1).applyQuaternion(camera.quaternion);
    return { az: fix(THREE.MathUtils.radToDeg(Math.atan2(fwd.x, -fwd.z))), alt: THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(fwd.y, -1, 1))) };
  };
  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (!haveTarget) return;
    camera.quaternion.slerp(target, 0.3);
    moon.beforeRender(camera, host.clientWidth, host.clientHeight);
    renderer.render(scene, camera);
    labels.render(scene, camera);
    if (onFrame && frame++ % 8 === 0) onFrame(facing());
  };
  const onVis = () => { cancelAnimationFrame(raf); if (!document.hidden) loop(); };
  document.addEventListener('visibilitychange', onVis);
  const ro = new ResizeObserver(() => {
    const W = host.clientWidth, H = host.clientHeight;
    if (!W || !H) return;
    camera.aspect = W / H; camera.updateProjectionMatrix();
    renderer.setSize(W, H); labels.setSize(W, H);
  });
  ro.observe(host);
  loop();

  return {
    setTarget(q, snap = false) {
      target.copy(q);
      if (snap || !haveTarget) camera.quaternion.copy(q);
      haveTarget = true;
    },
    setFov(v) { camera.fov = v; camera.updateProjectionMatrix(); },
    facing,
    sun: { alt: now.alt, az: now.az },
    moon: moonNow,
    dispose() {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      ro.disconnect();
      moon.dispose();
      scene.traverse((o) => { o.geometry?.dispose(); if (o.material) { o.material.map?.dispose(); o.material.dispose(); } });
      renderer.dispose();
      host.innerHTML = '';
    },
  };
}
