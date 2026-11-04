/* The settings sheet: colours, location, method, Asr, high latitude, format, adjustments.
   Owns: the form. Refuses: saving (it calls `update`, App saves). */
import { useEffect, useMemo, useRef, useState } from 'react';
import { CITIES } from '@salat/shared/cities';
import { METHODS, PRAYERS } from '@salat/shared/methods';
import { DEFAULT_SETTINGS } from '@salat/shared/schedule';
import { THEMES, contrast } from '../core/theme.js';
import { Icon } from './Icons.jsx';

export function SettingsSheet({ open, focusSearch, s, update, onClose, toast }) {
  const [q, setQ] = useState('');
  const search = useRef(null);
  const zones = useMemo(() => {
    try { return Intl.supportedValuesOf('timeZone'); } catch { return [...new Set(CITIES.map((c) => c[3]))].sort(); }
  }, []);
  const [manual, setManual] = useState(() => ({ lat: '', lng: '', zone: Intl.DateTimeFormat().resolvedOptions().timeZone }));

  useEffect(() => {
    if (open && focusSearch) { const t = setTimeout(() => search.current?.focus(), 350); return () => clearTimeout(t); }
    return undefined;
  }, [open, focusSearch]);

  const results = q.trim() ? CITIES.filter((c) => c[0].toLowerCase().includes(q.trim().toLowerCase())).slice(0, 40) : null;
  const moved = s.theme === 'custom'
    ? [['accent', 'Primary'], ['warn', 'Second'], ['ok', 'Third']].filter(([k]) => contrast(s.custom[k], s.custom.bg) < 3.6).map(([, n]) => n)
    : [];

  const gps = () => {
    if (!navigator.geolocation) { toast('This browser has no location access.'); return; }
    toast('Finding you…');
    navigator.geolocation.getCurrentPosition((pos) => {
      let zone = 'UTC';
      try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { /* keep UTC */ }
      update({ loc: { name: 'My location', lat: pos.coords.latitude, lng: pos.coords.longitude, zone } });
      toast('Using your current location');
    }, () => toast('Location unavailable. Search for a city instead.'), { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
  };

  const applyManual = () => {
    const la = parseFloat(manual.lat), ln = parseFloat(manual.lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln) || Math.abs(la) > 90 || Math.abs(ln) > 180) { toast('Check the latitude and longitude.'); return; }
    update({ loc: { name: la.toFixed(3) + ', ' + ln.toFixed(3), lat: la, lng: ln, zone: manual.zone } });
    toast('Coordinates applied');
  };

  const clampAdj = (v, lo, hi) => Math.max(lo, Math.min(hi, +v || 0));

  return (
    <>
      <div className={'scrim' + (open ? ' on' : '')} onClick={onClose} />
      <div className={'sheet' + (open ? ' on' : '')} role="dialog" aria-modal="true" aria-label="Settings" aria-hidden={!open}>
        <div className="grab" />
        <h2>Settings</h2>

        <div className="field">
          <label>Colour scheme</label>
          <div className="themes">
            {THEMES.map((t) => (
              <button key={t.id} type="button" className="swatch" aria-pressed={s.theme === t.id} onClick={() => update({ theme: t.id })}>
                <span className="chips">{(t.id === 'custom' ? [s.custom.bg, s.custom.accent, s.custom.warn, s.custom.ok] : t.chips).map((c, i) => <i key={i} style={{ background: c }} />)}</span>
                {t.name}
              </button>
            ))}
          </div>
          <div className={'custompanel' + (s.theme === 'custom' ? ' on' : '')}>
            <div className="colorgrid">
              {[['bg', 'Background'], ['accent', 'Primary · now'], ['warn', 'Second · upcoming'], ['ok', 'Third · completed']].map(([k, label]) => (
                <div key={k}><label htmlFor={'c-' + k}>{label}</label>
                  <input type="color" id={'c-' + k} value={s.custom[k]} onChange={(e) => update({ theme: 'custom', custom: { ...s.custom, [k]: e.target.value } })} /></div>
              ))}
            </div>
            {moved.length > 0 && <p className="adjnote on">{moved.join(' and ')}{moved.length > 1 ? ' highlights were' : ' highlight was'} too close to the background, so they have been lightened to stay readable.</p>}
            <button className="btn" style={{ marginTop: 12, padding: 11, fontSize: 13 }} onClick={() => { update({ custom: { ...DEFAULT_SETTINGS.custom } }); toast('Custom colours reset'); }}>Reset custom colours</button>
          </div>
        </div>

        <div className="field">
          <label htmlFor="citySearch">Location</label>
          <div className="locnow">{s.loc.name}</div>
          <input ref={search} type="search" id="citySearch" placeholder="Search 278 cities worldwide" autoComplete="off" autoCorrect="off" spellCheck="false"
            value={q} onChange={(e) => setQ(e.target.value)} />
          {results && (
            <div className="results on">
              {results.length ? results.map((c) => (
                <button key={c[0]} type="button" onClick={() => { update({ loc: { name: c[0], lat: c[1], lng: c[2], zone: c[3] } }); setQ(''); toast(c[0]); }}>{c[0]}</button>
              )) : <div className="none">No match. Try a larger nearby city, use your current location, or enter coordinates below.</div>}
            </div>
          )}
        </div>
        <button className="btn" style={{ marginBottom: 14 }} onClick={gps}><Icon name="pin" />Use my current location</button>

        <details>
          <summary>Enter coordinates manually</summary>
          <div className="coords">
            <div><label className="eyebrow" htmlFor="mLat">Latitude</label><input type="number" id="mLat" step="0.0001" min="-90" max="90" placeholder="40.6782" value={manual.lat} onChange={(e) => setManual({ ...manual, lat: e.target.value })} /></div>
            <div><label className="eyebrow" htmlFor="mLng">Longitude</label><input type="number" id="mLng" step="0.0001" min="-180" max="180" placeholder="-73.9442" value={manual.lng} onChange={(e) => setManual({ ...manual, lng: e.target.value })} /></div>
          </div>
          <label className="eyebrow" htmlFor="mZone">Time zone</label>
          <select id="mZone" style={{ marginBottom: 10 }} value={manual.zone} onChange={(e) => setManual({ ...manual, zone: e.target.value })}>
            {zones.map((z) => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}
          </select>
          <button className="btn" onClick={applyManual}>Use these coordinates</button>
        </details>

        <div className="field">
          <label htmlFor="fMethod">Calculation method</label>
          <select id="fMethod" value={s.method} onChange={(e) => update({ method: e.target.value })}>
            {Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Asr calculation</label>
          <div className="seg">
            <button aria-pressed={s.asr === 1} onClick={() => update({ asr: 1 })}>Standard</button>
            <button aria-pressed={s.asr === 2} onClick={() => update({ asr: 2 })}>Hanafi</button>
          </div>
        </div>

        <div className="field">
          <label htmlFor="fHiLat">High latitude rule</label>
          <select id="fHiLat" value={s.hiLat} onChange={(e) => update({ hiLat: e.target.value })}>
            <option value="angle">Angle based (recommended)</option>
            <option value="seventh">One seventh of the night</option>
            <option value="middle">Middle of the night</option>
            <option value="none">None</option>
          </select>
        </div>
        <p className="hint">Only used where the sun never dips far enough for Fajr or Isha to occur, roughly above 48° latitude in summer. Below that it changes nothing.</p>

        <div className="field">
          <label>Time format</label>
          <div className="seg">
            <button aria-pressed={s.fmt === 12} onClick={() => update({ fmt: 12 })}>12-hour</button>
            <button aria-pressed={s.fmt === 24} onClick={() => update({ fmt: 24 })}>24-hour</button>
          </div>
        </div>

        <div className="field">
          <label>Manual adjustment (minutes)</label>
          <div className="adjgrid">
            {PRAYERS.map((p) => (
              <div key={p.k}><label htmlFor={'adj-' + p.k}>{p.en}</label>
                <input type="number" id={'adj-' + p.k} step="1" min="-60" max="60" value={s.adj[p.k] || 0}
                  onChange={(e) => update({ adj: { ...s.adj, [p.k]: clampAdj(e.target.value, -60, 60) } })} /></div>
            ))}
          </div>
        </div>
        <p className="hint">Use this to match your local masjid's printed timetable exactly.</p>

        <div className="field">
          <label htmlFor="fAlarm">Calendar alert, minutes before</label>
          <input type="number" id="fAlarm" min="0" max="60" step="5" value={s.alarm} onChange={(e) => update({ alarm: clampAdj(e.target.value, 0, 60) })} />
        </div>

        <button className="btn primary" onClick={onClose}>Done</button>
      </div>
    </>
  );
}
