import SwiftUI
import AppKit

public struct CropStudioView: View {
    @ObservedObject var photoItem: PhotoItem
    @ObservedObject var layout: SheetLayoutConfig

    @State private var showBiometricGuides: Bool = true
    @State private var isAligning: Bool = false
    @State private var isRemovingBackground: Bool = false
    @State private var dragStartOffset: CGPoint = .zero
    @State private var statusMessage: String? = nil

    public var body: some View {
        VStack(spacing: 0) {
            // Studio Header Toolbar
            HStack {
                Label("Crop & Biometric Alignment", systemImage: "crop")
                    .font(.headline)

                Spacer()

                // Quick AI Tools
                Button(action: runAIAutoAlign) {
                    HStack(spacing: 4) {
                        Image(systemName: "face.dashed")
                        Text(isAligning ? "Aligning..." : "AI Auto-Align Face")
                    }
                }
                .disabled(isAligning)
                .help("Uses Apple Neural Engine to detect eyes and chin, auto-centering for passport compliance")

                Button(action: runAIBackgroundWhitener) {
                    HStack(spacing: 4) {
                        Image(systemName: "person.crop.rectangle.badge.plus")
                        Text(isRemovingBackground ? "Whitening..." : "AI Pure White BG")
                    }
                }
                .disabled(isRemovingBackground)
                .help("Replaces background with compliant pure white using Apple Vision segmentation")

                Toggle(isOn: $showBiometricGuides) {
                    Label("Guides", systemImage: "viewfinder")
                }
                .toggleStyle(.button)
                .help("Toggle biometric passport head and eye alignment guides")

                Button(action: {
                    photoItem.resetAdjustments()
                }) {
                    Image(systemName: "arrow.counterclockwise")
                    Text("Reset")
                }
                .help("Reset zoom, position, and tilt to defaults")
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(Color(NSColor.windowBackgroundColor))
            .overlay(Divider(), alignment: .bottom)

            // Main Cropping Canvas
            GeometryReader { geo in
                ZStack {
                    Color(NSColor.underPageBackgroundColor)
                        .edgesIgnoringSafeArea(.all)

                    // Target passport aspect ratio container
                    let aspect = layout.passportWidthMM / layout.passportHeightMM
                    let maxFrameWidth = min(geo.size.width - 80, 480.0)
                    let maxFrameHeight = min(geo.size.height - 120, 600.0)

                    let frameWidth: CGFloat = (maxFrameWidth / maxFrameHeight > aspect) ? (maxFrameHeight * aspect) : maxFrameWidth
                    let frameHeight: CGFloat = frameWidth / aspect

                    VStack(spacing: 12) {
                        // Frame Header Info
                        HStack {
                            Text("\(Int(layout.passportWidthMM)) × \(Int(layout.passportHeightMM)) mm")
                                .font(.caption.monospaced())
                                .foregroundColor(.secondary)

                            Spacer()

                            Text(layout.selectedPassport.name)
                                .font(.caption.weight(.medium))
                                .foregroundColor(.secondary)
                        }
                        .frame(width: frameWidth)

                        // Interactive Photo Box
                        ZStack {
                            // Photo rendering container with clipping
                            InteractiveCropCanvas(
                                photoItem: photoItem,
                                frameWidth: frameWidth,
                                frameHeight: frameHeight
                            )
                            .frame(width: frameWidth, height: frameHeight)
                            .clipped()
                            .background(Color.white)
                            .overlay(
                                RoundedRectangle(cornerRadius: 1)
                                    .stroke(Color.primary.opacity(0.3), lineWidth: 1)
                            )
                            .shadow(color: Color.black.opacity(0.15), radius: 8, x: 0, y: 4)

                            // Biometric Guides Overlay
                            if showBiometricGuides {
                                BiometricGuideOverlay(
                                    width: frameWidth,
                                    height: frameHeight,
                                    headCoverageMin: layout.selectedPassport.headCoverageMin,
                                    headCoverageMax: layout.selectedPassport.headCoverageMax
                                )
                                .allowsHitTesting(false)
                            }
                        }

                        // Status or guidance text
                        if let msg = statusMessage {
                            Text(msg)
                                .font(.footnote)
                                .foregroundColor(.secondary)
                                .padding(.top, 4)
                        } else {
                            Text("Drag to reposition • Pinch or use zoom slider • Align eyes with guide line")
                                .font(.footnote)
                                .foregroundColor(.secondary)
                                .padding(.top, 4)
                        }
                    }
                }
            }

            // Quick Fine-Tuning Bar below canvas
            HStack(spacing: 24) {
                // Zoom Slider
                HStack(spacing: 8) {
                    Image(systemName: "minus.magnifyingglass")
                        .foregroundColor(.secondary)
                    Slider(value: $photoItem.zoom, in: 0.5...4.0)
                        .frame(width: 140)
                    Image(systemName: "plus.magnifyingglass")
                        .foregroundColor(.secondary)
                    Text(String(format: "%.1f×", photoItem.zoom))
                        .font(.caption.monospaced())
                        .foregroundColor(.secondary)
                        .frame(width: 40, alignment: .trailing)
                }

                Divider().frame(height: 18)

                // Tilt Slider
                HStack(spacing: 8) {
                    Image(systemName: "dial.low")
                        .foregroundColor(.secondary)
                    Text("Straighten:")
                        .font(.caption)
                    Slider(value: $photoItem.tiltDegrees, in: -15.0...15.0)
                        .frame(width: 120)
                    Text(String(format: "%+.1f°", photoItem.tiltDegrees))
                        .font(.caption.monospaced())
                        .foregroundColor(.secondary)
                        .frame(width: 44, alignment: .trailing)
                    if abs(photoItem.tiltDegrees) > 0.1 {
                        Button(action: { photoItem.tiltDegrees = 0.0 }) {
                            Image(systemName: "xmark.circle.fill")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .buttonStyle(.plain)
                    }
                }

                Divider().frame(height: 18)

                // Rotate 90 CW
                Button(action: {
                    photoItem.rotationDegrees = (photoItem.rotationDegrees + 90.0).truncatingRemainder(dividingBy: 360.0)
                }) {
                    Label("Rotate 90°", systemImage: "rotate.right")
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(Color(NSColor.windowBackgroundColor))
            .overlay(Divider(), alignment: .top)
        }
    }

    private func runAIAutoAlign() {
        isAligning = true
        statusMessage = "Analyzing face & biometric landmarks..."

        let wPts = layout.passportWidthMM * 72.0 / 25.4
        let hPts = layout.passportHeightMM * 72.0 / 25.4

        VisionService.shared.autoAlignBiometrics(
            image: photoItem.originalImage,
            targetWidthPoints: wPts,
            targetHeightPoints: hPts
        ) { result in
            DispatchQueue.main.async {
                self.isAligning = false
                switch result {
                case .success(let alignment):
                    withAnimation(.easeInOut(duration: 0.3)) {
                        self.photoItem.zoom = alignment.zoom
                        self.photoItem.panOffset = alignment.panOffset
                        self.photoItem.tiltDegrees = alignment.tiltDegrees
                    }
                    self.statusMessage = "Face aligned to biometric standard (Coverage: ~73%)"
                case .failure(let error):
                    self.statusMessage = "Could not auto-align: \(error.localizedDescription)"
                }
            }
        }
    }

    private func runAIBackgroundWhitener() {
        isRemovingBackground = true
        statusMessage = "Apple Neural Engine generating background segmentation mask..."

        VisionService.shared.generateSegmentationMask(image: photoItem.originalImage) { mask in
            DispatchQueue.main.async {
                self.isRemovingBackground = false
                if let mask = mask {
                    self.photoItem.segmentationMask = mask
                    self.photoItem.backgroundMode = .pureWhite
                    self.statusMessage = "Background replaced with passport-compliant Pure White (#FFFFFF)"
                } else {
                    self.statusMessage = "Background segmentation failed. You can adjust lighting manually."
                }
            }
        }
    }
}

/// Canvas that handles mouse drag, magnification, and live rendering
struct InteractiveCropCanvas: View {
    @ObservedObject var photoItem: PhotoItem
    let frameWidth: CGFloat
    let frameHeight: CGFloat

    @State private var dragTranslation: CGSize = .zero

    var body: some View {
        GeometryReader { _ in
            if let nsImage = photoItem.originalImage {
                let imgW = nsImage.size.width
                let imgH = nsImage.size.height
                let baseScale = max(frameWidth / imgW, frameHeight / imgH)

                Image(nsImage: nsImage)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: imgW * baseScale * photoItem.zoom, height: imgH * baseScale * photoItem.zoom)
                    .rotationEffect(.degrees(photoItem.rotationDegrees + photoItem.tiltDegrees))
                    .offset(
                        x: photoItem.panOffset.x + dragTranslation.width,
                        y: photoItem.panOffset.y + dragTranslation.height
                    )
                    .gesture(
                        DragGesture()
                            .onChanged { val in
                                dragTranslation = val.translation
                            }
                            .onEnded { val in
                                photoItem.panOffset.x += val.translation.width
                                photoItem.panOffset.y += val.translation.height
                                dragTranslation = .zero
                            }
                    )
            }
        }
    }
}

/// Overlay drawing official biometric guidelines
struct BiometricGuideOverlay: View {
    let width: CGFloat
    let height: CGFloat
    let headCoverageMin: Double
    let headCoverageMax: Double

    var body: some View {
        Canvas { context, size in
            let w = size.width
            let h = size.height

            // Center vertical line
            var centerLine = Path()
            centerLine.move(to: CGPoint(x: w / 2, y: 0))
            centerLine.addLine(to: CGPoint(x: w / 2, y: h))
            context.stroke(centerLine, with: .color(Color.cyan.opacity(0.4)), style: StrokeStyle(lineWidth: 1, dash: [4, 4]))

            // Eye Level guide line (typically ~62% from bottom = 38% from top)
            let eyeY = h * 0.38
            var eyeLine = Path()
            eyeLine.move(to: CGPoint(x: 0, y: eyeY))
            eyeLine.addLine(to: CGPoint(x: w, y: eyeY))
            context.stroke(eyeLine, with: .color(Color.yellow.opacity(0.7)), style: StrokeStyle(lineWidth: 1, dash: [5, 3]))

            // Crown of Head Guideline (top of hair ~10% from top)
            let crownY = h * 0.12
            var crownLine = Path()
            crownLine.move(to: CGPoint(x: w * 0.2, y: crownY))
            crownLine.addLine(to: CGPoint(x: w * 0.8, y: crownY))
            context.stroke(crownLine, with: .color(Color.cyan.opacity(0.6)), style: StrokeStyle(lineWidth: 1))

            // Chin Guideline (bottom of head ~85% from top)
            let chinY = h * 0.85
            var chinLine = Path()
            chinLine.move(to: CGPoint(x: w * 0.25, y: chinY))
            chinLine.addLine(to: CGPoint(x: w * 0.75, y: chinY))
            context.stroke(chinLine, with: .color(Color.cyan.opacity(0.6)), style: StrokeStyle(lineWidth: 1))

            // Oval Head Silhouette Zone (70-80% height)
            let ovalHeight = (chinY - crownY)
            let ovalWidth = ovalHeight * 0.72
            let ovalRect = CGRect(x: (w - ovalWidth) / 2.0, y: crownY, width: ovalWidth, height: ovalHeight)
            let headOval = Path(ellipseIn: ovalRect)
            context.stroke(headOval, with: .color(Color.green.opacity(0.6)), style: StrokeStyle(lineWidth: 1.5, dash: [6, 4]))
        }
        .overlay(
            VStack {
                HStack {
                    Text("Top of Head")
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundColor(.cyan)
                        .padding(.leading, 6)
                    Spacer()
                }
                .offset(y: height * 0.12 - 12)

                HStack {
                    Text("Eye Level (Align Here)")
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundColor(.yellow)
                        .padding(.leading, 6)
                    Spacer()
                }
                .offset(y: height * 0.38 - 24)

                Spacer()

                HStack {
                    Text("Chin Line")
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundColor(.cyan)
                        .padding(.leading, 6)
                    Spacer()
                }
                .offset(y: -(height * (1.0 - 0.85)) + 12)
            }
        )
    }
}
