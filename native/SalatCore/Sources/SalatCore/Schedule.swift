// Day schedules: settings + a date become real moments in time, and the list of upcoming alerts.
// Owns: wall-clock <-> UTC conversion, one day's times, upcoming alerts, alert words.
// Refuses: UI and scheduling notifications (the app does that with these results).
// Mirrors shared/schedule.js; the settings decode from the same JSON the web app saves.
import Foundation

public struct Location: Codable, Equatable, Sendable {
    public var name: String
    public var lat: Double
    public var lng: Double
    public var zone: String
    public init(name: String, lat: Double, lng: Double, zone: String) { self.name = name; self.lat = lat; self.lng = lng; self.zone = zone }
}

public struct AlertSettings: Codable, Equatable, Sendable {
    public var enabled: Bool = false
    public var lead: Double = 0                 // minutes before the prayer
    public var prayers: [String: Bool] = ["fajr": true, "sunrise": false, "dhuhr": true, "asr": true, "maghrib": true, "isha": true]
    public init() {}
    public init(from decoder: Decoder) throws {     // missing fields keep their defaults, like withDefaults()
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let d = AlertSettings()
        enabled = try c.decodeIfPresent(Bool.self, forKey: .enabled) ?? d.enabled
        lead = try c.decodeIfPresent(Double.self, forKey: .lead) ?? d.lead
        prayers = d.prayers.merging(try c.decodeIfPresent([String: Bool].self, forKey: .prayers) ?? [:]) { _, new in new }
    }
    public func isOn(_ p: Prayer) -> Bool { prayers[p.rawValue] ?? false }
}

/// The same settings the web app keeps (see DEFAULT_SETTINGS in shared/schedule.js).
public struct Settings: Codable, Equatable, Sendable {
    public var loc = Location(name: "Brooklyn, NY, USA", lat: 40.6782, lng: -73.9442, zone: "America/New_York")
    public var method = "isna"
    public var asr: Int = 1                     // 1 Standard, 2 Hanafi
    public var hiLat: HighLatRule = .angle
    public var fmt: Int = 12
    public var alarm: Int = 10
    public var adj: [String: Double] = ["fajr": 0, "sunrise": 0, "dhuhr": 0, "asr": 0, "maghrib": 0, "isha": 0]
    public var alerts = AlertSettings()

    public init() {}
    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let d = Settings()
        loc = try c.decodeIfPresent(Location.self, forKey: .loc) ?? d.loc
        method = try c.decodeIfPresent(String.self, forKey: .method) ?? d.method
        asr = try c.decodeIfPresent(Int.self, forKey: .asr) ?? d.asr
        hiLat = try c.decodeIfPresent(HighLatRule.self, forKey: .hiLat) ?? d.hiLat
        fmt = try c.decodeIfPresent(Int.self, forKey: .fmt) ?? d.fmt
        alarm = try c.decodeIfPresent(Int.self, forKey: .alarm) ?? d.alarm
        adj = d.adj.merging(try c.decodeIfPresent([String: Double].self, forKey: .adj) ?? [:]) { _, new in new }
        alerts = try c.decodeIfPresent(AlertSettings.self, forKey: .alerts) ?? d.alerts
    }

    public var options: TimeOptions {
        let m = Methods.byId(method)
        return TimeOptions(fajrAngle: m.fajrAngle, ishaAngle: m.ishaAngle, ishaMinutes: m.ishaMinutes, asrFactor: Double(asr), hiLat: hiLat)
    }
}

public struct DayParts: Equatable, Sendable { public let y, m, d, h, mi: Int }

private func calendar(_ zone: String) -> Calendar {
    var cal = Calendar(identifier: .gregorian)
    cal.timeZone = TimeZone(identifier: zone) ?? .current
    return cal
}

/// Calendar parts of a moment, as seen on a wall clock in `zone`.
public func partsIn(_ date: Date, _ zone: String) -> DayParts {
    let c = calendar(zone).dateComponents([.year, .month, .day, .hour, .minute], from: date)
    return DayParts(y: c.year!, m: c.month!, d: c.day!, h: c.hour!, mi: c.minute!)
}

/// JavaScript's Math.round: halves go up (toward +infinity).
@inline(__always) func jsRound(_ x: Double) -> Double { (x + 0.5).rounded(.down) }

/// A wall-clock hour on a date in `zone`, as a real moment.
public func wallToDate(_ y: Int, _ m: Int, _ d: Int, hours: Double, zone: String) -> Date {
    let noonUTC = Date(timeIntervalSince1970: utcMillis(y, m, d, 12) / 1000)
    let off = tzOffset(noonUTC, zone)
    let ms = utcMillis(y, m, d, 0) + jsRound(hours * 3_600_000) - off * 3_600_000
    return Date(timeIntervalSince1970: ms / 1000)
}

/// Date.UTC(y, m-1, d, h) in milliseconds.
func utcMillis(_ y: Int, _ m: Int, _ d: Int, _ h: Int) -> Double {
    var cal = Calendar(identifier: .gregorian)
    cal.timeZone = TimeZone(identifier: "UTC")!
    let date = cal.date(from: DateComponents(year: y, month: m, day: d, hour: h))!
    return (date.timeIntervalSince1970 * 1000).rounded()
}

public func shiftDay(_ y: Int, _ m: Int, _ d: Int, by n: Int) -> (y: Int, m: Int, d: Int) {
    var cal = Calendar(identifier: .gregorian)
    cal.timeZone = TimeZone(identifier: "UTC")!
    let start = cal.date(from: DateComponents(year: y, month: m, day: d, hour: 12))!
    let c = cal.dateComponents([.year, .month, .day], from: cal.date(byAdding: .day, value: n, to: start)!)
    return (c.year!, c.month!, c.day!)
}

public struct DayTimes: Sendable {
    public let hours: PrayerHours   // wall-clock hours, adjustments applied
    public let tz: Double
    public let y, m, d: Int
    public let zone: String
}

/// One day's prayer times for the settings' location.
public func dayTimes(_ s: Settings, _ y: Int, _ m: Int, _ d: Int) -> DayTimes {
    let tz = tzOffset(Date(timeIntervalSince1970: utcMillis(y, m, d, 12) / 1000), s.loc.zone)
    var h = computeTimes(y, m, d, lat: s.loc.lat, lng: s.loc.lng, tz: tz, s.options)
    for p in Prayer.allCases { h[p] += (s.adj[p.rawValue] ?? 0) / 60 }
    return DayTimes(hours: h, tz: tz, y: y, m: m, d: d, zone: s.loc.zone)
}

public struct PrayerEvent: Sendable {
    public let prayer: Prayer
    public let hour: Double     // wall-clock hour at the place, 0–24
    public let date: Date
    public let dayKey: String
}

/// Every prayer as a dated event, for `days` days starting the day before `from`.
public func events(_ s: Settings, from: Date = Date(), days: Int = 3) -> [PrayerEvent] {
    let p = partsIn(from, s.loc.zone)
    var out: [PrayerEvent] = []
    for i in -1..<(days - 1) {
        let dp = shiftDay(p.y, p.m, p.d, by: i)
        let day = dayTimes(s, dp.y, dp.m, dp.d)
        for pr in Prayer.allCases {
            let h = day.hours[pr]
            guard h.isFinite else { continue }
            out.append(PrayerEvent(prayer: pr, hour: fixHour(h), date: wallToDate(dp.y, dp.m, dp.d, hours: h, zone: s.loc.zone), dayKey: "\(dp.y)-\(dp.m)-\(dp.d)"))
        }
    }
    // Stable sort (ties keep their order), exactly like JavaScript's Array.prototype.sort.
    return out.enumerated().sorted { $0.element.date != $1.element.date ? $0.element.date < $1.element.date : $0.offset < $1.offset }.map(\.element)
}

public struct UpcomingAlert: Sendable {
    public let prayer: Prayer
    public let hour: Double     // wall-clock hour of the prayer at the place
    public let prayerAt: Date   // when the prayer begins
    public let at: Date         // when to ring (prayerAt minus the lead)
}

/// Upcoming alerts after `from`, honouring the alert settings. Empty when alerts are off.
public func upcomingAlerts(_ s: Settings, from: Date = Date(), days: Int = 2) -> [UpcomingAlert] {
    let a = s.alerts
    guard a.enabled else { return [] }
    let lead = max(0, min(60, a.lead)) * 60
    return events(s, from: from, days: days + 1)
        .filter { a.isOn($0.prayer) }
        .map { UpcomingAlert(prayer: $0.prayer, hour: $0.hour, prayerAt: $0.date, at: $0.date.addingTimeInterval(-lead)) }
        .filter { $0.at > from }
}

/// The words on an alert. The Arabic is isolated so "4:49 PM" never splits around it.
public func alertText(_ alert: UpcomingAlert, leadMinutes: Double, time: String) -> (title: String, body: String) {
    let body = (time.isEmpty ? "" : time + " · ") + "\u{2068}" + alert.prayer.arabic + "\u{2069}"
    if leadMinutes > 0 { return ("\(alert.prayer.english) in \(Int(leadMinutes)) min", body) }
    return ("It's time for \(alert.prayer.english)", body)
}

/// "4:49 PM" or "16:49", same rounding as the web app.
public func formatTime(_ hour: Double, format: Int = 12) -> String {
    guard hour.isFinite else { return "--:--" }
    let mins = Int(jsRound(fixHour(hour) * 60)), hh = (mins / 60) % 24, mm = mins % 60
    if format == 24 { return String(format: "%02d:%02d", hh, mm) }
    let h12 = hh % 12 == 0 ? 12 : hh % 12
    return String(format: "%d:%02d %@", h12, mm, hh < 12 ? "AM" : "PM")
}
