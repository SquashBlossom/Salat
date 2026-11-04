/* Starts the Salat server. Owns: config, VAPID keys, wiring. Refuses: routes and SQL.

   Settings (environment variables; none are secrets except the private key):
     PORT                 default 8787
     DATA_DIR             where the database and dev keys live, default ./data
     ALLOWED_ORIGINS      comma list, default the GitHub Pages site and localhost
     VAPID_PUBLIC_KEY     \
     VAPID_PRIVATE_KEY     > set these on Fly as secrets. If missing, a dev pair is
     VAPID_SUBJECT        /  made once in DATA_DIR/vapid.json (never committed). */
import http from 'node:http';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import webpush from 'web-push';
import { openDb } from './db.js';
import { makeHandler } from './app.js';
import { start } from './scheduler.js';

const log = (m) => console.log(new Date().toISOString(), m);
const PORT = +(process.env.PORT || 8787);
const DATA = process.env.DATA_DIR || './data';
const ORIGINS = (process.env.ALLOWED_ORIGINS ||
  'https://squashblossom.github.io,http://localhost:5173,http://localhost:4173').split(',').map((s) => s.trim());

function vapid() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  }
  mkdirSync(DATA, { recursive: true });
  const file = join(DATA, 'vapid.json');
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  const keys = webpush.generateVAPIDKeys();
  writeFileSync(file, JSON.stringify(keys), { mode: 0o600 });
  log(`made development push keys in ${file}`);
  return keys;
}

const keys = vapid();
webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:salat-alerts@users.noreply.github.com', keys.publicKey, keys.privateKey);

const db = openDb(join(DATA, 'salat.db'));
const send = (row, payload) => webpush.sendNotification(
  { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
  JSON.stringify(payload),
  { TTL: 600, urgency: 'high' }, // an alert older than 10 minutes is no use
);

http.createServer(makeHandler({ db, send, publicKey: keys.publicKey, origins: ORIGINS, log })).listen(PORT, () => {
  log(`Salat server on :${PORT}, ${db.count()} phones subscribed`);
});
start(db, send, log);
