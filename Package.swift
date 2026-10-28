// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "PassportPhotoStudio",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(
            name: "PassportPhotoStudio",
            targets: ["PassportPhotoStudio"]
        )
    ],
    targets: [
        .executableTarget(
            name: "PassportPhotoStudio",
            path: "Sources"
        )
    ]
)
