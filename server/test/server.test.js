import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { openDb } from '../src/db.js';
import { cleanSettings, makeHandler } from '../src/app.js';
import { tick, dueFor } from '../src/scheduler.js';
import { withDefaults, upcomingAlerts } from '@salat/shared/schedule';

const settings = cleanSettings({
  ...withDefaults({ alerts: { enabled: true } }),
  loc: { lat: 40.678213, lng: -73.944187, zone: 'America/New_York', name: 'Brooklyn' },
});
const sub = { endpoint: 'https://push.example/abc', keys: { p256dh: 'p', auth: 'a' } };

test('settings are checked and trimmed: location rounded, name dropped', () => {
  assert.deepEqual(settings.loc, { lat: 40.68, lng: -73.94, zone: 'America/New_York' });
  assert.throws(() => cleanSettings({ ...settings, loc: { ...settings.loc, zone: 'Mars/Base' } }), /time zone/);
  assert.throws(() => cleanSettings({ ...settings, method: 'nope' }), /method/);
  assert.throws(() => cleanSettings({ ...settings, alerts: { ...settings.alerts, lead: 999 } }), /lead/);
});

test('each alert is sent once, at its time', async () => {
  const db = openDb(':memory:');
  const id = db.save(sub, settings);
  const [first] = upcomingAlerts(withDefaults(settings), new Date('2026-11-04T17:00:00Z'), 1);
  const got = [];
  const send = async (row, p) => got.push(p);
  assert.equal(await tick(db, send, first.at - 60000), 0, 'nothing a minute early');
  assert.equal(await tick(db, send, first.at + 5000), 1, 'sent on time');
  assert.equal(await tick(db, send, first.at + 25000), 0, 'not sent twice');
  assert.equal(got[0].k, first.k);
  assert.match(got[0].title, new RegExp(first.en));
  assert.ok(db.get(id));
});

test('a phone that removed Salat (410) is forgotten', async () => {
  const db = openDb(':memory:');
  const id = db.save(sub, settings);
  const [first] = upcomingAlerts(withDefaults(settings), new Date('2026-11-04T17:00:00Z'), 1);
  await tick(db, async () => { const e = new Error('gone'); e.statusCode = 410; throw e; }, first.at + 1000);
  assert.equal(db.get(id), null);
});

test('alerts off means nothing is due', () => {
  const off = cleanSettings({ ...settings, alerts: { ...settings.alerts, enabled: false } });
  assert.deepEqual(dueFor(off, Date.parse('2026-11-04T21:49:30Z')), []);
});

test('HTTP: subscribe, test-send, unsubscribe, CORS', async () => {
  const db = openDb(':memory:');
  const sent = [];
  const handler = makeHandler({ db, send: async (r, p) => sent.push(p), publicKey: 'PUB', origins: ['https://squashblossom.github.io'] });
  const srv = http.createServer(handler).listen(0);
  const base = `http://127.0.0.1:${srv.address().port}`;
  const H = { 'Content-Type': 'application/json', Origin: 'https://squashblossom.github.io' };
  try {
    assert.equal((await (await fetch(base + '/api/push/key')).json()).publicKey, 'PUB');
    const r = await fetch(base + '/api/push/subscriptions', { method: 'POST', headers: H, body: JSON.stringify({ subscription: sub, settings }) });
    assert.equal(r.headers.get('access-control-allow-origin'), 'https://squashblossom.github.io');
    const { id } = await r.json();
    assert.equal(id.length, 22);
    assert.equal((await fetch(`${base}/api/push/subscriptions/${id}/test`, { method: 'POST', headers: H })).status, 200);
    assert.equal(sent[0].k, 'test');
    assert.equal((await fetch(base + '/api/push/subscriptions', { method: 'POST', headers: { ...H, Origin: 'https://evil.example' }, body: '{}' })).status, 403);
    assert.equal((await fetch(base + '/api/push/subscriptions', { method: 'POST', headers: H, body: '{"subscription":{"endpoint":"http://x"}}' })).status, 400);
    assert.equal((await fetch(`${base}/api/push/subscriptions/${id}`, { method: 'DELETE', headers: H })).status, 204);
    assert.equal(db.count(), 0);
  } finally { srv.close(); }
});
