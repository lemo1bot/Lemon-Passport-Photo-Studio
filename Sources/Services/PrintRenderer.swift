import Foundation
import AppKit
import PDFKit

public class PrintRenderer {
    public static let shared = PrintRenderer()

    private init() {}

    /// Core drawing method that draws the entire sheet content onto any CGContext or NSGraphicsContext
    public func drawSheet(
        context: CGContext,
        layout: SheetLayoutConfig,
        photos: [PhotoItem],
        paperRectPoints: CGRect
    ) {
        let slots = layout.calculateSlots()

        // 1. Draw sheet background (white)
        context.setFillColor(NSColor.white.cgColor)
        context.fill(paperRectPoints)

        // Flatten photos according to their copies count or assign across slots
        var photoListForSlots: [PhotoItem] = []
        if photos.count == 1, let single = photos.first {
            // Repeat single photo for all slots
            for _ in 0..<slots.count {
                photoListForSlots.append(single)
            }
        } else {
            // Distribute photos according to their copiesCount
            for photo in photos {
                for _ in 0..<photo.copiesCount {
                    photoListForSlots.append(photo)
                }
            }
            // If more slots than photos, loop back
            if !photos.isEmpty && photoListForSlots.count < slots.count {
                var idx = 0
                while photoListForSlots.count < slots.count {
                    photoListForSlots.append(photos[idx % photos.count])
                    idx += 1
                }
            }
        }

        let paperHeight = paperRectPoints.height

        // 2. Draw each photo in its slot
        for (i, slot) in slots.enumerated() {
            guard i < photoListForSlots.count else { break }
            let photo = photoListForSlots[i]

            // Convert slot coordinate: layout slots are in top-down coordinates
            // In AppKit / CoreGraphics default context, origin (0,0) is bottom-left
            let slotRectTopDown = slot.rectPoints
            let slotRectBottomUp = CGRect(
                x: slotRectTopDown.origin.x,
                y: paperHeight - slotRectTopDown.origin.y - slotRectTopDown.height,
                width: slotRectTopDown.width,
                height: slotRectTopDown.height
            )

            // Render photo
            let rendered = ImageProcessor.shared.renderPassportPhoto(
                item: photo,
                targetWidthMM: layout.passportWidthMM,
                targetHeightMM: layout.passportHeightMM,
                targetDPI: 300.0
            )

            if let nsImage = rendered,
               let cgImage = nsImage.cgImage(forProposedRect: nil, context: nil, hints: nil) {
                context.saveGState()
                context.draw(cgImage, in: slotRectBottomUp)
                context.restoreGState()
            } else {
                // Placeholder if no photo
                context.setFillColor(NSColor(calibratedWhite: 0.95, alpha: 1.0).cgColor)
                context.fill(slotRectBottomUp)
                context.setStrokeColor(NSColor(calibratedWhite: 0.8, alpha: 1.0).cgColor)
                context.setLineWidth(1.0)
                context.stroke(slotRectBottomUp)
            }

            // Draw Corner Crop Marks
            if layout.showCropMarks {
                drawCropMarks(context: context, rect: slotRectBottomUp)
            }
        }

        // 3. Draw Cut Lines if enabled
        if layout.showCutLines {
            drawGridCutLines(context: context, slots: slots, paperHeight: paperHeight)
        }

        // 4. Draw 50mm Calibration Scale Bar
        if layout.showCalibrationRuler {
            drawCalibrationRuler(context: context, layout: layout, paperRect: paperRectPoints)
        }

        // 5. Draw Information Label
        if layout.showPhotoInfoLabel {
            drawInfoLabel(context: context, layout: layout, paperRect: paperRectPoints, photoCount: slots.count)
        }
    }

    private func drawCropMarks(context: CGContext, rect: CGRect) {
        let markLength: CGFloat = 8.0 // ~2.8 mm
        let offset: CGFloat = 2.0 // 0.7 mm outside photo

        context.saveGState()
        context.setStrokeColor(NSColor(calibratedWhite: 0.35, alpha: 1.0).cgColor)
        context.setLineWidth(0.5)

        let x1 = rect.minX
        let x2 = rect.maxX
        let y1 = rect.minY
        let y2 = rect.maxY

        // Top-Left corner
        context.move(to: CGPoint(x: x1 - offset - markLength, y: y2))
        context.addLine(to: CGPoint(x: x1 - offset, y: y2))
        context.move(to: CGPoint(x: x1, y: y2 + offset + markLength))
        context.addLine(to: CGPoint(x: x1, y: y2 + offset))

        // Top-Right corner
        context.move(to: CGPoint(x: x2 + offset, y: y2))
        context.addLine(to: CGPoint(x: x2 + offset + markLength, y: y2))
        context.move(to: CGPoint(x: x2, y: y2 + offset + markLength))
        context.addLine(to: CGPoint(x: x2, y: y2 + offset))

        // Bottom-Left corner
        context.move(to: CGPoint(x: x1 - offset - markLength, y: y1))
        context.addLine(to: CGPoint(x: x1 - offset, y: y1))
        context.move(to: CGPoint(x: x1, y: y1 - offset - markLength))
        context.addLine(to: CGPoint(x: x1, y: y1 - offset))

        // Bottom-Right corner
        context.move(to: CGPoint(x: x2 + offset, y: y1))
        context.addLine(to: CGPoint(x: x2 + offset + markLength, y: y1))
        context.move(to: CGPoint(x: x2, y: y1 - offset - markLength))
        context.addLine(to: CGPoint(x: x2, y: y1 - offset))

        context.strokePath()
        context.restoreGState()
    }

    private func drawGridCutLines(context: CGContext, slots: [PhotoSlot], paperHeight: CGFloat) {
        guard let first = slots.first, let last = slots.last else { return }

        context.saveGState()
        context.setStrokeColor(NSColor(calibratedWhite: 0.7, alpha: 0.6).cgColor)
        context.setLineWidth(0.4)
        let lengths: [CGFloat] = [2.0, 2.0]
        context.setLineDash(phase: 0, lengths: lengths)

        for slot in slots {
            let rTopDown = slot.rectPoints
            let r = CGRect(
                x: rTopDown.origin.x,
                y: paperHeight - rTopDown.origin.y - rTopDown.height,
                width: rTopDown.width,
                height: rTopDown.height
            )

            // Outer dashed boundary
            context.stroke(r.insetBy(dx: -1.0, dy: -1.0))
        }

        context.restoreGState()
    }

    private func drawCalibrationRuler(context: CGContext, layout: SheetLayoutConfig, paperRect: CGRect) {
        let rulerWidthMM: Double = 50.0 // 50 mm = 5 cm
        let rulerWidthPoints = rulerWidthMM * 72.0 / 25.4
        let rulerHeightPoints: CGFloat = 12.0

        let marginPoints = layout.marginMM * 72.0 / 25.4
        let x = max(marginPoints, paperRect.midX - (rulerWidthPoints / 2.0))
        let y: CGFloat = 18.0 // 18 pt from bottom

        context.saveGState()

        // Base line
        context.setStrokeColor(NSColor(calibratedWhite: 0.2, alpha: 1.0).cgColor)
        context.setLineWidth(0.6)
        context.move(to: CGPoint(x: x, y: y))
        context.addLine(to: CGPoint(x: x + rulerWidthPoints, y: y))

        // Millimeter ticks (50 ticks)
        let mmInPoints = 72.0 / 25.4
        for mm in 0...50 {
            let tickX = x + (Double(mm) * mmInPoints)
            let tickHeight: CGFloat
            if mm % 10 == 0 {
                tickHeight = 7.0
            } else if mm % 5 == 0 {
                tickHeight = 5.0
            } else {
                tickHeight = 2.5
            }
            context.move(to: CGPoint(x: tickX, y: y))
            context.addLine(to: CGPoint(x: tickX, y: y + tickHeight))
        }
        context.strokePath()

        // Text label: "0" ... "50 mm"
        let font = NSFont.systemFont(ofSize: 6.5, weight: .medium)
        let attrs: [NSAttributedString.Key: Any] = [
            .font: font,
            .foregroundColor: NSColor(calibratedWhite: 0.3, alpha: 1.0)
        ]

        let label0 = NSString(string: "0")
        label0.draw(at: CGPoint(x: x - 2, y: y + 7), withAttributes: attrs)

        let label50 = NSString(string: "50 mm")
        label50.draw(at: CGPoint(x: x + rulerWidthPoints - 10, y: y + 7), withAttributes: attrs)

        let caption = NSString(string: "1:1 Print Scale Check Bar (Verify with physical ruler)")
        let captionSize = caption.size(withAttributes: attrs)
        caption.draw(at: CGPoint(x: x + (rulerWidthPoints - captionSize.width) / 2.0, y: y - 10), withAttributes: attrs)

        context.restoreGState()
    }

    private func drawInfoLabel(context: CGContext, layout: SheetLayoutConfig, paperRect: CGRect, photoCount: Int) {
        let font = NSFont.systemFont(ofSize: 7.0, weight: .regular)
        let attrs: [NSAttributedString.Key: Any] = [
            .font: font,
            .foregroundColor: NSColor(calibratedWhite: 0.45, alpha: 1.0)
        ]

        let marginPoints = layout.marginMM * 72.0 / 25.4
        let sizeText = "\(Int(layout.passportWidthMM))×\(Int(layout.passportHeightMM)) mm (\(layout.selectedPassport.name))"
        let paperText = "\(layout.selectedPaper.name) • \(layout.orientation.rawValue)"
        let text = NSString(string: "Passport Photo Studio • \(sizeText) • \(photoCount) Photos on \(paperText) • Print at 100% (No Scaling)")

        text.draw(at: CGPoint(x: marginPoints, y: paperRect.height - 14.0), withAttributes: attrs)
    }

    /// Renders sheet as an NSImage at preview scale
    public func renderPreviewImage(layout: SheetLayoutConfig, photos: [PhotoItem], scale: CGFloat = 1.0) -> NSImage {
        let width = layout.paperWidthPoints * scale
        let height = layout.paperHeightPoints * scale
        let size = NSSize(width: width, height: height)

        let image = NSImage(size: size)
        image.lockFocus()

        if let context = NSGraphicsContext.current?.cgContext {
            context.scaleBy(x: scale, y: scale)
            drawSheet(
                context: context,
                layout: layout,
                photos: photos,
                paperRectPoints: CGRect(x: 0, y: 0, width: layout.paperWidthPoints, height: layout.paperHeightPoints)
            )
        }

        image.unlockFocus()
        return image
    }

    /// Generates print-ready high-resolution 300 DPI PDF document
    public func generatePDF(layout: SheetLayoutConfig, photos: [PhotoItem]) -> Data {
        let pageRect = CGRect(x: 0, y: 0, width: layout.paperWidthPoints, height: layout.paperHeightPoints)
        let pdfData = NSMutableData()

        guard let consumer = CGDataConsumer(data: pdfData as CFMutableData),
              let context = CGContext(consumer: consumer, mediaBox: &pageRect as UnsafeMutablePointer<CGRect>?, nil) else {
            return Data()
        }

        context.beginPDFPage(nil)
        drawSheet(context: context, layout: layout, photos: photos, paperRectPoints: pageRect)
        context.endPDFPage()
        context.closePDF()

        return pdfData as Data
    }

    /// Generates high resolution 300 DPI PNG / JPEG raster image
    public func generateRasterImage(layout: SheetLayoutConfig, photos: [PhotoItem], dpi: Double = 300.0) -> NSImage? {
        let scale = dpi / 72.0
        let pixelWidth = Int(layout.paperWidthPoints * scale)
        let pixelHeight = Int(layout.paperHeightPoints * scale)

        guard let rep = NSBitmapImageRep(
            bitmapDataPlanes: nil,
            pixelsWide: pixelWidth,
            pixelsHigh: pixelHeight,
            bitsPerSample: 8,
            samplesPerPixel: 4,
            hasAlpha: true,
            isPlanar: false,
            colorSpaceName: .calibratedRGB,
            bytesPerRow: 0,
            bitsPerPixel: 0
        ) else {
            return nil
        }

        rep.size = NSSize(width: layout.paperWidthPoints, height: layout.paperHeightPoints)

        NSGraphicsContext.saveGraphicsState()
        if let context = NSGraphicsContext(bitmapImageRep: rep) {
            NSGraphicsContext.current = context
            let cgContext = context.cgContext
            cgContext.scaleBy(x: CGFloat(scale), y: CGFloat(scale))
            drawSheet(
                context: cgContext,
                layout: layout,
                photos: photos,
                paperRectPoints: CGRect(x: 0, y: 0, width: layout.paperWidthPoints, height: layout.paperHeightPoints)
            )
        }
        NSGraphicsContext.restoreGraphicsState()

        let image = NSImage(size: NSSize(width: layout.paperWidthPoints, height: layout.paperHeightPoints))
        image.addRepresentation(rep)
        return image
    }

    /// Displays the native macOS print operation dialog
    public func printSheet(layout: SheetLayoutConfig, photos: [PhotoItem]) {
        let printInfo = NSPrintInfo.shared.copy() as! NSPrintInfo
        printInfo.paperSize = NSSize(width: layout.paperWidthPoints, height: layout.paperHeightPoints)
        printInfo.orientation = layout.orientation == .portrait ? .portrait : .landscape
        printInfo.isHorizontallyCentered = false
        printInfo.isVerticallyCentered = false
        printInfo.leftMargin = 0
        printInfo.rightMargin = 0
        printInfo.topMargin = 0
        printInfo.bottomMargin = 0
        printInfo.scalingFactor = 1.0 // 100% exact scale!

        let printView = PrintableSheetView(layout: layout, photos: photos)
        printView.frame = CGRect(x: 0, y: 0, width: layout.paperWidthPoints, height: layout.paperHeightPoints)

        let op = NSPrintOperation(view: printView, printInfo: printInfo)
        op.showsPrintPanel = true
        op.showsProgressPanel = true
        op.run()
    }
}

/// Custom NSView for macOS native printing engine
public class PrintableSheetView: NSView {
    private let layout: SheetLayoutConfig
    private let photos: [PhotoItem]

    public init(layout: SheetLayoutConfig, photos: [PhotoItem]) {
        self.layout = layout
        self.photos = photos
        let frame = CGRect(x: 0, y: 0, width: layout.paperWidthPoints, height: layout.paperHeightPoints)
        super.init(frame: frame)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    public override func draw(_ dirtyRect: NSRect) {
        guard let context = NSGraphicsContext.current?.cgContext else { return }
        PrintRenderer.shared.drawSheet(
            context: context,
            layout: layout,
            photos: photos,
            paperRectPoints: bounds
        )
    }

    public override func knowsPageRange(_ range: NSRangePointer) -> Bool {
        range.pointee = NSRange(location: 1, length: 1)
        return true
    }

    public override func rectForPage(_ page: Int) -> NSRect {
        return bounds
    }
}
