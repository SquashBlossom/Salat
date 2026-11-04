/* Lock-screen alerts through the Salat server (Web Push).
   Owns: asking permission, subscribing this phone, telling the server the settings.
   Refuses: prayer math (the server runs the same shared math).

   The server address comes from VITE_API_URL at build time. Until the server
   is live, push is "not ready" and the app falls back to in-app alerts. */
import { get, set } from '../../data/store.js';

export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

/** What this device can do right now. The view turns this into one plain sentence. */
export function capability() {
  const hasNotif = 'Notification' in window;
  const hasPush = 'serviceWorker' in navigator && 'PushManager' in window;
  if (isIOS() && !isStandalone()) return 'needs-home-screen'; // iOS rule: Home Screen apps only
  if (!hasNotif) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  if (!hasPush || !API_URL) return 'in-app'; // alerts while Salat is open
  return 'push';
}

/** Ask permission. Must run inside a tap. */
export async function askPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

function b64ToBytes(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Only what the server needs to compute alert times. No name, no history. */
export function serverSettings(s) {
  return {
    loc: { lat: +s.loc.lat.toFixed(2), lng: +s.loc.lng.toFixed(2), zone: s.loc.zone }, // ~1 km; times differ < 2 s
    method: s.method, asr: s.asr, hiLat: s.hiLat, adj: s.adj, fmt: s.fmt, alerts: s.alerts,
  };
}

async function api(path, body, method = 'POST') {
  const res = await fetch(API_URL + path, {
    method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`server said ${res.status}`);
  return res.status === 204 ? null : res.json();
}

/** Subscribe this phone (or refresh its settings). One try; the caller shows the result. */
export async function syncPush(s) {
  if (capability() !== 'push') return { ok: false, why: capability() };
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const { publicKey } = await api('/api/push/key', null, 'GET');
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) });
  }
  const { id } = await api('/api/push/subscriptions', { subscription: sub.toJSON(), settings: serverSettings(s) });
  await set('pushId', id);
  return { ok: true, id };
}

export async function stopPush() {
  try {
    const id = await get('pushId');
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (id && API_URL) await api('/api/push/subscriptions/' + id, null, 'DELETE').catch(() => {});
    if (sub) await sub.unsubscribe();
    await set('pushId', null);
  } catch { /* already gone */ }
}

/** Ask the server to send a test alert right now, so she can see the lock screen work. */
export async function testPush() {
  const id = await get('pushId');
  if (!id) throw new Error('not subscribed');
  return api('/api/push/subscriptions/' + id + '/test', {});
}
