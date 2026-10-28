import SwiftUI
import AppKit

@main
struct PassportPhotoStudioApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .windowStyle(.titleBar)
        .windowToolbarStyle(.unified(showsTitle: true))
        .commands {
            SidebarCommands()

            CommandGroup(replacing: .newItem) {
                Button("Open Photo...") {
                    NotificationCenter.default.post(name: .openPhotoPicker, object: nil)
                }
                .keyboardShortcut("o", modifiers: .command)
            }

            CommandGroup(replacing: .printItem) {
                Button("Print Sheet...") {
                    NotificationCenter.default.post(name: .triggerPrintSheet, object: nil)
                }
                .keyboardShortcut("p", modifiers: .command)
            }
        }
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApplication.shared.setActivationPolicy(.regular)
        NSApplication.shared.activate(ignoringOtherApps: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

extension Notification.Name {
    static let openPhotoPicker = Notification.Name("openPhotoPicker")
    static let triggerPrintSheet = Notification.Name("triggerPrintSheet")
}
