import AppKit
import CoreGraphics

func createMacOSIconImage(sourceImage: NSImage, targetSize: CGFloat) -> NSImage {
    let image = NSImage(size: NSSize(width: targetSize, height: targetSize))
    image.lockFocus()
    guard let ctx = NSGraphicsContext.current?.cgContext else {
        image.unlockFocus()
        return image
    }

    let bounds = CGRect(x: 0, y: 0, width: targetSize, height: targetSize)

    // Standard macOS squircle dimensions: inset ~9.5%, corner radius ~20%
    let margin = targetSize * 0.095
    let iconRect = bounds.insetBy(dx: margin, dy: margin)
    let cornerRadius = iconRect.width * 0.2237

    // 1. Draw outer drop shadow
    ctx.saveGState()
    let shadowColor = NSColor.black.withAlphaComponent(0.35).cgColor
    ctx.setShadow(offset: CGSize(width: 0, height: -targetSize * 0.025), blur: targetSize * 0.045, color: shadowColor)

    let squirclePath = CGPath(roundedRect: iconRect, cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)
    ctx.addPath(squirclePath)
    ctx.setFillColor(NSColor.black.cgColor)
    ctx.fillPath()
    ctx.restoreGState()

    // 2. Draw user photo clipped to squircle
    ctx.saveGState()
    ctx.addPath(squirclePath)
    ctx.clip()

    // Draw source photo to fill iconRect
    var sourceRect = NSRect(origin: .zero, size: sourceImage.size)
    if let cgSource = sourceImage.cgImage(forProposedRect: &sourceRect, context: nil, hints: nil) {
        ctx.draw(cgSource, in: iconRect)
    }

    // 3. Inner border highlight (subtle glossy glass edge)
    ctx.setLineWidth(max(1.0, targetSize * 0.008))
    ctx.setStrokeColor(NSColor.white.withAlphaComponent(0.3).cgColor)
    ctx.addPath(squirclePath)
    ctx.strokePath()

    ctx.restoreGState()

    image.unlockFocus()
    return image
}

guard CommandLine.arguments.count >= 3 else {
    print("Usage: swift generate_icon_from_image.swift <source_image> <output_icns_dir>")
    exit(1)
}

let sourcePath = CommandLine.arguments[1]
let outputDir = CommandLine.arguments[2]

guard let sourceImg = NSImage(contentsOfFile: sourcePath) else {
    print("Error: Could not load source image from \(sourcePath)")
    exit(1)
}

let iconsetDir = URL(fileURLWithPath: outputDir).appendingPathComponent("AppIcon.iconset")
let fm = FileManager.default
try? fm.removeItem(at: iconsetDir)
try? fm.createDirectory(at: iconsetDir, withIntermediateDirectories: true, attributes: nil)

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

for (filename, px) in sizes {
    let rendered = createMacOSIconImage(sourceImage: sourceImg, targetSize: px)
    guard let tiff = rendered.tiffRepresentation,
          let rep = NSBitmapImageRep(data: tiff),
          let pngData = rep.representation(using: .png, properties: [:]) else {
        print("Error creating PNG for \(filename)")
        continue
    }

    let fileURL = iconsetDir.appendingPathComponent(filename)
    try? pngData.write(to: fileURL)
}

print("Iconset created successfully at \(iconsetDir.path)")
