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
    }
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

    // ==================== Image Management ====================

    function updateImageCounters() {
        getImageContainers().forEach((container, index) => {
            container.dataset.index = (index + 1).toString();
        });
    }

    function createImageContainer(src, filename) {
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('img-container');

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

    // ==================== Export Functions ====================

    function exportFilenameList() {
        const containers = getImageContainers();
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

        const { doc, width: pageWidth, height: pageHeight } = createPDFDocument();
        const { margin, spacing, textGap, grid, thumbnail } = CONFIG.PDF;

        const totalWidth = (grid.columns * thumbnail.width) + ((grid.columns - 1) * spacing);
        const startX = (pageWidth - totalWidth) / 2;

        let y = margin;

        // Add caption and tags to first page
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

        const startYAdjusted = y;
        let x = startX;

        for (let i = 0; i < containers.length; i++) {
            const img = containers[i].querySelector('img');
            const cropped = cropTo4x5(img);

            try {
                doc.addImage(cropped, 'JPEG', x, y, thumbnail.width, thumbnail.height);

                // Number badge
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                const numberText = (i + 1).toString();
                const textWidth = doc.getTextWidth(numberText);
                const padding = 3;
                doc.setFillColor(255, 255, 255);
                doc.rect(x + 4, y + thumbnail.height - 14, textWidth + padding * 2, 10, 'F');
                doc.text(numberText, x + 4 + padding, y + thumbnail.height - 6);

                // Filename below image
                doc.setFontSize(8);
                const filename = containers[i].dataset.filename || '';
                doc.text(filename, x + thumbnail.width / 2, y + thumbnail.height + 10, { align: 'center' });

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
                console.error('Error adding image to PDF:', error);
            }
        }

        doc.save('moodboard.pdf');
    }

    async function exportMetadata() {
        const { containers, caption, tags } = getUserContent();

        if (containers.length === 0) {
            showMessage('Please add some images first!');
            return;
        }

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
    }

    // ==================== Event Listener Setup ====================

    // Image upload events
    DOM.imageUpload?.addEventListener('change', handleImageUpload);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('paste', handlePasteImages);

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
            console.log('Images reordered');
        }
    });
});
