/* THE SALAT UI KIT — every reusable building block.
   Screens use these and nothing else for controls. Each one maps to a block in
   styles/components.css and a section in the kit page (kit.html).
   Variants are fixed lists: a new look is a new variant here, never a one-off on a screen. */
import { Icon } from './icons.jsx';

export { Icon, IconSprite, ICON_NAMES } from './icons.jsx';
export { PopUpMenu, MenuButton } from './Menu.jsx';
export { ListSection, Row, Stepper } from './List.jsx';
export { Sheet } from './Sheet.jsx';

const cx = (...a) => a.filter(Boolean).join(' ');

/** BUTTON. variant: 'secondary' (gray, default) | 'primary' (filled) | 'tinted' | 'quiet' (plain) | 'destructive'.
    size: 'lg' | 'md' | 'sm'. hug: as wide as its words instead of full width. One line; long words end in "…". */
export function Button({ variant = 'secondary', size = 'md', hug = false, icon, children, ...rest }) {
  return (
    <button type="button" className={cx('btn pressable', variant !== 'secondary' && variant, size !== 'md' && size, hug && 'hug')} {...rest}>
      {icon && <Icon name={icon} />}{children != null && <span>{children}</span>}
    </button>
  );
}

/** ICON BUTTON. Always needs a label, read aloud by screen readers. */
export function IconButton({ icon, label, ...rest }) {
  return <button type="button" className="icon-btn pressable" aria-label={label} {...rest}><Icon name={icon} /></button>;
}

/** CARD. padded: true for content cards; false when the inside has its own rows. */
export function Card({ padded = false, as: Tag = 'section', className, children, ...rest }) {
  return <Tag className={cx('card', padded && 'padded', className)} {...rest}>{children}</Tag>;
}

/** NOTICE. tone: 'info' (default) | 'caution'. One plain sentence or two. */
export function Notice({ tone = 'info', icon, children }) {
  return (
    <div className={cx('notice', tone === 'caution' && 'caution')} role="note">
      <Icon name={icon || (tone === 'caution' ? 'alert' : 'bell')} size="sm" /><span>{children}</span>
    </div>
  );
}

/** CHIP. A toggle; many in a ChipRow can be on at once. */
export function Chip({ on, icon, children, ...rest }) {
  return <button type="button" className="chip pressable" aria-pressed={!!on} {...rest}>{icon && <Icon name={icon} size="sm" />}{children}</button>;
}
export const ChipRow = ({ children }) => <div className="chip-row">{children}</div>;

/** SEGMENTED. Pick exactly one of 2 to 5, on one row. options: [[value, label], ...]
    More than 5 options? Use a PopUpMenu instead (Apple's rule for iPhone). */
export function Segmented({ options, value, onChange, label }) {
  if (import.meta.env.DEV && options.length > 5) console.error(`Segmented "${label}" has ${options.length} options; use a PopUpMenu.`);
  const i = Math.max(0, options.findIndex(([v]) => v === value));
  return (
    <div className="segmented" role="group" aria-label={label}>
      <span className="thumb" aria-hidden="true"
        style={{ width: `calc((100% - 4px) / ${options.length})`, transform: `translateX(${i * 100}%)` }} />
      {options.map(([v, text]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{text}</button>
      ))}
    </div>
  );
}

/** SWITCH. Turns a whole feature on or off. */
export function Switch({ on, label, onChange }) {
  return <button type="button" className="switch" role="switch" aria-checked={!!on} aria-label={label} onClick={() => onChange(!on)} />;
}

/** SLIDER. Pick a value along a track, like iOS. ticks: [{at, tone: 'now'|'next'|'done', label}] marks on the track. */
export function Slider({ value, min = 0, max = 100, step = 1, onChange, label, valueText, ticks = [] }) {
  const pct = (v) => ((v - min) / (max - min)) * 100;
  return (
    <div className="slider">
      <div className="slider-ticks" aria-hidden="true">
        {ticks.map((t) => <i key={t.at + t.label} className={t.tone} style={{ left: pct(t.at) + '%' }} title={t.label} />)}
      </div>
      <input type="range" min={min} max={max} step={step} value={value} aria-label={label} aria-valuetext={valueText}
        style={{ '--fill': pct(value) + '%' }} onChange={(e) => onChange(+e.target.value)} />
    </div>
  );
}

/** TAG. A tiny state word inside a row. tone: 'now' | 'next'. */
export const Tag = ({ tone, children }) => <span className={cx('tag', tone)}>{children}</span>;

/** STATUS PILL. A quiet status with a dot. tone: 'neutral' | 'good'. */
export const StatusPill = ({ tone = 'neutral', children }) => <span className={cx('status-pill', tone === 'good' && 'good')}>{children}</span>;

/** LABEL (eyebrow). Small uppercase words above a group. */
export const Label = ({ children, htmlFor, as: Tag = htmlFor ? 'label' : 'div' }) =>
  <Tag className="t-label" htmlFor={htmlFor}>{children}</Tag>;

/** FIELD. A label above a control, with an optional hint below. */
export function Field({ label, htmlFor, hint, children }) {
  return (
    <div className="field">
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

/** TOAST. A short confirmation. Shows while `message` is not empty. */
export const Toast = ({ message }) => <div className={cx('toast', message && 'on')} role="status">{message}</div>;

/** SWATCH. A theme choice showing its colours as dots. */
export function Swatch({ on, colors, children, ...rest }) {
  return (
    <button type="button" className="swatch pressable" aria-pressed={!!on} {...rest}>
      <span className="dots">{colors.map((c, i) => <i key={i} style={{ background: c }} />)}</span>{children}
    </button>
  );
}
