---
name: salat-design
description: Salat's design language and app-kit rules. Use for ANY change to how Salat looks, moves or is laid out — screens, buttons, menus, lists, settings, colours, type, icons, animation, the kit page, or the Swift version — and when the owner speaks in design words ("primary button", "Title 2", "step 4", "Rise", "pop-up menu").
---

# Salat design skill

The owner is the **designer**; you are the **engineer**. She names pieces from the kit; you build them exactly, from the kit, and change nothing else.

## Before any visual change
1. Read `DESIGN.md` (the language) and look at the relevant section of `app/src/kit/Kit.jsx` (the living kit).
2. Find the kit pieces that already do the job. Screens use only `app/src/ui/` components and tokens in `app/src/styles/tokens.css`.
3. If the request needs something the kit lacks, **propose it as a new variant in the kit first**, show it, then use it.
4. If the change touches a shared component, **say where it shows up** ("this changes 9 buttons on 3 screens") and ask first, unless she already asked for an app-wide change.

## App, not website (Apple HIG; full digest in docs/RESOURCES.md §2)
- Buttons: no borders; variants primary (filled) · tinted · secondary (gray) · quiet · destructive; sizes lg 50 · md 44 · sm 34 (tap area 44); one line, ellipsis; press = scale 0.97.
- Pick-one from many → `PopUpMenu`. Actions → `MenuButton` (3+ items). Never `<select>` (the guard test fails).
- 2–5 options → `Segmented` (one row, sliding thumb). More → `PopUpMenu`.
- Settings → `ListSection` + `Row`; chevron opens a page inside the `Sheet`; `Switch` only in rows; `Stepper` for small numbers.
- Toggle outside a list → `Chip`.
- Copy: Title Case on buttons and menu items, verbs for actions, no "the", sentences short.

## Motion (Emil Kowalski rules; docs/RESOURCES.md §3)
Use named motions only (DESIGN.md table). Ease-out for entering; < 300 ms for interface motion; never from scale(0) (start 0.95); menus grow from their button; no animation for keyboard-opened or very frequent actions; everything respects Reduce Motion.

## After the change
1. `npm test` (includes `app/src/__tests__/design-guard.test.js`: tokens only, kit components only, no `<select>`).
2. Build, then screenshot every affected screen at iPhone size **before and after**; compare; fix overflow and clipped text (labels end in "…", never wrap a button).
3. If tokens changed: `npm run tokens:swift -w app` to refresh `native/SalatTokens.swift`.
4. Commit one idea, push to `main` (publishes to GitHub Pages). Tell her in plain words what changed and where to see it.

## Talking with her
Short sentences, plain words, the answer first. Teach as you go (commit = sealed envelope, push = posted). Never blame her for not knowing a term; name it once and explain it.
