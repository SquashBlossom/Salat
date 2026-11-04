/* LIST — grouped, inset rows, like iOS Settings. The app's "menus" for settings.
   Owns: section, header/footer, row layout and accessories. Refuses: what a row does.

   <ListSection header="Prayer times" footer="One plain sentence.">
     <Row icon="target" title="Method" accessory={<PopUpMenu …/>} />
     <Row title="Location" value="Brooklyn" onClick={…} chevron />
     <Row title="Alerts" accessory={<Switch …/>} />
   </ListSection>                                                                  */
import { Icon } from './icons.jsx';

export function ListSection({ header, footer, children }) {
  return (
    <section className="list-section">
      {header && <h3 className="list-header">{header}</h3>}
      <div className="list">{children}</div>
      {footer && <p className="list-footer">{footer}</p>}
    </section>
  );
}

/**
 * ROW. A tappable row when onClick is set (then it is a button), otherwise a plain row.
 * icon: leading icon in a tinted square · title · sub: a second line · value: trailing text
 * accessory: a control at the end (Switch, PopUpMenu, Stepper) · chevron: opens a page · checked: a tick
 */
export function Row({ icon, title, sub, value, accessory, chevron, checked, onClick, children, ...rest }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} className={'row' + (icon ? ' has-icon' : '')} onClick={onClick} {...rest}>
      {icon && <span className="row-icon"><Icon name={icon} size="sm" /></span>}
      <span className="row-text">
        <span className="row-title">{title}</span>
        {sub && <span className="row-sub">{sub}</span>}
      </span>
      {children}
      {value != null && <span className="row-value">{value}</span>}
      {accessory}
      {checked && <span className="row-check"><Icon name="check" size="sm" /></span>}
      {chevron && <svg className="icon row-chevron" aria-hidden="true"><use href="#i-right" /></svg>}
    </Tag>
  );
}

/** STEPPER. − value + for small whole numbers, e.g. minutes. */
export function Stepper({ value, onChange, min = -60, max = 60, step = 1, label, format = (v) => (v > 0 ? '+' : '') + v }) {
  return (
    <span className="stepper" role="group" aria-label={label}>
      <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>−</button>
      <output aria-live="polite">{format(value)}</output>
      <button type="button" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>+</button>
    </span>
  );
}
