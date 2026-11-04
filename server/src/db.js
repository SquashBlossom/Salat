/* The server database: one SQLite file.
   Owns: tables and every query. Refuses: HTTP and push sending.

   Tables
     subscriptions  one row per phone that asked for alerts
                    (the push address, its keys, and only the settings needed to compute times)
     sent           which alerts went out, so none is sent twice
   Location is stored rounded to 2 decimals (about 1 km). No names, no emails. */
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function openDb(file) {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS subscriptions (
      id        TEXT PRIMARY KEY,
      endpoint  TEXT NOT NULL UNIQUE,
      p256dh    TEXT NOT NULL,
      auth      TEXT NOT NULL,
      settings  TEXT NOT NULL,
      created   INTEGER NOT NULL,
      updated   INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sent (
      sub_id    TEXT NOT NULL,
      at        INTEGER NOT NULL,
      k         TEXT NOT NULL,
      PRIMARY KEY (sub_id, at, k)
    );
  `);

  const q = {
    upsert: db.prepare(`INSERT INTO subscriptions (id, endpoint, p256dh, auth, settings, created, updated)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth,
        settings = excluded.settings, updated = excluded.updated`),
    get: db.prepare('SELECT * FROM subscriptions WHERE id = ?'),
    all: db.prepare('SELECT * FROM subscriptions'),
    del: db.prepare('DELETE FROM subscriptions WHERE id = ?'),
    delSent: db.prepare('DELETE FROM sent WHERE sub_id = ?'),
    markSent: db.prepare('INSERT OR IGNORE INTO sent (sub_id, at, k) VALUES (?, ?, ?)'),
    pruneSent: db.prepare('DELETE FROM sent WHERE at < ?'),
    count: db.prepare('SELECT COUNT(*) AS n FROM subscriptions'),
  };

  return {
    /** The id is a hash of the push address: stable for a phone, and it reveals nothing. */
    idFor: (endpoint) => createHash('sha256').update(endpoint).digest('base64url').slice(0, 22),

    save(sub, settings, now = Date.now()) {
      const id = this.idFor(sub.endpoint);
      q.upsert.run(id, sub.endpoint, sub.keys.p256dh, sub.keys.auth, JSON.stringify(settings), now, now);
      return id;
    },
    get: (id) => { const r = q.get.get(id); return r ? { ...r, settings: JSON.parse(r.settings) } : null; },
    all: () => q.all.all().map((r) => ({ ...r, settings: JSON.parse(r.settings) })),
    remove: (id) => { q.delSent.run(id); q.del.run(id); },
    /** True if this alert was not sent before (and records it). */
    claim: (id, at, k) => q.markSent.run(id, at, k).changes === 1,
    prune: (before) => q.pruneSent.run(before),
    count: () => q.count.get().n,
    close: () => db.close(),
  };
}
