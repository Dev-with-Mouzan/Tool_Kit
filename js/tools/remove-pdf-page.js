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
    const removeArea = document.getElementById('remove-area');
    const pdfNameEl = document.getElementById('pdf-name');
    const pageCountEl = document.getElementById('page-count');
    const pagesToRemoveInput = document.getElementById('pages-to-remove');
    const removeBtn = document.getElementById('remove-btn');
    const resetBtn = document.getElementById('reset-btn');

    let loadedPdfBytes = null;
    let loadedFileName = '';
    let totalPages = 0;

    function parsePageRange(input, max) {
        const pages = new Set();
        const parts = input.split(',').map(s => s.trim()).filter(Boolean);
        for (const part of parts) {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                if (isNaN(start) || isNaN(end) || start < 1 || end > max || start > end) continue;
                for (let i = start; i <= end; i++) pages.add(i);
            } else {
                const n = parseInt(part);
                if (!isNaN(n) && n >= 1 && n <= max) pages.add(n);
            }
        }
        return Array.from(pages).sort((a, b) => a - b);
    }

    async function loadPdf(file) {
        loadedFileName = file.name;
        loadedPdfBytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(loadedPdfBytes);
        totalPages = pdf.getPageCount();
        pdfNameEl.textContent = file.name;
        pageCountEl.textContent = totalPages + ' page' + (totalPages !== 1 ? 's' : '');
        dropZone.classList.add('hidden');
        removeArea.classList.remove('hidden');
    }

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-red-500', 'bg-red-500/5');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-red-500', 'bg-red-500/5'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-red-500', 'bg-red-500/5');
        const file = e.dataTransfer.files[0];
        if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
            loadPdf(file);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) {
            loadPdf(fileInput.files[0]);
            fileInput.value = '';
        }
    });

    resetBtn.addEventListener('click', () => {
        loadedPdfBytes = null;
        totalPages = 0;
        pagesToRemoveInput.value = '';
        removeArea.classList.add('hidden');
        dropZone.classList.remove('hidden');
    });

    removeBtn.addEventListener('click', async () => {
        const input = pagesToRemoveInput.value.trim();
        if (!input) {
            alert('Please enter page numbers to remove.');
            return;
        }

        const pagesToRemove = parsePageRange(input, totalPages);
        if (pagesToRemove.length === 0) {
            alert('No valid pages found. Check your input.');
            return;
        }
        if (pagesToRemove.length >= totalPages) {
            alert('Cannot remove all pages from the PDF.');
            return;
        }

        removeBtn.disabled = true;
        removeBtn.innerHTML = '<span class="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full inline-block"></span> Processing...';

        try {
            const srcPdf = await PDFDocument.load(loadedPdfBytes);
            const newPdf = await PDFDocument.create();
            const removeSet = new Set(pagesToRemove.map(p => p - 1));
            const keepIndices = [];
            for (let i = 0; i < totalPages; i++) {
                if (!removeSet.has(i)) keepIndices.push(i);
            }
            const copiedPages = await newPdf.copyPages(srcPdf, keepIndices);
            copiedPages.forEach(page => newPdf.addPage(page));
            const pdfBytes = await newPdf.save();

            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            const baseName = loadedFileName.replace(/\.pdf$/i, '');
            a.download = baseName + '_edited.pdf';
            a.click();

            URL.revokeObjectURL(url);

        } catch (err) {
            console.error('Error removing pages:', err);
            alert('Error removing pages: ' + err.message);
        }

        removeBtn.disabled = false;
        removeBtn.innerHTML = '<span class="material-symbols-outlined text-sm">delete</span>Remove & Download';
    });
})();
