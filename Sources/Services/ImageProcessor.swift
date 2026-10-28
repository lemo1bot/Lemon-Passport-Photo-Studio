import Foundation
import AppKit
import CoreImage
import CoreGraphics

public class ImageProcessor {
    public static let shared = ImageProcessor()
    private let ciContext: CIContext

    private init() {
        ciContext = CIContext(options: [
            .useSoftwareRenderer: false,
            .priorityRequestLow: false
        ])
    }

    /// Renders the cropped, adjusted, and bordered passport photo at high resolution (300 DPI)
    public func renderPassportPhoto(
        item: PhotoItem,
        targetWidthMM: Double,
        targetHeightMM: Double,
        targetDPI: Double = 300.0
    ) -> NSImage? {
        guard let tiffData = item.originalImage.tiffRepresentation,
              var currentCI = CIImage(data: tiffData) else {
            return nil
        }

        // 1. Background Replacement
        if item.backgroundMode != .original, let mask = item.segmentationMask {
            let bgColor = item.backgroundMode == .custom ? item.customBackgroundColor : item.backgroundMode.color
            if let blended = VisionService.shared.blendWithBackgroundColor(
                originalCI: currentCI,
                mask: mask,
                backgroundColor: bgColor
            ) {
                currentCI = blended
            }
        }

        // 2. Exposure Adjust
        if abs(item.exposure) > 0.01, let exposureFilter = CIFilter(name: "CIExposureAdjust") {
            exposureFilter.setValue(currentCI, forKey: kCIInputImageKey)
            exposureFilter.setValue(item.exposure, forKey: kCIInputEVKey)
            if let out = exposureFilter.outputImage { currentCI = out }
        }

        // 3. Color Controls (Brightness, Contrast, Saturation)
        if let colorFilter = CIFilter(name: "CIColorControls") {
            colorFilter.setValue(currentCI, forKey: kCIInputImageKey)
            colorFilter.setValue(item.brightness, forKey: kCIInputBrightnessKey)
            colorFilter.setValue(item.contrast, forKey: kCIInputContrastKey)
            let sat = item.isGrayscale ? 0.0 : item.saturation
            colorFilter.setValue(sat, forKey: kCIInputSaturationKey)
            if let out = colorFilter.outputImage { currentCI = out }
        }

        // 4. Sharpness Enhancement
        if item.sharpness > 0.01, let sharpenFilter = CIFilter(name: "CISharpenLuminance") {
            sharpenFilter.setValue(currentCI, forKey: kCIInputImageKey)
            sharpenFilter.setValue(item.sharpness, forKey: kCIInputSharpnessKey)
            if let out = sharpenFilter.outputImage { currentCI = out }
        }

        // 5. Total Rotation & Tilt
        let totalRotationDegrees = item.rotationDegrees + item.tiltDegrees
        if abs(totalRotationDegrees) > 0.01 {
            let radians = totalRotationDegrees * .pi / 180.0
            let center = CGPoint(x: currentCI.extent.midX, y: currentCI.extent.midY)
            var transform = CGAffineTransform.identity
            transform = transform.translatedBy(x: center.x, y: center.y)
            transform = transform.rotated(by: CGFloat(radians))
            transform = transform.translatedBy(x: -center.x, y: -center.y)
            currentCI = currentCI.transformed(by: transform)
        }

        // Target pixel dimensions at target DPI (e.g. 300 DPI)
        // 1 inch = 25.4 mm
        let targetPixelWidth = (targetWidthMM / 25.4) * targetDPI
        let targetPixelHeight = (targetHeightMM / 25.4) * targetDPI
        let targetAspect = targetPixelWidth / targetPixelHeight

        // Determine crop area from original image coordinate space
        let extent = currentCI.extent
        let baseCropHeight: CGFloat
        let baseCropWidth: CGFloat

        if extent.width / extent.height > targetAspect {
            // Image is wider than passport
            baseCropHeight = extent.height
            baseCropWidth = extent.height * targetAspect
        } else {
            // Image is taller than passport
            baseCropWidth = extent.width
            baseCropHeight = extent.width / targetAspect
        }

        // Factor in user zoom
        let effectiveZoom = max(0.2, item.zoom)
        let cropWidth = baseCropWidth / effectiveZoom
        let cropHeight = baseCropHeight / effectiveZoom

        // Factor in user pan offset (scaled relative to original extent)
        let panScale = cropHeight / 400.0 // Normalized to standard canvas size
        let panX = CGFloat(item.panOffset.x) * panScale
        let panY = CGFloat(item.panOffset.y) * panScale

        let cropCenterX = extent.midX - panX
        let cropCenterY = extent.midY + panY // In CIImage, positive Y is UP

        let cropRect = CGRect(
            x: cropCenterX - (cropWidth / 2.0),
            y: cropCenterY - (cropHeight / 2.0),
            width: cropWidth,
            height: cropHeight
        )

        let croppedCI = currentCI.cropped(to: cropRect)

        // Scale to target pixel dimensions
        let scaleX = CGFloat(targetPixelWidth) / cropWidth
        let scaleY = CGFloat(targetPixelHeight) / cropHeight
        let scaledCI = croppedCI.transformed(by: CGAffineTransform(scaleX: scaleX, y: scaleY))

        // Create CGImage at exact target pixel dimensions
        let finalRect = CGRect(x: 0, y: 0, width: targetPixelWidth, height: targetPixelHeight)
        guard let cgImage = ciContext.createCGImage(scaledCI, from: finalRect) else {
            return nil
        }

        // Wrap in NSImage with exact physical points (72 DPI points)
        let pointsWidth = targetWidthMM * 72.0 / 25.4
        let pointsHeight = targetHeightMM * 72.0 / 25.4
        let finalImage = NSImage(cgImage: cgImage, size: NSSize(width: pointsWidth, height: pointsHeight))

        // Draw border if requested
        if item.borderStyle != .none {
            let borderedImage = NSImage(size: finalImage.size)
            borderedImage.lockFocus()
            finalImage.draw(in: CGRect(origin: .zero, size: finalImage.size))

            let borderPath = NSBezierPath(rect: CGRect(x: 0.25, y: 0.25, width: pointsWidth - 0.5, height: pointsHeight - 0.5))
            borderPath.lineWidth = 0.5

            switch item.borderStyle {
            case .none: break
            case .thinGray:
                NSColor(calibratedWhite: 0.75, alpha: 1.0).setStroke()
                borderPath.stroke()
            case .thinBlack:
                NSColor.black.setStroke()
                borderPath.stroke()
            case .dashed:
                NSColor(calibratedWhite: 0.5, alpha: 1.0).setStroke()
                let pattern: [CGFloat] = [3.0, 2.0]
                borderPath.setLineDash(pattern, count: 2, phase: 0)
                borderPath.stroke()
            }

            borderedImage.unlockFocus()
            return borderedImage
        }

        return finalImage
    }
}
