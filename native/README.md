# Salat for iPhone and iPad (Swift)

The native app is being built in steps. What is here so far:

| Folder / file | What it is |
|---|---|
| `SalatCore/` | The prayer math and alert schedule in Swift. Same answers as the web app: its tests check 100 cases from the original app and 10 full schedules (88 alerts) from today's JavaScript. |
| `SalatTokens.swift` | Colours, sizes and timings from the design kit. Made by `npm run tokens:swift -w app`. |

## Run the Swift tests

On a Mac with Xcode, or on Linux with Swift 6:

```bash
swift test --package-path native/SalatCore
```

If you change anything in `shared/` (the JavaScript math), refresh the saved answers first:

```bash
node native/SalatCore/scripts/make-fixtures.mjs
```

GitHub checks both on every push (`.github/workflows/swift.yml`).

## Next steps

1. Xcode project (XcodeGen `project.yml`): an app that shows the web app and adds native parts.
2. Local alerts: schedule the next 60 alerts (12 days × 5) with `UNUserNotificationCenter`; iOS allows 64.
3. Widgets and a Live Activity with the next prayer and a countdown, using `SalatCore`.
