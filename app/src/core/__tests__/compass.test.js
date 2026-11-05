import { describe, it, expect } from 'vitest';
import { screenAngle, screenHeading, deviceHeading } from '../compass.js';

describe('compass on a rotated screen', () => {
  it('portrait: the heading is unchanged', () => {
    expect(screenHeading(58.5, 0)).toBe(58.5);
  });
  it('turned counter-clockwise (90): device top points west while the screen top points north', () => {
    expect(screenHeading(270, 90)).toBe(0);
  });
  it('turned clockwise (-90): device top points east while the screen top points north', () => {
    expect(screenHeading(90, -90)).toBe(0);
  });
  it('upside down (180)', () => {
    expect(screenHeading(180, 180)).toBe(0);
  });
  it('reads iOS window.orientation first, then screen.orientation.angle', () => {
    expect(screenAngle({ orientation: 90, screen: { orientation: { angle: 270 } } })).toBe(90);
    expect(screenAngle({ screen: { orientation: { angle: 270 } } })).toBe(270);
    expect(screenAngle({})).toBe(0);
  });
  it('reads the heading from iOS or from alpha', () => {
    expect(deviceHeading({ webkitCompassHeading: 12 })).toBe(12);
    expect(deviceHeading({ alpha: 90 })).toBe(270);
    expect(deviceHeading({ alpha: 90, absolute: false })).toBe(null);
    expect(deviceHeading({})).toBe(null);
  });
});
