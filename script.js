// ===== GLOBAL STATE =====
const AppState = {
    glyphs: Array(256).fill(null),
    selectedSlots: new Set(),
    currentGlyphSize: 8,
    currentCode: 'E2',
    maxGlyphs: 256,
    currentUnicodeChar: '',
    currentUnicodeInfo: {},
    pendingSizeChange: null
};

// Unicode ranges - SEMUA dari E2 sampai F8
const UnicodeRanges = ['E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 
                      'EA', 'EB', 'EC', 'ED', 'EE', 'EF', 
                      'F0', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8'];

// ===== DOM ELEMENTS =====
const DOM = {
    // Grid
    glyphGrid: document.getElementById('glyphGrid'),
    glyphCount: document.getElementById('glyphCount'),
    clearGridBtn: document.getElementById('clearGridBtn'),
    
    // Buttons
    deleteSelectedBtn: document.getElementById('deleteSelectedBtn'),
    selectAllBtn: document.getElementById('selectAllBtn'),
    deselectAllBtn: document.getElementById('deselectAllBtn'),
    
    // File Inputs
    fileInput: document.createElement('input'),
    projectInput: document.getElementById('projectInput'),
    
    // Stats
    totalGlyphs: document.getElementById('totalGlyphs'),
    selectedCount: document.getElementById('selectedCount'),
    glyphSizeDisplay: document.getElementById('glyphSizeDisplay'),
    
    // Export
    exportPngBtn: document.getElementById('exportPngBtn'),
    exportJsonBtn: document.getElementById('exportJsonBtn'),
    exportBedrockBtn: document.getElementById('exportBedrockBtn'),
    exportJavaBtn: document.getElementById('exportJavaBtn'),
    
    // Project
    saveProjectBtn: document.getElementById('saveProjectBtn'),
    loadProjectBtn: document.getElementById('loadProjectBtn'),
    
    // Preview
    previewCanvas: document.getElementById('previewCanvas'),
    selectedInfo: document.getElementById('selectedInfo'),
    unicodeInfo: document.getElementById('unicodeInfo'),
    unicodeSymbol: document.getElementById('unicodeSymbol'),
    copyUnicodeBtn: document.getElementById('copyUnicodeBtn'),
    
    // Modals
    unicodeModal: document.getElementById('unicodeModal'),
    closeUnicodeModal: document.getElementById('closeUnicodeModal'),
    cancelUnicodeModal: document.getElementById('cancelUnicodeModal'),
    applyUnicodeModal: document.getElementById('applyUnicodeModal'),
    modalCodeGrid: document.getElementById('modalCodeGrid'),
    
    sizeChangeModal: document.getElementById('sizeChangeModal'),
    closeSizeModal: document.getElementById('closeSizeModal'),
    cancelSizeModal: document.getElementById('cancelSizeModal'),
    confirmSizeModal: document.getElementById('confirmSizeModal'),
    currentSize: document.getElementById('currentSize'),
    newSize: document.getElementById('newSize'),
    
    deleteConfirmModal: document.getElementById('deleteConfirmModal'),
    closeDeleteModal: document.getElementById('closeDeleteModal'),
    cancelDeleteModal: document.getElementById('cancelDeleteModal'),
    confirmDeleteModal: document.getElementById('confirmDeleteModal'),
    deleteCount: document.getElementById('deleteCount'),
    
    // Loading & Notification
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingMessage: document.getElementById('loadingMessage'),
    notificationContainer: document.getElementById('notificationContainer')
};

// ===== INITIALIZATION =====
function init() {
    console.log('🚀 Initializing Minecraft Glyph Generator...');
    
    // Setup file input
    DOM.fileInput.type = 'file';
    DOM.fileInput.accept = 'image/png';
    DOM.fileInput.multiple = true;
    DOM.fileInput.style.display = 'none';
    document.body.appendChild(DOM.fileInput);
    
    // Create grid
    createGrid();
    
    // Create Unicode modal grid
    createUnicodeModalGrid();
    
    // Update unicode button display
    updateUnicodeButtonDisplay();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update initial display
    updateStats();
    updateButtonStates();
    clearPreview();
    
    console.log('✅ Initialization complete');
    showNotification('Glyph Generator ready! Click on empty slots to add images.', 'success');
}

// ===== GRID CREATION =====
function createGrid() {
    DOM.glyphGrid.innerHTML = '';
    
    for (let i = 0; i < 256; i++) {
        const slot = document.createElement('div');
        slot.className = 'grid-slot empty';
        slot.dataset.index = i;
        
        // Slot number
        const numberSpan = document.createElement('span');
        numberSpan.className = 'slot-number';
        numberSpan.textContent = i + 1;
        slot.appendChild(numberSpan);
        
        // Plus icon for empty slots - DI TENGAH
        const plusIcon = document.createElement('div');
        plusIcon.className = 'slot-plus';
        plusIcon.innerHTML = '<i class="fas fa-plus"></i>';
        slot.appendChild(plusIcon);
        
        slot.addEventListener('click', handleSlotClick);
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('dragleave', handleDragLeave);
        slot.addEventListener('drop', handleDrop);
        
        DOM.glyphGrid.appendChild(slot);
    }
    
    updateGridVisuals();
}

function handleSlotClick(e) {
    const slot = e.currentTarget;
    const index = parseInt(slot.dataset.index);
    
    if (slot.classList.contains('empty')) {
        // Open file picker
        DOM.fileInput.onchange = async () => {
            const files = Array.from(DOM.fileInput.files);
            if (files.length > 0) {
                await handleFiles(files, index);
            }
            DOM.fileInput.value = '';
        };
        DOM.fileInput.click();
    } else {
        // Select/deselect glyph
        toggleSelectSlot(index);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    const slot = e.currentTarget;
    slot.classList.add('drag-over');
}

function handleDragLeave(e) {
    const slot = e.currentTarget;
    slot.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const slot = e.currentTarget;
    slot.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        const index = parseInt(slot.dataset.index);
        handleFiles(files, index);
    }
}

// ===== UNICODE MODAL SYSTEM - SIMPLE =====
function createUnicodeModalGrid() {
    DOM.modalCodeGrid.innerHTML = '';
    
    UnicodeRanges.forEach(code => {
        const option = document.createElement('div');
        option.className = `unicode-option ${code === AppState.currentCode ? 'active' : ''}`;
        option.dataset.code = code;
        option.innerHTML = `<div class="unicode-option-code">${code}</div>`;
        option.title = `U+${code}00-${code}FF`; // Tooltip
        
        option.addEventListener('click', () => {
            DOM.modalCodeGrid.querySelectorAll('.unicode-option').forEach(el => {
                el.classList.remove('active');
            });
            option.classList.add('active');
        });
        
        DOM.modalCodeGrid.appendChild(option);
    });
}

function updateUnicodeButtonDisplay() {
    const toggleBtn = document.getElementById('unicodeToggleBtn');
    if (toggleBtn) {
        const codeSpan = toggleBtn.querySelector('.unicode-code');
        if (codeSpan) codeSpan.textContent = AppState.currentCode;
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Clear grid button
    DOM.clearGridBtn.addEventListener('click', () => {
        const filledCount = AppState.glyphs.filter(g => g !== null).length;
        if (filledCount > 0) {
            showDeleteConfirmModal(filledCount, clearAllGlyphs);
        } else {
            showNotification('Grid is already empty', 'warning');
        }
    });
    
    // Quick Action buttons
    DOM.deleteSelectedBtn.addEventListener('click', () => {
        if (AppState.selectedSlots.size > 0) {
            showDeleteConfirmModal(AppState.selectedSlots.size, deleteSelectedGlyphs);
        } else {
            showNotification('No glyphs selected', 'warning');
        }
    });
    
    DOM.selectAllBtn.addEventListener('click', selectAllGlyphs);
    DOM.deselectAllBtn.addEventListener('click', deselectAllGlyphs);
    
    // Glyph size change
    document.querySelectorAll('input[name="glyphSize"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const newSize = parseInt(e.target.value);
            if (newSize === AppState.currentGlyphSize) return;
            
            const hasGlyphs = AppState.glyphs.some(g => g !== null);
            if (hasGlyphs && newSize !== 104) { // 104×104 mode tidak perlu modal
                // Show modal for 8x8 ↔ 16x16 changes
                AppState.pendingSizeChange = newSize;
                showSizeChangeModal(AppState.currentGlyphSize, newSize);
            } else {
                // No glyphs or switching to 104×104 mode
                AppState.currentGlyphSize = newSize;
                DOM.glyphSizeDisplay.textContent = `${newSize}×${newSize}`;
                updateStats();
                if (AppState.selectedSlots.size > 0) {
                    const firstIndex = Array.from(AppState.selectedSlots)[0];
                    updatePreview(firstIndex);
                }
            }
        });
    });
    
    // Unicode modal
    DOM.closeUnicodeModal.addEventListener('click', closeUnicodeModal);
    DOM.cancelUnicodeModal.addEventListener('click', closeUnicodeModal);
    DOM.applyUnicodeModal.addEventListener('click', () => {
        const selected = DOM.modalCodeGrid.querySelector('.unicode-option.active');
        if (selected) {
            const newCode = selected.dataset.code;
            if (newCode !== AppState.currentCode) {
                AppState.currentCode = newCode;
                updateUnicodeButtonDisplay();
                closeUnicodeModal();
                showNotification(`Unicode range changed to ${newCode}`, 'success');
                
                // Update grid dengan kode unicode baru
                updateGridUnicode();
            }
        }
    });
    
    // Unicode toggle button
    document.getElementById('unicodeToggleBtn').addEventListener('click', showUnicodeModal);
    
    // Size change modal
    DOM.closeSizeModal.addEventListener('click', closeSizeModal);
    DOM.cancelSizeModal.addEventListener('click', closeSizeModal);
    DOM.confirmSizeModal.addEventListener('click', () => {
        if (AppState.pendingSizeChange !== null) {
            performSizeChange(AppState.pendingSizeChange);
            closeSizeModal();
        }
    });
    
    // Delete confirm modal
    DOM.closeDeleteModal.addEventListener('click', closeDeleteModal);
    DOM.cancelDeleteModal.addEventListener('click', closeDeleteModal);
    DOM.confirmDeleteModal.addEventListener('click', () => {
        const callback = DOM.confirmDeleteModal.dataset.callback;
        if (callback === 'deleteSelectedGlyphs') {
            deleteSelectedGlyphs();
        } else if (callback === 'clearAllGlyphs') {
            clearAllGlyphs();
        }
        closeDeleteModal();
    });
    
    // Export buttons
    DOM.exportPngBtn.addEventListener('click', exportPNG);
    DOM.exportJsonBtn.addEventListener('click', exportJSON);
    DOM.exportBedrockBtn.addEventListener('click', exportBedrock);
    DOM.exportJavaBtn.addEventListener('click', exportJava);
    
    // Project management
    DOM.saveProjectBtn.addEventListener('click', saveProject);
    DOM.loadProjectBtn.addEventListener('click', () => {
        DOM.projectInput.click();
    });
    DOM.projectInput.addEventListener('change', handleProjectLoad);
    
    // Copy Unicode button
    DOM.copyUnicodeBtn.addEventListener('click', copyUnicodeToClipboard);
    
    console.log('✅ Event listeners setup complete');
}

// ===== MODAL FUNCTIONS =====
function showUnicodeModal() {
    DOM.unicodeModal.classList.add('active');
}

function closeUnicodeModal() {
    DOM.unicodeModal.classList.remove('active');
}

function showSizeChangeModal(currentSize, newSize) {
    DOM.currentSize.textContent = `${currentSize}×${currentSize}`;
    DOM.newSize.textContent = `${newSize}×${newSize}`;
    DOM.sizeChangeModal.classList.add('active');
}

function closeSizeModal() {
    DOM.sizeChangeModal.classList.remove('active');
    AppState.pendingSizeChange = null;
    // Reset radio button
    document.querySelector(`input[name="glyphSize"][value="${AppState.currentGlyphSize}"]`).checked = true;
}

function showDeleteConfirmModal(count, callback) {
    DOM.deleteCount.textContent = count;
    
    // Simpan callback sebagai string
    let callbackName = '';
    if (callback === deleteSelectedGlyphs) {
        callbackName = 'deleteSelectedGlyphs';
    } else if (callback === clearAllGlyphs) {
        callbackName = 'clearAllGlyphs';
    }
    
    DOM.confirmDeleteModal.dataset.callback = callbackName;
    DOM.deleteConfirmModal.classList.add('active');
}

function closeDeleteModal() {
    DOM.deleteConfirmModal.classList.remove('active');
    DOM.confirmDeleteModal.dataset.callback = '';
}

// ===== FILE HANDLING - FIX 104×104 RULES =====
async function handleFiles(files, startIndex = 0) {
    if (files.length === 0) return;
    
    showLoading('Processing files...');
    
    const validFiles = files.filter(file => file.name.toLowerCase().endsWith('.png'));
    
    if (validFiles.length === 0) {
        showNotification('No valid PNG files found', 'error');
        showLoading(false);
        return;
    }
    
    let processed = 0;
    let currentIndex = startIndex;
    
    for (const file of validFiles) {
        if (currentIndex >= AppState.maxGlyphs) {
            showNotification(`Maximum ${AppState.maxGlyphs} glyphs reached`, 'warning');
            break;
        }
        
        try {
            const glyph = await processImageFile(file);
            if (glyph) {
                while (currentIndex < AppState.maxGlyphs && AppState.glyphs[currentIndex] !== null) {
                    currentIndex++;
                }
                
                if (currentIndex < AppState.maxGlyphs) {
                    AppState.glyphs[currentIndex] = glyph;
                    processed++;
                    
                    // Select the newly added glyph
                    AppState.selectedSlots.clear();
                    AppState.selectedSlots.add(currentIndex);
                    
                    currentIndex++;
                }
            }
        } catch (error) {
            console.error('Error processing file:', file.name, error);
        }
    }
    
    updateGridVisuals();
    updateStats();
    updateButtonStates();
    
    if (AppState.selectedSlots.size > 0) {
        const firstIndex = Array.from(AppState.selectedSlots)[0];
        updatePreview(firstIndex);
    }
    
    showLoading(false);
    
    if (processed > 0) {
        showNotification(`Added ${processed} glyph(s)`, 'success');
    }
}

function processImageFile(file) {
    return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = (e) => {
            img.onload = () => {
                // ===== MODE 104×104 =====
                if (AppState.currentGlyphSize === 104) {
                    // CEK: Ukuran maksimum 104×104
                    if (img.width > 104 || img.height > 104) {
                        showNotification(`${file.name}: Must be 104×104 or smaller (got ${img.width}×${img.height})`, 'error');
                        resolve(null);
                        return;
                    }
                    
                    // NO SCALING, NO RESIZING - keep original size
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    
                    // NON-INTERPOLATED, NO BLURRING - PIXEL PERFECT
                    ctx.imageSmoothingEnabled = false;
                    ctx.imageSmoothingQuality = 'low';
                    ctx.mozImageSmoothingEnabled = false;
                    ctx.webkitImageSmoothingEnabled = false;
                    ctx.msImageSmoothingEnabled = false;
                    
                    ctx.drawImage(img, 0, 0, img.width, img.height);
                    
                    const processedImg = new Image();
                    processedImg.onload = () => {
                        resolve({
                            image: processedImg,
                            filename: file.name,
                            originalWidth: img.width,
                            originalHeight: img.height,
                            keepOriginalSize: true
                        });
                    };
                    processedImg.src = canvas.toDataURL();
                    return;
                }
                
                // ===== MODE 8×8 atau 16×16 =====
                if (img.width !== img.height) {
                    showNotification(`${file.name}: Not square image`, 'error');
                    resolve(null);
                    return;
                }
                
                if (img.width !== 8 && img.width !== 16) {
                    showNotification(`${file.name}: Must be 8×8 or 16×16`, 'error');
                    resolve(null);
                    return;
                }
                
                // Resize jika ukuran berbeda
                let processedImg = img;
                if (img.width !== AppState.currentGlyphSize) {
                    processedImg = resizeImage(img, AppState.currentGlyphSize, AppState.currentGlyphSize);
                }
                
                resolve({
                    image: processedImg,
                    filename: file.name,
                    originalWidth: img.width,
                    originalHeight: img.height
                });
            };
            
            img.onerror = () => {
                showNotification(`${file.name}: Failed to load`, 'error');
                resolve(null);
            };
            
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    });
}

// Update resizeImage untuk lebih sharp - PIXEL PERFECT
function resizeImage(img, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // TURN OFF ALL SMOOTHING - PIXEL PERFECT
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = 'low';
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    
    // Draw with nearest neighbor
    ctx.drawImage(img, 0, 0, width, height);
    
    const resized = new Image();
    resized.src = canvas.toDataURL();
    return resized;
}

// ===== GLYPH MANAGEMENT =====
function clearAllGlyphs() {
    AppState.glyphs.fill(null);
    AppState.selectedSlots.clear();
    updateGridVisuals();
    updateStats();
    updateButtonStates();
    clearPreview();
    showNotification('All glyphs cleared', 'success');
}

function deleteSelectedGlyphs() {
    if (AppState.selectedSlots.size === 0) {
        showNotification('No glyphs selected for deletion', 'warning');
        return;
    }
    
    const deletedCount = AppState.selectedSlots.size;
    
    // Delete semua yang selected
    AppState.selectedSlots.forEach(index => {
        AppState.glyphs[index] = null;
    });
    
    // Clear selection
    AppState.selectedSlots.clear();
    
    // Update UI
    updateGridVisuals();
    updateStats();
    updateButtonStates();
    clearPreview();
    
    showNotification(`Deleted ${deletedCount} glyph(s)`, 'success');
}

function selectAllGlyphs() {
    AppState.selectedSlots.clear();
    for (let i = 0; i < AppState.maxGlyphs; i++) {
        if (AppState.glyphs[i] !== null) {
            AppState.selectedSlots.add(i);
        }
    }
    updateGridVisuals();
    updateStats();
    updateButtonStates();
    
    if (AppState.selectedSlots.size > 0) {
        const firstIndex = Array.from(AppState.selectedSlots)[0];
        updatePreview(firstIndex);
    }
}

function deselectAllGlyphs() {
    AppState.selectedSlots.clear();
    updateGridVisuals();
    updateStats();
    updateButtonStates();
    clearPreview();
}

function toggleSelectSlot(index) {
    if (AppState.glyphs[index] === null) return;
    
    if (AppState.selectedSlots.has(index)) {
        AppState.selectedSlots.delete(index);
    } else {
        AppState.selectedSlots.add(index);
    }
    
    updateGridVisuals();
    updateStats();
    updateButtonStates();
    
    if (AppState.selectedSlots.has(index)) {
        updatePreview(index);
    } else if (AppState.selectedSlots.size === 0) {
        clearPreview();
    }
}

// ===== PREVIEW FUNCTIONS - FIX 104×104 DISPLAY =====
function updatePreview(index) {
    const glyph = AppState.glyphs[index];
    if (!glyph) return;
    
    const ctx = DOM.previewCanvas.getContext('2d');
    
    // ===== PAKSA UKURAN CANVAS 104x104 =====
    const PREVIEW_SIZE = 104;
    
    // Set ukuran canvas (internal)
    DOM.previewCanvas.width = PREVIEW_SIZE;
    DOM.previewCanvas.height = PREVIEW_SIZE;
    
    // ===== CLEAR CANVAS =====
    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    
    // ===== PIXEL PERFECT RENDERING =====
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = 'low';
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    
    // ===== TENTUKAN UKURAN ASLI GLYPH =====
    let originalWidth, originalHeight;
    
    if (AppState.currentGlyphSize === 104 && glyph.originalWidth && glyph.originalHeight) {
        originalWidth = glyph.originalWidth;
        originalHeight = glyph.originalHeight;
    } else {
        originalWidth = AppState.currentGlyphSize;
        originalHeight = AppState.currentGlyphSize;
    }
    
    // ===== HITUNG POSISI DI TENGAH 104x104 =====
    let drawX = 0, drawY = 0, drawWidth = PREVIEW_SIZE, drawHeight = PREVIEW_SIZE;
    
    if (originalWidth !== PREVIEW_SIZE || originalHeight !== PREVIEW_SIZE) {
        // Jika ukuran asli tidak 104x104, hitung scaling dan posisi
        const scaleX = PREVIEW_SIZE / originalWidth;
        const scaleY = PREVIEW_SIZE / originalHeight;
        const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio
        
        drawWidth = Math.floor(originalWidth * scale);
        drawHeight = Math.floor(originalHeight * scale);
        
        // Center the image
        drawX = Math.floor((PREVIEW_SIZE - drawWidth) / 2);
        drawY = Math.floor((PREVIEW_SIZE - drawHeight) / 2);
    }
    
    console.log(`Preview ${index}: ${originalWidth}x${originalHeight} → ${drawWidth}x${drawHeight} at ${drawX},${drawY}`);
    
    // ===== GAMBAR DI CANVAS =====
    ctx.drawImage(glyph.image, drawX, drawY, drawWidth, drawHeight);
    
    // ===== UPDATE INFO =====
    const hexIndex = index.toString(16).padStart(2, '0').toUpperCase();
    const unicodeHex = `${AppState.currentCode}${hexIndex}`;
    const codePoint = parseInt(unicodeHex, 16);
    const unicodeChar = String.fromCharCode(codePoint);
    
    let sizeText;
    if (AppState.currentGlyphSize === 104 && glyph.originalWidth && glyph.originalHeight) {
        sizeText = `${glyph.originalWidth}×${glyph.originalHeight}`;
    } else {
        sizeText = `${AppState.currentGlyphSize}×${AppState.currentGlyphSize}`;
    }
    
    DOM.selectedInfo.innerHTML = `<i class="fas fa-crosshairs"></i><span>Glyph #${index + 1} • ${sizeText}</span>`;
    DOM.unicodeInfo.innerHTML = `<i class="fas fa-code"></i><span>U+${unicodeHex} • Slot ${index + 1}</span>`;
    
    const placeholder = DOM.unicodeSymbol.querySelector('.symbol-placeholder');
    if (placeholder) {
        placeholder.textContent = unicodeChar;
    }
    
    DOM.copyUnicodeBtn.disabled = false;
    AppState.currentUnicodeChar = unicodeChar;
}

function clearPreview() {
    const ctx = DOM.previewCanvas.getContext('2d');
    const PREVIEW_SIZE = 104;
    
    // Set ukuran canvas
    DOM.previewCanvas.width = PREVIEW_SIZE;
    DOM.previewCanvas.height = PREVIEW_SIZE;
    
    // Clear canvas
    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    
    // Gambar placeholder "?" di tengah
    ctx.fillStyle = 'var(--mc-text-dark)';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', PREVIEW_SIZE/2, PREVIEW_SIZE/2);
    
    // Reset info
    DOM.selectedInfo.innerHTML = '<i class="fas fa-crosshairs"></i><span>Select a glyph to preview</span>';
    DOM.unicodeInfo.innerHTML = '<i class="fas fa-code"></i><span>Click on any glyph slot</span>';
    
    const placeholder = DOM.unicodeSymbol.querySelector('.symbol-placeholder');
    if (placeholder) {
        placeholder.textContent = '?';
    }
    
    DOM.copyUnicodeBtn.disabled = true;
    AppState.currentUnicodeChar = '';
}

async function copyUnicodeToClipboard() {
    if (!AppState.currentUnicodeChar) return;
    
    try {
        await navigator.clipboard.writeText(AppState.currentUnicodeChar);
        DOM.copyUnicodeBtn.classList.add('copied');
        setTimeout(() => {
            DOM.copyUnicodeBtn.classList.remove('copied');
        }, 2000);
        showNotification('Unicode copied to clipboard!', 'success');
    } catch (err) {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = AppState.currentUnicodeChar;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        DOM.copyUnicodeBtn.classList.add('copied');
        setTimeout(() => {
            DOM.copyUnicodeBtn.classList.remove('copied');
        }, 2000);
        showNotification('Unicode copied to clipboard!', 'success');
    }
}

// ===== GRID VISUALS - FIXED TANDA + MASIH ADA =====
function updateGridVisuals() {
    const slots = DOM.glyphGrid.querySelectorAll('.grid-slot');
    let filledCount = 0;
    
    slots.forEach((slot, index) => {
        const glyph = AppState.glyphs[index];
        
        // HAPUS SEMUA CHILD ELEMENT DARI SLOT
        while (slot.firstChild) {
            slot.removeChild(slot.firstChild);
        }
        
        // Reset kelas
        slot.className = 'grid-slot';
        slot.dataset.index = index;
        
        // Tambah slot number
        const numberSpan = document.createElement('span');
        numberSpan.className = 'slot-number';
        numberSpan.textContent = index + 1;
        slot.appendChild(numberSpan);
        
        if (glyph !== null) {
            slot.classList.add('filled');
            
            // Buat thumbnail
            const thumbnail = document.createElement('img');
            thumbnail.className = 'slot-thumbnail';
            
            // Create thumbnail dengan perlakuan khusus untuk 104×104
            const canvas = document.createElement('canvas');
            
            if (AppState.currentGlyphSize === 104 && glyph.originalWidth && glyph.originalHeight) {
                // Mode 104×104: thumbnail dengan ukuran asli di tengah
                canvas.width = 32;
                canvas.height = 32;
                const ctx = canvas.getContext('2d');
                
                // NON-INTERPOLATED, NO BLURRING
                ctx.imageSmoothingEnabled = false;
                ctx.imageSmoothingQuality = 'low';
                ctx.mozImageSmoothingEnabled = false;
                ctx.webkitImageSmoothingEnabled = false;
                ctx.msImageSmoothingEnabled = false;
                
                ctx.clearRect(0, 0, 32, 32);
                
                // Scale down untuk thumbnail (maks 32) - pixel perfect
                const scale = Math.min(32 / Math.max(glyph.originalWidth, glyph.originalHeight), 1);
                const scaledWidth = Math.floor(glyph.originalWidth * scale);
                const scaledHeight = Math.floor(glyph.originalHeight * scale);
                const offsetX = Math.floor((32 - scaledWidth) / 2);
                const offsetY = Math.floor((32 - scaledHeight) / 2);
                
                ctx.drawImage(glyph.image, offsetX, offsetY, scaledWidth, scaledHeight);
            } else {
                // Mode 8×8 atau 16×16
                const size = AppState.currentGlyphSize === 104 ? 32 : AppState.currentGlyphSize;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                
                // NON-INTERPOLATED, NO BLURRING
                ctx.imageSmoothingEnabled = false;
                ctx.imageSmoothingQuality = 'low';
                ctx.mozImageSmoothingEnabled = false;
                ctx.webkitImageSmoothingEnabled = false;
                ctx.msImageSmoothingEnabled = false;
                
                ctx.clearRect(0, 0, size, size);
                ctx.drawImage(glyph.image, 0, 0, size, size);
            }
            
            thumbnail.src = canvas.toDataURL();
            slot.appendChild(thumbnail);
            filledCount++;
        } else {
            slot.classList.add('empty');
            
            // Tambah plus icon untuk slot kosong
            const plusIcon = document.createElement('div');
            plusIcon.className = 'slot-plus';
            plusIcon.innerHTML = '<i class="fas fa-plus"></i>';
            slot.appendChild(plusIcon);
        }
        
        // Update selection state
        if (AppState.selectedSlots.has(index)) {
            slot.classList.add('selected');
        }
        
        // Tambah event listeners
        slot.addEventListener('click', handleSlotClick);
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('dragleave', handleDragLeave);
        slot.addEventListener('drop', handleDrop);
    });
    
    DOM.glyphCount.textContent = filledCount;
}

function updateGridUnicode() {
    // Update semua slot dengan unicode baru
    const slots = DOM.glyphGrid.querySelectorAll('.grid-slot');
    slots.forEach((slot, index) => {
        const hexIndex = index.toString(16).padStart(2, '0').toUpperCase();
        const unicodeHex = `${AppState.currentCode}${hexIndex}`;
        slot.title = `Slot ${index + 1}\nU+${unicodeHex}`;
    });
    
    // Update preview jika ada yang selected
    if (AppState.selectedSlots.size > 0) {
        const firstIndex = Array.from(AppState.selectedSlots)[0];
        updatePreview(firstIndex);
    }
}

// ===== SIZE CHANGE =====
function performSizeChange(newSize) {
    showLoading('Resizing glyphs...');
    
    setTimeout(() => {
        // For 104×104 mode, just change the setting
        if (newSize === 104) {
            AppState.currentGlyphSize = newSize;
            DOM.glyphSizeDisplay.textContent = `${newSize}×${newSize}`;
            
            // Update preview if something is selected
            if (AppState.selectedSlots.size > 0) {
                const firstIndex = Array.from(AppState.selectedSlots)[0];
                updatePreview(firstIndex);
            }
            
            showLoading(false);
            showNotification(`Glyph size changed to ${newSize}×${newSize}`, 'success');
            return;
        }
        
        // For 8×8 and 16×16, resize existing glyphs
        AppState.glyphs.forEach((glyph, index) => {
            if (glyph !== null) {
                // Only resize if original size is different
                if (glyph.originalWidth !== newSize) {
                    AppState.glyphs[index].image = resizeImage(glyph.image, newSize, newSize);
                    AppState.glyphs[index].originalWidth = newSize;
                    AppState.glyphs[index].originalHeight = newSize;
                }
            }
        });
        
        AppState.currentGlyphSize = newSize;
        DOM.glyphSizeDisplay.textContent = `${newSize}×${newSize}`;
        updateGridVisuals();
        
        // Update preview if something is selected
        if (AppState.selectedSlots.size > 0) {
            const firstIndex = Array.from(AppState.selectedSlots)[0];
            updatePreview(firstIndex);
        }
        
        showLoading(false);
        showNotification(`Glyph size changed to ${newSize}×${newSize}`, 'success');
    }, 100);
}

// ===== STATS & BUTTON STATES =====
function updateStats() {
    const filledCount = AppState.glyphs.filter(g => g !== null).length;
    const selectedCount = AppState.selectedSlots.size;
    
    DOM.totalGlyphs.textContent = filledCount;
    DOM.selectedCount.textContent = selectedCount;
    DOM.glyphSizeDisplay.textContent = `${AppState.currentGlyphSize}×${AppState.currentGlyphSize}`;
}

function updateButtonStates() {
    const hasSelected = AppState.selectedSlots.size > 0;
    DOM.deleteSelectedBtn.disabled = !hasSelected;
    DOM.copyUnicodeBtn.disabled = !hasSelected;
}

// ===== PROJECT MANAGEMENT =====
function saveProject() {
    const projectData = {
        glyphs: [],
        selectedSlots: Array.from(AppState.selectedSlots),
        currentGlyphSize: AppState.currentGlyphSize,
        currentCode: AppState.currentCode,
        version: '2.0',
        savedAt: new Date().toISOString()
    };
    
    showLoading('Saving project...');
    
    setTimeout(() => {
        AppState.glyphs.forEach((glyph, index) => {
            if (glyph !== null) {
                const canvas = document.createElement('canvas');
                const size = AppState.currentGlyphSize === 104 ? 
                    (glyph.originalWidth || 104) : 
                    AppState.currentGlyphSize;
                
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(glyph.image, 0, 0, size, size);
                
                projectData.glyphs[index] = {
                    data: canvas.toDataURL(),
                    filename: glyph.filename,
                    originalWidth: glyph.originalWidth,
                    originalHeight: glyph.originalHeight
                };
            } else {
                projectData.glyphs[index] = null;
            }
        });
        
        const jsonStr = JSON.stringify(projectData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `glyph_project_${AppState.currentCode}_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showLoading(false);
        showNotification('Project saved successfully!', 'success');
    }, 100);
}

function handleProjectLoad(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const projectData = JSON.parse(e.target.result);
            
            if (!projectData.version || !Array.isArray(projectData.glyphs)) {
                throw new Error('Invalid project file format');
            }
            
            showLoading('Loading project...');
            
            AppState.glyphs = Array(256).fill(null);
            AppState.selectedSlots.clear();
            
            for (let i = 0; i < projectData.glyphs.length && i < 256; i++) {
                if (projectData.glyphs[i] !== null) {
                    const glyphData = projectData.glyphs[i];
                    const img = new Image();
                    
                    await new Promise((resolve) => {
                        img.onload = () => {
                            AppState.glyphs[i] = {
                                image: img,
                                filename: glyphData.filename || `glyph_${i}.png`,
                                originalWidth: glyphData.originalWidth,
                                originalHeight: glyphData.originalHeight
                            };
                            resolve();
                        };
                        img.src = glyphData.data;
                    });
                }
            }
            
            if (projectData.currentGlyphSize) {
                AppState.currentGlyphSize = projectData.currentGlyphSize;
                document.querySelector(`input[name="glyphSize"][value="${AppState.currentGlyphSize}"]`).checked = true;
                DOM.glyphSizeDisplay.textContent = `${AppState.currentGlyphSize}×${AppState.currentGlyphSize}`;
            }
            
            if (projectData.currentCode) {
                AppState.currentCode = projectData.currentCode;
                updateUnicodeButtonDisplay();
            }
            
            if (projectData.selectedSlots) {
                AppState.selectedSlots = new Set(projectData.selectedSlots);
            }
            
            updateGridVisuals();
            updateStats();
            updateButtonStates();
            
            if (AppState.selectedSlots.size > 0) {
                const firstIndex = Array.from(AppState.selectedSlots)[0];
                updatePreview(firstIndex);
            } else {
                clearPreview();
            }
            
            showLoading(false);
            showNotification('Project loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Error loading project:', error);
            showNotification('Failed to load project: ' + error.message, 'error');
            showLoading(false);
        }
    };
    
    reader.readAsText(file);
    DOM.projectInput.value = '';
}

// ===== EXPORT FUNCTIONS =====
async function exportPNG() {
    const filledGlyphs = AppState.glyphs.filter(g => g !== null);
    
    if (filledGlyphs.length === 0) {
        showNotification('No glyphs to export!', 'warning');
        return;
    }
    
    showLoading('Creating PNG sprite sheet...');
    
    try {
        const gridSize = 16;
        
        // ===== TENTUKAN UKURAN SEL BERDASARKAN MODE =====
        let cellSize;
        if (AppState.currentGlyphSize === 104) {
            cellSize = 104; // Mode 104×104
        } else {
            cellSize = AppState.currentGlyphSize; // Mode 8×8 atau 16×16
        }
        
        const canvasSize = gridSize * cellSize;
        
        const canvas = document.createElement('canvas');
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas dengan transparan
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        
        // PIXEL PERFECT - NO SMOOTHING
        ctx.imageSmoothingEnabled = false;
        ctx.imageSmoothingQuality = 'low';
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        
        AppState.glyphs.forEach((glyph, index) => {
            if (glyph !== null) {
                const x = (index % gridSize) * cellSize;
                const y = Math.floor(index / gridSize) * cellSize;
                
                if (AppState.currentGlyphSize === 104) {
                    // ===== MODE 104×104 =====
                    if (glyph.originalWidth && glyph.originalHeight) {
                        const offsetX = Math.floor((cellSize - glyph.originalWidth) / 2);
                        const offsetY = Math.floor((cellSize - glyph.originalHeight) / 2);
                        
                        ctx.drawImage(
                            glyph.image, 
                            x + offsetX, 
                            y + offsetY, 
                            glyph.originalWidth, 
                            glyph.originalHeight
                        );
                    } else {
                        const size = Math.min(glyph.image.width || 104, 104);
                        const offsetX = Math.floor((cellSize - size) / 2);
                        const offsetY = Math.floor((cellSize - size) / 2);
                        ctx.drawImage(glyph.image, x + offsetX, y + offsetY, size, size);
                    }
                } else {
                    // ===== MODE 8×8 atau 16×16 =====
                    ctx.drawImage(glyph.image, x, y, cellSize, cellSize);
                }
            }
        });
        
        const fileName = `glyph_${AppState.currentCode}.png`;
        
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showLoading(false);
            showNotification(`Exported: ${fileName} (${cellSize}×${cellSize})`, 'success');
        }, 'image/png');
        
    } catch (error) {
        showLoading(false);
        showNotification('Export failed: ' + error.message, 'error');
    }
}

async function exportJSON() {
    const filledGlyphs = AppState.glyphs.filter(g => g !== null);
    
    if (filledGlyphs.length === 0) {
        showNotification('No glyphs to export!', 'warning');
        return;
    }
    
    showLoading('Creating JSON provider...');
    
    try {
        const gridSize = 16;
        const charRows = [];
        
        // Generate semua karakter Unicode dalam format \uXXXX
        const unicodeChars = [];
        for (let i = 0; i < 256; i++) {
            const hexIndex = i.toString(16).padStart(2, '0').toUpperCase();
            const unicodeHex = AppState.currentCode + hexIndex;
            unicodeChars.push(`\\u${unicodeHex}`);
        }
        
        // Format menjadi 16 baris dengan 16 karakter per baris
        for (let row = 0; row < 16; row++) {
            const startIndex = row * 16;
            const rowUnicode = unicodeChars.slice(startIndex, startIndex + 16).join('');
            const rowString = JSON.parse(`"${rowUnicode}"`); // Konversi \uXXXX ke karakter sebenarnya
            charRows.push(rowString);
        }
        
        // Buat JSON string secara manual untuk format yang tepat
        const jsonLines = [
            '{',
            '    "providers": [',
            '        {',
            `            "type": "bitmap",`,
            `            "file": "minecraft:font/glyph_${AppState.currentCode}.png",`,
            `            "ascent": 8,`,
            `            "height": 8,`,
            `            "chars": [`
        ];
        
        // Tambahkan baris chars dengan format yang tepat
        for (let i = 0; i < charRows.length; i++) {
            const prefix = '              ';
            const suffix = i === charRows.length - 1 ? '' : ',';
            jsonLines.push(`${prefix}"${charRows[i]}"${suffix}`);
        }
        
        jsonLines.push('            ]');
        jsonLines.push('        }     ');
        jsonLines.push('    ]');
        jsonLines.push('}');
        
        const jsonStr = jsonLines.join('\n');
        const fileName = `glyph_${AppState.currentCode}.json`;
        
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showLoading(false);
        showNotification(`Exported: ${fileName}`, 'success');
        
    } catch (error) {
        showLoading(false);
        showNotification('Export failed: ' + error.message, 'error');
    }
}

async function exportBedrock() {
    const filledGlyphs = AppState.glyphs.filter(g => g !== null);
    
    if (filledGlyphs.length === 0) {
        showNotification('No glyphs to export!', 'warning');
        return;
    }
    
    if (typeof JSZip === 'undefined') {
        showNotification('JSZip library not loaded!', 'error');
        return;
    }
    
    showLoading('Creating Bedrock resource pack...');
    
    try {
        const zip = new JSZip();
        
        // Create manifest
        const manifest = {
            format_version: 2,
            header: {
                name: `Glyph Pack ${AppState.currentCode}`,
                description: "Custom glyph pack for Minecraft Bedrock",
                uuid: generateUUID(),
                version: [1, 0, 0],
                min_engine_version: [1, 20, 0]
            },
            modules: [
                {
                    type: "resources",
                    uuid: generateUUID(),
                    version: [1, 0, 0]
                }
            ]
        };
        
        zip.file("manifest.json", JSON.stringify(manifest, null, 2));
        
        // ===== BUAT PNG SPRITE SHEET =====
        const gridSize = 16;
        let cellSize;
        
        if (AppState.currentGlyphSize === 104) {
            cellSize = 104;
        } else {
            cellSize = AppState.currentGlyphSize; // 8 atau 16
        }
        
        const canvasSize = gridSize * cellSize;
        
        const canvas = document.createElement('canvas');
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        
        // PIXEL PERFECT
        ctx.imageSmoothingEnabled = false;
        ctx.imageSmoothingQuality = 'low';
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        
        AppState.glyphs.forEach((glyph, index) => {
            if (glyph !== null) {
                const x = (index % gridSize) * cellSize;
                const y = Math.floor(index / gridSize) * cellSize;
                
                if (AppState.currentGlyphSize === 104) {
                    if (glyph.originalWidth && glyph.originalHeight) {
                        const offsetX = Math.floor((cellSize - glyph.originalWidth) / 2);
                        const offsetY = Math.floor((cellSize - glyph.originalHeight) / 2);
                        
                        ctx.drawImage(glyph.image, x + offsetX, y + offsetY, 
                                     glyph.originalWidth, glyph.originalHeight);
                    } else {
                        const size = Math.min(glyph.image.width || 104, 104);
                        const offsetX = Math.floor((cellSize - size) / 2);
                        const offsetY = Math.floor((cellSize - size) / 2);
                        ctx.drawImage(glyph.image, x + offsetX, y + offsetY, size, size);
                    }
                } else {
                    ctx.drawImage(glyph.image, x, y, cellSize, cellSize);
                }
            }
        });
        
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const texturesFolder = zip.folder("textures").folder("font");
        texturesFolder.file(`glyph_${AppState.currentCode}.png`, blob);
        
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `glyph_${AppState.currentCode}.mcpack`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showLoading(false);
        showNotification(`Exported: glyph_${AppState.currentCode}.mcpack`, 'success');
        
    } catch (error) {
        showLoading(false);
        showNotification('Export failed: ' + error.message, 'error');
    }
}

async function exportJava() {
    const filledGlyphs = AppState.glyphs.filter(g => g !== null);
    
    if (filledGlyphs.length === 0) {
        showNotification('No glyphs to export!', 'warning');
        return;
    }
    
    if (typeof JSZip === 'undefined') {
        showNotification('JSZip library not loaded!', 'error');
        return;
    }
    
    showLoading('Creating Java resource pack (single-file glyphs)...');
    
    try {
        const zip = new JSZip();
        
        // Create folder structure
        const assets = zip.folder("assets");
        const minecraft = assets.folder("minecraft");
        const font = minecraft.folder("font");
        const textures = minecraft.folder("textures");
        const fontTextures = textures.folder("font");
        
        // ===== BUAT JSON DENGAN 256 PROVIDERS TERPISAH =====
        const providers = [];
        
        for (let i = 0; i < AppState.glyphs.length; i++) {
            const glyph = AppState.glyphs[i];
            if (glyph !== null) {
                const hexIndex = i.toString(16).padStart(2, '0').toUpperCase();
                const unicodeHex = AppState.currentCode + hexIndex;
                const codePoint = parseInt(unicodeHex, 16);
                const unicodeChar = String.fromCharCode(codePoint);
                
                providers.push({
                    type: "bitmap",
                    file: `minecraft:font/${i + 1}.png`,
                    ascent: 8,
                    height: 8,
                    chars: [unicodeChar]
                });
                
                // ===== SIMPAN GAMBAR INDIVIDUAL =====
                const canvas = document.createElement('canvas');
                
                if (AppState.currentGlyphSize === 104 && glyph.originalWidth && glyph.originalHeight) {
                    // Mode 104×104: gunakan ukuran asli
                    canvas.width = glyph.originalWidth;
                    canvas.height = glyph.originalHeight;
                    const ctx = canvas.getContext('2d');
                    
                    // PIXEL PERFECT RENDERING
                    ctx.imageSmoothingEnabled = false;
                    ctx.imageSmoothingQuality = 'low';
                    ctx.mozImageSmoothingEnabled = false;
                    ctx.webkitImageSmoothingEnabled = false;
                    ctx.msImageSmoothingEnabled = false;
                    
                    ctx.clearRect(0, 0, glyph.originalWidth, glyph.originalHeight);
                    ctx.drawImage(glyph.image, 0, 0, glyph.originalWidth, glyph.originalHeight);
                } else {
                    // Mode 8×8 atau 16×16
                    const size = AppState.currentGlyphSize;
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    
                    ctx.imageSmoothingEnabled = false;
                    ctx.imageSmoothingQuality = 'low';
                    ctx.mozImageSmoothingEnabled = false;
                    ctx.webkitImageSmoothingEnabled = false;
                    ctx.msImageSmoothingEnabled = false;
                    
                    ctx.clearRect(0, 0, size, size);
                    ctx.drawImage(glyph.image, 0, 0, size, size);
                }
                
                // Convert canvas to blob and add to zip
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                fontTextures.file(`${i + 1}.png`, blob);
            }
        }
        
        // ===== BUAT JSON PROVIDER =====
        const jsonData = {
            providers: providers
        };
        
        font.file("default.json", JSON.stringify(jsonData, null, 4));
        
        // Create pack.mcmeta
        const mcmeta = {
            pack: {
                pack_format: 15,
                description: `Custom Glyph Pack ${AppState.currentCode} (Single Files)`
            }
        };
        zip.file("pack.mcmeta", JSON.stringify(mcmeta, null, 2));
        
        // Generate and download the ZIP file
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `glyph_${AppState.currentCode}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showLoading(false);
        showNotification(`Exported: ${providers.length} individual glyph files`, 'success');
        
    } catch (error) {
        showLoading(false);
        showNotification('Export failed: ' + error.message, 'error');
    }
}

// ===== UTILITY FUNCTIONS =====
function showLoading(message) {
    if (message) {
        DOM.loadingMessage.textContent = message;
        DOM.loadingOverlay.classList.add('active');
    } else {
        DOM.loadingOverlay.classList.remove('active');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = 'fas fa-info-circle';
    if (type === 'success') icon = 'fas fa-check-circle';
    if (type === 'error') icon = 'fas fa-exclamation-circle';
    if (type === 'warning') icon = 'fas fa-exclamation-triangle';
    
    notification.innerHTML = `
        <i class="${icon}"></i>
        <div class="notification-content">${message}</div>
    `;
    
    DOM.notificationContainer.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ===== START APPLICATION =====
document.addEventListener('DOMContentLoaded', init);