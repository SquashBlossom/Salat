# Salat resources

Everything we looked up, so nobody has to look it up again. Checked November 2026.
The design language itself is in `DESIGN.md`; the galleries are also listed in `DESIGN-REFERENCES.md`.

## 1. How to work: design first, then code

| Work on… | Do it in… | Why |
|---|---|---|
| **Layout and flow**: which screens exist, what is on each, the order you tap through | a **design canvas**: a Claude *Design* artifact, or Figma | You can move boxes around in seconds and compare three versions side by side. Code is slow for "what if it went here?". |
| **The look of one piece**: a button, a card, a colour | the **kit page** (`/kit.html`) and `DESIGN.md` | Change it once by name; it changes everywhere. |
| **Behaviour**: what happens when you tap, alerts, timing, saving | **code** with Claude | Only code can prove it works on a phone. |
| **Checking the result** | the live app on your iPhone, plus Claude's screenshots | Real screen, real thumb. |

A good rhythm for one feature:
1. Sketch the flow in a design canvas (2 or 3 options). Pick one.
2. Tell Claude in kit words: "a list section with a switch row and a pop-up menu row".
3. Claude builds it from the kit, screenshots it, and pushes.
4. You try it on your phone and say what to change.

## 2. Apple's rules we follow (Human Interface Guidelines)

Source: developer.apple.com/design/human-interface-guidelines. These are why Salat feels like an app, not a website.

**Buttons**
- Every tap target is at least 44 × 44 points.
- Every custom button has a **press state** (ours: shrinks to 97%).
- Show the preferred choice with **style, not size**: same size, more prominent style (filled vs gray).
- Roles: normal, **primary** (accent colour), cancel, **destructive** (red). Never make a destructive button primary.
- Labels: a verb, Title Case ("Add to Calendar").

**Choices**
- **Pop-up button** (our *PopUpMenu*): pick one from a flat list; the button shows the current choice. This replaces web dropdowns.
- **Pull-down button** (our *MenuButton*): a list of actions, at least three; destructive items in red.
- **Segmented control**: one of 2–5 on iPhone, equal widths, text *or* icons (not both), nouns in Title Case.
- **Switch**: only inside a list row. Outside a list, use a button that behaves like a toggle (our *Chip*).

**Menus**
- Verbs for actions, Title Case, no "the". Most-used items first. Group with separators.
- An item that needs more input ends in "…". Submenus: one level at most.

**Lists**
- Settings are grouped, inset lists with headers and footers.
- A chevron means "opens a page". A tick means "this is chosen".

**Sheets**
- One sheet at a time. Done goes on the trailing (right) side.
- A sheet can open pages inside itself (a navigation stack), with a back button showing the previous title.

## 3. Motion rules (from Emil Kowalski's design-engineering skill)

- Ask first: how often will people see it? 100+ times a day: no animation. Rare: can delight.
- Entering things use **ease-out**; never ease-in for interface motion.
- Interface motion stays under **300 ms**. Press 100–160 ms, menus 150–250 ms, sheets 200–500 ms.
- Buttons shrink to **0.97** when pressed.
- Never animate from nothing: start at **scale 0.95** with opacity 0.
- Menus grow **from their button** (origin-aware); centred modals stay centred.
- Never animate something opened from the keyboard.
- Use transitions (they can be interrupted) for interactive things; keyframes for one-off scenes.

## 4. Design skills we looked at

| Skill | What it is | Our decision |
|---|---|---|
| **emil-design-eng** (Emil Kowalski, MIT) | motion and polish rules | Adopted the rules above into our kit and the Salat skill. |
| **Impeccable** (Paul Bakaus, Apache 2.0) | big design framework; runs its own scripts and adds a project hook; has iOS-specific checklists | Not installed (it would add a second source of truth). Its idea of "modes" is useful: Salat is an **Operate** surface: precision and native patterns over expression. |
| **Taste** (Leonxlnx) | a step-by-step procedure for building one page with a strong point of view | Useful for the launch page later, not the app. |

Anthropic skills that help with Salat (ask Claude to use them by name):

| Skill | Use it when |
|---|---|
| `design:design-critique` | you want honest feedback on a screen |
| `design:accessibility-review` | before launch: contrast, VoiceOver, touch sizes |
| `design:ux-copy` | naming a button, writing an error or an empty state |
| `design:design-system` | auditing or extending the kit |
| `design:design-handoff` | writing the spec for the Swift version of a screen |
| `design:user-research` | planning the friends' test week |
| Claude **Design** artifact | sketching layout and flow on a canvas |

## 5. The market (what the best prayer apps do)

- **Muslim Pro**: the biggest (one source says 170M+ downloads); lower ratings; privacy scandal in 2020 over location data.
- **Athan**: praised for reliable times and the most customisation.
- **Pillars**: built as the privacy-first answer.
- **iPray**: praised for design.
- Lock-screen **Live Activities** with a countdown are now common (Vaktim, Vakit, Athan Pro, Al-Adhan's Ramadan suhoor/iftar countdown). Some put the next three prayers in the Dynamic Island. Five Prayers lets you mark a prayer done from the widget.
- Known risk: lock-screen widgets breaking after app updates. Test them on every release.

**Salat's angle:** on-device math, no tracking, calm design, and (coming) on-device Gemma.

## 6. Web push on iPhone (facts we rely on)

- Works on iOS/iPadOS 16.4+ **only** for a web app added to the Home Screen from Safari. A Safari tab does not count.
- Permission can only be asked **after a tap**.
- Needs a manifest with `display: standalone` (we have it).
- Removing Salat from the Home Screen **unsubscribes** it.
- Alerts show on the lock screen, in Notification Center, and on Apple Watch.
- Custom alert sounds are not possible in web push; the Swift app can have an adhan sound.
- Live Activities and lock-screen widgets need the Swift app.

## 7. Gemma models (from the Lacuna SDK)

| Model | Size | Good at |
|---|---|---|
| Gemma 3 270M | 0.3 GB | fast narrow choices; tune for one job |
| FunctionGemma | 0.3 GB | turning a sentence into one function call |
| EmbeddingGemma | 0.6 GB | meaning search (Quran search, memory) |
| Gemma 3 1B | 1.0 GB | short answers |
| **Gemma 4 E2B (our "2B")** | 4.3 GB | text **and pictures**; runs on phones; **our choice** |
| Gemma 4 E4B | 6.2 GB | stronger planning and writing |

## 8. Lacuna and the AI

- **Lacuna Scheme is only for controlling the AI.** The model writes one Scheme form; code checks it (`checkForm`, which reads its syntax tree) to make sure the verb is allowed and each argument is the right kind; only then does `act` run it. This limits what the model can do.
- The app's screens are plain React. Don't build interface in Scheme.
- The SDK lives in Google Drive (`lacuna-agentic-sdk`, owned by Alfred) and is never committed (`.gitignore`). It is private to people Lacuna Labs names.
- Rule from the SDK: the model proposes, code decides; anything that changes the world needs a person's yes; every wait has a deadline; one try against an outside site.

## 9. Links

- Live app: https://squashblossom.github.io/Salat/
- Design kit: https://squashblossom.github.io/Salat/kit.html
- Roadmap page: https://claude.ai/artifact/7VTCfrjSxemXXHhfoRuNHY
- Apple HIG: https://developer.apple.com/design/human-interface-guidelines
- Easing curves: https://easing.dev
- Emil Kowalski: https://emilkowal.ski
- Cloud network settings: https://code.claude.com/docs/en/cloud-environments#network-access
