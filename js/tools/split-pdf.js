(async function() {
    'use strict';

    const loadScript = (src) => new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });

    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');

    const { PDFDocument } = PDFLib;

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const splitArea = document.getElementById('split-area');
    const pdfNameEl = document.getElementById('pdf-name');
    const pageCountEl = document.getElementById('page-count');
    const pageRangeInput = document.getElementById('page-range');
    const splitBtn = document.getElementById('split-btn');
    const splitAllBtn = document.getElementById('split-all-btn');
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
        splitArea.classList.remove('hidden');
    }

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-accent', 'bg-accent/5');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-accent', 'bg-accent/5'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-accent', 'bg-accent/5');
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
        pageRangeInput.value = '';
        splitArea.classList.add('hidden');
        dropZone.classList.remove('hidden');
    });

    splitBtn.addEventListener('click', async () => {
        const input = pageRangeInput.value.trim();
        if (!input) {
            alert('Please enter page numbers to extract.');
            return;
        }

        const pages = parsePageRange(input, totalPages);
        if (pages.length === 0) {
            alert('No valid pages found. Check your input.');
            return;
        }

        splitBtn.disabled = true;
        splitBtn.innerHTML = '<span class="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full inline-block"></span> Splitting...';

        try {
            const srcPdf = await PDFDocument.load(loadedPdfBytes);
            const newPdf = await PDFDocument.create();
            const indices = pages.map(p => p - 1);
            const copiedPages = await newPdf.copyPages(srcPdf, indices);
            copiedPages.forEach(page => newPdf.addPage(page));
            const pdfBytes = await newPdf.save();

            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            const baseName = loadedFileName.replace(/\.pdf$/i, '');
            a.download = baseName + '_pages_' + input.replace(/\s/g, '') + '.pdf';
            a.click();

            URL.revokeObjectURL(url);

        } catch (err) {
            console.error('Error splitting PDF:', err);
            alert('Error splitting PDF: ' + err.message);
        }

        splitBtn.disabled = false;
        splitBtn.innerHTML = '<span class="material-symbols-outlined text-sm">call_split</span>Split & Download';
    });

    splitAllBtn.addEventListener('click', async () => {
        splitAllBtn.disabled = true;
        splitAllBtn.innerHTML = '<span class="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full inline-block"></span> Splitting...';

        try {
            const srcPdf = await PDFDocument.load(loadedPdfBytes);
            const zip = new JSZip();
            const baseName = loadedFileName.replace(/\.pdf$/i, '');

            for (let i = 0; i < totalPages; i++) {
                const newPdf = await PDFDocument.create();
                const [page] = await newPdf.copyPages(srcPdf, [i]);
                newPdf.addPage(page);
                const bytes = await newPdf.save();
                zip.file(baseName + '_page_' + (i + 1) + '.pdf', bytes);
            }

            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);

            const a = document.createElement('a');
            a.href = url;
            a.download = baseName + '_split_pages.zip';
            a.click();

            URL.revokeObjectURL(url);

        } catch (err) {
            console.error('Error splitting PDF:', err);
            alert('Error splitting PDF: ' + err.message);
        }

        splitAllBtn.disabled = false;
        splitAllBtn.innerHTML = '<span class="material-symbols-outlined text-sm">content_cut</span>Split All Pages';
    });
})();
