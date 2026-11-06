// SalatTokens.swift — MADE BY app/scripts/tokens-swift.mjs. Do not edit by hand.
// Source of truth: app/src/styles/tokens.css. Re-run: npm run tokens:swift -w app
import SwiftUI

/// One theme's colour roles. Names match the web kit (DESIGN.md).
public struct SalatPalette {
    public let bg: Color
    public let glow1: Color
    public let glow2: Color
    public let surface: Color
    public let surfaceSunk: Color
    public let line: Color
    public let lineStrong: Color
    public let control: Color
    public let controlPressed: Color
    public let selected: Color
    public let now: Color
    public let next: Color
    public let done: Color
    public let nowWash: Color
    public let nextWash: Color
    public let nowLine: Color
    public let nowText: Color
    public let text: Color
    public let text2: Color
    public let text3: Color
    public let label: Color
    public let statusbar: Color
}

public enum SalatTheme: String, CaseIterable {
    case midnight
    case amethyst
    case grove
    case blossom

    public var palette: SalatPalette {
        switch self {
        case .midnight: return SalatPalette(
            bg: Color(red: 0.01568627450980392, green: 0.06274509803921569, blue: 0.12156862745098039),
            glow1: Color(red: 0.06274509803921569, green: 0.18823529411764706, blue: 0.35294117647058826),
            glow2: Color(red: 0.0392156862745098, green: 0.16470588235294117, blue: 0.24313725490196078),
            surface: Color(red: 0.050980392156862744, green: 0.1411764705882353, blue: 0.25098039215686274),
            surfaceSunk: Color(red: 0.0392156862745098, green: 0.10588235294117647, blue: 0.2),
            line: Color(red: 0.09019607843137255, green: 0.2, blue: 0.3215686274509804),
            lineStrong: Color(red: 0.1411764705882353, green: 0.3137254901960784, blue: 0.49411764705882355),
            control: Color(red: 0.058823529411764705, green: 0.16470588235294117, blue: 0.2901960784313726),
            controlPressed: Color(red: 0.08627450980392157, green: 0.21568627450980393, blue: 0.3607843137254902),
            selected: Color(red: 0.07058823529411765, green: 0.23137254901960785, blue: 0.23921568627450981),
            now: Color(red: 0.37254901960784315, green: 0.8901960784313725, blue: 0.7843137254901961),
            next: Color(red: 1, green: 0.788235294117647, blue: 0.2901960784313726),
            done: Color(red: 0.2823529411764706, green: 0.8352941176470589, blue: 0.592156862745098),
            nowWash: Color(red: 0.37254901960784315, green: 0.8901960784313725, blue: 0.7843137254901961, opacity: .14),
            nextWash: Color(red: 1, green: 0.788235294117647, blue: 0.2901960784313726, opacity: .14),
            nowLine: Color(red: 0.37254901960784315, green: 0.8901960784313725, blue: 0.7843137254901961, opacity: .55),
            nowText: Color(red: 0.4980392156862745, green: 0.9411764705882353, blue: 0.8470588235294118),
            text: Color(red: 0.9098039215686274, green: 0.9490196078431372, blue: 1),
            text2: Color(red: 0.6588235294117647, green: 0.7686274509803922, blue: 0.8784313725490196),
            text3: Color(red: 0.5294117647058824, green: 0.6509803921568628, blue: 0.7764705882352941),
            label: Color(red: 0.5607843137254902, green: 0.6901960784313725, blue: 0.8235294117647058),
            statusbar: Color(red: 0.01568627450980392, green: 0.06274509803921569, blue: 0.12156862745098039)
        )
        case .amethyst: return SalatPalette(
            bg: Color(red: 0.0784313725490196, green: 0.0392156862745098, blue: 0.14901960784313725),
            glow1: Color(red: 0.23137254901960785, green: 0.10980392156862745, blue: 0.4196078431372549),
            glow2: Color(red: 0.16470588235294117, green: 0.08235294117647059, blue: 0.3137254901960784),
            surface: Color(red: 0.1411764705882353, green: 0.07058823529411765, blue: 0.2627450980392157),
            surfaceSunk: Color(red: 0.10588235294117647, green: 0.054901960784313725, blue: 0.20392156862745098),
            line: Color(red: 0.22745098039215686, green: 0.12941176470588237, blue: 0.3764705882352941),
            lineStrong: Color(red: 0.3215686274509804, green: 0.18823529411764706, blue: 0.5137254901960784),
            control: Color(red: 0.16470588235294117, green: 0.09019607843137255, blue: 0.3137254901960784),
            controlPressed: Color(red: 0.22745098039215686, green: 0.12941176470588237, blue: 0.40784313725490196),
            selected: Color(red: 0.07058823529411765, green: 0.24705882352941178, blue: 0.23921568627450981),
            now: Color(red: 0.37254901960784315, green: 0.8901960784313725, blue: 0.7843137254901961),
            next: Color(red: 1, green: 0.6039215686274509, blue: 0.30196078431372547),
            done: Color(red: 0.6627450980392157, green: 0.5450980392156862, blue: 1),
            nowWash: Color(red: 0.37254901960784315, green: 0.8901960784313725, blue: 0.7843137254901961, opacity: .15),
            nextWash: Color(red: 1, green: 0.6039215686274509, blue: 0.30196078431372547, opacity: .16),
            nowLine: Color(red: 0.37254901960784315, green: 0.8901960784313725, blue: 0.7843137254901961, opacity: .55),
            nowText: Color(red: 0.4980392156862745, green: 0.9411764705882353, blue: 0.8470588235294118),
            text: Color(red: 0.9568627450980393, green: 0.9254901960784314, blue: 1),
            text2: Color(red: 0.803921568627451, green: 0.7176470588235294, blue: 0.9254901960784314),
            text3: Color(red: 0.6705882352941176, green: 0.5725490196078431, blue: 0.8392156862745098),
            label: Color(red: 0.7372549019607844, green: 0.6392156862745098, blue: 0.8784313725490196),
            statusbar: Color(red: 0.0784313725490196, green: 0.0392156862745098, blue: 0.14901960784313725)
        )
        case .grove: return SalatPalette(
            bg: Color(red: 0.0196078431372549, green: 0.09019607843137255, blue: 0.058823529411764705),
            glow1: Color(red: 0.058823529411764705, green: 0.2901960784313726, blue: 0.19215686274509805),
            glow2: Color(red: 0.03137254901960784, green: 0.19607843137254902, blue: 0.12156862745098039),
            surface: Color(red: 0.047058823529411764, green: 0.16470588235294117, blue: 0.11372549019607843),
            surfaceSunk: Color(red: 0.03137254901960784, green: 0.12941176470588237, blue: 0.08627450980392157),
            line: Color(red: 0.08627450980392157, green: 0.27450980392156865, blue: 0.18823529411764706),
            lineStrong: Color(red: 0.12156862745098039, green: 0.3843137254901961, blue: 0.26666666666666666),
            control: Color(red: 0.054901960784313725, green: 0.2, blue: 0.13725490196078433),
            controlPressed: Color(red: 0.0784313725490196, green: 0.26666666666666666, blue: 0.19215686274509805),
            selected: Color(red: 0.25098039215686274, green: 0.1568627450980392, blue: 0.058823529411764705),
            now: Color(red: 1, green: 0.6235294117647059, blue: 0.27058823529411763),
            next: Color(red: 1, green: 0.8470588235294118, blue: 0.2901960784313726),
            done: Color(red: 0.49411764705882355, green: 0.9098039215686274, blue: 0.6823529411764706),
            nowWash: Color(red: 1, green: 0.6235294117647059, blue: 0.27058823529411763, opacity: .16),
            nextWash: Color(red: 1, green: 0.8470588235294118, blue: 0.2901960784313726, opacity: .15),
            nowLine: Color(red: 1, green: 0.6235294117647059, blue: 0.27058823529411763, opacity: .55),
            nowText: Color(red: 1, green: 0.7686274509803922, blue: 0.5333333333333333),
            text: Color(red: 0.9176470588235294, green: 0.984313725490196, blue: 0.9450980392156862),
            text2: Color(red: 0.6627450980392157, green: 0.8313725490196079, blue: 0.7372549019607844),
            text3: Color(red: 0.5294117647058824, green: 0.7254901960784313, blue: 0.6274509803921569),
            label: Color(red: 0.596078431372549, green: 0.7843137254901961, blue: 0.6823529411764706),
            statusbar: Color(red: 0.0196078431372549, green: 0.09019607843137255, blue: 0.058823529411764705)
        )
        case .blossom: return SalatPalette(
            bg: Color(red: 0.01568627450980392, green: 0.06274509803921569, blue: 0.12156862745098039),
            glow1: Color(red: 0.06274509803921569, green: 0.18823529411764706, blue: 0.35294117647058826),
            glow2: Color(red: 0.0392156862745098, green: 0.16470588235294117, blue: 0.24313725490196078),
            surface: Color(red: 0.050980392156862744, green: 0.1411764705882353, blue: 0.25098039215686274),
            surfaceSunk: Color(red: 0.0392156862745098, green: 0.10588235294117647, blue: 0.2),
            line: Color(red: 0.09019607843137255, green: 0.2, blue: 0.3215686274509804),
            lineStrong: Color(red: 0.1411764705882353, green: 0.3137254901960784, blue: 0.49411764705882355),
            control: Color(red: 0.058823529411764705, green: 0.16470588235294117, blue: 0.2901960784313726),
            controlPressed: Color(red: 0.08627450980392157, green: 0.21568627450980393, blue: 0.3607843137254902),
            selected: Color(red: 0.07058823529411765, green: 0.23137254901960785, blue: 0.23921568627450981),
            now: Color(red: 0.37254901960784315, green: 0.8901960784313725, blue: 0.7843137254901961),
            next: Color(red: 1, green: 0.788235294117647, blue: 0.2901960784313726),
            done: Color(red: 0.2823529411764706, green: 0.8352941176470589, blue: 0.592156862745098),
            nowWash: Color(red: 0.37254901960784315, green: 0.8901960784313725, blue: 0.7843137254901961, opacity: .14),
            nextWash: Color(red: 1, green: 0.788235294117647, blue: 0.2901960784313726, opacity: .14),
            nowLine: Color(red: 0.37254901960784315, green: 0.8901960784313725, blue: 0.7843137254901961, opacity: .55),
            nowText: Color(red: 0.4980392156862745, green: 0.9411764705882353, blue: 0.8470588235294118),
            text: Color(red: 0.9098039215686274, green: 0.9490196078431372, blue: 1),
            text2: Color(red: 0.6588235294117647, green: 0.7686274509803922, blue: 0.8784313725490196),
            text3: Color(red: 0.5294117647058824, green: 0.6509803921568628, blue: 0.7764705882352941),
            label: Color(red: 0.5607843137254902, green: 0.6901960784313725, blue: 0.8235294117647058),
            statusbar: Color(red: 0.01568627450980392, green: 0.06274509803921569, blue: 0.12156862745098039)
        )
        }
    }
}

/// Sizes in points (1 CSS px = 1 pt).
public enum SalatSize {
    public static let fsLabel: CGFloat = 10
    public static let fsCaption: CGFloat = 12
    public static let fsSmall: CGFloat = 13
    public static let fsUi: CGFloat = 14
    public static let fsBody: CGFloat = 15
    public static let fsTitle3: CGFloat = 17
    public static let fsLead: CGFloat = 20
    public static let fsTitle2: CGFloat = 22
    public static let fsTitle1: CGFloat = 26
    public static let fsFigure: CGFloat = 30
    public static let fsHeroArabic: CGFloat = 64
    public static let sp1: CGFloat = 4
    public static let sp2: CGFloat = 8
    public static let sp3: CGFloat = 12
    public static let sp4: CGFloat = 16
    public static let sp5: CGFloat = 20
    public static let sp6: CGFloat = 24
    public static let sp8: CGFloat = 32
    public static let sp12: CGFloat = 48
    public static let pageMax: CGFloat = 520
    public static let rXs: CGFloat = 4
    public static let rSm: CGFloat = 8
    public static let rMd: CGFloat = 12
    public static let rLg: CGFloat = 16
    public static let rXl: CGFloat = 22
    public static let rPill: CGFloat = 999
    public static let border: CGFloat = 1
    public static let touch: CGFloat = 44
    public static let controlLg: CGFloat = 50
    public static let controlMd: CGFloat = 44
    public static let controlSm: CGFloat = 34
    public static let iconSm: CGFloat = 15
    public static let iconMd: CGFloat = 20
    public static let iconLg: CGFloat = 22
}

/// Durations in seconds.
public enum SalatMotion {
    public static let durInstant: Double = 0.12
    public static let durMenu: Double = 0.18
    public static let durQuick: Double = 0.22
    public static let durBase: Double = 0.3
    public static let durSlow: Double = 0.5
    public static let durScene: Double = 0.9
    public static let durDraw: Double = 1.6
    public static let durBreathe: Double = 3.2
    public static let durGlow: Double = 2.4
    public static let stagger: Double = 0.08
    /// Strong ease-out, same curve as --ease-out on the web.
    public static let easeOut = Animation.timingCurve(0.23, 1, 0.32, 1, duration: dur(SalatMotion.durMenu))
    /// iOS sheet curve, same as --ease-sheet.
    public static let sheet = Animation.timingCurve(0.32, 0.72, 0, 1, duration: dur(SalatMotion.durBase))
    private static func dur(_ d: Double) -> Double { d }
}

/// Plain numbers (weights, line heights, press scale).
public enum SalatNumber {
    public static let fwRegular: Double = 400
    public static let fwMedium: Double = 500
    public static let fwSemibold: Double = 600
    public static let fwBold: Double = 700
    public static let lhTight: Double = 1.1
    public static let lhSnug: Double = 1.35
    public static let lhBody: Double = 1.5
    public static let lhLoose: Double = 1.6
    public static let pressScale: Double = .97
    public static let iconStroke: Double = 1.6
    public static let zSky: Double = 0
    public static let zPage: Double = 1
    public static let zScrim: Double = 40
    public static let zSheet: Double = 50
    public static let zMenu: Double = 55
    public static let zToast: Double = 60
    public static let zMoment: Double = 80
}
