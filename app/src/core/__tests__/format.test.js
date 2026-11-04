import { describe, it, expect } from 'vitest';
import { fmtTime, fmtFull, compassName, countdownParts } from '../format.js';
import { buildICS } from '../ics.js';
import { withDefaults } from '@salat/shared/schedule';

describe('time words', () => {
  it('12 and 24 hour', () => {
    expect(fmtFull(16.8167, 12)).toBe('4:49 PM');
    expect(fmtFull(16.8167, 24)).toBe('16:49');
    expect(fmtFull(0.25, 12)).toBe('12:15 AM');
    expect(fmtTime(NaN).t).toBe('--:--');
  });
  it('countdown drops hours under one hour', () => {
    expect(countdownParts(18 * 60000 + 32000)).toEqual([['18', 'm'], ['32', 's']]);
    expect(countdownParts(3600000 + 4 * 60000)).toEqual([[1, 'h'], ['04', 'm'], ['00', 's']]);
  });
  it('compass names', () => {
    expect(compassName(58.5)).toBe('ENE');
    expect(compassName(359)).toBe('N');
  });
});

describe('calendar export', () => {
  it('has 5 prayers a day, each with an alarm', () => {
    const ics = buildICS(withDefaults({}), 30, new Date('2026-11-04T17:00:00Z'));
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(150);
    expect(ics.match(/TRIGGER:-PT10M/g)).toHaveLength(150);
    expect(ics).toContain('UID:maghrib-20261104@salat');
  });
});
