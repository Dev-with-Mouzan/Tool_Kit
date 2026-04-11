document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const editorArea = document.getElementById('editor-area');
    const imageGrid = document.getElementById('image-grid');
    const queueSummary = document.getElementById('queue-summary');
    const generateBtn = document.getElementById('generate-pdf-btn');
    const resetBtn = document.getElementById('reset-btn');
    const addMoreBtn = document.getElementById('add-more-btn');
    const pageSizeSelect = document.getElementById('page-size');
    const orientationSelect = document.getElementById('orientation');
    const marginSelect = document.getElementById('margin');
    const processOverlay = document.getElementById('process-overlay');
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');
    const successArea = document.getElementById('success-area');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const newPdfBtn = document.getElementById('new-pdf-btn');

    let uploadedFiles = [];
    let pdfUrl = null;

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-indigo-500', 'bg-indigo-500/5');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-indigo-500', 'bg-indigo-500/5'));

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-indigo-500', 'bg-indigo-500/5');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        fileInput.value = '';
    });

    addMoreBtn.addEventListener('click', () => fileInput.click());

    function handleFiles(files) {
        if (!files || files.length === 0) return;

        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            alert('Please select image files (JPG, PNG, WebP)');
            return;
        }

        imageFiles.forEach(file => {
            const previewUrl = URL.createObjectURL(file);
            uploadedFiles.push({
                id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                file: file,
                previewUrl: previewUrl
            });
        });

        dropZone.classList.add('hidden');
        editorArea.classList.remove('hidden');
        renderGrid();
    }

    function renderGrid() {
        queueSummary.textContent = `${uploadedFiles.length} image${uploadedFiles.length !== 1 ? 's' : ''} selected`;

        imageGrid.innerHTML = uploadedFiles.map((item, index) => `
            <div class="relative group">
                <div class="aspect-square rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <img src="${item.previewUrl}" class="w-full h-full object-cover">
                </div>
                <button onclick="window.removeImage('${item.id}')" class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                    <span class="material-symbols-outlined text-sm">close</span>
                </button>
                <span class="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-bold">${index + 1}</span>
            </div>
        `).join('');
    }

    window.removeImage = (id) => {
        const item = uploadedFiles.find(i => i.id === id);
        if (item) URL.revokeObjectURL(item.previewUrl);
        uploadedFiles = uploadedFiles.filter(i => i.id !== id);

        if (uploadedFiles.length === 0) {
            resetTool();
        } else {
            renderGrid();
        }
    };

    resetBtn.addEventListener('click', resetTool);
    newPdfBtn.addEventListener('click', resetTool);

    function resetTool() {
        uploadedFiles.forEach(item => URL.revokeObjectURL(item.previewUrl));
        uploadedFiles = [];
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        pdfUrl = null;
        editorArea.classList.add('hidden');
        successArea.classList.add('hidden');
        dropZone.classList.remove('hidden');
        fileInput.value = '';
    }

    generateBtn.addEventListener('click', async () => {
        if (uploadedFiles.length === 0) return;

        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span class="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full inline-block"></span> Loading...';

        try {
            if (!window.jspdf) {
                await LazyLoader.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            }
            if (!window.jspdf || !window.jspdf.jsPDF) {
                throw new Error('Failed to load jsPDF library');
            }
            const { jsPDF } = window.jspdf;

            processOverlay.classList.remove('hidden');
            progressBar.style.width = '0%';
            progressPercent.textContent = '0%';

            const pageSize = pageSizeSelect.value;
            const margin = parseInt(marginSelect.value);
            const orientationPref = orientationSelect.value;

            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: pageSize === 'letter' ? 'letter' : 'a4'
            });

            for (let i = 0; i < uploadedFiles.length; i++) {
                const item = uploadedFiles[i];
                const percent = Math.round(((i + 1) / uploadedFiles.length) * 100);
                progressBar.style.width = `${percent}%`;
                progressPercent.textContent = `${percent}%`;

                generateBtn.innerHTML = `<span class="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full inline-block"></span> Page ${i + 1}/${uploadedFiles.length}`;

                const img = await loadImage(item.previewUrl);

                let pdfW, pdfH;
                if (pageSize === 'original') {
                    pdfW = (img.width * 25.4) / 96;
                    pdfH = (img.height * 25.4) / 96;
                } else {
                    pdfW = pdf.internal.pageSize.getWidth();
                    pdfH = pdf.internal.pageSize.getHeight();
                }

                let finalOrientation = orientationPref;
                if (orientationPref === 'auto') {
                    finalOrientation = img.width > img.height ? 'l' : 'p';
                }

                if (i > 0) {
                    pdf.addPage([pdfW, pdfH], finalOrientation);
                } else if (finalOrientation === 'l') {
                    pdf.deletePage(1);
                    pdf.addPage([pdfH, pdfW], 'l');
                }

                const availableW = pdfW - (margin * 2);
                const availableH = pdfH - (margin * 2);

                const ratio = img.width / img.height;
                let drawW = availableW;
                let drawH = drawW / ratio;

                if (drawH > availableH) {
                    drawH = availableH;
                    drawW = drawH * ratio;
                }

                const x = margin + (availableW - drawW) / 2;
                const y = margin + (availableH - drawH) / 2;

                const format = item.file.type.split('/')[1].toUpperCase().replace('JPEG', 'JPG');
                pdf.addImage(img, format === 'JPG' ? 'JPEG' : format, x, y, drawW, drawH);
            }

            const pdfBlob = pdf.output('blob');
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
            pdfUrl = URL.createObjectURL(pdfBlob);

            downloadPdfBtn.href = pdfUrl;
            downloadPdfBtn.download = `images_${Date.now()}.pdf`;

            processOverlay.classList.add('hidden');
            editorArea.classList.add('hidden');
            successArea.classList.remove('hidden');

        } catch (error) {
            console.error('PDF generation error:', error);
            alert('Failed to generate PDF: ' + error.message);
            processOverlay.classList.add('hidden');
        }

        generateBtn.disabled = false;
        generateBtn.innerHTML = '<span class="material-symbols-outlined text-sm">picture_as_pdf</span>Generate PDF';
    });

    function loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }
});
