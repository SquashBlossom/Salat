# How Salat works

> This was the original README. Publishing is now automatic (see the main README), and alerts are built into the app. The notes below on the Calendar and Shortcuts routes, location, high latitudes, colours and the calculation still hold.

Prayer times anywhere in the world, calculated on-device from solar position. No account, no API, no tracking. Runs fully offline once installed.

## Alerts without the server

Salat now has its own alerts (the Alerts card). Until the Salat server is live, they ring while the app is open. These two routes also work with no server at all, and are a good backup.

### Route A — Calendar (recommended)

Built into the app already. Tap **Add 30 days to Calendar**, open the downloaded `.ics`, and Calendar imports five events per day with an alert before each one. Change the lead time under **Settings → Calendar alert, minutes before**.

Do this from Safari rather than the Home Screen icon — downloads are more reliable there. Re-run it monthly.

Trade-off: you get the standard Calendar alert tone, not an adhan.

### Route B — Alarms with adhan audio

More setup, more upkeep, but the Clock app rings through Silent mode and can use a custom sound.

**First, get an adhan tone onto the phone.** Custom alarm sounds must be ringtones (`.m4r`). GarageBand for iOS can do this: import the audio, then **Share → Ringtone**. It then appears under alarm sounds.

**Set the default.** Open Clock, create any alarm by hand, set its **Sound** to your adhan tone, save it. Alarms created afterward inherit that sound.

**Build the shortcut.** Shortcuts app → **+** → name it `Adhan alarms`. Add these actions in order:

1. **Date** — leave as Current Date
2. **Format Date** — Format: Custom, Format String: `dd-MM-yyyy`
3. **Text** — paste this, then replace the bracketed part by tapping the variable chip for the Formatted Date:

   ```
   https://api.aladhan.com/v1/timings/[Formatted Date]?latitude=40.6782&longitude=-73.9442&method=2&school=0
   ```

   Those coordinates are Brooklyn — change them to wherever you are. `method=2` is ISNA and `school=0` is Standard Asr, matching the app's defaults. For Hanafi Asr use `school=1`. Above 48° latitude add `&latitudeAdjustmentMethod=3` for the angle-based rule.
4. **Get Contents of URL** — input is the Text above
5. **Get Dictionary Value** — Get `Value` for Key `data.timings.Fajr`
6. **Create Alarm** — Time: the Dictionary Value from step 5. Label: `Fajr`. Repeat: Never.

Then repeat steps 5 and 6 four more times for `data.timings.Dhuhr`, `data.timings.Asr`, `data.timings.Maghrib`, `data.timings.Isha`.

If **Create Alarm** refuses the text value, insert a **Date** action between 5 and 6 with the dictionary value as its input — that coerces `04:41` into a time Shortcuts accepts.

**Automate it.** Shortcuts → **Automation** tab → **+** → **Time of Day** → `12:05 AM` → **Daily** → choose `Adhan alarms` → turn on **Run Immediately** and turn off **Notify When Run**.

**Two honest caveats.** Shortcuts has no action to delete an alarm, so fired alarms pile up in the Clock app — say "Hey Siri, delete all alarms" once a week and let the automation rebuild them that night. And this route needs a connection at 12:05 AM, since it pulls from the Aladhan API rather than the app's own math.

---

## Location

Three ways to set it, all working offline:

- **Search** — 278 cities across every continent, each with its own IANA time zone so daylight saving is handled correctly wherever you are.
- **Use my current location** — GPS, with the time zone taken from the device.
- **Enter coordinates manually** — latitude, longitude and time zone, for anywhere not in the list.

Whatever you pick is remembered, and the calendar export follows it.

## High latitudes

Above roughly 48° in summer the sun never dips far enough below the horizon for Fajr or Isha to occur by calculation — the equations have no solution, and a naive app shows blank rows. London, Berlin, Stockholm, Oslo, Moscow and Anchorage all hit this in June.

Three standard correction rules are available under Settings, defaulting to **angle based**. When one is in use for the day being shown, a notice appears above the timetable saying so. Below about 48° the rule changes nothing at all.

Further north still, inside the Arctic and Antarctic circles, the sun may not rise or set at all. The app says so plainly rather than inventing a time — in that case follow the timetable of the nearest city where the sun does rise, or whatever your scholars advise.

## Colour schemes

Four, switchable under Settings, remembered between launches:

- **Midnight** — deep navy, aquamarine, yellow, green
- **Amethyst** — purple, aquamarine, orange
- **Grove** — deep green, orange, yellow
- **Blossom** — pink, violet, sky blue (light)
- **Custom** — pick your own

### Custom colours

Four pickers: background, and three highlights (primary/now, second/upcoming, third/completed). Everything else — card surfaces, borders, button fills, the text ramp, the arc gradient, the compass — is derived from those four, and updates live as you drag.

The derivation enforces WCAG contrast on every derived token, so a bad combination cannot make the app unreadable. If a highlight is too close to your background, it is automatically lightened and a note tells you which one was adjusted. A mid-tone background (where neither black nor white text would read on the cards) causes the card surfaces to step further away from the page until they do.

Verified against pure black, pure white, mid grey, saturated red, cream, and a deliberately awful set of four near-identical colours. All pass.

## Notes on the calculation

Times come from standard solar position formulas — Julian date, equation of time, solar declination, hour angle — iterated three times per event for accuracy. Nothing is fetched.

Defaults are ISNA (15° Fajr, 15° Isha) and Standard Asr, which is what most masjids in the New York area publish. Thirteen methods are available under Settings — including Umm al-Qura, Karachi, Egyptian, Diyanet, MUIS Singapore, Dubai, Qatar, Kuwait and UOIF France — along with per-prayer minute adjustments if you want to match a specific masjid's printed timetable exactly.

Dhuhr carries a one-minute margin past true solar zenith.

The Hijri date is the calendrical Umm al-Qura conversion. Local moon sighting may differ by a day.

Qibla is computed by great-circle bearing and works from anywhere — 58.5° from Brooklyn, 277.5° from Sydney, 148.2° from Stockholm. The live compass reads magnetic north, which differs from true north by roughly 13° in the New York area and by varying amounts elsewhere, so the printed bearing is the accurate one.
