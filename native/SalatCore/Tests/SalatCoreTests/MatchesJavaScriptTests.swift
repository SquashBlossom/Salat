// The Swift math must give the same answers as the JavaScript (and so the web app,
// the server, and the original single-file app). Fixtures: scripts/make-fixtures.mjs.
import XCTest
import Foundation
@testable import SalatCore

private func fixture(_ name: String) throws -> Any {
    let url = try XCTUnwrap(Bundle.module.url(forResource: name, withExtension: "json", subdirectory: "Fixtures"))
    return try JSONSerialization.jsonObject(with: Data(contentsOf: url))
}

/// Same number, or both "does not occur". Tolerance: 1e-9 hours (3.6 microseconds),
/// because Swift and JavaScript may round the last bit of sin/cos differently.
private func same(_ swift: Double, _ js: Any?, _ what: String, file: StaticString = #filePath, line: UInt = #line) {
    if let j = js as? Double {
        XCTAssertEqual(swift, j, accuracy: 1e-9, what, file: file, line: line)
    } else {
        XCTAssertFalse(swift.isFinite, "\(what): JavaScript says it does not occur, Swift says \(swift)", file: file, line: line)
    }
}

final class MatchesJavaScriptTests: XCTestCase {

    /// 100 cases saved from the ORIGINAL single-file app (5 places × 2 methods × 2 Asr × 5 dates).
    func testRawTimesMatchTheOriginalApp() throws {
        let rows = try XCTUnwrap(fixture("legacy-fixture") as? [[String: Any]])
        var checked = 0
        for r in rows where r["t"] != nil {
            let date = r["date"] as! [Int], m = r["m"] as! [String: Any], t = r["t"] as! [String: Any]
            let o = TimeOptions(fajrAngle: m["fajrAngle"] as! Double, ishaAngle: m["ishaAngle"] as? Double,
                                ishaMinutes: m["ishaMinutes"] as? Double, asrFactor: r["asr"] as! Double, hiLat: .angle)
            let h = computeTimes(date[0], date[1], date[2], lat: r["lat"] as! Double, lng: r["lng"] as! Double, tz: r["tz"] as! Double, o)
            let label = "\(r["n"]!) \(date)"
            for p in Prayer.allCases { same(h[p], t[p.rawValue], "\(label) \(p)") }
            XCTAssertEqual(h.adjusted, t["__adjusted"] as? Bool, "\(label) adjusted")
            XCTAssertEqual(h.polar, t["__polar"] as? Bool, "\(label) polar")
            checked += 1
        }
        XCTAssertEqual(checked, 100)
        // Qibla bearings from the original app.
        let coords = ["Brooklyn": (40.6782, -73.9442), "London": (51.5074, -0.1278), "Stockholm": (59.3293, 18.0686),
                      "Sydney": (-33.8688, 151.2093), "Mecca": (21.4225, 39.8262)]
        let qibla = try XCTUnwrap(rows.last?["qibla"] as? [[Any]])
        for q in qibla {
            let (lat, lng) = coords[q[0] as! String]!
            XCTAssertEqual(qiblaBearing(lat: lat, lng: lng), q[1] as! Double, accuracy: 1e-9, "qibla \(q[0])")
        }
    }

    /// 10 full schedules from today's shared/schedule.js: time zones (including Tehran's half hour),
    /// both daylight-saving changes, the far north with every high-latitude rule, adjustments, alert leads.
    func testSchedulesAndAlertsMatchTheWebApp() throws {
        let rows = try XCTUnwrap(fixture("schedule-fixture") as? [[String: Any]])
        XCTAssertEqual(rows.count, 10)
        let iso = ISO8601DateFormatter()
        for r in rows {
            let settings = try JSONDecoder().decode(Settings.self, from: JSONSerialization.data(withJSONObject: r["settings"]!))
            let from = try XCTUnwrap(iso.date(from: r["from"] as! String))
            let date = r["date"] as! [Int], label = "\(r["place"]!) \(date) \(settings.method)"

            XCTAssertEqual(tzOffset(from, settings.loc.zone), r["tzAt"] as! Double, "\(label) time zone now")
            let day = dayTimes(settings, date[0], date[1], date[2])
            XCTAssertEqual(day.tz, r["tz"] as! Double, "\(label) time zone at noon")
            let hours = r["hours"] as! [String: Any]
            for p in Prayer.allCases { same(day.hours[p], hours[p.rawValue], "\(label) \(p)") }
            XCTAssertEqual(day.hours.adjusted, hours["__adjusted"] as? Bool, "\(label) adjusted")
            XCTAssertEqual(day.hours.polar, hours["__polar"] as? Bool, "\(label) polar")
            if let wall = r["wall"] as? Double {
                XCTAssertEqual(wallToDate(day.y, day.m, day.d, hours: day.hours.dhuhr, zone: day.zone).timeIntervalSince1970 * 1000, wall, accuracy: 1, "\(label) Dhuhr as a moment")
            }
            same(sunAltitude(day.y, day.m, day.d, hour: 12, lat: settings.loc.lat, lng: settings.loc.lng, tz: day.tz), r["altitudeAtNoonLocal"], "\(label) sun altitude")
            same(qiblaBearing(lat: settings.loc.lat, lng: settings.loc.lng), r["qibla"], "\(label) qibla")

            // The alert list: same prayers, same moments (to the millisecond), same words.
            let js = r["alerts"] as! [[String: Any]]
            let swift = upcomingAlerts(settings, from: from, days: 2)
            XCTAssertEqual(swift.map(\.prayer.rawValue), js.map { $0["k"] as! String }, "\(label) alert order")
            for (s, j) in zip(swift, js) {
                XCTAssertEqual(s.at.timeIntervalSince1970 * 1000, j["at"] as! Double, accuracy: 1, "\(label) \(s.prayer) ring time")
                XCTAssertEqual(s.prayerAt.timeIntervalSince1970 * 1000, j["prayerAt"] as! Double, accuracy: 1, "\(label) \(s.prayer) prayer time")
                let words = alertText(s, leadMinutes: settings.alerts.lead, time: formatTime(s.hour, format: settings.fmt))
                XCTAssertEqual(words.title, j["title"] as? String, "\(label) \(s.prayer) title")
                XCTAssertEqual(words.body, j["body"] as? String, "\(label) \(s.prayer) body")
            }
        }
    }
}
