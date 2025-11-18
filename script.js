// Configuration - Single source of truth for all magic numbers
const CONFIG = {
    MAX_IMAGES: 20,
    INSTAGRAM: {
        width: 1080,
        height: 1350,
        ratio: 4 / 5
    },
    PDF: {
        size: [1920, 1080],
        orientation: 'landscape',
        grid: {
            columns: 4,
            rows: 3
        },
        thumbnail: {
            width: 200,
            height: 250
        },
        spacing: 10,
        margin: 20,
        textGap: 14
    },
    SORTABLE: {
        animation: 150
    },
    STORAGE_KEY: 'carouselPreviewState'
};

document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements - query once, use everywhere
    const DOM = {
        imageUpload: document.getElementById('imageUpload'),
        carouselSection: document.getElementById('carouselSection'),
        exportFilenameListBtn: document.getElementById('exportFilenameList'),
        exportMoodboardBtn: document.getElementById('exportMoodboard'),
        exportMetadataBtn: document.getElementById('exportMetadata'),
        uploadLabel: document.querySelector('.upload-label'),
        themeToggle: document.getElementById('themeToggle'),
        safeZoneToggle: document.getElementById('safeZoneToggle'),
        scratchCopy: document.getElementById('scratchCopy'),
        tags: document.getElementById('tags')
    };

    // ==================== Utility Functions ====================

    function createPDFDocument() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: CONFIG.PDF.orientation,
            unit: 'px',
            format: CONFIG.PDF.size
        });
        return {
            doc,
            width: doc.internal.pageSize.getWidth(),
            height: doc.internal.pageSize.getHeight()
        };
    }

    function getUserContent() {
        return {
            caption: DOM.scratchCopy?.value || '',
            tags: DOM.tags?.value || '',
            containers: document.querySelectorAll('.img-container')
        };
    }

    function getImageContainers() {
        return document.querySelectorAll('.img-container');
    }

    function showMessage(message, type = 'info') {
        // Can be upgraded to toast notifications later
        alert(message);
    }

    // ==================== Loading State Management ====================

    function setButtonLoading(button, isLoading, loadingText = 'Exporting...') {
        if (!button) return;

        if (isLoading) {
            button.dataset.originalText = button.textContent;
            button.textContent = loadingText;
            button.disabled = true;
            button.style.opacity = '0.6';
            button.style.cursor = 'wait';
        } else {
            button.textContent = button.dataset.originalText || button.textContent;
            button.disabled = false;
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
        }
    }

    // ==================== Local Storage Persistence ====================

    function saveState() {
        try {
            const containers = getImageContainers();
            const images = Array.from(containers).map(c => ({
                src: c.querySelector('img')?.src || '',
                filename: c.dataset.filename || ''
            }));

            const state = {
                images,
                caption: DOM.scratchCopy?.value || '',
                tags: DOM.tags?.value || '',
                darkMode: DOM.themeToggle?.checked || false,
                safeZone: DOM.safeZoneToggle?.checked || false
            };

            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.warn('Could not save state:', e);
        }
    }

    function restoreState() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (!saved) return;

            const state = JSON.parse(saved);

            // Restore images
            if (state.images?.length > 0) {
                state.images.forEach(img => {
                    if (img.src && img.filename) {
                        const container = createImageContainer(img.src, img.filename);
                        DOM.carouselSection.appendChild(container);
                    }
                });
                updateImageCounters();
            }

            // Restore text fields
            if (DOM.scratchCopy && state.caption) {
                DOM.scratchCopy.value = state.caption;
            }
            if (DOM.tags && state.tags) {
                DOM.tags.value = state.tags;
            }

            // Restore toggles
            if (DOM.themeToggle && state.darkMode) {
                DOM.themeToggle.checked = true;
                document.documentElement.setAttribute('data-theme', 'dark');
            }
            if (DOM.safeZoneToggle && state.safeZone) {
                DOM.safeZoneToggle.checked = true;
                document.querySelectorAll('.safe-mask').forEach(mask => {
                    mask.style.display = 'block';
                });
            }
        } catch (e) {
            console.warn('Could not restore state:', e);
        }
    }

    function clearSavedState() {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
    }

    // Auto-save on changes
    function setupAutoSave() {
        // Save when text fields change
        DOM.scratchCopy?.addEventListener('input', debounce(saveState, 500));
        DOM.tags?.addEventListener('input', debounce(saveState, 500));

        // Save when toggles change
        DOM.themeToggle?.addEventListener('change', saveState);
        DOM.safeZoneToggle?.addEventListener('change', saveState);
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // ==================== Event Handlers ====================

    function handleImageUpload(event) {
        addImages(event.target.files);
    }

    function handleDragOver(event) {
        event.preventDefault();
    }

    function handleDrop(event) {
        event.preventDefault();
        addImages(event.dataTransfer.files);
        if (DOM.uploadLabel) {
            DOM.uploadLabel.style.borderColor = '#ccc';
        }
    }

    function handlePasteImages(event) {
        const items = event.clipboardData.items;
        const files = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                files.push(items[i].getAsFile());
            }
        }
        if (files.length > 0) {
            addImages(files);
        }
    }

    // ==================== Keyboard Shortcuts ====================

    function handleKeyboardShortcuts(event) {
        // Cmd/Ctrl + E: Export moodboard
        if ((event.metaKey || event.ctrlKey) && event.key === 'e') {
            event.preventDefault();
            exportMoodboard();
            return;
        }

        // Cmd/Ctrl + Shift + E: Export metadata
        if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'E') {
            event.preventDefault();
            exportMetadata();
            return;
        }

        // Cmd/Ctrl + S: Save filename list
        if ((event.metaKey || event.ctrlKey) && event.key === 's') {
            event.preventDefault();
            exportFilenameList();
            return;
        }

        // Delete/Backspace: Delete selected image (if focused)
        if (event.key === 'Delete' || event.key === 'Backspace') {
            const focused = document.activeElement;
            if (focused?.closest('.img-container')) {
                event.preventDefault();
                focused.closest('.img-container').remove();
                updateImageCounters();
                saveState();
            }
        }

        // Escape: Clear all images (with confirmation)
        if (event.key === 'Escape') {
            const containers = getImageContainers();
            if (containers.length > 0 && confirm('Clear all images?')) {
                containers.forEach(c => c.remove());
                updateImageCounters();
                saveState();
            }
        }
    }

    // ==================== Image Management ====================

    function updateImageCounters() {
        getImageContainers().forEach((container, index) => {
            container.dataset.index = (index + 1).toString();
        });
    }

    function createImageContainer(src, filename) {
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('img-container');
        imgContainer.tabIndex = 0; // Make focusable for keyboard shortcuts

        // Main image
        const img = document.createElement('img');
        img.src = src;
        img.alt = filename;
        img.classList.add('carousel-image');
        imgContainer.appendChild(img);

        // Safe zone mask
        imgContainer.appendChild(createSafeMask());

        // Action buttons
        imgContainer.appendChild(createActionButtons(img, imgContainer));

        // Remove button
        const removeIcon = document.createElement('button');
        removeIcon.classList.add('remove-icon');
        removeIcon.title = 'Delete';
        removeIcon.addEventListener('click', () => {
            imgContainer.remove();
            updateImageCounters();
            saveState();
        });
        imgContainer.appendChild(removeIcon);

        imgContainer.dataset.filename = filename;
        return imgContainer;
    }

    function createActionButtons(img, container) {
        const actions = document.createElement('div');
        actions.classList.add('action-icons');

        // Zoom preview
        const zoomBtn = document.createElement('button');
        zoomBtn.textContent = '🔍';
        zoomBtn.title = 'Preview image';
        zoomBtn.addEventListener('click', () => {
            const win = window.open('');
            if (win) {
                win.document.write(`<img src="${img.src}" style="width:100%">`);
            }
        });
        actions.appendChild(zoomBtn);

        // Replace image
        const replaceBtn = document.createElement('button');
        replaceBtn.textContent = '♻️';
        replaceBtn.title = 'Replace image';
        replaceBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        img.src = ev.target.result;
                        img.alt = file.name;
                        container.dataset.filename = file.name;
                        updateImageCounters();
                        saveState();
                    };
                    reader.readAsDataURL(file);
                }
            });
            input.click();
        });
        actions.appendChild(replaceBtn);

        // Duplicate slide
        const duplicateBtn = document.createElement('button');
        duplicateBtn.textContent = '📄';
        duplicateBtn.title = 'Duplicate slide';
        duplicateBtn.addEventListener('click', () => {
            const clone = createImageContainer(img.src, container.dataset.filename);
            DOM.carouselSection.insertBefore(clone, container.nextSibling);
            updateImageCounters();
            saveState();
        });
        actions.appendChild(duplicateBtn);

        return actions;
    }

    function addImages(files) {
        let currentCount = getImageContainers().length;

        for (let i = 0; i < files.length; i++) {
            if (currentCount >= CONFIG.MAX_IMAGES) {
                showMessage(`Maximum of ${CONFIG.MAX_IMAGES} images allowed`);
                break;
            }

            const file = files[i];
            const reader = new FileReader();
            reader.onload = (e) => {
                const container = createImageContainer(e.target.result, file.name);
                DOM.carouselSection.appendChild(container);
                updateImageCounters();
                currentCount++;

                if (DOM.safeZoneToggle?.checked) {
                    container.querySelector('.safe-mask').style.display = 'block';
                }

                saveState();
            };
            reader.readAsDataURL(file);
        }
    }

    function createSafeMask() {
        const wrapper = document.createElement('div');
        wrapper.classList.add('safe-mask');
        wrapper.style.display = 'none';
        wrapper.innerHTML = `
            <svg viewBox="0 0 ${CONFIG.INSTAGRAM.width} ${CONFIG.INSTAGRAM.height}" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="${CONFIG.INSTAGRAM.width}" height="${CONFIG.INSTAGRAM.height}" fill="rgba(0,0,0,0.3)"/>
                <rect x="0" y="135" width="${CONFIG.INSTAGRAM.width}" height="${CONFIG.INSTAGRAM.width}" stroke="red" stroke-width="5" fill="none"/>
                <rect x="0" y="135" width="${CONFIG.INSTAGRAM.width}" height="${CONFIG.INSTAGRAM.width}" fill="transparent"/>
            </svg>`;
        return wrapper;
    }

    // ==================== Image Processing ====================

    function cropTo4x5(img) {
        const { width: targetW, height: targetH } = CONFIG.INSTAGRAM;
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');

        const srcW = img.naturalWidth;
        const srcH = img.naturalHeight;
        const srcAspect = srcW / srcH;
        const targetAspect = targetW / targetH;
        let sx = 0, sy = 0, sw = srcW, sh = srcH;

        if (srcAspect > targetAspect) {
            sw = srcH * targetAspect;
            sx = (srcW - sw) / 2;
        } else {
            sh = srcW / targetAspect;
            sy = (srcH - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
        return canvas.toDataURL('image/jpeg', 0.85);
    }

    // ==================== PDF Helper Functions ====================

    function addHeaderToPDF(doc, caption, tags, margin) {
        let y = margin;

        if (caption || tags) {
            if (caption) {
                doc.setFontSize(16);
                doc.text(caption, margin, y);
                y += 18;
            }
            if (tags) {
                doc.setFontSize(12);
                doc.text(tags, margin, y);
                y += 14;
            }
            y += 10;
        }

        return y;
    }

    function addImageToPDF(doc, img, x, y, index, thumbnail) {
        const cropped = cropTo4x5(img);
        doc.addImage(cropped, 'JPEG', x, y, thumbnail.width, thumbnail.height);

        // Number badge
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const numberText = (index + 1).toString();
        const textWidth = doc.getTextWidth(numberText);
        const padding = 3;
        doc.setFillColor(255, 255, 255);
        doc.rect(x + 4, y + thumbnail.height - 14, textWidth + padding * 2, 10, 'F');
        doc.text(numberText, x + 4 + padding, y + thumbnail.height - 6);
    }

    function addFilenameToPDF(doc, filename, x, y, thumbnailWidth) {
        doc.setFontSize(8);
        doc.text(filename || '', x + thumbnailWidth / 2, y + 10, { align: 'center' });
    }

    // ==================== Export Functions ====================

    function exportFilenameList() {
        const containers = getImageContainers();

        if (containers.length === 0) {
            showMessage('Please add some images first!');
            return;
        }

        const filenames = Array.from(containers).map(c => c.dataset.filename);
        const blob = new Blob([filenames.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'carousel_filenames.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async function exportMoodboard() {
        const { containers, caption, tags } = getUserContent();

        if (containers.length === 0) {
            showMessage('Please add some images first!');
            return;
        }

        setButtonLoading(DOM.exportMoodboardBtn, true, 'Generating PDF...');

        try {
            // Use setTimeout to allow UI to update before heavy processing
            await new Promise(resolve => setTimeout(resolve, 50));

            const { doc, width: pageWidth, height: pageHeight } = createPDFDocument();
            const { margin, spacing, textGap, grid, thumbnail } = CONFIG.PDF;

            const totalWidth = (grid.columns * thumbnail.width) + ((grid.columns - 1) * spacing);
            const startX = (pageWidth - totalWidth) / 2;

            const startYAdjusted = addHeaderToPDF(doc, caption, tags, margin);
            let y = startYAdjusted;
            let x = startX;

            for (let i = 0; i < containers.length; i++) {
                const img = containers[i].querySelector('img');

                try {
                    addImageToPDF(doc, img, x, y, i, thumbnail);
                    addFilenameToPDF(doc, containers[i].dataset.filename, x, y + thumbnail.height, thumbnail.width);

                    // Move to next position
                    if ((i + 1) % grid.columns === 0) {
                        x = startX;
                        y += thumbnail.height + spacing + textGap;

                        // New page if needed
                        if (y + thumbnail.height + textGap > pageHeight - margin) {
                            if (i < containers.length - 1) {
                                doc.addPage();
                                y = startYAdjusted;
                            }
                        }
                    } else {
                        x += thumbnail.width + spacing;
                    }
                } catch (error) {
                    console.error(`Error adding image ${i + 1} to PDF:`, error);
                }
            }

            doc.save('moodboard.pdf');
        } catch (error) {
            console.error('Error generating moodboard:', error);
            showMessage('Error generating PDF. Please try again.');
        } finally {
            setButtonLoading(DOM.exportMoodboardBtn, false);
        }
    }

    async function exportMetadata() {
        const { containers, caption, tags } = getUserContent();

        if (containers.length === 0) {
            showMessage('Please add some images first!');
            return;
        }

        setButtonLoading(DOM.exportMetadataBtn, true, 'Generating PDF...');

        try {
            await new Promise(resolve => setTimeout(resolve, 50));

            const { doc, width: pageWidth, height: pageHeight } = createPDFDocument();
            const { margin } = CONFIG.PDF;
            let y = margin;

            // Title
            doc.setFontSize(16);
            doc.text('Image Metadata', margin, y);
            y += 15;

            // Caption
            if (caption) {
                doc.setFontSize(12);
                doc.text('Caption:', margin, y);
                y += 7;
                doc.setFontSize(10);
                const captionLines = doc.splitTextToSize(caption, pageWidth - (2 * margin));
                doc.text(captionLines, margin, y);
                y += (captionLines.length * 5) + 10;
            }

            // Tags
            if (tags) {
                doc.setFontSize(12);
                doc.text('Tags:', margin, y);
                y += 7;
                doc.setFontSize(10);
                const tagLines = doc.splitTextToSize(tags, pageWidth - (2 * margin));
                doc.text(tagLines, margin, y);
                y += (tagLines.length * 5) + 10;
            }

            // Image list
            doc.setFontSize(12);
            doc.text('Images:', margin, y);
            y += 10;

            doc.setFontSize(10);
            containers.forEach((container, index) => {
                const filename = container.dataset.filename;
                doc.text(`${index + 1}. ${filename}`, margin, y);
                y += 7;

                if (y > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }
            });

            doc.save('carousel_metadata.pdf');
        } catch (error) {
            console.error('Error generating metadata PDF:', error);
            showMessage('Error generating PDF. Please try again.');
        } finally {
            setButtonLoading(DOM.exportMetadataBtn, false);
        }
    }

    // ==================== Event Listener Setup ====================

    // Image upload events
    DOM.imageUpload?.addEventListener('change', handleImageUpload);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('paste', handlePasteImages);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Export buttons
    DOM.exportFilenameListBtn?.addEventListener('click', exportFilenameList);
    DOM.exportMoodboardBtn?.addEventListener('click', exportMoodboard);
    DOM.exportMetadataBtn?.addEventListener('click', exportMetadata);

    // Theme toggle
    DOM.themeToggle?.addEventListener('change', () => {
        document.documentElement.setAttribute('data-theme', DOM.themeToggle.checked ? 'dark' : 'light');
    });

    // Safe zone toggle
    DOM.safeZoneToggle?.addEventListener('change', () => {
        document.querySelectorAll('.safe-mask').forEach(mask => {
            mask.style.display = DOM.safeZoneToggle.checked ? 'block' : 'none';
        });
    });

    // Upload label drag feedback
    if (DOM.uploadLabel) {
        DOM.uploadLabel.addEventListener('dragenter', () => DOM.uploadLabel.style.borderColor = '#666');
        DOM.uploadLabel.addEventListener('dragleave', () => DOM.uploadLabel.style.borderColor = '#ccc');
    }

    // Dark mode detection
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (DOM.themeToggle) DOM.themeToggle.checked = true;
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        if (DOM.themeToggle) DOM.themeToggle.checked = e.matches;
    });

    // Initialize Sortable
    new Sortable(DOM.carouselSection, {
        animation: CONFIG.SORTABLE.animation,
        ghostClass: 'sortable-ghost',
        onEnd: () => {
            updateImageCounters();
            saveState();
            console.log('Images reordered');
        }
    });

    // Setup auto-save and restore state
    setupAutoSave();
    restoreState();
});
