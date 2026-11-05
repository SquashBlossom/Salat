// Solar math: Julian date, sun position, prayer times, sun altitude, Qibla.
// Owns: pure astronomy. Refuses: UI, storage, network.
// A line-for-line copy of shared/solar.js, so the Swift app, the web app and the
// server all give the same times. Tests check it against the JavaScript's answers.
import Foundation

let D = Double.pi / 180
@inline(__always) func sind(_ a: Double) -> Double { sin(a * D) }
@inline(__always) func cosd(_ a: Double) -> Double { cos(a * D) }
@inline(__always) func tand(_ a: Double) -> Double { tan(a * D) }
@inline(__always) func asind(_ x: Double) -> Double { asin(x) / D }
@inline(__always) func acosd(_ x: Double) -> Double { acos(x) / D }
@inline(__always) func atan2d(_ y: Double, _ x: Double) -> Double { atan2(y, x) / D }
@inline(__always) func acotd(_ x: Double) -> Double { atan(1 / x) / D }

/// JavaScript's `%` keeps the sign of the left side; so does truncatingRemainder.
public func fixAngle(_ a: Double) -> Double { (a.truncatingRemainder(dividingBy: 360) + 360).truncatingRemainder(dividingBy: 360) }
public func fixHour(_ a: Double) -> Double { (a.truncatingRemainder(dividingBy: 24) + 24).truncatingRemainder(dividingBy: 24) }

public func julian(_ year: Int, _ month: Int, _ day: Int) -> Double {
    var y = Double(year), m = Double(month)
    if m <= 2 { y -= 1; m += 12 }
    let A = (y / 100).rounded(.down), B = 2 - A + (A / 4).rounded(.down)
    return (365.25 * (y + 4716)).rounded(.down) + (30.6001 * (m + 1)).rounded(.down) + Double(day) + B - 1524.5
}

public struct SunPosition { public let decl: Double; public let eqt: Double }

public func sunPos(_ jd: Double) -> SunPosition {
    let T = jd - 2451545.0
    let g = fixAngle(357.529 + 0.98560028 * T)
    let q = fixAngle(280.459 + 0.98564736 * T)
    let L = fixAngle(q + 1.915 * sind(g) + 0.020 * sind(2 * g))
    let e = 23.439 - 0.00000036 * T
    let RA = fixAngle(atan2d(cosd(e) * sind(L), cosd(L))) / 15
    return SunPosition(decl: asind(sind(e) * sind(L)), eqt: q / 15 - fixHour(RA))
}

/// High-latitude rule, for places where Fajr or Isha may not occur in summer.
public enum HighLatRule: String, Codable, CaseIterable, Sendable { case angle, seventh, middle, none }

/// What computeTimes needs from a method and the person's choices.
public struct TimeOptions: Sendable {
    public var fajrAngle: Double
    public var ishaAngle: Double?        // nil: Isha is a fixed number of minutes after Maghrib
    public var ishaMinutes: Double?
    public var asrFactor: Double         // 1 Standard, 2 Hanafi
    public var hiLat: HighLatRule
    public init(fajrAngle: Double, ishaAngle: Double?, ishaMinutes: Double?, asrFactor: Double, hiLat: HighLatRule) {
        self.fajrAngle = fajrAngle; self.ishaAngle = ishaAngle; self.ishaMinutes = ishaMinutes
        self.asrFactor = asrFactor; self.hiLat = hiLat
    }
}

/// One day's times in wall-clock hours (e.g. 16.82 = 4:49 PM). NaN means "does not occur".
public struct PrayerHours: Equatable, Sendable {
    public var fajr, sunrise, dhuhr, asr, maghrib, isha: Double
    public var adjusted: Bool   // a high-latitude estimate was used
    public var polar: Bool      // the sun does not rise or set today

    public subscript(_ p: Prayer) -> Double {
        get {
            switch p { case .fajr: fajr; case .sunrise: sunrise; case .dhuhr: dhuhr; case .asr: asr; case .maghrib: maghrib; case .isha: isha }
        }
        set {
            switch p {
            case .fajr: fajr = newValue; case .sunrise: sunrise = newValue; case .dhuhr: dhuhr = newValue
            case .asr: asr = newValue; case .maghrib: maghrib = newValue; case .isha: isha = newValue
            }
        }
    }
}

public func computeTimes(_ y: Int, _ m: Int, _ d: Int, lat: Double, lng: Double, tz: Double, _ o: TimeOptions) -> PrayerHours {
    let jD = julian(y, m, d) - lng / (15 * 24)
    func midDay(_ t: Double) -> Double { fixHour(12 - sunPos(jD + t).eqt) }
    func angleTime(_ ang: Double, _ t: Double, _ dir: Double) -> Double {
        let decl = sunPos(jD + t).decl
        let x = (-sind(ang) - sind(decl) * sind(lat)) / (cosd(decl) * cosd(lat))
        if x > 1 || x < -1 { return .nan }
        return midDay(t) + dir * (acosd(x) / 15)
    }
    func asrT(_ f: Double, _ t: Double) -> Double {
        let decl = sunPos(jD + t).decl
        let alt = acotd(f + tand(abs(lat - decl)))
        let x = (sind(alt) - sind(decl) * sind(lat)) / (cosd(decl) * cosd(lat))
        if x > 1 || x < -1 { return .nan }
        return midDay(t) + acosd(x) / 15
    }

    // Start guesses as fractions of a day, refined three times (same as the JavaScript).
    var t = (fajr: 5.0 / 24, sunrise: 6.0 / 24, dhuhr: 12.0 / 24, asr: 13.0 / 24, maghrib: 18.0 / 24, isha: 18.0 / 24)
    for _ in 0..<3 {
        let sunset = angleTime(0.833, t.maghrib, 1)
        let isha: Double = o.ishaAngle != nil ? angleTime(o.ishaAngle!, t.isha, 1) : sunset + (o.ishaMinutes ?? .nan) / 60
        t = (fajr: angleTime(o.fajrAngle, t.fajr, -1) / 24,
             sunrise: angleTime(0.833, t.sunrise, -1) / 24,
             dhuhr: midDay(t.dhuhr) / 24,
             asr: asrT(o.asrFactor, t.asr) / 24,
             maghrib: sunset / 24,
             isha: isha / 24)
    }
    var out = PrayerHours(fajr: t.fajr * 24, sunrise: t.sunrise * 24, dhuhr: t.dhuhr * 24, asr: t.asr * 24,
                          maghrib: t.maghrib * 24, isha: t.isha * 24, adjusted: false, polar: false)

    // High latitude rule: without it, Fajr and Isha do not exist in summer above ~48°.
    var adjusted = false
    if o.hiLat != .none && out.sunrise.isFinite && out.maghrib.isFinite {
        let night = fixHour(out.sunrise - out.maghrib)
        func portion(_ a: Double) -> Double { o.hiLat == .middle ? 1.0 / 2 : o.hiLat == .seventh ? 1.0 / 7 : a / 60 }
        let fLimit = portion(o.fajrAngle) * night
        if !out.fajr.isFinite || fixHour(out.sunrise - out.fajr) > fLimit { out.fajr = out.sunrise - fLimit; adjusted = true }
        let iAngle = o.ishaAngle ?? 18
        let iLimit = portion(iAngle) * night
        if !out.isha.isFinite || fixHour(out.isha - out.maghrib) > iLimit { out.isha = out.maghrib + iLimit; adjusted = true }
    }
    let shift = tz - lng / 15
    for p in Prayer.allCases { out[p] += shift }
    out.dhuhr += 1.0 / 60
    out.adjusted = adjusted
    out.polar = !out.sunrise.isFinite || !out.maghrib.isFinite
    return out
}

public func sunAltitude(_ y: Int, _ m: Int, _ d: Int, hour: Double, lat: Double, lng: Double, tz: Double) -> Double {
    let jD = julian(y, m, d) - lng / (15 * 24) + (hour - tz + lng / 15) / 24
    let s = sunPos(jD)
    let noon = fixHour(12 - s.eqt) + tz - lng / 15
    return asind(sind(s.decl) * sind(lat) + cosd(s.decl) * cosd(lat) * cosd(15 * (hour - noon)))
}

/// Hours ahead of UTC for a time zone at a moment (e.g. -5 for New York in winter, 3.5 for Tehran).
public func tzOffset(_ date: Date, _ zone: String) -> Double {
    guard let tz = TimeZone(identifier: zone) else { return Double(TimeZone.current.secondsFromGMT(for: date)) / 3600 }
    return Double(tz.secondsFromGMT(for: date)) / 3600
}

/// Compass bearing from true north to the Kaaba.
public func qiblaBearing(lat: Double, lng: Double) -> Double {
    let kLat = 21.4225, kLng = 39.8262, dL = kLng - lng
    return fixAngle(atan2d(sind(dL), cosd(lat) * tand(kLat) - sind(lat) * cosd(dL)))
}
