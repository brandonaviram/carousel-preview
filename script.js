document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const imageUpload = document.getElementById('imageUpload');
    const carouselSection = document.getElementById('carouselSection');
    const exportFilenameListBtn = document.getElementById('exportFilenameList');
    const exportMoodboardBtn = document.getElementById('exportMoodboard');
    const exportMetadataBtn = document.getElementById('exportMetadata');
    const uploadLabel = document.querySelector('.upload-label');
    const themeToggle = document.getElementById('themeToggle');
    const safeZoneToggle = document.getElementById('safeZoneToggle');
    
    // Setup event listeners only if elements exist
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    if (exportFilenameListBtn) {
        exportFilenameListBtn.addEventListener('click', exportFilenameList);
    }

    if (exportMoodboardBtn) {
        exportMoodboardBtn.addEventListener('click', exportMoodboard);
    }

    if (exportMetadataBtn) {
        exportMetadataBtn.addEventListener('click', exportMetadata);
    }

    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            document.documentElement.setAttribute('data-theme', themeToggle.checked ? 'dark' : 'light');
        });
    }

    if (safeZoneToggle) {
        safeZoneToggle.addEventListener('change', () => {
            document.querySelectorAll('.safe-mask').forEach(mask => {
                mask.style.display = safeZoneToggle.checked ? 'block' : 'none';
            });
        });
    }

    document.addEventListener('paste', handlePasteImages);
    
    // Add drag and drop visual feedback if upload label exists
    if (uploadLabel) {
        uploadLabel.addEventListener('dragenter', () => uploadLabel.style.borderColor = '#666');
        uploadLabel.addEventListener('dragleave', () => uploadLabel.style.borderColor = '#ccc');
    }

    // Dark mode detection and handling
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeToggle) themeToggle.checked = true;
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        if (themeToggle) themeToggle.checked = e.matches;
    });

    function handleImageUpload(event) {
        const files = event.target.files;
        addImages(files);
    }

    function handleDragOver(event) {
        event.preventDefault();
    }

    function handleDrop(event) {
        event.preventDefault();
        const files = event.dataTransfer.files;
        addImages(files);
        uploadLabel.style.borderColor = '#ccc';
    }

    function handlePasteImages(event) {
        const items = event.clipboardData.items;
        const files = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                files.push(item.getAsFile());
            }
        }
        if (files.length > 0) {
            addImages(files);
        }
    }

    function updateImageCounters() {
        const containers = document.querySelectorAll('.img-container');
        containers.forEach((container, index) => {
            container.dataset.index = (index + 1).toString();
        });
    }

    function createImageContainer(src, filename) {
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('img-container');

        const img = document.createElement('img');
        img.src = src;
        img.alt = filename;
        img.classList.add('carousel-image');
        imgContainer.appendChild(img);

        const mask = createSafeMask();
        imgContainer.appendChild(mask);

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
            const inp = document.createElement('input');
            inp.type = 'file';
            inp.accept = 'image/*';
            inp.addEventListener('change', ev => {
                const f = ev.target.files[0];
                if (f) {
                    const fr = new FileReader();
                    fr.onload = ev2 => {
                        img.src = ev2.target.result;
                        img.alt = f.name;
                        imgContainer.dataset.filename = f.name;
                        updateImageCounters();
                    };
                    fr.readAsDataURL(f);
                }
            });
            inp.click();
        });
        actions.appendChild(replaceBtn);

        // Duplicate slide
        const duplicateBtn = document.createElement('button');
        duplicateBtn.textContent = '📄';
        duplicateBtn.title = 'Duplicate slide';
        duplicateBtn.addEventListener('click', () => {
            const clone = createImageContainer(img.src, imgContainer.dataset.filename);
            carouselSection.insertBefore(clone, imgContainer.nextSibling);
            updateImageCounters();
        });
        actions.appendChild(duplicateBtn);

        imgContainer.appendChild(actions);

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

    function addImages(files) {
        const limit = 20;
        let currentCount = document.querySelectorAll('.img-container').length;
        for (let i = 0; i < files.length; i++) {
            if (currentCount >= limit) {
                alert('Maximum of 20 images allowed');
                break;
            }
            const file = files[i];
            const reader = new FileReader();
            reader.onload = function(e) {
                const container = createImageContainer(e.target.result, file.name);
                carouselSection.appendChild(container);
                updateImageCounters();
                currentCount++;
                if (safeZoneToggle && safeZoneToggle.checked) {
                    container.querySelector('.safe-mask').style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        }
    }

    new Sortable(carouselSection, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: () => {
            updateImageCounters(); // Update counters after reordering
            console.log('Images reordered');
        }
    });

    function createSafeMask() {
        const wrapper = document.createElement('div');
        wrapper.classList.add('safe-mask');
        wrapper.style.display = 'none';
        wrapper.innerHTML = `
            <svg viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="1080" height="1350" fill="rgba(0,0,0,0.3)"/>
                <rect x="0" y="135" width="1080" height="1080" stroke="red" stroke-width="5" fill="none"/>
                <rect x="0" y="135" width="1080" height="1080" fill="transparent"/>
            </svg>`;
        return wrapper;
    }

    function cropTo4x5(img) {
        const targetW = 1080;
        const targetH = 1350;
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

    function exportFilenameList() {
        const imgContainers = document.querySelectorAll('.img-container');
        const filenames = Array.from(imgContainers).map(container => container.dataset.filename);
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
        const imgContainers = document.querySelectorAll('.img-container');
        if (imgContainers.length === 0) {
            alert('Please add some images first!');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: [2160, 2700] });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Page margins
        const margin = 20;
        // Grid configuration
        const columns = 4;
        const rows = 5;
        const spacing = 10;

        const imageWidth = 200;
        const imageHeight = 250; // 4:5 aspect ratio
        const textGap = 14; // space for filename text

        const totalWidth = (columns * imageWidth) + ((columns - 1) * spacing);
        const startX = (pageWidth - totalWidth) / 2;

        // Get additional content
        const caption = document.getElementById('scratchCopy').value;
        const tags = document.getElementById('tags').value;

        let currentPage = 1;
        let y = margin;

        // Add caption and tags to first page if present
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
            y += 10; // Extra spacing after text
        }

        const startYAdjusted = y;
        let x = startX;

        for (let i = 0; i < imgContainers.length; i++) {
            const img = imgContainers[i].querySelector('img');
            const cropped = cropTo4x5(img);

            try {
                doc.addImage(cropped, 'JPEG', x, y, imageWidth, imageHeight);

                // Add number badge inside the image
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                const numberText = (i + 1).toString();
                const textWidth = doc.getTextWidth(numberText);
                const padding = 3;
                doc.setFillColor(255, 255, 255);
                doc.rect(
                    x + 4,
                    y + imageHeight - 14,
                    textWidth + padding * 2,
                    10,
                    'F'
                );
                doc.text(numberText, x + 4 + padding, y + imageHeight - 6);

                // Add filename below the image
                doc.setFontSize(8);
                const filename = imgContainers[i].dataset.filename || '';
                doc.text(
                    filename,
                    x + imageWidth / 2,
                    y + imageHeight + 10,
                    { align: 'center' }
                );

                // Move to next position
                if ((i + 1) % columns === 0) {
                    x = startX;
                    y += imageHeight + spacing + textGap;

                    // Check if we need a new page
                    if (y + imageHeight + textGap > pageHeight - margin) {
                        if (i < imgContainers.length - 1) {
                            doc.addPage();
                            currentPage++;
                            y = startYAdjusted;
                        }
                    }
                } else {
                    x += imageWidth + spacing;
                }
            } catch (error) {
                console.error('Error adding image to PDF:', error);
            }
        }

        doc.save('moodboard.pdf');
    }

    async function exportMetadata() {
        const imgContainers = document.querySelectorAll('.img-container');
        if (imgContainers.length === 0) {
            alert('Please add some images first!');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: [2160, 2700] });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let y = margin;

        // Add title
        doc.setFontSize(16);
        doc.text('Image Metadata', margin, y);
        y += 15;

        // Add caption and tags if present
        const caption = document.getElementById('scratchCopy').value;
        const tags = document.getElementById('tags').value;

        if (caption) {
            doc.setFontSize(12);
            doc.text('Caption:', margin, y);
            y += 7;
            doc.setFontSize(10);
            const captionLines = doc.splitTextToSize(caption, pageWidth - (2 * margin));
            doc.text(captionLines, margin, y);
            y += (captionLines.length * 5) + 10;
        }

        if (tags) {
            doc.setFontSize(12);
            doc.text('Tags:', margin, y);
            y += 7;
            doc.setFontSize(10);
            const tagLines = doc.splitTextToSize(tags, pageWidth - (2 * margin));
            doc.text(tagLines, margin, y);
            y += (tagLines.length * 5) + 10;
        }

        // Add image list
        doc.setFontSize(12);
        doc.text('Images:', margin, y);
        y += 10;

        doc.setFontSize(10);
        imgContainers.forEach((container, index) => {
            const filename = container.dataset.filename;
            doc.text(`${index + 1}. ${filename}`, margin, y);
            y += 7;

            // Add new page if needed
            if (y > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
        });

        doc.save('carousel_metadata.pdf');
    }
});
