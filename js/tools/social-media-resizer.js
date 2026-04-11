document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const editorArea = document.getElementById('editor-area');
    const previewCanvas = document.getElementById('preview-canvas');
    const downloadBtn = document.getElementById('download-btn');
    const resetBtn = document.getElementById('reset-btn');
    const presetBtns = document.querySelectorAll('.preset-btn');

    if (!dropZone || !fileInput) {
        console.error('Critical UI elements missing for social-media-resizer');
        return;
    }

    let loadedImage = null;
    let currentPreset = { width: 1080, height: 1080, name: 'Instagram Square' };
    let resizedBlobUrl = null;

    // Preset button clicks
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Highlight active preset
            presetBtns.forEach(b => {
                b.classList.remove('bg-primary/10', 'border-primary', 'text-primary');
                b.classList.add('border-slate-200', 'dark:border-slate-700');
            });
            btn.classList.add('bg-primary/10', 'border-primary', 'text-primary');
            btn.classList.remove('border-slate-200', 'dark:border-slate-700');

            currentPreset = {
                width: parseInt(btn.dataset.w),
                height: parseInt(btn.dataset.h),
                name: btn.dataset.name || 'Resized'
            };

            if (loadedImage) {
                renderPreview();
            }
        });
    });

    // Select first preset by default
    if (presetBtns.length > 0) {
        presetBtns[0].click();
    }

    // Drop zone interactions
    dropZone.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON' && e.target.parentElement?.tagName !== 'BUTTON') {
            fileInput.click();
        }
    });
    const selectBtn = dropZone.querySelector('button');
    if (selectBtn) {
        selectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(name => {
        dropZone.addEventListener(name, e => { e.preventDefault(); e.stopPropagation(); });
    });
    dropZone.addEventListener('dragover', () => dropZone.classList.add('bg-primary/5', 'border-primary'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('bg-primary/5', 'border-primary'));
    dropZone.addEventListener('drop', e => {
        dropZone.classList.remove('bg-primary/5', 'border-primary');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) loadFile(file);
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) loadFile(fileInput.files[0]);
        fileInput.value = '';
    });

    function loadFile(file) {
        const img = new Image();
        img.onload = () => {
            loadedImage = img;
            dropZone.classList.add('hidden');
            if (editorArea) editorArea.classList.remove('hidden');
            renderPreview();
        };
        img.onerror = () => alert('Failed to load image.');
        img.src = URL.createObjectURL(file);
    }

    function renderPreview() {
        if (!loadedImage || !previewCanvas) return;

        const ctx = previewCanvas.getContext('2d');
        const { width, height } = currentPreset;

        previewCanvas.width = width;
        previewCanvas.height = height;

        // Fill white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Cover fit
        const scale = Math.max(width / loadedImage.width, height / loadedImage.height);
        const x = (width - loadedImage.width * scale) / 2;
        const y = (height - loadedImage.height * scale) / 2;
        ctx.drawImage(loadedImage, x, y, loadedImage.width * scale, loadedImage.height * scale);

        // Generate download URL
        if (resizedBlobUrl) URL.revokeObjectURL(resizedBlobUrl);
        previewCanvas.toBlob(blob => {
            if (blob) {
                resizedBlobUrl = URL.createObjectURL(blob);
            }
        }, 'image/jpeg', 0.92);
    }

    // Download
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (!previewCanvas) return;
            previewCanvas.toBlob(blob => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const safeName = currentPreset.name.replace(/\s+/g, '_').toLowerCase();
                a.download = `${safeName}_${currentPreset.width}x${currentPreset.height}.jpg`;
                a.click();
                URL.revokeObjectURL(url);
            }, 'image/jpeg', 0.92);
        });
    }

    // Reset
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            loadedImage = null;
            if (resizedBlobUrl) { URL.revokeObjectURL(resizedBlobUrl); resizedBlobUrl = null; }
            if (editorArea) editorArea.classList.add('hidden');
            dropZone.classList.remove('hidden');
            fileInput.value = '';
        });
    }
});
