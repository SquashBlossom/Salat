# Salat

Prayer times anywhere in the world, calculated on your device. Alerts, Qibla, the night's sunnah times, and a sky that follows the real sun.

**Live app:** https://squashblossom.github.io/Salat/ (updates by itself after every push to `main`)

## Run it on a computer

You need Node.js 22 or later.

```bash
npm install        # once: downloads the tools
npm run dev        # starts the app at http://localhost:5173 — edits show up instantly
npm test           # checks the prayer math, the alerts and the server
```

To try lock-screen alerts with the server too, run `npm run server` in a second terminal, then start the app with `VITE_API_URL=http://localhost:8787 npm run dev`.

## Where things live

| Folder | What is in it | Change it when you want to… |
|---|---|---|
| `app/src/components/` | each part of the screen (the hero, the prayer list, Qibla, settings) | change how something looks or what a screen shows |
| `app/src/features/alerts/` | the Alerts card, the chime, the full-screen moment, push | change how alerts work |
| `app/src/styles/app.css` | all colours, sizes and animations | change a colour, a size or a motion |
| `app/src/data/store.js` | the on-phone database (IndexedDB) | save something new on the phone |
| `shared/` | prayer math, cities, methods, alert schedule — used by app **and** server | change a calculation (tests must still pass) |
| `server/` | the app server: SQLite database, push alerts, API | change what the server stores or sends |
| `docs/` | guides: Git, how Salat works, the design rules | learn or explain |

## How alerts reach the lock screen

1. She turns on **Prayer alerts** in the app. The phone asks permission.
2. The app gives the server a push address and the settings it needs (location rounded to about 1 km — no name, no account).
3. Every 20 seconds the server runs the same prayer math as the app and sends each alert that is due.
4. The phone shows it on the lock screen, even when Salat is closed.

On iPhone and iPad this works once Salat is on the Home Screen (iOS 16.4 or later). Until the server is live, Salat chimes at each prayer while it is open.

## More

- [docs/GIT-GUIDE.md](docs/GIT-GUIDE.md) — save, commit, push, in plain words
- [docs/HOW-IT-WORKS.md](docs/HOW-IT-WORKS.md) — the calculation, high latitudes, colours, Calendar and Shortcuts routes
- [DESIGN.md](DESIGN.md) — the look, for people and for AI helpers
- [AGENTS.md](AGENTS.md) — rules for AI helpers working on this code
