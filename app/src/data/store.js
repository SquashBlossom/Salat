/* The on-device database.
   Owns: reads and writes to IndexedDB (settings now; prayer log and masjid data later).
   Refuses: network. Nothing here leaves the phone.

   Two stores:
     kv   - small named values: 'settings', 'pushId'
     log  - one row per event, keyed by time: alerts fired, prayers marked (later)
   If IndexedDB is blocked (private mode), it falls back to localStorage. */

const DB_NAME = 'salat';
const DB_VERSION = 1;
let dbPromise = null;

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no IndexedDB'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('log')) db.createObjectStore('log', { keyPath: 'at' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(store, mode, fn) {
  return open().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const out = fn(t.objectStore(store));
    t.oncomplete = () => resolve(out && 'result' in out ? out.result : undefined);
    t.onerror = () => reject(t.error);
  }));
}

export async function get(key) {
  try {
    return await tx('kv', 'readonly', (s) => s.get(key));
  } catch {
    try { const v = localStorage.getItem('salat-' + key); return v ? JSON.parse(v) : undefined; } catch { return undefined; }
  }
}

export async function set(key, value) {
  try {
    await tx('kv', 'readwrite', (s) => s.put(value, key));
  } catch {
    try { localStorage.setItem('salat-' + key, JSON.stringify(value)); } catch { /* storage is full or blocked */ }
  }
}

/** Add one row to the log, e.g. {at, type:'alert', k:'asr'}. */
export async function log(row) {
  try { await tx('log', 'readwrite', (s) => s.put({ at: Date.now(), ...row })); } catch { /* best effort */ }
}

/** Read settings. The first time, carry over what the old single-file app saved. */
export async function loadSettings() {
  const saved = await get('settings');
  if (saved) return saved;
  try {
    const old = localStorage.getItem('salat-settings');
    if (old) { const v = JSON.parse(old); await set('settings', v); return v; }
  } catch { /* nothing to migrate */ }
  return null;
}

export async function saveSettings(s) {
  try { localStorage.setItem('salat-theme', s.theme); } catch { /* theme flash only */ }
  await set('settings', s);
}
