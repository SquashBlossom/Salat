---
name: Salat
version: 2.0
themes: [midnight, amethyst, grove, blossom, custom]
tokens:
  color:
    ink: "var(--ink)"         # page background
    panel: "var(--panel)"     # card surface (top of the card gradient)
    night: "var(--night)"     # card surface (bottom), insets
    text: "var(--text)"       # body text, >= 8:1 on panel
    muted: "var(--muted)"     # secondary text, >= 4.5:1
    dim: "var(--dim)"         # labels, >= 3.2:1
    accent: "var(--accent)"   # NOW: the current prayer, primary actions
    warn: "var(--warn)"       # NEXT: the coming prayer, the sun, Arabic in the moment
    ok: "var(--ok)"           # DONE: prayers already passed, the horizon
  font:
    ui: "Space Grotesk"       # 400 500 600 700
    numbers: "IBM Plex Mono"  # every time and countdown, tabular figures
    arabic: "Amiri"           # every Arabic word
  radius: { card: 18px, control: 11-13px, chip: 999px }
  touch_target_min: 44px
---

# Salat design

## Feeling

Calm, night-sky, precise. A prayer app is opened five times a day, often half-awake. It must be readable in one glance and never shout.

## Colour has one meaning each

- **Accent = now.** The prayer whose time it is. Primary buttons.
- **Warn (gold) = next.** The prayer coming up, the sun, the countdown when under 10 minutes.
- **OK (green) = done.** Prayers that have passed. The horizon line.

Never use a colour for decoration only. Every theme, including Custom, derives all tokens from four picks in `app/src/core/theme.js`, which enforces WCAG contrast. Never hard-code a hex colour in a component; use a CSS variable.

## Type

- Times and countdowns: IBM Plex Mono, tabular figures, so digits do not jump.
- Arabic: Amiri, always with `lang="ar"`. When Arabic sits next to English or numbers in one line, wrap it in Unicode isolates (`⁨…⁩`) so the order never breaks.
- Words: the answer first, short sentences, active voice.

## Motion

Motion is procedural (drawn by code, not video or GIF) and slow.

- The sky behind the app follows the real sun at the chosen location: warm glow by day, stars after dusk.
- The sun arc draws itself in once; the sun's halo breathes every 3.2 s.
- The countdown glows gold under 10 minutes.
- The prayer moment: rings rise from the centre at 7.2 s per cycle.
- `prefers-reduced-motion`: every animation stops; the sky draws one still frame.
- Animations pause when the page is hidden (battery).

## Layout

One column, max 520 px wide, 16 px side gutter, cards with 12 px between them. Phone first; works on iPad and desktop. Safe-area insets on every edge (notch, home bar). Every control at least 44 px tall.

## Do

- Show the next prayer and how long until it, before anything else.
- Say plainly what a feature can and cannot do on this device (see the Alerts status line).
- Keep everything working offline.

## Don't

- Don't add a colour that has no meaning.
- Don't put text in images.
- Don't let a model (AI) state a religious ruling. Models find, read, organise and translate; answers point to sources and to the person's own imam.
