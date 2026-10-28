# Lemon 🍋 — Passport & Photo Print Studio for macOS

[![Release](https://img.shields.io/github/v/release/lemo1bot/Lemon-Passport-Photo-Studio?style=flat-square&color=F59E0B&label=Download%20DMG)](https://github.com/lemo1bot/Lemon-Passport-Photo-Studio/releases/latest)
[![macOS](https://img.shields.io/badge/macOS-13.0%2B%20(Ventura%2C%20Sonoma%2C%20Sequoia)-black?style=flat-square&logo=apple)](https://github.com/lemo1bot/Lemon-Passport-Photo-Studio)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

**Lemon** is a dedicated, high-precision native macOS application built for studio photographers, print shops, and iMac users to format, edit, retouch, freely arrange, and directly print passport and visa photos at **true 1:1 physical millimeter scale** with zero print-dialog scaling distortion.

---

## 📥 Download & Install

Get the official, notarized-ready disk image directly from GitHub Releases:

👉 **[Download Lemon.dmg (Latest Release)](https://github.com/lemo1bot/Lemon-Passport-Photo-Studio/releases/latest/download/Lemon.dmg)**

### Quick Installation:
1. Open **`Lemon.dmg`**.
2. Drag **`Lemon.app`** into the **Applications** folder shortcut.
3. Launch **Lemon** from Launchpad, Spotlight, or the Applications folder!

---

## ✨ Key Features

### 🖨️ Direct 1:1 Millimeter Printing & Glossy Photo Paper
* **🌟 Glossy Photo Paper Optimization**: Native CUPS and AppKit media configuration for **Canon G3010 / G3000 series**, Epson, and HP inkjet printers (`CNIJMediaType 68` / `50` / `PhotographicGlossy`) for rich photo blacks, vivid colors, and no ink smudging.
* **Paper Finish Options**: Glossy Photo Paper (Recommended), Photo Paper Plus Semi-Gloss / Luster, Matte Photo Paper, and Plain Paper.
* **High Photo Quality (300+ DPI)**: Hardware Super Fine setting (`CNIJPrintQuality 0` / `5`) with smooth gradients and no printhead banding.
* **Zero Scaling Distortion**: Directly communicates with macOS native `NSPrintOperation` with a strict `scalingFactor = 1.0` and zero margin offsets.
* **Exact Millimeter Sizing**:
  * **35 × 45 mm** — UK, Schengen, European Union, India, Australia, Singapore, New Zealand
  * **2 × 2 inches (51 × 51 mm)** — United States Passport, OCI Visa, India Visa
  * **33 × 48 mm** — China Visa standard
  * **35 × 35 mm** — Japan / India standard
  * **Custom mm** — Any physical width and height you specify.
* **Direct Print (`⌘P`)**: Opens the native macOS print sheet with full driver options exposed (Media & Quality, Paper Handling, Preview).
* **Quick Print (`⌘⇧P`)**: Sends directly to your default photo printer with one click.
* **Built-in Physical Scale Ruler**: A 50 mm calibration bar printed at the margin to verify ruler precision.

---

### 📄 "5 Photos on A4" Sheet Layouts (Save Paper!)
* **Top Strip (1 Row of 5)**: Formats all 5 passport photos in a single horizontal row across the top of an A4 sheet:
  * Exact **35.0 × 45.0 mm** per photo.
  * Symmetrical **7.5 mm** side margins and **5.0 mm** inter-photo gaps ($7.5 + 5\times 35 + 4\times 5 + 7.5 = 210\text{ mm}$).
  * **Saves 82% of A4 Photo Paper**: Photos occupy only the top 55 mm ($Y = 10\text{ to }55\text{ mm}$), leaving the remaining 242 mm clean and unprinted for future customer orders.
* **Balanced Grid (3 + 2 Centered)**: Formats 5 photos in two centered rows.
* **Fill Sheet**: Automatically calculates and fills the entire page with maximum possible photos (up to 20–30 per page).

---

### ✋ Freeform Drag & Drop on Sheet
* **Move Any Photo Anywhere**: Click and drag any photo on the A4 sheet to position it anywhere on the page.
* **Live Millimeter Coordinates**: A floating badge displays the exact physical paper position as you move (e.g. `X: 45 mm, Y: 12 mm`).
* **🧲 Magnetic 5 mm Snapping**: Automatically snaps photos to 5 mm increments to keep rows and columns neatly aligned.
* **🔄 Auto-Grid**: Realign all photos into a uniform grid with one click.

---

### ⧉ Multi-Select (`⌘A`) & Batch Duplication (`⌘D`)
* **Select All (`⌘A`)**: Select every photo on the sheet at once.
* **Marquee Box Selection**: Click on empty sheet space and drag to select any group of photos.
* **Shift + Click**: Add or remove individual photos from your selection.
* **Batch Duplicate (`⌘D`)**:
  * Select a row of 5 photos across the top -> Press `⌘D` -> Row 2 is duplicated directly beneath (10 photos total).
  * Press `⌘D` again -> Row 3 is created (15 photos total).
  * Press `⌘D` again -> Row 4 is created (20 photos total).
* **Batch Move**: Drag any selected photo to move the entire group in locked unison.
* **Batch Delete**: Press `Delete` or `Backspace` to remove all selected photos at once.

---

### 🎨 Native Pixel-Processing Photo Editor
* **60 FPS Real-Time Sliders**:
  * **Brightness**: `[-50% to +50%]`
  * **Contrast**: S-curve dynamic range scaling
  * **Exposure**: `[-1.5 EV to +1.5 EV]`
  * **Warmth / Color Temp**: `[-50 to +50]`
  * **Saturation**: `[0% to 200%]`
  * **Skin Smoothing**: Facial blur filter that selectively softens skin tones while keeping eyes, lips, and hair sharp.
  * **Sharpness**: High-pass Laplacian convolution kernel for crisp passport prints.
* **1-Click Filter Presets**:
  * **Normal**: True natural original.
  * **Studio**: High-key passport lighting (+10% Brightness, +15% Contrast, +0.2 EV, Skin Smoothing).
  * **Warm**: Golden soft lighting (+25 Warmth, +10% Saturation).
  * **Crisp**: High-definition details (+50% Sharpness, +15% Contrast).
  * **Black & White (B&W)**: Biometric grayscale conversion with balanced lighting.

---

### 🪄 Intelligent AI Background Replacement
* **Edge-Seeded Flood Fill Segmentation**: Automatically detects the customer's background using color-distance clustering and soft feathered perimeter blending.
* **Face & Subject Protection**: Built-in guards detect human skin tones (`R > G > B`), dark hair, and clothing to prevent any accidental erasing of the subject.
* **Official Visa Backgrounds**:
  * ⚪ **Pure White (`#FFFFFF`)** — US, Schengen, Indian Passport requirement
  * 🔵 **Light Blue (`#D8E8F8`)** — Malaysia, Singapore, and international visa blue
  * 🔘 **Light Grey (`#F0F0F0`)** — European ID card neutral backdrop
  * ⚪ **Off-White (`#FAF8F5`)** — Standard visa backdrop
  * 🔴 **Red (`#DC2626`)** — Asian official visa format (China, Indonesia)
  * 🎨 **Custom Color Studio**: Exact hex code input (`#RRGGBB`), native macOS color picker, and 10 one-click studio swatches (Pure White, Sky Blue, Royal Blue, Navy, Studio Grey, Off-White, Visa Red, Studio Green, Passport Cream, Dark Grey) with 100% accurate color reproduction.

---

### 📥 Drag-to-Upload & Camera Capture
* **Finder Drag & Drop**: Drag image files directly from Finder onto the app window to import them.
* **Format Support**: JPG, PNG, HEIC (iPhone Photos), TIFF, and WebP. iPhone HEIC images are automatically converted by macOS into high-resolution images.
* **iMac FaceTime HD Camera**: Capture customer portraits directly inside the app with live preview and instant capture.

---

### ✂️ Cutting Guides & Export
* **Corner L-Marks**: High-precision corner crop marks for easy scissor or rotary trimmer cutting.
* **Dashed Cutting Grid**: Optional cutting lines between photos.
* **Export Options**: Export high-resolution 300 DPI PNG or PDF.

---

## 🛠️ Building from Source

### Prerequisites
* macOS 13.0 (Ventura) or newer
* Xcode Command Line Tools (`xcode-select --install`)
* Swift 5.8+

### Build & Package DMG:
```bash
# Clone the repository
git clone https://github.com/lemo1bot/Lemon-Passport-Photo-Studio.git
cd Lemon-Passport-Photo-Studio

# Build the native app bundle and generate Lemon.dmg
./Scripts/build_dmg.sh
```

The compiled application will be installed to `/Applications/Lemon.app` and packaged into `Lemon.dmg`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
