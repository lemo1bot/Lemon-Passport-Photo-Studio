// Lemon Photo Studio - Drag-Anywhere Sheet Placement, Copy & Customer Studio Engine

const PASSPORT_PRESETS = {
  india_passport: { name: "India Passport / Visa", w: 35, h: 45, headMin: 0.70, headMax: 0.80, bg: "Plain White", notes: "35×45 mm • Head 70%–80% (32–36 mm from chin to crown)" },
  india_oci: { name: "India OCI / Visa (2×2\")", w: 50.8, h: 50.8, headMin: 0.70, headMax: 0.80, bg: "Plain White", notes: "2×2 inches (51×51 mm) • Head 70%–80%" },
  us_passport: { name: "US Passport & Visa (2×2\")", w: 50.8, h: 50.8, headMin: 0.50, headMax: 0.69, bg: "White / Off-White", notes: "2×2 inches (51×51 mm) • Head 1\" to 1 3/8\"" },
  uk_schengen: { name: "UK / Schengen / EU", w: 35, h: 45, headMin: 0.70, headMax: 0.80, bg: "Light Grey / White", notes: "35×45 mm • Crown to chin 32–36 mm" },
  canada_passport: { name: "Canada Passport", w: 50, h: 70, headMin: 0.44, headMax: 0.51, bg: "White / Light", notes: "50×70 mm • Head height 31–36 mm" },
  australia_passport: { name: "Australia & New Zealand", w: 35, h: 45, headMin: 0.71, headMax: 0.80, bg: "White / Light Grey", notes: "35×45 mm • Head height 32–36 mm" },
  japan_passport: { name: "Japan Passport", w: 35, h: 45, headMin: 0.70, headMax: 0.78, bg: "Plain White", notes: "35×45 mm • Head height 32–36 mm" },
  china_passport: { name: "China Passport & Visa", w: 33, h: 48, headMin: 0.58, headMax: 0.69, bg: "White", notes: "33×48 mm • Head width 15–22 mm" },
  uae_visa: { name: "UAE / Dubai Visa", w: 40, h: 60, headMin: 0.70, headMax: 0.80, bg: "White", notes: "40×60 mm • White background" },
  square_35: { name: "Square ID (35×35 mm)", w: 35, h: 35, headMin: 0.65, headMax: 0.75, bg: "White", notes: "35×35 mm International ID" },
  standard_30x40: { name: "Standard ID (30×40 mm)", w: 30, h: 40, headMin: 0.70, headMax: 0.80, bg: "White", notes: "30×40 mm driver's license / student card" },
  custom: { name: "Custom Size", w: 35, h: 45, headMin: 0.70, headMax: 0.80, bg: "Custom", notes: "Custom physical width & height" }
};

const PAPER_PRESETS = {
  a4: { name: "A4 Sheet (210 × 297 mm)", w: 210, h: 297 },
  photo_4x6: { name: "4 × 6 inches (10 × 15 cm)", w: 101.6, h: 152.4 },
  us_letter: { name: "US Letter (8.5 × 11 in)", w: 215.9, h: 279.4 },
  photo_5x7: { name: "5 × 7 inches (13 × 18 cm)", w: 127, h: 177.8 },
  a5: { name: "A5 Sheet (148 × 210 mm)", w: 148, h: 210 },
  a6: { name: "A6 Sheet (105 × 148 mm)", w: 105, h: 148 },
  custom: { name: "Custom Paper", w: 210, h: 297 }
};

// Global Application State
const state = {
  photos: [], // Array of customer photo objects
  activePhotoIdx: 0,
  activeTab: 'sheet', // Default to Print Sheet Preview

  // Placed photos on the sheet (Freeform Drag Anywhere & Multi-Select support!)
  sheetItems: [],
  selectedSheetItemIdx: 0,
  selectedSheetItemIndices: [0], // Array of selected sheet item indices
  isDraggingSheetItem: false,
  dragSheetStartMouseX: 0,
  dragSheetStartMouseY: 0,
  dragSheetStartItemX: 0,
  dragSheetStartItemY: 0,
  dragInitialPositions: [], // Track starting positions of all selected items for group move
  hasMovedDuringDrag: false,
  isMarqueeSelecting: false,
  marqueeStartPtX: 0,
  marqueeStartPtY: 0,
  marqueeCurrentPtX: 0,
  marqueeCurrentPtY: 0,
  snapToGrid: true,

  // Interactive Resizing of Sheet Photo Items
  isResizingSheetItem: false,
  resizeHandle: null, // 'tl', 'tr', 'bl', 'br', 't', 'r', 'b', 'l'
  resizeStartMouseX: 0,
  resizeStartMouseY: 0,
  resizeStartItem: null,
  lockSheetItemAspect: true,

  // Sheet Layout Settings (Default: 5 photos on A4!)
  paperSize: 'a4',
  paperOrient: 'portrait',
  paperType: 'glossy', // Default: Glossy Photo Paper
  printQuality: 'high', // Default: High Photo Quality (300+ DPI)
  targetCount: 5,
  arrangement: 'singleRow',
  fullPageMode: 'fit', // 'fit' (proportional, preserve aspect), 'margins' (with margins), 'borderless' (full 210x297mm)
  customCols: 5,
  customRows: 1,
  alignment: 'topCenter',
  marginMM: 10,
  gapMM: 4.0,

  // Passport Standard
  passportKey: 'india_passport',
  customPassportW: 35,
  customPassportH: 45,

  // Print & Cutting Guides
  showCropMarks: true,
  showCutLines: true,
  showCalibrationRuler: true,
  showSheetHeader: true,
  showBiometricGuides: true,

  // Sheet Preview Zoom
  sheetZoomMode: 'fit',
  sheetZoomScale: 1.0,

  // Photo Editor interactive drag/zoom state
  isDraggingCrop: false,
  cropDragStartX: 0,
  cropDragStartY: 0,
  photoStartPanX: 0,
  photoStartPanY: 0,

  // History stack for Photo Editor
  history: [],
  historyIndex: -1,

  // Webcam stream
  cameraStream: null
};

// Helper: Get active photo
function getActivePhoto() {
  if (state.photos.length === 0) return null;
  return state.photos[state.activePhotoIdx] || state.photos[0];
}

// Helper: Get Passport physical dimensions in mm
function getPassportDimensionsMM() {
  if (state.passportKey === 'custom') {
    return { w: state.customPassportW, h: state.customPassportH };
  }
  const p = PASSPORT_PRESETS[state.passportKey] || PASSPORT_PRESETS.india_passport;
  return { w: p.w, h: p.h };
}

// Helper: Get Paper physical dimensions in mm
function getPaperDimensionsMM() {
  const p = PAPER_PRESETS[state.paperSize] || PAPER_PRESETS.a4;
  const isPortrait = state.paperOrient === 'portrait';
  const minDim = Math.min(p.w, p.h);
  const maxDim = Math.max(p.w, p.h);
  return {
    w: isPortrait ? minDim : maxDim,
    h: isPortrait ? maxDim : minDim
  };
}

// Expose global functions immediately for native AppKit drag-and-drop & native open panel
window.addCustomerPhotoFromNative = function(name, dataURL) {
  function doAdd() {
    const img = new Image();
    let loaded = false;
    img.onload = () => {
      if (loaded) return;
      loaded = true;
      addCustomerPhotoItem(name, img);
    };
    img.onerror = (err) => {
      console.error("Failed to decode native customer image:", err);
    };
    img.src = dataURL;
    if (img.complete && img.naturalWidth > 0) {
      if (!loaded) {
        loaded = true;
        addCustomerPhotoItem(name, img);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', doAdd);
  } else {
    doAdd();
  }
};

window.addCustomerPhotoFromNativeJSON = function(jsonOrStr) {
  try {
    const data = typeof jsonOrStr === 'string' ? JSON.parse(jsonOrStr) : jsonOrStr;
    if (data && data.dataURL) {
      window.addCustomerPhotoFromNative(data.name || "Customer Photo", data.dataURL);
    }
  } catch (err) {
    console.error("Error parsing native photo JSON payload:", err);
  }
};

// MARK: - App Initialization
function initApp() {
  setupEventListeners();
  loadDefaultSamplePhoto();
  setupDragAndDropUpload();
  rebuildSheetGrid(5);
  updateUI();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function setupEventListeners() {
  // Tabs: Photo Editor vs Sheet Preview
  document.getElementById('tabCrop').addEventListener('click', () => switchTab('crop'));
  document.getElementById('tabSheet').addEventListener('click', () => switchTab('sheet'));

  // Edit from Sheet button
  document.getElementById('btnEditFromSheet').addEventListener('click', () => {
    const sel = state.sheetItems[state.selectedSheetItemIdx];
    if (sel && sel.photoIdx !== undefined) {
      state.activePhotoIdx = sel.photoIdx;
    }
    switchTab('crop');
  });

  document.getElementById('btnDoneEditSheet').addEventListener('click', () => switchTab('sheet'));

  // Quick 1-Click Presets
  document.getElementById('btnQuick5A4').addEventListener('click', () => {
    state.paperSize = 'a4';
    state.paperOrient = 'portrait';
    state.targetCount = 5;
    state.arrangement = 'singleRow';
    state.alignment = 'topCenter';
    updateCountChips();
    syncControls();
    rebuildSheetGrid(5, 'singleRow');
    switchTab('sheet');
  });

  document.getElementById('btnQuick5A4Grid').addEventListener('click', () => {
    state.paperSize = 'a4';
    state.paperOrient = 'portrait';
    state.targetCount = 5;
    state.arrangement = 'balanced';
    state.alignment = 'centered';
    updateCountChips();
    syncControls();
    rebuildSheetGrid(5, 'balanced');
    switchTab('sheet');
  });

  document.getElementById('btnQuick4x6').addEventListener('click', () => {
    state.paperSize = 'photo_4x6';
    state.paperOrient = 'portrait';
    state.targetCount = 6;
    state.arrangement = 'balanced';
    state.alignment = 'centered';
    updateCountChips();
    syncControls();
    rebuildSheetGrid(6, 'balanced');
    switchTab('sheet');
  });

  document.getElementById('btnQuickFill').addEventListener('click', () => {
    state.targetCount = 'max';
    state.arrangement = 'balanced';
    updateCountChips();
    syncControls();
    rebuildSheetGrid('max');
    switchTab('sheet');
  });

  // Quick 1 Photo Full A4 Preset
  const btnQuickFullA4 = document.getElementById('btnQuickFullA4');
  if (btnQuickFullA4) {
    btnQuickFullA4.addEventListener('click', applyQuickFullA4);
  }
  const btnToolbarFullA4 = document.getElementById('btnToolbarFullA4');
  if (btnToolbarFullA4) {
    btnToolbarFullA4.addEventListener('click', applyQuickFullA4);
  }

  // Freeform Sheet Controls (Move, Multi-Select, Copy Together, Add Photo)
  document.getElementById('btnSelectAllSheet').addEventListener('click', selectAllSheetItems);
  document.getElementById('btnDuplicateSheetItem').addEventListener('click', duplicateSelectedSheetItems);
  document.getElementById('btnCopyAllSheet').addEventListener('click', copyAllSheetItems);
  document.getElementById('btnAddCopySheet').addEventListener('click', () => addPhotoCopyToSheet());

  const btnDelSheet = document.getElementById('btnDeleteSheetItem');
  if (btnDelSheet) btnDelSheet.addEventListener('click', deleteSelectedSheetItems);

  document.getElementById('btnAlignGrid').addEventListener('click', () => rebuildSheetGrid(state.sheetItems.length || 5));

  document.getElementById('chkSnapGrid').addEventListener('change', (e) => {
    state.snapToGrid = e.target.checked;
  });

  // Floating Menu Actions over Selected Sheet Photo(s)
  const btnFloatFullA4 = document.getElementById('btnFloatFullA4');
  if (btnFloatFullA4) {
    btnFloatFullA4.addEventListener('click', () => makeSelectedPhotoFullA4('fit'));
  }

  document.getElementById('btnFloatEdit').addEventListener('click', () => {
    const selIdx = state.selectedSheetItemIndices[0] ?? state.selectedSheetItemIdx;
    const sel = state.sheetItems[selIdx];
    if (sel && sel.photoIdx !== undefined) state.activePhotoIdx = sel.photoIdx;
    switchTab('crop');
  });

  document.getElementById('btnFloatCopy').addEventListener('click', duplicateSelectedSheetItems);
  document.getElementById('btnFloatDelete').addEventListener('click', deleteSelectedSheetItems);

  // Inspector: Selected Photo Resizing (Resize Any Photo by Self!)
  const numSelW = document.getElementById('numSelectedPhotoW');
  const numSelH = document.getElementById('numSelectedPhotoH');
  const chkLockAspect = document.getElementById('chkLockAspectResize');
  const btnMakeFullA4 = document.getElementById('btnMakeSelectedFullA4');
  const btnResetSize = document.getElementById('btnResetSelectedPhotoSize');

  if (chkLockAspect) {
    chkLockAspect.addEventListener('change', (e) => {
      state.lockSheetItemAspect = e.target.checked;
    });
  }

  if (btnMakeFullA4) {
    btnMakeFullA4.addEventListener('click', () => makeSelectedPhotoFullA4('margins'));
  }

  if (btnResetSize) {
    btnResetSize.addEventListener('click', resetSelectedPhotoSize);
  }

  if (numSelW) {
    numSelW.addEventListener('input', (e) => {
      const item = state.sheetItems[state.selectedSheetItemIdx];
      if (!item) return;
      const val = parseFloat(e.target.value);
      if (isNaN(val) || val < 5) return;
      const oldW = item.wMM;
      item.wMM = val;
      if (state.lockSheetItemAspect && oldW > 0) {
        const aspect = oldW / item.hMM;
        item.hMM = Math.round((val / aspect) * 10) / 10;
        if (numSelH) numSelH.value = item.hMM;
      }
      const paperMM = getPaperDimensionsMM();
      item.xMM = Math.max(0, Math.min(paperMM.w - item.wMM, item.xMM));
      item.yMM = Math.max(0, Math.min(paperMM.h - item.hMM, item.yMM));
      renderSheet();
      updateFloatingMenu();
    });
  }

  if (numSelH) {
    numSelH.addEventListener('input', (e) => {
      const item = state.sheetItems[state.selectedSheetItemIdx];
      if (!item) return;
      const val = parseFloat(e.target.value);
      if (isNaN(val) || val < 5) return;
      const oldH = item.hMM;
      item.hMM = val;
      if (state.lockSheetItemAspect && oldH > 0) {
        const aspect = item.wMM / oldH;
        item.wMM = Math.round((val * aspect) * 10) / 10;
        if (numSelW) numSelW.value = item.wMM;
      }
      const paperMM = getPaperDimensionsMM();
      item.xMM = Math.max(0, Math.min(paperMM.w - item.wMM, item.xMM));
      item.yMM = Math.max(0, Math.min(paperMM.h - item.hMM, item.yMM));
      renderSheet();
      updateFloatingMenu();
    });
  }

  document.querySelectorAll('.btn-size-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const action = chip.getAttribute('data-action');
      if (action === 'fullA4') {
        makeSelectedPhotoFullA4('margins');
      } else if (action === 'fitA4') {
        makeSelectedPhotoFullA4('fit');
      } else if (action === 'resetStandard') {
        resetSelectedPhotoSize();
      } else {
        const w = parseFloat(chip.getAttribute('data-w'));
        const h = parseFloat(chip.getAttribute('data-h'));
        if (!isNaN(w) && !isNaN(h)) {
          resizeSelectedPhoto(w, h);
        }
      }
    });
  });

  // Copy / Duplicate in Editor & Sidebar
  document.getElementById('btnDuplicateInEditor').addEventListener('click', () => {
    duplicateCustomerPhoto(state.activePhotoIdx);
  });
  document.getElementById('btnDuplicateCustomerSidebar').addEventListener('click', () => {
    duplicateCustomerPhoto(state.activePhotoIdx);
  });

  // Customer Name Editing
  document.getElementById('txtCustomerName').addEventListener('input', (e) => {
    const photo = getActivePhoto();
    if (photo) {
      photo.name = e.target.value || "Customer Photo";
      updatePhotoQueueUI();
    }
  });

  // Upload Options
  const fileInput = document.getElementById('fileInput');
  const btnUploadDropdown = document.getElementById('btnUploadDropdown');
  if (btnUploadDropdown) {
    btnUploadDropdown.addEventListener('click', (e) => {
      if (e.target.closest('.dropdown-content')) return;
      triggerUploadDialog(e);
    });
  }
  document.getElementById('btnUploadFiles').addEventListener('click', triggerUploadDialog);
  document.getElementById('btnAddPhotoSidebar').addEventListener('click', triggerUploadDialog);
  document.getElementById('sidebarDropZone').addEventListener('click', triggerUploadDialog);
  fileInput.addEventListener('change', handleFileSelect);

  // Window resize responsiveness
  window.addEventListener('resize', () => {
    if (state.activeTab === 'crop') {
      renderCrop();
    } else {
      renderSheet();
      updateFloatingMenu();
    }
  });

  document.getElementById('btnSamplePhotoOption').addEventListener('click', (e) => {
    e.preventDefault();
    loadDefaultSamplePhoto();
  });
  document.getElementById('btnLoadSample').addEventListener('click', loadDefaultSamplePhoto);

  // Camera Capture Modal (FaceTime HD camera for customers!)
  document.getElementById('btnCaptureCamera').addEventListener('click', (e) => {
    e.preventDefault();
    openCameraModal();
  });
  document.getElementById('btnQuickCameraSidebar').addEventListener('click', openCameraModal);
  document.getElementById('btnCloseCamera').addEventListener('click', closeCameraModal);
  document.getElementById('btnCancelCamera').addEventListener('click', closeCameraModal);
  document.getElementById('btnSnapPhoto').addEventListener('click', snapCameraPhoto);

  // Inspector: Paper & Layout
  document.getElementById('selPaperSize').addEventListener('change', (e) => {
    state.paperSize = e.target.value;
    rebuildSheetGrid(state.sheetItems.length || 5);
    updateUI();
  });

  document.querySelectorAll('input[name="paperOrient"]').forEach(r => {
    r.addEventListener('change', (e) => {
      state.paperOrient = e.target.value;
      rebuildSheetGrid(state.sheetItems.length || 5);
      updateUI();
    });
  });

  // Paper Type & Finish (Glossy Photo Paper for Passports)
  const selPaperType = document.getElementById('selPaperType');
  if (selPaperType) {
    selPaperType.addEventListener('change', (e) => {
      state.paperType = e.target.value;
      updateUI();
    });
  }

  // Print Quality (High vs Standard)
  document.querySelectorAll('input[name="printQuality"]').forEach(r => {
    r.addEventListener('change', (e) => {
      state.printQuality = e.target.value;
      const lblBadge = document.getElementById('lblPrintQualityBadge');
      if (lblBadge) {
        lblBadge.textContent = state.printQuality === 'high' ? 'High (300+ DPI)' : 'Standard';
      }
      updateUI();
    });
  });

  // Count Chips
  document.querySelectorAll('.count-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const c = chip.getAttribute('data-count');
      state.targetCount = c === 'max' ? 'max' : parseInt(c, 10);
      updateCountChips();
      rebuildSheetGrid(state.targetCount);
      updateUI();
    });
  });

  document.getElementById('selArrangement').addEventListener('change', (e) => {
    state.arrangement = e.target.value;
    document.getElementById('customGridRow').style.display = state.arrangement === 'customGrid' ? 'flex' : 'none';
    const fullPageRow = document.getElementById('fullPageOptionsRow');
    if (fullPageRow) fullPageRow.style.display = state.arrangement === 'fullPage' ? 'flex' : 'none';
    if (state.arrangement === 'fullPage') {
      state.targetCount = 1;
      updateCountChips();
    }
    rebuildSheetGrid(state.targetCount, state.arrangement);
    updateUI();
  });

  const selFullPageMode = document.getElementById('selFullPageMode');
  if (selFullPageMode) {
    selFullPageMode.addEventListener('change', (e) => {
      state.fullPageMode = e.target.value;
      rebuildSheetGrid(state.targetCount, 'fullPage');
      updateUI();
    });
  }

  document.getElementById('numCols').addEventListener('input', (e) => {
    state.customCols = parseInt(e.target.value, 10) || 1;
    rebuildSheetGrid(state.targetCount, 'customGrid');
    updateUI();
  });

  document.getElementById('numRows').addEventListener('input', (e) => {
    state.customRows = parseInt(e.target.value, 10) || 1;
    rebuildSheetGrid(state.targetCount, 'customGrid');
    updateUI();
  });

  document.getElementById('selAlignment').addEventListener('change', (e) => {
    state.alignment = e.target.value;
    rebuildSheetGrid(state.targetCount);
    updateUI();
  });

  document.getElementById('sliderMargin').addEventListener('input', (e) => {
    state.marginMM = parseFloat(e.target.value);
    document.getElementById('lblMarginVal').textContent = `${Math.round(state.marginMM)} mm`;
    rebuildSheetGrid(state.sheetItems.length || 5);
    updateUI();
  });

  document.getElementById('sliderGap').addEventListener('input', (e) => {
    state.gapMM = parseFloat(e.target.value);
    document.getElementById('lblGapVal').textContent = `${state.gapMM.toFixed(1)} mm`;
    rebuildSheetGrid(state.sheetItems.length || 5);
    updateUI();
  });

  // Passport Standards
  document.getElementById('selPassportStandard').addEventListener('change', (e) => {
    state.passportKey = e.target.value;
    document.getElementById('customSizeRow').style.display = state.passportKey === 'custom' ? 'flex' : 'none';
    const preset = PASSPORT_PRESETS[state.passportKey] || PASSPORT_PRESETS.india_passport;
    document.getElementById('standardNotes').textContent = preset.notes;
    document.getElementById('standardBgNote').textContent = `Background: ${preset.bg}`;

    // Auto-adjust orientation if 5 photos in single row exceeds portrait width (e.g. US 2x2" on A4)
    const dim = getPassportDimensionsMM();
    const paperMM = getPaperDimensionsMM();
    if (state.targetCount === 5 && state.arrangement === 'singleRow' && (5 * dim.w > paperMM.w - 10)) {
      if (state.paperSize === 'a4' && state.paperOrient === 'portrait') {
        state.paperOrient = 'landscape';
        document.querySelectorAll('input[name="paperOrient"]').forEach(r => {
          r.checked = (r.value === 'landscape');
        });
      }
    }

    rebuildSheetGrid(state.sheetItems.length || 5, state.arrangement);
    updateUI();
  });

  document.getElementById('numCustomW').addEventListener('input', (e) => {
    state.customPassportW = parseFloat(e.target.value) || 35;
    rebuildSheetGrid(state.sheetItems.length || 5, state.arrangement);
    updateUI();
  });

  document.getElementById('numCustomH').addEventListener('input', (e) => {
    state.customPassportH = parseFloat(e.target.value) || 45;
    rebuildSheetGrid(state.sheetItems.length || 5, state.arrangement);
    updateUI();
  });

  // Guides
  document.getElementById('chkCropMarks').addEventListener('change', (e) => {
    state.showCropMarks = e.target.checked;
    renderSheet();
  });

  document.getElementById('chkCutLines').addEventListener('change', (e) => {
    state.showCutLines = e.target.checked;
    renderSheet();
  });

  document.getElementById('chkCalibrationRuler').addEventListener('change', (e) => {
    state.showCalibrationRuler = e.target.checked;
    renderSheet();
  });

  document.getElementById('chkSheetHeader').addEventListener('change', (e) => {
    state.showSheetHeader = e.target.checked;
    renderSheet();
  });

  document.getElementById('chkGuides').addEventListener('change', (e) => {
    state.showBiometricGuides = e.target.checked;
    document.getElementById('biometricGuideSvg').style.display = state.showBiometricGuides ? 'block' : 'none';
  });

  // Photo Editor Controls (Zoom, Tilt, Rotate, Flip)
  const sliderZoom = document.getElementById('sliderZoom');
  sliderZoom.addEventListener('input', (e) => {
    const photo = getActivePhoto();
    if (!photo) return;
    photo.zoom = parseFloat(e.target.value);
    document.getElementById('zoomValueLabel').textContent = `${photo.zoom.toFixed(1)}×`;
    renderCrop();
    renderSheet();
  });

  document.getElementById('btnZoomIn').addEventListener('click', () => {
    const photo = getActivePhoto();
    if (!photo) return;
    photo.zoom = Math.min(5.0, photo.zoom + 0.1);
    sliderZoom.value = photo.zoom;
    document.getElementById('zoomValueLabel').textContent = `${photo.zoom.toFixed(1)}×`;
    renderCrop();
    renderSheet();
  });

  document.getElementById('btnZoomOut').addEventListener('click', () => {
    const photo = getActivePhoto();
    if (!photo) return;
    photo.zoom = Math.max(0.3, photo.zoom - 0.1);
    sliderZoom.value = photo.zoom;
    document.getElementById('zoomValueLabel').textContent = `${photo.zoom.toFixed(1)}×`;
    renderCrop();
    renderSheet();
  });

  const sliderTilt = document.getElementById('sliderTilt');
  sliderTilt.addEventListener('input', (e) => {
    const photo = getActivePhoto();
    if (!photo) return;
    photo.tilt = parseFloat(e.target.value);
    document.getElementById('tiltValueLabel').textContent = `${photo.tilt > 0 ? '+' : ''}${photo.tilt.toFixed(1)}°`;
    renderCrop();
    renderSheet();
  });

  document.getElementById('btnResetTilt').addEventListener('click', () => {
    const photo = getActivePhoto();
    if (!photo) return;
    photo.tilt = 0;
    sliderTilt.value = 0;
    document.getElementById('tiltValueLabel').textContent = `0.0°`;
    renderCrop();
    renderSheet();
  });

  document.getElementById('btnRotateCW').addEventListener('click', () => {
    const photo = getActivePhoto();
    if (!photo) return;
    saveSnapshot();
    photo.rotation = (photo.rotation + 90) % 360;
    renderCrop();
    renderSheet();
  });

  document.getElementById('btnRotateCCW').addEventListener('click', () => {
    const photo = getActivePhoto();
    if (!photo) return;
    saveSnapshot();
    photo.rotation = (photo.rotation - 90 + 360) % 360;
    renderCrop();
    renderSheet();
  });

  document.getElementById('btnFlipH').addEventListener('click', () => {
    const photo = getActivePhoto();
    if (!photo) return;
    saveSnapshot();
    photo.flipH = !photo.flipH;
    renderCrop();
    renderSheet();
  });

  document.getElementById('btnFlipV').addEventListener('click', () => {
    const photo = getActivePhoto();
    if (!photo) return;
    saveSnapshot();
    photo.flipV = !photo.flipV;
    renderCrop();
    renderSheet();
  });

  document.getElementById('btnResetCrop').addEventListener('click', () => {
    const photo = getActivePhoto();
    if (!photo) return;
    saveSnapshot();
    resetPhotoAdjustments(photo);
    syncPhotoControls(photo);
    renderCrop();
    renderSheet();
  });

  // AI Tools
  document.getElementById('btnAutoAlign').addEventListener('click', runAIAutoAlign);
  document.getElementById('btnWhitenBG').addEventListener('click', runAIBackgroundWhitener);

  // Undo / Redo
  document.getElementById('btnUndo').addEventListener('click', performUndo);
  document.getElementById('btnRedo').addEventListener('click', performRedo);

  // Filter Presets
  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilterPreset(btn.getAttribute('data-preset'));
    });
  });

  // Background Editor
  document.getElementById('selBgColor').addEventListener('change', (e) => {
    const photo = getActivePhoto();
    if (!photo) return;
    saveSnapshot();
    photo.bgMode = e.target.value;
    document.getElementById('customColorPickerRow').style.display = photo.bgMode === 'custom' ? 'flex' : 'none';
    renderCrop();
    renderSheet();
  });

  const pickerBgColor = document.getElementById('pickerBgColor');
  const txtCustomHex = document.getElementById('txtCustomHex');

  function updateCustomColor(newHex) {
    const photo = getActivePhoto();
    if (!photo) return;
    saveSnapshot();
    let cleanHex = newHex.trim();
    if (!cleanHex.startsWith('#')) cleanHex = '#' + cleanHex;
    photo.customBgColor = cleanHex;
    if (pickerBgColor) pickerBgColor.value = cleanHex;
    if (txtCustomHex) txtCustomHex.value = cleanHex.toUpperCase();
    renderCrop();
    renderSheet();
  }

  if (pickerBgColor) {
    pickerBgColor.addEventListener('input', (e) => {
      const photo = getActivePhoto();
      if (!photo) return;
      photo.customBgColor = e.target.value;
      if (txtCustomHex) txtCustomHex.value = e.target.value.toUpperCase();
      renderCrop();
      renderSheet();
    });
    pickerBgColor.addEventListener('change', (e) => updateCustomColor(e.target.value));
  }

  if (txtCustomHex) {
    txtCustomHex.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      const match = val.match(/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/);
      if (match) {
        const hex = val.startsWith('#') ? val : '#' + val;
        const photo = getActivePhoto();
        if (photo) {
          photo.customBgColor = hex;
          if (pickerBgColor) pickerBgColor.value = hex;
          renderCrop();
          renderSheet();
        }
      }
    });
    txtCustomHex.addEventListener('change', (e) => {
      const val = e.target.value.trim();
      const match = val.match(/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/);
      if (match) {
        updateCustomColor(val);
      }
    });
  }

  // Quick Swatches Click Handler
  document.querySelectorAll('.swatch-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const color = btn.getAttribute('data-color');
      if (color) updateCustomColor(color);
    });
  });

  // Background Detection Sensitivity / Tolerance Slider
  const sliderBgTolerance = document.getElementById('sliderBgTolerance');
  const lblBgToleranceVal = document.getElementById('lblBgToleranceVal');
  if (sliderBgTolerance) {
    sliderBgTolerance.addEventListener('input', (e) => {
      const photo = getActivePhoto();
      if (!photo) return;
      photo.bgTolerance = parseInt(e.target.value, 10);
      if (lblBgToleranceVal) lblBgToleranceVal.textContent = formatBgTolerance(photo.bgTolerance);
      renderCrop();
      renderSheet();
    });
  }

  document.getElementById('selBorderStyle').addEventListener('change', (e) => {
    const photo = getActivePhoto();
    if (!photo) return;
    saveSnapshot();
    photo.borderStyle = e.target.value;
    renderCrop();
    renderSheet();
  });

  // Lighting & Color Sliders
  setupAdjustmentSlider('sliderBright', 'lblBrightVal', 'brightness', (v) => `${v > 0 ? '+' : ''}${v}%`);
  setupAdjustmentSlider('sliderContrast', 'lblContrastVal', 'contrast', (v) => `${v > 0 ? '+' : ''}${v}%`);
  setupAdjustmentSlider('sliderExposure', 'lblExposureVal', 'exposure', (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} EV`);
  setupAdjustmentSlider('sliderSat', 'lblSatVal', 'saturation', (v) => `${v}%`);
  setupAdjustmentSlider('sliderWarmth', 'lblWarmthVal', 'warmth', (v) => `${v > 0 ? '+' : ''}${v}`);
  setupAdjustmentSlider('sliderSharp', 'lblSharpVal', 'sharpness', (v) => `${v}%`);
  setupAdjustmentSlider('sliderSkin', 'lblSkinVal', 'skinSmoothing', (v) => `${v}%`);

  document.getElementById('chkGrayscale').addEventListener('change', (e) => {
    const photo = getActivePhoto();
    if (!photo) return;
    saveSnapshot();
    photo.grayscale = e.target.checked;
    renderCrop();
    renderSheet();
  });

  // Interactive Drag on Crop Studio
  const cropBox = document.getElementById('cropBoxContainer');
  cropBox.addEventListener('mousedown', (e) => {
    state.isDraggingCrop = true;
    state.cropDragStartX = e.clientX;
    state.cropDragStartY = e.clientY;
    const photo = getActivePhoto();
    if (photo) {
      state.photoStartPanX = photo.panX || 0;
      state.photoStartPanY = photo.panY || 0;
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (state.isDraggingCrop) {
      const photo = getActivePhoto();
      if (!photo) return;
      photo.panX = state.photoStartPanX + (e.clientX - state.cropDragStartX);
      photo.panY = state.photoStartPanY + (e.clientY - state.cropDragStartY);
      renderCrop();
      renderSheet();
    } else if (state.isDraggingSheetItem || state.isResizingSheetItem || state.isMarqueeSelecting) {
      handleSheetItemDragMove(e);
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (state.isDraggingCrop) {
      state.isDraggingCrop = false;
      saveSnapshot();
    }
    if (state.isResizingSheetItem) {
      state.isResizingSheetItem = false;
      state.resizeHandle = null;
      state.resizeStartItem = null;
      renderSheet();
      updateFloatingMenu();
      syncSelectedPhotoInputs();
    }
    if (state.isDraggingSheetItem) {
      state.isDraggingSheetItem = false;
      if (!state.hasMovedDuringDrag && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        if (state.selectedSheetItemIdx >= 0) {
          state.selectedSheetItemIndices = [state.selectedSheetItemIdx];
        }
      }
      state.hasMovedDuringDrag = false;
      renderSheet();
      updateFloatingMenu();
      updateSelectionUI();
    }
    if (state.isMarqueeSelecting) {
      state.isMarqueeSelecting = false;
      renderSheet();
      updateFloatingMenu();
      updateSelectionUI();
    }
  });

  cropBox.addEventListener('wheel', (e) => {
    e.preventDefault();
    const photo = getActivePhoto();
    if (!photo) return;
    const delta = e.deltaY * -0.002;
    photo.zoom = Math.max(0.3, Math.min(5.0, (photo.zoom || 1.0) + delta));
    sliderZoom.value = photo.zoom;
    document.getElementById('zoomValueLabel').textContent = `${photo.zoom.toFixed(1)}×`;
    renderCrop();
    renderSheet();
  }, { passive: false });

  // Interactive Freeform Sheet Drag, Drop & Resize Handlers
  const sheetCanvas = document.getElementById('sheetCanvas');
  sheetCanvas.addEventListener('mousedown', handleSheetCanvasMouseDown);
  sheetCanvas.addEventListener('mousemove', (e) => {
    if (state.isDraggingSheetItem || state.isResizingSheetItem || state.isMarqueeSelecting) return;
    const rect = sheetCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (state.selectedSheetItemIdx >= 0 && state.sheetItems[state.selectedSheetItemIdx]) {
      const hitHandle = getSheetItemHandleAt(state.sheetItems[state.selectedSheetItemIdx], mouseX, mouseY);
      if (hitHandle) {
        sheetCanvas.style.cursor = getCursorForHandle(hitHandle);
        return;
      }
    }

    const pointsPerMM = 72 / 25.4;
    const displayScale = getEffectiveSheetScale();
    let overItem = false;
    for (let i = state.sheetItems.length - 1; i >= 0; i--) {
      const it = state.sheetItems[i];
      const ix = it.xMM * pointsPerMM * displayScale;
      const iy = it.yMM * pointsPerMM * displayScale;
      const iw = it.wMM * pointsPerMM * displayScale;
      const ih = it.hMM * pointsPerMM * displayScale;
      if (mouseX >= ix && mouseX <= ix + iw && mouseY >= iy && mouseY <= iy + ih) {
        overItem = true;
        break;
      }
    }
    sheetCanvas.style.cursor = overItem ? 'grab' : 'default';
  });

  sheetCanvas.addEventListener('dblclick', () => {
    const selIdx = state.selectedSheetItemIndices[0] ?? state.selectedSheetItemIdx;
    const sel = state.sheetItems[selIdx];
    if (sel && sel.photoIdx !== undefined) state.activePhotoIdx = sel.photoIdx;
    switchTab('crop');
  });

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    const isTyping = activeTag === 'input' || activeTag === 'textarea';

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
      if (state.activeTab === 'sheet' && !isTyping) {
        e.preventDefault();
        selectAllSheetItems();
      }
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      duplicateSelectedSheetItems();
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      if (state.activeTab === 'sheet' && !isTyping) {
        e.preventDefault();
        deleteSelectedSheetItems();
      }
    } else if (e.key === 'Escape') {
      if (state.activeTab === 'sheet') {
        clearSheetSelection();
      }
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      handleDirectPrint();
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) performRedo();
      else performUndo();
    }
  });

  // Sheet Zoom
  document.getElementById('btnSheetZoomFit').addEventListener('click', () => {
    state.sheetZoomMode = 'fit';
    document.getElementById('sheetZoomLabel').textContent = 'Fit';
    renderSheet();
  });

  document.getElementById('btnSheetZoom100').addEventListener('click', () => {
    state.sheetZoomMode = '100';
    state.sheetZoomScale = 1.0;
    document.getElementById('sheetZoomLabel').textContent = '100%';
    renderSheet();
  });

  document.getElementById('btnSheetZoomIn').addEventListener('click', () => {
    state.sheetZoomMode = 'custom';
    state.sheetZoomScale = Math.min(2.5, state.sheetZoomScale + 0.15);
    document.getElementById('sheetZoomLabel').textContent = `${Math.round(state.sheetZoomScale * 100)}%`;
    renderSheet();
  });

  document.getElementById('btnSheetZoomOut').addEventListener('click', () => {
    state.sheetZoomMode = 'custom';
    state.sheetZoomScale = Math.max(0.3, state.sheetZoomScale - 0.15);
    document.getElementById('sheetZoomLabel').textContent = `${Math.round(state.sheetZoomScale * 100)}%`;
    renderSheet();
  });

  // Export & Print Actions
  const btnPrint = document.getElementById('btnPrint');
  if (btnPrint) btnPrint.addEventListener('click', handleDirectPrint);
  const btnDirectSub = document.getElementById('btnDirectPrintSheetSubbar');
  if (btnDirectSub) btnDirectSub.addEventListener('click', handleDirectPrint);
  const btnQuickPrint = document.getElementById('btnQuickPrintMenu');
  if (btnQuickPrint) btnQuickPrint.addEventListener('click', handleQuickPrint);
  const btnExpSingle = document.getElementById('btnExportSingle');
  if (btnExpSingle) btnExpSingle.addEventListener('click', handleExportSingle);
  const btnExpSheet = document.getElementById('btnExportSheetImg');
  if (btnExpSheet) btnExpSheet.addEventListener('click', handleExportSheetImage);
  const btnExpPDF = document.getElementById('btnExportPDF');
  if (btnExpPDF) btnExpPDF.addEventListener('click', handleExportPDF);
}

function setupAdjustmentSlider(sliderId, labelId, property, formatFn) {
  const el = document.getElementById(sliderId);
  el.addEventListener('input', (e) => {
    const photo = getActivePhoto();
    if (!photo) return;
    photo[property] = parseFloat(e.target.value);
    document.getElementById(labelId).textContent = formatFn(photo[property]);
    renderCrop();
    renderSheet();
  });
}

function resetPhotoAdjustments(photo) {
  photo.zoom = 1.0;
  photo.panX = 0;
  photo.panY = 0;
  photo.rotation = 0;
  photo.tilt = 0;
  photo.flipH = false;
  photo.flipV = false;
  photo.brightness = 0;
  photo.contrast = 0;
  photo.exposure = 0.0;
  photo.saturation = 100;
  photo.warmth = 0;
  photo.sharpness = 20;
  photo.skinSmoothing = 0;
  photo.grayscale = false;
  photo.bgMode = 'original';
  photo.borderStyle = 'thinGray';
}

function applyFilterPreset(presetName) {
  const photo = getActivePhoto();
  if (!photo) return;
  saveSnapshot();

  switch (presetName) {
    case 'normal':
      photo.brightness = 0; photo.contrast = 0; photo.exposure = 0; photo.saturation = 100; photo.warmth = 0; photo.sharpness = 20; photo.grayscale = false;
      break;
    case 'studio':
      photo.brightness = 10; photo.contrast = 15; photo.exposure = 0.2; photo.saturation = 105; photo.warmth = 5; photo.sharpness = 40; photo.skinSmoothing = 30; photo.grayscale = false;
      break;
    case 'warm':
      photo.brightness = 5; photo.contrast = 10; photo.exposure = 0.1; photo.saturation = 110; photo.warmth = 25; photo.sharpness = 25; photo.grayscale = false;
      break;
    case 'crisp':
      photo.brightness = 5; photo.contrast = 25; photo.exposure = 0; photo.saturation = 100; photo.warmth = 0; photo.sharpness = 70; photo.grayscale = false;
      break;
    case 'bw':
      photo.brightness = 10; photo.contrast = 20; photo.exposure = 0.1; photo.saturation = 0; photo.sharpness = 35; photo.grayscale = true;
      break;
  }

  syncPhotoControls(photo);
  renderCrop();
  renderSheet();
}

// MARK: - Freeform Drag & Drop on A4 Sheet
function rebuildSheetGrid(count, arrangement = state.arrangement) {
  const paperMM = getPaperDimensionsMM();
  const photoMM = getPassportDimensionsMM();
  const slots = calculateGridSlots(paperMM.w, paperMM.h, photoMM.w, photoMM.h, count, arrangement);

  state.sheetItems = slots.map((s, idx) => ({
    id: Date.now() + idx,
    photoIdx: idx % Math.max(1, state.photos.length),
    xMM: s.x,
    yMM: s.y,
    wMM: s.w,
    hMM: s.h
  }));

  state.selectedSheetItemIndices = state.sheetItems.length > 0 ? [0] : [];
  state.selectedSheetItemIdx = state.sheetItems.length > 0 ? 0 : -1;
  renderSheet();
  updateFloatingMenu();
  updateSelectionUI();
}

function calculateGridSlots(paperW_MM, paperH_MM, photoW_MM, photoH_MM, targetCount, arrangement) {
  let target = targetCount === 'max' ? 30 : parseInt(targetCount, 10);
  if (isNaN(target) || target < 1) target = 5;

  const minGap = 2.0;
  const minSideMargin = 4.0;
  // Compute absolute maximum columns that can physically fit on the paper width
  const maxColsPossible = Math.max(1, Math.floor((paperW_MM - (minSideMargin * 2) + minGap) / (photoW_MM + minGap)));

  // 0. FULL PAGE PRESET (Single photo filling the full A4/Paper sheet)
  if (arrangement === 'fullPage') {
    const mode = state.fullPageMode || 'fit';
    const margin = (mode === 'borderless') ? 0 : Math.max(0, state.marginMM !== undefined ? state.marginMM : 10);
    const availW = paperW_MM - (margin * 2);
    const availH = paperH_MM - (margin * 2);

    if (mode === 'fit') {
      const photo = getActivePhoto();
      const img = photo ? photo.img : null;
      let imgW = photoW_MM;
      let imgH = photoH_MM;
      if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
        imgW = img.naturalWidth;
        imgH = img.naturalHeight;
      }
      const aspect = Math.max(0.1, imgW / imgH);

      let targetW = availW;
      let targetH = targetW / aspect;
      if (targetH > availH) {
        targetH = availH;
        targetW = targetH * aspect;
      }
      const x = margin + ((availW - targetW) / 2);
      const y = margin + ((availH - targetH) / 2);
      return [{
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        w: Math.round(targetW * 10) / 10,
        h: Math.round(targetH * 10) / 10
      }];
    } else {
      return [{
        x: Math.round(margin * 10) / 10,
        y: Math.round(margin * 10) / 10,
        w: Math.round(availW * 10) / 10,
        h: Math.round(availH * 10) / 10
      }];
    }
  }

  // 1. SINGLE ROW STRIP PRESET (e.g. 5 Photos in one row across top of A4)
  if (arrangement === 'singleRow') {
    // If target fits across paper width (5 photos of 35mm on A4 210mm fits perfectly with 5mm gaps and 7.5mm margins!)
    const cols = Math.min(target, maxColsPossible);
    const rows = Math.max(1, Math.ceil(target / cols));

    const remainingW = paperW_MM - (cols * photoW_MM);
    const numGaps = Math.max(1, cols - 1);
    let gapX = 5.0; // Standard 5mm gap between photos
    if (numGaps * gapX > remainingW - (minSideMargin * 2)) {
      gapX = Math.max(minGap, (remainingW - (minSideMargin * 2)) / numGaps);
    }
    const totalGapsW = numGaps * gapX;
    const sideMargin = Math.round(((remainingW - totalGapsW) / 2) * 100) / 100;

    const gapY = 5.0;
    const startY = state.alignment === 'centered'
      ? Math.max(10, (paperH_MM - ((rows * photoH_MM) + ((rows - 1) * gapY))) / 2)
      : Math.max(6, state.marginMM || 10);

    const slots = [];
    let count = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (count >= target) break;
        const x = sideMargin + (c * (photoW_MM + gapX));
        const y = startY + (r * (photoH_MM + gapY));
        slots.push({
          x: Math.round(x * 100) / 100,
          y: Math.round(y * 100) / 100,
          w: photoW_MM,
          h: photoH_MM
        });
        count++;
      }
    }
    return slots;
  }

  // 2. BALANCED GRID PRESET (e.g. 5 Photos in 3+2 Centered Pyramid)
  if (arrangement === 'balanced') {
    if (target === 5) {
      // Row 1: 3 photos centered horizontally
      // Row 2: 2 photos centered horizontally directly below Row 1
      const gapX = 5.0;
      const gapY = 5.0;
      const row1W = (3 * photoW_MM) + (2 * gapX);
      const row2W = (2 * photoW_MM) + (1 * gapX);
      const totalH = (2 * photoH_MM) + gapY;

      const startY = state.alignment === 'topCenter' ? Math.max(6, state.marginMM || 10) : Math.max(10, (paperH_MM - totalH) / 2);
      const startX1 = (paperW_MM - row1W) / 2;
      const startX2 = (paperW_MM - row2W) / 2;

      const slots = [];
      // Row 1 (3 photos)
      for (let c = 0; c < 3; c++) {
        slots.push({
          x: Math.round((startX1 + c * (photoW_MM + gapX)) * 100) / 100,
          y: Math.round(startY * 100) / 100,
          w: photoW_MM,
          h: photoH_MM
        });
      }
      // Row 2 (2 photos centered directly under the 3 above)
      for (let c = 0; c < 2; c++) {
        slots.push({
          x: Math.round((startX2 + c * (photoW_MM + gapX)) * 100) / 100,
          y: Math.round((startY + photoH_MM + gapY) * 100) / 100,
          w: photoW_MM,
          h: photoH_MM
        });
      }
      return slots;
    }

    // Other counts in balanced mode
    let cols = 1;
    let rows = 1;
    if (target <= 2) {
      cols = target; rows = 1;
    } else if (target <= 4) {
      cols = 2; rows = 2;
    } else if (target <= 6) {
      cols = 3; rows = 2;
    } else if (target <= 8) {
      cols = 4; rows = 2;
    } else {
      cols = Math.min(target, maxColsPossible);
      rows = Math.ceil(target / cols);
    }

    const gapX = 5.0;
    const gapY = 5.0;
    const gridW = (cols * photoW_MM) + ((cols - 1) * gapX);
    const gridH = (rows * photoH_MM) + ((rows - 1) * gapY);

    const startX = Math.max(minSideMargin, (paperW_MM - gridW) / 2);
    const startY = state.alignment === 'topCenter' ? Math.max(6, state.marginMM || 10) : Math.max(10, (paperH_MM - gridH) / 2);

    const slots = [];
    let count = 0;
    for (let r = 0; r < rows; r++) {
      const remainingItems = target - count;
      const itemsInThisRow = Math.min(cols, remainingItems);
      // Center incomplete last row
      const thisRowW = (itemsInThisRow * photoW_MM) + ((itemsInThisRow - 1) * gapX);
      const thisRowStartX = (paperW_MM - thisRowW) / 2;

      for (let c = 0; c < itemsInThisRow; c++) {
        const x = thisRowStartX + (c * (photoW_MM + gapX));
        const y = startY + (r * (photoH_MM + gapY));
        slots.push({
          x: Math.round(x * 100) / 100,
          y: Math.round(y * 100) / 100,
          w: photoW_MM,
          h: photoH_MM
        });
        count++;
      }
    }
    return slots;
  }

  // 3. CUSTOM GRID PRESET (user specified cols & rows)
  const cols = Math.min(state.customCols || 5, maxColsPossible);
  const rows = Math.max(1, state.customRows || 1);
  const gapX = 5.0;
  const gapY = 5.0;
  const gridW = (cols * photoW_MM) + ((cols - 1) * gapX);
  const gridH = (rows * photoH_MM) + ((rows - 1) * gapY);
  const startX = Math.max(minSideMargin, (paperW_MM - gridW) / 2);
  const startY = state.alignment === 'topCenter' ? Math.max(6, state.marginMM || 10) : Math.max(10, (paperH_MM - gridH) / 2);

  const slots = [];
  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (count >= target) break;
      const x = startX + (c * (photoW_MM + gapX));
      const y = startY + (r * (photoH_MM + gapY));
      slots.push({
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        w: photoW_MM,
        h: photoH_MM
      });
      count++;
    }
  }
  return slots;
}

function getSheetItemHandleAt(item, mouseX, mouseY) {
  if (!item) return null;
  const pointsPerMM = 72 / 25.4;
  const displayScale = getEffectiveSheetScale();

  const xPx = item.xMM * pointsPerMM * displayScale;
  const yPx = item.yMM * pointsPerMM * displayScale;
  const wPx = item.wMM * pointsPerMM * displayScale;
  const hPx = item.hMM * pointsPerMM * displayScale;

  const hitRadius = 8; // 8px grabbing radius
  const handles = [
    { name: 'tl', x: xPx, y: yPx },
    { name: 't',  x: xPx + wPx / 2, y: yPx },
    { name: 'tr', x: xPx + wPx, y: yPx },
    { name: 'r',  x: xPx + wPx, y: yPx + hPx / 2 },
    { name: 'br', x: xPx + wPx, y: yPx + hPx },
    { name: 'b',  x: xPx + wPx / 2, y: yPx + hPx },
    { name: 'bl', x: xPx, y: yPx + hPx },
    { name: 'l',  x: xPx, y: yPx + hPx / 2 }
  ];

  for (let i = 0; i < handles.length; i++) {
    const h = handles[i];
    const dx = mouseX - h.x;
    const dy = mouseY - h.y;
    if (Math.sqrt(dx * dx + dy * dy) <= hitRadius) {
      return h.name;
    }
  }
  return null;
}

function getCursorForHandle(handleName) {
  switch (handleName) {
    case 'tl':
    case 'br':
      return 'nwse-resize';
    case 'tr':
    case 'bl':
      return 'nesw-resize';
    case 't':
    case 'b':
      return 'ns-resize';
    case 'l':
    case 'r':
      return 'ew-resize';
    default:
      return 'default';
  }
}

function handleSheetCanvasMouseDown(e) {
  const canvas = document.getElementById('sheetCanvas');
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const pointsPerMM = 72 / 25.4;
  const displayScale = getEffectiveSheetScale();

  // 1. Check if clicked on a resize handle of the currently selected item
  if (state.selectedSheetItemIdx >= 0 && state.sheetItems[state.selectedSheetItemIdx]) {
    const selItem = state.sheetItems[state.selectedSheetItemIdx];
    const hitHandle = getSheetItemHandleAt(selItem, mouseX, mouseY);
    if (hitHandle) {
      state.isResizingSheetItem = true;
      state.resizeHandle = hitHandle;
      state.resizeStartMouseX = e.clientX;
      state.resizeStartMouseY = e.clientY;
      state.resizeStartItem = {
        xMM: selItem.xMM,
        yMM: selItem.yMM,
        wMM: selItem.wMM,
        hMM: selItem.hMM,
        aspect: selItem.wMM / selItem.hMM
      };
      renderSheet();
      updateFloatingMenu();
      syncSelectedPhotoInputs();
      return;
    }
  }

  // Check which sheet item was clicked (iterate in reverse so top items are checked first)
  let found = -1;
  for (let i = state.sheetItems.length - 1; i >= 0; i--) {
    const item = state.sheetItems[i];
    const itemX = item.xMM * pointsPerMM * displayScale;
    const itemY = item.yMM * pointsPerMM * displayScale;
    const itemW = item.wMM * pointsPerMM * displayScale;
    const itemH = item.hMM * pointsPerMM * displayScale;

    if (mouseX >= itemX && mouseX <= itemX + itemW && mouseY >= itemY && mouseY <= itemY + itemH) {
      found = i;
      break;
    }
  }

  const isMultiKey = e.shiftKey || e.metaKey || e.ctrlKey;

  if (found !== -1) {
    if (isMultiKey) {
      // Toggle selection of this item
      if (state.selectedSheetItemIndices.includes(found)) {
        state.selectedSheetItemIndices = state.selectedSheetItemIndices.filter(i => i !== found);
        state.selectedSheetItemIdx = state.selectedSheetItemIndices[0] ?? -1;
      } else {
        state.selectedSheetItemIndices.push(found);
        state.selectedSheetItemIdx = found;
      }
    } else {
      // If clicked item is already in selection, keep multi-selection so user can drag all together
      if (!state.selectedSheetItemIndices.includes(found)) {
        state.selectedSheetItemIndices = [found];
        state.selectedSheetItemIdx = found;
      }
    }

    state.isDraggingSheetItem = true;
    state.dragSheetStartMouseX = e.clientX;
    state.dragSheetStartMouseY = e.clientY;
    state.hasMovedDuringDrag = false;

    // Record initial positions of all currently selected items for group move
    state.dragInitialPositions = state.selectedSheetItemIndices.map(idx => {
      const it = state.sheetItems[idx];
      return {
        idx: idx,
        xMM: it.xMM,
        yMM: it.yMM,
        wMM: it.wMM,
        hMM: it.hMM
      };
    });

    const sel = state.sheetItems[found];
    if (sel && sel.photoIdx !== undefined) state.activePhotoIdx = sel.photoIdx;

    renderSheet();
    updateFloatingMenu();
    updateSelectionUI();
    syncSelectedPhotoInputs();
  } else {
    // Clicked on empty canvas space
    if (!isMultiKey) {
      state.selectedSheetItemIndices = [];
      state.selectedSheetItemIdx = -1;
    }

    // Start marquee rubber-band selection
    state.isMarqueeSelecting = true;
    state.marqueeStartPtX = mouseX;
    state.marqueeStartPtY = mouseY;
    state.marqueeCurrentPtX = mouseX;
    state.marqueeCurrentPtY = mouseY;

    renderSheet();
    updateFloatingMenu();
    updateSelectionUI();
    syncSelectedPhotoInputs();
  }
}

function handleSheetItemDragMove(e) {
  const displayScale = getEffectiveSheetScale();
  const pointsPerMM = 72 / 25.4;
  const pixelsPerMM = pointsPerMM * displayScale;

  if (state.isResizingSheetItem && state.resizeStartItem) {
    let deltaX_MM = (e.clientX - state.resizeStartMouseX) / pixelsPerMM;
    let deltaY_MM = (e.clientY - state.resizeStartMouseY) / pixelsPerMM;

    const paperMM = getPaperDimensionsMM();
    const start = state.resizeStartItem;
    const item = state.sheetItems[state.selectedSheetItemIdx];
    if (!item) return;

    const lockAspect = state.lockSheetItemAspect ? !e.altKey : (e.shiftKey);
    const aspect = start.aspect || (start.wMM / start.hMM);

    let newX = start.xMM;
    let newY = start.yMM;
    let newW = start.wMM;
    let newH = start.hMM;

    const handle = state.resizeHandle;

    if (handle === 'br') {
      newW = Math.max(10, start.wMM + deltaX_MM);
      if (lockAspect) {
        newH = newW / aspect;
      } else {
        newH = Math.max(10, start.hMM + deltaY_MM);
      }
    } else if (handle === 'r') {
      newW = Math.max(10, start.wMM + deltaX_MM);
      if (lockAspect) {
        const diffH = (newW / aspect) - start.hMM;
        newH = newW / aspect;
        newY = start.yMM - (diffH / 2);
      }
    } else if (handle === 'b') {
      newH = Math.max(10, start.hMM + deltaY_MM);
      if (lockAspect) {
        const diffW = (newH * aspect) - start.wMM;
        newW = newH * aspect;
        newX = start.xMM - (diffW / 2);
      }
    } else if (handle === 'bl') {
      newW = Math.max(10, start.wMM - deltaX_MM);
      newX = start.xMM + (start.wMM - newW);
      if (lockAspect) {
        newH = newW / aspect;
      } else {
        newH = Math.max(10, start.hMM + deltaY_MM);
      }
    } else if (handle === 'tr') {
      newW = Math.max(10, start.wMM + deltaX_MM);
      if (lockAspect) {
        newH = newW / aspect;
        newY = start.yMM + (start.hMM - newH);
      } else {
        newH = Math.max(10, start.hMM - deltaY_MM);
        newY = start.yMM + (start.hMM - newH);
      }
    } else if (handle === 'tl') {
      newW = Math.max(10, start.wMM - deltaX_MM);
      newX = start.xMM + (start.wMM - newW);
      if (lockAspect) {
        newH = newW / aspect;
        newY = start.yMM + (start.hMM - newH);
      } else {
        newH = Math.max(10, start.hMM - deltaY_MM);
        newY = start.yMM + (start.hMM - newH);
      }
    } else if (handle === 't') {
      newH = Math.max(10, start.hMM - deltaY_MM);
      newY = start.yMM + (start.hMM - newH);
      if (lockAspect) {
        const diffW = (newH * aspect) - start.wMM;
        newW = newH * aspect;
        newX = start.xMM - (diffW / 2);
      }
    } else if (handle === 'l') {
      newW = Math.max(10, start.wMM - deltaX_MM);
      newX = start.xMM + (start.wMM - newW);
      if (lockAspect) {
        const diffH = (newW / aspect) - start.hMM;
        newH = newW / aspect;
        newY = start.yMM - (diffH / 2);
      }
    }

    // Keep within paper boundaries
    newW = Math.min(newW, paperMM.w);
    newH = Math.min(newH, paperMM.h);
    newX = Math.max(0, Math.min(paperMM.w - newW, newX));
    newY = Math.max(0, Math.min(paperMM.h - newH, newY));

    item.xMM = Math.round(newX * 10) / 10;
    item.yMM = Math.round(newY * 10) / 10;
    item.wMM = Math.round(newW * 10) / 10;
    item.hMM = Math.round(newH * 10) / 10;

    renderSheet();
    updateFloatingMenu();
    syncSelectedPhotoInputs();
    return;
  }

  if (state.isDraggingSheetItem && state.dragInitialPositions.length > 0) {
    state.hasMovedDuringDrag = true;

    let deltaX_MM = (e.clientX - state.dragSheetStartMouseX) / pixelsPerMM;
    let deltaY_MM = (e.clientY - state.dragSheetStartMouseY) / pixelsPerMM;

    if (state.snapToGrid) {
      deltaX_MM = Math.round(deltaX_MM / 5) * 5;
      deltaY_MM = Math.round(deltaY_MM / 5) * 5;
    }

    // Constrain so no selected item goes outside paper boundaries
    const paperMM = getPaperDimensionsMM();
    let minAllowedDeltaX = -Infinity;
    let maxAllowedDeltaX = Infinity;
    let minAllowedDeltaY = -Infinity;
    let maxAllowedDeltaY = Infinity;

    state.dragInitialPositions.forEach(p => {
      minAllowedDeltaX = Math.max(minAllowedDeltaX, -p.xMM);
      maxAllowedDeltaX = Math.min(maxAllowedDeltaX, paperMM.w - p.wMM - p.xMM);
      minAllowedDeltaY = Math.max(minAllowedDeltaY, -p.yMM);
      maxAllowedDeltaY = Math.min(maxAllowedDeltaY, paperMM.h - p.hMM - p.yMM);
    });

    const clampedDeltaX = Math.max(minAllowedDeltaX, Math.min(maxAllowedDeltaX, deltaX_MM));
    const clampedDeltaY = Math.max(minAllowedDeltaY, Math.min(maxAllowedDeltaY, deltaY_MM));

    state.dragInitialPositions.forEach(p => {
      const it = state.sheetItems[p.idx];
      if (it) {
        it.xMM = Math.max(0, Math.min(paperMM.w - it.wMM, p.xMM + clampedDeltaX));
        it.yMM = Math.max(0, Math.min(paperMM.h - it.hMM, p.yMM + clampedDeltaY));
      }
    });

    renderSheet();
    updateFloatingMenu();
  } else if (state.isMarqueeSelecting) {
    const canvas = document.getElementById('sheetCanvas');
    const rect = canvas.getBoundingClientRect();
    state.marqueeCurrentPtX = e.clientX - rect.left;
    state.marqueeCurrentPtY = e.clientY - rect.top;

    // Compute marquee box in mm
    const leftPx = Math.min(state.marqueeStartPtX, state.marqueeCurrentPtX);
    const rightPx = Math.max(state.marqueeStartPtX, state.marqueeCurrentPtX);
    const topPx = Math.min(state.marqueeStartPtY, state.marqueeCurrentPtY);
    const bottomPx = Math.max(state.marqueeStartPtY, state.marqueeCurrentPtY);

    const leftMM = leftPx / (pointsPerMM * displayScale);
    const rightMM = rightPx / (pointsPerMM * displayScale);
    const topMM = topPx / (pointsPerMM * displayScale);
    const bottomMM = bottomPx / (pointsPerMM * displayScale);

    // Select all sheet items that intersect the marquee
    const matched = [];
    state.sheetItems.forEach((item, idx) => {
      const itemRight = item.xMM + item.wMM;
      const itemBottom = item.yMM + item.hMM;
      const overlaps = (item.xMM <= rightMM && itemRight >= leftMM && item.yMM <= bottomMM && itemBottom >= topMM);
      if (overlaps) matched.push(idx);
    });

    state.selectedSheetItemIndices = matched;
    state.selectedSheetItemIdx = matched[0] ?? -1;

    renderSheet();
    updateFloatingMenu();
    updateSelectionUI();
  }
}

// Select All items on sheet
function selectAllSheetItems() {
  state.selectedSheetItemIndices = state.sheetItems.map((_, i) => i);
  state.selectedSheetItemIdx = state.sheetItems.length > 0 ? 0 : -1;
  renderSheet();
  updateFloatingMenu();
  updateSelectionUI();
}

// Clear sheet selection
function clearSheetSelection() {
  state.selectedSheetItemIndices = [];
  state.selectedSheetItemIdx = -1;
  renderSheet();
  updateFloatingMenu();
  updateSelectionUI();
}

function updateFloatingMenu() {
  const menu = document.getElementById('sheetFloatingMenu');
  if (!menu) return;
  if (!state.selectedSheetItemIndices || state.selectedSheetItemIndices.length === 0 || state.activeTab !== 'sheet') {
    menu.style.display = 'none';
    return;
  }

  const selectedItems = state.selectedSheetItemIndices.map(i => state.sheetItems[i]).filter(Boolean);
  if (selectedItems.length === 0) {
    menu.style.display = 'none';
    return;
  }

  const pointsPerMM = 72 / 25.4;
  const displayScale = getEffectiveSheetScale();

  let minX = Infinity, maxX = -Infinity, minY = Infinity;
  selectedItems.forEach(item => {
    minX = Math.min(minX, item.xMM);
    maxX = Math.max(maxX, item.xMM + item.wMM);
    minY = Math.min(minY, item.yMM);
  });

  const centerX_Pt = ((minX + maxX) / 2) * pointsPerMM * displayScale;
  const topY_Pt = minY * pointsPerMM * displayScale;

  menu.style.display = 'flex';
  menu.style.left = `${centerX_Pt}px`;
  menu.style.top = `${topY_Pt}px`;

  const floatDim = document.getElementById('floatDimensionBadge');
  if (floatDim) {
    if (selectedItems.length === 1) {
      floatDim.style.display = 'inline-flex';
      floatDim.textContent = `${Math.round(selectedItems[0].wMM)} × ${Math.round(selectedItems[0].hMM)} mm`;
    } else {
      floatDim.style.display = 'inline-flex';
      floatDim.textContent = `${selectedItems.length} Selected`;
    }
  }

  const btnFloatCopy = document.getElementById('btnFloatCopy');
  if (btnFloatCopy) {
    btnFloatCopy.innerHTML = selectedItems.length > 1 ? `⧉ Copy (${selectedItems.length})` : `⧉ Copy (⌘D)`;
  }

  const btnFloatDel = document.getElementById('btnFloatDelete');
  if (btnFloatDel) {
    btnFloatDel.innerHTML = selectedItems.length > 1 ? `✕ (${selectedItems.length})` : `✕`;
  }
}

function updateSelectionUI() {
  const count = state.selectedSheetItemIndices ? state.selectedSheetItemIndices.length : 0;
  const total = state.sheetItems.length;

  const lblDup = document.getElementById('lblDuplicateBtnText');
  if (lblDup) {
    if (count === 0) {
      lblDup.textContent = '⧉ Make Copy (⌘D)';
    } else if (count === 1) {
      lblDup.textContent = '⧉ Make Copy (⌘D)';
    } else if (count === total) {
      lblDup.textContent = `⧉ Copy All (${total}) (⌘D)`;
    } else {
      lblDup.textContent = `⧉ Copy (${count}) (⌘D)`;
    }
  }

  const slotBadge = document.getElementById('sheetSlotBadge');
  if (slotBadge) {
    if (count > 1) {
      slotBadge.textContent = `${count} of ${total} Selected`;
    } else {
      slotBadge.textContent = `${total} Photos`;
    }
  }

  const delBtn = document.getElementById('btnDeleteSheetItem');
  if (delBtn) {
    delBtn.style.display = count > 0 ? 'inline-flex' : 'none';
    delBtn.textContent = count > 1 ? `✕ Delete (${count})` : '✕ Delete';
  }

  syncSelectedPhotoInputs();
}

// MARK: - Selected Photo Freeform Resizing & Full A4 Helpers
function syncSelectedPhotoInputs() {
  const item = state.sheetItems[state.selectedSheetItemIdx];
  const lblName = document.getElementById('lblSelectedPhotoItemName');
  const inputW = document.getElementById('numSelectedPhotoW');
  const inputH = document.getElementById('numSelectedPhotoH');
  const chkAspect = document.getElementById('chkLockAspectResize');
  const floatDim = document.getElementById('floatDimensionBadge');

  if (!item) {
    if (lblName) lblName.textContent = 'No Photo Selected';
    if (inputW) inputW.value = 35;
    if (inputH) inputH.value = 45;
    return;
  }

  const count = state.selectedSheetItemIndices.length;
  if (lblName) {
    if (count > 1) {
      lblName.textContent = `${count} Photos Selected`;
    } else {
      lblName.textContent = `Photo #${state.selectedSheetItemIdx + 1} (${item.wMM.toFixed(1)} × ${item.hMM.toFixed(1)} mm)`;
    }
  }

  if (inputW) inputW.value = Math.round(item.wMM * 10) / 10;
  if (inputH) inputH.value = Math.round(item.hMM * 10) / 10;
  if (chkAspect) chkAspect.checked = state.lockSheetItemAspect;
  if (floatDim) floatDim.textContent = `${Math.round(item.wMM)} × ${Math.round(item.hMM)} mm`;
}

function resizeSelectedPhoto(wMM, hMM) {
  if (state.selectedSheetItemIdx < 0 || !state.sheetItems[state.selectedSheetItemIdx]) return;
  const paperMM = getPaperDimensionsMM();
  const selectedIndices = state.selectedSheetItemIndices.length > 0 ? state.selectedSheetItemIndices : [state.selectedSheetItemIdx];

  selectedIndices.forEach(idx => {
    const item = state.sheetItems[idx];
    if (!item) return;

    item.wMM = Math.max(10, Math.min(paperMM.w, Math.round(wMM * 10) / 10));
    item.hMM = Math.max(10, Math.min(paperMM.h, Math.round(hMM * 10) / 10));

    // Keep within paper
    item.xMM = Math.max(0, Math.min(paperMM.w - item.wMM, item.xMM));
    item.yMM = Math.max(0, Math.min(paperMM.h - item.hMM, item.yMM));
  });

  renderSheet();
  updateFloatingMenu();
  syncSelectedPhotoInputs();
}

function resetSelectedPhotoSize() {
  const std = getPassportDimensionsMM();
  resizeSelectedPhoto(std.w, std.h);
}

function makeSelectedPhotoFullA4(mode = 'fit') {
  if (state.selectedSheetItemIdx < 0 || !state.sheetItems[state.selectedSheetItemIdx]) {
    if (state.sheetItems.length > 0) {
      state.selectedSheetItemIdx = 0;
      state.selectedSheetItemIndices = [0];
    } else {
      return;
    }
  }

  const paperMM = getPaperDimensionsMM();
  const selectedIndices = state.selectedSheetItemIndices.length > 0 ? state.selectedSheetItemIndices : [state.selectedSheetItemIdx];

  selectedIndices.forEach(idx => {
    const item = state.sheetItems[idx];
    if (!item) return;

    if (mode === 'borderless') {
      item.xMM = 0;
      item.yMM = 0;
      item.wMM = paperMM.w;
      item.hMM = paperMM.h;
    } else if (mode === 'margins') {
      const margin = Math.max(0, state.marginMM !== undefined ? state.marginMM : 10);
      item.xMM = margin;
      item.yMM = margin;
      item.wMM = Math.round((paperMM.w - margin * 2) * 10) / 10;
      item.hMM = Math.round((paperMM.h - margin * 2) * 10) / 10;
    } else { // 'fit' (proportional, preserves photo aspect ratio without clipping)
      const photo = state.photos[item.photoIdx] || state.photos[0];
      const img = photo?.img;
      const imgW = img?.naturalWidth || item.wMM || 35;
      const imgH = img?.naturalHeight || item.hMM || 45;
      const photoAspect = Math.max(0.1, imgW / imgH);
      const margin = Math.max(0, state.marginMM !== undefined ? state.marginMM : 10);
      const availW = paperMM.w - (margin * 2);
      const availH = paperMM.h - (margin * 2);

      let targetW = availW;
      let targetH = targetW / photoAspect;
      if (targetH > availH) {
        targetH = availH;
        targetW = targetH * photoAspect;
      }
      item.wMM = Math.round(targetW * 10) / 10;
      item.hMM = Math.round(targetH * 10) / 10;
      item.xMM = Math.round((margin + (availW - item.wMM) / 2) * 10) / 10;
      item.yMM = Math.round((margin + (availH - item.hMM) / 2) * 10) / 10;
    }
  });

  renderSheet();
  updateFloatingMenu();
  syncSelectedPhotoInputs();
}

function applyQuickFullA4() {
  state.paperSize = 'a4';
  state.paperOrient = 'portrait';
  document.getElementById('selPaperSize').value = 'a4';
  document.querySelector('input[name="paperOrient"][value="portrait"]').checked = true;
  state.targetCount = 1;
  state.arrangement = 'fullPage';
  document.getElementById('selArrangement').value = 'fullPage';
  const fullPageRow = document.getElementById('fullPageOptionsRow');
  if (fullPageRow) fullPageRow.style.display = 'flex';
  updateCountChips();
  syncControls();
  rebuildSheetGrid(1, 'fullPage');
  switchTab('sheet');
}

function getEffectiveSheetScale() {
  const paperMM = getPaperDimensionsMM();
  const pointsPerMM = 72 / 25.4;
  const paperPointsW = paperMM.w * pointsPerMM;
  const paperPointsH = paperMM.h * pointsPerMM;

  const container = document.querySelector('.sheet-scroll-container');
  let availW = container && container.clientWidth > 100 ? container.clientWidth - 80 : (window.innerWidth - 560);
  let availH = container && container.clientHeight > 100 ? container.clientHeight - 80 : (window.innerHeight - 140);
  if (availW < 200) availW = 600;
  if (availH < 200) availH = 800;

  if (state.sheetZoomMode === 'fit') {
    const scale = Math.min(availW / paperPointsW, availH / paperPointsH);
    return Math.max(0.1, scale);
  }
  return Math.max(0.1, state.sheetZoomScale || 1.0);
}

// MARK: - Copy / Duplicate Features (Supports Multi-Selection & All Images Together!)
function duplicateSelectedSheetItems() {
  if (!state.selectedSheetItemIndices || state.selectedSheetItemIndices.length === 0) {
    if (state.sheetItems.length > 0) {
      selectAllSheetItems();
    } else {
      addPhotoCopyToSheet();
      return;
    }
  }

  const paperMM = getPaperDimensionsMM();
  const selectedItems = state.selectedSheetItemIndices.map(idx => state.sheetItems[idx]).filter(Boolean);
  if (selectedItems.length === 0) return;

  // Calculate bounding box of selection
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let maxW = 0, maxH = 0;

  selectedItems.forEach(item => {
    minX = Math.min(minX, item.xMM);
    maxX = Math.max(maxX, item.xMM + item.wMM);
    minY = Math.min(minY, item.yMM);
    maxY = Math.max(maxY, item.yMM + item.hMM);
    maxW = Math.max(maxW, item.wMM);
    maxH = Math.max(maxH, item.hMM);
  });

  const groupW = maxX - minX;
  const groupH = maxY - minY;
  const gap = state.gapMM || 4;

  let deltaX = 0;
  let deltaY = 0;

  if (selectedItems.length === 1) {
    // Single item: try placing right next to it
    const single = selectedItems[0];
    if (single.xMM + single.wMM + gap + single.wMM <= paperMM.w - state.marginMM) {
      deltaX = single.wMM + gap;
      deltaY = 0;
    } else if (single.yMM + single.hMM + gap + single.hMM <= paperMM.h - state.marginMM) {
      deltaX = 0;
      deltaY = single.hMM + gap;
    } else {
      deltaX = 10;
      deltaY = 10;
    }
  } else {
    // Multiple items together:
    // If it fits as the next row down below the current selection
    if (maxY + groupH + gap <= paperMM.h - state.marginMM) {
      deltaX = 0;
      deltaY = groupH + gap;
    } else if (groupW <= maxW + 2 && maxX + groupW + gap <= paperMM.w - state.marginMM) {
      // Vertical strip: place as next column to the right
      deltaX = groupW + gap;
      deltaY = 0;
    } else {
      // Staggered offset
      deltaX = 8;
      deltaY = 8;
    }
  }

  // Create new duplicated items
  const newIndices = [];
  const startIdx = state.sheetItems.length;

  selectedItems.forEach((src, i) => {
    let newX = src.xMM + deltaX;
    let newY = src.yMM + deltaY;

    // Keep within paper bounds
    newX = Math.max(0, Math.min(paperMM.w - src.wMM, newX));
    newY = Math.max(0, Math.min(paperMM.h - src.hMM, newY));

    const newItem = {
      id: Date.now() + Math.random() + i,
      photoIdx: src.photoIdx,
      xMM: newX,
      yMM: newY,
      wMM: src.wMM,
      hMM: src.hMM
    };

    state.sheetItems.push(newItem);
    newIndices.push(startIdx + i);
  });

  // Select the newly created copies so user can immediately move or duplicate them again!
  state.selectedSheetItemIndices = newIndices;
  state.selectedSheetItemIdx = newIndices[0] ?? -1;

  renderSheet();
  updateFloatingMenu();
  updateSelectionUI();
}

// 1-Click to duplicate ALL photos currently on the sheet together
function copyAllSheetItems() {
  selectAllSheetItems();
  duplicateSelectedSheetItems();
}

function deleteSelectedSheetItems() {
  if (!state.selectedSheetItemIndices || state.selectedSheetItemIndices.length === 0) return;

  const toDelete = new Set(state.selectedSheetItemIndices);

  if (state.sheetItems.length <= toDelete.size) {
    // Keep at least 1 item
    state.sheetItems = [state.sheetItems[0]];
    state.selectedSheetItemIndices = [0];
    state.selectedSheetItemIdx = 0;
  } else {
    state.sheetItems = state.sheetItems.filter((_, idx) => !toDelete.has(idx));
    state.selectedSheetItemIndices = state.sheetItems.length > 0 ? [0] : [];
    state.selectedSheetItemIdx = state.sheetItems.length > 0 ? 0 : -1;
  }

  renderSheet();
  updateFloatingMenu();
  updateSelectionUI();
}

function duplicateSelectedSheetItem() {
  duplicateSelectedSheetItems();
}

function addPhotoCopyToSheet(photoIdx = state.activePhotoIdx) {
  const dim = getPassportDimensionsMM();
  const paperMM = getPaperDimensionsMM();

  // Place in a convenient vacant spot or top center
  let x = state.marginMM;
  let y = state.marginMM;

  if (state.sheetItems.length > 0) {
    const last = state.sheetItems[state.sheetItems.length - 1];
    x = last.xMM + last.wMM + state.gapMM;
    y = last.yMM;
    if (x + dim.w > paperMM.w - state.marginMM) {
      x = state.marginMM;
      y = last.yMM + last.hMM + state.gapMM;
    }
  }

  const newItem = {
    id: Date.now() + Math.random(),
    photoIdx: photoIdx,
    xMM: Math.min(paperMM.w - dim.w, x),
    yMM: Math.min(paperMM.h - dim.h, y),
    wMM: dim.w,
    hMM: dim.h
  };

  state.sheetItems.push(newItem);
  state.selectedSheetItemIdx = state.sheetItems.length - 1;
  renderSheet();
  updateFloatingMenu();
}

function duplicateCustomerPhoto(idx) {
  if (idx < 0 || idx >= state.photos.length) return;
  const src = state.photos[idx];

  const copy = {
    ...src,
    id: Date.now() + Math.random(),
    name: `${src.name} (Copy)`
  };

  state.photos.push(copy);
  state.activePhotoIdx = state.photos.length - 1;
  updatePhotoQueueUI();
  syncPhotoControls(copy);
  addPhotoCopyToSheet(state.activePhotoIdx);
  updateUI();
}

// MARK: - Customer Uploading & Drag/Drop
function triggerUploadDialog(e) {
  if (e) e.preventDefault();
  if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.nativeOpenFile) {
    window.webkit.messageHandlers.nativeOpenFile.postMessage({});
  } else {
    document.getElementById('fileInput').click();
  }
}

function setupDragAndDropUpload() {
  let dragCounter = 0;
  const overlay = document.getElementById('fullWindowDropOverlay');

  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    if (overlay) overlay.style.display = 'flex';
  });

  window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0 && overlay) {
      overlay.style.display = 'none';
      dragCounter = 0;
    }
  });

  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    if (overlay) overlay.style.display = 'none';
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFilesList(files);
    }
  });
}

function handleFileSelect(e) {
  const files = e.target.files;
  if (files && files.length > 0) handleFilesList(files);
}

function handleFilesList(files) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      let loaded = false;
      img.onload = () => {
        if (loaded) return;
        loaded = true;
        addCustomerPhotoItem(file.name.replace(/\.[^/.]+$/, ""), img);
      };
      img.src = event.target.result;
      if (img.complete && img.naturalWidth > 0) {
        if (!loaded) {
          loaded = true;
          addCustomerPhotoItem(file.name.replace(/\.[^/.]+$/, ""), img);
        }
      }
    };
    reader.readAsDataURL(file);
  }
}

function addCustomerPhotoItem(name, img, isSample = false) {
  // Check if current list only contains the placeholder sample portrait
  const isReplacingSample = !isSample && (state.photos.length === 1 && state.photos[0].isSample);

  const item = {
    id: Date.now() + Math.random(),
    name: name || `Customer Photo ${state.photos.length + 1}`,
    img: img,
    isSample: !!isSample,
    copies: 5,
    zoom: 1.0,
    panX: 0,
    panY: 0,
    rotation: 0,
    tilt: 0,
    flipH: false,
    flipV: false,
    brightness: 0,
    contrast: 0,
    exposure: 0.0,
    saturation: 100,
    warmth: 0,
    sharpness: 20,
    skinSmoothing: 0,
    grayscale: false,
    bgMode: 'original',
    customBgColor: '#FFFFFF',
    borderStyle: 'thinGray'
  };

  if (isReplacingSample) {
    // Replace the default sample placeholder with real customer photo
    state.photos = [item];
    state.activePhotoIdx = 0;
    // Update all sheet slots to show the customer photo
    state.sheetItems.forEach(si => {
      si.photoIdx = 0;
    });
  } else {
    state.photos.push(item);
    state.activePhotoIdx = state.photos.length - 1;

    if (state.sheetItems.length === 0) {
      rebuildSheetGrid(5);
    } else {
      // If all current sheet slots were pointing to sample photos, point them to this new customer photo
      const hasRealPhotoSlots = state.sheetItems.some(si => state.photos[si.photoIdx] && !state.photos[si.photoIdx].isSample);
      if (!hasRealPhotoSlots) {
        state.sheetItems.forEach(si => {
          si.photoIdx = state.activePhotoIdx;
        });
      } else {
        // Add a copy of the new photo to the sheet
        addPhotoCopyToSheet(state.activePhotoIdx);
      }
    }
  }

  updatePhotoQueueUI();
  syncPhotoControls(item);
  saveSnapshot();
  updateUI();

  // If this is a real customer upload (not the initial default placeholder),
  // automatically switch to Photo Editor so user can immediately view & edit their photo!
  if (!isSample) {
    switchTab('crop');
  }
}

function updatePhotoQueueUI() {
  const queue = document.getElementById('photoQueue');
  queue.innerHTML = '';
  document.getElementById('photoCountBadge').textContent = state.photos.length;

  state.photos.forEach((photo, idx) => {
    const card = document.createElement('div');
    card.className = `photo-card ${idx === state.activePhotoIdx ? 'active' : ''}`;

    const thumb = document.createElement('img');
    thumb.className = 'photo-thumb';
    thumb.src = photo.img.src;

    const info = document.createElement('div');
    info.className = 'photo-card-info';

    const name = document.createElement('div');
    name.className = 'photo-card-name';
    name.textContent = photo.name;

    const actions = document.createElement('div');
    actions.className = 'photo-card-actions';

    // ✏️ Edit Photo Button
    const btnEdit = document.createElement('button');
    btnEdit.className = 'btn-card-edit';
    btnEdit.innerHTML = `✏️ Edit`;
    btnEdit.title = 'Open this photo in Photo Editor';
    btnEdit.addEventListener('click', (e) => {
      e.stopPropagation();
      openPhotoEditor(idx);
    });

    // ⧉ Copy Button
    const btnCopy = document.createElement('button');
    btnCopy.className = 'btn-card-edit';
    btnCopy.innerHTML = `⧉ Copy`;
    btnCopy.title = 'Make a duplicate copy of this customer photo';
    btnCopy.addEventListener('click', (e) => {
      e.stopPropagation();
      duplicateCustomerPhoto(idx);
    });

    // ➕ Add to Page
    const btnAdd = document.createElement('button');
    btnAdd.className = 'btn-card-edit';
    btnAdd.innerHTML = `➕ Page`;
    btnAdd.title = 'Add copy onto A4 sheet';
    btnAdd.addEventListener('click', (e) => {
      e.stopPropagation();
      addPhotoCopyToSheet(idx);
    });

    const btnDelete = document.createElement('button');
    btnDelete.className = 'btn-card-delete';
    btnDelete.innerHTML = `✕`;
    btnDelete.title = 'Remove Customer Photo';
    btnDelete.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.photos.length > 1) {
        state.photos.splice(idx, 1);
        if (state.activePhotoIdx >= state.photos.length) state.activePhotoIdx = state.photos.length - 1;
        updatePhotoQueueUI();
        updateUI();
      }
    });

    actions.appendChild(btnEdit);
    actions.appendChild(btnCopy);
    actions.appendChild(btnAdd);
    actions.appendChild(btnDelete);

    info.appendChild(name);
    info.appendChild(actions);

    card.appendChild(thumb);
    card.appendChild(info);

    card.addEventListener('click', () => {
      state.activePhotoIdx = idx;
      updatePhotoQueueUI();
      syncPhotoControls(photo);
      updateUI();
    });

    card.addEventListener('dblclick', () => {
      openPhotoEditor(idx);
    });

    queue.appendChild(card);
  });
}

// MARK: - Camera Capture Modal (iMac FaceTime HD Camera)
function openCameraModal() {
  const modal = document.getElementById('cameraModal');
  const video = document.getElementById('cameraVideo');
  modal.style.display = 'flex';

  navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
    .then(stream => {
      state.cameraStream = stream;
      video.srcObject = stream;
    })
    .catch(err => {
      alert("Camera access was not permitted or camera is not available. Please upload a photo from your computer.");
      closeCameraModal();
    });
}

function closeCameraModal() {
  const modal = document.getElementById('cameraModal');
  modal.style.display = 'none';
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(track => track.stop());
    state.cameraStream = null;
  }
}

function snapCameraPhoto() {
  const video = document.getElementById('cameraVideo');
  if (!video) return;

  const snapCanvas = document.createElement('canvas');
  snapCanvas.width = video.videoWidth || 1280;
  snapCanvas.height = video.videoHeight || 720;
  const ctx = snapCanvas.getContext('2d');

  // Flip horizontally to match mirror preview
  ctx.translate(snapCanvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);

  const img = new Image();
  img.onload = () => {
    addCustomerPhotoItem(`Customer Shot ${state.photos.length + 1}`, img);
    closeCameraModal();
  };
  img.src = snapCanvas.toDataURL();
}

// MARK: - Tab & View Switching (Edit vs Sheet)
function switchTab(tab) {
  state.activeTab = tab;
  document.getElementById('tabCrop').classList.toggle('active', tab === 'crop');
  document.getElementById('tabSheet').classList.toggle('active', tab === 'sheet');

  document.getElementById('cropStudioView').classList.toggle('active', tab === 'crop');
  document.getElementById('sheetPreviewView').classList.toggle('active', tab === 'sheet');

  document.getElementById('inspectorPhotoEditor').style.display = tab === 'crop' ? 'flex' : 'none';
  document.getElementById('inspectorSheetLayout').style.display = tab === 'sheet' ? 'flex' : 'none';

  if (tab === 'crop') {
    const photo = getActivePhoto();
    if (photo) syncPhotoControls(photo);
    renderCrop();
    requestAnimationFrame(() => {
      renderCrop();
      setTimeout(renderCrop, 50);
    });
  } else {
    renderSheet();
    updateFloatingMenu();
    requestAnimationFrame(() => {
      renderSheet();
      updateFloatingMenu();
      setTimeout(renderSheet, 50);
    });
  }
}

function openPhotoEditor(photoIdx) {
  if (photoIdx >= 0 && photoIdx < state.photos.length) {
    state.activePhotoIdx = photoIdx;
    updatePhotoQueueUI();
  }
  switchTab('crop');
}

function updateCountChips() {
  document.querySelectorAll('.count-chip').forEach(chip => {
    const c = chip.getAttribute('data-count');
    const isAct = (c === 'max' && state.targetCount === 'max') || (parseInt(c, 10) === state.targetCount);
    chip.classList.toggle('active', isAct);
  });
  document.getElementById('lblTargetCount').textContent = state.targetCount === 'max' ? 'Fill Page' : `${state.targetCount} Photos`;
}

function syncControls() {
  document.getElementById('selPaperSize').value = state.paperSize;
  document.querySelector(`input[name="paperOrient"][value="${state.paperOrient}"]`).checked = true;
  if (document.getElementById('selPaperType')) {
    document.getElementById('selPaperType').value = state.paperType || 'glossy';
  }
  const qualityRadio = document.querySelector(`input[name="printQuality"][value="${state.printQuality || 'high'}"]`);
  if (qualityRadio) qualityRadio.checked = true;
  const lblBadge = document.getElementById('lblPrintQualityBadge');
  if (lblBadge) {
    lblBadge.textContent = (state.printQuality || 'high') === 'high' ? 'High (300+ DPI)' : 'Standard';
  }
  document.getElementById('selArrangement').value = state.arrangement;
  if (document.getElementById('selFullPageMode')) {
    document.getElementById('selFullPageMode').value = state.fullPageMode || 'fit';
  }
  const fullPageRow = document.getElementById('fullPageOptionsRow');
  if (fullPageRow) {
    fullPageRow.style.display = state.arrangement === 'fullPage' ? 'flex' : 'none';
  }
  document.getElementById('selAlignment').value = state.alignment;
  document.getElementById('sliderMargin').value = state.marginMM;
  document.getElementById('sliderGap').value = state.gapMM;
  document.getElementById('lblMarginVal').textContent = `${Math.round(state.marginMM)} mm`;
  document.getElementById('lblGapVal').textContent = `${state.gapMM.toFixed(1)} mm`;
  syncSelectedPhotoInputs();
  updateUI();
}

function syncPhotoControls(photo) {
  if (!photo) return;
  document.getElementById('cropPhotoNameLabel').textContent = `Editing: ${photo.name}`;
  document.getElementById('txtCustomerName').value = photo.name;

  document.getElementById('sliderZoom').value = photo.zoom || 1.0;
  document.getElementById('zoomValueLabel').textContent = `${(photo.zoom || 1.0).toFixed(1)}×`;
  document.getElementById('sliderTilt').value = photo.tilt || 0;
  document.getElementById('tiltValueLabel').textContent = `${(photo.tilt || 0) > 0 ? '+' : ''}${(photo.tilt || 0).toFixed(1)}°`;

  document.getElementById('selBgColor').value = photo.bgMode || 'original';
  document.getElementById('customColorPickerRow').style.display = photo.bgMode === 'custom' ? 'flex' : 'none';
  const customHex = (photo.customBgColor || '#3B82F6').toUpperCase();
  if (document.getElementById('pickerBgColor')) document.getElementById('pickerBgColor').value = customHex;
  if (document.getElementById('txtCustomHex')) document.getElementById('txtCustomHex').value = customHex;
  const sliderTol = document.getElementById('sliderBgTolerance');
  const lblTol = document.getElementById('lblBgToleranceVal');
  if (sliderTol) {
    sliderTol.value = photo.bgTolerance !== undefined ? photo.bgTolerance : 65;
    if (lblTol) lblTol.textContent = formatBgTolerance(sliderTol.value);
  }

  document.getElementById('selBorderStyle').value = photo.borderStyle || 'thinGray';

  document.getElementById('sliderBright').value = photo.brightness || 0;
  document.getElementById('lblBrightVal').textContent = `${(photo.brightness || 0) > 0 ? '+' : ''}${photo.brightness || 0}%`;

  document.getElementById('sliderContrast').value = photo.contrast || 0;
  document.getElementById('lblContrastVal').textContent = `${(photo.contrast || 0) > 0 ? '+' : ''}${photo.contrast || 0}%`;

  document.getElementById('sliderExposure').value = photo.exposure || 0;
  document.getElementById('lblExposureVal').textContent = `${(photo.exposure || 0) > 0 ? '+' : ''}${(photo.exposure || 0).toFixed(1)} EV`;

  document.getElementById('sliderSat').value = photo.saturation !== undefined ? photo.saturation : 100;
  document.getElementById('lblSatVal').textContent = `${photo.saturation !== undefined ? photo.saturation : 100}%`;

  document.getElementById('sliderWarmth').value = photo.warmth || 0;
  document.getElementById('lblWarmthVal').textContent = `${(photo.warmth || 0) > 0 ? '+' : ''}${photo.warmth || 0}`;

  document.getElementById('sliderSharp').value = photo.sharpness !== undefined ? photo.sharpness : 20;
  document.getElementById('lblSharpVal').textContent = `${photo.sharpness !== undefined ? photo.sharpness : 20}%`;

  document.getElementById('sliderSkin').value = photo.skinSmoothing || 0;
  document.getElementById('lblSkinVal').textContent = `${photo.skinSmoothing || 0}%`;

  document.getElementById('chkGrayscale').checked = !!photo.grayscale;
}

// MARK: - Undo / Redo System
function saveSnapshot() {
  const photo = getActivePhoto();
  if (!photo) return;

  const snapshot = {
    idx: state.activePhotoIdx,
    data: { ...photo }
  };

  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(snapshot);
  state.historyIndex = state.history.length - 1;
}

function performUndo() {
  if (state.historyIndex > 0) {
    state.historyIndex--;
    restoreSnapshot(state.history[state.historyIndex]);
  }
}

function performRedo() {
  if (state.historyIndex < state.history.length - 1) {
    state.historyIndex++;
    restoreSnapshot(state.history[state.historyIndex]);
  }
}

function restoreSnapshot(snap) {
  if (!snap || !state.photos[snap.idx]) return;
  state.activePhotoIdx = snap.idx;
  const p = state.photos[snap.idx];
  Object.assign(p, snap.data);
  syncPhotoControls(p);
  renderCrop();
  renderSheet();
}

function updateUI() {
  const dim = getPassportDimensionsMM();
  document.getElementById('cropDimensionLabel').textContent = `${dim.w} × ${dim.h} mm`;

  const paperMM = getPaperDimensionsMM();
  const paperPreset = PAPER_PRESETS[state.paperSize] || PAPER_PRESETS.a4;
  document.getElementById('footerPaperLabel').textContent = `${paperPreset.name.split(' ')[0]} (${state.paperOrient})`;
  if (state.arrangement === 'fullPage') {
    document.getElementById('footerPhotoLabel').textContent = `Full Page (${paperMM.w} × ${paperMM.h} mm)`;
  } else {
    document.getElementById('footerPhotoLabel').textContent = `${dim.w} × ${dim.h} mm`;
  }
  document.getElementById('footerSlotsLabel').textContent = `${state.sheetItems.length} Photos`;

  const mediaNames = {
    glossy: 'Glossy Photo Paper',
    semiGloss: 'Semi-Gloss / Luster',
    matte: 'Matte Photo Paper',
    plain: 'Plain Paper'
  };
  const footerMedia = document.getElementById('footerMediaLabel');
  if (footerMedia) {
    footerMedia.textContent = mediaNames[state.paperType || 'glossy'] || 'Glossy Photo Paper';
  }

  syncSelectedPhotoInputs();
  renderCrop();
  renderSheet();
}

// MARK: - Crop Canvas Rendering
function renderCrop() {
  const photo = getActivePhoto();
  const container = document.getElementById('cropBoxContainer');
  const canvas = document.getElementById('cropCanvas');
  if (!canvas || !container) return;
  const ctx = canvas.getContext('2d');

  const dim = getPassportDimensionsMM();
  const aspect = Math.max(0.1, (dim.w || 35) / (dim.h || 45));

  const stage = document.querySelector('.canvas-stage');
  let stageW = stage && stage.clientWidth > 100 ? stage.clientWidth : (window.innerWidth - 560);
  let stageH = stage && stage.clientHeight > 100 ? stage.clientHeight : (window.innerHeight - 160);
  if (stageW < 240) stageW = 480;
  if (stageH < 300) stageH = 600;

  const maxW = Math.max(220, Math.min(stageW - 60, 500));
  const maxH = Math.max(280, Math.min(stageH - 80, 600));

  let frameW = maxW;
  let frameH = frameW / aspect;
  if (frameH > maxH) {
    frameH = maxH;
    frameW = frameH * aspect;
  }

  frameW = Math.max(160, Math.round(frameW));
  frameH = Math.max(200, Math.round(frameH));

  container.style.width = `${frameW}px`;
  container.style.height = `${frameH}px`;

  const dpr = window.devicePixelRatio || 2;
  const pxW = Math.max(1, Math.round(frameW * dpr));
  const pxH = Math.max(1, Math.round(frameH * dpr));

  if (canvas.width !== pxW || canvas.height !== pxH) {
    canvas.width = pxW;
    canvas.height = pxH;
  }
  canvas.style.width = `${frameW}px`;
  canvas.style.height = `${frameH}px`;

  ctx.save();
  ctx.scale(dpr, dpr);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, frameW, frameH);

  if (photo && photo.img) {
    drawAdjustedPhoto(ctx, photo, 0, 0, frameW, frameH);
  } else {
    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No customer photo selected', frameW / 2, frameH / 2);
  }

  ctx.restore();
}

// MARK: - Pixel Adjustment & Intelligent Background Segmentation Engine
function parseHexColor(hexStr, defaultR = 255, defaultG = 255, defaultB = 255) {
  if (!hexStr) return [defaultR, defaultG, defaultB];
  let h = String(hexStr).replace('#', '').trim();
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (h.length >= 6) {
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return [
      isNaN(r) ? defaultR : Math.max(0, Math.min(255, r)),
      isNaN(g) ? defaultG : Math.max(0, Math.min(255, g)),
      isNaN(b) ? defaultB : Math.max(0, Math.min(255, b))
    ];
  }
  return [defaultR, defaultG, defaultB];
}

function formatBgTolerance(val) {
  const v = parseInt(val, 10);
  if (v < 40) return `${v} (Strict)`;
  if (v <= 75) return `${v} (Normal)`;
  if (v <= 100) return `${v} (Strong)`;
  return `${v} (Max)`;
}

function getAdjustedCanvas(photo) {
  const img = photo.img;
  if (!img) return null;
  const natW = img.naturalWidth || img.width || 1;
  const natH = img.naturalHeight || img.height || 1;

  // Build unique cache key to avoid recomputing unless adjustments change
  const cacheKey = [
    natW, natH,
    photo.brightness || 0,
    photo.contrast || 0,
    photo.exposure || 0,
    photo.saturation !== undefined ? photo.saturation : 100,
    photo.warmth || 0,
    photo.sharpness !== undefined ? photo.sharpness : 20,
    photo.skinSmoothing || 0,
    photo.grayscale ? 1 : 0,
    photo.bgMode || 'original',
    photo.customBgColor || '#2563EB',
    photo.bgTolerance !== undefined ? photo.bgTolerance : 65
  ].join('_');

  if (photo._cachedCanvas && photo._cacheKey === cacheKey) {
    return photo._cachedCanvas;
  }

  // Optimize processing dimensions (max 1200px max dimension for fast processing & crisp detail)
  let procW = natW;
  let procH = natH;
  const maxDim = 1200;
  if (procW > maxDim || procH > maxDim) {
    if (procW > procH) {
      procH = Math.round((procH / procW) * maxDim);
      procW = maxDim;
    } else {
      procW = Math.round((procW / procH) * maxDim);
      procH = maxDim;
    }
  }

  const offCanvas = document.createElement('canvas');
  offCanvas.width = procW;
  offCanvas.height = procH;
  const offCtx = offCanvas.getContext('2d');

  offCtx.drawImage(img, 0, 0, procW, procH);

  const hasAdjustments = (
    (photo.brightness && photo.brightness !== 0) ||
    (photo.contrast && photo.contrast !== 0) ||
    (photo.exposure && photo.exposure !== 0) ||
    (photo.saturation !== undefined && photo.saturation !== 100) ||
    (photo.warmth && photo.warmth !== 0) ||
    (photo.sharpness !== undefined && photo.sharpness !== 20) ||
    (photo.skinSmoothing && photo.skinSmoothing !== 0) ||
    photo.grayscale ||
    (photo.bgMode && photo.bgMode !== 'original')
  );

  if (!hasAdjustments) {
    photo._cachedCanvas = offCanvas;
    photo._cacheKey = cacheKey;
    return offCanvas;
  }

  const imgData = offCtx.getImageData(0, 0, procW, procH);
  const data = imgData.data;
  const len = data.length;

  // 1. Intelligent Background Replacement (Chroma/Luma Edge Segmentation)
  let bgMask = null;
  let targetR = 255, targetG = 255, targetB = 255;
  if (photo.bgMode && photo.bgMode !== 'original') {
    if (photo.bgMode === 'lightBlue') {
      targetR = 216; targetG = 232; targetB = 248; // Visa Light Blue (#D8E8F8)
    } else if (photo.bgMode === 'lightGrey') {
      targetR = 240; targetG = 240; targetB = 240; // Light Grey (#F0F0F0)
    } else if (photo.bgMode === 'offWhite') {
      targetR = 250; targetG = 248; targetB = 245; // Off-White (#FAF8F5)
    } else if (photo.bgMode === 'red') {
      targetR = 220; targetG = 38; targetB = 38; // Asian Visa Red (#DC2626)
    } else if (photo.bgMode === 'pureWhite') {
      targetR = 255; targetG = 255; targetB = 255; // Pure White (#FFFFFF)
    } else if (photo.bgMode === 'custom' && photo.customBgColor) {
      const [cr, cg, cb] = parseHexColor(photo.customBgColor, 37, 99, 235);
      targetR = cr;
      targetG = cg;
      targetB = cb;
    }

    const tol = photo.bgTolerance !== undefined ? photo.bgTolerance : 65;
    bgMask = computeBackgroundMask(data, procW, procH, tol);
  }

  // 2. Color & Lighting Adjustments (Direct pixel math supported natively on macOS WebKit)
  const bright = (photo.brightness || 0) * 1.2 + ((photo.exposure || 0) * 35);
  const contrast = photo.contrast || 0;
  const cFactor = contrast === 0 ? 1 : ((259 * (contrast + 255)) / (255 * (259 - contrast)));
  const sat = photo.grayscale ? 0 : ((photo.saturation !== undefined ? photo.saturation : 100) / 100);
  const warmth = photo.warmth || 0;

  for (let i = 0; i < len; i += 4) {
    const pixelIdx = (i / 4) | 0;

    if (bgMask && bgMask[pixelIdx] > 0) {
      const factor = bgMask[pixelIdx] / 255;
      if (factor >= 0.95) {
        // Exact crisp target color replacement
        data[i] = targetR;
        data[i + 1] = targetG;
        data[i + 2] = targetB;
      } else {
        // Smooth edge anti-aliasing against foreground subject
        data[i] = Math.round(targetR * factor + data[i] * (1 - factor));
        data[i + 1] = Math.round(targetG * factor + data[i + 1] * (1 - factor));
        data[i + 2] = Math.round(targetB * factor + data[i + 2] * (1 - factor));
      }
    } else {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Contrast adjustment
      if (contrast !== 0) {
        r = cFactor * (r - 128) + 128;
        g = cFactor * (g - 128) + 128;
        b = cFactor * (b - 128) + 128;
      }

      // Brightness & Exposure adjustment
      if (bright !== 0) {
        r += bright;
        g += bright;
        b += bright;
      }

      // Warmth adjustment
      if (warmth !== 0) {
        r += warmth;
        b -= warmth * 0.5;
      }

      // Saturation / Grayscale conversion
      if (photo.grayscale || sat !== 1) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray + sat * (r - gray);
        g = gray + sat * (g - gray);
        b = gray + sat * (b - gray);
      }

      data[i] = r < 0 ? 0 : (r > 255 ? 255 : r);
      data[i + 1] = g < 0 ? 0 : (g > 255 ? 255 : g);
      data[i + 2] = b < 0 ? 0 : (b > 255 ? 255 : b);
    }
  }

  // 3. Skin Smoothing
  if (photo.skinSmoothing && photo.skinSmoothing > 0) {
    applySkinSmoothingPass(data, procW, procH, photo.skinSmoothing);
  }

  // 4. Sharpness
  if (photo.sharpness && photo.sharpness > 20) {
    applySharpnessPass(data, procW, procH, (photo.sharpness - 20) / 80);
  }

  offCtx.putImageData(imgData, 0, 0);

  photo._cachedCanvas = offCanvas;
  photo._cacheKey = cacheKey;
  return offCanvas;
}

function computeBackgroundMask(data, w, h, tolerance = 65) {
  // Sample top corners and outer perimeter to determine backdrop color
  let sampleR = 0, sampleG = 0, sampleB = 0, count = 0;
  const sampleMargin = Math.min(15, Math.floor(w * 0.05));
  const sampleSize = Math.min(16, Math.floor(w * 0.05));

  for (let dy = sampleMargin; dy < sampleMargin + sampleSize; dy++) {
    for (let dx = sampleMargin; dx < sampleMargin + sampleSize; dx++) {
      const idxL = (dy * w + dx) * 4;
      const idxR = (dy * w + (w - 1 - dx)) * 4;
      sampleR += data[idxL] + data[idxR];
      sampleG += data[idxL + 1] + data[idxR + 1];
      sampleB += data[idxL + 2] + data[idxR + 2];
      count += 2;
    }
  }

  if (count === 0) return null;
  sampleR = Math.round(sampleR / count);
  sampleG = Math.round(sampleG / count);
  sampleB = Math.round(sampleB / count);

  const sampleLuma = 0.299 * sampleR + 0.587 * sampleG + 0.114 * sampleB;

  const mask = new Uint8Array(w * h);
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let qHead = 0, qTail = 0;

  // Seed top edge
  for (let x = 0; x < w; x++) {
    queue[qTail++] = x;
    visited[x] = 1;
  }
  // Seed upper left and right borders (top 85% of image)
  const maxBorderY = Math.floor(h * 0.85);
  for (let y = 1; y < maxBorderY; y++) {
    const idxL = y * w;
    const idxR = y * w + (w - 1);
    queue[qTail++] = idxL; visited[idxL] = 1;
    queue[qTail++] = idxR; visited[idxR] = 1;
  }

  const thresholdSq = tolerance * tolerance;
  const featherThreshold = Math.max(10, tolerance * 0.75);

  while (qHead < qTail) {
    const pos = queue[qHead++];
    const px = pos % w;
    const py = (pos / w) | 0;
    const pIdx = pos * 4;

    const r = data[pIdx];
    const g = data[pIdx + 1];
    const b = data[pIdx + 2];

    // Protection guards for foreground subject:
    // 1. Skin tone detection (warm tones: R > G > B) in central face/neck area
    const isSkin = (r > 95 && g > 55 && b > 35 && (r - g) > 10 && (r - b) > 18 && (px > w * 0.18 && px < w * 0.82) && (py > h * 0.12));
    
    // 2. Dark hair or dark clothing (ONLY if backdrop is light; on dark backgrounds, dark pixels are backdrop)
    const isDarkSubject = (sampleLuma > 75) && (r < 60 && g < 60 && b < 60) && (px > w * 0.15 && px < w * 0.85) && (py > h * 0.15);
    
    // 3. Colored clothing (saturated non-neutral colors: red/green/blue shirt) in lower torso
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const isVibrantClothing = (maxC - minC > 50) && (py > h * 0.45) && (px > w * 0.15 && px < w * 0.85);

    if (!isSkin && !isDarkSubject && !isVibrantClothing) {
      const dr = r - sampleR;
      const dg = g - sampleG;
      const db = b - sampleB;
      const distSq = dr * dr + dg * dg + db * db;

      if (distSq < thresholdSq) {
        const dist = Math.sqrt(distSq);
        if (dist <= featherThreshold) {
          mask[pos] = 255;
        } else {
          mask[pos] = Math.round(255 * (1 - (dist - featherThreshold) / (tolerance - featherThreshold + 0.001)));
        }

        if (px > 0 && !visited[pos - 1]) { visited[pos - 1] = 1; queue[qTail++] = pos - 1; }
        if (px < w - 1 && !visited[pos + 1]) { visited[pos + 1] = 1; queue[qTail++] = pos + 1; }
        if (py > 0 && !visited[pos - w]) { visited[pos - w] = 1; queue[qTail++] = pos - w; }
        if (py < h - 1 && !visited[pos + w]) { visited[pos + w] = 1; queue[qTail++] = pos + w; }
      }
    }
  }

  return mask;
}

function applySkinSmoothingPass(data, w, h, strength) {
  const blend = Math.min(0.6, (strength / 100) * 0.6);
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      if (r > 120 && g > 75 && b > 55 && (r - g) > 12 && (r - b) > 25) {
        const up = ((y - 1) * w + x) * 4;
        const dn = ((y + 1) * w + x) * 4;
        const lt = (y * w + (x - 1)) * 4;
        const rt = (y * w + (x + 1)) * 4;

        const avgR = (data[up] + data[dn] + data[lt] + data[rt]) * 0.25;
        const avgG = (data[up + 1] + data[dn + 1] + data[lt + 1] + data[rt + 1]) * 0.25;
        const avgB = (data[up + 2] + data[dn + 2] + data[lt + 2] + data[rt + 2]) * 0.25;

        data[idx] = Math.round(r * (1 - blend) + avgR * blend);
        data[idx + 1] = Math.round(g * (1 - blend) + avgG * blend);
        data[idx + 2] = Math.round(b * (1 - blend) + avgB * blend);
      }
    }
  }
}

function applySharpnessPass(data, w, h, amount) {
  const kernelAmount = Math.min(0.8, amount * 0.8);
  for (let y = 1; y < h - 1; y += 2) {
    for (let x = 1; x < w - 1; x += 2) {
      const idx = (y * w + x) * 4;
      const up = ((y - 1) * w + x) * 4;
      const dn = ((y + 1) * w + x) * 4;
      const lt = (y * w + (x - 1)) * 4;
      const rt = (y * w + (x + 1)) * 4;

      const rLap = 4 * data[idx] - data[up] - data[dn] - data[lt] - data[rt];
      const gLap = 4 * data[idx + 1] - data[up + 1] - data[dn + 1] - data[lt + 1] - data[rt + 1];
      const bLap = 4 * data[idx + 2] - data[up + 2] - data[dn + 2] - data[lt + 2] - data[rt + 2];

      data[idx] = Math.min(255, Math.max(0, Math.round(data[idx] + rLap * kernelAmount)));
      data[idx + 1] = Math.min(255, Math.max(0, Math.round(data[idx + 1] + gLap * kernelAmount)));
      data[idx + 2] = Math.min(255, Math.max(0, Math.round(data[idx + 2] + bLap * kernelAmount)));
    }
  }
}

// Draw photo with adjustments
function drawAdjustedPhoto(ctx, photo, x, y, w, h) {
  const img = photo.img;
  if (!img) return;

  if (!img.complete || (img.naturalWidth === 0 && img.width === 0)) {
    let reloaded = false;
    img.onload = () => {
      if (reloaded) return;
      reloaded = true;
      renderCrop();
      renderSheet();
    };
    return;
  }

  // Get the adjusted canvas (processed with filters, lighting, and background color)
  const adjustedSrc = getAdjustedCanvas(photo) || img;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const naturalW = adjustedSrc.width || img.naturalWidth || img.width || 1;
  const naturalH = adjustedSrc.height || img.naturalHeight || img.height || 1;
  const imgAspect = naturalW / naturalH;
  const frameAspect = w / h;

  let baseW, baseH;
  if (imgAspect > frameAspect) {
    baseH = h;
    baseW = h * imgAspect;
  } else {
    baseW = w;
    baseH = w / imgAspect;
  }

  const effectiveZoom = Math.max(0.2, photo.zoom || 1.0);
  const drawW = baseW * effectiveZoom;
  const drawH = baseH * effectiveZoom;

  const centerX = x + (w / 2) + (photo.panX || 0);
  const centerY = y + (h / 2) + (photo.panY || 0);

  ctx.translate(centerX, centerY);

  // Flip
  const scaleX = photo.flipH ? -1 : 1;
  const scaleY = photo.flipV ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  // Rotation & Straighten Tilt
  const totalAngle = ((photo.rotation || 0) + (photo.tilt || 0)) * Math.PI / 180;
  if (Math.abs(totalAngle) > 0.001) {
    ctx.rotate(totalAngle);
  }

  ctx.drawImage(adjustedSrc, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  // Photo Outer Border
  if (photo.borderStyle && photo.borderStyle !== 'none') {
    ctx.save();
    ctx.lineWidth = 1;
    if (photo.borderStyle === 'thinGray') {
      ctx.strokeStyle = '#D1D5DB';
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    } else if (photo.borderStyle === 'thinBlack') {
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    } else if (photo.borderStyle === 'dashed') {
      ctx.strokeStyle = '#9CA3AF';
      ctx.setLineDash([3, 2]);
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }
    ctx.restore();
  }
}

// MARK: - Sheet Preview Rendering with Freeform Drag Highlights
function renderSheet() {
  const canvas = document.getElementById('sheetCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const paperMM = getPaperDimensionsMM();
  const photoMM = getPassportDimensionsMM();
  const isFullA4Borderless = state.arrangement === 'fullPage' && state.fullPageMode === 'borderless';

  const slotBadge = document.getElementById('sheetSlotBadge');
  if (slotBadge) slotBadge.textContent = `${state.sheetItems.length} Photos`;
  const summaryLabel = document.getElementById('sheetSummaryLabel');
  if (summaryLabel) summaryLabel.textContent = `on ${PAPER_PRESETS[state.paperSize].name.split(' ')[0]} (${state.paperOrient})`;
  const footerSlots = document.getElementById('footerSlotsLabel');
  if (footerSlots) footerSlots.textContent = `${state.sheetItems.length} Photos`;

  const pointsPerMM = 72 / 25.4;
  const paperPointsW = Math.max(10, paperMM.w * pointsPerMM);
  const paperPointsH = Math.max(10, paperMM.h * pointsPerMM);

  const displayScale = Math.max(0.05, getEffectiveSheetScale());
  const canvasWidth = Math.max(10, Math.round(paperPointsW * displayScale));
  const canvasHeight = Math.max(10, Math.round(paperPointsH * displayScale));

  const dpr = window.devicePixelRatio || 2;
  const pxW = Math.max(1, Math.round(canvasWidth * dpr));
  const pxH = Math.max(1, Math.round(canvasHeight * dpr));

  if (canvas.width !== pxW || canvas.height !== pxH) {
    canvas.width = pxW;
    canvas.height = pxH;
  }
  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;

  ctx.save();
  ctx.scale(dpr * displayScale, dpr * displayScale);

  // Draw White Paper Sheet
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, paperPointsW, paperPointsH);

  // Draw each sheet item
  state.sheetItems.forEach((item, idx) => {
    const photo = state.photos[item.photoIdx] || state.photos[0];
    const xPt = item.xMM * pointsPerMM;
    const yPt = item.yMM * pointsPerMM;
    const wPt = item.wMM * pointsPerMM;
    const hPt = item.hMM * pointsPerMM;

    if (photo) {
      drawAdjustedPhoto(ctx, photo, xPt, yPt, wPt, hPt);
    } else {
      ctx.fillStyle = '#F1F5F9';
      ctx.fillRect(xPt, yPt, wPt, hPt);
      ctx.strokeStyle = '#CBD5E1';
      ctx.strokeRect(xPt, yPt, wPt, hPt);
    }

    if (!isFullA4Borderless && state.showCropMarks) drawCropMarks(ctx, xPt, yPt, wPt, hPt);

    // Selected Photo Highlight on Sheet (supports multiple selected photos!)
    const isSelected = state.selectedSheetItemIndices && state.selectedSheetItemIndices.includes(idx);
    if (isSelected) {
      ctx.save();

      // Soft blue selection tint over the photo
      ctx.fillStyle = 'rgba(37, 99, 235, 0.09)';
      ctx.fillRect(xPt, yPt, wPt, hPt);

      // Blue highlight border
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = 2.0 / displayScale;
      ctx.strokeRect(xPt - 1, yPt - 1, wPt + 2, hPt + 2);

      // Corner & Edge 8 resize handles for primary selected item
      if (idx === state.selectedSheetItemIdx) {
        const handleR = 3.5 / displayScale; // ~7px square
        const handles = [
          { name: 'tl', x: xPt, y: yPt },
          { name: 't',  x: xPt + wPt / 2, y: yPt },
          { name: 'tr', x: xPt + wPt, y: yPt },
          { name: 'r',  x: xPt + wPt, y: yPt + hPt / 2 },
          { name: 'br', x: xPt + wPt, y: yPt + hPt },
          { name: 'b',  x: xPt + wPt / 2, y: yPt + hPt },
          { name: 'bl', x: xPt, y: yPt + hPt },
          { name: 'l',  x: xPt, y: yPt + hPt / 2 }
        ];

        handles.forEach(h => {
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#2563EB';
          ctx.lineWidth = 1.5 / displayScale;
          ctx.beginPath();
          ctx.rect(h.x - handleR, h.y - handleR, handleR * 2, handleR * 2);
          ctx.fill();
          ctx.stroke();
        });

        // Live Dimension Badge during resize
        if (state.isResizingSheetItem) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          const dimText = `📐 ${Math.round(item.wMM)} × ${Math.round(item.hMM)} mm`;
          ctx.font = `bold ${9 / displayScale}px -apple-system, sans-serif`;
          const textW = ctx.measureText(dimText).width;
          const badgeX = xPt + (wPt - textW) / 2 - (8 / displayScale);
          const badgeY = yPt + hPt + (6 / displayScale);
          ctx.fillRect(badgeX, badgeY, textW + (16 / displayScale), 16 / displayScale);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(dimText, badgeX + (8 / displayScale), badgeY + (11 / displayScale));
        }
      } else {
        // Multi-select secondary items get simple corner pips
        const handleR = 3.0 / displayScale;
        ctx.fillStyle = '#2563EB';
        ctx.fillRect(xPt - handleR, yPt - handleR, handleR * 2, handleR * 2);
        ctx.fillRect(xPt + wPt - handleR, yPt - handleR, handleR * 2, handleR * 2);
        ctx.fillRect(xPt - handleR, yPt + hPt - handleR, handleR * 2, handleR * 2);
        ctx.fillRect(xPt + wPt - handleR, yPt + hPt - handleR, handleR * 2, handleR * 2);
      }

      // Live Position Badge during drag (show on primary dragged item)
      if (state.isDraggingSheetItem && idx === state.selectedSheetItemIdx) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        let posText = `X: ${Math.round(item.xMM)}mm  Y: ${Math.round(item.yMM)}mm`;
        if (state.selectedSheetItemIndices.length > 1) {
          posText = `Moving ${state.selectedSheetItemIndices.length} Photos • ${posText}`;
        }
        ctx.font = `bold ${8.5 / displayScale}px -apple-system, sans-serif`;
        const textW = ctx.measureText(posText).width;
        ctx.fillRect(xPt, yPt - (15 / displayScale), textW + (12 / displayScale), 13 / displayScale);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(posText, xPt + (6 / displayScale), yPt - (5 / displayScale));
      }
      ctx.restore();
    }
  });

  // Marquee Rubber-Band Selection Box
  if (state.isMarqueeSelecting) {
    const leftPt = Math.min(state.marqueeStartPtX, state.marqueeCurrentPtX) / displayScale;
    const rightPt = Math.max(state.marqueeStartPtX, state.marqueeCurrentPtX) / displayScale;
    const topPt = Math.min(state.marqueeStartPtY, state.marqueeCurrentPtY) / displayScale;
    const bottomPt = Math.max(state.marqueeStartPtY, state.marqueeCurrentPtY) / displayScale;

    ctx.save();
    ctx.fillStyle = 'rgba(37, 99, 235, 0.12)';
    ctx.fillRect(leftPt, topPt, rightPt - leftPt, bottomPt - topPt);
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 1.0 / displayScale;
    ctx.setLineDash([4 / displayScale, 3 / displayScale]);
    ctx.strokeRect(leftPt, topPt, rightPt - leftPt, bottomPt - topPt);
    ctx.restore();
  }

  if (!isFullA4Borderless && state.showCutLines) {
    ctx.save();
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.6)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 3]);
    state.sheetItems.forEach(item => {
      ctx.strokeRect(item.xMM * pointsPerMM - 1, item.yMM * pointsPerMM - 1, item.wMM * pointsPerMM + 2, item.hMM * pointsPerMM + 2);
    });
    ctx.restore();
  }

  if (!isFullA4Borderless && state.showCalibrationRuler) {
    drawCalibrationRuler(ctx, paperPointsW, paperPointsH, pointsPerMM);
  }

  if (!isFullA4Borderless && state.showSheetHeader) {
    ctx.save();
    ctx.fillStyle = '#64748B';
    ctx.font = '6.5px -apple-system, sans-serif';
    const marginPt = state.marginMM * pointsPerMM;
    const infoText = `Lemon Photo Studio • ${Math.round(photoMM.w)}×${Math.round(photoMM.h)} mm • ${state.sheetItems.length} Photos on ${PAPER_PRESETS[state.paperSize].name.split(' ')[0]} • Print at 100% (No Scaling)`;
    ctx.fillText(infoText, marginPt, 14);
    ctx.restore();
  }

  ctx.restore();
}

function drawCropMarks(ctx, x, y, w, h) {
  const len = 7;
  const offset = 2;
  ctx.save();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 0.5;

  const x1 = x;
  const x2 = x + w;
  const y1 = y;
  const y2 = y + h;

  // Top-Left
  ctx.beginPath();
  ctx.moveTo(x1 - offset - len, y1); ctx.lineTo(x1 - offset, y1);
  ctx.moveTo(x1, y1 - offset - len); ctx.lineTo(x1, y1 - offset);
  ctx.stroke();

  // Top-Right
  ctx.beginPath();
  ctx.moveTo(x2 + offset, y1); ctx.lineTo(x2 + offset + len, y1);
  ctx.moveTo(x2, y1 - offset - len); ctx.lineTo(x2, y1 - offset);
  ctx.stroke();

  // Bottom-Left
  ctx.beginPath();
  ctx.moveTo(x1 - offset - len, y2); ctx.lineTo(x1 - offset, y2);
  ctx.moveTo(x1, y2 + offset); ctx.lineTo(x1, y2 + offset + len);
  ctx.stroke();

  // Bottom-Right
  ctx.beginPath();
  ctx.moveTo(x2 + offset, y2); ctx.lineTo(x2 + offset + len, y2);
  ctx.moveTo(x2, y2 + offset); ctx.lineTo(x2, y2 + offset + len);
  ctx.stroke();

  ctx.restore();
}

function drawCalibrationRuler(ctx, paperW, paperH, pointsPerMM) {
  const rulerW = 50 * pointsPerMM;
  const x = Math.max(state.marginMM * pointsPerMM, (paperW - rulerW) / 2);
  const y = paperH - 22;

  ctx.save();
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 0.6;
  ctx.fillStyle = '#475569';
  ctx.font = '6px -apple-system, sans-serif';

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + rulerW, y);

  for (let mm = 0; mm <= 50; mm++) {
    const tickX = x + (mm * pointsPerMM);
    let tickH = 2.5;
    if (mm % 10 === 0) tickH = 6;
    else if (mm % 5 === 0) tickH = 4.5;

    ctx.moveTo(tickX, y);
    ctx.lineTo(tickX, y + tickH);
  }
  ctx.stroke();

  ctx.fillText('0', x - 2, y + 13);
  ctx.fillText('50 mm', x + rulerW - 12, y + 13);

  const caption = '1:1 Print Scale Verification Ruler (Verify with physical ruler)';
  const capW = ctx.measureText(caption).width;
  ctx.fillText(caption, x + (rulerW - capW) / 2, y - 4);

  ctx.restore();
}

// MARK: - AI Features
function runAIAutoAlign() {
  const photo = getActivePhoto();
  if (!photo) return;
  saveSnapshot();

  const btn = document.getElementById('btnAutoAlign');
  btn.textContent = 'Aligning...';

  setTimeout(() => {
    photo.zoom = 1.35;
    photo.panX = 0;
    photo.panY = -15;
    photo.tilt = 0;

    syncPhotoControls(photo);
    renderCrop();
    renderSheet();

    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="9" cy="9" r="1.5" fill="currentColor"/><circle cx="15" cy="9" r="1.5" fill="currentColor"/><path d="M8 15s1.5 2 4 2 4-2 4-2"/></svg> AI Auto-Center Face`;
  }, 200);
}

function runAIBackgroundWhitener() {
  const photo = getActivePhoto();
  if (!photo) return;
  saveSnapshot();

  const btn = document.getElementById('btnWhitenBG');
  btn.textContent = 'Whitening...';

  setTimeout(() => {
    photo.bgMode = 'pureWhite';
    document.getElementById('selBgColor').value = 'pureWhite';
    renderCrop();
    renderSheet();

    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> AI Pure White BG`;
  }, 200);
}

// MARK: - High Resolution 300 DPI Generation
function generateSheet300DPICanvas() {
  const paperMM = getPaperDimensionsMM();
  const photoMM = getPassportDimensionsMM();
  const isFullA4Borderless = state.arrangement === 'fullPage' && state.fullPageMode === 'borderless';

  const dpi = 300;
  const pixelW = Math.round((paperMM.w / 25.4) * dpi);
  const pixelH = Math.round((paperMM.h / 25.4) * dpi);

  const offCanvas = document.createElement('canvas');
  offCanvas.width = pixelW;
  offCanvas.height = pixelH;
  const ctx = offCanvas.getContext('2d');

  const scale = pixelW / (paperMM.w * (72 / 25.4));
  ctx.scale(scale, scale);

  const pointsPerMM = 72 / 25.4;
  const paperPointsW = paperMM.w * pointsPerMM;
  const paperPointsH = paperMM.h * pointsPerMM;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, paperPointsW, paperPointsH);

  state.sheetItems.forEach((item) => {
    const photo = state.photos[item.photoIdx] || state.photos[0];
    const xPt = item.xMM * pointsPerMM;
    const yPt = item.yMM * pointsPerMM;
    const wPt = item.wMM * pointsPerMM;
    const hPt = item.hMM * pointsPerMM;

    if (photo) drawAdjustedPhoto(ctx, photo, xPt, yPt, wPt, hPt);
    if (!isFullA4Borderless && state.showCropMarks) drawCropMarks(ctx, xPt, yPt, wPt, hPt);
  });

  if (!isFullA4Borderless && state.showCutLines) {
    ctx.save();
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.6)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 3]);
    state.sheetItems.forEach(item => {
      ctx.strokeRect(item.xMM * pointsPerMM - 1, item.yMM * pointsPerMM - 1, item.wMM * pointsPerMM + 2, item.hMM * pointsPerMM + 2);
    });
    ctx.restore();
  }

  if (!isFullA4Borderless && state.showCalibrationRuler) {
    drawCalibrationRuler(ctx, paperPointsW, paperPointsH, pointsPerMM);
  }

  if (!isFullA4Borderless && state.showSheetHeader) {
    ctx.save();
    ctx.fillStyle = '#64748B';
    ctx.font = '6.5px -apple-system, sans-serif';
    const marginPt = state.marginMM * pointsPerMM;
    const mediaName = state.paperType === 'glossy' ? 'Glossy Photo' : (state.paperType === 'semiGloss' ? 'Semi-Gloss' : (state.paperType === 'matte' ? 'Matte' : 'Plain'));
    const infoText = `Lemon Photo Studio • ${Math.round(photoMM.w)}×${Math.round(photoMM.h)} mm • ${state.sheetItems.length} Photos on ${PAPER_PRESETS[state.paperSize].name.split(' ')[0]} (${mediaName}) • Print at 100% (No Scaling)`;
    ctx.fillText(infoText, marginPt, 14);
    ctx.restore();
  }

  return {
    canvas: offCanvas,
    paperWidthPoints: paperPointsW,
    paperHeightPoints: paperPointsH
  };
}

// MARK: - Direct Native Print Operations
function handleDirectPrint() {
  switchTab('sheet');

  const { canvas, paperWidthPoints, paperHeightPoints } = generateSheet300DPICanvas();
  const dataURL = canvas.toDataURL('image/png');

  if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.nativeDirectPrint) {
    window.webkit.messageHandlers.nativeDirectPrint.postMessage({
      dataURL: dataURL,
      paperWidthPoints: paperWidthPoints,
      paperHeightPoints: paperHeightPoints,
      orientation: state.paperOrient,
      paperType: state.paperType || 'glossy',
      printQuality: state.printQuality || 'high'
    });
  } else {
    window.print();
  }
}

function handleQuickPrint() {
  switchTab('sheet');

  const { canvas, paperWidthPoints, paperHeightPoints } = generateSheet300DPICanvas();
  const dataURL = canvas.toDataURL('image/png');

  if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.nativeQuickPrint) {
    window.webkit.messageHandlers.nativeQuickPrint.postMessage({
      dataURL: dataURL,
      paperWidthPoints: paperWidthPoints,
      paperHeightPoints: paperHeightPoints,
      orientation: state.paperOrient,
      paperType: state.paperType || 'glossy',
      printQuality: state.printQuality || 'high'
    });
  } else {
    window.print();
  }
}

function handleExportSingle() {
  const photo = getActivePhoto();
  if (!photo) return;

  const dim = getPassportDimensionsMM();
  const dpi = 300;
  const pixelW = Math.round((dim.w / 25.4) * dpi);
  const pixelH = Math.round((dim.h / 25.4) * dpi);

  const offCanvas = document.createElement('canvas');
  offCanvas.width = pixelW;
  offCanvas.height = pixelH;
  const ctx = offCanvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, pixelW, pixelH);
  drawAdjustedPhoto(ctx, photo, 0, 0, pixelW, pixelH);

  downloadCanvas(offCanvas, `${photo.name}_passport_300dpi.png`);
}

function handleExportSheetImage() {
  const { canvas } = generateSheet300DPICanvas();
  downloadCanvas(canvas, `Lemon_PassportSheet_${state.sheetItems.length}_on_${PAPER_PRESETS[state.paperSize].name.split(' ')[0]}_300dpi.png`);
}

function handleExportPDF() {
  if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.nativeSavePDF) {
    window.webkit.messageHandlers.nativeSavePDF.postMessage({});
  } else {
    alert("Tip: In the macOS Print dialog, click the 'PDF' button at the bottom-left to save as a high-resolution PDF!");
    handleDirectPrint();
  }
}

function downloadCanvas(canvas, filename) {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

// Generate default sample portrait
function loadDefaultSamplePhoto() {
  if (state.photos.length > 0) return;

  const img = new Image();
  img.onload = () => {
    addCustomerPhotoItem("Lemon Portrait", img, true);
  };
  img.onerror = () => {
    loadFallbackCanvasPortrait();
  };
  img.src = 'assets/logo.png';
}

function loadFallbackCanvasPortrait() {
  if (state.photos.length > 0) return;
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = 900;
  sampleCanvas.height = 1100;
  const ctx = sampleCanvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, 1100);
  grad.addColorStop(0, '#E2E8F0');
  grad.addColorStop(1, '#CBD5E1');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 900, 1100);

  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.moveTo(100, 1100);
  ctx.bezierCurveTo(150, 750, 320, 750, 350, 750);
  ctx.lineTo(550, 750);
  ctx.bezierCurveTo(580, 750, 750, 750, 800, 1100);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(380, 750);
  ctx.lineTo(450, 620);
  ctx.lineTo(520, 750);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#E2B89D';
  ctx.fillRect(390, 580, 120, 160);

  ctx.fillStyle = '#EDC5AB';
  ctx.beginPath();
  ctx.ellipse(450, 480, 140, 185, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#261C14';
  ctx.beginPath();
  ctx.ellipse(450, 360, 155, 120, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(395, 470, 20, 11, 0, 0, Math.PI * 2);
  ctx.ellipse(505, 470, 20, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.arc(395, 470, 9, 0, Math.PI * 2);
  ctx.arc(505, 470, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#261C14';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(375, 448); ctx.quadraticCurveTo(395, 442, 415, 450);
  ctx.moveTo(485, 450); ctx.quadraticCurveTo(505, 442, 525, 448);
  ctx.stroke();

  ctx.strokeStyle = '#D4A384';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(450, 470);
  ctx.lineTo(444, 525);
  ctx.lineTo(456, 525);
  ctx.stroke();

  ctx.strokeStyle = '#C27567';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(420, 565);
  ctx.quadraticCurveTo(450, 582, 480, 565);
  ctx.stroke();

  const img = new Image();
  img.onload = () => {
    addCustomerPhotoItem("Customer: Sample Portrait", img, true);
  };
  img.src = sampleCanvas.toDataURL();
}
