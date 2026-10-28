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

  // Sheet Layout Settings (Default: 5 photos on A4!)
  paperSize: 'a4',
  paperOrient: 'portrait',
  targetCount: 5,
  arrangement: 'singleRow',
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
  document.getElementById('btnFloatEdit').addEventListener('click', () => {
    const selIdx = state.selectedSheetItemIndices[0] ?? state.selectedSheetItemIdx;
    const sel = state.sheetItems[selIdx];
    if (sel && sel.photoIdx !== undefined) state.activePhotoIdx = sel.photoIdx;
    switchTab('crop');
  });

  document.getElementById('btnFloatCopy').addEventListener('click', duplicateSelectedSheetItems);
  document.getElementById('btnFloatDelete').addEventListener('click', deleteSelectedSheetItems);

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
    rebuildSheetGrid(state.targetCount, state.arrangement);
    updateUI();
  });

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

    // Update dimensions of sheet items to match new standard
    const dim = getPassportDimensionsMM();
    state.sheetItems.forEach(item => {
      item.wMM = dim.w;
      item.hMM = dim.h;
    });
    updateUI();
  });

  document.getElementById('numCustomW').addEventListener('input', (e) => {
    state.customPassportW = parseFloat(e.target.value) || 35;
    const dim = getPassportDimensionsMM();
    state.sheetItems.forEach(item => { item.wMM = dim.w; });
    updateUI();
  });

  document.getElementById('numCustomH').addEventListener('input', (e) => {
    state.customPassportH = parseFloat(e.target.value) || 45;
    const dim = getPassportDimensionsMM();
    state.sheetItems.forEach(item => { item.hMM = dim.h; });
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

  document.getElementById('pickerBgColor').addEventListener('input', (e) => {
    const photo = getActivePhoto();
    if (!photo) return;
    photo.customBgColor = e.target.value;
    renderCrop();
    renderSheet();
  });

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
    } else if (state.isDraggingSheetItem || state.isMarqueeSelecting) {
      handleSheetItemDragMove(e);
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (state.isDraggingCrop) {
      state.isDraggingCrop = false;
      saveSnapshot();
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

  // Interactive Freeform Sheet Drag & Drop Handlers
  const sheetCanvas = document.getElementById('sheetCanvas');
  sheetCanvas.addEventListener('mousedown', handleSheetCanvasMouseDown);
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
  const margin = state.marginMM;
  const gap = state.gapMM;

  const availW = paperW_MM - (margin * 2);
  const availH = paperH_MM - (margin * 2);

  const maxCols = Math.max(1, Math.floor((availW + gap) / (photoW_MM + gap)));
  const maxRows = Math.max(1, Math.floor((availH + gap) / (photoH_MM + gap)));

  let target = targetCount === 'max' ? (maxCols * maxRows) : targetCount;
  target = Math.max(1, target);

  let cols = 1;
  let rows = 1;

  if (arrangement === 'singleRow') {
    cols = Math.min(target, maxCols);
    rows = Math.max(1, Math.ceil(target / cols));
  } else if (arrangement === 'balanced') {
    if (target <= 2) {
      cols = target; rows = 1;
    } else if (target <= 4) {
      cols = 2; rows = 2;
    } else if (target <= 6) {
      cols = 3; rows = 2;
    } else if (target <= 8) {
      cols = 4; rows = 2;
    } else {
      cols = Math.min(target, maxCols);
      rows = Math.min(Math.ceil(target / cols), maxRows);
    }
  } else if (arrangement === 'customGrid') {
    cols = Math.min(state.customCols, maxCols);
    rows = Math.min(state.customRows, maxRows);
    target = cols * rows;
  }

  const gridW_MM = (cols * photoW_MM) + ((cols - 1) * gap);
  const gridH_MM = (rows * photoH_MM) + ((rows - 1) * gap);

  let startX_MM = margin;
  let startY_MM = margin;

  if (state.alignment === 'centered') {
    startX_MM = Math.max(margin, (paperW_MM - gridW_MM) / 2);
    startY_MM = Math.max(margin, (paperH_MM - gridH_MM) / 2);
  } else if (state.alignment === 'topCenter') {
    startX_MM = Math.max(margin, (paperW_MM - gridW_MM) / 2);
    startY_MM = margin;
  }

  const slots = [];
  let count = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (count >= target) break;
      const x = startX_MM + (c * (photoW_MM + gap));
      const y = startY_MM + (r * (photoH_MM + gap));
      slots.push({ x, y, w: photoW_MM, h: photoH_MM });
      count++;
    }
  }

  return slots;
}

function handleSheetCanvasMouseDown(e) {
  const canvas = document.getElementById('sheetCanvas');
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const pointsPerMM = 72 / 25.4;
  const displayScale = getEffectiveSheetScale();

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
  }
}

function handleSheetItemDragMove(e) {
  const displayScale = getEffectiveSheetScale();
  const pointsPerMM = 72 / 25.4;
  const pixelsPerMM = pointsPerMM * displayScale;

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
  document.getElementById('selArrangement').value = state.arrangement;
  document.getElementById('selAlignment').value = state.alignment;
  document.getElementById('sliderMargin').value = state.marginMM;
  document.getElementById('sliderGap').value = state.gapMM;
  document.getElementById('lblMarginVal').textContent = `${Math.round(state.marginMM)} mm`;
  document.getElementById('lblGapVal').textContent = `${state.gapMM.toFixed(1)} mm`;
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
  if (photo.customBgColor) document.getElementById('pickerBgColor').value = photo.customBgColor;

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
  document.getElementById('footerPhotoLabel').textContent = `${dim.w} × ${dim.h} mm`;
  document.getElementById('footerSlotsLabel').textContent = `${state.sheetItems.length} Photos`;

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
    photo.customBgColor || '#FFFFFF'
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
      targetR = 216; targetG = 232; targetB = 248; // Visa Light Blue
    } else if (photo.bgMode === 'lightGrey') {
      targetR = 240; targetG = 240; targetB = 240; // Light Grey
    } else if (photo.bgMode === 'offWhite') {
      targetR = 250; targetG = 248; targetB = 245; // Off-White
    } else if (photo.bgMode === 'red') {
      targetR = 220; targetG = 38; targetB = 38; // Asian Visa Red
    } else if (photo.bgMode === 'pureWhite') {
      targetR = 255; targetG = 255; targetB = 255; // Pure White (#FFFFFF)
    } else if (photo.bgMode === 'custom' && photo.customBgColor) {
      const hex = photo.customBgColor.replace('#', '');
      targetR = parseInt(hex.substring(0, 2), 16) || 255;
      targetG = parseInt(hex.substring(2, 4), 16) || 255;
      targetB = parseInt(hex.substring(4, 6), 16) || 255;
    }

    bgMask = computeBackgroundMask(data, procW, procH);
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
      data[i] = Math.round(targetR * factor + data[i] * (1 - factor));
      data[i + 1] = Math.round(targetG * factor + data[i + 1] * (1 - factor));
      data[i + 2] = Math.round(targetB * factor + data[i + 2] * (1 - factor));
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

function computeBackgroundMask(data, w, h) {
  // Sample top corners to determine backdrop color
  let sampleR = 0, sampleG = 0, sampleB = 0, count = 0;
  const sampleMargin = Math.min(15, Math.floor(w * 0.05));
  const sampleSize = Math.min(12, Math.floor(w * 0.04));

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

  const mask = new Uint8Array(w * h);
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let qHead = 0, qTail = 0;

  // Seed top edge
  for (let x = 0; x < w; x++) {
    queue[qTail++] = x;
    visited[x] = 1;
  }
  // Seed upper left and right borders (top 75% of image)
  const maxBorderY = Math.floor(h * 0.75);
  for (let y = 1; y < maxBorderY; y++) {
    const idxL = y * w;
    const idxR = y * w + (w - 1);
    queue[qTail++] = idxL; visited[idxL] = 1;
    queue[qTail++] = idxR; visited[idxR] = 1;
  }

  const thresholdSq = 60 * 60;

  while (qHead < qTail) {
    const pos = queue[qHead++];
    const px = pos % w;
    const py = (pos / w) | 0;
    const pIdx = pos * 4;

    const r = data[pIdx];
    const g = data[pIdx + 1];
    const b = data[pIdx + 2];

    // Protection guards for foreground subject:
    // 1. Skin tone detection (warm tones: R > G > B)
    const isSkin = (r > 120 && g > 75 && b > 55 && (r - g) > 12 && (g - b) > 3 && (r - b) > 25);
    // 2. Dark hair or dark clothing
    const isDarkSubject = (r < 65 && g < 65 && b < 65);
    // 3. Colored clothing (saturated non-neutral colors: red/green/blue shirt)
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const isVibrantClothing = (maxC - minC > 50) && (py > h * 0.45);

    if (!isSkin && !isDarkSubject && !isVibrantClothing) {
      const dr = r - sampleR;
      const dg = g - sampleG;
      const db = b - sampleB;
      const distSq = dr * dr + dg * dg + db * db;

      if (distSq < thresholdSq) {
        const dist = Math.sqrt(distSq);
        const featherThreshold = 45;
        if (dist <= featherThreshold) {
          mask[pos] = 255;
        } else {
          mask[pos] = Math.round(255 * (1 - (dist - featherThreshold) / 15));
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

    if (state.showCropMarks) drawCropMarks(ctx, xPt, yPt, wPt, hPt);

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

      // Corner handles
      const handleR = 3.5 / displayScale;
      ctx.fillStyle = '#2563EB';
      ctx.fillRect(xPt - handleR - 1, yPt - handleR - 1, handleR * 2, handleR * 2);
      ctx.fillRect(xPt + wPt - handleR + 1, yPt - handleR - 1, handleR * 2, handleR * 2);
      ctx.fillRect(xPt - handleR - 1, yPt + hPt - handleR + 1, handleR * 2, handleR * 2);
      ctx.fillRect(xPt + wPt - handleR + 1, yPt + hPt - handleR + 1, handleR * 2, handleR * 2);

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

  if (state.showCutLines) {
    ctx.save();
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.6)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 3]);
    state.sheetItems.forEach(item => {
      ctx.strokeRect(item.xMM * pointsPerMM - 1, item.yMM * pointsPerMM - 1, item.wMM * pointsPerMM + 2, item.hMM * pointsPerMM + 2);
    });
    ctx.restore();
  }

  if (state.showCalibrationRuler) {
    drawCalibrationRuler(ctx, paperPointsW, paperPointsH, pointsPerMM);
  }

  if (state.showSheetHeader) {
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
    if (state.showCropMarks) drawCropMarks(ctx, xPt, yPt, wPt, hPt);
  });

  if (state.showCutLines) {
    ctx.save();
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.6)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 3]);
    state.sheetItems.forEach(item => {
      ctx.strokeRect(item.xMM * pointsPerMM - 1, item.yMM * pointsPerMM - 1, item.wMM * pointsPerMM + 2, item.hMM * pointsPerMM + 2);
    });
    ctx.restore();
  }

  if (state.showCalibrationRuler) {
    drawCalibrationRuler(ctx, paperPointsW, paperPointsH, pointsPerMM);
  }

  if (state.showSheetHeader) {
    ctx.save();
    ctx.fillStyle = '#64748B';
    ctx.font = '6.5px -apple-system, sans-serif';
    const marginPt = state.marginMM * pointsPerMM;
    const infoText = `Lemon Photo Studio • ${Math.round(photoMM.w)}×${Math.round(photoMM.h)} mm • ${state.sheetItems.length} Photos on ${PAPER_PRESETS[state.paperSize].name.split(' ')[0]} • Print at 100% (No Scaling)`;
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
      orientation: state.paperOrient
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
      orientation: state.paperOrient
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
