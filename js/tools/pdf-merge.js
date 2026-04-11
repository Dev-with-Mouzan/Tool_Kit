(async function() {
    'use strict';

    await new Promise(resolve => {
        if (typeof PDFLib !== 'undefined') {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
        script.onload = resolve;
        script.onerror = () => {
            console.error('Failed to load PDF-lib');
            resolve();
        };
        document.head.appendChild(script);
    });

    const { PDFDocument } = PDFLib;

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const queueArea = document.getElementById('queue-area');
    const queueList = document.getElementById('queue-list');
    const queueSummary = document.getElementById('queue-summary');
    const mergeBtn = document.getElementById('merge-btn');
    const addMoreBtn = document.getElementById('add-more-btn');
    const resetBtn = document.getElementById('reset-all-btn');

    let pdfFiles = [];

    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    function addFiles(files) {
        for (const file of files) {
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                pdfFiles.push(file);
            }
        }
        renderQueue();
    }

    function renderQueue() {
        if (pdfFiles.length === 0) {
            queueArea.classList.add('hidden');
            dropZone.classList.remove('hidden');
            return;
        }
        dropZone.classList.add('hidden');
        queueArea.classList.remove('hidden');
        queueSummary.textContent = pdfFiles.length + ' file' + (pdfFiles.length > 1 ? 's' : '') + ' selected';

        queueList.innerHTML = pdfFiles.map((file, index) => `
            <div class="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 group" draggable="true" data-index="${index}">
                <div class="flex items-center gap-4 flex-1 min-w-0">
                    <span class="material-symbols-outlined text-slate-400 cursor-grab">drag_indicator</span>
                    <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <span class="material-symbols-outlined">picture_as_pdf</span>
                    </div>
                    <div class="min-w-0">
                        <p class="text-sm font-bold text-slate-900 dark:text-white truncate">${file.name}</p>
                        <p class="text-xs text-slate-400">${formatSize(file.size)}</p>
                    </div>
                </div>
                <button class="remove-file-btn text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" data-index="${index}">
                    <span class="material-symbols-outlined text-sm">close</span>
                </button>
            </div>
        `).join('');

        queueList.querySelectorAll('.remove-file-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                pdfFiles.splice(idx, 1);
                renderQueue();
            });
        });

        mergeBtn.disabled = pdfFiles.length < 2;
    }

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-primary', 'bg-primary/5');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-primary', 'bg-primary/5'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-primary', 'bg-primary/5');
        addFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', () => {
        addFiles(fileInput.files);
        fileInput.value = '';
    });

    addMoreBtn.addEventListener('click', () => fileInput.click());
    resetBtn.addEventListener('click', () => {
        pdfFiles = [];
        renderQueue();
    });

    mergeBtn.addEventListener('click', async () => {
        if (pdfFiles.length < 2) {
            alert('Please add at least 2 PDF files to merge.');
            return;
        }

        mergeBtn.disabled = true;
        mergeBtn.innerHTML = '<span class="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full inline-block"></span> Merging...';

        try {
            const mergedPdf = await PDFDocument.create();

            for (const file of pdfFiles) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach(page => mergedPdf.addPage(page));
            }

            const mergedBytes = await mergedPdf.save();
            const blob = new Blob([mergedBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'merged.pdf';
            a.click();

            URL.revokeObjectURL(url);

        } catch (err) {
            console.error('Error merging PDFs:', err);
            alert('Error merging PDFs: ' + err.message);
        }

        mergeBtn.disabled = false;
        mergeBtn.innerHTML = '<span class="material-symbols-outlined text-sm">merge</span>Merge All';
    });
})();
