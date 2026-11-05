// swift-tools-version:5.9
// SalatCore: the prayer math and alert schedule for the Swift app and its widgets.
// The same math as shared/ (JavaScript); the tests prove they agree.
import PackageDescription

let package = Package(
    name: "SalatCore",
    platforms: [.iOS(.v16), .macOS(.v13), .watchOS(.v9)],
    products: [.library(name: "SalatCore", targets: ["SalatCore"])],
    targets: [
        .target(name: "SalatCore"),
        .testTarget(name: "SalatCoreTests", dependencies: ["SalatCore"], resources: [.copy("Fixtures")]),
    ]
)
