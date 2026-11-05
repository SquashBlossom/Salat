// Plain-language checks of how the schedule behaves, independent of the JavaScript.
import XCTest
@testable import SalatCore

final class BehaviourTests: XCTestCase {
    private let noonNY = Date(timeIntervalSince1970: 1_793_811_600) // 2026-11-04 12:00 in New York

    private func on(_ change: (inout Settings) -> Void = { _ in }) -> Settings {
        var s = Settings(); s.alerts.enabled = true; change(&s); return s
    }

    func testAlertsAreOffUntilTurnedOn() {
        XCTAssertTrue(upcomingAlerts(Settings(), from: noonNY).isEmpty)
    }

    func testAlertsAreInTimeOrderAllInTheFutureAndSkipSunrise() {
        let list = upcomingAlerts(on(), from: noonNY, days: 2)
        XCTAssertGreaterThanOrEqual(list.count, 8)
        XCTAssertEqual(list.map(\.at), list.map(\.at).sorted())
        XCTAssertTrue(list.allSatisfy { $0.at > noonNY })
        XCTAssertFalse(list.contains { $0.prayer == .sunrise })
    }

    func testLeadTimeMovesTheAlertEarlierByExactlyThatMuch() throws {
        let a = try XCTUnwrap(upcomingAlerts(on { $0.alerts.lead = 10 }, from: noonNY).first)
        XCTAssertEqual(a.prayerAt.timeIntervalSince(a.at), 600, accuracy: 0.001)
    }

    func testTurningOnePrayerOffRemovesOnlyThatPrayer() {
        let list = upcomingAlerts(on { $0.alerts.prayers["asr"] = false }, from: noonNY, days: 2)
        XCTAssertFalse(list.contains { $0.prayer == .asr })
        XCTAssertTrue(list.contains { $0.prayer == .maghrib })
    }

    func testWallClockRoundTripOnTheDayClocksFallBack() {
        let d = wallToDate(2026, 11, 1, hours: 13.5, zone: "America/New_York")
        let p = partsIn(d, "America/New_York")
        XCTAssertEqual([p.h, p.mi], [13, 30])
    }

    func testTwelveDaysOfAlertsFitIOSsLimitOf64() {
        // iOS keeps at most 64 pending local notifications: 5 prayers × 12 days = 60.
        let list = upcomingAlerts(on(), from: noonNY, days: 12)
        XCTAssertLessThanOrEqual(list.count, 64)
        XCTAssertGreaterThanOrEqual(list.count, 58)
    }

    func testTimeWords() {
        XCTAssertEqual(formatTime(16.8167, format: 12), "4:49 PM")
        XCTAssertEqual(formatTime(16.8167, format: 24), "16:49")
        XCTAssertEqual(formatTime(0.25, format: 12), "12:15 AM")
        XCTAssertEqual(formatTime(.nan), "--:--")
    }

    func testSettingsSavedByTheWebAppDecodeWithDefaultsForMissingFields() throws {
        let json = #"{"loc":{"name":"London","lat":51.5,"lng":-0.12,"zone":"Europe/London"},"asr":2,"alerts":{"enabled":true,"prayers":{"asr":false}}}"#
        let s = try JSONDecoder().decode(Settings.self, from: Data(json.utf8))
        XCTAssertEqual(s.loc.name, "London")
        XCTAssertEqual(s.asr, 2)
        XCTAssertEqual(s.method, "isna")                    // default kept
        XCTAssertEqual(s.alerts.isOn(.asr), false)          // changed
        XCTAssertEqual(s.alerts.isOn(.fajr), true)          // default kept
        XCTAssertEqual(s.adj["isha"], 0)
    }
}
