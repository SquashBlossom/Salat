/* The Salat app server's routes.
   Owns: HTTP, input checks, CORS. Refuses: SQL (db.js) and timing (scheduler.js).

   GET    /api/health                          -> { ok, subscriptions }
   GET    /api/push/key                        -> { publicKey }   the VAPID public key
   POST   /api/push/subscriptions              {subscription, settings} -> { id }
   DELETE /api/push/subscriptions/:id          -> 204
   POST   /api/push/subscriptions/:id/test     -> { ok }  sends one alert now */
import { METHODS } from '@salat/shared/methods';

const MAX_BODY = 8 * 1024;
const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export class Bad extends Error { constructor(m, code = 400) { super(m); this.code = code; } }

const num = (v, lo, hi, name) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < lo || n > hi) throw new Bad(`${name} must be a number from ${lo} to ${hi}`);
  return n;
};

/** Keep only the fields we use, each checked. Anything else is dropped. */
export function cleanSettings(s) {
  if (!s || typeof s !== 'object') throw new Bad('settings missing');
  const zone = String(s.loc?.zone || '');
  try { new Intl.DateTimeFormat('en', { timeZone: zone }); } catch { throw new Bad('unknown time zone'); }
  if (!METHODS[s.method]) throw new Bad('unknown method');
  const adj = {}, prayers = {};
  for (const k of PRAYER_KEYS) {
    adj[k] = num(s.adj?.[k] ?? 0, -60, 60, 'adjustment');
    prayers[k] = Boolean(s.alerts?.prayers?.[k]);
  }
  return {
    loc: { lat: +num(s.loc?.lat, -90, 90, 'lat').toFixed(2), lng: +num(s.loc?.lng, -180, 180, 'lng').toFixed(2), zone },
    method: s.method,
    asr: s.asr === 2 ? 2 : 1,
    hiLat: ['angle', 'seventh', 'middle', 'none'].includes(s.hiLat) ? s.hiLat : 'angle',
    fmt: s.fmt === 24 ? 24 : 12,
    adj,
    alerts: { enabled: Boolean(s.alerts?.enabled), lead: num(s.alerts?.lead ?? 0, 0, 60, 'lead'), prayers },
  };
}

function cleanSub(sub) {
  const ok = sub && typeof sub.endpoint === 'string' && /^https:\/\//.test(sub.endpoint) && sub.endpoint.length < 1000 &&
    typeof sub.keys?.p256dh === 'string' && typeof sub.keys?.auth === 'string';
  if (!ok) throw new Bad('subscription is not a valid push subscription');
  return { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } };
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { reject(new Bad('body too large', 413)); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks)) : {}); } catch { reject(new Bad('body is not JSON')); } });
    req.on('error', reject);
  });
}

/**
 * @param {{db, send, publicKey: string, origins: string[], log?: Function}} deps
 * @returns {(req, res) => void} a node:http handler
 */
export function makeHandler({ db, send, publicKey, origins, log = () => {} }) {
  return async (req, res) => {
    const origin = req.headers.origin;
    const allowed = origin && (origins.includes('*') || origins.includes(origin));
    const head = { 'Content-Type': 'application/json', Vary: 'Origin' };
    if (allowed) Object.assign(head, { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET,POST,DELETE', 'Access-Control-Allow-Headers': 'Content-Type' });
    const reply = (code, body) => { res.writeHead(code, head); res.end(body === undefined ? '' : JSON.stringify(body)); };

    try {
      if (req.method === 'OPTIONS') return reply(204);
      if (origin && !allowed) throw new Bad('origin not allowed', 403);
      const url = new URL(req.url, 'http://x');
      const parts = url.pathname.split('/').filter(Boolean); // ['api','push','subscriptions',id,'test']

      if (req.method === 'GET' && url.pathname === '/api/health') return reply(200, { ok: true, subscriptions: db.count() });
      if (req.method === 'GET' && url.pathname === '/api/push/key') return reply(200, { publicKey });

      if (parts[0] === 'api' && parts[1] === 'push' && parts[2] === 'subscriptions') {
        const id = parts[3];
        if (req.method === 'POST' && !id) {
          const body = await readJson(req);
          const newId = db.save(cleanSub(body.subscription), cleanSettings(body.settings));
          return reply(200, { id: newId });
        }
        if (id && !/^[\w-]{22}$/.test(id)) throw new Bad('bad id');
        if (req.method === 'DELETE' && id && !parts[4]) { db.remove(id); return reply(204); }
        if (req.method === 'POST' && id && parts[4] === 'test') {
          const row = db.get(id);
          if (!row) throw new Bad('not subscribed', 404);
          await send(row, { title: 'Salat alerts are working', body: 'This is how each prayer will look on your lock screen.', k: 'test', at: Date.now() });
          return reply(200, { ok: true });
        }
      }
      throw new Bad('not found', 404);
    } catch (e) {
      if (!(e instanceof Bad)) log('error: ' + e.message);
      reply(e instanceof Bad ? e.code : 500, { error: e instanceof Bad ? e.message : 'server error' });
    }
  };
}
