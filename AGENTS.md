# AGENTS.md — rules for AI helpers (Claude, Gemini, others)

Salat is a prayer-times app: a Vite + React web app (`app/`), a Node app server (`server/`), and shared prayer math (`shared/`) used by both. The owner is learning; keep explanations short and plain.

## Rules

1. **Work on `main`.** Commit small, one idea per commit. Push after each working feature; GitHub Actions tests and publishes to GitHub Pages.
2. **Tests pass before every push:** `npm test`. Add a test with each change to `shared/` or `server/`.
3. **Never change prayer math without a test.** `shared/test/legacy-fixture.json` holds the original app's answers; they must still match.
4. **One job per file, about 500 lines.** Each file starts with a comment: what it owns, what it refuses.
5. **The owner designs; you engineer.** Follow `DESIGN.md` and the kit (`app/kit.html`). Build screens only from
   `app/src/ui/` components and tokens in `app/src/styles/tokens.css`. Never restyle a component as a side effect;
   if a change touches a shared component, say where it shows up and ask first. A new look is a new variant in the
   kit, added before it is used. The design guard test enforces tokens. Compare screenshots before and after any
   visual change. Respect reduced motion.
6. **Privacy:** location leaves the phone only for push alerts, rounded to 2 decimals. No names, emails, or analytics.
7. **Secrets:** never commit or print keys. Server keys come from environment variables (Fly secrets).
8. **Models:** an on-device model proposes; code checks before anything happens. No model gives religious rulings.
9. **Dependencies:** ask before adding one. Pin versions.

## Commands

| To | Run |
|---|---|
| install | `npm install` |
| app, live reload | `npm run dev` |
| server | `npm run server` |
| all tests | `npm test` |
| build | `npm run build` |
