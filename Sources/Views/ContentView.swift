import SwiftUI
import AppKit
import UniformTypeIdentifiers

public enum StudioTab: String, CaseIterable, Identifiable {
    case cropStudio = "Crop & Biometrics"
    case sheetPreview = "Print Sheet Preview"

    public var id: String { rawValue }
}

public struct ContentView: View {
    @StateObject private var layout = SheetLayoutConfig()
    @State private var photos: [PhotoItem] = []
    @State private var selectedPhotoId: UUID? = nil
    @State private var currentTab: StudioTab = .cropStudio

    @State private var showingExportAlert: Bool = false
    @State private var alertMessage: String = ""

    private var activePhoto: PhotoItem? {
        if let id = selectedPhotoId, let found = photos.first(where: { $0.id == id }) {
            return found
        }
        return photos.first
    }

    public var body: some View {
        NavigationSplitView {
            // Left Sidebar: Photos list & presets
            sidebarView
        } detail: {
            // Main Center Workspace
            VStack(spacing: 0) {
                if let photo = activePhoto {
                    switch currentTab {
                    case .cropStudio:
                        CropStudioView(photoItem: photo, layout: layout)
                    case .sheetPreview:
                        SheetPreviewView(layout: layout, photos: photos)
                    }
                } else {
                    emptyWorkspaceView
                }
            }
            .toolbar {
                mainToolbar
            }
        }
        .inspector(isPresented: .constant(true)) {
            // Right Inspector Pane
            if let photo = activePhoto {
                InspectorPaneView(layout: layout, selectedPhoto: photo, photos: photos)
            } else {
                Text("Select or import a photo to edit")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .frame(minWidth: 1050, minHeight: 700)
        .onAppear {
            loadDefaultSamplePhoto()
        }
    }

    // MARK: - Left Sidebar
    private var sidebarView: some View {
        VStack(spacing: 0) {
            // Photos header
            HStack {
                Text("Photos")
                    .font(.headline)
                Spacer()
                Button(action: openImagePicker) {
                    Image(systemName: "plus")
                }
                .help("Import Photo (PNG, JPG, HEIC, TIFF)")
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)

            Divider()

            // Photos list
            List(selection: $selectedPhotoId) {
                ForEach(photos) { item in
                    HStack(spacing: 10) {
                        Image(nsImage: item.originalImage)
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(width: 44, height: 44)
                            .cornerRadius(6)
                            .clipped()

                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.name)
                                .font(.body.weight(.medium))
                                .lineLimit(1)

                            HStack(spacing: 4) {
                                Text("Copies:")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                                Stepper("\(item.copiesCount)", value: item.bindingCopiesCount, in: 1...24)
                                    .font(.caption2)
                            }
                        }
                    }
                    .tag(item.id)
                    .contextMenu {
                        Button(role: .destructive) {
                            removePhoto(item)
                        } label: {
                            Label("Remove Photo", systemImage: "trash")
                        }
                    }
                }
            }
            .listStyle(.sidebar)

            Divider()

            // Sidebar footer with sample photo button & quick preset
            VStack(spacing: 8) {
                Button(action: {
                    layout.layoutMode = .exactCount
                    layout.arrangement = .singleRow
                    layout.targetCount = 5
                    currentTab = .sheetPreview
                }) {
                    HStack {
                        Image(systemName: "star.fill")
                            .foregroundColor(.orange)
                        Text("5 Photos on A4 (Strip)")
                            .font(.subheadline.weight(.semibold))
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(.blue)
                .help("Instantly configures sheet for 5 passport photos in a single strip on A4")

                Button(action: loadDefaultSamplePhoto) {
                    Label("Add Sample Portrait", systemImage: "person.crop.circle.badge.plus")
                        .font(.caption)
                }
                .buttonStyle(.link)
            }
            .padding(12)
        }
        .frame(minWidth: 200, maxWidth: 260)
    }

    // MARK: - Empty Workspace
    private var emptyWorkspaceView: some View {
        VStack(spacing: 16) {
            Image(systemName: "person.crop.artframe")
                .font(.system(size: 64))
                .foregroundColor(.secondary.opacity(0.6))

            Text("No Photo Loaded")
                .font(.title2.weight(.bold))

            Text("Drag & drop a portrait photo here or click Add Photo")
                .font(.body)
                .foregroundColor(.secondary)

            HStack(spacing: 12) {
                Button("Choose Photo...", action: openImagePicker)
                    .buttonStyle(.borderedProminent)

                Button("Load Sample Photo", action: loadDefaultSamplePhoto)
                    .buttonStyle(.bordered)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Main Toolbar
    @ToolbarContentBuilder
    private var mainToolbar: some ToolbarContent {
        ToolbarItemGroup(placement: .navigation) {
            // Segmented mode switcher
            Picker("View Mode", selection: $currentTab) {
                Label("Crop & Biometrics", systemImage: "crop").tag(StudioTab.cropStudio)
                Label("Print Sheet Preview", systemImage: "printer.dotmatrix").tag(StudioTab.sheetPreview)
            }
            .pickerStyle(.segmented)
            .frame(width: 320)
        }

        ToolbarItemGroup(placement: .primaryAction) {
            // Export Single Cropped Photo
            Menu {
                Button("Export Single Photo (300 DPI PNG)") {
                    exportSinglePhoto()
                }
                Button("Export Sheet as Image (300 DPI PNG)") {
                    exportSheetImage()
                }
            } label: {
                Label("Export Image", systemImage: "square.and.arrow.down")
            }

            // Export PDF
            Button(action: exportSheetPDF) {
                Label("Save PDF...", systemImage: "doc.badge.arrow.up")
            }
            .help("Export print-ready 300 DPI vector PDF document")

            // Direct macOS Print
            Button(action: printCurrentSheet) {
                HStack(spacing: 4) {
                    Image(systemName: "printer.fill")
                    Text("Print Sheet...")
                }
            }
            .buttonStyle(.borderedProminent)
            .tint(.accentColor)
            .help("Opens macOS native print dialog with 100% borderless scaling")
        }
    }

    // MARK: - Actions
    private func openImagePicker() {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.jpeg, .png, .tiff, .heic, .webP]
        panel.allowsMultipleSelection = true
        panel.canChooseDirectories = false

        if panel.runModal() == .OK {
            for url in panel.urls {
                if let image = NSImage(contentsOf: url) {
                    let item = PhotoItem(name: url.deletingPathExtension().lastPathComponent, image: image, copiesCount: layout.targetCount)
                    photos.append(item)
                    selectedPhotoId = item.id
                }
            }
        }
    }

    private func removePhoto(_ item: PhotoItem) {
        photos.removeAll(where: { $0.id == item.id })
        if selectedPhotoId == item.id {
            selectedPhotoId = photos.first?.id
        }
    }

    private func exportSinglePhoto() {
        guard let photo = activePhoto else { return }
        let savePanel = NSSavePanel()
        savePanel.allowedContentTypes = [.png, .jpeg]
        savePanel.nameFieldStringValue = "\(photo.name)_passport_300dpi.png"

        if savePanel.runModal() == .OK, let url = savePanel.url {
            if let rendered = ImageProcessor.shared.renderPassportPhoto(
                item: photo,
                targetWidthMM: layout.passportWidthMM,
                targetHeightMM: layout.passportHeightMM,
                targetDPI: 300.0
            ), let tiff = rendered.tiffRepresentation,
               let rep = NSBitmapImageRep(data: tiff),
               let pngData = rep.representation(using: .png, properties: [:]) {
                try? pngData.write(to: url)
            }
        }
    }

    private func exportSheetPDF() {
        let savePanel = NSSavePanel()
        savePanel.allowedContentTypes = [.pdf]
        let slotsCount = layout.calculateSlots().count
        savePanel.nameFieldStringValue = "PassportPhotos_\(slotsCount)_on_\(layout.selectedPaper.id.uppercased()).pdf"

        if savePanel.runModal() == .OK, let url = savePanel.url {
            let pdfData = PrintRenderer.shared.generatePDF(layout: layout, photos: photos)
            try? pdfData.write(to: url)
        }
    }

    private func exportSheetImage() {
        let savePanel = NSSavePanel()
        savePanel.allowedContentTypes = [.png]
        savePanel.nameFieldStringValue = "PassportSheet_300dpi.png"

        if savePanel.runModal() == .OK, let url = savePanel.url {
            if let image = PrintRenderer.shared.generateRasterImage(layout: layout, photos: photos, dpi: 300.0),
               let tiff = image.tiffRepresentation,
               let rep = NSBitmapImageRep(data: tiff),
               let pngData = rep.representation(using: .png, properties: [:]) {
                try? pngData.write(to: url)
            }
        }
    }

    private func printCurrentSheet() {
        PrintRenderer.shared.printSheet(layout: layout, photos: photos)
    }

    /// Generates a realistic high-resolution portrait sample image programmatically
    private func loadDefaultSamplePhoto() {
        if !photos.isEmpty { return }

        let size = NSSize(width: 800, height: 1000)
        let sampleImage = NSImage(size: size)
        sampleImage.lockFocus()

        // Background gradient
        let bgGradient = NSGradient(starting: NSColor(calibratedRed: 0.92, green: 0.94, blue: 0.97, alpha: 1.0),
                                    ending: NSColor(calibratedRed: 0.85, green: 0.88, blue: 0.92, alpha: 1.0))
        bgGradient?.draw(in: NSRect(origin: .zero, size: size), angle: 90)

        // Draw professional silhouette portrait
        let skinColor = NSColor(calibratedRed: 0.93, green: 0.78, blue: 0.68, alpha: 1.0)
        let hairColor = NSColor(calibratedRed: 0.22, green: 0.16, blue: 0.12, alpha: 1.0)
        let suitColor = NSColor(calibratedRed: 0.15, green: 0.20, blue: 0.28, alpha: 1.0)
        let shirtColor = NSColor.white

        // Shoulders / Suit
        let shoulders = NSBezierPath()
        shoulders.move(to: NSPoint(x: 100, y: 0))
        shoulders.curve(to: NSPoint(x: 320, y: 350), controlPoint1: NSPoint(x: 150, y: 220), controlPoint2: NSPoint(x: 250, y: 320))
        shoulders.line(to: NSPoint(x: 480, y: 350))
        shoulders.curve(to: NSPoint(x: 700, y: 0), controlPoint1: NSPoint(x: 550, y: 320), controlPoint2: NSPoint(x: 650, y: 220))
        shoulders.close()
        suitColor.setFill()
        shoulders.fill()

        // White Shirt Collar
        let collar = NSBezierPath()
        collar.move(to: NSPoint(x: 340, y: 350))
        collar.line(to: NSPoint(x: 400, y: 240))
        collar.line(to: NSPoint(x: 460, y: 350))
        collar.close()
        shirtColor.setFill()
        collar.fill()

        // Neck
        let neck = NSBezierPath(rect: NSRect(x: 345, y: 320, width: 110, height: 160))
        skinColor.shadow(withLevel: 0.1)?.setFill()
        neck.fill()

        // Head Oval
        let headRect = NSRect(x: 260, y: 410, width: 280, height: 380)
        let head = NSBezierPath(ovalIn: headRect)
        skinColor.setFill()
        head.fill()

        // Hair
        let hair = NSBezierPath()
        hair.appendOval(in: NSRect(x: 240, y: 560, width: 320, height: 280))
        hairColor.setFill()
        hair.fill()

        // Eyes
        let leftEye = NSBezierPath(ovalIn: NSRect(x: 330, y: 580, width: 36, height: 20))
        let rightEye = NSBezierPath(ovalIn: NSRect(x: 434, y: 580, width: 36, height: 20))
        NSColor.white.setFill()
        leftEye.fill()
        rightEye.fill()

        let leftPupil = NSBezierPath(ovalIn: NSRect(x: 342, y: 582, width: 16, height: 16))
        let rightPupil = NSBezierPath(ovalIn: NSRect(x: 446, y: 582, width: 16, height: 16))
        NSColor(calibratedRed: 0.2, green: 0.15, blue: 0.1, alpha: 1.0).setFill()
        leftPupil.fill()
        rightPupil.fill()

        // Nose
        let nose = NSBezierPath()
        nose.move(to: NSPoint(x: 400, y: 580))
        nose.line(to: NSPoint(x: 390, y: 510))
        nose.line(to: NSPoint(x: 410, y: 510))
        NSColor(calibratedRed: 0.85, green: 0.70, blue: 0.60, alpha: 1.0).setStroke()
        nose.lineWidth = 3
        nose.stroke()

        // Mouth / Smile
        let mouth = NSBezierPath()
        mouth.move(to: NSPoint(x: 365, y: 465))
        mouth.curve(to: NSPoint(x: 435, y: 465), controlPoint1: NSPoint(x: 385, y: 445), controlPoint2: NSPoint(x: 415, y: 445))
        NSColor(calibratedRed: 0.80, green: 0.45, blue: 0.45, alpha: 1.0).setStroke()
        mouth.lineWidth = 3.5
        mouth.stroke()

        sampleImage.unlockFocus()

        let sampleItem = PhotoItem(name: "Sample Passport Portrait", image: sampleImage, copiesCount: 5)
        photos.append(sampleItem)
        selectedPhotoId = sampleItem.id
    }
}

extension PhotoItem {
    var bindingCopiesCount: Binding<Int> {
        Binding(
            get: { self.copiesCount },
            set: { self.copiesCount = $0 }
        )
    }
}
