/* The settings sheet: colours, location, method, Asr, high latitude, format, adjustments.
   Owns: the form. Refuses: saving (it calls `update`, App saves). */
import { useEffect, useMemo, useRef, useState } from 'react';
import { CITIES } from '@salat/shared/cities';
import { METHODS, PRAYERS } from '@salat/shared/methods';
import { DEFAULT_SETTINGS } from '@salat/shared/schedule';
import { THEMES, contrast } from '../core/theme.js';
import { Button, Field, Label, Segmented, Sheet, Swatch } from '../ui/index.jsx';

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
    <Sheet open={open} title="Settings" onClose={onClose}>
      <Field label="Colour scheme">
        <div className="swatches">
          {THEMES.map((t) => (
            <Swatch key={t.id} on={s.theme === t.id} onClick={() => update({ theme: t.id })}
              colors={t.id === 'custom' ? [s.custom.bg, s.custom.accent, s.custom.warn, s.custom.ok] : t.chips}>{t.name}</Swatch>
          ))}
        </div>
        {s.theme === 'custom' && (
          <div className="well">
            {[['bg', 'Background'], ['accent', 'Primary · now'], ['warn', 'Second · upcoming'], ['ok', 'Third · completed']].map(([k, label]) => (
              <div key={k}><label className="mini-label" htmlFor={'c-' + k}>{label}</label>
                <input type="color" id={'c-' + k} value={s.custom[k]} onChange={(e) => update({ theme: 'custom', custom: { ...s.custom, [k]: e.target.value } })} /></div>
            ))}
          </div>
        )}
        {moved.length > 0 && <p className="hint">{moved.join(' and ')}{moved.length > 1 ? ' highlights were' : ' highlight was'} too close to the background, so they have been lightened to stay readable.</p>}
        {s.theme === 'custom' && <Button size="sm" onClick={() => { update({ custom: { ...DEFAULT_SETTINGS.custom } }); toast('Custom colours reset'); }}>Reset custom colours</Button>}
      </Field>

      <Field label="Location" htmlFor="citySearch">
        <div className="current">{s.loc.name}</div>
        <input ref={search} type="search" id="citySearch" placeholder="Search 278 cities worldwide" autoComplete="off" autoCorrect="off" spellCheck="false"
          value={q} onChange={(e) => setQ(e.target.value)} />
        {results && (
          <div className="picker">
            {results.length ? results.map((c) => (
              <button key={c[0]} type="button" onClick={() => { update({ loc: { name: c[0], lat: c[1], lng: c[2], zone: c[3] } }); setQ(''); toast(c[0]); }}>{c[0]}</button>
            )) : <div className="none">No match. Try a larger nearby city, use your current location, or enter coordinates below.</div>}
          </div>
        )}
        <Button icon="pin" onClick={gps}>Use my current location</Button>
        <details>
          <summary>Enter coordinates manually</summary>
          <div className="stack">
            <div className="duo">
              <div><Label htmlFor="mLat">Latitude</Label><input type="number" id="mLat" step="0.0001" min="-90" max="90" placeholder="40.6782" value={manual.lat} onChange={(e) => setManual({ ...manual, lat: e.target.value })} /></div>
              <div><Label htmlFor="mLng">Longitude</Label><input type="number" id="mLng" step="0.0001" min="-180" max="180" placeholder="-73.9442" value={manual.lng} onChange={(e) => setManual({ ...manual, lng: e.target.value })} /></div>
            </div>
            <div><Label htmlFor="mZone">Time zone</Label>
              <select id="mZone" value={manual.zone} onChange={(e) => setManual({ ...manual, zone: e.target.value })}>
                {zones.map((z) => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}
              </select></div>
            <Button onClick={applyManual}>Use these coordinates</Button>
          </div>
        </details>
      </Field>

      <Field label="Calculation method" htmlFor="fMethod">
        <select id="fMethod" value={s.method} onChange={(e) => update({ method: e.target.value })}>
          {Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
        </select>
      </Field>

      <Field label="Asr calculation">
        <Segmented label="Asr calculation" options={[[1, 'Standard'], [2, 'Hanafi']]} value={s.asr} onChange={(v) => update({ asr: v })} />
      </Field>

      <Field label="High latitude rule" htmlFor="fHiLat"
        hint="Only used where the sun never dips far enough for Fajr or Isha to occur, roughly above 48° latitude in summer. Below that it changes nothing.">
        <select id="fHiLat" value={s.hiLat} onChange={(e) => update({ hiLat: e.target.value })}>
          <option value="angle">Angle based (recommended)</option>
          <option value="seventh">One seventh of the night</option>
          <option value="middle">Middle of the night</option>
          <option value="none">None</option>
        </select>
      </Field>

      <Field label="Time format">
        <Segmented label="Time format" options={[[12, '12-hour'], [24, '24-hour']]} value={s.fmt} onChange={(v) => update({ fmt: v })} />
      </Field>

      <Field label="Manual adjustment (minutes)" hint="Use this to match your local masjid's printed timetable exactly.">
        <div className="adjust-grid">
          {PRAYERS.map((p) => (
            <div key={p.k}><label className="mini-label" htmlFor={'adj-' + p.k}>{p.en}</label>
              <input type="number" id={'adj-' + p.k} step="1" min="-60" max="60" value={s.adj[p.k] || 0}
                onChange={(e) => update({ adj: { ...s.adj, [p.k]: clampAdj(e.target.value, -60, 60) } })} /></div>
          ))}
        </div>
      </Field>

      <Field label="Calendar alert, minutes before" htmlFor="fAlarm">
        <input type="number" id="fAlarm" min="0" max="60" step="5" value={s.alarm} onChange={(e) => update({ alarm: clampAdj(e.target.value, 0, 60) })} />
      </Field>

      <Button variant="primary" onClick={onClose}>Done</Button>
    </Sheet>
  );
}
