// SPDX-License-Identifier: AGPL-3.0-or-later
// This file is part of MLX DeepSeek-OCR.
// Copyright (C) 2025 MLX DeepSeek-OCR contributors
// Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).
// See the LICENSE file in the project root for full license text:
// https://www.gnu.org/licenses/agpl-3.0.en.html
// ===== MLX DeepSeek-OCR 完整 app.js =====
// 所有修正項目 1-13 完整實現
// Part 1: 全局變數、DOM 元素、映射表、基礎事件

// ===== 全局變數 =====
let selectedFile = null;
let currentTaskId = null;
let currentBatchIndex = 0;
let totalPages = 0;
let stopProcessing = false;
let pdfMode = 'batch';
let currentZoom = 1;
let currentMode = 'Document';
let currentSubcategory = 'Academic';
let currentComplexity = 'Medium';
let preprocessFiles = [];
let preprocessResults = []; // 保存前處理結果（包含處理後的文件路徑）
let currentPreprocessTaskId = null; // 保存當前前處理任務ID
let videoFile = null;
let extractedFrames = [];
let currentVideoTaskId = null; // 保存當前視頻任務ID
// 前處理狀態變數（新增）
let imagePreprocessed = false;
let pdfPreprocessed = false;
let processedImageFile = null; // 處理後的圖片文件
let processedPdfThumbnails = []; // 處理後的PDF縮圖
let isPdfPreprocessMode = false; // PDF前處理模式標記（新增：用於狀態檢測）
let isVideoPreprocessMode = false; // 視頻截圖前處理模式標記（新增：用於狀態檢測）
let processedVideoFrames = []; // 處理後的視頻截圖（類似 processedPdfThumbnails）

// ===== I18n 翻譯系統 =====
class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('language') || this.detectLanguage();
        this.translations = {};
        this.ready = this.loadTranslations(this.currentLang);
    }
    
    detectLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('es')) return 'es';
        if (browserLang.startsWith('zh')) return 'zh';
        return 'en';
    }
    
    async loadTranslations(lang) {
        try {
            const files = ['common', 'ui', 'messages', 'errors'];
            for (const file of files) {
                const response = await fetch(`/static/locales/${lang}/${file}.json`);
                if (response.ok) {
                    this.translations[file] = await response.json();
                }
            }
        } catch (error) {
            console.warn('Failed to load translations:', error);
        }
    }
    
    t(key, params = {}) {
        const keyParts = key.split('.');
        
        // Try to find the translation by checking all translation file categories
        for (const [fileCategory, fileData] of Object.entries(this.translations)) {
            if (!fileData) {
                continue;
            }
            
            // Strip file category prefix from key if present (e.g., 'ui.pdf.batch_with_count' -> 'pdf.batch_with_count')
            let lookupParts = keyParts;
            if (keyParts[0] === fileCategory && keyParts.length > 1) {
                lookupParts = keyParts.slice(1);
            }
            
            let text = fileData;
            let found = true;
            
            // Navigate through nested structure using the key parts
            for (const k of lookupParts) {
                if (text && typeof text === 'object' && text !== null && k in text) {
                    text = text[k];
                } else {
                    found = false;
                    break;
                }
            }
            
            if (found && text !== undefined && text !== null) {
                return this.interpolate(text, params);
            }
        }
        
        console.warn(`[i18n] Missing translation: "${key}" for language "${this.currentLang}"`);
        return key;
    }
    
    interpolate(text, params) {
        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }
    
    async setLanguage(lang) {
        if (lang === this.currentLang) return;
        
        this.currentLang = lang;
        localStorage.setItem('language', lang);
        await this.loadTranslations(lang);
        
        // Wait a bit for translations to be fully loaded
        await new Promise(resolve => setTimeout(resolve, 100));
        
        this.updateUI();
        
        // 更新 HTML lang 屬性
        document.documentElement.lang = lang === 'zh' ? 'zh-TW' : lang;
    }
    
    async updateUI() {
        // Ensure translations are loaded
        if (Object.keys(this.translations).length === 0) {
            await this.loadTranslations(this.currentLang);
        }
        
        // Update all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n], [data-i18n-html]');
        
        elements.forEach((element) => {
            const key = element.getAttribute('data-i18n') || element.getAttribute('data-i18n-html');
            const translation = this.t(key);
            
            // Handle HTML content separately
            if (element.hasAttribute('data-i18n-html')) {
                element.innerHTML = translation;
            } else if (element.tagName === 'INPUT' && (element.type === 'submit' || element.type === 'button')) {
                element.value = translation;
            } else if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = translation;
            } else if (element.tagName === 'OPTION') {
                element.textContent = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Update title attributes
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });
        
        // Update select options
        document.querySelectorAll('select[data-i18n-options]').forEach(select => {
            Array.from(select.options).forEach((option) => {
                const optionKey = option.getAttribute('data-i18n');
                if (optionKey) {
                    const translation = this.t(optionKey);
                    if (translation !== optionKey) {
                        option.textContent = translation;
                    }
                }
            });
        });
        
        // Update elements with data-i18n-placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });
        
        // Update aria-label attributes
        document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
            const key = element.getAttribute('data-i18n-aria-label');
            element.setAttribute('aria-label', this.t(key));
        });
    }
}

// 初始化 i18n
const i18n = new I18n();

// ===== DOM 元素获取 =====
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const preview = document.getElementById('preview');
const previewImage = document.getElementById('previewImage');
const clearBtn = document.getElementById('clearBtn');
const loading = document.getElementById('loading');
const loadingText = document.getElementById('loadingText');
const errorDiv = document.getElementById('error');
const resultDiv = document.getElementById('result');
const successDiv = document.getElementById('success');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');

// OCR 相關元素
const modeSelect = document.getElementById('modeSelect');
const subcategorySelect = document.getElementById('subcategorySelect');
const complexitySlider = document.getElementById('complexitySlider');
const complexityLabel = document.getElementById('complexityLabel');
const configPanel = document.getElementById('configPanel');
const progressInfo = document.getElementById('progressInfo');
const pdfModeSection = document.getElementById('pdfModeSection');

// PDF 批次/單頁元素
const batchModeBtn = document.getElementById('batchModeBtn');
const singleModeBtn = document.getElementById('singleModeBtn');
const batchSettings = document.getElementById('batchSettings');
const singleSettings = document.getElementById('singleSettings');
const batchSizeSelect = document.getElementById('batchSize');
const customBatchInput = document.getElementById('customBatchSize');
const pageSelector = document.getElementById('pageSelector');
const thumbnailsContainer = document.getElementById('thumbnails');
const thumbnailsGrid = document.getElementById('thumbnailsGrid');

// 執行按鈕
const processBatchBtn = document.getElementById('processBatchBtn');
const processSingleBtn = document.getElementById('processSingleBtn');
const processImageBtn = document.getElementById('processImageBtn');
const batchBtnText = document.getElementById('batchBtnText');
const singleBtnText = document.getElementById('singleBtnText');
const imageBtnText = document.getElementById('imageBtnText');

// 批次控制
const batchControls = document.getElementById('batchControls');
const continueBtn = document.getElementById('continueBtn');
const stopBtn = document.getElementById('stopBtn');
const successMessage = document.getElementById('successMessage');

// 照片前處理元素
const preprocessFileInput = document.getElementById('preprocessFileInput');
const preprocessDropZone = document.getElementById('preprocessDropZone');
const processPreprocessBtn = document.getElementById('processPreprocessBtn');
const downloadPreprocessBtn = document.getElementById('downloadPreprocessBtn');
const sendToOcrBtn = document.getElementById('sendToOcrBtn');
const preprocessPreview = document.getElementById('preprocessPreview');
const preprocessImages = document.getElementById('preprocessImages');
const preprocessProgressBar = document.getElementById('preprocessProgressBar');
const preprocessProgressText = document.getElementById('preprocessProgressText');

// 影片截圖元素
const videoFileInput = document.getElementById('videoFileInput');
const videoDropZone = document.getElementById('videoDropZone');
const extractFramesBtn = document.getElementById('extractFramesBtn');
const downloadFramesBtn = document.getElementById('downloadFramesBtn');
const sendFramesToOcrBtn = document.getElementById('sendFramesToOcrBtn');
const framesPreview = document.getElementById('framesPreview');

// OCR Tab 前處理選項元素（新增）
const imagePreprocessSection = document.getElementById('imagePreprocessSection');
const pdfPreprocessSection = document.getElementById('pdfPreprocessSection');
const skipImagePreprocessBtn = document.getElementById('skipImagePreprocessBtn');
const executeImagePreprocessBtn = document.getElementById('executeImagePreprocessBtn');
const skipPdfPreprocessBtn = document.getElementById('skipPdfPreprocessBtn');
const executePdfPreprocessBtn = document.getElementById('executePdfPreprocessBtn');

// 注意：前處理狀態變數已在全局變數區定義（第23-27行），此處不再重複定義
const framesGrid = document.getElementById('framesGrid');
const framesCount = document.getElementById('framesCount');
const selectAllFrames = document.getElementById('selectAllFrames');
const deselectAllFrames = document.getElementById('deselectAllFrames');

// ===== 映射表和常數 =====
const subcategoryMap = {
    'Document': ['Academic', 'Business', 'Content', 'Table', 'Handwritten', 'Complex'],
    'Scene': ['Street', 'Photo', 'Objects', 'Verification']
};

const complexityMap = {
    'Tiny': 64,
    'Small': 100,
    'Medium': 256,
    'Large': 400,
    'Gundam': 800
};

const complexityNames = ['Tiny', 'Small', 'Medium', 'Large', 'Gundam'];

// ===== 分類選擇事件監聽 =====
modeSelect.addEventListener('change', (e) => {
    currentMode = e.target.value;
    updateSubcategoryOptions();
    updateConfigDisplay();
});

subcategorySelect.addEventListener('change', (e) => {
    currentSubcategory = e.target.value;
    updateConfigDisplay();
});

complexitySlider.addEventListener('input', (e) => {
    currentComplexity = complexityNames[parseInt(e.target.value)];
    updateConfigDisplay();
});

// ===== 更新子分類選項 =====
function updateSubcategoryOptions() {
    const categories = subcategoryMap[currentMode] || [];
    subcategorySelect.innerHTML = '';
    
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        subcategorySelect.appendChild(opt);
    });
    
    currentSubcategory = categories[0] || 'Academic';
    subcategorySelect.value = currentSubcategory;
}

// ===== 更新配置顯示 =====
function updateConfigDisplay() {
    const tokens = complexityMap[currentComplexity] || 256;
    const hint = currentComplexity === 'Medium' ? ' ⭐ 推薦' : '';
    complexityLabel.textContent = `${currentComplexity} (${tokens} tokens)${hint}`;
}

// ===== PDF 模式切換 =====
batchModeBtn.addEventListener('click', () => {
    pdfMode = 'batch';
    batchModeBtn.classList.add('active');
    batchModeBtn.classList.remove('bg-gray-50', 'text-gray-700');
    singleModeBtn.classList.remove('active');
    singleModeBtn.classList.add('bg-gray-50', 'text-gray-700');
    batchSettings.classList.remove('hidden');
    singleSettings.classList.add('hidden');
    processBatchBtn.classList.remove('hidden');
    processSingleBtn.classList.add('hidden');
    resetResults();
});

singleModeBtn.addEventListener('click', () => {
    pdfMode = 'single';
    singleModeBtn.classList.add('active');
    singleModeBtn.classList.remove('bg-gray-50', 'text-gray-700');
    batchModeBtn.classList.remove('active');
    batchModeBtn.classList.add('bg-gray-50', 'text-gray-700');
    batchSettings.classList.add('hidden');
    singleSettings.classList.remove('hidden');
    processBatchBtn.classList.add('hidden');
    processSingleBtn.classList.remove('hidden');
    resetResults();
});

// ===== 批次大小選擇 =====
batchSizeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
        customBatchInput.classList.remove('hidden');
        customBatchInput.focus();
    } else {
        customBatchInput.classList.add('hidden');
    }
});

// ===== 修正 8：批次大小驗證 =====
customBatchInput.addEventListener('blur', () => {
    const val = parseInt(customBatchInput.value);
    const errorEl = document.getElementById('batchValidationError');
    
    if (val < 1 || val > 50 || isNaN(val)) {
        errorEl.textContent = i18n.t('ui.preprocessing.invalid_batch_size');
        errorEl.classList.remove('hidden');
        customBatchInput.value = 5;
    } else {
        errorEl.classList.add('hidden');
    }
});

// ===== 檔案拖放事件 =====
if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', e => {
        handleFiles(e.target.files);
    });
} else {
    console.error('dropZone 或 fileInput 元素未找到，請檢查 HTML 是否正確載入');
}

// ===== 修正 7：清除時隱藏配置面板和前處理選項 =====
clearBtn.addEventListener('click', () => {
    fileInput.value = '';
    selectedFile = null;
    resetState();
    configPanel.classList.add('hidden');
    // 確保前處理選項也被隱藏
    if (imagePreprocessSection) {
        imagePreprocessSection.classList.add('hidden');
    }
    if (pdfPreprocessSection) {
        pdfPreprocessSection.classList.add('hidden');
    }
    if (pdfModeSection) {
        pdfModeSection.classList.add('hidden');
    }
});

// ===== 頁面選擇器 =====
pageSelector.addEventListener('change', () => {
    const page = parseInt(pageSelector.value);
    if (page) selectPage(page);
});

// ===== 獲取批次大小 =====
function getCurrentBatchSize() {
    if (batchSizeSelect.value === 'custom') {
        const val = parseInt(customBatchInput.value) || 1;
        return Math.max(1, Math.min(val, 50));
    }
    return parseInt(batchSizeSelect.value) || 2;
}

// ===== 選擇頁面 =====
function selectPage(pageNum) {
    pageSelector.value = pageNum;
    loadPagePreview(pageNum);
}

// ===== 載入處理後的視頻截圖預覽 =====
async function loadProcessedVideoFramePreview(frameNumber) {
    if (!isVideoPreprocessMode || !processedVideoFrames || processedVideoFrames.length === 0) return;
    
    const processedFrame = processedVideoFrames.find(item => item.frame === frameNumber);
    if (processedFrame && processedFrame.processed_path) {
        try {
            // 將完整路徑轉換為可訪問的URL
            let fileUrl = processedFrame.processed_path;
            if (fileUrl.includes('processed')) {
                const processedIndex = fileUrl.indexOf('processed');
                const beforeProcessed = fileUrl.substring(0, processedIndex - 1);
                const taskDir = beforeProcessed.split('/').pop();
                const afterProcessed = fileUrl.substring(processedIndex);
                fileUrl = `/api/files/${taskDir}/${afterProcessed}`;
            }
            
            // 載入處理後的完整圖片
            const response = await fetch(fileUrl);
            if (response.ok) {
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onload = e => {
                    previewImage.src = e.target.result;
                    preview.classList.remove('hidden');
                    currentZoom = 1;
                    previewImage.style.transform = 'scale(1)';
                };
                reader.readAsDataURL(blob);
                return;
            }
        } catch (err) {
            console.warn('無法載入處理後的視頻截圖:', err);
        }
    }
}

// ===== 載入頁面預覽 =====
async function loadPagePreview(pageNumber) {
    // ===== 修正：如果視頻截圖已前處理，使用處理後的圖片 =====
    if (isVideoPreprocessMode && pdfPreprocessed && processedVideoFrames && processedVideoFrames.length > 0) {
        await loadProcessedVideoFramePreview(pageNumber);
        return;
    }
    
    if (!currentTaskId) return;
    
    // ===== 修正：如果PDF已前處理，使用處理後的圖片 =====
    if (pdfPreprocessed && processedPdfThumbnails && processedPdfThumbnails.length > 0) {
        const processedPage = processedPdfThumbnails.find(item => item.page === pageNumber);
        if (processedPage && processedPage.processed_path) {
            try {
                // 將完整路徑轉換為可訪問的URL
                let fileUrl = processedPage.processed_path;
                if (fileUrl.includes('processed')) {
                    const processedIndex = fileUrl.indexOf('processed');
                    const beforeProcessed = fileUrl.substring(0, processedIndex - 1);
                    const taskDir = beforeProcessed.split('/').pop();
                    const afterProcessed = fileUrl.substring(processedIndex);
                    fileUrl = `/api/files/${taskDir}/${afterProcessed}`;
                }
                
                // 載入處理後的完整圖片
                const response = await fetch(fileUrl);
                if (response.ok) {
                    const blob = await response.blob();
                    const reader = new FileReader();
                    reader.onload = e => {
                        previewImage.src = e.target.result;
                        preview.classList.remove('hidden');
                        currentZoom = 1;
                        previewImage.style.transform = 'scale(1)';
                    };
                    reader.readAsDataURL(blob);
                    return;
                }
            } catch (err) {
                console.warn('無法載入處理後的圖片，使用原始PDF預覽:', err);
                // 繼續使用原始PDF預覽
            }
        }
    }
    
    try {
        const res = await fetch('/api/pdf/preview-page', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task_id: currentTaskId,
                page_number: pageNumber
            })
        });
        
        const data = await res.json();
        
        if (data.success) {
            previewImage.src = data.image;
            preview.classList.remove('hidden');
            currentZoom = 1;
            previewImage.style.transform = 'scale(1)';
        }
    } catch (err) {
 showError(i18n.t('errors.file.not_found') + ': ' + err.message);
    }
}

// ===== 處理上傳的檔案 =====
function handleFiles(files) {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    if (!['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'].includes(file.type)) {
        showError(null, 'file.invalid_format');
        return;
    }
    
    selectedFile = file;
    resetState();
    
    // 重置前處理狀態
    imagePreprocessed = false;
    pdfPreprocessed = false;
    processedImageFile = null;
    processedPdfThumbnails = [];
    isPdfPreprocessMode = false;  // 重置PDF前處理模式標記

    if (file.type === 'application/pdf') {
        // PDF 流程：顯示PDF模式選擇 + 前處理選項（不立即初始化PDF）
        pdfModeSection.classList.remove('hidden');
        pdfPreprocessSection.classList.remove('hidden'); // 顯示PDF前處理選項
        imagePreprocessSection.classList.add('hidden'); // 隱藏圖片前處理選項
        configPanel.classList.add('hidden'); // 先不顯示OCR配置
        processImageBtn.classList.add('hidden');
        processBatchBtn.classList.add('hidden');
        processSingleBtn.classList.add('hidden');
        thumbnailsContainer.classList.add('hidden'); // 不立即顯示縮圖
        // 注意：不調用 initPDFPages()，等待用戶選擇前處理
    } else {
        // 圖片流程：顯示預覽 + 前處理選項
        pdfModeSection.classList.add('hidden');
        pdfPreprocessSection.classList.add('hidden'); // 隱藏PDF前處理選項
        imagePreprocessSection.classList.remove('hidden'); // 顯示圖片前處理選項
        configPanel.classList.add('hidden'); // 先不顯示OCR配置
        processBatchBtn.classList.add('hidden');
        processSingleBtn.classList.add('hidden');
        processImageBtn.classList.add('hidden'); // 先不顯示執行按鈕

        // 顯示圖片預覽
        const reader = new FileReader();
        reader.onload = e => {
            previewImage.src = e.target.result;
            preview.classList.remove('hidden');
            currentZoom = 1;
            previewImage.style.transform = 'scale(1)';
        };
        reader.readAsDataURL(file);
    }
}

// ===== 初始化 PDF 頁面 =====
async function initPDFPages(file) {
    showLoading(i18n.t('messages.pdf.loading'));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('content_type', currentMode);
    formData.append('subcategory', currentSubcategory);
    formData.append('complexity', currentComplexity);

    try {
        const res = await fetch('/api/pdf/init', {
            method: 'POST',
            body: formData
        });
        
        const data = await res.json();
        hideLoading();

        if (!data.success) {
            showError(data.error || i18n.t('errors.file.upload_failed'));
            return;
        }

        currentTaskId = data.task_id;
        totalPages = data.total_pages;

        // 生成頁面選擇選項
        pageSelector.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = i18n.t('ui.pdf.page_number', { page: i });
            pageSelector.appendChild(opt);
        }

        // 生成縮圖
        if (thumbnailsGrid) {
            thumbnailsGrid.innerHTML = '';
            data.thumbnails.forEach((b64, idx) => {
                const div = document.createElement('div');
                div.className = 'thumbnail-item';
                div.innerHTML = `<img src="${b64}" title="${i18n.t('ui.pdf.page_number', { page: idx + 1 })}">`;
                
                // === 修正 5：縮圖選擇視覺反饋 ===
                div.addEventListener('click', () => {
                    document.querySelectorAll('.thumbnail-item').forEach(el => {
                        el.classList.remove('selected');
                    });
                    div.classList.add('selected');
                    selectPage(idx + 1);
                });
                
                thumbnailsGrid.appendChild(div);
            });
        }
        
        thumbnailsContainer.classList.remove('hidden');
        selectPage(1);
        batchBtnText.innerText = i18n.t('ui.pdf.batch_with_count', { count: totalPages });
        processBatchBtn.disabled = false;
        processSingleBtn.disabled = false;

    } catch (err) {
        hideLoading();
        showError(i18n.t('errors.file.upload_failed') + '：' + err.message);
    }
}
// ===== Part 2: OCR 識別邏輯 =====

// ===== 圖片識別按鈕 =====
processImageBtn.addEventListener('click', async () => {
    if (!selectedFile) return;
    
    processImageBtn.disabled = true;
    imageBtnText.innerText = i18n.t('loading.processing');
    showLoading(i18n.t('messages.ocr.processing'));
    resetResults();

    const formData = new FormData();
    // 如果已前處理，使用處理後的圖片；否則使用原始圖片
    const fileToUse = imagePreprocessed && processedImageFile ? processedImageFile : selectedFile;
    formData.append('file', fileToUse);
    formData.append('content_type', currentMode);
    formData.append('subcategory', currentSubcategory);
    formData.append('complexity', currentComplexity);

    try {
        const res = await fetch('/api/ocr', {
            method: 'POST',
            body: formData
        });
        
        const data = await res.json();
        hideLoading();

        if (data.success) {
            displaySingleResult(
                `${currentMode} / ${currentSubcategory} / ${currentComplexity}`,
                data.text
            );
        } else {
            showError(data.error);
        }
    } catch (err) {
        hideLoading();
        showError(err.message);
    } finally {
        processImageBtn.disabled = false;
        imageBtnText.innerText = i18n.t('ui.buttons.start_recognition');
    }
});

// ===== 批次處理按鈕 =====
processBatchBtn.addEventListener('click', () => {
    currentBatchIndex = 0;
    stopProcessing = false;
    resetResults();
    processBatch();
});

// ===== 批次處理邏輯 =====
async function processBatch() {
    // ===== 修正：支持視頻截圖批次處理（不需要currentTaskId） =====
    // 檢測視頻截圖模式：已前處理或未前處理但有多張圖片
    const isVideoModePreprocessed = isVideoPreprocessMode && processedVideoFrames && processedVideoFrames.length > 0;
    const isVideoModeUnprocessed = isVideoPreprocessMode && preprocessFiles && preprocessFiles.length > 1 && (!processedVideoFrames || processedVideoFrames.length === 0);
    const isVideoMode = isVideoModePreprocessed || isVideoModeUnprocessed;
    
    if (stopProcessing || (!currentTaskId && !isVideoMode)) return;

    const batchSize = getCurrentBatchSize();
    const startPage = currentBatchIndex * batchSize + 1;
    const endPage = Math.min((currentBatchIndex + 1) * batchSize, totalPages);
    
    const loadingText = isVideoMode ? `${i18n.t('loading.processing')} (${startPage}~${endPage} ${i18n.t('messages.units.frames')})` : `${i18n.t('loading.processing')} (${startPage}~${endPage} ${i18n.t('messages.units.pages')})`;
    showLoading(loadingText);

    try {
        // ===== 修正：如果視頻截圖未前處理，先上傳所有圖片獲取路徑 =====
        if (isVideoModeUnprocessed) {
            console.log(`📤 視頻截圖未前處理模式：先上傳 ${preprocessFiles.length} 張圖片到服務器`);
            
            // 一次性上傳所有圖片到服務器
            const formData = new FormData();
            preprocessFiles.forEach(file => {
                formData.append('files', file);
            });
            
            const uploadResponse = await fetch('/api/preprocess/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json().catch(() => ({ error: i18n.t('errors.file.upload_failed') }));
                throw new Error(errorData.error || `${i18n.t('errors.file.upload_failed')}: HTTP ${uploadResponse.status}`);
            }
            
            const uploadData = await uploadResponse.json();
            if (!uploadData.success || !uploadData.images) {
                throw new Error(i18n.t('errors.file.upload_failed') + '：服務器返回無效數據');
            }
            
            // 將上傳的路徑映射到截圖編號
            const uploadedPaths = {};
            uploadData.images.forEach((imageData, index) => {
                // 從文件名提取截圖編號（frame_1.jpg -> 1）
                const frameMatch = imageData.filename.match(/frame_(\d+)\.jpg/);
                const frameNum = frameMatch ? parseInt(frameMatch[1]) : (index + 1);
                uploadedPaths[String(frameNum)] = imageData.raw_path;
                console.log(`✅ 已上傳截圖 ${frameNum}: ${imageData.raw_path}`);
            });
            
            // 將上傳的路徑保存到 processedVideoFrames（用於後續批次處理）
            processedVideoFrames = Object.keys(uploadedPaths).map(frameNum => ({
                frame: parseInt(frameNum),
                processed_path: uploadedPaths[frameNum],
                filename: preprocessFiles[parseInt(frameNum) - 1]?.name || `frame_${frameNum}.jpg`
            })).sort((a, b) => a.frame - b.frame);
            
            console.log(`✅ 已上傳所有截圖，共 ${processedVideoFrames.length} 張`);
        }
        
        // ===== 修正：如果視頻截圖已前處理，傳遞處理後的圖片路徑 =====
        const requestBody = {
            task_id: currentTaskId || 'video_frames', // 視頻截圖使用虛擬task_id
            batch_index: currentBatchIndex,
            batch_size: batchSize
        };
        
        // 如果視頻截圖已前處理或已上傳，傳遞圖片路徑映射
        if (isVideoMode && processedVideoFrames && processedVideoFrames.length > 0) {
            const processedImagesMap = {};
            processedVideoFrames.forEach(item => {
                // 確保使用字符串鍵，與後端一致
                processedImagesMap[String(item.frame)] = item.processed_path;
            });
            requestBody.processed_images = processedImagesMap;
            // 視頻截圖需要傳遞配置參數
            requestBody.content_type = currentMode;
            requestBody.subcategory = currentSubcategory;
            requestBody.complexity = currentComplexity;
            console.log(`📤 視頻截圖批次處理：傳遞 ${Object.keys(processedImagesMap).length} 張截圖:`, Object.keys(processedImagesMap).map(k => `截圖${k}`).join(', '));
        }
        // 如果PDF已前處理，傳遞處理後的圖片路徑映射
        else if (pdfPreprocessed && processedPdfThumbnails && processedPdfThumbnails.length > 0) {
            const processedImagesMap = {};
            processedPdfThumbnails.forEach(item => {
                // 確保使用字符串鍵，與後端一致
                processedImagesMap[String(item.page)] = item.processed_path;
            });
            requestBody.processed_images = processedImagesMap;
            console.log(`📤 批次處理：傳遞 ${Object.keys(processedImagesMap).length} 張前處理圖片:`, Object.keys(processedImagesMap).map(k => `頁${k}`).join(', '));
        } else {
            console.log('⚠️ 未前處理或前處理結果為空，使用原始文件');
        }
        
        // ===== 修正：視頻截圖使用專用端點，PDF使用原有端點 =====
        const apiEndpoint = isVideoMode ? '/api/video/process-batch' : '/api/pdf/process-batch';
        
        const res = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        // 檢查響應狀態
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
            hideLoading();
            console.error('❌ 批次處理失敗:', errorData);
            showError(errorData.error ? null : 'errors.processing.ocr_failed', errorData.error ? null : 'errors.processing.ocr_failed', errorData.error ? {} : {});
            return;
        }
        
        const data = await res.json();
        hideLoading();

        if (!data.success) {
            showError(data.error ? null : 'errors.batch_failed', data.error ? null : 'errors.batch_failed');
            return;
        }

        // 顯示結果
        data.results.forEach(r => {
            displayPageResult(r.page, r.text);
        });

        const processed = data.processed_pages;
        
        // === 修正 10：使用預定義進度條結構 ===
        document.getElementById('progressCurrent').textContent = processed;
        document.getElementById('progressTotal').textContent = totalPages;
        document.getElementById('progressBar').style.width = 
            `${(processed / totalPages * 100).toFixed(1)}%`;
        document.getElementById('progressConfig').textContent = 
            `${i18n.t('ui.results.config')}: ${currentMode} / ${currentSubcategory} / ${currentComplexity}`;
        progressInfo.classList.remove('hidden');

        if (data.has_more) {
            currentBatchIndex = data.next_batch_index;
            batchControls.classList.remove('hidden');
            batchBtnText.innerText = i18n.t('ui.buttons.continue_processing', { processed: processed, total: totalPages });
            downloadBtn.classList.remove('hidden');
        } else {
            finishBatch();
        }
    } catch (err) {
        hideLoading();
        showError(err.message);
    }
}

// ===== 單頁識別按鈕 =====
processSingleBtn.addEventListener('click', async () => {
    const page = parseInt(pageSelector.value);
    if (!page || !currentTaskId) return;

    processSingleBtn.disabled = true;
    singleBtnText.innerText = i18n.t('messages.ocr.processing');
    showLoading(i18n.t('messages.ocr.processing_page', { current: page, total: totalPages }));
    resetResults();

    try {
        // ===== 修正：如果PDF已前處理，傳遞處理後的圖片路徑 =====
        const requestBody = {
            task_id: currentTaskId,
            batch_index: page - 1,
            batch_size: 1
        };
        
        // 如果PDF已前處理，傳遞處理後的圖片路徑映射
        if (pdfPreprocessed && processedPdfThumbnails && processedPdfThumbnails.length > 0) {
            const processedImagesMap = {};
            processedPdfThumbnails.forEach(item => {
                // 確保使用字符串鍵，與後端一致
                processedImagesMap[String(item.page)] = item.processed_path;
            });
            requestBody.processed_images = processedImagesMap;
            console.log(`📤 單頁處理：傳遞頁 ${page} 的前處理圖片:`, processedImagesMap[String(page)]);
        } else {
            console.log('⚠️ PDF未前處理或前處理結果為空，使用原始PDF');
        }
        
        const res = await fetch('/api/pdf/process-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        const data = await res.json();
        hideLoading();

        if (data.success && data.results[0]) {
            displayPageResult(page, data.results[0].text);
            successDiv.classList.remove('hidden');
            copyBtn.classList.remove('hidden');
            downloadBtn.classList.remove('hidden');
        } else {
            showError(data.error || i18n.t('errors.recognition_failed'));
        }
    } catch (err) {
        hideLoading();
        showError(err.message);
    } finally {
        processSingleBtn.disabled = false;
        singleBtnText.innerText = i18n.t('ui.buttons.recognize_page');
    }
});

// ===== 顯示單頁結果 =====
function displayPageResult(pageNum, text) {
    const div = document.createElement('div');
    div.className = 'mb-6 p-5 bg-white rounded-xl shadow-md border-l-4 border-purple-500';
    div.innerHTML = `
        <div class="flex justify-between items-center mb-3">
            <h3 class="text-lg font-bold text-purple-700">${i18n.t('ui.results.page_label', { page: pageNum })}</h3>
            <span class="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">${i18n.t('ui.results.char_count', { count: text.length })}</span>
        </div>
        <pre class="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-mono bg-gray-50 p-4 rounded-lg overflow-x-auto">${text}</pre>
    `;
    resultDiv.appendChild(div);
}

// ===== 顯示單個結果 =====
function displaySingleResult(title, text) {
    resultDiv.innerHTML = `
        <div class="p-5 bg-white rounded-xl shadow-md border-l-4 border-blue-500">
            <h3 class="text-lg font-bold text-blue-700 mb-3">${title}</h3>
            <pre class="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-mono bg-gray-50 p-4 rounded-lg">${text}</pre>
        </div>`;
    successDiv.classList.remove('hidden');
    copyBtn.classList.remove('hidden');
    downloadBtn.classList.remove('hidden');
}

// ===== 完成批次 =====
function finishBatch() {
    successMessage.textContent = i18n.t('ui.pdf.batch_complete', { count: totalPages });
    successDiv.classList.remove('hidden');
    copyBtn.classList.remove('hidden');
    downloadBtn.classList.remove('hidden');
    batchControls.classList.add('hidden');
    batchBtnText.innerText = i18n.t('ui.buttons.batch_completed');
    processBatchBtn.disabled = false;
    cleanupTask();
}

// ===== 繼續下一批 =====
continueBtn.addEventListener('click', () => {
    processBatch();
});

// ===== 停止批次 =====
stopBtn.addEventListener('click', () => {
    stopProcessing = true;
    batchControls.classList.add('hidden');
    hideLoading();
    batchBtnText.innerText = i18n.t('ui.buttons.batch_stopped');
    processBatchBtn.disabled = false;
    downloadBtn.classList.remove('hidden');
});

// ===== 複製結果 =====
copyBtn.addEventListener('click', () => {
    const texts = Array.from(resultDiv.querySelectorAll('pre'))
        .map(pre => pre.textContent);
    const fullText = texts
        .map((t, i) => `=== 第 ${i + 1} 頁 ===\n${t}`)
        .join('\n\n');
    
    navigator.clipboard.writeText(fullText).then(() => {
        const orig = copyBtn.innerHTML;
        copyBtn.innerHTML = i18n.t('ui.copy.success');
        setTimeout(() => {
            copyBtn.innerHTML = orig;
        }, 2000);
    }).catch(err => {
 showError(err.message, 'copy.error');
    });
});

// ===== 下載結果 =====
downloadBtn.addEventListener('click', () => {
    const texts = Array.from(resultDiv.querySelectorAll('pre'))
        .map(pre => pre.textContent);
    const fullText = texts
        .map((t, i) => `=== 第 ${i + 1} 頁 ===\n${t}`)
        .join('\n\n');
    
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `OCR_結果_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
});

// ===== 重置狀態 =====
function resetState() {
    cleanupTask();
    currentTaskId = null;
    currentBatchIndex = 0;
    totalPages = 0;
    stopProcessing = false;
    thumbnailsGrid.innerHTML = '';
    thumbnailsContainer.classList.add('hidden');
    preview.classList.add('hidden');
    resultDiv.innerHTML = `<p class="text-gray-400 text-center mt-20">${i18n.t('results.default_text')}</p>`;
    
    // ===== 修正：重置時隱藏前處理選項 =====
    if (imagePreprocessSection) {
        imagePreprocessSection.classList.add('hidden');
    }
    if (pdfPreprocessSection) {
        pdfPreprocessSection.classList.add('hidden');
    }
    if (pdfModeSection) {
        pdfModeSection.classList.add('hidden');
    }
    
    [successDiv, errorDiv, progressInfo, batchControls, copyBtn, downloadBtn]
        .forEach(el => el.classList.add('hidden'));
    
    processBatchBtn.disabled = true;
    processSingleBtn.disabled = true;
    
    // ===== 修正：重置PDF前處理模式標記 =====
    isPdfPreprocessMode = false;
}

// ===== 重置結果 =====
function resetResults() {
    resultDiv.innerHTML = `<p class="text-gray-400 text-center mt-20">${i18n.t('results.default_text')}</p>`;
    [successDiv, errorDiv, progressInfo, batchControls, copyBtn, downloadBtn]
        .forEach(el => el.classList.add('hidden'));
}

// ===== 清理任務 =====
function cleanupTask() {
    if (currentTaskId) {
        fetch('/api/pdf/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task_id: currentTaskId })
        }).catch(() => {});
    }
}

// ===== Tab 切換狀態管理 =====
// 切換到 OCR Tab 時清理影片相關狀態
function switchToOcrTab() {
    // 清理影片相關狀態變數
    videoFile = null;
    extractedFrames = [];
    
    // 清理影片相關 UI（如果存在）
    if (videoFileInput) {
        videoFileInput.value = '';
    }
    if (framesPreview) {
        framesPreview.classList.add('hidden');
        // ===== 修正：不清空 innerHTML，保留 framesGrid DOM 結構 =====
        // 只清空 framesGrid 的內容，而不是整個 framesPreview
        if (framesGrid) {
            framesGrid.innerHTML = '';
        }
    }
    if (downloadFramesBtn) {
        downloadFramesBtn.classList.add('hidden');
    }
    
    // 注意：不清理前處理相關狀態（preprocessFiles），因為OCR可能會用到前處理結果
    // 但清理前處理Tab專用的UI元素
    if (preprocessPreview) {
        preprocessPreview.classList.add('hidden');
    }
    
    // ===== 修正3：切換回OCR Tab時，檢查文件狀態（包含從前處理Tab發送的文件） =====
    // 檢查 fileInput.value（用戶在OCR Tab上傳）或 selectedFile（從前處理Tab發送）
    const hasFileInOcrTab = (fileInput && fileInput.value && fileInput.value !== '') || selectedFile;
    
    if (!hasFileInOcrTab) {
        // OCR Tab中沒有文件：隱藏所有前處理選項和配置面板
        if (imagePreprocessSection) {
            imagePreprocessSection.classList.add('hidden');
        }
        if (pdfPreprocessSection) {
            pdfPreprocessSection.classList.add('hidden');
        }
        if (pdfModeSection) {
            pdfModeSection.classList.add('hidden');
        }
        if (configPanel) {
            configPanel.classList.add('hidden');
        }
        // 清理文件狀態（如果沒有在OCR Tab中上傳文件，且沒有從前處理Tab發送的文件）
        selectedFile = null;
        console.log('📋 OCR Tab中沒有文件，已隱藏前處理選項');
    } else {
        // OCR Tab中有文件：根據文件類型顯示對應的前處理選項
        // 如果 selectedFile 存在，需要根據文件類型顯示對應的UI
        if (selectedFile) {
            if (selectedFile.type === 'application/pdf') {
                // PDF文件：顯示PDF模式選擇
                if (pdfModeSection) {
                    pdfModeSection.classList.remove('hidden');
                }
                // 如果PDF已前處理，顯示縮圖；否則顯示前處理選項
                if (pdfPreprocessed && processedPdfThumbnails.length > 0) {
                    if (thumbnailsContainer) {
                        thumbnailsContainer.classList.remove('hidden');
                    }
                    if (configPanel) {
                        configPanel.classList.remove('hidden');
                    }
                } else {
                    if (pdfPreprocessSection) {
                        pdfPreprocessSection.classList.remove('hidden');
                    }
                }
            } else {
                // 圖片文件：顯示圖片預覽和前處理選項
                if (imagePreprocessed && processedImageFile) {
                    // 已前處理：顯示配置面板
                    if (configPanel) {
                        configPanel.classList.remove('hidden');
                    }
                    if (processImageBtn) {
                        processImageBtn.classList.remove('hidden');
                    }
                } else {
                    // 未前處理：顯示前處理選項
                    if (imagePreprocessSection) {
                        imagePreprocessSection.classList.remove('hidden');
                    }
                }
            }
        }
        console.log('📋 OCR Tab有文件，前處理選項狀態已更新');
    }
    
    // 顯示 OCR 結果顯示區域（影片截圖不使用此區域）
    if (resultDiv) {
        resultDiv.classList.remove('hidden');
        resultDiv.innerHTML = `<p class="text-gray-400 text-center mt-20">${i18n.t('results.default_text')}</p>`;
    }
    if (resultTitle) {
        resultTitle.classList.remove('hidden');
    }
    
    console.log('✅ 已切換到 OCR Tab，影片狀態已清理，OCR結果區域已顯示');
}

// 切換到影片 Tab 時清理 OCR/前處理相關狀態
function switchToVideoTab() {
    // 清理 OCR/前處理相關狀態變數
    selectedFile = null;
    currentTaskId = null;
    totalPages = 0;
    currentBatchIndex = 0;
    stopProcessing = false;
    // ===== 修正2：不清理 preprocessFiles，因為前處理Tab可能還在獨立使用 =====
    // preprocessFiles = [];  // 移除：保留前處理Tab的文件狀態
    
    // 清理 OCR 前處理相關狀態（但保留前處理Tab的獨立狀態）
    imagePreprocessed = false;
    pdfPreprocessed = false;
    processedImageFile = null;
    processedPdfThumbnails = [];
    isPdfPreprocessMode = false;  // 清除PDF前處理模式標記
    
    // 清理 OCR 相關 UI
    if (fileInput) {
        fileInput.value = '';
    }
    if (preview) {
        preview.classList.add('hidden');
    }
    if (thumbnailsContainer) {
        thumbnailsContainer.classList.add('hidden');
    }
    if (thumbnailsGrid) {
        thumbnailsGrid.innerHTML = '';
    }
    if (pdfModeSection) {
        pdfModeSection.classList.add('hidden');
    }
    if (configPanel) {
        configPanel.classList.add('hidden');
    }
    if (imagePreprocessSection) {
        imagePreprocessSection.classList.add('hidden');
    }
    if (pdfPreprocessSection) {
        pdfPreprocessSection.classList.add('hidden');
    }
    
    // 隱藏 OCR 結果顯示區域（影片截圖完全獨立，不使用OCR結果區域）
    if (resultDiv) {
        resultDiv.innerHTML = '';
        resultDiv.classList.add('hidden');
    }
    if (resultTitle) {
        resultTitle.classList.add('hidden');
    }
    
    // 隱藏 OCR 相關按鈕和控件
    [successDiv, errorDiv, progressInfo, batchControls, copyBtn, downloadBtn,
     processBatchBtn, processSingleBtn, processImageBtn]
        .forEach(el => {
            if (el) {
                el.classList.add('hidden');
                if (el.disabled !== undefined) {
                    el.disabled = true;
                }
            }
        });
    
    // 取消正在進行的 PDF 任務
    cleanupTask();
    
    // ===== 修正：初始化影片截圖相關 UI 狀態 =====
    // 確保 framesPreview 處於正確的初始狀態（隱藏，等待新內容）
    if (framesPreview) {
        framesPreview.classList.add('hidden');
        // 注意：不清空 innerHTML，因為 framesGrid 需要保留 DOM 結構
    }
    // 清空 framesGrid 內容，準備顯示新的截圖
    if (framesGrid) {
        framesGrid.innerHTML = '';
    }
    // 重置影片相關狀態變數
    videoFile = null;
    extractedFrames = [];
    currentVideoTaskId = null;
    // 重置影片相關按鈕狀態
    if (videoFileInput) {
        videoFileInput.value = '';
    }
    if (extractFramesBtn) {
        extractFramesBtn.classList.add('hidden');
    }
    if (downloadFramesBtn) {
        downloadFramesBtn.classList.add('hidden');
    }
    if (document.getElementById('videoInfo')) {
        document.getElementById('videoInfo').classList.add('hidden');
    }
    if (document.getElementById('videoSettings')) {
        document.getElementById('videoSettings').classList.add('hidden');
    }
    
    console.log('✅ 已切換到影片 Tab，OCR/前處理狀態已清理，影片截圖 UI 已初始化');
}

// 切換到前處理 Tab 時清理 OCR/影片相關狀態
function switchToPreprocessTab() {
    // ===== 修正1 & 4：PDF前處理模式檢測（使用標記或狀態檢查） =====
    // 優先使用 isPdfPreprocessMode 標記，如果沒有則檢查狀態
    const isPdfPreprocess = isPdfPreprocessMode || (selectedFile && selectedFile.type === 'application/pdf' && currentTaskId);
    
    if (!isPdfPreprocess) {
        // 非PDF前處理：清理 OCR 相關狀態（保留前處理專用狀態 preprocessFiles）
        selectedFile = null;
        currentTaskId = null;
        totalPages = 0;
        // 非PDF前處理才需要清理任務
        cleanupTask();
    } else {
        // PDF前處理：保留 selectedFile、currentTaskId 和 totalPages，但清理其他狀態
        // ⚠️ 重要：不要調用 cleanupTask()，因為PDF任務需要保留用於後續OCR處理
        console.log(`📋 PDF前處理模式：保留 selectedFile、currentTaskId (${currentTaskId}) 和 totalPages (${totalPages})`);
    }
    
    currentBatchIndex = 0;
    stopProcessing = false;
    
    // ===== 修正1：PDF前處理模式下，保留已處理的狀態 =====
    if (!isPdfPreprocess) {
        // 非PDF前處理：清理 OCR 前處理相關狀態
        imagePreprocessed = false;
        pdfPreprocessed = false;
        processedImageFile = null;
        processedPdfThumbnails = [];
    } else {
        // PDF前處理：保留 pdfPreprocessed 和 processedPdfThumbnails（如果已處理）
        // 只清理圖片前處理相關狀態
        imagePreprocessed = false;
        processedImageFile = null;
        // 保留 pdfPreprocessed 和 processedPdfThumbnails
        console.log(`📋 PDF前處理模式：保留 pdfPreprocessed=${pdfPreprocessed}, processedPdfThumbnails.length=${processedPdfThumbnails.length}`);
    }
    
    // 注意：不清理 preprocessResults 和 currentPreprocessTaskId，因為前處理Tab可能需要這些數據
    
    // 清理影片相關狀態
    videoFile = null;
    extractedFrames = [];
    currentVideoTaskId = null;
    
    // 清理 OCR 相關 UI
    if (preview) {
        preview.classList.add('hidden');
    }
    if (thumbnailsContainer) {
        thumbnailsContainer.classList.add('hidden');
    }
    if (pdfModeSection) {
        pdfModeSection.classList.add('hidden');
    }
    if (imagePreprocessSection) {
        imagePreprocessSection.classList.add('hidden');
    }
    if (pdfPreprocessSection) {
        pdfPreprocessSection.classList.add('hidden');
    }
    
    // 清理影片相關 UI
    if (framesPreview) {
        framesPreview.classList.add('hidden');
    }
    
    // 清理結果顯示區域
    if (resultDiv) {
        resultDiv.classList.remove('hidden');
        resultDiv.innerHTML = `<p class="text-gray-400 text-center mt-20">${i18n.t('ui.preprocessing.results_placeholder')}</p>`;
    }
    if (resultTitle) {
        resultTitle.classList.remove('hidden');
    }
    
    // ===== 修正：PDF前處理模式下，確保前處理按鈕狀態正確 =====
    if (processPreprocessBtn && preprocessFiles && preprocessFiles.length > 0) {
        const isPdfPreprocess = isPdfPreprocessMode || (selectedFile && selectedFile.type === 'application/pdf' && currentTaskId);
        const isVideoPreprocess = isVideoPreprocessMode && preprocessFiles.length > 0;
        
        if (isPdfPreprocess || isVideoPreprocess) {
            // PDF/影片前處理模式：啟用按鈕
            processPreprocessBtn.classList.remove('hidden');
            processPreprocessBtn.disabled = false;
            console.log('✅ PDF/影片前處理模式：已確保前處理按鈕啟用');
        }
    }
    
    console.log('✅ 已切換到前處理 Tab，OCR/影片狀態已清理');
}
// ===== Part 3: 照片前處理邏輯 =====

// ===== 照片前處理 - 拖放事件 =====
// ===== 注意：獨立前處理Tab已凍結，此處的事件處理已禁用 =====
if (preprocessDropZone && preprocessFileInput) {
    preprocessDropZone.addEventListener('click', () => {
        // ===== 檢查文件輸入是否禁用（獨立前處理Tab已凍結） =====
        if (preprocessFileInput.disabled) {
            return; // 如果禁用，不執行任何操作
        }
        preprocessFileInput.click();
    });

    preprocessDropZone.addEventListener('dragover', e => {
        // ===== 檢查文件輸入是否禁用 =====
        if (preprocessFileInput.disabled) {
            return; // 如果禁用，不執行任何操作
        }
        e.preventDefault();
        preprocessDropZone.classList.add('dragover');
    });

    preprocessDropZone.addEventListener('dragleave', () => {
        // ===== 檢查文件輸入是否禁用 =====
        if (preprocessFileInput.disabled) {
            return; // 如果禁用，不執行任何操作
        }
        preprocessDropZone.classList.remove('dragover');
    });

    preprocessDropZone.addEventListener('drop', e => {
        // ===== 檢查文件輸入是否禁用 =====
        if (preprocessFileInput.disabled) {
            e.preventDefault();
            return; // 如果禁用，不執行任何操作
        }
        e.preventDefault();
        preprocessDropZone.classList.remove('dragover');
        handlePreprocessFiles(e.dataTransfer.files);
    });

    preprocessFileInput.addEventListener('change', e => {
        // ===== 檢查文件輸入是否禁用 =====
        if (preprocessFileInput.disabled) {
            return; // 如果禁用，不執行任何操作
        }
        handlePreprocessFiles(e.target.files);
    });
}

// ===== 處理前處理檔案 =====
function handlePreprocessFiles(files) {
    const imageFiles = Array.from(files)
        .filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
        preprocessFiles = imageFiles;
        const preprocessSettingsEl = document.getElementById('preprocessSettings');
        if (preprocessSettingsEl) {
            preprocessSettingsEl.classList.remove('hidden');
        }
        if (processPreprocessBtn) {
            processPreprocessBtn.classList.remove('hidden');
        }
        showPreprocessPreview(imageFiles);
        showLoading(i18n.t('messages.preprocessing.loading'), i18n.t('messages.preprocessing.selected_count', { count: imageFiles.length }));
        setTimeout(() => hideLoading(), 1000);
    }
}

// ===== 顯示前處理預覽 =====
function showPreprocessPreview(files) {
    if (!preprocessImages) return;
    
    preprocessImages.innerHTML = '';
    
    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgDiv = document.createElement('div');
            imgDiv.className = 'text-center';
            imgDiv.innerHTML = `
                <img src="${e.target.result}" class="w-full h-32 object-cover rounded-lg mb-2" alt="${i18n.t('ui.preview.title')}">
                <p class="text-xs text-gray-600 truncate">${file.name}</p>
                <p class="text-xs text-gray-500">${(file.size / 1024).toFixed(1)} KB</p>
            `;
            preprocessImages.appendChild(imgDiv);
        };
        reader.readAsDataURL(file);
    });
    
    if (preprocessPreview) {
        preprocessPreview.classList.remove('hidden');
    }
}

// ===== 執行前處理 =====
if (processPreprocessBtn) {
    processPreprocessBtn.addEventListener('click', async () => {
        // ===== 檢查按鈕是否禁用（獨立前處理Tab已凍結） =====
        if (processPreprocessBtn.disabled) {
            return; // 如果禁用，不執行任何操作
        }
        if (preprocessFiles.length === 0) return;
        
        const settings = getPreprocessSettings();
        showLoading(i18n.t('messages.preprocessing.processing'), i18n.t('messages.preprocessing.loading_hint'));
        
        try {
            // 步骤1：上传文件
            console.log(`📤 開始上傳前處理文件，共 ${preprocessFiles.length} 張圖片`);
            console.log(`📋 文件列表:`, preprocessFiles.map(f => f.name).join(', '));
            
            const uploadFormData = new FormData();
            preprocessFiles.forEach((file, index) => {
                uploadFormData.append('files', file);
                console.log(`  ✅ 添加文件 ${index + 1}/${preprocessFiles.length}: ${file.name} (${file.size} bytes)`);
            });
            
            const uploadResponse = await fetch('/api/preprocess/upload', {
                method: 'POST',
                body: uploadFormData
            });
            
            const uploadData = await uploadResponse.json();
            
            console.log(`📥 上傳響應: success=${uploadData.success}, total_images=${uploadData.total_images}`);
            
            if (!uploadData.success) {
                hideLoading();
                showError(uploadData.error || i18n.t('errors.upload_failed'));
                return;
            }
            
            // 檢查上傳的圖片數量是否與預期一致
            if (uploadData.total_images !== preprocessFiles.length) {
                console.warn(`⚠️ 警告：上傳的圖片數量 (${uploadData.total_images}) 與預期 (${preprocessFiles.length}) 不一致！`);
            }
            
            const taskId = uploadData.task_id;
            
            // 步骤2：处理图片
            const processResponse = await fetch('/api/preprocess/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_id: taskId,
                    settings: settings
                })
            });
            
            const processData = await processResponse.json();
            hideLoading();
            
            if (processData.success) {
                // ===== 修正：保存處理結果和任務ID =====
                preprocessResults = processData.results;
                currentPreprocessTaskId = taskId;
                
                console.log(`✅ 前處理完成，共 ${preprocessResults.length} 張圖片:`, preprocessResults.map(r => r.filename).join(', '));
                
                displayPreprocessResults(processData.results);
                if (downloadPreprocessBtn) {
                    downloadPreprocessBtn.classList.remove('hidden');
                }
                if (sendToOcrBtn) {
                    sendToOcrBtn.classList.remove('hidden');
                    sendToOcrBtn.disabled = false; // ===== 修正：啟用按鈕，允許點擊 =====
                }
                const preprocessProgressEl = document.getElementById('preprocessProgress');
                if (preprocessProgressEl) {
                    preprocessProgressEl.classList.add('hidden');
                }
                
                // 如果是从PDF来的，显示"返回OCR"按钮而不是"发送到OCR"
                if (currentTaskId && selectedFile && selectedFile.type === 'application/pdf') {
                    // 标记PDF已前处理
                    pdfPreprocessed = true;
                    // ===== 修正：立即設置 processedPdfThumbnails，供後續 OCR 使用 =====
                    const processedImagesMap = {};
                    preprocessResults.forEach((result, index) => {
                        if (result.status === 'completed' && result.processed_path) {
                            // 從文件名提取頁面編號（page_1.png -> 1）
                            const pageMatch = result.filename.match(/page_(\d+)\.png/);
                            if (pageMatch) {
                                const pageNum = parseInt(pageMatch[1]);
                                processedImagesMap[pageNum] = {
                                    processed_path: result.processed_path,
                                    processed_thumb_b64: result.processed_thumb_b64
                                };
                                console.log(`✅ 映射頁面 ${pageNum}: ${result.processed_path}`);
                            } else {
                                console.warn(`⚠️ 無法從文件名提取頁面編號: ${result.filename}`);
                            }
                        } else {
                            console.warn(`⚠️ 處理結果未完成或缺少路徑:`, result);
                        }
                    });
                    
                    // 保存到全局變數，供OCR使用
                    processedPdfThumbnails = Object.keys(processedImagesMap).map(pageNum => ({
                        page: parseInt(pageNum),
                        ...processedImagesMap[pageNum]
                    })).sort((a, b) => a.page - b.page);
                    
                    console.log(`✅ PDF前處理完成，共 ${preprocessResults.length} 頁，已設置 processedPdfThumbnails (${processedPdfThumbnails.length} 頁)`);
                    console.log(`📋 處理結果詳情:`, preprocessResults.map((r, i) => ({
                        index: i,
                        filename: r.filename,
                        status: r.status,
                        has_path: !!r.processed_path
                    })));
                    console.log(`📊 processedPdfThumbnails:`, processedPdfThumbnails.map(item => `頁${item.page}`).join(', '));
                }
            } else {
                showError(processData.error || i18n.t('errors.processing_failed', { detail: '' }));
            }
        } catch (error) {
            hideLoading();
            showError(i18n.t('errors.processing_failed', { detail: error.message }));
        }
    });
}

// ===== 獲取前處理設定 =====
function getPreprocessSettings() {
    return {
        auto_rotate: document.getElementById('autoRotate').checked,
        enhance: document.getElementById('enhance').checked,
        remove_shadows: document.getElementById('removeShadows').checked,
        binarize: document.getElementById('binarize').checked,
        remove_bg: document.getElementById('removeBg').checked
    };
}

// ===== 獲取OCR Tab中的圖片前處理設定 =====
function getImagePreprocessSettings() {
    return {
        auto_rotate: document.getElementById('imageAutoRotate')?.checked || false,
        enhance: document.getElementById('imageEnhance')?.checked || false,
        remove_shadows: document.getElementById('imageRemoveShadows')?.checked || false,
        binarize: document.getElementById('imageBinarize')?.checked || false,
        remove_bg: document.getElementById('imageRemoveBg')?.checked || false
    };
}

// ===== 獲取OCR Tab中的PDF前處理設定 =====
function getPdfPreprocessSettings() {
    return {
        auto_rotate: document.getElementById('pdfAutoRotate')?.checked || false,
        enhance: document.getElementById('pdfEnhance')?.checked || false,
        remove_shadows: document.getElementById('pdfRemoveShadows')?.checked || false,
        binarize: document.getElementById('pdfBinarize')?.checked || false,
        remove_bg: document.getElementById('pdfRemoveBg')?.checked || false
    };
}

// ===== 圖片前處理：跳過前處理 =====
if (skipImagePreprocessBtn) {
    skipImagePreprocessBtn.addEventListener('click', () => {
        // 隱藏前處理選項
        if (imagePreprocessSection) {
            imagePreprocessSection.classList.add('hidden');
        }
        
        // 顯示OCR配置
        if (configPanel) {
            configPanel.classList.remove('hidden');
        }
        
        // ===== 修正：如果是視頻截圖模式且有多張圖片，顯示批次處理UI =====
        const isVideoMode = isVideoPreprocessMode && preprocessFiles && preprocessFiles.length > 1;
        
        if (isVideoMode) {
            // 視頻截圖模式：顯示批次處理UI（類似PDF模式）
            console.log(`📋 視頻截圖模式：跳過前處理，顯示批次處理UI（共 ${preprocessFiles.length} 張截圖）`);
            
            // 設置總數
            totalPages = preprocessFiles.length;
            
            // 生成截圖選擇選項
            if (pageSelector) {
                pageSelector.innerHTML = '';
                for (let i = 1; i <= totalPages; i++) {
                    const opt = document.createElement('option');
                    opt.value = i;
                    opt.textContent = i18n.t('ui.video.frame_number', { index: i });
                    pageSelector.appendChild(opt);
                }
            }
            
            // 生成縮圖（使用原始截圖）
            if (thumbnailsGrid && preprocessFiles.length > 0) {
                thumbnailsGrid.innerHTML = '';
                preprocessFiles.forEach((file, idx) => {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const div = document.createElement('div');
                        div.className = 'thumbnail-item';
                        div.innerHTML = `<img src="${e.target.result}" title="${i18n.t('ui.video.frame_number', { index: idx + 1 })}">`;
                        
                        div.addEventListener('click', () => {
                            document.querySelectorAll('.thumbnail-item').forEach(el => {
                                el.classList.remove('selected');
                            });
                            div.classList.add('selected');
                            selectPage(idx + 1);
                        });
                        
                        thumbnailsGrid.appendChild(div);
                    };
                    reader.readAsDataURL(file);
                });
            }
            
            // 顯示批次處理UI
            if (pdfModeSection) {
                pdfModeSection.classList.remove('hidden');
            }
            if (thumbnailsContainer) {
                thumbnailsContainer.classList.remove('hidden');
            }
            if (processBatchBtn) {
                processBatchBtn.classList.remove('hidden');
                processBatchBtn.disabled = false;
                if (batchBtnText) {
                    batchBtnText.innerText = i18n.t('ui.video.batch_with_count', { count: totalPages });
                }
            }
            if (processSingleBtn) {
                processSingleBtn.classList.remove('hidden');
                processSingleBtn.disabled = false;
            }
            
            // 隱藏單張圖片處理按鈕
            if (processImageBtn) {
                processImageBtn.classList.add('hidden');
            }
            
            // 隱藏預覽（批次處理不需要單張預覽）
            preview.classList.add('hidden');
            
            // 標記為PDF批次處理模式（視頻截圖使用相同的批次處理邏輯）
            pdfPreprocessed = false; // 未前處理
            imagePreprocessed = false;
            processedImageFile = null;
            
            console.log(`✅ 已跳過視頻截圖前處理，顯示批次處理UI（共 ${totalPages} 張截圖）`);
        } else {
            // 單張圖片模式：顯示單張圖片處理按鈕
            if (processImageBtn) {
                processImageBtn.classList.remove('hidden');
                processImageBtn.disabled = false;
                if (imageBtnText) {
                    imageBtnText.innerText = i18n.t('ui.buttons.start_recognition');
                }
            }
            
            // 標記未前處理
            imagePreprocessed = false;
            processedImageFile = null;
            
            console.log('✅ 已跳過圖片前處理，直接進入OCR配置');
        }
    });
}

// ===== 圖片前處理：執行前處理 =====
if (executeImagePreprocessBtn) {
    executeImagePreprocessBtn.addEventListener('click', async () => {
        // ===== 修正：檢測是否是視頻截圖前處理模式 =====
        const isVideoMode = isVideoPreprocessMode && preprocessFiles && preprocessFiles.length > 0;
        
        if (!selectedFile && !isVideoMode) {
            showError(null, 'file.not_found');
            return;
        }
        
        const settings = getImagePreprocessSettings();
        
        // 檢查是否有選擇任何選項
        const hasAnyOption = Object.values(settings).some(v => v === true);
        if (!hasAnyOption) {
            showError(null, 'errors.preprocessing.no_options');
            return;
        }
        
        const filesToProcess = isVideoMode ? preprocessFiles : [selectedFile];
        const loadingText = isVideoMode ? `${i18n.t('messages.preprocessing.processing')} (${filesToProcess.length} ${i18n.t('messages.units.images')})` : i18n.t('messages.preprocessing.processing');
        
        showLoading(loadingText, i18n.t('messages.preprocessing.loading_hint'));
        
        try {
            // 步骤1：上传文件
            const uploadFormData = new FormData();
            filesToProcess.forEach(file => {
                uploadFormData.append('files', file);
            });
            
            const uploadResponse = await fetch('/api/preprocess/upload', {
                method: 'POST',
                body: uploadFormData
            });
            
            const uploadData = await uploadResponse.json();
            
            if (!uploadData.success) {
                hideLoading();
                showError(uploadData.error || i18n.t('errors.upload_failed'));
                return;
            }
            
            const taskId = uploadData.task_id;
            currentPreprocessTaskId = taskId; // 保存任務ID
            
            // 步骤2：处理图片
            const processResponse = await fetch('/api/preprocess/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_id: taskId,
                    settings: settings
                })
            });
            
            const processData = await processResponse.json();
            hideLoading();
            
            if (processData.success && processData.results && processData.results.length > 0) {
                // 保存處理結果
                preprocessResults = processData.results;
                
                if (isVideoMode) {
                    // ===== 視頻截圖前處理：處理所有截圖 =====
                    console.log(`✅ 視頻截圖前處理完成，共 ${preprocessResults.length} 張已處理`);
                    
                    // ===== 修正：自動執行 sendToOcrBtn 中的視頻截圖處理邏輯，類似PDF流程 =====
                    console.log(`📋 檢查視頻截圖前處理結果: preprocessResults.length = ${preprocessResults.length}`);
                    console.log(`📋 前處理結果詳情:`, preprocessResults.map((r, i) => ({
                        index: i,
                        filename: r.filename,
                        status: r.status,
                        has_path: !!r.processed_path
                    })));
                    
        if (preprocessResults.length === 0) {
            showError(null, 'errors.preprocessing.no_result');
            return;
        }
                    
                    // 保存處理後的截圖路徑（用於OCR時使用）
                    // 將處理結果映射到截圖索引
                    processedVideoFrames = [];
                    preprocessResults.forEach((result, index) => {
                        if (result.status === 'completed' && result.processed_path) {
                            // 從文件名提取截圖編號（frame_1.jpg -> 1）
                            const frameMatch = result.filename.match(/frame_(\d+)\.jpg/);
                            const frameNum = frameMatch ? parseInt(frameMatch[1]) : (index + 1);
                            
                            processedVideoFrames.push({
                                frame: frameNum,
                                processed_path: result.processed_path,
                                processed_thumb_b64: result.processed_thumb_b64,
                                filename: result.filename
                            });
                            console.log(`✅ 映射截圖 ${frameNum}: ${result.processed_path}`);
                        } else {
                            console.warn(`⚠️ 處理結果未完成或缺少路徑:`, result);
                        }
                    });
                    
                    // 按截圖編號排序
                    processedVideoFrames.sort((a, b) => a.frame - b.frame);
                    
                    // 設置總數（用於批次處理）
                    totalPages = processedVideoFrames.length;
                    
                    console.log(`✅ 視頻截圖前處理完成，共 ${processedVideoFrames.length} 張已處理:`, processedVideoFrames.map(item => `截圖${item.frame}`).join(', '));
                    
                    // 更新縮圖顯示（使用處理後的縮圖）
                    if (thumbnailsGrid && processedVideoFrames.length > 0) {
                        thumbnailsGrid.innerHTML = '';
                        processedVideoFrames.forEach((item, idx) => {
                            const div = document.createElement('div');
                            div.className = 'thumbnail-item';
                            div.innerHTML = `<img src="${item.processed_thumb_b64}" title="${i18n.t('ui.video.frame_number', { index: item.frame })} ${i18n.t('messages.preprocessing.completed_processed')}">`;
                            
                            div.addEventListener('click', () => {
                                document.querySelectorAll('.thumbnail-item').forEach(el => {
                                    el.classList.remove('selected');
                                });
                                div.classList.add('selected');
                                // 載入處理後的截圖預覽
                                loadProcessedVideoFramePreview(item.frame);
                            });
                            
                            thumbnailsGrid.appendChild(div);
                        });
                        
                        // 選中第一張並載入預覽
                        if (processedVideoFrames.length > 0) {
                            const firstFrame = processedVideoFrames[0].frame;
                            loadProcessedVideoFramePreview(firstFrame);
                        }
                    }
                    
                    // 生成截圖選擇選項
                    if (pageSelector) {
                        pageSelector.innerHTML = '';
                        for (let i = 1; i <= totalPages; i++) {
                            const opt = document.createElement('option');
                            opt.value = i;
                            opt.textContent = i18n.t('ui.video.frame_number', { index: i });
                            pageSelector.appendChild(opt);
                        }
                        console.log(`✅ 已生成截圖選擇器，共 ${totalPages} 張`);
                    }
                    
                    // 切換到 OCR Tab
                    document.getElementById('tab-ocr').click();
                    
                    // 顯示PDF模式選擇和縮圖（視頻截圖使用相同的批次處理UI）
                    if (pdfModeSection) {
                        pdfModeSection.classList.remove('hidden');
                    }
                    if (configPanel) {
                        configPanel.classList.remove('hidden');
                    }
                    if (thumbnailsContainer) {
                        thumbnailsContainer.classList.remove('hidden');
                    }
                    if (processBatchBtn) {
                        processBatchBtn.classList.remove('hidden');
                        processBatchBtn.disabled = false;
                        // 更新批次處理按鈕文本
                        if (batchBtnText) {
                            batchBtnText.innerText = i18n.t('ui.video.batch_with_count', { count: totalPages });
                        }
                    }
                    if (processSingleBtn) {
                        processSingleBtn.classList.remove('hidden');
                        processSingleBtn.disabled = false;
                    }
                    
                    // 隱藏圖片模式相關元素
                    preview.classList.add('hidden');
                    processImageBtn.classList.add('hidden');
                    
                    // 隱藏前處理選項
                    if (imagePreprocessSection) {
                        imagePreprocessSection.classList.add('hidden');
                    }
                    
                    // 標記已前處理
                    imagePreprocessed = true;
                    pdfPreprocessed = true; // 使用PDF批次處理邏輯
                    isVideoPreprocessMode = true; // ===== 修正：確保視頻截圖前處理模式標記已設置 =====
                    
                    console.log(`✅ 視頻截圖前處理完成，已返回OCR Tab，共 ${processedVideoFrames.length} 張已處理`);
                    console.log(`📊 視頻截圖模式已啟動：totalPages=${totalPages}, 縮圖數量=${processedVideoFrames.length}, isVideoPreprocessMode=${isVideoPreprocessMode}`);
                } else {
                    // ===== 單張圖片前處理：只處理第一張 =====
                    const processedResult = processData.results[0];
                    if (processedResult.processed_path) {
                        // ===== 修正：將完整路徑轉換為相對路徑，以便通過 /api/files/ 訪問 =====
                        let fileUrl = processedResult.processed_path;
                        
                        // 提取相對路徑（從 UPLOAD_FOLDER 之後的部分）
                        // processed_path 格式：/tmp/preprocess_xxx/processed/filename.jpg
                        // 需要轉換為：preprocess_xxx/processed/filename.jpg
                        if (fileUrl.includes('processed')) {
                            // 找到 processed 目錄的位置
                            const processedIndex = fileUrl.indexOf('processed');
                            if (processedIndex > 0) {
                                // 提取 preprocess_xxx/processed/filename.jpg 部分
                                const beforeProcessed = fileUrl.substring(0, processedIndex - 1);
                                const taskDir = beforeProcessed.split('/').pop(); // 獲取 preprocess_xxx
                                const afterProcessed = fileUrl.substring(processedIndex);
                                fileUrl = `/api/files/${taskDir}/${afterProcessed}`;
                            }
                        }
                        
                        console.log('📥 載入處理後的圖片:', fileUrl);
                        // 下載處理後的圖片並轉換為File對象
                        const response = await fetch(fileUrl);
                        if (!response.ok) {
                            throw new Error(`無法載入處理後的圖片: HTTP ${response.status}`);
                        }
                        const blob = await response.blob();
                        processedImageFile = new File([blob], selectedFile.name, { type: blob.type });
                        
                        // 更新預覽
                        const reader = new FileReader();
                        reader.onload = e => {
                            previewImage.src = e.target.result;
                            preview.classList.remove('hidden');
                        };
                        reader.readAsDataURL(processedImageFile);
                    }
                    
                    // 標記已前處理
                    imagePreprocessed = true;
                    
                    // 隱藏前處理選項
                    if (imagePreprocessSection) {
                        imagePreprocessSection.classList.add('hidden');
                    }
                    
                    // 顯示OCR配置
                    if (configPanel) {
                        configPanel.classList.remove('hidden');
                    }
                    
                    // 顯示執行按鈕
                    if (processImageBtn) {
                        processImageBtn.classList.remove('hidden');
                        processImageBtn.disabled = false;
                        if (imageBtnText) {
        imageBtnText.innerText = i18n.t('ui.buttons.start_recognition');
                        }
                    }
                    
                    console.log('✅ 圖片前處理完成');
                }
            } else {
                showError(processData.error || i18n.t('errors.processing_failed', { detail: '' }));
            }
        } catch (error) {
            hideLoading();
            showError(null, 'errors.processing_failed', { detail: error.message });
        }
    });
}

// ===== PDF前處理：跳過前處理 =====
if (skipPdfPreprocessBtn) {
    skipPdfPreprocessBtn.addEventListener('click', async () => {
        if (!selectedFile) {
            showError(null, 'errors.pdf.no_upload');
            return;
        }
        
        // 隱藏前處理選項
        if (pdfPreprocessSection) {
            pdfPreprocessSection.classList.add('hidden');
        }
        
        // 初始化PDF（顯示縮圖列表）
        await initPDFPages(selectedFile);
        
        // 顯示OCR配置
        if (configPanel) {
            configPanel.classList.remove('hidden');
        }
        
        // 標記未前處理
        pdfPreprocessed = false;
        processedPdfThumbnails = [];
        
        console.log('✅ 已跳過PDF前處理，直接進入OCR配置');
    });
}

// ===== PDF前處理：執行前處理（切換到前處理Tab） =====
if (executePdfPreprocessBtn) {
    executePdfPreprocessBtn.addEventListener('click', async () => {
        if (!selectedFile) {
            showError(null, 'errors.pdf.no_upload');
            return;
        }
        
        // 先初始化PDF任務（如果還沒有）
        if (!currentTaskId) {
            showLoading(i18n.t('messages.pdf.loading'));
            
            try {
                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('content_type', currentMode);
                formData.append('subcategory', currentSubcategory);
                formData.append('complexity', currentComplexity);
                
                const initResponse = await fetch('/api/pdf/init', {
                    method: 'POST',
                    body: formData
                });
                
                const initData = await initResponse.json();
                
                if (!initData.success) {
                    hideLoading();
                    showError(initData.error || i18n.t('errors.pdf.load_failed', { detail: '' }));
                    return;
                }
                
                currentTaskId = initData.task_id;
                totalPages = initData.total_pages;
                // ===== 修正4：設置PDF前處理模式標記 =====
                isPdfPreprocessMode = true;
            } catch (error) {
                hideLoading();
                showError(null, 'errors.pdf.load_failed', { detail: error.message });
                return;
            }
        } else {
            // ===== 修正4：如果已有任務ID，也設置PDF前處理模式標記 =====
            isPdfPreprocessMode = true;
        }
        
        // 提取PDF頁面為圖片文件
        showLoading(i18n.t('messages.pdf.extracting'), i18n.t('messages.pdf.total_pages', { count: totalPages }));
        
        try {
            const extractResponse = await fetch('/api/pdf/extract-pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_id: currentTaskId
                })
            });
            
            if (!extractResponse.ok) {
                let errorMsg = '提取頁面失敗';
                try {
                    const errorData = await extractResponse.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) {
                    errorMsg = `HTTP ${extractResponse.status}: ${extractResponse.statusText}`;
                }
                hideLoading();
                showError(errorMsg);
                console.error('Extract pages error:', errorMsg);
                return;
            }
            
            const extractData = await extractResponse.json();
            hideLoading();
            
            if (!extractData.success) {
                const errMsg = extractData.error || '';
                showError(errMsg ? `${i18n.t('errors.pdf.extract_failed', { detail: errMsg })}` : i18n.t('errors.pdf.extract_failed'));
                console.error('Extract pages failed:', extractData.error);
                return;
            }
            
            // 下載圖片文件並轉換為File對象
            // 注意：需要通過後端API訪問文件，因為文件在服務器上
            console.log(`📥 提取結果: 後端返回 ${extractData.images.length} 張圖片，PDF總頁數 = ${totalPages}`);
            console.log(`📋 提取的圖片列表:`, extractData.images.map(img => img.filename).join(', '));
            
            const imageFiles = [];
            for (const imgInfo of extractData.images) {
                try {
                    // 使用file_url訪問文件
                    const fileUrl = imgInfo.file_url || `/api/files/${imgInfo.file_path.split('uploads/').pop()}`;
                    const response = await fetch(fileUrl);
                    if (!response.ok) {
                        console.error(`Failed to fetch ${imgInfo.filename}: ${response.statusText}`);
                        continue;
                    }
                    const blob = await response.blob();
                    const file = new File([blob], imgInfo.filename, { type: 'image/png' });
                    imageFiles.push(file);
                    console.log(`✅ 已載入圖片: ${imgInfo.filename}`);
                } catch (err) {
                    console.error(`Failed to load image ${imgInfo.filename}:`, err);
                }
            }
            
            console.log(`📊 載入結果: 成功載入 ${imageFiles.length}/${extractData.images.length} 張圖片`);
            
            if (imageFiles.length === 0) {
                showError(null, 'errors.pdf.image_load_failed');
                return;
            }
            
            // 檢查載入的圖片數量是否與PDF頁數一致
            if (imageFiles.length !== totalPages) {
                console.warn(`⚠️ 警告：載入的圖片數量 (${imageFiles.length}) 與PDF頁數 (${totalPages}) 不一致！`);
            }
            
            // 將文件設置到前處理Tab
            preprocessFiles = imageFiles;
            console.log(`✅ 已設置 ${preprocessFiles.length} 張圖片到前處理Tab`);
            
            // 顯示前處理預覽
            if (preprocessImages) {
                showPreprocessPreview(imageFiles);
            }
            
            // 顯示前處理設定
            const preprocessSettings = document.getElementById('preprocessSettings');
            if (preprocessSettings) {
                preprocessSettings.classList.remove('hidden');
            }
            
            // 顯示處理按鈕
            if (processPreprocessBtn) {
                processPreprocessBtn.classList.remove('hidden');
                // ===== PDF前處理模式：啟用按鈕（因為這是從OCR Tab進入的PDF流程） =====
                // 只有獨立前處理Tab（非PDF/影片模式）才禁用按鈕
                if (isPdfPreprocessMode || isVideoPreprocessMode) {
                    processPreprocessBtn.disabled = false;
                    console.log('✅ PDF前處理模式：已啟用前處理按鈕');
                } else {
                    // 獨立前處理Tab已凍結，保持禁用
                    processPreprocessBtn.disabled = true;
                }
            }
            
            // 切換到前處理Tab（PDF前處理模式：臨時啟用Tab按鈕）
            const preprocessTab = document.getElementById('tab-preprocess');
            if (preprocessTab) {
                // ===== PDF前處理模式：臨時啟用Tab按鈕以允許切換 =====
                const wasDisabled = preprocessTab.disabled;
                if (wasDisabled) {
                    preprocessTab.disabled = false;
                    preprocessTab.classList.remove('opacity-50', 'cursor-not-allowed');
                }
                
                preprocessTab.click();
                
                // ===== 切換後恢復禁用狀態（如果是獨立前處理模式） =====
                // 注意：這裡不立即恢復，因為用戶可能需要在Tab中操作
                // Tab按鈕的禁用狀態會在下次切換Tab時由HTML的檢查邏輯處理
            }
            
            console.log(`✅ 已提取 ${imageFiles.length} 頁PDF，切換到前處理Tab`);
        } catch (error) {
            hideLoading();
            showError(null, 'errors.processing_failed', { detail: error.message });
        }
    });
}

// ===== 顯示前處理結果 =====
function displayPreprocessResults(results) {
    resultDiv.innerHTML = `
        <div class="p-5 bg-white rounded-xl shadow-md border-l-4 border-green-500">
            <h3 class="text-lg font-bold text-green-700 mb-3">${i18n.t('ui.preprocessing.completed')}</h3>
            <div class="text-sm text-gray-600 mb-4">
                ${i18n.t('ui.preprocessing.success_count', { count: results.length })}
            </div>
            <div class="grid grid-cols-2 gap-4">
                ${results.map((result, index) => `
                    <div class="border rounded-lg p-3">
                        <p class="text-xs font-medium mb-2">${preprocessFiles[index]?.name || result.filename}</p>
                        ${result.processed_thumb_b64 
                            ? `<img src="${result.processed_thumb_b64}" class="w-full h-32 object-cover rounded-lg mb-2" alt="${i18n.t('ui.preprocessing.completed_status')}">`
                            : `<div class="w-full h-32 bg-gray-200 rounded-lg mb-2 flex items-center justify-center text-gray-400 text-xs">${i18n.t('ui.preprocessing.no_preview')}</div>`}
                        <div class="text-xs text-gray-500">
                            ${result.status === 'completed' 
                                ? `✅ ${i18n.t('ui.preprocessing.completed_status')}` 
                                : `❌ ${i18n.t('ui.preprocessing.failed_status')}`}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// === 修正 2：下載預處理結果完整實現 ===
if (downloadPreprocessBtn) {
    downloadPreprocessBtn.addEventListener('click', async () => {
    if (!currentPreprocessTaskId) {
        showError(null, 'errors.preprocessing.task_not_found');
        return;
    }
    
    showLoading(i18n.t('messages.preprocessing.preparing_download'));
    
    try {
        console.log(`📥 開始下載前處理結果，task_id: ${currentPreprocessTaskId}`);
        
        const response = await fetch('/api/preprocess/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task_id: currentPreprocessTaskId
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: '下載失敗' }));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `processed_images_${new Date().toISOString().slice(0, 10)}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log(`✅ 下載完成，文件大小: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('下載失敗:', error);
        showError(null, 'errors.download_failed', { detail: error.message });
    }
    });
}

// === 修正 4：預處理 → OCR 數據傳遞完整實現 ===
if (sendToOcrBtn) {
    sendToOcrBtn.addEventListener('click', async () => {
    if (preprocessFiles.length === 0) {
        showError(null, 'errors.preprocessing.no_upload_process');
        return;
    }
    
    // 檢查是否是PDF前處理
    console.log(`🔍 檢查PDF前處理條件:`);
    console.log(`  - isPdfPreprocessMode: ${isPdfPreprocessMode}`);
    console.log(`  - currentTaskId: ${currentTaskId}`);
    console.log(`  - selectedFile:`, selectedFile);
    console.log(`  - selectedFile.type: ${selectedFile?.type}`);
    console.log(`  - totalPages: ${totalPages}`);
    console.log(`  - preprocessResults.length: ${preprocessResults.length}`);
    
    // ===== 修正4：優先使用標記，如果沒有則檢查狀態 =====
    const isPdfPreprocess = isPdfPreprocessMode || (currentTaskId && selectedFile && selectedFile.type === 'application/pdf');
    const isVideoPreprocess = isVideoPreprocessMode && preprocessResults && preprocessResults.length > 0;
    
    console.log(`  - isPdfPreprocess: ${isPdfPreprocess}`);
    console.log(`  - isVideoPreprocess: ${isVideoPreprocess}`);
    
    if (isVideoPreprocess) {
        // ===== 視頻截圖前處理：保存處理後的截圖路徑並設置批次處理模式 =====
        console.log(`📋 檢查視頻截圖前處理結果: preprocessResults.length = ${preprocessResults.length}`);
        console.log(`📋 前處理結果詳情:`, preprocessResults.map((r, i) => ({
            index: i,
            filename: r.filename,
            status: r.status,
            has_path: !!r.processed_path
        })));
        
        if (preprocessResults.length === 0) {
            showError(null, 'errors.preprocessing.no_result');
            return;
        }
        
        // 保存處理後的截圖路徑（用於OCR時使用）
        // 將處理結果映射到截圖索引
        processedVideoFrames = [];
        preprocessResults.forEach((result, index) => {
            if (result.status === 'completed' && result.processed_path) {
                // 從文件名提取截圖編號（frame_1.jpg -> 1）
                const frameMatch = result.filename.match(/frame_(\d+)\.jpg/);
                const frameNum = frameMatch ? parseInt(frameMatch[1]) : (index + 1);
                
                processedVideoFrames.push({
                    frame: frameNum,
                    processed_path: result.processed_path,
                    processed_thumb_b64: result.processed_thumb_b64,
                    filename: result.filename
                });
                console.log(`✅ 映射截圖 ${frameNum}: ${result.processed_path}`);
            } else {
                console.warn(`⚠️ 處理結果未完成或缺少路徑:`, result);
            }
        });
        
        // 按截圖編號排序
        processedVideoFrames.sort((a, b) => a.frame - b.frame);
        
        // 設置總數（用於批次處理）
        totalPages = processedVideoFrames.length;
        
        console.log(`✅ 視頻截圖前處理完成，共 ${processedVideoFrames.length} 張已處理:`, processedVideoFrames.map(item => `截圖${item.frame}`).join(', '));
        
        // 更新縮圖顯示（使用處理後的縮圖）
        if (thumbnailsGrid && processedVideoFrames.length > 0) {
            thumbnailsGrid.innerHTML = '';
            processedVideoFrames.forEach((item, idx) => {
                const div = document.createElement('div');
                div.className = 'thumbnail-item';
                div.innerHTML = `<img src="${item.processed_thumb_b64}" title="${i18n.t('ui.video.frame_number', { index: item.frame })} ${i18n.t('messages.preprocessing.completed_processed')}">`;
                
                div.addEventListener('click', () => {
                    document.querySelectorAll('.thumbnail-item').forEach(el => {
                        el.classList.remove('selected');
                    });
                    div.classList.add('selected');
                    // 載入處理後的截圖預覽
                    loadProcessedVideoFramePreview(item.frame);
                });
                
                thumbnailsGrid.appendChild(div);
            });
            
            // 選中第一張並載入預覽
            if (processedVideoFrames.length > 0) {
                const firstFrame = processedVideoFrames[0].frame;
                loadProcessedVideoFramePreview(firstFrame);
            }
        }
        
        // 生成截圖選擇選項
        if (pageSelector) {
            pageSelector.innerHTML = '';
            for (let i = 1; i <= totalPages; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = i18n.t('ui.video.frame_number', { index: i });
                pageSelector.appendChild(opt);
            }
            console.log(`✅ 已生成截圖選擇器，共 ${totalPages} 張`);
        }
        
        // 切換到 OCR Tab
        document.getElementById('tab-ocr').click();
        
        // 顯示PDF模式選擇和縮圖（視頻截圖使用相同的批次處理UI）
        if (pdfModeSection) {
            pdfModeSection.classList.remove('hidden');
        }
        if (configPanel) {
            configPanel.classList.remove('hidden');
        }
        if (thumbnailsContainer) {
            thumbnailsContainer.classList.remove('hidden');
        }
        if (processBatchBtn) {
            processBatchBtn.classList.remove('hidden');
            processBatchBtn.disabled = false;
            // 更新批次處理按鈕文本
            if (batchBtnText) {
                batchBtnText.innerText = i18n.t('ui.video.batch_with_count', { count: totalPages });
            }
        }
        if (processSingleBtn) {
            processSingleBtn.classList.remove('hidden');
            processSingleBtn.disabled = false;
        }
        
        // 隱藏圖片模式相關元素
        preview.classList.add('hidden');
        processImageBtn.classList.add('hidden');
        
        // 標記已前處理
        imagePreprocessed = true;
        pdfPreprocessed = true; // 使用PDF批次處理邏輯
        isVideoPreprocessMode = true; // ===== 修正：確保視頻截圖前處理模式標記已設置 =====
        
        console.log(`✅ 視頻截圖前處理完成，已返回OCR Tab，共 ${processedVideoFrames.length} 張已處理`);
        console.log(`📊 視頻截圖模式已啟動：totalPages=${totalPages}, 縮圖數量=${processedVideoFrames.length}, isVideoPreprocessMode=${isVideoPreprocessMode}`);
    } else if (isPdfPreprocess) {
        // ===== 修正：PDF前處理：保存處理後的圖片路徑並更新縮圖 =====
        console.log(`📋 檢查前處理結果: preprocessResults.length = ${preprocessResults.length}, totalPages = ${totalPages}`);
        console.log(`📋 前處理結果詳情:`, preprocessResults.map((r, i) => ({
            index: i,
            filename: r.filename,
            status: r.status,
            has_path: !!r.processed_path
        })));
        
        if (preprocessResults.length === 0) {
            showError(null, 'errors.preprocessing.no_result');
            return;
        }
        
        // 檢查處理結果數量是否與PDF頁數一致
        if (preprocessResults.length !== totalPages) {
            console.warn(`⚠️ 警告：前處理結果數量 (${preprocessResults.length}) 與PDF頁數 (${totalPages}) 不一致！`);
        }
        
        pdfPreprocessed = true;
        // ===== 修正4：確保PDF前處理模式標記已設置 =====
        isPdfPreprocessMode = true;
        
        // 保存處理後的圖片路徑（用於OCR時使用）
        // 將處理結果映射到頁面編號
        const processedImagesMap = {};
        preprocessResults.forEach((result, index) => {
            if (result.status === 'completed' && result.processed_path) {
                // 從文件名提取頁面編號（page_1.png -> 1）
                const pageMatch = result.filename.match(/page_(\d+)\.png/);
                if (pageMatch) {
                    const pageNum = parseInt(pageMatch[1]);
                    processedImagesMap[pageNum] = {
                        processed_path: result.processed_path,
                        processed_thumb_b64: result.processed_thumb_b64
                    };
                    console.log(`✅ 映射頁面 ${pageNum}: ${result.processed_path}`);
                } else {
                    console.warn(`⚠️ 無法從文件名提取頁面編號: ${result.filename}`);
                }
            } else {
                console.warn(`⚠️ 處理結果未完成或缺少路徑:`, result);
            }
        });
        
        // 保存到全局變數，供OCR使用
        processedPdfThumbnails = Object.keys(processedImagesMap).map(pageNum => ({
            page: parseInt(pageNum),
            ...processedImagesMap[pageNum]
        })).sort((a, b) => a.page - b.page);
        
        console.log(`✅ PDF前處理完成，共 ${processedPdfThumbnails.length} 頁已處理:`, processedPdfThumbnails.map(item => `頁${item.page}`).join(', '));
        console.log(`📊 對比：PDF總頁數 = ${totalPages}, 已處理頁數 = ${processedPdfThumbnails.length}`);
        
        // 更新縮圖顯示（使用處理後的縮圖）
        if (thumbnailsGrid && processedPdfThumbnails.length > 0) {
            thumbnailsGrid.innerHTML = '';
            processedPdfThumbnails.forEach((item, idx) => {
                const div = document.createElement('div');
                div.className = 'thumbnail-item';
                div.innerHTML = `<img src="${item.processed_thumb_b64}" title="${i18n.t('ui.results.page_label', { page: item.page })} ${i18n.t('ui.results.processed_label')}">`;
                
                div.addEventListener('click', () => {
                    document.querySelectorAll('.thumbnail-item').forEach(el => {
                        el.classList.remove('selected');
                    });
                    div.classList.add('selected');
                    selectPage(item.page);
                });
                
                thumbnailsGrid.appendChild(div);
            });
            
            // 選中第一頁並載入預覽
            if (processedPdfThumbnails.length > 0) {
                const firstPage = processedPdfThumbnails[0].page;
                selectPage(firstPage);
            }
        }
        
        // 生成頁面選擇選項（像 initPDFPages 一樣）
        if (pageSelector) {
            pageSelector.innerHTML = '';
            for (let i = 1; i <= totalPages; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = i18n.t('ui.pdf.page_number', { page: i });
                pageSelector.appendChild(opt);
            }
            console.log(`✅ 已生成頁面選擇器，共 ${totalPages} 頁`);
        }
        
        // 切換到 OCR Tab
        document.getElementById('tab-ocr').click();
        
        // 顯示PDF模式選擇和縮圖
        if (pdfModeSection) {
            pdfModeSection.classList.remove('hidden');
        }
        if (configPanel) {
            configPanel.classList.remove('hidden');
        }
        if (thumbnailsContainer) {
            thumbnailsContainer.classList.remove('hidden');
        }
        if (processBatchBtn) {
            processBatchBtn.classList.remove('hidden');
            processBatchBtn.disabled = false;
            // 更新批次處理按鈕文本（像 initPDFPages 一樣）
            if (batchBtnText) {
        batchBtnText.innerText = i18n.t('ui.pdf.batch_with_count', { count: totalPages });
            }
        }
        if (processSingleBtn) {
            processSingleBtn.classList.remove('hidden');
            processSingleBtn.disabled = false;
        }
        
        // 隱藏圖片模式相關元素
        preview.classList.add('hidden');
        processImageBtn.classList.add('hidden');
        
        console.log(`✅ PDF前處理完成，已返回OCR Tab，共 ${processedPdfThumbnails.length} 頁已處理`);
        console.log(`📊 PDF模式已啟動：totalPages=${totalPages}, 縮圖數量=${processedPdfThumbnails.length}`);
    } else {
        // ===== 修正：圖片前處理：使用處理後的圖片，而不是原始圖片 =====
        if (preprocessResults.length === 0 || !preprocessResults[0].processed_path) {
            showError(null, 'errors.preprocessing.no_result');
            return;
        }
        
        const firstResult = preprocessResults[0];
        
        // 下載處理後的圖片並轉換為File對象
        showLoading(i18n.t('messages.preprocessing.loading_result'));
        
        try {
            // ===== 修正：將完整路徑轉換為相對路徑，以便通過 /api/files/ 訪問 =====
            let fileUrl = firstResult.processed_path;
            
            // 提取相對路徑（從 UPLOAD_FOLDER 之後的部分）
            // processed_path 格式：/tmp/preprocess_xxx/processed/filename.jpg
            // 需要轉換為：preprocess_xxx/processed/filename.jpg
            if (fileUrl.includes('processed')) {
                // 找到 processed 目錄的位置
                const processedIndex = fileUrl.indexOf('processed');
                if (processedIndex > 0) {
                    // 提取 preprocess_xxx/processed/filename.jpg 部分
                    const beforeProcessed = fileUrl.substring(0, processedIndex - 1);
                    const taskDir = beforeProcessed.split('/').pop(); // 獲取 preprocess_xxx
                    const afterProcessed = fileUrl.substring(processedIndex);
                    fileUrl = `/api/files/${taskDir}/${afterProcessed}`;
                }
            }
            
            console.log('📥 載入處理後的圖片:', fileUrl);
            const response = await fetch(fileUrl);
            if (!response.ok) {
                throw new Error('無法載入處理後的圖片');
            }
            
            const blob = await response.blob();
            const originalFileName = preprocessFiles[0]?.name || firstResult.filename || 'processed_image.jpg';
            processedImageFile = new File([blob], originalFileName, { type: blob.type });
            
            // 設置為已前處理
            selectedFile = processedImageFile;
            imagePreprocessed = true;
            
            hideLoading();
            
            // 切換到 OCR Tab
            document.getElementById('tab-ocr').click();
            
            // 加載預處理後的圖片
            const reader = new FileReader();
            reader.onload = e => {
                previewImage.src = e.target.result;
                preview.classList.remove('hidden');
                configPanel.classList.remove('hidden');
                pdfModeSection.classList.add('hidden');
                processImageBtn.classList.remove('hidden');
                if (imageBtnText) {
                    imageBtnText.innerText = i18n.t('ui.buttons.start_recognition');
                }
            };
            reader.readAsDataURL(processedImageFile);
            
            console.log('✅ 已載入處理後的圖片並發送到 OCR');
        } catch (error) {
            hideLoading();
            showError(null, 'errors.preprocessing.load_failed', { detail: error.message });
        }
    }
    });
}
// ===== Part 4: 影片截圖邏輯 =====

// ===== 影片拖放事件 =====
videoDropZone.addEventListener('click', () => {
    videoFileInput.click();
});

videoDropZone.addEventListener('dragover', e => {
    e.preventDefault();
    videoDropZone.classList.add('dragover');
});

videoDropZone.addEventListener('dragleave', () => {
    videoDropZone.classList.remove('dragover');
});

videoDropZone.addEventListener('drop', e => {
    e.preventDefault();
    videoDropZone.classList.remove('dragover');
    handleVideoFile(e.dataTransfer.files[0]);
});

videoFileInput.addEventListener('change', e => {
    handleVideoFile(e.target.files[0]);
});

// ===== 處理影片檔案 =====
function handleVideoFile(file) {
    if (file && file.type.startsWith('video/')) {
        videoFile = file;
        document.getElementById('videoInfo').classList.remove('hidden');
        document.getElementById('videoSettings').classList.remove('hidden');
        extractFramesBtn.classList.remove('hidden');
        
        document.getElementById('videoInfoContent').innerHTML = `
            <p>🎬 檔名: ${file.name}</p>
            <p>📦 大小: ${(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            <p>🎞️ 類型: ${file.type}</p>
        `;
    }
}

// ===== 截圖方式切換（修正 1：新增場景變化選項） =====
document.getElementById('extractionMethod').addEventListener('change', function() {
    document.getElementById('frameCountSetting').classList.add('hidden');
    document.getElementById('intervalSetting').classList.add('hidden');
    document.getElementById('sceneChangeSettings').classList.add('hidden');
    
    if (this.value === 'fixed_count') {
        document.getElementById('frameCountSetting').classList.remove('hidden');
    } else if (this.value === 'fixed_interval') {
        document.getElementById('intervalSetting').classList.remove('hidden');
    } else if (this.value === 'scene_change') {
        document.getElementById('sceneChangeSettings').classList.remove('hidden');
    }
});

// ===== 場景敏感度滑塊顯示（修正 1） =====
document.getElementById('sceneSensitivity').addEventListener('input', function() {
    const labels = [
        i18n.t('ui.video.sensitivity_low'),
        i18n.t('ui.video.sensitivity_medium'),
        i18n.t('ui.video.sensitivity_high')
    ];
    const value = parseFloat(this.value);
    const index = Math.round((value - 0.1) / 0.9 * 2);
    document.getElementById('sensitivityLabel').textContent = i18n.t('ui.video.sensitivity_label', { label: labels[Math.min(2, Math.max(0, index))], value: value });
});

// ===== 執行截圖 =====
extractFramesBtn.addEventListener('click', async () => {
    if (!videoFile) return;
    
    const settings = getVideoSettings();
    showLoading(i18n.t('messages.video.extracting_frames'), i18n.t('messages.video.extraction_hint'));
    
    try {
        // 步骤1：上传视频，获取task_id
        const uploadFormData = new FormData();
        uploadFormData.append('file', videoFile);
        
        const uploadResponse = await fetch('/api/video/upload', {
            method: 'POST',
            body: uploadFormData
        });
        
        const uploadData = await uploadResponse.json();
        
        if (!uploadData.success) {
            hideLoading();
            showError(uploadData.error || i18n.t('errors.upload_failed'));
            return;
        }
        
        const taskId = uploadData.task_id;
        currentVideoTaskId = taskId; // 保存任務ID
        
        // 步骤2：提取帧
        const extractResponse = await fetch('/api/video/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task_id: taskId,
                settings: settings
            })
        });
        
        const extractData = await extractResponse.json();
        hideLoading();
        
        if (extractData.success) {
            extractedFrames = extractData.frames;
            displayExtractedFrames(extractData.frames);
            downloadFramesBtn.classList.remove('hidden');
            if (sendFramesToOcrBtn) {
                sendFramesToOcrBtn.classList.remove('hidden');
            }
        } else {
            showError(extractData.error || i18n.t('errors.video.extract_failed', { detail: '' }));
        }
    } catch (error) {
        hideLoading();
        showError(null, 'errors.video.extract_failed', { detail: error.message });
    }
});

// === 修正 1 & 11：獲取視頻設定 ===
function getVideoSettings() {
    const method = document.getElementById('extractionMethod').value;
    
    return {
        method: method,
        total_frames: method === 'fixed_count' 
            ? parseInt(document.getElementById('totalFrames').value) 
            : 1000,
        interval: method === 'fixed_interval' 
            ? parseInt(document.getElementById('frameInterval').value) 
            : 5,
        sensitivity: method === 'scene_change' 
            ? parseFloat(document.getElementById('sceneSensitivity').value) 
            : 0.5,
        format: document.getElementById('outputFormat').value
    };
}

// ===== 顯示提取的幀 =====
function displayExtractedFrames(frames) {
    // ===== 修正：確保 framesPreview 元素存在 =====
    if (!framesPreview) {
        console.error('❌ framesPreview 元素未找到');
        return;
    }
    
    // ===== 修正：先確保 framesPreview 容器可見，再填充內容 =====
    // 這樣可以避免在 hidden 狀態下操作 DOM 導致的顯示問題
    framesPreview.classList.remove('hidden');
    
    // ===== 修正：確保 framesGrid 存在，如果不存在則重新創建 =====
    let gridElement = framesGrid;
    if (!gridElement) {
        console.warn('⚠️ framesGrid 元素未找到，嘗試重新創建...');
        // 嘗試從 DOM 中查找
        gridElement = document.getElementById('framesGrid');
        if (!gridElement) {
            // 如果還是找不到，重新創建
            gridElement = document.createElement('div');
            gridElement.id = 'framesGrid';
            gridElement.className = 'grid grid-cols-3 gap-3 max-h-96 overflow-y-auto';
            // 找到 framesPreview 中應該放置 framesGrid 的位置
            const framesCountEl = document.getElementById('framesCount');
            if (framesCountEl && framesCountEl.parentElement) {
                // 在 framesCount 的父元素後面插入
                const parent = framesCountEl.parentElement;
                if (parent.nextSibling) {
                    parent.parentElement.insertBefore(gridElement, parent.nextSibling);
                } else {
                    parent.parentElement.appendChild(gridElement);
                }
            } else {
                // 如果找不到 framesCount，直接添加到 framesPreview 末尾
                framesPreview.appendChild(gridElement);
            }
            console.log('✅ 已重新創建 framesGrid 元素');
        }
    }
    
    // 清空現有內容
    gridElement.innerHTML = '';
    
    // 檢查是否有有效的幀數據
    if (!frames || frames.length === 0) {
        console.warn('⚠️ 沒有有效的幀數據');
        gridElement.innerHTML = `<p class="text-gray-400 text-center col-span-3">${i18n.t('errors.video.no_frames_extracted')}</p>`;
        updateFramesCount();
        return;
    }
    
    // 填充新的幀內容
    frames.forEach((frame, index) => {
        const frameDiv = document.createElement('div');
        frameDiv.className = 'text-center border rounded-lg p-2 hover:bg-gray-50';
        
        // 使用 thumb_b64 而不是 thumbnail
        const thumbSrc = frame.thumb_b64 || frame.thumbnail || '';
        
        // 如果缩图为空，显示占位符
        const imgHtml = thumbSrc 
            ? `<img src="${thumbSrc}" class="w-full h-24 object-cover rounded-lg mb-2 cursor-pointer" 
                     onclick="selectFrame(${index})" alt="${i18n.t('ui.video.frame_label', { index: index + 1 })}">`
            : `<div class="w-full h-24 bg-gray-200 rounded-lg mb-2 flex items-center justify-center text-gray-400 text-xs">
                  ${i18n.t('ui.video.no_thumbnail')}
                </div>`;
        
        frameDiv.innerHTML = `
            ${imgHtml}
            <p class="text-xs text-gray-600 font-medium">${i18n.t('ui.video.frame_label', { index: frame.index || index + 1 })}</p>
            <input type="checkbox" class="frame-checkbox mt-1" data-index="${index}" ${frame.selected ? 'checked' : ''} onchange="updateFramesCount()">
        `;
        gridElement.appendChild(frameDiv);
    });
    
    // 更新幀計數（會自動顯示/隱藏"發送到OCR"按鈕）
    updateFramesCount();
    
    console.log(`✅ 已顯示 ${frames.length} 張截圖預覽，framesPreview 已顯示`);
}

// ===== 更新幀計數 =====
function updateFramesCount() {
    const selectedCount = document.querySelectorAll('.frame-checkbox:checked').length;
    framesCount.textContent = i18n.t('ui.video.frames_selected', { count: selectedCount });
    
    // 如果有選中的截圖，顯示"發送到OCR"按鈕；否則隱藏
    if (sendFramesToOcrBtn) {
        if (selectedCount > 0 && extractedFrames && extractedFrames.length > 0) {
            sendFramesToOcrBtn.classList.remove('hidden');
        } else {
            sendFramesToOcrBtn.classList.add('hidden');
        }
    }
}

// === 修正 3：下載視頻幀完整實現 ===
downloadFramesBtn.addEventListener('click', async () => {
    if (!currentVideoTaskId) {
        showError(null, 'errors.video.task_not_found');
        return;
    }
    
    const selectedIndices = Array.from(document.querySelectorAll('.frame-checkbox:checked'))
        .map(cb => parseInt(cb.dataset.index));
    
    if (selectedIndices.length === 0) {
        showError(null, 'errors.video.no_frames_selected');
        return;
    }
    
    showLoading(i18n.t('messages.video.preparing_download'));
    
    try {
        const response = await fetch('/api/video/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task_id: currentVideoTaskId,
                selected_frames: selectedIndices
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
            throw new Error(errorData.error || '下載失敗');
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `video_frames_${new Date().toISOString().slice(0, 10)}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showError(null, 'errors.download_failed', { detail: error.message });
    }
});

// ===== 幀選擇函數 =====
function selectFrame(index) {
    const checkbox = document.querySelector(`.frame-checkbox[data-index="${index}"]`);
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
        updateFramesCount();  // 更新計數並控制"發送到OCR"按鈕顯示
    }
}

// ===== 全選按鈕 =====
if (selectAllFrames) {
    selectAllFrames.addEventListener('click', () => {
        document.querySelectorAll('.frame-checkbox').forEach(checkbox => {
            checkbox.checked = true;
        });
        updateFramesCount();  // 更新計數並控制"發送到OCR"按鈕顯示
    });
}

// ===== 全不選按鈕 =====
if (deselectAllFrames) {
    deselectAllFrames.addEventListener('click', () => {
        document.querySelectorAll('.frame-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        updateFramesCount();  // 更新計數並控制"發送到OCR"按鈕顯示
    });
}

// ===== 影片截圖發送到 OCR =====
if (sendFramesToOcrBtn) {
    sendFramesToOcrBtn.addEventListener('click', async () => {
        if (!extractedFrames || extractedFrames.length === 0) {
            showError(null, 'errors.video.no_extraction');
            return;
        }
        
        // 獲取所有選中的截圖索引
        const selectedIndices = Array.from(document.querySelectorAll('.frame-checkbox:checked'))
            .map(cb => parseInt(cb.dataset.index))
            .sort((a, b) => a - b); // 排序以保持順序
        
        if (selectedIndices.length === 0) {
            showError(null, 'errors.video.no_selection');
            return;
        }
        
        showLoading(i18n.t('messages.video.loading_frames', { count: selectedIndices.length }), i18n.t('messages.video.downloading_frames'));
        
        try {
            // ===== 修正：載入所有選中的截圖，而不只是第一張 =====
            const imageFiles = [];
            
            for (const index of selectedIndices) {
                const frame = extractedFrames[index];
                if (!frame || !frame.path) {
                    console.warn(`⚠️ 跳過無效的截圖索引 ${index}`);
                    continue;
                }
                
                // ===== 路徑轉換：將服務器路徑轉換為可訪問的URL =====
                // frame.path 格式：/tmp/video_xxx/frames/frame_000001.jpg
                // 需要轉換為：/api/files/video_xxx/frames/frame_000001.jpg
                let fileUrl = frame.path;
                
                // 提取相對路徑（從 UPLOAD_FOLDER 之後的部分）
                if (fileUrl.includes('video_')) {
                    const videoIndex = fileUrl.indexOf('video_');
                    if (videoIndex >= 0) {
                        // 提取 video_xxx/frames/frame_000001.jpg 部分
                        const relativePath = fileUrl.substring(videoIndex);
                        fileUrl = `/api/files/${relativePath}`;
                    } else {
                        // 如果 video_ 不在路徑中，嘗試移除 /tmp/ 前綴
                        const relativePath = fileUrl.replace(/^\/tmp\//, '').replace(/^\//, '');
                        fileUrl = `/api/files/${relativePath}`;
                    }
                } else {
                    // 如果路徑不包含 video_，嘗試移除 /tmp/ 前綴
                    const relativePath = fileUrl.replace(/^\/tmp\//, '').replace(/^\//, '');
                    fileUrl = `/api/files/${relativePath}`;
                }
                
                console.log(`📥 載入影片截圖 ${imageFiles.length + 1}/${selectedIndices.length}: ${fileUrl} (原始路徑: ${frame.path})`);
                
                // 下載圖片
                const response = await fetch(fileUrl);
                if (!response.ok) {
                    console.error(`⚠️ 無法載入截圖 ${index}: HTTP ${response.status}`);
                    continue;
                }
                
                const blob = await response.blob();
                
                // 轉換為File對象
                const fileName = `frame_${frame.index || index + 1}.jpg`;
                const file = new File([blob], fileName, { type: 'image/jpeg' });
                imageFiles.push(file);
            }
            
            if (imageFiles.length === 0) {
                hideLoading();
                showError(null, 'errors.video.frames_load_failed');
                return;
            }
            
            // 設置為視頻截圖前處理模式
            isVideoPreprocessMode = true;
            preprocessFiles = imageFiles;
            
            // 設置第一張圖片為 selectedFile（用於預覽）
            selectedFile = imageFiles[0];
            
            // 重置前處理狀態
            imagePreprocessed = false;
            processedImageFile = null;
            pdfPreprocessed = false;
            processedPdfThumbnails = [];
            processedVideoFrames = [];
            isPdfPreprocessMode = false;
            
            hideLoading();
            
            // 切換到 OCR Tab
            document.getElementById('tab-ocr').click();
            
            // 顯示圖片預覽（switchToOcrTab 會處理，但我們需要確保預覽顯示）
            const reader = new FileReader();
            reader.onload = e => {
                previewImage.src = e.target.result;
                preview.classList.remove('hidden');
                currentZoom = 1;
                previewImage.style.transform = 'scale(1)';
                
                // 顯示前處理選項和配置面板
                if (imagePreprocessSection) {
                    imagePreprocessSection.classList.remove('hidden');
                }
                if (configPanel) {
                    configPanel.classList.remove('hidden');
                }
                if (processImageBtn) {
                    processImageBtn.classList.add('hidden'); // 隱藏單張圖片處理按鈕
                }
                
                // 隱藏PDF相關元素
                if (pdfModeSection) {
                    pdfModeSection.classList.add('hidden');
                }
                if (pdfPreprocessSection) {
                    pdfPreprocessSection.classList.add('hidden');
                }
            };
            reader.readAsDataURL(selectedFile);
            
            console.log(`✅ 已載入 ${imageFiles.length} 張影片截圖並發送到 OCR，已設置為視頻截圖前處理模式`);
        } catch (error) {
            hideLoading();
            console.error('載入影片截圖失敗:', error);
            showError(null, 'errors.video.frames_load_failed', { detail: error.message });
        }
    });
}
// ===== Part 5: 輔助函數和初始化 =====

// === 修正 7：顯示錯誤（統一使用 showError） ===
function showError(message, translationKey = null, params = {}) {
    if (translationKey) {
        message = i18n.t(translationKey, params);
    }
    errorDiv.innerText = message;
    errorDiv.classList.remove('hidden');
    
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 5000);
}

// ===== 顯示加載 =====
function showLoading(text = null, subtext = null) {
if (!text) text = i18n.t('loading.processing');
        if (!subtext) subtext = i18n.t('loading.please_wait');
    loading.classList.remove('hidden');
    loadingText.textContent = text;
    document.getElementById('loadingSubtext').textContent = subtext;
}

// ===== 隱藏加載 =====
function hideLoading() {
    loading.classList.add('hidden');
}

// ===== 縮放預覽 =====
function zoomPreview(factor) {
    if (previewImage) {
        const current = previewImage.style.transform.match(/scale\(([^)]+)\)/);
        const scale = current ? parseFloat(current[1]) : 1;
        previewImage.style.transform = `scale(${scale * factor})`;
    }
}

// ===== 初始化截圖方式顯示 =====
document.addEventListener('DOMContentLoaded', async function() {
    
    // ===== 等待翻譯載入完成 =====
    await i18n.ready;
    
    // ===== I18n 語言選擇器事件 =====
    const languageSelector = document.getElementById('languageSelector');
    if (languageSelector) {
        // 設定當前語言
        languageSelector.value = i18n.currentLang;
        
        // 語言切換事件
        languageSelector.addEventListener('change', async function() {
            console.log('Language changed to:', this.value);
            await i18n.setLanguage(this.value);
            console.log('Language change completed');
        });
    }
    
    // Initialize UI translations
    await i18n.updateUI();
    
    // ===== 修正：確保前處理選項在初始狀態時隱藏 =====
    if (imagePreprocessSection) {
        imagePreprocessSection.classList.add('hidden');
    }
    if (pdfPreprocessSection) {
        pdfPreprocessSection.classList.add('hidden');
    }
    if (pdfModeSection) {
        pdfModeSection.classList.add('hidden');
    }
    if (configPanel) {
        configPanel.classList.add('hidden');
    }

    
    // 初始化分類選項
    updateSubcategoryOptions();
    updateConfigDisplay();
    
    // 觸發截圖方式初始化
    const extractionMethod = document.getElementById('extractionMethod');
    if (extractionMethod) {
        extractionMethod.dispatchEvent(new Event('change'));
    }
});

// === 修正 6：預設配置同步（需與 HTML 內嵌 JS 配合） ===
const preprocessPresetEl = document.getElementById('preprocessPreset');
if (preprocessPresetEl) {
    preprocessPresetEl.addEventListener('change', function() {
        const presets = {
            'scan_optimize': {
                autoRotate: true,
                enhance: true,
                removeShadows: true,
                binarize: true,
                removeBg: false
            },
            'photo_optimize': {
                autoRotate: true,
                enhance: true,
                removeShadows: true,
                binarize: false,
                removeBg: false
            },
            'enhance_blurry': {
                autoRotate: false,
                enhance: true,
                removeShadows: false,
                binarize: false,
                removeBg: false
            },
            'remove_background_only': {
                autoRotate: false,
                enhance: false,
                removeShadows: false,
                binarize: false,
                removeBg: true
            }
        };
        
        const preset = presets[this.value];
        if (preset && this.value !== 'custom') {
            const autoRotateEl = document.getElementById('autoRotate');
            const enhanceEl = document.getElementById('enhance');
            const removeShadowsEl = document.getElementById('removeShadows');
            const binarizeEl = document.getElementById('binarize');
            const removeBgEl = document.getElementById('removeBg');
            
            if (autoRotateEl) autoRotateEl.checked = preset.autoRotate;
            if (enhanceEl) enhanceEl.checked = preset.enhance;
            if (removeShadowsEl) removeShadowsEl.checked = preset.removeShadows;
            if (binarizeEl) binarizeEl.checked = preset.binarize;
            if (removeBgEl) removeBgEl.checked = preset.removeBg;
        }
    });
}