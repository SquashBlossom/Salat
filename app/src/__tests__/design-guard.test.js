/* DESIGN GUARD — keeps the design kit the single source of truth.
   It fails when a raw design value is typed outside the tokens, or a screen
   builds its own control instead of using the kit. Fix by using a token or a
   kit component; if the design truly needs something new, add it to the kit first. */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = join(import.meta.dirname, '..');
const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? (f === '__tests__' ? [] : walk(p)) : [p];
});
const files = walk(SRC);
const rel = (p) => relative(SRC, p);
const css = files.filter((p) => p.endsWith('.css') && !p.endsWith('tokens.css'));
const jsx = files.filter((p) => /\.(jsx|js)$/.test(p) && !p.includes('/ui/'));

/** Every match of `re` in the files, as "file: snippet", skipping comments. */
function offenders(list, re, skip = () => false) {
  const out = [];
  for (const p of list) {
    const text = readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of text.matchAll(re)) if (!skip(m[0], p)) out.push(`${rel(p)}: ${m[0].slice(0, 80)}`);
  }
  return out;
}

describe('design guard: tokens only', () => {
  it('no colour is typed in by hand outside tokens.css and theme.js', () => {
    const list = files.filter((p) => !p.endsWith('tokens.css') && !p.endsWith('core/theme.js') && /\.(css|jsx|js)$/.test(p));
    expect(offenders(list, /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])|rgba?\(\s*\d/g)).toEqual([]);
  });

  it('every font size is a type token', () => {
    expect(offenders(css, /font-size:\s*[^;}]+/g, (m) => /^font-size:\s*var\(--fs-/.test(m))).toEqual([]);
  });

  it('every corner is a radius token', () => {
    expect(offenders(css, /border-radius:\s*[^;}]+/g, (m) => !/\d+px/.test(m.replace(/var\([^)]*\)/g, '')))).toEqual([]);
  });

  it('every animation and transition uses motion tokens', () => {
    expect(offenders(css, /(?:transition|animation):\s*[^;}]+/g,
      (m) => !/\d*\.?\d+m?s\b/.test(m.replace(/var\([^)]*\)/g, '').replace(/calc\([^)]*\)/g, '').replace(/\b0s\b/g, '')) || /none/.test(m))).toEqual([]);
  });
});

describe('design guard: screens use kit components', () => {
  it('no screen builds its own button, card, chip, switch, notice or tag', () => {
    const own = /className=["'{`][^"'}`]*\b(btn|card|chip|switch|notice|icon-btn|segmented|status-pill|swatch|toast|sheet|scrim)\b/g;
    expect(offenders(jsx, own)).toEqual([]);
  });

  it('inline styles hold only tokens or computed values', () => {
    expect(offenders(jsx, /style=\{\{[^}]*\}\}/g, (m) => !/#[0-9a-fA-F]{3,6}|\d+px|fontSize:\s*\d/.test(m))).toEqual([]);
  });
});
