/* LIVING SKY — the 3D dome becomes the real sky: coloured for where the sun is, with the
   real bright stars appearing as twilight deepens. Seen from outside, like a snow globe: the
   dome's far inner wall is the sky behind the sun's path, and the page behind takes the same colours.
   Owns: the dome's sky shader, the star field, and the backdrop colours.
   Refuses: the dome, labels and slider (SkyDome / SkySheet), and the math (shared/stars, shared/solar).

   Sky stages follow the sun's altitude; the anchors are the prayer angles:
     night < -18° · astronomical -18…-12 · nautical -12…-6 · civil -6…0 · golden 0…6 · day > ~20
   Colours are the --sky-* tokens (the same in every theme: it is the real sky). */
import * as THREE from 'three';
import { STARS } from '@salat/shared/data/stars';
import { starAltAz, starVisibility } from '@salat/shared/stars';

const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const col = (n) => new THREE.Color(css(n) || 'black');

/** Sky colours at each sun altitude. Between anchors, colours blend smoothly. */
function stages() {
  const night = { zenith: col('--sky-night-zenith'), horizon: col('--sky-night-horizon'), glow: col('--sky-astro-glow'), glowAmt: 0 };
  return [
    [-90, night],
    [-18, night],
    [-12, { zenith: col('--sky-astro-zenith'), horizon: col('--sky-astro-horizon'), glow: col('--sky-astro-glow'), glowAmt: 0.25 }],
    [-6, { zenith: col('--sky-nautical-zenith'), horizon: col('--sky-nautical-horizon'), glow: col('--sky-nautical-glow'), glowAmt: 0.55 }],
    [0, { zenith: col('--sky-civil-zenith'), horizon: col('--sky-civil-horizon'), glow: col('--sky-civil-glow'), glowAmt: 1.0 }],
    [6, { zenith: col('--sky-golden-zenith'), horizon: col('--sky-golden-horizon'), glow: col('--sky-golden-glow'), glowAmt: 0.85 }],
    [20, { zenith: col('--sky-day-zenith'), horizon: col('--sky-day-horizon'), glow: col('--sky-day-glow'), glowAmt: 0.45 }],
    [90, { zenith: col('--sky-day-zenith'), horizon: col('--sky-day-horizon'), glow: col('--sky-day-glow'), glowAmt: 0.35 }],
  ];
}

/** Blend the two stages around `alt`. */
export function skyAt(alt, table) {
  let i = 1;
  while (i < table.length - 1 && alt > table[i][0]) i++;
  const [a1, s1] = table[i - 1], [a2, s2] = table[i];
  const t = Math.max(0, Math.min(1, (alt - a1) / (a2 - a1)));
  const mix = (k) => s1[k].clone().lerp(s2[k], t);
  return { zenith: mix('zenith'), horizon: mix('horizon'), glow: mix('glow'), glowAmt: s1.glowAmt + (s2.glowAmt - s1.glowAmt) * t };
}

const SKY_VERT = `
varying vec3 vDir;
void main() {
  vDir = normalize(position); // a point on the dome, as a direction from the centre
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const SKY_FRAG = `
uniform vec3 zenith; uniform vec3 horizon; uniform vec3 glow; uniform vec3 ground;
uniform vec3 sunDir; uniform float glowAmt;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  // overhead to horizon
  vec3 c = mix(horizon, zenith, pow(smoothstep(0.0, 0.8, h), 0.55));
  // light around the sun, strongest along the horizon (first and last light)
  float s = max(dot(d, normalize(sunDir)), 0.0);
  float band = 1.0 - smoothstep(0.0, 0.35, abs(h - 0.02));
  c += glow * glowAmt * (0.55 * pow(s, 6.0) * band + 0.35 * pow(s, 40.0) + 0.12 * pow(s, 2.0) * band);
  gl_FragColor = vec4(c, 0.92);
}`;

const STAR_VERT = `
attribute float size; attribute vec3 tint; attribute float vis;
varying vec3 vTint; varying float vVis;
uniform float pixelRatio;
void main() {
  vTint = tint; vVis = vis;
  gl_PointSize = size * pixelRatio;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const STAR_FRAG = `
varying vec3 vTint; varying float vVis;
void main() {
  if (vVis <= 0.0) discard;
  float r = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, r);
  gl_FragColor = vec4(vTint * a * vVis, a * vVis);
}`;

/** Star colour from its B-V index: blue-white hot stars to orange cool ones. */
function starTint(bv) {
  const blue = new THREE.Color(0.75, 0.83, 1.0), white = new THREE.Color(1, 0.98, 0.95), orange = new THREE.Color(1.0, 0.78, 0.55);
  return bv < 0.6 ? blue.lerp(white, Math.max(0, (bv + 0.3) / 0.9)) : white.lerp(orange, Math.min(1, (bv - 0.6) / 1.0));
}

/**
 * Adds the living sky to a scene. radius: the dome's radius (stars sit just inside it).
 * Returns { update(date, sunAlt, sunAz, domePoint), dispose() }.
 */
export function createLivingSky(scene, { radius, pixelRatio, host }) {
  const table = stages();
  // The far inner wall of the dome (BackSide): the sky behind everything, never in front of the path.
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.002, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.ShaderMaterial({
      vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, transparent: true,
      uniforms: {
        zenith: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, glow: { value: new THREE.Color() },
        ground: { value: col('--sky-ground') }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, glowAmt: { value: 0 },
      },
    }),
  );
  sky.renderOrder = -10;
  scene.add(sky);

  const n = STARS.length;
  const pos = new Float32Array(n * 3), size = new Float32Array(n), tint = new Float32Array(n * 3), vis = new Float32Array(n);
  STARS.forEach(([, , mag, bv], i) => {
    size[i] = Math.max(1.8, 6.6 - mag * 1.1);
    const c = starTint(bv); tint.set([c.r, c.g, c.b], i * 3);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('tint', new THREE.BufferAttribute(tint, 3));
  geo.setAttribute('vis', new THREE.BufferAttribute(vis, 1));
  const stars = new THREE.Points(geo, new THREE.ShaderMaterial({
    vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { pixelRatio: { value: pixelRatio } },
  }));
  stars.frustumCulled = false;
  scene.add(stars);

  return {
    /** Recolour the sky and move the stars to `date` at the place. */
    update(date, sunAlt, sunAz, lat, lng, domePoint) {
      const s = skyAt(sunAlt, table);
      const u = sky.material.uniforms;
      u.zenith.value.copy(s.zenith); u.horizon.value.copy(s.horizon); u.glow.value.copy(s.glow); u.glowAmt.value = s.glowAmt;
      u.sunDir.value.copy(domePoint(sunAlt, sunAz, 1));
      let shown = 0;
      for (let i = 0; i < n; i++) {
        const [ra, dec, mag] = STARS[i];
        const v = starVisibility(mag, sunAlt);
        if (v <= 0) { vis[i] = 0; continue; }
        const { alt, az } = starAltAz(ra, dec, lat, lng, date);
        if (alt <= 0) { vis[i] = 0; continue; }
        const p = domePoint(alt, az, radius * 0.995);
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
        vis[i] = v * Math.min(1, alt / 4 + 0.35); // a little dimmer near the horizon
        shown++;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.vis.needsUpdate = true;
      // The page behind the dome: a soft version of the same sky (blended with the theme's page colour).
      if (host) {
        const bg = col('--bg');
        const top = s.zenith.clone().lerp(bg, 0.35), bottom = s.horizon.clone().lerp(bg, 0.55);
        const glowC = s.glow.clone().lerp(bg, 0.4);
        const sx = 50 + 40 * Math.sin((sunAz * Math.PI) / 180);
        host.style.background = `radial-gradient(70% 55% at ${sx.toFixed(0)}% 62%, rgba(${glowC.toArray().map((v) => Math.round(v * 255)).join(',')},${(0.45 * s.glowAmt).toFixed(2)}), transparent 70%), linear-gradient(180deg, #${top.getHexString()} 0%, #${bottom.getHexString()} 100%)`;
      }
      return { shown, stage: s };
    },
    dispose() {
      if (host) host.style.background = '';
      sky.geometry.dispose(); sky.material.dispose(); geo.dispose(); stars.material.dispose();
      scene.remove(sky); scene.remove(stars);
    },
  };
}
