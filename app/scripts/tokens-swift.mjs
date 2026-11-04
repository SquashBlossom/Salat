/* Turns app/src/styles/tokens.css into native/SalatTokens.swift, so the Swift app
   uses exactly the same colours, sizes, corners and timings as the web app.
   Run: npm run tokens:swift -w app      (re-run after any token change) */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const css = readFileSync(join(root, 'app/src/styles/tokens.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const camel = (s) => s.replace(/^-+/, '').replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const safe = (s) => (/^[0-9]/.test(s) ? '_' + s : s);

// Theme blocks: [data-theme="x"] { --name: #hex; ... }  (the first block is also :root)
const themes = {};
for (const m of css.matchAll(/((?::root,)?\[data-theme="(\w+)"\])\s*\{([^}]*)\}/g)) {
  const vars = {};
  for (const v of m[3].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) vars[v[1]] = v[2].trim();
  themes[m[2]] = vars;
}

function swiftColor(v) {
  let h = v.match(/^#([0-9a-f]{6})$/i);
  if (h) { const n = parseInt(h[1], 16); return `Color(red: ${((n >> 16) & 255) / 255}, green: ${((n >> 8) & 255) / 255}, blue: ${(n & 255) / 255})`; }
  h = v.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/);
  if (h) return `Color(red: ${h[1] / 255}, green: ${h[2] / 255}, blue: ${h[3] / 255}, opacity: ${h[4] ?? 1})`;
  return null;
}

// Plain :root scales (px, ms, unitless) — skip anything that is a var() or a font stack.
const scales = { px: [], ms: [], num: [] };
for (const block of css.matchAll(/(?<![,\]])\s:root\s*\{([^}]*)\}/g)) {
  for (const v of block[1].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    const [name, val] = [v[1], v[2].trim()];
    let m;
    if ((m = val.match(/^(-?[\d.]+)px$/))) scales.px.push([name, m[1]]);
    else if ((m = val.match(/^(-?[\d.]+)ms$/))) scales.ms.push([name, m[1]]);
    else if ((m = val.match(/^(-?[\d.]+)$/))) scales.num.push([name, m[1]]);
  }
}

const roles = Object.keys(themes.midnight || {}).filter((k) => swiftColor(themes.midnight[k]));
let out = `// SalatTokens.swift — MADE BY app/scripts/tokens-swift.mjs. Do not edit by hand.
// Source of truth: app/src/styles/tokens.css. Re-run: npm run tokens:swift -w app
import SwiftUI

/// One theme's colour roles. Names match the web kit (DESIGN.md).
public struct SalatPalette {
${roles.map((r) => `    public let ${safe(camel(r))}: Color`).join('\n')}
}

public enum SalatTheme: String, CaseIterable {
${Object.keys(themes).map((t) => `    case ${t}`).join('\n')}

    public var palette: SalatPalette {
        switch self {
${Object.entries(themes).map(([t, vars]) => `        case .${t}: return SalatPalette(\n${roles.map((r) => `            ${safe(camel(r))}: ${swiftColor(vars[r] || themes.midnight[r])}`).join(',\n')}\n        )`).join('\n')}
        }
    }
}

/// Sizes in points (1 CSS px = 1 pt).
public enum SalatSize {
${scales.px.map(([n, v]) => `    public static let ${safe(camel(n))}: CGFloat = ${v}`).join('\n')}
}

/// Durations in seconds.
public enum SalatMotion {
${scales.ms.map(([n, v]) => `    public static let ${safe(camel(n))}: Double = ${v / 1000}`).join('\n')}
    /// Strong ease-out, same curve as --ease-out on the web.
    public static let easeOut = Animation.timingCurve(0.23, 1, 0.32, 1, duration: dur(SalatMotion.durMenu))
    /// iOS sheet curve, same as --ease-sheet.
    public static let sheet = Animation.timingCurve(0.32, 0.72, 0, 1, duration: dur(SalatMotion.durBase))
    private static func dur(_ d: Double) -> Double { d }
}

/// Plain numbers (weights, line heights, press scale).
public enum SalatNumber {
${scales.num.map(([n, v]) => `    public static let ${safe(camel(n))}: Double = ${v}`).join('\n')}
}
`;
writeFileSync(join(root, 'native/SalatTokens.swift'), out);
console.log(`native/SalatTokens.swift: ${Object.keys(themes).length} themes × ${roles.length} colours, ${scales.px.length} sizes, ${scales.ms.length} durations`);
