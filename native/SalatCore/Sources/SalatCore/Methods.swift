// Calculation methods and the prayer list. Owns: data only. Mirrors shared/methods.js.

public struct Method: Sendable {
    public let id: String
    public let name: String
    public let fajrAngle: Double
    public let ishaAngle: Double?    // nil: Isha is ishaMinutes after Maghrib
    public let ishaMinutes: Double?
}

public enum Methods {
    public static let all: [Method] = [
        Method(id: "isna", name: "ISNA (North America)", fajrAngle: 15, ishaAngle: 15, ishaMinutes: nil),
        Method(id: "mwl", name: "Muslim World League", fajrAngle: 18, ishaAngle: 17, ishaMinutes: nil),
        Method(id: "egypt", name: "Egyptian General Authority", fajrAngle: 19.5, ishaAngle: 17.5, ishaMinutes: nil),
        Method(id: "karachi", name: "Univ. of Islamic Sciences, Karachi", fajrAngle: 18, ishaAngle: 18, ishaMinutes: nil),
        Method(id: "makkah", name: "Umm al-Qura, Makkah", fajrAngle: 18.5, ishaAngle: nil, ishaMinutes: 90),
        Method(id: "dubai", name: "Dubai", fajrAngle: 18.2, ishaAngle: 18.2, ishaMinutes: nil),
        Method(id: "qatar", name: "Qatar", fajrAngle: 18, ishaAngle: nil, ishaMinutes: 90),
        Method(id: "kuwait", name: "Kuwait", fajrAngle: 18, ishaAngle: 17.5, ishaMinutes: nil),
        Method(id: "singapore", name: "Singapore (MUIS)", fajrAngle: 20, ishaAngle: 18, ishaMinutes: nil),
        Method(id: "turkey", name: "Diyanet, Turkiye", fajrAngle: 18, ishaAngle: 17, ishaMinutes: nil),
        Method(id: "france", name: "UOIF, France", fajrAngle: 12, ishaAngle: 12, ishaMinutes: nil),
        Method(id: "moonsighting", name: "Moonsighting Committee", fajrAngle: 18, ishaAngle: 18, ishaMinutes: nil),
        Method(id: "jafari", name: "Jaʿfari (Leva Institute)", fajrAngle: 16, ishaAngle: 14, ishaMinutes: nil),
    ]
    /// Unknown ids fall back to ISNA, like the JavaScript.
    public static func byId(_ id: String) -> Method { all.first { $0.id == id } ?? all[0] }
}

public enum Prayer: String, CaseIterable, Codable, Sendable {
    case fajr, sunrise, dhuhr, asr, maghrib, isha

    public var english: String {
        switch self { case .fajr: "Fajr"; case .sunrise: "Sunrise"; case .dhuhr: "Dhuhr"; case .asr: "Asr"; case .maghrib: "Maghrib"; case .isha: "Isha" }
    }
    public var arabic: String {
        switch self { case .fajr: "الفجر"; case .sunrise: "الشروق"; case .dhuhr: "الظهر"; case .asr: "العصر"; case .maghrib: "المغرب"; case .isha: "العشاء" }
    }
    public var subtitle: String {
        switch self {
        case .fajr: "First light"; case .sunrise: "Fajr window closes"; case .dhuhr: "Sun past zenith"
        case .asr: "Afternoon"; case .maghrib: "Sunset"; case .isha: "Night"
        }
    }
    /// Sunrise is shown but is not one of the five prayers.
    public var isObligatory: Bool { self != .sunrise }
}
