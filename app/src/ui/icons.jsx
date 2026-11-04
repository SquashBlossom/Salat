/* ICONS — the whole set. 24×24 grid, 1.6 stroke, round ends, no fills, colour from the text.
   Use <Icon name="fajr" />. Sizes: sm (15) · md (20, default) · lg (22).
   To add an icon: draw it on the same grid and add its name to ICON_NAMES. */
export const ICON_NAMES = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha', 'gear', 'pin', 'left', 'right', 'cal',
  'compass', 'target', 'today', 'alert', 'globe', 'bell', 'lock', 'share', 'check', 'updown', 'more', 'clock', 'palette', 'sliders'];
export function IconSprite() {
  return (
    <svg style={{ display: 'none' }} aria-hidden="true">
      <symbol id="i-fajr" viewBox="0 0 24 24"><path d="M3 19h18M6.5 19a5.5 5.5 0 0 1 11 0M12 4.5v2M5.6 7.1l1.4 1.4M18.4 7.1L17 8.5M2.5 14h2M19.5 14h2"/></symbol>
      <symbol id="i-sunrise" viewBox="0 0 24 24"><path d="M3 19h18M7 19a5 5 0 0 1 10 0M12 3v6M9.2 5.8L12 3l2.8 2.8M4 14.5h2.2M17.8 14.5H20"/></symbol>
      <symbol id="i-dhuhr" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M3.5 12H6M18 12h2.5M5.9 5.9l1.7 1.7M16.4 16.4l1.7 1.7M18.1 5.9l-1.7 1.7M7.6 16.4l-1.7 1.7"/></symbol>
      <symbol id="i-asr" viewBox="0 0 24 24"><circle cx="8.5" cy="9" r="3.6"/><path d="M8.5 2.6v1.6M3.4 9H1.9M4.9 5.4L3.8 4.3M4.9 12.6l-1.1 1.1M12.6 5.4l1.1-1.1M3 19.5h18M11 19.5l6.5-6"/></symbol>
      <symbol id="i-maghrib" viewBox="0 0 24 24"><path d="M3 19h18M7 19a5 5 0 0 1 10 0M12 9.5v-6M9.2 6.7L12 9.5l2.8-2.8M4 14.5h2.2M17.8 14.5H20"/></symbol>
      <symbol id="i-isha" viewBox="0 0 24 24"><path d="M20 14.2A8 8 0 0 1 9.8 4 8.2 8.2 0 1 0 20 14.2Z"/><path d="M15.5 3.2l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5L13.4 5.3l1.5-.6z"/></symbol>
      <symbol id="i-gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.5 12a7.5 7.5 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2-1.2L14.6 3H10.4l-.4 2.6a7.5 7.5 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.5 7.5 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2 1.2l.4 2.6h4.2l.4-2.6a7.5 7.5 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.06-.4.1-.8.1-1.2Z"/></symbol>
      <symbol id="i-pin" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.8"/></symbol>
      <symbol id="i-left" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></symbol>
      <symbol id="i-right" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></symbol>
      <symbol id="i-cal" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4M8.5 14.5h2M8.5 17.5h7M13.5 14.5h2"/></symbol>
      <symbol id="i-compass" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.2"/><path d="M15.6 8.4l-2 5.2-5.2 2 2-5.2z"/></symbol>
      <symbol id="i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.6"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/></symbol>
      <symbol id="i-today" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></symbol>
      <symbol id="i-alert" viewBox="0 0 24 24"><path d="M12 3.5 2.5 20h19L12 3.5Z"/><path d="M12 10v4M12 17h.01"/></symbol>
      <symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z"/></symbol>
      <symbol id="i-bell" viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></symbol>
      <symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></symbol>
      <symbol id="i-share" viewBox="0 0 24 24"><path d="M12 3v12M8 7l4-4 4 4M5 12v7.5h14V12"/></symbol>
      <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></symbol>
      <symbol id="i-updown" viewBox="0 0 24 24"><path d="M8 9.5l4-4 4 4M8 14.5l4 4 4-4"/></symbol>
      <symbol id="i-more" viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/></symbol>
      <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></symbol>
      <symbol id="i-palette" viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.8-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3Z"/><circle cx="7.5" cy="11.5" r="1.2"/><circle cx="10" cy="7.5" r="1.2"/><circle cx="14.5" cy="7.5" r="1.2"/></symbol>
      <symbol id="i-sliders" viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></symbol>
    </svg>
  );
}

export function Icon({ name, size = 'md' }) {
  if (import.meta.env.DEV && !ICON_NAMES.includes(name)) console.error(`Unknown icon "${name}". Add it to ui/icons.jsx.`);
  return <svg className={'icon' + (size === 'md' ? '' : ' ' + size)} aria-hidden="true"><use href={'#i-' + name} /></svg>;
}
