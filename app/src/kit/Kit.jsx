/* THE DESIGN KIT PAGE — a living catalogue of Salat's design language.
   Everything here is the real thing: real tokens, real components, real motion.
   If it looks right here, it looks right in the app. Opens at /kit.html. */
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Button, Card, Chip, ChipRow, Field, Icon, IconButton, IconSprite, ICON_NAMES, Label, ListSection, MenuButton, Notice,
  PopUpMenu, Row, Segmented, Sheet, StatusPill, Stepper, Swatch, Switch, Tag, Toast } from '../ui/index.jsx';
import { METHODS } from '@salat/shared/methods';

const SkyCompare = lazy(() => import('./SkyCompare.jsx'));
const MoonKit = lazy(() => import('./MoonKit.jsx'));
const PointKit = lazy(() => import('./PointKit.jsx'));

/* What each kit component becomes in the Swift app. Same names, same behaviour. */
const NATIVE = [
  ['Button · primary', 'Button(…).buttonStyle(.borderedProminent)'],
  ['Button · tinted', '.buttonStyle(.bordered) + .tint(.now)'],
  ['Button · secondary', '.buttonStyle(.bordered) + .tint(.gray)'],
  ['Button · quiet', '.buttonStyle(.borderless)'],
  ['Button · destructive', 'Button(role: .destructive)'],
  ['Button size lg · md · sm', '.controlSize(.large · .regular · .small)'],
  ['Pop-up menu', 'Picker(…).pickerStyle(.menu)'],
  ['Menu button', 'Menu { … } label: { … }'],
  ['Segmented', 'Picker(…).pickerStyle(.segmented)'],
  ['Switch', 'Toggle(…)'],
  ['Stepper', 'Stepper(…)'],
  ['List section · Row', 'List { Section(header:footer:) { … } }.listStyle(.insetGrouped)'],
  ['Row with chevron', 'NavigationLink(…)'],
  ['Sheet', '.sheet(isPresented:) { NavigationStack { … } }'],
  ['Notice', 'Label(…) in a .regularMaterial box'],
  ['Toast', 'a small overlay with .transition(.move(edge: .bottom))'],
  ['Icon', 'Image("fajr") from the same SVGs, or SF Symbols'],
  ['Tokens', 'SalatTokens.swift (made by npm run tokens:swift)'],
];
import { THEMES } from '../core/theme.js';
import { AlertMoment } from '../features/alerts/AlertMoment.jsx';

const COLORS = [
  ['bg', 'The page'], ['surface', 'A card, top'], ['surface-sunk', 'A card, bottom; wells'],
  ['line', 'Hairline dividers'], ['line-strong', 'Control borders'], ['control', 'Button fill'],
  ['selected', 'A chosen option'], ['text', 'Main words'], ['text-2', 'Supporting words'],
  ['text-3', 'Quiet words'], ['label', 'Eyebrow labels'],
];
const SIGNALS = [
  ['now', 'NOW', 'The current prayer. Primary actions.'],
  ['next', 'NEXT', 'The coming prayer. The sun. "Soon".'],
  ['done', 'DONE', 'Prayers passed. The horizon. Success.'],
];
const TYPE = [
  ['Hero Arabic', '--fs-hero-arabic', 'ar', 'المغرب', 'The prayer\'s name in the moment'],
  ['Display', '--fs-display', 'figures', '18m 32s', 'The countdown'],
  ['Figure', '--fs-figure', 'figures', '58.5°', 'A big number'],
  ['Title 1', '--fs-title-1', '', "It's time for Maghrib", 'The moment\'s headline'],
  ['Title 2', '--fs-title-2', '', 'Maghrib', 'The next prayer'],
  ['Lead', '--fs-lead', 'ar', 'العصر', 'Arabic in rows; countdown units'],
  ['Title 3', '--fs-title-3', '', 'Settings', 'Sheet titles'],
  ['Body', '--fs-body', '', 'Fajr · First light', 'Prayer names, card titles'],
  ['UI', '--fs-ui', '', 'Add 30 days to Calendar', 'Buttons, inputs'],
  ['Small', '--fs-small', '', 'Hanafi', 'Options, toasts'],
  ['Caption', '--fs-caption', '', 'Times are calculated on your device.', 'Notes, sub-lines'],
  ['Label', '--fs-label', 'caps', 'Qibla from here', 'Eyebrows, tags'],
];
const SPACE = [['sp-1', 4], ['sp-2', 8], ['sp-3', 12], ['sp-4', 16], ['sp-5', 20], ['sp-6', 24], ['sp-8', 32], ['sp-12', 48]];
const RADII = [['r-xs', 'Bars, tags'], ['r-sm', 'Focus, wells'], ['r-md', 'Controls'], ['r-lg', 'Cards'], ['r-xl', 'Sheets'], ['r-pill', 'Chips, pills']];
const MOTIONS = [
  ['Rise', 'm-rise', 'Enters by fading in while moving up. Text in the moment.', '--dur-scene · ease-out'],
  ['Fade', 'm-fade', 'Enters by opacity alone. The moment\'s background.', '--dur-slow'],
  ['Draw', 'draw', 'A line draws itself, once. The sun arc.', '--dur-draw · ease-out'],
  ['Breathe', 'breathe', 'Slow grow-and-fade loop. The sun\'s halo.', '--dur-breathe · calm'],
  ['Glow', 'm-glow', 'Soft pulse of light. Countdown under 10 minutes.', '--dur-glow · calm'],
  ['Spring', 'spring', 'Small overshoot. The switch knob.', '--dur-base · spring'],
  ['Slide', 'slide', 'A sheet slides up from the bottom.', '--dur-base · sheet'],
  ['Press', 'press', 'A control shrinks to 97% while held.', '--dur-instant · ease-out'],
  ['Pop', 'pop', 'A menu grows from its button, from 95%, never from nothing.', '--dur-menu · ease-out'],
];

function Section({ id, eyebrow, title, children, lead }) {
  return (
    <section className="kit-section" id={id} aria-labelledby={id + '-t'}>
      <Label>{eyebrow}</Label>
      <h2 className="t-title-1" id={id + '-t'}>{title}</h2>
      {lead && <p className="kit-lead">{lead}</p>}
      {children}
    </section>
  );
}

/** A small piece of the sun arc with the sun on it, to compare sun colours. */
function SunSample({ fill, glow, rim, caption }) {
  return (
    <figure className="kit-sun">
      <svg viewBox="0 0 160 90" role="img" aria-label={caption}>
        <path d="M8 80 Q80 -20 152 80" fill="none" style={{ stroke: 'var(--next)' }} strokeWidth="1.6" strokeLinecap="round" opacity=".9" />
        <line x1="104" y1="10" x2="104" y2="86" style={{ stroke: 'var(--now)' }} strokeWidth=".8" strokeOpacity=".45" />
        <circle cx="104" cy="34" r="11" style={{ fill: glow }} opacity=".22" />
        <circle cx="104" cy="34" r="5.4" style={{ fill, stroke: rim }} strokeWidth="1.2" />
      </svg>
      <figcaption className="t-caption">{caption}</figcaption>
    </figure>
  );
}

function Say({ children }) { return <p className="kit-say"><span>Say:</span> “{children}”</p>; }

function MotionTile({ name, kind, text, spec }) {
  const [k, setK] = useState(0);
  const [on, setOn] = useState(false);
  let demo;
  if (kind === 'draw') demo = <svg key={k} viewBox="0 0 120 50" className="kit-motion-svg"><path className="m-draw" d="M5 45 Q60 -20 115 45" fill="none" stroke="var(--next)" strokeWidth="2.5" strokeLinecap="round" /></svg>;
  else if (kind === 'breathe') demo = <svg viewBox="0 0 120 50" className="kit-motion-svg"><circle className="m-breathe" cx="60" cy="25" r="10" style={{ fill: 'var(--now)' }} /><circle cx="60" cy="25" r="5" style={{ fill: 'var(--now)' }} /></svg>;
  else if (kind === 'spring') demo = <Switch on={on} label="Spring demo" onChange={setOn} />;
  else if (kind === 'slide') demo = <Button size="sm" onClick={() => setOn(true)}>Open a sheet</Button>;
  else if (kind === 'press') demo = <Button size="sm">Press and hold</Button>;
  else if (kind === 'pop') demo = <PopUpMenu label="Pop demo" value={10} onChange={() => {}} items={[{ value: 0, label: 'At the adhan' }, { value: 10, label: '10 minutes before' }, { value: 30, label: '30 minutes before' }]} />;
  else if (kind === 'm-glow') demo = <div className="countdown soon m-glow kit-mini-count">04m 12s</div>;
  else demo = <div key={k} className={'kit-motion-box ' + kind}>Salat</div>;
  return (
    <Card padded as="div" className="kit-motion">
      <div className="kit-motion-stage">{demo}</div>
      <div className="kit-motion-meta">
        <b>{name}</b><span className="t-caption">{text}</span><code>{spec}</code>
      </div>
      {['m-rise', 'm-fade', 'draw'].includes(kind) && <Button size="sm" variant="quiet" onClick={() => setK(k + 1)}>Play again</Button>}
      {kind === 'slide' && <Sheet open={on} title="A sheet" onClose={() => setOn(false)}><p className="t-caption">Sheets slide up and the scrim fades in behind. Tap outside to close.</p><Button variant="primary" onClick={() => setOn(false)}>Done</Button></Sheet>}
    </Card>
  );
}

export default function Kit() {
  const [theme, setTheme] = useState('midnight');
  const [chips, setChips] = useState({ fajr: true, dhuhr: false });
  const [seg, setSeg] = useState(10);
  const [sw, setSw] = useState(true);
  const [method, setMethod] = useState('isna');
  const [step, setStep] = useState(0);
  const [toast, setToast] = useState('');
  const [moment, setMoment] = useState(false);
  const [tokens, setTokens] = useState({});
  const timer = useRef(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const cs = getComputedStyle(document.documentElement);
    const read = {};
    for (const [n] of [...COLORS, ...SIGNALS]) read[n] = cs.getPropertyValue('--' + n).trim();
    for (const [n] of TYPE) read[n] = cs.getPropertyValue(TYPE.find((t) => t[0] === n)[1]).trim();
    setTokens(read);
  }, [theme]);

  const showToast = (m) => { setToast(m); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(''), 2400); };

  return (
    <>
      <IconSprite />
      <main className="kit">
        <header className="kit-hero">
          <Label>Salat · design kit · v2.0</Label>
          <h1 className="kit-title">The Salat Design Kit</h1>
          <p className="kit-lead">Every colour, word size, space, icon, component and movement in Salat, with its name. You design with these names; Claude builds with them. If a piece is not in this kit, it is a new design decision, and Claude asks first.</p>
          <div className="kit-themes">
            <Label>Theme</Label>
            <Segmented label="Theme" options={THEMES.filter((t) => t.id !== 'custom').map((t) => [t.id, t.name])} value={theme} onChange={setTheme} />
          </div>
          <nav className="kit-nav" aria-label="Kit sections">
            {[['point', 'Point at the sky'], ['moon', 'Moon'], ['sky', '3D sky'], ['colour', 'Colour'], ['type', 'Type'], ['space', 'Space & shape'], ['icons', 'Icons'], ['components', 'Components'], ['lists', 'Lists & menus'], ['motion', 'Motion'], ['patterns', 'Patterns'], ['native', 'Swift'], ['talk', 'Talking design']]
              .map(([id, t]) => <a key={id} href={'#' + id}>{t}</a>)}
          </nav>
        </header>

        <Section id="point" eyebrow="3D sky · new Nov 6" title="Point at the sky"
          lead="Hold up your iPad or phone: the camera shows the real sky, and Salat draws the sun's path with each prayer, the sun, the moon, the horizon with its compass points and the Qibla on top, following the device as it moves. The bar at the bottom says which way you face and how far to turn for the Qibla. Without motion sensors (on a computer, or if motion is refused) you drag to look around. Opens from Sky Today. Built from kit pieces only: Button, Card, Notice, MoonPhase, the sky labels.">
          <Suspense fallback={<p className="t-caption">Loading…</p>}><PointKit /></Suspense>
          <Say>Make the Qibla line taller</Say>
        </Section>

        <Section id="moon" eyebrow="3D sky · chosen Nov 6" title="The moon, with its phase"
          lead="The moon at its real place in the living 3D sky, lit the way you would see it from the ground: its bright side always faces the sun. By day it is pale; at night its dark part shows faintly (earthshine). Move the day to watch the month go by. Its colour is new: Moon, a cool silver beside the warm Sun. The flat moon below can sit in lists and readouts. Chosen by the designer on Nov 6 and used in the app (Sky Today).">
          <Suspense fallback={<p className="t-caption">Loading the moon…</p>}><MoonKit theme={theme} /></Suspense>
          <Say>Make the moon a little bigger</Say>
        </Section>

        <Section id="sky" eyebrow="3D sky · chosen Nov 6" title="The living 3D sky"
          lead="The sky behind the 3D dome takes the real sky's colours for where the sun is (night, first light at Fajr, day, golden Maghrib), and the real bright stars appear in three steps as the sun sinks to 6°, 12° and 18° below the horizon (the angles the prayer times use). Chosen by the designer on Nov 6 and used in the app. The old classic look stays on the left for comparison.">
          <Suspense fallback={<p className="t-caption">Loading the 3D sky…</p>}><SkyCompare theme={theme} /></Suspense>
          <Say>Make the noon sky a softer blue</Say>
        </Section>

        <Section id="colour" eyebrow="1 · Colour" title="Colour has one meaning each"
          lead="Three signal colours carry meaning. Everything else is calm, built from the page colour. Every theme defines every role, and the Custom theme derives them from four picks, checked for contrast.">
          <div className="kit-signals">
            {SIGNALS.map(([n, name, use]) => (
              <div key={n} className="kit-signal" style={{ '--c': `var(--${n})` }}>
                <i /><b>{name}</b><code>--{n}</code><span className="t-caption">{use}</span><code className="kit-hex">{tokens[n]}</code>
              </div>
            ))}
          </div>
          <div className="kit-grid">
            {COLORS.map(([n, use]) => (
              <div key={n} className="kit-color"><i style={{ background: `var(--${n})` }} /><div><b>{n}</b><span className="t-caption">{use}</span><code className="kit-hex">{tokens[n]}</code></div></div>
            ))}
          </div>
          <div className="kit-sun-row">
            <div className="kit-sun-text">
              <b>Sun</b><code>--sun · --sun-glow · --sun-rim</code>
              <span className="t-caption">The sun itself: warm white (cream) with a glow in its path's colour and a thin edge. Used for the sun in the arc and the 3D sky. The thin vertical line still means Now. In Blossom the glow and edge turn gold so the sun stays visible on light pink.</span>
            </div>
            <SunSample fill="var(--now)" glow="var(--now)" rim="transparent" caption="Before: Now colour" />
            <SunSample fill="var(--sun)" glow="var(--sun-glow)" rim="var(--sun-rim)" caption="After: Sun" />
          </div>
          <Say>Make the Asr row use the Next colour</Say>
        </Section>

        <Section id="type" eyebrow="2 · Type" title="Three families, twelve sizes"
          lead="Words in Space Grotesk. Every time and number in IBM Plex Mono, so digits never jump. Every Arabic word in Amiri. Call a size by its role.">
          <div className="kit-type">
            {TYPE.map(([name, v, fam, sample, use]) => (
              <div key={name} className="kit-type-row">
                <div className="kit-type-meta"><b>{name}</b><code>{tokens[name]}</code><span className="t-caption">{use}</span></div>
                <div className={'kit-type-sample ' + (fam === 'caps' ? 't-label' : fam)} style={{ fontSize: `var(${v})` }} lang={fam === 'ar' ? 'ar' : undefined}>{sample}</div>
              </div>
            ))}
          </div>
          <Say>Set the Qibla bearing in Figure, not Display</Say>
        </Section>

        <Section id="space" eyebrow="3 · Space & shape" title="A 4-point grid and six corners"
          lead="All space is a step on the grid. Cards sit 12 apart (stack), 16 from the screen edge (gutter), with 16 inside (card pad). Anything you can tap is at least 44 tall.">
          <div className="kit-space">
            {SPACE.map(([n, px]) => <div key={n}><i style={{ width: `var(--${n})` }} /><code>{n}</code><span>{px}</span></div>)}
          </div>
          <div className="kit-radii">
            {RADII.map(([n, use]) => <div key={n}><i style={{ borderRadius: `var(--${n})` }} /><code>{n}</code><span className="t-caption">{use}</span></div>)}
          </div>
          <Say>Give the Night card more room: card pad step 5</Say>
        </Section>

        <Section id="icons" eyebrow="4 · Icons" title={`One drawing style, ${ICON_NAMES.length} icons`}
          lead="24 grid, 1.6 stroke, round ends, no fills, colour from the words beside them. Sizes: sm 15, md 20, lg 22.">
          <div className="kit-icons">
            {ICON_NAMES.map((n) => <div key={n}><Icon name={n} size="lg" /><code>{n}</code></div>)}
          </div>
          <Say>Use the bell icon, size large, in the Alerts card</Say>
        </Section>

        <Section id="components" eyebrow="5 · Components" title="Building blocks"
          lead="Screens are built only from these. Each has a fixed list of variants. A new look is a new variant, added here first.">
          <div className="kit-comp">
            <Card padded as="div"><Label>Button</Label>
              <div className="stack">
                <Button variant="primary" size="lg" icon="cal">Primary · large</Button>
                <Button variant="primary">Primary</Button>
                <Button variant="tinted" icon="bell">Tinted</Button>
                <Button icon="target">Secondary (default)</Button>
                <Button variant="destructive">Destructive</Button>
                <div className="kit-row"><Button variant="quiet" hug>Quiet</Button><Button size="sm" icon="compass">Small</Button><Button size="sm" disabled>Disabled</Button></div>
              </div>
              <p className="kit-use">Primary (filled): the one main action. Tinted: a strong second action. Secondary (gray): everything else. Quiet: links like "Done". Destructive: only for removing things. Every button shrinks a little when pressed. Long words end in "…" and never wrap.</p>
            </Card>
            <Card padded as="div"><Label>Icon button · Switch · Tag · Status pill</Label>
              <div className="kit-row"><IconButton icon="left" label="Previous" /><IconButton icon="today" label="Today" /><IconButton icon="gear" label="Settings" /></div>
              <div className="kit-row"><Switch on={sw} label="Demo switch" onChange={setSw} /><span className="t-caption">Switch: a whole feature on or off</span></div>
              <div className="kit-row"><span>Asr<Tag tone="now">now</Tag></span><span>Maghrib<Tag tone="next">next</Tag></span></div>
              <div className="kit-row"><StatusPill>Checking</StatusPill><StatusPill tone="good">Ready offline</StatusPill></div>
            </Card>
            <Card padded as="div"><Label>Chip · Segmented</Label>
              <div className="stack">
                <ChipRow>
                  {['fajr', 'dhuhr'].map((k) => <Chip key={k} icon={k} on={chips[k]} onClick={() => setChips({ ...chips, [k]: !chips[k] })}>{k[0].toUpperCase() + k.slice(1)}</Chip>)}
                </ChipRow>
                <Segmented label="Demo" options={[[0, 'On time'], [10, '10 min'], [30, '30 min']]} value={seg} onChange={setSeg} />
              </div>
              <p className="kit-use">Chips: many can be on. Segmented: exactly one of two to five, always on one row; the thumb slides. More than five? Use a pop-up menu.</p>
            </Card>
            <Card padded as="div"><Label>Notice</Label>
              <div className="stack">
                <Notice>Info: Salat chimes at each prayer while it is open.</Notice>
                <Notice tone="caution">Caution: notifications are blocked for Salat.</Notice>
              </div>
            </Card>
            <Card padded as="div"><Label>Field · Swatch</Label>
              <div className="stack">
                <Field label="Calculation method" hint="A hint sits under the control.">
                  <PopUpMenu look="boxed" label="Calculation method" value={method} onChange={setMethod}
                    items={Object.entries(METHODS).map(([k, v]) => ({ value: k, label: v.name }))} />
                </Field>
                <div className="swatches"><Swatch on colors={THEMES[0].chips}>{THEMES[0].name}</Swatch><Swatch colors={THEMES[1].chips}>{THEMES[1].name}</Swatch></div>
              </div>
            </Card>
            <Card padded as="div"><Label>Toast · The moment</Label>
              <div className="stack">
                <Button onClick={() => showToast('Alerts on')}>Show a toast</Button>
                <Button variant="primary" icon="bell" onClick={() => setMoment(true)}>Play the prayer moment</Button>
              </div>
            </Card>
          </div>
          <Say>Make "Test the alert" a quiet button</Say>
        </Section>

        <Section id="lists" eyebrow="6 · Lists & menus" title="Settings are lists, choices are menus"
          lead="Like iPhone Settings. Rows sit in grouped sections. A choice from many opens a pop-up menu that grows from its button, with a tick on the current one. A row with a chevron opens a page inside the sheet. Switches live only in rows.">
          <div className="kit-comp">
            <div className="stack">
              <ListSection header="Prayer times" footer="A footer explains the section in one sentence.">
                <Row icon="target" title="Method" accessory={<PopUpMenu label="Method" value={method} onChange={setMethod} items={Object.entries(METHODS).map(([k, v]) => ({ value: k, label: v.name }))} />} />
                <Row icon="sliders" title="Adjustments" value="None" chevron onClick={() => showToast('Opens a page')} />
                <Row icon="bell" title="Alerts" accessory={<Switch on={sw} label="Alerts" onChange={setSw} />} />
                <Row icon="fajr" title="Fajr" accessory={<Stepper label="Fajr" value={step} onChange={setStep} />} />
              </ListSection>
            </div>
            <Card padded as="div"><Label>Menu button (actions)</Label>
              <div className="kit-row">
                <MenuButton label="More actions" items={[
                  { label: 'Share Times', icon: 'share', onSelect: () => showToast('Share') },
                  { label: 'Add to Calendar', icon: 'cal', onSelect: () => showToast('Calendar') },
                  { separator: true },
                  { label: 'Reset Adjustments', destructive: true, onSelect: () => showToast('Reset') },
                ]} />
                <span className="t-caption">Three or more related actions behind one button. Destructive items are red and last.</span>
              </div>
              <p className="kit-use">Menus: verbs for actions ("Share Times"), Title Case, no "the". Pick-one menus show a tick on the current choice.</p>
            </Card>
          </div>
          <Say>Put Asr in a pop-up menu instead of a segmented control</Say>
        </Section>

        <Section id="motion" eyebrow="7 · Motion" title="Slow, calm, and named"
          lead="Movement is drawn by code and stays slow. Loops pause when the page is hidden. With Reduce Motion on, everything is still.">
          <div className="kit-motions">{MOTIONS.map(([n, k, t, sp]) => <MotionTile key={n} name={n} kind={k} text={t} spec={sp} />)}</div>
          <p className="kit-lead">Canvas motions: <b>Ripple</b> (rings in the moment), <b>Twinkle</b> and <b>Shooting star</b> (the night sky). Their numbers live in <code>ui/motion.js</code>.</p>
          <Say>Make the moment's headline Rise a little later</Say>
        </Section>

        <Section id="patterns" eyebrow="8 · Patterns" title="How pieces combine"
          lead="A prayer row has three states. The order of a screen: what's next first, then today, then tools.">
          <Card>
            <div className="prayers">
              <div className="prayer done"><Icon name="dhuhr" /><div className="prayer-name"><div className="en">Dhuhr</div><div className="sub">Done</div></div><div className="prayer-ar ar" lang="ar">الظهر</div><div className="prayer-time">11:40<span className="ap">AM</span></div></div>
              <div className="prayer now"><Icon name="asr" /><div className="prayer-name"><div className="en">Asr<Tag tone="now">now</Tag></div><div className="sub">Now</div></div><div className="prayer-ar ar" lang="ar">العصر</div><div className="prayer-time">2:26<span className="ap">PM</span></div></div>
              <div className="prayer next"><Icon name="maghrib" /><div className="prayer-name"><div className="en">Maghrib<Tag tone="next">next</Tag></div><div className="sub">Next</div></div><div className="prayer-ar ar" lang="ar">المغرب</div><div className="prayer-time">4:49<span className="ap">PM</span></div></div>
            </div>
          </Card>
        </Section>

        <Section id="native" eyebrow="9 · Swift" title="Same kit, two apps"
          lead="The web app and the Swift app share these names. Each kit piece maps to a standard SwiftUI control, so the iPhone app gets real system menus, sheets and lists for free.">
          <div className="kit-table">
            {NATIVE.map(([k, v]) => <div key={k}><b>{k}</b><code>{v}</code></div>)}
          </div>
        </Section>

        <Section id="talk" eyebrow="10 · Talking design" title="How we work together"
          lead="You are the designer; Claude is the engineer. These rules keep your design yours.">
          <ol className="kit-rules">
            <li><b>Name it from this kit.</b> "Primary button", "Notice, caution", "Title 2", "step 4", "Rise".</li>
            <li><b>Claude never restyles as a side effect.</b> A change to a component changes it everywhere, so Claude says so and asks first.</li>
            <li><b>New looks become variants.</b> If a screen needs something new, it is added to the kit, then used.</li>
            <li><b>Tokens, never raw values.</b> A test fails the build if a colour, size, corner or timing is typed in by hand.</li>
            <li><b>Check before shipping.</b> Claude compares screenshots before and after every design change.</li>
          </ol>
        </Section>
      </main>
      <Toast message={toast} />
      {moment && <AlertMoment alert={{ ar: 'المغرب', title: "It's time for Maghrib", body: '4:49 PM · ⁨المغرب⁩' }} onClose={() => setMoment(false)} />}
    </>
  );
}
