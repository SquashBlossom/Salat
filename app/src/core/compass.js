/* Compass heading for the SCREEN, not the device.
   Owns: turning a raw compass reading into "which way is the top of the screen pointing".
   Refuses: drawing, permissions.

   Why: iOS reports webkitCompassHeading for the device's top edge (portrait).
   Turn an iPad on its side and the screen rotates 90°, but that reading does not,
   so the dial is off by 90°. Adding the screen's rotation fixes it.

   Example: iPad turned counter-clockwise (window.orientation = 90), person faces north.
   The device's top edge points west (270°). The top of the screen points north:
   270 + 90 = 360 → 0°. */

/** How far the screen is rotated from the device's natural portrait, in degrees (0, 90, -90, 180). */
export function screenAngle(win = globalThis) {
  if (typeof win.orientation === 'number') return win.orientation;   // iOS Safari
  const a = win.screen?.orientation?.angle;                          // everyone else
  return typeof a === 'number' ? a : 0;
}

/** The compass heading of the top of the screen, 0–360. deviceHeading: 0 = device top points north. */
export function screenHeading(deviceHeading, angle) {
  return (((deviceHeading + angle) % 360) + 360) % 360;
}

/** Device heading from a deviceorientation event, or null if the event has none. */
export function deviceHeading(e) {
  if (e.webkitCompassHeading != null) return e.webkitCompassHeading; // iOS: clockwise from north
  if (e.absolute !== false && e.alpha != null) return 360 - e.alpha; // others: alpha is counter-clockwise
  return null;
}
