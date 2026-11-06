/* MOON (3D) — the moon in the 3D sky, at its real place, with its real phase.
   Owns: the moon's disc and its lit shape. Refuses: the math (shared/moon) and labels (SkyDome).

   The disc always faces the camera, and its lit side always points toward the sun on screen,
   so the shape is the one you would see from the ground (a crescent's horns point away from the sun).
   Colours: --moon (lit part, cool silver) and --moon-dark (earthshine), the same in every theme. */
import * as THREE from 'three';
import { moonAltAz, moonPhase } from '@salat/shared/moon';

const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const col = (n) => new THREE.Color(css(n) || 'white');

const VERT = `
varying vec2 vUv;
void main() { vUv = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG = `
uniform vec3 moon; uniform vec3 moonDark;
uniform float lit; uniform float angle; uniform float night;
varying vec2 vUv;
const float DISC = 0.56; // the disc's radius inside the square; the rest is its soft halo
void main() {
  float ca = cos(-angle), sa = sin(-angle);
  vec2 p = vec2(ca * vUv.x - sa * vUv.y, sa * vUv.x + ca * vUv.y) / DISC; // lit side toward +x
  float r = length(p);
  if (r > 1.0) {
    // a faint halo at night, as bright as the moon is full
    float h = pow(1.0 - smoothstep(1.0, 1.75, r), 2.0) * 0.22 * night * lit;
    if (h <= 0.002) discard;
    gl_FragColor = vec4(moon * h, h);
    return;
  }
  // The terminator: the edge between day and night on the moon, an ellipse across the disc.
  float xt = (1.0 - 2.0 * lit) * sqrt(max(0.0, 1.0 - p.y * p.y));
  float m = smoothstep(xt - 0.05, xt + 0.05, p.x);
  float limb = 0.82 + 0.18 * sqrt(max(0.0, 1.0 - r * r)); // a little darker at the edge
  float edge = 1.0 - smoothstep(0.96, 1.0, r);
  vec3 c = mix(moonDark, moon * limb, m);
  float a = mix(0.75 * night, mix(0.8, 1.0, night), m) * edge; // by day the dark part vanishes into the blue
  gl_FragColor = vec4(c * a, a);
}`;

/** Adds the moon to a scene. Returns { update, beforeRender, position, dispose }. */
export function createMoon(scene, { radius }) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, // premultiplied
    uniforms: {
      moon: { value: col('--moon') }, moonDark: { value: col('--moon-dark') },
      lit: { value: 0.5 }, angle: { value: 0 }, night: { value: 1 },
    },
  });
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), mat); // disc ≈ 0.9 across, like the sun
  disc.renderOrder = 2; // after the sky wall, stars and ground; the depth test still hides it behind solid things
  scene.add(disc);
  const moonDir = new THREE.Vector3(), sunDir = new THREE.Vector3();
  const a = new THREE.Vector3(), b = new THREE.Vector3();

  return {
    position: disc.position,
    /** Move the moon to `date` at the place. Returns its { alt, az, phase }. */
    update(date, lat, lng, sunAlt, sunAz, domePoint) {
      const { alt, az } = moonAltAz(lat, lng, date);
      const phase = moonPhase(date);
      disc.position.copy(domePoint(alt, az, radius * 0.97));
      disc.visible = alt > -1; // only above the horizon (its disc can peek over it)
      moonDir.copy(domePoint(alt, az, 1));
      sunDir.copy(domePoint(sunAlt, sunAz, 1));
      mat.uniforms.lit.value = phase.lit;
      mat.uniforms.night.value = THREE.MathUtils.clamp((6 - sunAlt) / 12, 0, 1); // 0 by day, 1 once the sun is 6° down
      return { alt, az, phase };
    },
    /** Each frame: face the camera, and turn the lit side toward the sun on screen. */
    beforeRender(camera, width, height) {
      if (!disc.visible) return;
      disc.quaternion.copy(camera.quaternion);
      // A step along the sky from the moon toward the sun, seen on screen.
      const t = sunDir.clone().addScaledVector(moonDir, -moonDir.dot(sunDir));
      if (t.lengthSq() < 1e-8) return; // exactly opposite the sun: full, no side to choose
      t.normalize();
      a.copy(disc.position).project(camera);
      b.copy(moonDir).addScaledVector(t, 0.05).multiplyScalar(disc.position.length()).project(camera);
      mat.uniforms.angle.value = Math.atan2(b.y - a.y, (b.x - a.x) * (width / height));
    },
    dispose() { disc.geometry.dispose(); mat.dispose(); scene.remove(disc); },
  };
}
