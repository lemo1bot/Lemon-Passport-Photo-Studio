import SwiftUI
import AppKit

public struct SheetPreviewView: View {
    @ObservedObject var layout: SheetLayoutConfig
    var photos: [PhotoItem]

    @State private var previewScale: Double = 0.85
    @State private var autoFitToWindow: Bool = true
    @State private var isRefreshing: Bool = false
    @State private var cachedImage: NSImage? = nil

    public var body: some View {
        VStack(spacing: 0) {
            // Preview Header Bar
            HStack(spacing: 16) {
                Label("Print Sheet Preview", systemImage: "printer.dotmatrix")
                    .font(.headline)

                // Summary Badge
                let slots = layout.calculateSlots()
                HStack(spacing: 6) {
                    Text("\(slots.count) Photos")
                        .font(.caption.weight(.bold))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.accentColor.opacity(0.15))
                        .foregroundColor(.accentColor)
                        .cornerRadius(4)

                    Text("on \(layout.selectedPaper.name)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                // Quick layout presets for user ease
                HStack(spacing: 6) {
                    Text("Quick:")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Button("5 in 1 Strip") {
                        layout.layoutMode = .exactCount
                        layout.arrangement = .singleRow
                        layout.targetCount = 5
                        refreshSheet()
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)

                    Button("5 in 2 Rows") {
                        layout.layoutMode = .exactCount
                        layout.arrangement = .balancedGrid
                        layout.targetCount = 5
                        refreshSheet()
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)

                    Button("Fill A4 Sheet") {
                        layout.layoutMode = .fillSheet
                        refreshSheet()
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                }

                Divider().frame(height: 18)

                // Zoom controls
                HStack(spacing: 6) {
                    Button(action: {
                        previewScale = max(0.3, previewScale - 0.15)
                        autoFitToWindow = false
                    }) {
                        Image(systemName: "minus.magnifyingglass")
                    }

                    Text("\(Int(previewScale * 100))%")
                        .font(.caption.monospaced())
                        .frame(width: 42)

                    Button(action: {
                        previewScale = min(2.5, previewScale + 0.15)
                        autoFitToWindow = false
                    }) {
                        Image(systemName: "plus.magnifyingglass")
                    }

                    Button("100% (Actual)") {
                        previewScale = 1.0
                        autoFitToWindow = false
                    }
                    .controlSize(.small)

                    Button("Fit") {
                        autoFitToWindow = true
                    }
                    .controlSize(.small)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(Color(NSColor.windowBackgroundColor))
            .overlay(Divider(), alignment: .bottom)

            // Sheet Canvas Area
            GeometryReader { geo in
                let paperWPoints = layout.paperWidthPoints
                let paperHPoints = layout.paperHeightPoints

                let effectiveScale: CGFloat = autoFitToWindow ?
                    min((geo.size.width - 60) / paperWPoints, (geo.size.height - 60) / paperHPoints) :
                    CGFloat(previewScale)

                ScrollView([.horizontal, .vertical]) {
                    ZStack {
                        Color(NSColor.underPageBackgroundColor)
                            .frame(minWidth: geo.size.width, minHeight: geo.size.height)

                        // Paper representation with crisp border and shadow
                        VStack(spacing: 0) {
                            if let img = cachedImage {
                                Image(nsImage: img)
                                    .resizable()
                                    .interpolation(.high)
                                    .aspectRatio(contentMode: .fit)
                                    .frame(width: paperWPoints * effectiveScale, height: paperHPoints * effectiveScale)
                            } else {
                                ProgressView("Generating Sheet...")
                                    .frame(width: paperWPoints * effectiveScale, height: paperHPoints * effectiveScale)
                            }
                        }
                        .background(Color.white)
                        .shadow(color: Color.black.opacity(0.2), radius: 12, x: 0, y: 6)
                        .padding(30)
                    }
                }
                .onAppear {
                    refreshSheet()
                }
                .onChange(of: layout.layoutMode) { _ in refreshSheet() }
                .onChange(of: layout.arrangement) { _ in refreshSheet() }
                .onChange(of: layout.targetCount) { _ in refreshSheet() }
                .onChange(of: layout.selectedPaper) { _ in refreshSheet() }
                .onChange(of: layout.selectedPassport) { _ in refreshSheet() }
                .onChange(of: layout.orientation) { _ in refreshSheet() }
                .onChange(of: layout.marginMM) { _ in refreshSheet() }
                .onChange(of: layout.horizontalGapMM) { _ in refreshSheet() }
                .onChange(of: layout.verticalGapMM) { _ in refreshSheet() }
                .onChange(of: layout.showCropMarks) { _ in refreshSheet() }
                .onChange(of: layout.showCutLines) { _ in refreshSheet() }
                .onChange(of: layout.showCalibrationRuler) { _ in refreshSheet() }
                .onChange(of: photos.count) { _ in refreshSheet() }
            }

            // Sheet Footer Status
            HStack(spacing: 20) {
                let slots = layout.calculateSlots()
                let totalPhotos = slots.count
                let pw = layout.paperWidthMM
                let ph = layout.paperHeightMM

                Label("Paper: \(Int(pw)) × \(Int(ph)) mm (\(layout.orientation.rawValue))", systemImage: "doc")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Label("Photo Size: \(Int(layout.passportWidthMM)) × \(Int(layout.passportHeightMM)) mm", systemImage: "person.crop.square")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Label("Slots: \(totalPhotos)", systemImage: "square.grid.3x3")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()

                Text("💡 Use genuine photo glossy or matte paper for best passport result")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(Color(NSColor.windowBackgroundColor))
            .overlay(Divider(), alignment: .top)
        }
    }

    private func refreshSheet() {
        DispatchQueue.global(qos: .userInitiated).async {
            let img = PrintRenderer.shared.renderPreviewImage(layout: self.layout, photos: self.photos, scale: 2.0)
            DispatchQueue.main.async {
                self.cachedImage = img
            }
        }
    }
}
