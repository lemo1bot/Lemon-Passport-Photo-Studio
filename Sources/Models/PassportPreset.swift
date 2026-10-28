import Foundation

public enum MeasurementUnit: String, CaseIterable, Identifiable {
    case millimeters = "mm"
    case centimeters = "cm"
    case inches = "in"

    public var id: String { rawValue }

    public func toMillimeters(_ value: Double) -> Double {
        switch self {
        case .millimeters: return value
        case .centimeters: return value * 10.0
        case .inches: return value * 25.4
        }
    }

    public func fromMillimeters(_ mm: Double) -> Double {
        switch self {
        case .millimeters: return mm
        case .centimeters: return mm / 10.0
        case .inches: return mm / 25.4
        }
    }
}

public struct PassportPreset: Identifiable, Hashable {
    public let id: String
    public let name: String
    public let country: String
    public let widthMM: Double
    public let heightMM: Double
    public let headCoverageMin: Double // % of photo height
    public let headCoverageMax: Double
    public let backgroundColorName: String
    public let notes: String

    public var widthPoints: Double {
        return widthMM * 72.0 / 25.4
    }

    public var heightPoints: Double {
        return heightMM * 72.0 / 25.4
    }

    public var aspectRatio: Double {
        return widthMM / heightMM
    }

    public static let presets: [PassportPreset] = [
        PassportPreset(
            id: "india_passport",
            name: "India Passport / Visa",
            country: "India",
            widthMM: 35.0,
            heightMM: 45.0,
            headCoverageMin: 0.70,
            headCoverageMax: 0.80,
            backgroundColorName: "White",
            notes: "35x45 mm, 70-80% face coverage, white background"
        ),
        PassportPreset(
            id: "india_oci",
            name: "India OCI / Visa (2x2\")",
            country: "India",
            widthMM: 50.8,
            heightMM: 50.8,
            headCoverageMin: 0.70,
            headCoverageMax: 0.80,
            backgroundColorName: "White",
            notes: "2x2 inch (51x51 mm) square format"
        ),
        PassportPreset(
            id: "us_passport",
            name: "US Passport & Visa (2x2\")",
            country: "United States",
            widthMM: 50.8,
            heightMM: 50.8,
            headCoverageMin: 0.50,
            headCoverageMax: 0.69,
            backgroundColorName: "White / Off-White",
            notes: "2x2 inch (51x51 mm), head 1\" to 1 3/8\""
        ),
        PassportPreset(
            id: "uk_schengen",
            name: "UK / Schengen / EU Passport",
            country: "Europe / UK",
            widthMM: 35.0,
            heightMM: 45.0,
            headCoverageMin: 0.70,
            headCoverageMax: 0.80,
            backgroundColorName: "Light Grey / Cream / White",
            notes: "35x45 mm, head 29-34 mm from crown to chin"
        ),
        PassportPreset(
            id: "canada_passport",
            name: "Canada Passport",
            country: "Canada",
            widthMM: 50.0,
            heightMM: 70.0,
            headCoverageMin: 0.44,
            headCoverageMax: 0.51,
            backgroundColorName: "White / Light",
            notes: "50x70 mm, head height 31-36 mm"
        ),
        PassportPreset(
            id: "australia_passport",
            name: "Australia & New Zealand",
            country: "Australia / NZ",
            widthMM: 35.0,
            heightMM: 45.0,
            headCoverageMin: 0.71,
            headCoverageMax: 0.80,
            backgroundColorName: "White / Light Grey",
            notes: "35x45 mm, head 32-36 mm"
        ),
        PassportPreset(
            id: "japan_passport",
            name: "Japan Passport",
            country: "Japan",
            widthMM: 35.0,
            heightMM: 45.0,
            headCoverageMin: 0.70,
            headCoverageMax: 0.78,
            backgroundColorName: "Plain Light / White",
            notes: "35x45 mm, crown to chin 32-36 mm"
        ),
        PassportPreset(
            id: "china_passport",
            name: "China Passport & Visa",
            country: "China",
            widthMM: 33.0,
            heightMM: 48.0,
            headCoverageMin: 0.58,
            headCoverageMax: 0.69,
            backgroundColorName: "White",
            notes: "33x48 mm, head width 15-22 mm"
        ),
        PassportPreset(
            id: "uae_visa",
            name: "UAE / Dubai Visa",
            country: "United Arab Emirates",
            widthMM: 40.0,
            heightMM: 60.0,
            headCoverageMin: 0.70,
            headCoverageMax: 0.80,
            backgroundColorName: "White",
            notes: "40x60 mm, high contrast white background"
        ),
        PassportPreset(
            id: "square_35",
            name: "Square ID (35x35 mm)",
            country: "International",
            widthMM: 35.0,
            heightMM: 35.0,
            headCoverageMin: 0.65,
            headCoverageMax: 0.75,
            backgroundColorName: "White",
            notes: "35x35 mm general ID standard"
        ),
        PassportPreset(
            id: "standard_30x40",
            name: "Standard ID (30x40 mm)",
            country: "International",
            widthMM: 30.0,
            heightMM: 40.0,
            headCoverageMin: 0.70,
            headCoverageMax: 0.80,
            backgroundColorName: "White",
            notes: "30x40 mm driving license / student ID"
        ),
        PassportPreset(
            id: "custom",
            name: "Custom Size...",
            country: "Custom",
            widthMM: 35.0,
            heightMM: 45.0,
            headCoverageMin: 0.70,
            headCoverageMax: 0.80,
            backgroundColorName: "Custom",
            notes: "Specify any custom width and height"
        )
    ]
}
