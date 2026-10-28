import AppKit
import WebKit

class DirectPrintSheetView: NSView {
    let image: NSImage

    init(image: NSImage, frame: NSRect) {
        self.image = image
        super.init(frame: frame)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func draw(_ dirtyRect: NSRect) {
        image.draw(in: bounds, from: .zero, operation: .sourceOver, fraction: 1.0)
    }

    override func knowsPageRange(_ range: NSRangePointer) -> Bool {
        range.pointee = NSRange(location: 1, length: 1)
        return true
    }

    override func rectForPage(_ page: Int) -> NSRect {
        return bounds
    }
}

class DragDropWebView: WKWebView {
    weak var appDelegate: AppDelegate?

    override func draggingEntered(_ sender: NSDraggingInfo) -> NSDragOperation {
        let pb = sender.draggingPasteboard
        if pb.canReadObject(forClasses: [NSURL.self], options: nil) {
            return .copy
        }
        return []
    }

    override func performDragOperation(_ sender: NSDraggingInfo) -> Bool {
        let pb = sender.draggingPasteboard
        if let urls = pb.readObjects(forClasses: [NSURL.self], options: [
            NSPasteboard.ReadingOptionKey.urlReadingFileURLsOnly: true
        ]) as? [URL], !urls.isEmpty {
            appDelegate?.sendFilesToJS(urls: urls)
            return true
        }
        return false
    }
}

class BridgeHandler: NSObject, WKScriptMessageHandler {
    weak var webView: WKWebView?
    weak var window: NSWindow?
    weak var appDelegate: AppDelegate?

    init(webView: WKWebView? = nil, window: NSWindow? = nil, appDelegate: AppDelegate? = nil) {
        self.webView = webView
        self.window = window
        self.appDelegate = appDelegate
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "nativeOpenFile" {
            DispatchQueue.main.async { [weak self] in
                guard let self = self, let appDelegate = self.appDelegate else { return }
                appDelegate.openNativeFileDialog()
            }
        } else if message.name == "nativeDirectPrint" || message.name == "nativeQuickPrint" {
            guard let dict = message.body as? [String: Any],
                  let base64String = dict["dataURL"] as? String else {
                triggerFallbackPrint()
                return
            }

            let cleanBase64 = base64String
                .replacingOccurrences(of: "data:image/png;base64,", with: "")
                .replacingOccurrences(of: "data:image/jpeg;base64,", with: "")

            guard let data = Data(base64Encoded: cleanBase64),
                  let image = NSImage(data: data) else {
                triggerFallbackPrint()
                return
            }

            let widthPoints = dict["paperWidthPoints"] as? Double ?? 595.28
            let heightPoints = dict["paperHeightPoints"] as? Double ?? 841.89
            let orientationStr = dict["orientation"] as? String ?? "portrait"
            let isQuick = (message.name == "nativeQuickPrint")
            let paperType = dict["paperType"] as? String ?? "glossy"
            let printQuality = dict["printQuality"] as? String ?? "high"

            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                let printInfo = NSPrintInfo.shared.copy() as! NSPrintInfo
                printInfo.paperSize = NSSize(width: widthPoints, height: heightPoints)
                printInfo.orientation = (orientationStr == "landscape") ? .landscape : .portrait
                printInfo.leftMargin = 0
                printInfo.rightMargin = 0
                printInfo.topMargin = 0
                printInfo.bottomMargin = 0
                printInfo.isHorizontallyCentered = true
                printInfo.isVerticallyCentered = true
                printInfo.scalingFactor = 1.0 // 100% exact physical millimeter scale!

                // Configure Canon CUPS PPD & generic media type attributes
                let printDict = printInfo.dictionary()
                var cnijMedia = "68" // Glossy Photo Paper
                var mediaTypeGeneric = "PhotographicGlossy"

                switch paperType {
                case "semiGloss":
                    cnijMedia = "42" // Photo Paper Plus Semi-gloss
                    mediaTypeGeneric = "PhotographicSemiGloss"
                case "matte":
                    cnijMedia = "28" // Matte Photo Paper
                    mediaTypeGeneric = "PhotographicMatte"
                case "plain":
                    cnijMedia = "0"  // Plain Paper
                    mediaTypeGeneric = "Stationery"
                default: // "glossy"
                    cnijMedia = "68" // Glossy Photo Paper
                    mediaTypeGeneric = "PhotographicGlossy"
                }

                let cnijQuality = (printQuality == "high") ? "0" : "10" // 0 = Super Fine, 10 = Normal

                printDict[NSPrintInfo.AttributeKey("CNIJMediaType")] = cnijMedia
                printDict[NSPrintInfo.AttributeKey("CNIJPrintQuality")] = cnijQuality
                printDict[NSPrintInfo.AttributeKey("MediaType")] = mediaTypeGeneric
                printDict[NSPrintInfo.AttributeKey("cups-MediaType")] = mediaTypeGeneric
                printDict[NSPrintInfo.AttributeKey("cups-CNIJMediaType")] = cnijMedia
                printDict[NSPrintInfo.AttributeKey("cups-CNIJPrintQuality")] = cnijQuality

                let printView = DirectPrintSheetView(image: image, frame: NSRect(origin: .zero, size: printInfo.paperSize))
                let printOp = NSPrintOperation(view: printView, printInfo: printInfo)
                printOp.showsPrintPanel = !isQuick
                printOp.showsProgressPanel = true

                if !isQuick {
                    printOp.printPanel.options = [
                        .showsCopies,
                        .showsPageRange,
                        .showsPaperSize,
                        .showsOrientation,
                        .showsScaling,
                        .showsPreview,
                        .showsPrintSelection
                    ]
                }

                if let win = self.window, !isQuick {
                    printOp.runModal(for: win, delegate: nil, didRun: nil, contextInfo: nil)
                } else {
                    printOp.run()
                }
            }
        } else if message.name == "nativeSavePDF" {
            DispatchQueue.main.async { [weak self] in
                guard let self = self, let webView = self.webView else { return }
                let savePanel = NSSavePanel()
                savePanel.allowedContentTypes = [.pdf]
                savePanel.nameFieldStringValue = "Lemon_PassportPhotos_A4.pdf"

                savePanel.beginSheetModal(for: self.window ?? NSApp.keyWindow!) { response in
                    if response == .OK, let url = savePanel.url {
                        let config = WKPDFConfiguration()
                        webView.createPDF(configuration: config) { result in
                            switch result {
                            case .success(let data):
                                try? data.write(to: url)
                            case .failure(let error):
                                print("PDF error: \(error)")
                            }
                        }
                    }
                }
            }
        }
    }

    private func triggerFallbackPrint() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let webView = self.webView else { return }
            let printInfo = NSPrintInfo.shared.copy() as! NSPrintInfo
            printInfo.isHorizontallyCentered = true
            printInfo.isVerticallyCentered = true
            printInfo.scalingFactor = 1.0

            let printOp = webView.printOperation(with: printInfo)
            printOp.showsPrintPanel = true
            printOp.showsProgressPanel = true
            if let win = self.window {
                printOp.runModal(for: win, delegate: nil, didRun: nil, contextInfo: nil)
            } else {
                printOp.run()
            }
        }
    }
}

class AppDelegate: NSObject, NSApplicationDelegate, WKUIDelegate {
    var window: NSWindow!
    var webView: DragDropWebView!
    var bridge: BridgeHandler!

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Configure WebKit
        let config = WKWebViewConfiguration()
        let contentController = WKUserContentController()
        bridge = BridgeHandler()
        contentController.add(bridge, name: "nativeOpenFile")
        contentController.add(bridge, name: "nativeDirectPrint")
        contentController.add(bridge, name: "nativeQuickPrint")
        contentController.add(bridge, name: "nativeSavePDF")
        config.userContentController = contentController
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        config.setValue(true, forKey: "allowUniversalAccessFromFileURLs")

        // Create main application window titled "Lemon"
        let frame = NSRect(x: 100, y: 100, width: 1240, height: 820)
        window = NSWindow(
            contentRect: frame,
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        window.title = "Lemon"
        window.titlebarAppearsTransparent = false
        window.minSize = NSSize(width: 980, height: 640)
        window.center()

        // Create drag-and-drop enabled WebKit view
        webView = DragDropWebView(frame: window.contentView!.bounds, configuration: config)
        webView.autoresizingMask = [.width, .height]
        webView.uiDelegate = self
        webView.appDelegate = self
        webView.registerForDraggedTypes([.fileURL])
        window.contentView?.addSubview(webView)

        bridge.webView = webView
        bridge.window = window
        bridge.appDelegate = self

        // Load local bundled web resources
        if let resourcePath = Bundle.main.resourcePath {
            let webDir = URL(fileURLWithPath: resourcePath).appendingPathComponent("web")
            let indexURL = webDir.appendingPathComponent("index.html")
            if FileManager.default.fileExists(atPath: indexURL.path) {
                webView.loadFileURL(indexURL, allowingReadAccessTo: webDir)
            } else {
                let devURL = URL(fileURLWithPath: "/Users/lemon/.gemini/antigravity/scratch/PassportPhotoStudio/Resources/web/index.html")
                webView.loadFileURL(devURL, allowingReadAccessTo: devURL.deletingLastPathComponent())
            }
        }

        setupNativeMenus()

        // Set application Dock icon
        if let iconPath = Bundle.main.path(forResource: "AppIcon", ofType: "icns"),
           let iconImg = NSImage(contentsOfFile: iconPath) {
            NSApp.applicationIconImage = iconImg
        } else if let devIcon = NSImage(contentsOfFile: "/Users/lemon/.gemini/antigravity/scratch/PassportPhotoStudio/Resources/AppIcon.icns") {
            NSApp.applicationIconImage = devIcon
        }

        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    // WKUIDelegate file open panel support
    func webView(
        _ webView: WKWebView,
        runOpenPanelWith parameters: WKOpenPanelParameters,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping ([URL]?) -> Void
    ) {
        let openPanel = NSOpenPanel()
        openPanel.allowsMultipleSelection = parameters.allowsMultipleSelection
        openPanel.canChooseDirectories = parameters.allowsDirectories
        openPanel.canChooseFiles = true
        openPanel.allowedContentTypes = [.image, .jpeg, .png, .tiff, .heic, .webP]
        openPanel.title = "Select Customer Photo"
        openPanel.prompt = "Upload"

        openPanel.beginSheetModal(for: self.window) { response in
            if response == .OK {
                completionHandler(openPanel.urls)
            } else {
                completionHandler(nil)
            }
        }
    }

    func openNativeFileDialog() {
        let openPanel = NSOpenPanel()
        openPanel.allowsMultipleSelection = true
        openPanel.canChooseDirectories = false
        openPanel.canChooseFiles = true
        openPanel.allowedContentTypes = [.image, .jpeg, .png, .tiff, .heic, .webP]
        openPanel.title = "Upload Customer Photos"
        openPanel.prompt = "Upload Photos"

        openPanel.beginSheetModal(for: self.window) { [weak self] response in
            if response == .OK {
                self?.sendFilesToJS(urls: openPanel.urls)
            }
        }
    }

    func sendFilesToJS(urls: [URL]) {
        for url in urls {
            guard let nsImage = NSImage(contentsOf: url) else { continue }

            var rep: NSBitmapImageRep?
            var rect = NSRect(origin: .zero, size: nsImage.size)
            if let cgImage = nsImage.cgImage(forProposedRect: &rect, context: nil, hints: nil) {
                rep = NSBitmapImageRep(cgImage: cgImage)
            } else if let tiff = nsImage.tiffRepresentation {
                rep = NSBitmapImageRep(data: tiff)
            }

            guard let bitmapRep = rep,
                  let jpegData = bitmapRep.representation(using: .jpeg, properties: [.compressionFactor: 0.92]) else { continue }

            let filename = url.deletingPathExtension().lastPathComponent
            let base64 = jpegData.base64EncodedString()
            let dataURL = "data:image/jpeg;base64,\(base64)"

            let payload: [String: String] = [
                "name": "Customer: \(filename)",
                "dataURL": dataURL
            ]

            guard let jsonData = try? JSONSerialization.data(withJSONObject: payload),
                  let jsonString = String(data: jsonData, encoding: .utf8) else { continue }

            let js = "window.addCustomerPhotoFromNativeJSON(\(jsonString));"

            DispatchQueue.main.async { [weak self] in
                self?.webView.evaluateJavaScript(js, completionHandler: { (_, error) in
                    if let error = error {
                        print("Error sending photo to JS: \(error)")
                    }
                })
            }
        }
    }

    func setupNativeMenus() {
        let mainMenu = NSMenu()

        // 1. App Menu "Lemon"
        let appMenuItem = NSMenuItem()
        mainMenu.addItem(appMenuItem)
        let appMenu = NSMenu()
        appMenuItem.submenu = appMenu
        appMenu.addItem(withTitle: "About Lemon", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "Hide Lemon", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        let hideOthers = NSMenuItem(title: "Hide Others", action: #selector(NSApplication.hideOtherApplications(_:)), keyEquivalent: "h")
        hideOthers.keyEquivalentModifierMask = [.command, .option]
        appMenu.addItem(hideOthers)
        appMenu.addItem(withTitle: "Show All", action: #selector(NSApplication.unhideAllApplications(_:)), keyEquivalent: "")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "Quit Lemon", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")

        // 2. File Menu
        let fileMenuItem = NSMenuItem()
        mainMenu.addItem(fileMenuItem)
        let fileMenu = NSMenu(title: "File")
        fileMenuItem.submenu = fileMenu

        let openItem = NSMenuItem(title: "Upload Customer Photo...", action: #selector(menuOpenFileDialog), keyEquivalent: "o")
        openItem.target = self
        fileMenu.addItem(openItem)

        let directPrintItem = NSMenuItem(title: "Direct Print Sheet...", action: #selector(triggerDirectPrint), keyEquivalent: "p")
        directPrintItem.target = self
        fileMenu.addItem(directPrintItem)

        let quickPrintItem = NSMenuItem(title: "Quick Print (Default Printer)", action: #selector(triggerQuickPrint), keyEquivalent: "P")
        quickPrintItem.keyEquivalentModifierMask = [.command, .shift]
        quickPrintItem.target = self
        fileMenu.addItem(quickPrintItem)

        fileMenu.addItem(NSMenuItem.separator())
        fileMenu.addItem(withTitle: "Close Window", action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")

        // 3. Edit Menu
        let editMenuItem = NSMenuItem()
        mainMenu.addItem(editMenuItem)
        let editMenu = NSMenu(title: "Edit")
        editMenuItem.submenu = editMenu
        editMenu.addItem(withTitle: "Undo", action: #selector(UndoManager.undo), keyEquivalent: "z")
        editMenu.addItem(withTitle: "Redo", action: #selector(UndoManager.redo), keyEquivalent: "Z")
        editMenu.addItem(NSMenuItem.separator())
        editMenu.addItem(withTitle: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        editMenu.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        editMenu.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")

        let duplicateItem = NSMenuItem(title: "Make Copy / Duplicate", action: #selector(triggerDuplicate), keyEquivalent: "d")
        duplicateItem.target = self
        editMenu.addItem(duplicateItem)

        let selectAllPhotosItem = NSMenuItem(title: "Select All Photos on Sheet", action: #selector(triggerSelectAll), keyEquivalent: "a")
        selectAllPhotosItem.target = self
        editMenu.addItem(selectAllPhotosItem)

        // 4. View Menu
        let viewMenuItem = NSMenuItem()
        mainMenu.addItem(viewMenuItem)
        let viewMenu = NSMenu(title: "View")
        viewMenuItem.submenu = viewMenu
        let actualSizeItem = NSMenuItem(title: "Actual Size (100%)", action: #selector(zoomActual), keyEquivalent: "0")
        actualSizeItem.target = self
        viewMenu.addItem(actualSizeItem)
        viewMenu.addItem(withTitle: "Toggle Full Screen", action: #selector(NSWindow.toggleFullScreen(_:)), keyEquivalent: "f")

        // 5. Window Menu
        let windowMenuItem = NSMenuItem()
        mainMenu.addItem(windowMenuItem)
        let windowMenu = NSMenu(title: "Window")
        windowMenuItem.submenu = windowMenu
        windowMenu.addItem(withTitle: "Minimize", action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
        windowMenu.addItem(withTitle: "Zoom", action: #selector(NSWindow.performZoom(_:)), keyEquivalent: "")
        windowMenu.addItem(NSMenuItem.separator())
        windowMenu.addItem(withTitle: "Bring All to Front", action: #selector(NSApplication.arrangeInFront(_:)), keyEquivalent: "")

        NSApp.mainMenu = mainMenu
    }

    @objc func menuOpenFileDialog() {
        openNativeFileDialog()
    }

    @objc func triggerDirectPrint() {
        webView.evaluateJavaScript("handleDirectPrint();", completionHandler: nil)
    }

    @objc func triggerQuickPrint() {
        webView.evaluateJavaScript("handleQuickPrint();", completionHandler: nil)
    }

    @objc func triggerDuplicate() {
        webView.evaluateJavaScript("duplicateSelectedSheetItems();", completionHandler: nil)
    }

    @objc func triggerSelectAll() {
        webView.evaluateJavaScript("selectAllSheetItems();", completionHandler: nil)
    }

    @objc func zoomActual() {
        webView.evaluateJavaScript("document.getElementById('btnSheetZoom100').click();", completionHandler: nil)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
