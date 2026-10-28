#!/bin/bash
set -e

PROJECT_DIR="/Users/lemon/.gemini/antigravity/scratch/PassportPhotoStudio"
APP_NAME="Lemon"
APP_BUNDLE="${PROJECT_DIR}/build/${APP_NAME}.app"
DMG_NAME="Lemon.dmg"
DMG_PATH="${PROJECT_DIR}/${DMG_NAME}"
RW_DMG="${PROJECT_DIR}/build/rw_temp.dmg"

echo "=== Building ${APP_NAME} for macOS ==="

# Clean build directory
rm -rf "${PROJECT_DIR}/build"
mkdir -p "${PROJECT_DIR}/build"
mkdir -p "${APP_BUNDLE}/Contents/MacOS"
mkdir -p "${APP_BUNDLE}/Contents/Resources"

# 1. Compile Native Binary
echo "-> Compiling native Swift binary for ${APP_NAME}..."
swiftc -O "${PROJECT_DIR}/Sources/main.swift" -o "${APP_BUNDLE}/Contents/MacOS/${APP_NAME}"

# 2. Copy Resources (including AppIcon.icns and all web assets with logo)
echo "-> Copying AppIcon and Web assets..."
cp "${PROJECT_DIR}/Resources/AppIcon.icns" "${APP_BUNDLE}/Contents/Resources/AppIcon.icns"
cp -R "${PROJECT_DIR}/Resources/web" "${APP_BUNDLE}/Contents/Resources/"

# 3. Create Info.plist
echo "-> Creating Info.plist..."
cat << EOF > "${APP_BUNDLE}/Contents/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>${APP_NAME}</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.antigravity.lemon</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>${APP_NAME}</string>
    <key>CFBundleDisplayName</key>
    <string>${APP_NAME}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.1.0</string>
    <key>CFBundleVersion</key>
    <string>2</string>
    <key>LSMinimumSystemVersion</key>
    <string>13.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2026 Lemon. All rights reserved.</string>
</dict>
</plist>
EOF

# 4. Sign Application Ad-Hoc
echo "-> Ad-hoc signing .app bundle..."
codesign --force --deep -s - "${APP_BUNDLE}"

# 5. Build DMG with Custom Volume Icon
echo "-> Creating read-write staging image for volume icon..."
rm -f "${RW_DMG}" "${DMG_PATH}"
hdiutil create -size 60m -volname "${APP_NAME}" -fs HFS+ -ov "${RW_DMG}" > /dev/null

echo "-> Mounting temporary disk image..."
MOUNT_OUTPUT=$(hdiutil attach "${RW_DMG}" -nobrowse)
MOUNT_DIR=$(echo "${MOUNT_OUTPUT}" | grep -o '/Volumes/.*' | head -n 1)

echo "-> Staging contents into ${MOUNT_DIR}..."
cp -R "${APP_BUNDLE}" "${MOUNT_DIR}/"
ln -s /Applications "${MOUNT_DIR}/Applications"

# Add a helpful README inside the DMG
cat << 'EOF' > "${MOUNT_DIR}/README.txt"
Lemon - Passport & Photo Print Studio for macOS
===============================================

INSTALLATION:
Drag "Lemon.app" to the "Applications" folder shortcut.

DIRECT PRINTING:
• Click "Direct Print Sheet..." (or press Cmd+P)
• Connects directly to macOS native printing engine at exact 1:1 physical millimeter scale.
• "Quick Print" (Cmd+Shift+P) sends directly to your default printer with 1 click.

TOP FEATURES:
• "5 Photos on A4" Presets:
  - Top Strip (1 Row of 5 across top of A4, leaving the rest of the sheet intact to save paper)
  - Balanced Grid (3 + 2 Centered)
• 12+ Official Passport Standards: India, US (2x2"), UK/Schengen, Canada, Australia, Japan, etc.
• Biometric Eye, Head (70-80%), and Chin Guidelines Overlay
• AI Auto-Align Face & AI Pure White Background (#FFFFFF)
• Corner Crop Marks & Dashed Cutting Lines for easy scissors/trimmer cutting
• 50 mm Physical Scale Ruler to verify print accuracy
• 300 DPI High-Resolution Export to PDF and PNG
EOF

# Set custom volume icon on the DMG volume
echo "-> Applying custom volume icon to DMG volume..."
cp "${PROJECT_DIR}/Resources/AppIcon.icns" "${MOUNT_DIR}/.VolumeIcon.icns"
SetFile -c icnC "${MOUNT_DIR}/.VolumeIcon.icns"
SetFile -a C "${MOUNT_DIR}"

# Unmount the staging DMG
echo "-> Detaching temporary volume..."
hdiutil detach "${MOUNT_DIR}" > /dev/null

# 6. Convert to compressed UDZO DMG
echo "-> Compressing final ${DMG_NAME}..."
hdiutil convert "${RW_DMG}" -format UDZO -ov -o "${DMG_PATH}" > /dev/null
rm -f "${RW_DMG}"

# 7. Apply Custom Finder File Icon to Lemon.dmg itself
echo "-> Setting custom Finder file icon on ${DMG_NAME}..."
swift -e '
import AppKit
let dmg = "'"${DMG_PATH}"'"
let icns = "'"${PROJECT_DIR}"'/Resources/AppIcon.icns"
if let img = NSImage(contentsOfFile: icns) {
    _ = NSWorkspace.shared.setIcon(img, forFile: dmg, options: [])
}
'

# Create versioned copy Lemon-v1.1.0.dmg
echo "-> Creating versioned copy Lemon-v1.1.0.dmg..."
cp -p "${DMG_PATH}" "${PROJECT_DIR}/Lemon-v1.1.0.dmg"
swift -e '
import AppKit
let dmg = "'"${PROJECT_DIR}"'/Lemon-v1.1.0.dmg"
let icns = "'"${PROJECT_DIR}"'/Resources/AppIcon.icns"
if let img = NSImage(contentsOfFile: icns) {
    _ = NSWorkspace.shared.setIcon(img, forFile: dmg, options: [])
}
'

# 8. Install directly into /Applications
echo "-> Installing to /Applications/${APP_NAME}.app..."
# Close any running instance first
pkill -f "/Applications/${APP_NAME}.app/Contents/MacOS/${APP_NAME}" 2>/dev/null || true
sleep 0.5
rm -rf "/Applications/${APP_NAME}.app"
cp -R "${APP_BUNDLE}" "/Applications/"

# Apply custom icon to /Applications/Lemon.app
swift -e '
import AppKit
let appPath = "/Applications/'"${APP_NAME}"'.app"
let icns = "'"${PROJECT_DIR}"'/Resources/AppIcon.icns"
if let img = NSImage(contentsOfFile: icns) {
    _ = NSWorkspace.shared.setIcon(img, forFile: appPath, options: [])
}
'

# Invalidate LaunchServices cache so macOS immediately registers the new icon
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "/Applications/${APP_NAME}.app" 2>/dev/null || true

echo "=== Build Complete! ==="
echo "DMG Created: ${DMG_PATH}"
echo "Installed: /Applications/${APP_NAME}.app"
ls -lh "${DMG_PATH}"
