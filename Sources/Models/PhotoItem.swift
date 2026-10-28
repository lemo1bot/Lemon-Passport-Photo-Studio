import Foundation
import AppKit
import CoreImage

public enum BackgroundMode: String, CaseIterable, Identifiable {
    case original = "Original"
    case pureWhite = "Pure White"
    case offWhite = "Off-White"
    case lightGrey = "Light Grey"
    case lightBlue = "Light Blue"
    case custom = "Custom Color"

    public var id: String { rawValue }

    public var color: NSColor {
        switch self {
        case .original: return .clear
        case .pureWhite: return .white
        case .offWhite: return NSColor(calibratedRed: 0.98, green: 0.97, blue: 0.96, alpha: 1.0)
        case .lightGrey: return NSColor(calibratedRed: 0.92, green: 0.92, blue: 0.93, alpha: 1.0)
        case .lightBlue: return NSColor(calibratedRed: 0.82, green: 0.89, blue: 0.96, alpha: 1.0)
        case .custom: return .white
        }
    }
}

public enum PhotoBorderStyle: String, CaseIterable, Identifiable {
    case none = "None"
    case thinGray = "Thin Gray (0.5 pt)"
    case thinBlack = "Thin Black (0.5 pt)"
    case dashed = "Dashed Cutting Line"

    public var id: String { rawValue }
}

public class PhotoItem: Identifiable, ObservableObject {
    public let id: UUID
    @Published public var name: String
    @Published public var originalImage: NSImage
    @Published public var copiesCount: Int

    // Transform & Crop
    @Published public var zoom: Double = 1.0
    @Published public var panOffset: CGPoint = .zero
    @Published public var rotationDegrees: Double = 0.0 // 0, 90, 180, 270
    @Published public var tiltDegrees: Double = 0.0 // Fine adjustment -15 to +15

    // Visual Enhancements
    @Published public var brightness: Double = 0.0 // -0.5 to 0.5
    @Published public var contrast: Double = 1.0 // 0.5 to 1.5
    @Published public var saturation: Double = 1.0 // 0.0 to 2.0
    @Published public var exposure: Double = 0.0 // -2.0 to 2.0
    @Published public var sharpness: Double = 0.4 // 0.0 to 1.0
    @Published public var isGrayscale: Bool = false

    // Background replacement
    @Published public var backgroundMode: BackgroundMode = .original
    @Published public var customBackgroundColor: NSColor = .white
    @Published public var segmentationMask: CIImage? = nil
    @Published public var isProcessingBackground: Bool = false

    // Border & Cutting
    @Published public var borderStyle: PhotoBorderStyle = .thinGray

    // Cached processed rendered image
    @Published public var processedImage: NSImage? = nil

    public init(id: UUID = UUID(), name: String, image: NSImage, copiesCount: Int = 5) {
        self.id = id
        self.name = name
        self.originalImage = image
        self.copiesCount = copiesCount
    }

    public func resetAdjustments() {
        zoom = 1.0
        panOffset = .zero
        rotationDegrees = 0.0
        tiltDegrees = 0.0
        brightness = 0.0
        contrast = 1.0
        saturation = 1.0
        exposure = 0.0
        sharpness = 0.4
        isGrayscale = false
        backgroundMode = .original
        borderStyle = .thinGray
    }
}
