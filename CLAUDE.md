# CLAUDE.md — memory for every Claude session on Salat

Read this first. Then `AGENTS.md` (rules), `DESIGN.md` (design language) and `docs/RESOURCES.md` (research). For any visual work, use the `salat-design` skill (`.claude/skills/salat-design/`).

## Who
- **The owner** designs Salat and is learning Git and code. You are the engineer. Keep text short, plain and friendly; explain Git terms the first time.
- **Alfred** (also "Doveman") is her husband; he owns the Lacuna SDK and the Fly server. Call him Alfred.

## What Salat is
A prayer-times app: Vite + React web app (`app/`), Node + SQLite server (`server/`), shared prayer math (`shared/`). Two versions are planned: this web app, and a Swift app built from the same kit (`native/SalatTokens.swift` is generated from the tokens). Launch target: mid-December 2026. Plan: https://claude.ai/artifact/7VTCfrjSxemXXHhfoRuNHY

## How we work
- **Keep the Google Doc "Design Documents" up to date** (owner's request, Nov 6): https://docs.google.com/document/d/1lmzApjOTTR8ZeNlpUzKVX7PajNwVv4xRUzeH2PMmXfI/edit (in her My Drive; older version kept as "Design Documents (older, Nov 6 morning)"). It mirrors `DESIGN.md` + the design parts of `docs/RESOURCES.md` + a "Decisions on record" table. After any design decision or kit change, update `DESIGN.md` first, then rebuild that Doc and add a row to Decisions on record. The Drive tools cannot edit a Doc's text in place: create the new "Design Documents" Doc, rename the previous one "Design Documents (older, <date>)" (never delete: shared links must keep working), and update the link here. Generator: `docs/scripts/make-design-doc.py` (decisions table: `docs/design-decisions.md`, add a row per decision), then upload the HTML as text/html.
- A separate general Doc, "Design Resources", holds design sites and principles for her daughter's own website (not Salat).
- Everything on `main`. Commit small; **push without asking** after each working step: GitHub Actions tests it and publishes to https://squashblossom.github.io/Salat/ (kit: `/kit.html`).
- Before pushing: `npm test`, build, and screenshots before/after for any visual change.
- Layout and flow are best sketched in a design canvas first; behaviour in code (docs/RESOURCES.md §1).

## State (update this list when it changes)
- Done: app rebuild, in-app alerts, push server (tested locally), design kit + app kit (menus, lists, sheets with pages), Swift token export, compass fix for landscape (confirmed on her iPad), Swift prayer math `native/SalatCore` (matches the JS; CI checks it).
- Waiting: Fly key from Alfred (then deploy the server and set the `SALAT_API_URL` repo variable). Swift app: who has the Mac, whether Alfred's Lacuna kit wraps it, Apple Developer account?
- **Decision (Alfred, Nov 5): JavaScript everywhere (React, Three.js, libraries) for web and phone. Swift only as a thin wrapper at packaging** for what the web can't do: widgets, Live Activity, alerts with adhan sound, App Store. Widgets get times handed over from the JS side, so `native/SalatCore` (tested Swift math) is parked and probably not needed.
- AR on iPhone: Safari has no WebXR AR, but the sky needs only orientation: camera feed (getUserMedia) + DeviceOrientation turning the Three.js camera works in Safari and in a WKWebView.
- The owner works on an **iPad** (no Mac). At packaging: Swift Playgrounds on iPad can build a SwiftUI app; widgets / Live Activities likely need Xcode on a Mac.
- Swift later: app project, local alerts (60 of iOS's 64), widgets, Live Activity. Swift 6 for Linux can run `swift test` in a cloud session (download from swift.org, verify the signature).
- 3D sky dome done (lazy-loaded Three.js, `app/src/features/sky/`), with the living sky (real sky colours + 921 real stars, `livingSky.js`, `shared/stars.js`) chosen Nov 6. Next proposed: "Point at the sky" AR mode, then 3D Qibla.
- Next feature ideas: roadmap page, ten ideas; Gemma 4 E2B ("2B") is the chosen model.

## AI rules (Lacuna)
Lacuna Scheme is only for controlling the AI: the model writes one Scheme form, `checkForm` checks its syntax tree (allowed verb, right argument kinds), then `act` runs it. UI stays in React. The SDK lives in Google Drive and is never committed. No AI gives religious rulings.
