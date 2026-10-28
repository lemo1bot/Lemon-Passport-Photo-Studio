import AppKit
import CoreGraphics

func drawLemonAppIcon(size: CGFloat) -> NSImage {
    let image = NSImage(size: NSSize(width: size, height: size))
    image.lockFocus()
    guard let ctx = NSGraphicsContext.current?.cgContext else { return image }

    let bounds = CGRect(x: 0, y: 0, width: size, height: size)
    let margin = size * 0.08
    let cardRect = bounds.insetBy(dx: margin, dy: margin)
    let cornerRadius = size * 0.22

    // 1. App Icon Squircle Background with Warm Golden Lemon Gradient
    let squircle = CGPath(roundedRect: cardRect, cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)
    ctx.saveGState()
    ctx.addPath(squircle)
    ctx.clip()

    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let bgColors = [
        NSColor(calibratedRed: 0.99, green: 0.82, blue: 0.15, alpha: 1.0).cgColor,
        NSColor(calibratedRed: 0.95, green: 0.65, blue: 0.05, alpha: 1.0).cgColor
    ] as CFArray
    let bgGradient = CGGradient(colorsSpace: colorSpace, colors: bgColors, locations: [0.0, 1.0])!
    ctx.drawLinearGradient(bgGradient, start: CGPoint(x: cardRect.midX, y: cardRect.maxY), end: CGPoint(x: cardRect.midX, y: cardRect.minY), options: [])
    ctx.restoreGState()

    // 2. White Passport Print Card in the Center
    let photoW = size * 0.54
    let photoH = size * 0.66
    let photoRect = CGRect(
        x: cardRect.midX - (photoW / 2.0),
        y: cardRect.midY - (photoH / 2.0) - (size * 0.015),
        width: photoW,
        height: photoH
    )

    ctx.saveGState()
    ctx.setShadow(offset: CGSize(width: 0, height: -size * 0.035), blur: size * 0.07, color: NSColor.black.withAlphaComponent(0.28).cgColor)
    let photoPath = CGPath(roundedRect: photoRect, cornerWidth: size * 0.035, cornerHeight: size * 0.035, transform: nil)
    ctx.addPath(photoPath)
    ctx.setFillColor(NSColor.white.cgColor)
    ctx.fillPath()
    ctx.restoreGState()

    // 3. Inner Photo Portrait & Biometric Frame
    let innerMargin = size * 0.03
    let innerRect = photoRect.insetBy(dx: innerMargin, dy: innerMargin)
    let innerPath = CGPath(roundedRect: innerRect, cornerWidth: size * 0.02, cornerHeight: size * 0.02, transform: nil)

    ctx.saveGState()
    ctx.addPath(innerPath)
    ctx.clip()

    // Light studio background
    let studioColors = [
        NSColor(calibratedRed: 0.93, green: 0.96, blue: 0.99, alpha: 1.0).cgColor,
        NSColor(calibratedRed: 0.85, green: 0.90, blue: 0.96, alpha: 1.0).cgColor
    ] as CFArray
    let studioGradient = CGGradient(colorsSpace: colorSpace, colors: studioColors, locations: [0.0, 1.0])!
    ctx.drawLinearGradient(studioGradient, start: CGPoint(x: innerRect.midX, y: innerRect.maxY), end: CGPoint(x: innerRect.midX, y: innerRect.minY), options: [])

    // Head Silhouette
    let headW = innerRect.width * 0.44
    let headH = headW * 1.25
    let headRect = CGRect(x: innerRect.midX - (headW / 2.0), y: innerRect.midY - (headH * 0.15), width: headW, height: headH)
    ctx.setFillColor(NSColor(calibratedRed: 0.18, green: 0.28, blue: 0.42, alpha: 1.0).cgColor)
    ctx.fillEllipse(in: headRect)

    // Shoulders
    let shoulderRect = CGRect(x: innerRect.midX - (innerRect.width * 0.5), y: innerRect.minY - (innerRect.height * 0.2), width: innerRect.width, height: innerRect.height * 0.5)
    ctx.fillEllipse(in: shoulderRect)

    // Eye-level biometric line (golden yellow)
    let eyeY = headRect.midY + (headH * 0.12)
    ctx.setStrokeColor(NSColor(calibratedRed: 0.98, green: 0.70, blue: 0.05, alpha: 0.9).cgColor)
    ctx.setLineWidth(max(1.0, size * 0.009))
    ctx.setLineDash(phase: 0, lengths: [size * 0.02, size * 0.015])
    ctx.move(to: CGPoint(x: innerRect.minX, y: eyeY))
    ctx.addLine(to: CGPoint(x: innerRect.maxX, y: eyeY))
    ctx.strokePath()

    ctx.restoreGState()

    // 4. Corner Crop Marks (L-marks) around the card
    let markLen = size * 0.055
    let markDist = size * 0.012
    ctx.setStrokeColor(NSColor(calibratedRed: 0.85, green: 0.55, blue: 0.05, alpha: 1.0).cgColor)
    ctx.setLineWidth(max(1.5, size * 0.012))
    ctx.setLineDash(phase: 0, lengths: [])

    // Top-Left L-mark
    let x1 = photoRect.minX - markDist
    let y1 = photoRect.maxY + markDist
    ctx.move(to: CGPoint(x: x1 - markLen, y: y1)); ctx.addLine(to: CGPoint(x: x1, y: y1)); ctx.addLine(to: CGPoint(x: x1, y: y1 + markLen))

    // Top-Right L-mark
    let x2 = photoRect.maxX + markDist
    ctx.move(to: CGPoint(x: x2 + markLen, y: y1)); ctx.addLine(to: CGPoint(x: x2, y: y1)); ctx.addLine(to: CGPoint(x: x2, y: y1 + markLen))

    // Bottom-Left L-mark
    ctx.move(to: CGPoint(x: x1 - markLen, y: photoRect.minY - markDist)); ctx.addLine(to: CGPoint(x: x1, y: photoRect.minY - markDist)); ctx.addLine(to: CGPoint(x: x1, y: photoRect.minY - markDist - markLen))

    // Bottom-Right L-mark
    ctx.move(to: CGPoint(x: x2 + markLen, y: photoRect.minY - markDist)); ctx.addLine(to: CGPoint(x: x2, y: photoRect.minY - markDist)); ctx.addLine(to: CGPoint(x: x2, y: photoRect.minY - markDist - markLen))
    ctx.strokePath()

    // 5. Stylized Lemon Fruit Badge with Leaf on Bottom-Right
    let lemonR = size * 0.15
    let lemonCenter = CGPoint(x: cardRect.maxX - lemonR * 0.85, y: cardRect.minY + lemonR * 0.85)

    ctx.saveGState()
    ctx.setShadow(offset: CGSize(width: 0, height: -size * 0.02), blur: size * 0.04, color: NSColor.black.withAlphaComponent(0.3).cgColor)

    // Green Leaf
    ctx.setFillColor(NSColor(calibratedRed: 0.16, green: 0.65, blue: 0.27, alpha: 1.0).cgColor)
    let leafPath = CGMutablePath()
    let leafBase = CGPoint(x: lemonCenter.x + lemonR * 0.2, y: lemonCenter.y + lemonR * 0.6)
    leafPath.move(to: leafBase)
    leafPath.addQuadCurve(to: CGPoint(x: leafBase.x + lemonR * 0.6, y: leafBase.y + lemonR * 0.5), control: CGPoint(x: leafBase.x + lemonR * 0.1, y: leafBase.y + lemonR * 0.7))
    leafPath.addQuadCurve(to: leafBase, control: CGPoint(x: leafBase.x + lemonR * 0.5, y: leafBase.y + lemonR * 0.2))
    ctx.addPath(leafPath)
    ctx.fillPath()

    // Yellow Lemon Oval
    let lemonRect = CGRect(x: lemonCenter.x - lemonR * 0.9, y: lemonCenter.y - lemonR * 0.75, width: lemonR * 1.8, height: lemonR * 1.5)
    ctx.setFillColor(NSColor(calibratedRed: 0.99, green: 0.88, blue: 0.10, alpha: 1.0).cgColor)
    ctx.fillEllipse(in: lemonRect)

    // Lemon outline
    ctx.setStrokeColor(NSColor(calibratedRed: 0.88, green: 0.68, blue: 0.02, alpha: 1.0).cgColor)
    ctx.setLineWidth(max(1.0, size * 0.008))
    ctx.strokeEllipse(in: lemonRect)

    // Printer icon or text "L"
    let font = NSFont.systemFont(ofSize: lemonR * 0.85, weight: .black)
    let attrs: [NSAttributedString.Key: Any] = [
        .font: font,
        .foregroundColor: NSColor(calibratedRed: 0.25, green: 0.18, blue: 0.02, alpha: 1.0)
    ]
    let lStr = NSString(string: "L")
    let strSize = lStr.size(withAttributes: attrs)
    lStr.draw(at: CGPoint(x: lemonCenter.x - (strSize.width / 2.0), y: lemonCenter.y - (strSize.height / 2.0) - 1), withAttributes: attrs)

    ctx.restoreGState()

    image.unlockFocus()
    return image
}

let fm = FileManager.default
let iconsetDir = "/tmp/Lemon.iconset"
try? fm.removeItem(atPath: iconsetDir)
try? fm.createDirectory(atPath: iconsetDir, withIntermediateDirectories: true)

let sizes: [(String, CGFloat)] = [
    ("icon_16x16.png", 16),
    ("icon_16x16@2x.png", 32),
    ("icon_32x32.png", 32),
    ("icon_32x32@2x.png", 64),
    ("icon_128x128.png", 128),
    ("icon_128x128@2x.png", 256),
    ("icon_256x256.png", 256),
    ("icon_256x256@2x.png", 512),
    ("icon_512x512.png", 512),
    ("icon_512x512@2x.png", 1024)
]

for (name, s) in sizes {
    let img = drawLemonAppIcon(size: s)
    if let tiff = img.tiffRepresentation,
       let rep = NSBitmapImageRep(data: tiff),
       let png = rep.representation(using: .png, properties: [:]) {
        let path = "\(iconsetDir)/\(name)"
        try? png.write(to: URL(fileURLWithPath: path))
    }
}

print("Lemon Iconset created successfully at \(iconsetDir)")
