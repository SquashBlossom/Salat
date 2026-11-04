/* SETTINGS — laid out like iPhone Settings: grouped rows, pop-up menus for choices,
   and pages that open inside the sheet for Location, Colours and Adjustments.
   Owns: the settings screens. Refuses: saving (it calls `update`; App saves). */
import { useEffect, useMemo, useRef, useState } from 'react';
import { CITIES } from '@salat/shared/cities';
import { METHODS, PRAYERS } from '@salat/shared/methods';
import { DEFAULT_SETTINGS } from '@salat/shared/schedule';
import { THEMES, contrast } from '../core/theme.js';
import { Button, ListSection, PopUpMenu, Row, Segmented, Sheet, Stepper, Swatch } from '../ui/index.jsx';

const HILAT = [
  { value: 'angle', label: 'Angle Based', detail: 'Recommended' },
  { value: 'seventh', label: 'One Seventh of the Night' },
  { value: 'middle', label: 'Middle of the Night' },
  { value: 'none', label: 'None' },
];
const ALARMS = [0, 5, 10, 15, 20, 30, 45, 60].map((m) => ({ value: m, label: m ? `${m} min before` : 'At prayer time' }));

/* ---- Location page ---- */
function LocationPage({ s, update, toast, nav, focusSearch }) {
  const [q, setQ] = useState('');
  const [manual, setManual] = useState(() => ({ lat: '', lng: '', zone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
  const search = useRef(null);
  const zones = useMemo(() => {
    try { return Intl.supportedValuesOf('timeZone'); } catch { return [...new Set(CITIES.map((c) => c[3]))].sort(); }
  }, []);
  useEffect(() => { if (focusSearch) { const t = setTimeout(() => search.current?.focus(), 350); return () => clearTimeout(t); } return undefined; }, [focusSearch]);
  const results = q.trim() ? CITIES.filter((c) => c[0].toLowerCase().includes(q.trim().toLowerCase())).slice(0, 40) : null;
  const pick = (loc, msg) => { update({ loc }); setQ(''); toast(msg); nav.pop(); };

  const gps = () => {
    if (!navigator.geolocation) { toast('This device has no location access.'); return; }
    toast('Finding you…');
    navigator.geolocation.getCurrentPosition((pos) => {
      let zone = 'UTC';
      try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { /* keep UTC */ }
      pick({ name: 'My location', lat: pos.coords.latitude, lng: pos.coords.longitude, zone }, 'Using your current location');
    }, () => toast('Location unavailable. Search for a city instead.'), { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
  };
  const applyManual = () => {
    const la = parseFloat(manual.lat), ln = parseFloat(manual.lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln) || Math.abs(la) > 90 || Math.abs(ln) > 180) { toast('Check the latitude and longitude.'); return; }
    pick({ name: la.toFixed(3) + ', ' + ln.toFixed(3), lat: la, lng: ln, zone: manual.zone }, 'Coordinates applied');
  };

  return (
    <>
      <input ref={search} type="search" id="citySearch" aria-label="Search cities" placeholder="Search 278 cities"
        autoComplete="off" autoCorrect="off" spellCheck="false" value={q} onChange={(e) => setQ(e.target.value)} />
      {results ? (
        <ListSection header={results.length ? `${results.length} ${results.length === 1 ? 'city' : 'cities'}` : undefined}>
          {results.length
            ? results.map((c) => <Row key={c[0]} title={c[0]} sub={c[3].replace(/_/g, ' ')} checked={c[0] === s.loc.name}
              onClick={() => pick({ name: c[0], lat: c[1], lng: c[2], zone: c[3] }, c[0])} />)
            : <p className="picker none">No match. Try a larger nearby city, or use your location.</p>}
        </ListSection>
      ) : (
        <>
          <ListSection>
            <Row icon="pin" title={s.loc.name} sub={`${s.loc.lat.toFixed(3)}, ${s.loc.lng.toFixed(3)} · ${s.loc.zone.replace(/_/g, ' ')}`} checked />
          </ListSection>
          <ListSection>
            <Row icon="compass" title="Use My Current Location" onClick={gps} />
          </ListSection>
          <ListSection header="Coordinates" footer="For anywhere not in the list.">
            <Row title="Latitude"><input className="row-input" type="number" inputMode="decimal" aria-label="Latitude" step="0.0001" min="-90" max="90" placeholder="40.6782" value={manual.lat} onChange={(e) => setManual({ ...manual, lat: e.target.value })} /></Row>
            <Row title="Longitude"><input className="row-input" type="number" inputMode="decimal" aria-label="Longitude" step="0.0001" min="-180" max="180" placeholder="-73.9442" value={manual.lng} onChange={(e) => setManual({ ...manual, lng: e.target.value })} /></Row>
            <Row title="Time Zone" accessory={<PopUpMenu label="Time zone" value={manual.zone} onChange={(z) => setManual({ ...manual, zone: z })}
              items={zones.map((z) => ({ value: z, label: z.replace(/_/g, ' ') }))} />} />
          </ListSection>
          <Button variant="tinted" onClick={applyManual}>Use These Coordinates</Button>
        </>
      )}
    </>
  );
}

/* ---- Colours page ---- */
function ColoursPage({ s, update, toast }) {
  const moved = s.theme === 'custom'
    ? [['accent', 'Now'], ['warn', 'Next'], ['ok', 'Done']].filter(([k]) => contrast(s.custom[k], s.custom.bg) < 3.6).map(([, n]) => n)
    : [];
  return (
    <>
      <div className="swatches">
        {THEMES.map((t) => (
          <Swatch key={t.id} on={s.theme === t.id} onClick={() => update({ theme: t.id })}
            colors={t.id === 'custom' ? [s.custom.bg, s.custom.accent, s.custom.warn, s.custom.ok] : t.chips}>{t.name}</Swatch>
        ))}
      </div>
      {s.theme === 'custom' && (
        <ListSection header="Custom colours" footer={moved.length ? `${moved.join(' and ')} ${moved.length > 1 ? 'were' : 'was'} too close to the background, so ${moved.length > 1 ? 'they have' : 'it has'} been lightened to stay readable.` : 'Everything else is worked out from these four, and kept readable.'}>
          {[['bg', 'Background'], ['accent', 'Now'], ['warn', 'Next'], ['ok', 'Done']].map(([k, label]) => (
            <Row key={k} title={label}>
              <input type="color" className="row-color" aria-label={label} value={s.custom[k]}
                onChange={(e) => update({ theme: 'custom', custom: { ...s.custom, [k]: e.target.value } })} />
            </Row>
          ))}
        </ListSection>
      )}
      {s.theme === 'custom' && <Button onClick={() => { update({ custom: { ...DEFAULT_SETTINGS.custom } }); toast('Custom colours reset'); }}>Reset Custom Colours</Button>}
    </>
  );
}

/* ---- Adjustments page ---- */
function AdjustPage({ s, update }) {
  return (
    <ListSection header="Minutes added to each time" footer="Match your local masjid's printed timetable exactly.">
      {PRAYERS.map((p) => (
        <Row key={p.k} icon={p.k} title={p.en}
          accessory={<Stepper label={p.en + ' adjustment'} value={s.adj[p.k] || 0} onChange={(v) => update({ adj: { ...s.adj, [p.k]: v } })} />} />
      ))}
    </ListSection>
  );
}

export function SettingsSheet({ open, focusSearch, s, update, onClose, toast }) {
  const adjCount = Object.values(s.adj).filter(Boolean).length;
  const theme = THEMES.find((t) => t.id === s.theme)?.name;
  const pages = {
    location: { title: 'Location', render: (nav) => <LocationPage s={s} update={update} toast={toast} nav={nav} focusSearch={focusSearch} /> },
    colours: { title: 'Colours', render: () => <ColoursPage s={s} update={update} toast={toast} /> },
    adjust: { title: 'Adjustments', render: () => <AdjustPage s={s} update={update} /> },
  };

  return (
    <Sheet open={open} title="Settings" onClose={onClose} pages={pages}>
      {(nav) => <SettingsRoot s={s} update={update} nav={nav} open={open} focusSearch={focusSearch} adjCount={adjCount} theme={theme} />}
    </Sheet>
  );
}

function SettingsRoot({ s, update, nav, open, focusSearch, adjCount, theme }) {
  // Opening from the place name in the header jumps straight to Location.
  useEffect(() => { if (open && focusSearch) nav.push('location'); }, [open, focusSearch]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <ListSection header="Place">
        <Row icon="pin" title="Location" value={s.loc.name} chevron onClick={() => nav.push('location')} />
      </ListSection>

      <ListSection header="Prayer times" footer="The high latitude rule only matters above about 48°, where Fajr or Isha may not occur in summer.">
        <Row icon="target" title="Method" accessory={<PopUpMenu label="Calculation method" value={s.method} onChange={(v) => update({ method: v })}
          items={Object.entries(METHODS).map(([k, v]) => ({ value: k, label: v.name }))} />} />
        <Row icon="asr" title="Asr" accessory={<div className="row-seg"><Segmented label="Asr calculation" options={[[1, 'Standard'], [2, 'Hanafi']]} value={s.asr} onChange={(v) => update({ asr: v })} /></div>} />
        <Row icon="globe" title="High Latitude" accessory={<PopUpMenu label="High latitude rule" value={s.hiLat} onChange={(v) => update({ hiLat: v })} items={HILAT} />} />
        <Row icon="sliders" title="Adjustments" value={adjCount ? `${adjCount} changed` : 'None'} chevron onClick={() => nav.push('adjust')} />
      </ListSection>

      <ListSection header="Display">
        <Row icon="palette" title="Colours" value={theme} chevron onClick={() => nav.push('colours')} />
        <Row icon="clock" title="Time Format" accessory={<div className="row-seg"><Segmented label="Time format" options={[[12, '12-hour'], [24, '24-hour']]} value={s.fmt} onChange={(v) => update({ fmt: v })} /></div>} />
      </ListSection>

      <ListSection header="Calendar export" footer="Used when you add 30 days of prayers to your calendar.">
        <Row icon="cal" title="Alert" accessory={<PopUpMenu label="Calendar alert" value={s.alarm} onChange={(v) => update({ alarm: v })} items={ALARMS} />} />
      </ListSection>
    </>
  );
}
