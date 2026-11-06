---
name: Salat
version: 2.0
source_of_truth: app/src/styles/tokens.css
living_kit: app/kit.html   # live at https://squashblossom.github.io/Salat/kit.html
themes: [midnight, amethyst, grove, blossom, custom]
colour_roles: [bg, surface, surface-sunk, line, line-strong, control, control-pressed, selected, text, text-2, text-3, label]
signal_colours: { now: current prayer + primary actions + the 'now' line, next: coming prayer + sun's path + soon, done: passed + horizon + success }
sun: { sun: warm white #FFF4DC, sun-glow: the path colour (gold in Blossom), sun-rim: thin edge }
moon: { moon: cool silver #E4E9F2, moon-dark: earthshine #3A4256 }   # chosen Nov 6
fonts: { ui: Space Grotesk, figures: IBM Plex Mono, arabic: Amiri }
type_scale: [label 10, caption 12, small 13, ui 14, body 15, title-3 17, lead 20, title-2 22, title-1 26, figure 30, display 38-52, hero-arabic 64]
space: [sp-1 4, sp-2 8, sp-3 12, sp-4 16, sp-5 20, sp-6 24, sp-8 32, sp-12 48]
radius: [r-xs 4, r-sm 8, r-md 12, r-lg 16, r-xl 22, r-pill]
touch_min: 44
motion: [rise, fade, draw, breathe, glow, slide, push, pop, spring, press, ripple, twinkle]
components: [Button, IconButton, Card, Notice, Chip, Segmented, Switch, Tag, StatusPill, Label, Field, PopUpMenu, MenuButton, ListSection, Row, Stepper, Sheet, Toast, Swatch, Icon, MoonPhase]
native_mapping: see kit section 9 (each component maps to a SwiftUI control)
---

# Salat design language

**The designer decides. The engineer builds.** This file and the kit page are how we talk. Open the kit at
`/kit.html` (on the live site, or `npm run dev` then http://localhost:5173/kit.html) to see every piece for real.

## The feeling

Calm, night-sky, precise. Salat is opened five times a day, often half awake. One glance must answer
"what's next, and how long?". Nothing shouts.

## App, not website

Salat follows Apple's Human Interface Guidelines so the web app and the Swift app feel the same
(digest in `docs/RESOURCES.md` §2):
- **Buttons** have no web borders, a press state (they shrink a little), and one line of text.
- **Choices** open a **pop-up menu** that grows from its button, never a web dropdown.
- **Settings** are grouped lists like iPhone Settings; a chevron opens a page inside the sheet.
- **Segmented controls** hold 2 to 5 options on one row; more becomes a pop-up menu.
- **Switches** live only in list rows.

## How to ask for a change

Name the piece and what to change, using the words below. For example:

| You say | Claude does |
|---|---|
| "Make *Test the alert* a **quiet** button." | Changes that one button's `variant`. Nothing else moves. |
| "Make **all secondary buttons** taller." | Changes the Button component. Says first: "this changes 9 buttons on 3 screens". |
| "Give the Night card **step 5** padding." | Uses `--sp-5`. Never a raw number. |
| "The countdown should **glow** from 15 minutes, not 10." | Changes when `m-glow` turns on. |
| "I want a **new** kind of card for the tracker." | Proposes it as a Card variant in the kit first, shows you, then uses it. |

## Rules that protect your design

1. **No side effects.** Claude never restyles a component while doing something else.
2. **One change, one place.** A shared component changes everywhere, so Claude says where before changing it.
3. **New looks are variants.** Added to the kit first, then used on a screen.
4. **Tokens only.** A test (`app/src/__tests__/design-guard.test.js`) fails the build if a colour, font size,
   corner or timing is typed in by hand, or if a screen builds its own button, card, chip, switch or notice.
5. **Before and after.** Every visual change is checked with screenshots of each screen before it ships.

## Vocabulary

### Colour: one meaning each
- **Now** (`--now`): the current prayer, the main action on a screen.
- **Next** (`--next`): the coming prayer, the sun's path, the countdown when under 10 minutes.
- **Done** (`--done`): prayers already passed, the horizon line, a success.
- **Sun** (`--sun`, `--sun-glow`, `--sun-rim`): the sun itself, in the arc and the 3D sky. Warm white (cream) with a glow in
  its path's colour and a thin edge; in Blossom the glow and edge are gold so it stays visible. Chosen by the owner, Nov 5.
- **Moon** (`--moon`, `--moon-dark`): the moon's lit part (cool silver, beside the warm Sun) and its dark part, faintly seen
  (earthshine). The same in every theme. Chosen by the owner, Nov 6.
- **Real sky** (`--sky-*`): the colours of the 3D sky, by stage: night, astronomical, nautical and civil twilight,
  golden hour, day. The same in every theme, because it is the real sky. Chosen by the owner, Nov 6.
- Calm roles: **bg** (page), **surface** / **surface-sunk** (a card's gradient), **line** / **line-strong**,
  **control** (button fill), **selected** (a chosen option), **text** / **text-2** / **text-3** / **label**.

Never use a colour for decoration only. The Custom theme derives every role from four picks and checks contrast.

### Type: three families, twelve sizes by role
Words in **Space Grotesk**. Every time and number in **IBM Plex Mono** (digits never jump). Every Arabic word in
**Amiri**, marked `lang="ar"`; when Arabic shares a line with English or numbers, it is wrapped in isolates (`⁨…⁩`).

Sizes: **Label** 10 (uppercase) · **Caption** 12 · **Small** 13 · **UI** 14 · **Body** 15 · **Title 3** 17 ·
**Lead** 20 · **Title 2** 22 · **Title 1** 26 · **Figure** 30 · **Display** 38 to 52 · **Hero Arabic** 64.

### Space and shape
A 4-point grid: **step 1** = 4 … **step 4** = 16 … **step 12** = 48. Named spaces: **gutter** (16, screen edge),
**stack** (12, between cards), **card pad** (16, inside a card). Anything tappable is at least **44** tall.
Corners: **xs** 4 (bars, tags), **sm** 8, **md** 12 (controls), **lg** 16 (cards), **xl** 22 (sheets), **pill**.

### Icons
One drawing style: 24 grid, 1.6 stroke, round ends, no fills, colour from the words beside them.
Sizes **sm** 15, **md** 20, **lg** 22. The set: fajr, sunrise, dhuhr, asr, maghrib, isha, gear, pin, left, right,
cal, compass, target, today, alert, globe, bell, lock, share, check, updown, more, clock, palette, sliders.

### Components (and their variants)
| Component | Variants / options | Use it for |
|---|---|---|
| **Button** | primary (filled) · tinted · secondary (gray, default) · quiet (plain) · destructive; size lg · md · sm; hug; disabled | Primary: the one main action. Tinted: a strong second action. Secondary: the rest. Quiet: Done, Back, links. Destructive: removing things. |
| **Icon button** | icon + label (always) | Header actions |
| **Card** | plain · padded | Every grouped block |
| **Notice** | info · caution | One or two plain sentences about state |
| **Chip** | on · off (in a ChipRow) | Many-of choices |
| **Segmented** | 2–5 options, one selected, sliding thumb | One-of a few, on one row |
| **Pop-up menu** | inline (end of a row) · boxed (full width) | One-of many; replaces dropdowns |
| **Menu button** | a list of 3+ actions; destructive items red | Actions behind one button |
| **List section · Row** | header, footer; row with icon, value, chevron, tick, or a control | Settings and any list of options |
| **Stepper** | − value + | Small whole numbers, like minutes |
| **Slider** | value along a track; optional coloured tick marks | Scrubbing through time (the 3D sky) |
| **Switch** | on · off | A whole feature |
| **Tag** | now · next | A state word inside a row |
| **Status pill** | neutral · good | A quiet status with a dot |
| **Label** | — | Uppercase eyebrow over a group |
| **Field** | label, control, hint | Every form control |
| **Sheet** | title; pages that open inside it, with Back and Done | Settings and other panels |
| **Toast** | message | A short confirmation |
| **Swatch** | on · off, colour dots | Theme choice |
| **Moon phase** | lit 0–1, waxing or waning, north or south; size md · lg · xl | The moon's shape, flat, in lists and readouts (Sky Today's readout). Chosen Nov 6. |

### Motion: slow, calm, named
| Name | What it does | Where |
|---|---|---|
| **Rise** | fades in while moving up | text in the prayer moment (staggered 80 ms) |
| **Fade** | opacity only | the moment's background |
| **Draw** | a line draws itself, once | the sun arc |
| **Breathe** | slow grow-and-fade loop | the sun's halo |
| **Glow** | soft pulse of light | countdown under 10 minutes |
| **Slide** | slides up from the bottom | sheets |
| **Push** | a page slides in from the right | a page opening inside a sheet |
| **Pop** | grows from its button, from 95% | menus |
| **Spring** | small overshoot | the switch knob |
| **Press** | shrinks to 97% while held | every button, chip and row |
| **Ripple** | rings spread from the centre | the prayer moment (canvas) |
| **Twinkle**, **Shooting star** | stars brighten and dim; a rare streak | the night sky (canvas) |
| **Moon** | the 3D moon at its real place, a little larger than the sun; its bright side always faces the sun; a soft glow and a faint rim (so a thin crescent still reads); pale by day, earthshine at night | Sky Today (3D) |
| **Living sky** | the 3D dome takes the real sky's colours for where the sun is; real stars appear at -6°, -12°, -18° | Sky Today (3D) |

Loops pause when the page is hidden. With Reduce Motion on, everything is still.

## Where it lives in code

| Piece | File |
|---|---|
| Every raw value | `app/src/styles/tokens.css` |
| Page, text styles, icon rules | `app/src/styles/base.css` |
| Named motions | `app/src/styles/motion.css`, canvas numbers in `app/src/ui/motion.js` |
| Components | `app/src/styles/components.css` + `app/src/ui/index.jsx` |
| Screen layout | `app/src/styles/screens.css` |
| Icons | `app/src/ui/icons.jsx` |
| The kit page | `app/src/kit/` → `/kit.html` |
| Menus, lists, sheets | `app/src/ui/Menu.jsx`, `List.jsx`, `Sheet.jsx` |
| The 3D sky, stars and moon | `app/src/features/sky/`, math in `shared/stars.js` and `shared/moon.js` |
| Swift tokens | `native/SalatTokens.swift` (run `npm run tokens:swift -w app` after changing tokens) |

## Open design questions (yours to decide)

- **Typeface.** Space Grotesk is clear but very common in AI-made apps. A more personal face could set Salat apart.
- **Light themes.** Blossom is the only light theme. Is one enough for daytime use?
- **Adhan sound.** The chime is made in code. A licensed adhan recording would need choosing.

## Never

- Let an AI state a religious ruling. Models find, read, sort and translate; answers point to sources and her imam.
- Put words inside images.
- Add a colour with no meaning.
