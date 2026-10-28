import Foundation
import CoreGraphics

public enum LayoutArrangement: String, CaseIterable, Identifiable {
    case singleRow = "Single Row Strip (Top)"
    case balancedGrid = "Balanced Grid"
    case customRowsCols = "Custom Rows × Cols"

    public var id: String { rawValue }
}

public enum LayoutMode: String, CaseIterable, Identifiable {
    case exactCount = "Target Count (e.g. 5 Photos)"
    case customGrid = "Custom Grid"
    case fillSheet = "Fill Maximum Page"

    public var id: String { rawValue }
}

public enum SheetAlignment: String, CaseIterable, Identifiable {
    case topCenter = "Top-Center (Saves Paper)"
    case centered = "Center of Page"
    case topLeft = "Top-Left"

    public var id: String { rawValue }
}

public struct PhotoSlot: Identifiable {
    public let id: Int
    public let rectPoints: CGRect // in paper point coordinates (0,0 is bottom-left or top-left depending on context)
    public let rectMM: CGRect
    public let rowIndex: Int
    public let colIndex: Int
}

public class SheetLayoutConfig: ObservableObject {
    @Published public var layoutMode: LayoutMode = .exactCount
    @Published public var arrangement: LayoutArrangement = .singleRow
    @Published public var targetCount: Int = 5 // User's requested default! 5 photos
    @Published public var customColumns: Int = 5
    @Published public var customRows: Int = 1

    @Published public var orientation: PaperOrientation = .portrait
    @Published public var selectedPaper: PaperPreset = PaperPreset.presets[0] // A4
    @Published public var selectedPassport: PassportPreset = PassportPreset.presets[0] // India 35x45mm

    // Custom dimensions if "Custom" is selected
    @Published public var customPassportWidthMM: Double = 35.0
    @Published public var customPassportHeightMM: Double = 45.0
    @Published public var customPaperWidthMM: Double = 210.0
    @Published public var customPaperHeightMM: Double = 297.0

    // Margins and Gaps (in mm)
    @Published public var marginMM: Double = 10.0
    @Published public var horizontalGapMM: Double = 4.0
    @Published public var verticalGapMM: Double = 4.0
    @Published public var alignment: SheetAlignment = .topCenter

    // Guides & Marks
    @Published public var showCropMarks: Bool = true
    @Published public var showCutLines: Bool = true
    @Published public var showCalibrationRuler: Bool = true
    @Published public var showPhotoInfoLabel: Bool = true

    public init() {}

    public var passportWidthMM: Double {
        if selectedPassport.id == "custom" {
            return customPassportWidthMM
        }
        return selectedPassport.widthMM
    }

    public var passportHeightMM: Double {
        if selectedPassport.id == "custom" {
            return customPassportHeightMM
        }
        return selectedPassport.heightMM
    }

    public var paperWidthMM: Double {
        if selectedPaper.id == "custom_paper" {
            return orientation == .portrait ? min(customPaperWidthMM, customPaperHeightMM) : max(customPaperWidthMM, customPaperHeightMM)
        }
        return selectedPaper.effectiveWidthMM(orientation: orientation)
    }

    public var paperHeightMM: Double {
        if selectedPaper.id == "custom_paper" {
            return orientation == .portrait ? max(customPaperWidthMM, customPaperHeightMM) : min(customPaperWidthMM, customPaperHeightMM)
        }
        return selectedPaper.effectiveHeightMM(orientation: orientation)
    }

    public var paperWidthPoints: Double {
        return paperWidthMM * 72.0 / 25.4
    }

    public var paperHeightPoints: Double {
        return paperHeightMM * 72.0 / 25.4
    }

    public var passportWidthPoints: Double {
        return passportWidthMM * 72.0 / 25.4
    }

    public var passportHeightPoints: Double {
        return passportHeightMM * 72.0 / 25.4
    }

    /// Calculate maximum columns and rows that physically fit within printable area
    public var maxPossibleColumns: Int {
        let availW = paperWidthMM - (marginMM * 2.0)
        let pw = passportWidthMM
        guard availW >= pw else { return 1 }
        return max(1, Int((availW + horizontalGapMM) / (pw + horizontalGapMM)))
    }

    public var maxPossibleRows: Int {
        let availH = paperHeightMM - (marginMM * 2.0)
        let ph = passportHeightMM
        guard availH >= ph else { return 1 }
        return max(1, Int((availH + verticalGapMM) / (ph + verticalGapMM)))
    }

    public var maxPossiblePhotos: Int {
        return maxPossibleColumns * maxPossibleRows
    }

    /// Computes the exact grid slots for the sheet
    public func calculateSlots() -> [PhotoSlot] {
        let maxCols = maxPossibleColumns
        let maxRows = maxPossibleRows

        var cols = 1
        var rows = 1
        var count = targetCount

        switch layoutMode {
        case .exactCount:
            count = max(1, targetCount)
            switch arrangement {
            case .singleRow:
                cols = min(count, maxCols)
                rows = max(1, Int(ceil(Double(count) / Double(cols))))
            case .balancedGrid:
                if count <= 2 {
                    cols = count
                    rows = 1
                } else if count <= 4 {
                    cols = 2
                    rows = 2
                } else if count <= 6 {
                    cols = 3
                    rows = 2
                } else if count <= 8 {
                    cols = 4
                    rows = 2
                } else {
                    cols = min(count, maxCols)
                    rows = min(Int(ceil(Double(count) / Double(cols))), maxRows)
                }
            case .customRowsCols:
                cols = max(1, min(customColumns, maxCols))
                rows = max(1, min(customRows, maxRows))
            }
        case .customGrid:
            cols = max(1, min(customColumns, maxCols))
            rows = max(1, min(customRows, maxRows))
            count = cols * rows
        case .fillSheet:
            cols = maxCols
            rows = maxRows
            count = cols * rows
        }

        let pwMM = passportWidthMM
        let phMM = passportHeightMM
        let gapHMM = horizontalGapMM
        let gapVMM = verticalGapMM

        let totalGridWidthMM = Double(cols) * pwMM + Double(max(0, cols - 1)) * gapHMM
        let totalGridHeightMM = Double(rows) * phMM + Double(max(0, rows - 1)) * gapVMM

        // Calculate origin based on alignment (top-down coordinates in mm: origin at top-left)
        let startXMM: Double
        let startYMM: Double

        switch alignment {
        case .centered:
            startXMM = max(marginMM, (paperWidthMM - totalGridWidthMM) / 2.0)
            startYMM = max(marginMM, (paperHeightMM - totalGridHeightMM) / 2.0)
        case .topCenter:
            startXMM = max(marginMM, (paperWidthMM - totalGridWidthMM) / 2.0)
            startYMM = marginMM
        case .topLeft:
            startXMM = marginMM
            startYMM = marginMM
        }

        var slots: [PhotoSlot] = []
        var slotIndex = 0

        for r in 0..<rows {
            for c in 0..<cols {
                if slotIndex >= count { break }

                let xMM = startXMM + Double(c) * (pwMM + gapHMM)
                let yMM = startYMM + Double(r) * (phMM + gapVMM)

                let rectMM = CGRect(x: xMM, y: yMM, width: pwMM, height: phMM)

                // Convert to points (macOS standard top-down for preview / rendering)
                let xPt = xMM * 72.0 / 25.4
                let yPt = yMM * 72.0 / 25.4
                let wPt = pwMM * 72.0 / 25.4
                let hPt = phMM * 72.0 / 25.4
                let rectPoints = CGRect(x: xPt, y: yPt, width: wPt, height: hPt)

                slots.append(PhotoSlot(
                    id: slotIndex,
                    rectPoints: rectPoints,
                    rectMM: rectMM,
                    rowIndex: r,
                    colIndex: c
                ))

                slotIndex += 1
            }
        }

        return slots
    }
}
