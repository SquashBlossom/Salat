/* MENU — Apple-style pop-up and pull-down menus, replacing web <select> dropdowns.
   Owns: opening next to its button, growing from it, keyboard use, closing.
   Refuses: what the choices mean (the caller passes items and onSelect).

   PopUpMenu  pick one of many; the button shows the current choice   (Apple: pop-up button)
   MenuButton a list of actions behind one button                      (Apple: pull-down button)

   Keyboard: Enter/Space/↓ opens · ↑↓ moves · Home/End · Enter picks · Esc closes.
   The menu never animates when opened from the keyboard (it is used often there). */
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './icons.jsx';

function place(trigger, menu) {
  const r = trigger.getBoundingClientRect();
  const m = menu.getBoundingClientRect();
  const full = Math.max(m.height, menu.scrollHeight);
  const gap = 6, edge = 12, vw = window.innerWidth, vh = window.innerHeight;
  const left = Math.min(Math.max(edge, r.right - m.width), vw - m.width - edge);
  const spaceBelow = vh - edge - (r.bottom + gap);
  const spaceAbove = r.top - gap - edge;
  // Prefer below; go above only if it fits there and not below; if neither fits, use the roomier side and scroll.
  const below = full <= spaceBelow || (full > spaceAbove && spaceBelow >= spaceAbove);
  const maxHeight = Math.min(full, below ? spaceBelow : spaceAbove);
  const top = below ? r.bottom + gap : r.top - gap - maxHeight;
  const originX = r.left + r.width / 2 - left;
  return { left, top, maxHeight, origin: `${Math.max(0, Math.min(m.width, originX))}px ${below ? 'top' : 'bottom'}` };
}

function MenuSurface({ anchor, items, value, onPick, onClose, label, fromKeyboard }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: -9999, top: -9999, origin: 'top right' });
  const enabled = items.filter((i) => i && !i.separator && !i.disabled);
  const startIdx = Math.max(0, enabled.findIndex((i) => i.value === value));

  useLayoutEffect(() => { if (anchor.current && ref.current) setPos(place(anchor.current, ref.current)); }, [anchor]);
  useEffect(() => {
    const btns = ref.current?.querySelectorAll('[role^=menuitem]:not([disabled])');
    btns?.[startIdx]?.focus({ preventScroll: true });
    const onKey = (e) => {
      const list = [...(ref.current?.querySelectorAll('[role^=menuitem]:not([disabled])') || [])];
      const i = list.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); onClose(true); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length]?.focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length]?.focus(); }
      else if (e.key === 'Home') { e.preventDefault(); list[0]?.focus(); }
      else if (e.key === 'End') { e.preventDefault(); list.at(-1)?.focus(); }
      else if (e.key === 'Tab') { e.preventDefault(); onClose(true); }
    };
    const onResize = () => onClose(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); };
  }, [onClose, startIdx]);

  const pickable = value !== undefined;
  return createPortal(
    <>
      <div className="menu-backdrop" onClick={() => onClose(false)} />
      <div ref={ref} className="menu" role="menu" aria-label={label}
        style={{ left: pos.left, top: pos.top, maxHeight: pos.maxHeight, '--menu-origin': pos.origin, animation: fromKeyboard ? 'none' : undefined }}>
        {items.map((it, i) => it.separator
          ? <div key={'s' + i} className="menu-sep" role="separator" />
          : (
            <button key={String(it.value ?? it.label)} type="button" disabled={it.disabled}
              role={pickable ? 'menuitemradio' : 'menuitem'} aria-checked={pickable ? it.value === value : undefined}
              className={'menu-item' + (it.destructive ? ' destructive' : '')}
              onClick={() => { onPick(it); onClose(true); }}>
              {pickable && (it.value === value ? <span className="check"><Icon name="check" size="sm" /></span> : <span className="spacer" />)}
              <span className="label">{it.label}{it.detail && <small>{it.detail}</small>}</span>
              {it.icon && <Icon name={it.icon} size="sm" />}
            </button>
          ))}
      </div>
    </>,
    document.body,
  );
}

function useMenu() {
  const anchor = useRef(null);
  const [open, setOpen] = useState(false);
  const [kb, setKb] = useState(false);
  const close = useCallback((refocus) => { setOpen(false); if (refocus) anchor.current?.focus(); }, []);
  const triggerProps = {
    ref: anchor, 'aria-haspopup': 'menu', 'aria-expanded': open,
    onClick: (e) => { setKb(e.detail === 0); setOpen(true); },
    onKeyDown: (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setKb(true); setOpen(true); } },
  };
  return { anchor, open, close, kb, triggerProps };
}

/**
 * POP-UP MENU: pick one. items: [{value, label, detail?, disabled?} | {separator:true}]
 * look: 'inline' (sits at the end of a list row) | 'boxed' (a full-width field)
 */
export function PopUpMenu({ items, value, onChange, label, look = 'inline' }) {
  const m = useMenu();
  const id = useId();
  const current = items.find((i) => i && i.value === value);
  return (
    <>
      <button type="button" id={id} className={'menu-trigger pressable' + (look === 'boxed' ? ' boxed' : '')} aria-label={`${label}: ${current?.label ?? ''}`} {...m.triggerProps}>
        <span>{current?.label ?? 'Choose'}</span><Icon name="updown" size="sm" />
      </button>
      {m.open && <MenuSurface anchor={m.anchor} items={items} value={value} label={label} fromKeyboard={m.kb}
        onPick={(it) => onChange(it.value)} onClose={m.close} />}
    </>
  );
}

/** PULL-DOWN MENU: a list of actions. items: [{label, onSelect, icon?, destructive?} | {separator:true}] */
export function MenuButton({ items, label, icon = 'more', children }) {
  const m = useMenu();
  return (
    <>
      <button type="button" className="icon-btn pressable" aria-label={label} {...m.triggerProps}>{children || <Icon name={icon} />}</button>
      {m.open && <MenuSurface anchor={m.anchor} items={items} label={label} fromKeyboard={m.kb}
        onPick={(it) => it.onSelect?.()} onClose={m.close} />}
    </>
  );
}
