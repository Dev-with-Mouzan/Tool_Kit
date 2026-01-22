const imageInput = document.getElementById('image-input');
const compressionLevel = document.getElementById('compression-level');
const qualityValue = document.getElementById('quality-value');
const previewOriginal = document.getElementById('preview-original');
const previewCompressed = document.getElementById('preview-compressed');
const originalSize = document.getElementById('original-size');
const compressedSize = document.getElementById('compressed-size');
const downloadSection = document.getElementById('download-section');
const downloadBtn = document.getElementById('download-btn');
const loading = document.getElementById('loading');

let originalFile = null;
let compressedFile = null;

compressionLevel.addEventListener('input', (e) => {
    qualityValue.textContent = `${e.target.value}%`;
    if (originalFile) compressImage();
});

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    originalFile = file;
    originalSize.textContent = formatBytes(file.size);

    const url = URL.createObjectURL(file);
    previewOriginal.src = url;

    compressImage();
});

async function compressImage() {
    if (!originalFile) return;

    loading.classList.remove('hidden');
    downloadSection.classList.add('opacity-50', 'pointer-events-none');

    const options = {
        maxSizeMB: 5, // reasonable default max
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: parseInt(compressionLevel.value) / 100
    };

    try {
        compressedFile = await imageCompression(originalFile, options);

        compressedSize.textContent = formatBytes(compressedFile.size);
        previewCompressed.src = URL.createObjectURL(compressedFile);

        loading.classList.add('hidden');
        downloadSection.classList.remove('opacity-50', 'pointer-events-none');
        downloadSection.classList.remove('hidden');
    } catch (error) {
        console.error(error);
        alert('Compression failed. Please try a different image.');
        loading.classList.add('hidden');
    }
}

function downloadImage() {
    if (!compressedFile) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(compressedFile);
    link.download = `compressed-${originalFile.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Drag and drop handlers
const dropZone = document.querySelector('.drop-zone');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-indigo-500', 'bg-indigo-500/10');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-indigo-500', 'bg-indigo-500/10');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-indigo-500', 'bg-indigo-500/10');

    if (e.dataTransfer.files.length) {
        imageInput.files = e.dataTransfer.files;
        imageInput.dispatchEvent(new Event('change'));
    }
});
