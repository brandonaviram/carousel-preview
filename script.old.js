document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const carouselSection = document.getElementById('carouselSection');
    const exportFilenameListBtn = document.getElementById('exportFilenameList');
    const exportMoodboardBtn = document.getElementById('exportMoodboard');
    
    imageUpload.addEventListener('change', handleImageUpload);

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    exportFilenameListBtn.addEventListener('click', exportFilenameList);
    exportMoodboardBtn.addEventListener('click', exportMoodboard);

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
    }

    function addImages(files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = function(e) {
                const imgContainer = document.createElement('div');
                imgContainer.classList.add('img-container');

                const img = document.createElement('img');
                img.src = e.target.result;
                imgContainer.appendChild(img);

                const removeIcon = document.createElement('button');
                removeIcon.classList.add('remove-icon');
                removeIcon.addEventListener('click', () => {
                    imgContainer.remove();
                });
                imgContainer.appendChild(removeIcon);

                imgContainer.dataset.filename = file.name; // Store filename in data attribute
                carouselSection.appendChild(imgContainer);
            };
            reader.readAsDataURL(file);
        }

        // Initialize or refresh Sortable
        new Sortable(carouselSection, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: () => {
                console.log('Images reordered');
            }
        });
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
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: 'a4'
        });

        const imgContainers = document.querySelectorAll('.img-container img');
        const imgWidth = (doc.internal.pageSize.getWidth() - 40) / imgContainers.length;
        const imgHeight = imgWidth * (imgContainers[0].naturalHeight / imgContainers[0].naturalWidth);
        
        const scratchCopy = document.getElementById('scratchCopy').value;
        const tags = document.getElementById('tags').value;

        for (let i = 0; i < imgContainers.length; i++) {
            const img = imgContainers[i];
            const imgData = img.src;
            doc.addImage(imgData, 'JPEG', 20 + i * imgWidth, 20, imgWidth, imgHeight);
        }

        // Add caption and tags underneath
        doc.setFontSize(12);
        doc.text(`Caption: ${scratchCopy}`, 20, imgHeight + 40);
        doc.text(`Tags: ${tags}`, 20, imgHeight + 60);

        doc.save('carousel_moodboard.pdf');
    }

    // Dark Mode Toggle
    const toggleDarkMode = () => {
        document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    };

    // Automatically apply dark mode based on system preferences
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        toggleDarkMode();
    }
    window.matchMedia('(prefers-color-scheme: dark)').addListener(e => {
        if (e.matches) {
            toggleDarkMode();
        } else {
            document.body.dataset.theme = 'light';
        }
    });
});