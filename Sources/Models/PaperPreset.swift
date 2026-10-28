import Foundation

public enum PaperOrientation: String, CaseIterable, Identifiable {
    case portrait = "Portrait"
    case landscape = "Landscape"

    public var id: String { rawValue }
}

public struct PaperPreset: Identifiable, Hashable {
    public let id: String
    public let name: String
    public let widthMM: Double
    public let heightMM: Double
    public let description: String

    public func effectiveWidthMM(orientation: PaperOrientation) -> Double {
        return orientation == .portrait ? min(widthMM, heightMM) : max(widthMM, heightMM)
    }

    public func effectiveHeightMM(orientation: PaperOrientation) -> Double {
        return orientation == .portrait ? max(widthMM, heightMM) : min(widthMM, heightMM)
    }

    public func widthPoints(orientation: PaperOrientation) -> Double {
        return effectiveWidthMM(orientation: orientation) * 72.0 / 25.4
    }

    public func heightPoints(orientation: PaperOrientation) -> Double {
        return effectiveHeightMM(orientation: orientation) * 72.0 / 25.4
    }

    public static let presets: [PaperPreset] = [
        PaperPreset(
            id: "a4",
            name: "A4 Sheet (210 × 297 mm)",
            widthMM: 210.0,
            heightMM: 297.0,
            description: "Standard document & photo paper worldwide"
        ),
        PaperPreset(
            id: "photo_4x6",
            name: "4 × 6 inches (10 × 15 cm)",
            widthMM: 101.6,
            heightMM: 152.4,
            description: "Standard postcard / home photo printer paper"
        ),
        PaperPreset(
            id: "us_letter",
            name: "US Letter (8.5 × 11 in)",
            widthMM: 215.9,
            heightMM: 279.4,
            description: "North American standard paper"
        ),
        PaperPreset(
            id: "photo_5x7",
            name: "5 × 7 inches (13 × 18 cm)",
            widthMM: 127.0,
            heightMM: 177.8,
            description: "Medium format photo paper"
        ),
        PaperPreset(
            id: "a5",
            name: "A5 Sheet (148 × 210 mm)",
            widthMM: 148.0,
            heightMM: 210.0,
            description: "Half A4 size"
        ),
        PaperPreset(
            id: "a6",
            name: "A6 Sheet (105 × 148 mm)",
            widthMM: 105.0,
            heightMM: 148.0,
            description: "Quarter A4 size"
        ),
        PaperPreset(
            id: "photo_8x10",
            name: "8 × 10 inches (20 × 25 cm)",
            widthMM: 203.2,
            heightMM: 254.0,
            description: "Large format photo print"
        ),
        PaperPreset(
            id: "custom_paper",
            name: "Custom Paper Size...",
            widthMM: 210.0,
            heightMM: 297.0,
            description: "User defined paper dimensions"
        )
    ]
}
