/* SHEET — slides up over the page, with a navigation bar and pages you can open inside it
   (like Settings > Location on iPhone). Owns: the stack of pages, the nav bar, back, Done.
   Refuses: page content.

   <Sheet open title="Settings" onClose={…} pages={{ location: { title: 'Location', render: (nav) => … } }}>
     {(nav) => <Row title="Location" chevron onClick={() => nav.push('location')} />}
   </Sheet>                                                                                        */
import { useEffect, useState } from 'react';
import { Icon } from './icons.jsx';

export function Sheet({ open, title, onClose, pages = {}, children }) {
  const [stack, setStack] = useState([]);           // ids of pages opened on top of the root
  useEffect(() => { if (!open) { const t = setTimeout(() => setStack([]), 300); return () => clearTimeout(t); } return undefined; }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') { if (stack.length) setStack((s) => s.slice(0, -1)); else onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, stack.length, onClose]);

  const nav = { push: (id) => setStack((s) => [...s, id]), pop: () => setStack((s) => s.slice(0, -1)), close: onClose };
  const depth = stack.length;
  const topTitle = depth ? pages[stack[depth - 1]]?.title : title;
  const backTitle = depth > 1 ? pages[stack[depth - 2]]?.title : title;
  const layers = [{ id: '__root', render: children }, ...stack.map((id) => ({ id, render: pages[id]?.render }))];

  return (
    <>
      <div className={'scrim' + (open ? ' on' : '')} onClick={onClose} />
      <div className={'sheet' + (open ? ' on' : '')} role="dialog" aria-modal="true" aria-label={topTitle} aria-hidden={!open}>
        <div className="grab" />
        <div className="nav-bar">
          <div className="nav-lead">
            {depth > 0 && (
              <button type="button" className="btn quiet pressable" onClick={nav.pop}><Icon name="left" /><span>{backTitle}</span></button>
            )}
          </div>
          <h2 className="nav-title">{topTitle}</h2>
          <div className="nav-trail"><button type="button" className="btn quiet pressable" onClick={onClose}><span>Done</span></button></div>
        </div>
        <div className="sheet-pages">
          {layers.map((l, i) => (
            <div key={l.id + i} className={'sheet-page' + (i < depth ? ' below' : '')} aria-hidden={i < depth}
              style={i === depth && i > 0 ? { animation: 'push var(--dur-base) var(--ease-sheet)' } : undefined}>
              <div className="stack-lg">{typeof l.render === 'function' ? l.render(nav) : l.render}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
