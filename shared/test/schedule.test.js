import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withDefaults, upcomingAlerts, events, wallToDate, partsIn } from '../schedule.js';

const base = withDefaults({ alerts: { enabled: true } });
const noon = new Date('2026-11-04T17:00:00Z'); // 12:00 in New York

test('alerts are off until the person turns them on', () => {
  assert.deepEqual(upcomingAlerts(withDefaults({}), noon), []);
});

test('alerts come in time order, all in the future, sunrise off by default', () => {
  const list = upcomingAlerts(base, noon, 2);
  assert.ok(list.length >= 8);
  for (let i = 1; i < list.length; i++) assert.ok(list[i].at >= list[i - 1].at);
  assert.ok(list.every((a) => a.at > noon.getTime()));
  assert.ok(!list.some((a) => a.k === 'sunrise'));
  const firstAfter = events(base, noon, 3).find((e) => e.date > noon && e.k !== 'sunrise');
  assert.equal(list[0].k, firstAfter.k);
});

test('lead time moves the alert earlier by exactly that many minutes', () => {
  const s = withDefaults({ alerts: { enabled: true, lead: 10 } });
  const [a] = upcomingAlerts(s, noon, 1);
  assert.equal(a.prayerAt - a.at, 10 * 60000);
});

test('turning one prayer off removes only that prayer', () => {
  const s = withDefaults({ alerts: { enabled: true, prayers: { asr: false } } });
  const list = upcomingAlerts(s, noon, 2);
  assert.ok(!list.some((a) => a.k === 'asr'));
  assert.ok(list.some((a) => a.k === 'maghrib'));
});

test('wall clock round trip across a DST change', () => {
  const d = wallToDate(2026, 11, 1, 13.5, 'America/New_York'); // the day clocks fall back
  const p = partsIn(d, 'America/New_York');
  assert.deepEqual([p.h, p.mi], [13, 30]);
});

test('events cover yesterday, today and tomorrow', () => {
  const ev = events(base, noon, 3);
  assert.equal(new Set(ev.map((e) => e.dayKey)).size, 3);
});

test('alert words: time first, Arabic isolated so it cannot split the time', async () => {
  const { alertText } = await import('../schedule.js');
  const t = alertText({ en: 'Maghrib', ar: 'المغرب' }, 0, () => '4:49 PM');
  assert.equal(t.title, "It's time for Maghrib");
  assert.equal(t.body, '4:49 PM · ⁨المغرب⁩');
  assert.equal(alertText({ en: 'Asr', ar: 'العصر' }, 10, () => '2:26 PM').title, 'Asr in 10 min');
});
