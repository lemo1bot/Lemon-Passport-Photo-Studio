import SwiftUI
import AppKit

public struct InspectorPaneView: View {
    @ObservedObject var layout: SheetLayoutConfig
    @ObservedObject var selectedPhoto: PhotoItem
    var photos: [PhotoItem]

    @State private var selectedUnit: MeasurementUnit = .millimeters

    public var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Section 1: Sheet Layout & Multi-Print (The main feature!)
                sheetLayoutSection

                Divider()

                // Section 2: Passport Standards & Dimensions
                passportStandardSection

                Divider()

                // Section 3: Cutting & Alignment Guides
                cuttingGuidesSection

                Divider()

                // Section 4: Photo Adjustments & Enhancements
                photoAdjustmentsSection
            }
            .padding(16)
        }
        .frame(minWidth: 280, maxWidth: 360)
        .background(Color(NSColor.controlBackgroundColor))
    }

    // MARK: - Section 1: Sheet Layout (Print 5 on A4 and more)
    private var sheetLayoutSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Sheet & Multi-Print Layout", systemImage: "printer.fill")
                .font(.headline)

            // Paper Size Selection
            VStack(alignment: .leading, spacing: 4) {
                Text("Paper Size")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Picker("Paper Size", selection: $layout.selectedPaper) {
                    ForEach(PaperPreset.presets) { preset in
                        Text(preset.name).tag(preset)
                    }
                }
                .labelsHidden()
            }

            // Paper Orientation
            Picker("Orientation", selection: $layout.orientation) {
                ForEach(PaperOrientation.allCases) { orient in
                    Text(orient.rawValue).tag(orient)
                }
            }
            .pickerStyle(.segmented)

            // Target Quantity Presets (Highlighting 5 photos!)
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("Number of Photos on Sheet:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("\(layout.calculateSlots().count) Photos")
                        .font(.caption.weight(.bold))
                        .foregroundColor(.accentColor)
                }

                // Quick selector buttons
                HStack(spacing: 4) {
                    quickCountButton(count: 1)
                    quickCountButton(count: 2)
                    quickCountButton(count: 4)
                    quickCountButton(count: 5, highlight: true) // Requested feature!
                    quickCountButton(count: 6)
                    quickCountButton(count: 8)
                }

                HStack(spacing: 4) {
                    quickCountButton(count: 10)
                    quickCountButton(count: 12)
                    Button("Fill Page") {
                        layout.layoutMode = .fillSheet
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                }

                // Custom stepper
                Stepper(value: $layout.targetCount, in: 1...50) {
                    Text("Exact Count: \(layout.targetCount)")
                        .font(.subheadline)
                }
                .onChange(of: layout.targetCount) { _ in
                    layout.layoutMode = .exactCount
                }
            }

            // Arrangement options for the selected count
            VStack(alignment: .leading, spacing: 4) {
                Text("Grid Arrangement")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Picker("Arrangement", selection: $layout.arrangement) {
                    ForEach(LayoutArrangement.allCases) { arr in
                        Text(arr.rawValue).tag(arr)
                    }
                }
                .labelsHidden()
            }

            if layout.arrangement == .customRowsCols || layout.layoutMode == .customGrid {
                HStack(spacing: 12) {
                    Stepper("Cols: \(layout.customColumns)", value: $layout.customColumns, in: 1...layout.maxPossibleColumns)
                        .font(.caption)
                    Stepper("Rows: \(layout.customRows)", value: $layout.customRows, in: 1...layout.maxPossibleRows)
                        .font(.caption)
                }
            }

            // Sheet Alignment
            VStack(alignment: .leading, spacing: 4) {
                Text("Sheet Alignment")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Picker("Alignment", selection: $layout.alignment) {
                    ForEach(SheetAlignment.allCases) { align in
                        Text(align.rawValue).tag(align)
                    }
                }
                .labelsHidden()
            }

            // Spacing Sliders
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("Paper Margin:")
                        .font(.caption)
                    Spacer()
                    Text(String(format: "%.0f mm", layout.marginMM))
                        .font(.caption.monospaced())
                }
                Slider(value: $layout.marginMM, in: 4.0...30.0, step: 1.0)

                HStack {
                    Text("Photo Gap:")
                        .font(.caption)
                    Spacer()
                    Text(String(format: "%.1f mm", layout.horizontalGapMM))
                        .font(.caption.monospaced())
                }
                Slider(value: $layout.horizontalGapMM, in: 1.0...15.0, step: 0.5)
                    .onChange(of: layout.horizontalGapMM) { val in
                        layout.verticalGapMM = val
                    }
            }
        }
    }

    private func quickCountButton(count: Int, highlight: Bool = false) -> some View {
        Button("\(count)") {
            layout.layoutMode = .exactCount
            layout.targetCount = count
        }
        .buttonStyle(.bordered)
        .controlSize(.small)
        .tint(highlight ? .accentColor : nil)
    }

    // MARK: - Section 2: Passport Standards
    private var passportStandardSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Passport Standard", systemImage: "person.text.rectangle")
                .font(.headline)

            Picker("Standard", selection: $layout.selectedPassport) {
                ForEach(PassportPreset.presets) { preset in
                    Text("\(preset.name) (\(Int(preset.widthMM))×\(Int(preset.heightMM)) mm)").tag(preset)
                }
            }
            .labelsHidden()

            if layout.selectedPassport.id == "custom" {
                VStack(spacing: 8) {
                    HStack {
                        Text("Width:")
                            .font(.caption)
                        TextField("W", value: $layout.customPassportWidthMM, format: .number)
                            .textFieldStyle(.roundedBorder)
                        Text("mm").font(.caption)
                    }
                    HStack {
                        Text("Height:")
                            .font(.caption)
                        TextField("H", value: $layout.customPassportHeightMM, format: .number)
                            .textFieldStyle(.roundedBorder)
                        Text("mm").font(.caption)
                    }
                }
            }

            // Standard Notes Info Box
            VStack(alignment: .leading, spacing: 4) {
                Text(layout.selectedPassport.notes)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                Text("Standard Background: \(layout.selectedPassport.backgroundColorName)")
                    .font(.caption2.weight(.medium))
                    .foregroundColor(.secondary)
            }
            .padding(8)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.primary.opacity(0.04))
            .cornerRadius(6)
        }
    }

    // MARK: - Section 3: Cutting & Calibration Guides
    private var cuttingGuidesSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Print & Cutting Guides", systemImage: "scissors")
                .font(.headline)

            Toggle("Corner Crop Marks (L-Ticks)", isOn: $layout.showCropMarks)
                .font(.subheadline)
                .help("Prints corner crosshairs to guide paper trimmer or scissors")

            Toggle("Dashed Cutting Lines", isOn: $layout.showCutLines)
                .font(.subheadline)
                .help("Dotted guidelines surrounding each photo")

            Toggle("50 mm Scale Check Ruler", isOn: $layout.showCalibrationRuler)
                .font(.subheadline)
                .help("Prints a physical calibration ruler to ensure 100% true-to-scale output")

            Toggle("Sheet Info Header", isOn: $layout.showPhotoInfoLabel)
                .font(.subheadline)
        }
    }

    // MARK: - Section 4: Photo Adjustments
    private var photoAdjustmentsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Photo Adjustments", systemImage: "slider.horizontal.3")
                .font(.headline)

            // Background Mode
            VStack(alignment: .leading, spacing: 4) {
                Text("Background Color")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Picker("Background", selection: $selectedPhoto.backgroundMode) {
                    ForEach(BackgroundMode.allCases) { mode in
                        Text(mode.rawValue).tag(mode)
                    }
                }
                .labelsHidden()
            }

            // Photo Border
            VStack(alignment: .leading, spacing: 4) {
                Text("Photo Border Style")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Picker("Border", selection: $selectedPhoto.borderStyle) {
                    ForEach(PhotoBorderStyle.allCases) { b in
                        Text(b.rawValue).tag(b)
                    }
                }
                .labelsHidden()
            }

            // Image Sliders
            VStack(spacing: 8) {
                sliderRow(name: "Brightness", value: $selectedPhoto.brightness, range: -0.5...0.5, format: "%+.2f")
                sliderRow(name: "Contrast", value: $selectedPhoto.contrast, range: 0.5...1.5, format: "%.2f")
                sliderRow(name: "Saturation", value: $selectedPhoto.saturation, range: 0.0...2.0, format: "%.2f")
                sliderRow(name: "Sharpness", value: $selectedPhoto.sharpness, range: 0.0...1.0, format: "%.2f")
                sliderRow(name: "Exposure", value: $selectedPhoto.exposure, range: -2.0...2.0, format: "%+.1f")
            }

            Toggle("Black & White (Grayscale)", isOn: $selectedPhoto.isGrayscale)
                .font(.subheadline)

            Button("Reset Photo Adjustments") {
                selectedPhoto.resetAdjustments()
            }
            .buttonStyle(.borderless)
            .font(.caption)
            .foregroundColor(.secondary)
        }
    }

    private func sliderRow(name: String, value: Binding<Double>, range: ClosedRange<Double>, format: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack {
                Text(name).font(.caption2)
                Spacer()
                Text(String(format: format, value.wrappedValue))
                    .font(.caption2.monospaced())
                    .foregroundColor(.secondary)
            }
            Slider(value: value, in: range)
        }
    }
}
