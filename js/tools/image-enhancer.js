document.addEventListener('DOMContentLoaded', () => {
    // Tool is coming soon - disable all functionality
    return;
    
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadSection = document.getElementById('upload-section');
    const unavailableSection = document.getElementById('unavailable-section');
    
    function showUnavailable() {
        if (uploadSection) {
            uploadSection.classList.add('hidden');
            uploadSection.classList.remove('flex');
        }
        if (unavailableSection) {
            unavailableSection.classList.remove('hidden');
            unavailableSection.classList.add('flex');
        }
        if (dropZone) {
            dropZone.classList.add('hidden');
        }
    }

    showUnavailable();

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone?.addEventListener(eventName, e => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    dropZone?.addEventListener('dragover', () => {
        dropZone.classList.add('border-primary', 'bg-primary/10');
    });

    dropZone?.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-primary', 'bg-primary/10');
    });

    dropZone?.addEventListener('drop', (e) => {
        dropZone.classList.remove('border-primary', 'bg-primary/10');
        const files = e.dataTransfer.files;
        if (files.length) handleFile(files[0]);
    });

    dropZone?.addEventListener('click', () => {
        fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    async function handleFile(file) {
        alert('AI Image Enhancer is currently unavailable. This feature requires a server with GPU for RealESRGAN processing. Please use other tools like Image Converter or Background Remover.');
        fileInput.value = '';
    }
});
