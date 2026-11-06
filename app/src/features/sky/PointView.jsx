/* POINT AT THE SKY — hold up the device and see the sun's path, the prayers, the moon and the
   Qibla over the camera view. Without motion sensors (or if they are refused), drag to look around.
   Owns: asking for camera and motion, the camera feed, and the words on screen.
   Refuses: the 3D scene (pointScene.js) and all math (shared/).
   Privacy: the camera picture never leaves the device and is never recorded. */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { partsIn } from '@salat/shared/schedule';
import { qiblaBearing } from '@salat/shared/solar';
import { moonPhase } from '@salat/shared/moon';
import { Button, Card, MoonPhase, Notice } from '../../ui/index.jsx';
import { compassName } from '../../core/format.js';
import { screenAngle } from '../../core/compass.js';
import { createPointScene, lookQuaternion, orientationQuaternion } from './pointScene.js';

const wrap180 = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
const LONG_SIDE_FOV = 63; // a phone or iPad back camera sees about 63° along its long side

/** Vertical field of view for the visible part of the video (object-fit: cover crops it). */
function coverFov(video, W, H) {
  const vw = video?.videoWidth, vh = video?.videoHeight;
  if (!vw || !vh) return 60;
  const t = Math.tan(((LONG_SIDE_FOV / 2) * Math.PI) / 180);
  const fullV = vh >= vw ? t : t * (vh / vw);             // tan(half vertical fov) of the whole video
  const scale = Math.max(W / vw, H / vh);                  // cover: the video is scaled up to fill
  const shownV = fullV * (H / (vh * scale));                // the share of its height on screen
  return (2 * Math.atan(shownV) * 180) / Math.PI;
}

export default function PointView({ open, onClose, s, today }) {
  const [stage, setStage] = useState('intro');              // intro → live
  const [motion, setMotion] = useState('none');             // live · drag · denied
  const [cam, setCam] = useState('off');                    // on · off · denied
  const [face, setFace] = useState(null);
  const [unsure, setUnsure] = useState(false);              // the compass says it is not sure
  const host = useRef(null), video = useRef(null), scene = useRef(null), stream = useRef(null);

  // Reset when closed: stop the camera, free the scene.
  useEffect(() => {
    if (open) return undefined;
    setStage('intro'); setFace(null);
    return undefined;
  }, [open]);
  useEffect(() => () => stream.current?.getTracks().forEach((t) => t.stop()), []);

  const start = async () => {
    // iOS asks for motion here, inside the tap (it must be the first thing we wait for).
    let m = 'drag';
    try {
      const DOE = window.DeviceOrientationEvent;
      if (DOE && typeof DOE.requestPermission === 'function') m = (await DOE.requestPermission()) === 'denied' ? 'denied' : 'live'; // 'prompt' too: wait and see if events come
      else if (DOE && matchMedia('(pointer: coarse)').matches) m = 'live';
    } catch { m = 'denied'; }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      setCam('on');
    } catch { setCam('denied'); }
    setMotion(m);
    setStage('live');
  };

  // The live view: scene, camera feed, and either the device's motion or dragging.
  useEffect(() => {
    if (!open || stage !== 'live' || !host.current) return undefined;
    const nowP = partsIn(new Date(), s.loc.zone);
    const hour = nowP.h + nowP.mi / 60;
    const qibla = qiblaBearing(s.loc.lat, s.loc.lng);
    const sc = createPointScene(host.current, { loc: s.loc, day: today, hour, nowHour: hour, fmt: s.fmt, qibla, onFrame: setFace });
    scene.current = sc;

    const v = video.current;
    const fitFov = () => sc.setFov(cam === 'on' ? coverFov(v, innerWidth, innerHeight) : 60);
    if (cam === 'on' && v && stream.current) {
      v.srcObject = stream.current;
      v.addEventListener('loadedmetadata', fitFov);
      v.play().catch(() => {});
    }
    fitFov();
    addEventListener('resize', fitFov);

    // Drag to look: start facing the Qibla, a little above the horizon.
    let yaw = qibla, pitch = 12, drag = null, gotMotion = false, offset = null;
    const look = (snap) => sc.setTarget(lookQuaternion(yaw, pitch), snap);
    look(true);
    const down = (e) => { if (!gotMotion) drag = { x: e.clientX, y: e.clientY, yaw, pitch }; };
    const move = (e) => {
      if (!drag) return;
      const k = 60 / innerHeight; // about one screen of drag = one view's width of sky
      yaw = (drag.yaw - (e.clientX - drag.x) * k + 360) % 360;
      pitch = Math.max(-80, Math.min(85, drag.pitch + (e.clientY - drag.y) * k));
      look(true);
    };
    const up = () => { drag = null; };
    const el = host.current;
    el.addEventListener('pointerdown', down);
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);

    // Motion: absolute alpha (0 = facing north). iOS gives a compass heading, so we learn the
    // offset between its alpha and true north and smooth it; others send absolute events.
    const onOrient = (e) => {
      if (e.alpha == null || e.beta == null) return;
      let a = e.alpha;
      if (e.webkitCompassHeading != null && e.webkitCompassHeading >= 0) {
        const d = wrap180(360 - e.webkitCompassHeading - a);
        offset = offset == null ? d : offset + wrap180(d - offset) * 0.04;
        a += offset;
        setUnsure(e.webkitCompassAccuracy > 25 || e.webkitCompassAccuracy < 0);
      } else if (e.type !== 'deviceorientationabsolute' && !e.absolute) return; // no north: keep dragging
      gotMotion = true;
      sc.setTarget(orientationQuaternion(a, e.beta, e.gamma || 0, screenAngle()));
    };
    const absolute = 'ondeviceorientationabsolute' in window;
    const evt = absolute ? 'deviceorientationabsolute' : 'deviceorientation';
    if (motion === 'live') addEventListener(evt, onOrient);
    // No motion after a moment (a desktop, or sensors off): stay in drag mode.
    const check = setTimeout(() => { if (!gotMotion && motion === 'live') setMotion('drag'); }, 2000);

    return () => {
      clearTimeout(check);
      removeEventListener(evt, onOrient);
      removeEventListener('resize', fitFov);
      el.removeEventListener('pointerdown', down);
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      v?.removeEventListener('loadedmetadata', fitFov);
      sc.dispose(); scene.current = null;
    };
  }, [open, stage, motion, cam]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop the camera when the view closes.
  useEffect(() => {
    if (open) return;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null; setCam('off'); setMotion('none'); setUnsure(false);
  }, [open]);

  if (!open) return null;
  const qibla = qiblaBearing(s.loc.lat, s.loc.lng);
  const turn = face ? wrap180(qibla - face.az) : null;
  const sc = scene.current;
  const ph = moonPhase(new Date());
  const where = (o) => (o.alt >= 0 ? `${o.alt.toFixed(0)}° high, ${compassName(o.az)}` : `below the horizon, ${compassName(o.az)}`);

  return createPortal(
    <div className={'point-view' + (cam === 'on' ? ' cam' : '')} role="dialog" aria-modal="true" aria-label="Point at the sky">
      {cam === 'on' && <video ref={video} className="point-video" playsInline muted autoPlay />}
      {stage === 'live' && <div ref={host} className="point-gl" />}
      {stage === 'live' && <div className="point-aim" aria-hidden="true" />}

      <div className="point-bar">
        <span className="t-title-3">Point at the sky</span>
        <Button variant="quiet" size="sm" onClick={onClose}>Done</Button>
      </div>

      {stage === 'intro' && (
        <div className="point-intro">
          <Card padded>
            <div className="point-intro-body">
              <p className="t-title-3">Hold up your device and look around</p>
              <p className="t-small">You will see the sun's path with each prayer, the sun, the moon and the Qibla, drawn over the camera view.</p>
              <p className="t-small">Salat asks to use the camera and motion. The picture stays on your device and is never recorded.</p>
              <Button variant="primary" icon="target" onClick={start}>Start</Button>
            </div>
          </Card>
        </div>
      )}

      {stage === 'live' && (
        <div className="point-read">
          {unsure && <Notice tone="caution">The compass is unsure. Move your device in a figure 8, away from metal.</Notice>}
          {motion !== 'live' && <Notice tone="info">{motion === 'denied' ? 'Motion is off for Salat, so drag to look around. You can turn it on in Settings › Safari › Motion & Orientation Access.' : 'Drag to look around.'}</Notice>}
          {cam === 'denied' && <Notice tone="info">The camera is off, so the sky is drawn without it.</Notice>}
          {face && (
            <div className="point-facing">
              <span className="figures t-title-3">{compassName(face.az)} {face.az.toFixed(0)}°</span>
              <span className={'t-small' + (Math.abs(turn) <= 5 ? ' point-on' : '')}>
                {Math.abs(turn) <= 5 ? 'You are facing the Qibla' : `Qibla: turn ${turn > 0 ? 'right' : 'left'} ${Math.abs(turn).toFixed(0)}°`}
              </span>
            </div>
          )}
          {sc && (
            <div className="point-bodies t-caption">
              <span>Sun {where(sc.sun)}</span>
              <span className="point-moon"><MoonPhase lit={ph.lit} waxing={ph.waxing} south={s.loc.lat < 0} label={ph.name} />Moon {where(sc.moon)}</span>
            </div>
          )}
        </div>
      )}
    </div>,
    document.body,
  );
}
