document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const queueArea = document.getElementById('queue-area');
    const queueList = document.getElementById('queue-list');
    const queueCount = document.getElementById('queue-count');
    const processBtn = document.getElementById('process-btn');
    const addMoreBtn = document.getElementById('add-more-btn');
    const resetBtn = document.getElementById('reset-btn');
    const downloadAllBtn = document.getElementById('download-all-btn');
    const downloadAllArea = document.getElementById('download-all-area');
    const progressBar = document.getElementById('progress-bar');
    const processingStatus = document.getElementById('processing-status');
    const progressStage = document.getElementById('progress-stage');
    const etaDisplay = document.getElementById('eta-display');
    const globalProgressText = document.getElementById('global-progress-text');
    const fileHint = document.getElementById('file-hint');
    const conversionTabs = document.querySelectorAll('.conversion-tab');

    let currentConversion = 'xlsx-pdf';
    let filesQueue = [];
    let isProcessing = false;

    const fileConfigs = {
        'xlsx-pdf': { accept: '.xlsx', sourceLabel: 'XLSX', targetLabel: 'PDF', hint: 'Select XLSX files to convert to PDF. Multiple files supported.' },
        'pdf-xlsx': { accept: '.pdf', sourceLabel: 'PDF', targetLabel: 'XLSX', hint: 'Select PDF files to convert to XLSX. Multiple files supported.' }
    };

    conversionTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            setConversion(tab.dataset.conversion);
        });
    });

    function setConversion(conversion) {
        currentConversion = conversion;
        conversionTabs.forEach(t => {
            if (t.dataset.conversion === conversion) {
                t.classList.add('bg-accent', 'text-white');
                t.classList.remove('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
            } else {
                t.classList.remove('bg-accent', 'text-white');
                t.classList.add('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
            }
        });
        const config = fileConfigs[conversion];
        fileInput.accept = config.accept;
        fileHint.textContent = config.hint;
        resetTool();
    }

    dropZone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); });
    });

    dropZone.addEventListener('dragover', () => dropZone.classList.add('border-accent', 'bg-accent/5'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-accent', 'bg-accent/5'));
    dropZone.addEventListener('drop', e => {
        dropZone.classList.remove('border-accent', 'bg-accent/5');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', e => {
        handleFiles(e.target.files);
        fileInput.value = '';
    });

    addMoreBtn.addEventListener('click', () => fileInput.click());
    resetBtn.addEventListener('click', resetTool);

    function handleFiles(files) {
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            if (ext !== fileConfigs[currentConversion].accept) return;

            filesQueue.push({
                id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                file: file,
                status: 'pending',
                resultBlob: null,
                error: null
            });
        });

        if (filesQueue.length > 0) {
            dropZone.classList.add('hidden');
            queueArea.classList.remove('hidden');
        }
        renderQueue();
    }

    function renderQueue() {
        queueCount.textContent = filesQueue.length;

        const stats = { pending: 0, success: 0, error: 0, processing: 0 };
        filesQueue.forEach(f => stats[f.status]++);

        document.getElementById('stat-pending').textContent = stats.pending;
        document.getElementById('stat-success').textContent = stats.success;
        document.getElementById('stat-error').textContent = stats.error;

        processBtn.disabled = stats.pending === 0 || isProcessing;

        const canDownload = stats.success > 0 && !isProcessing;
        downloadAllArea.classList.toggle('hidden', filesQueue.length === 0 || stats.success === 0);

        queueList.innerHTML = filesQueue.map(item => `
            <div class="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 ${item.status === 'success' ? 'border-green-500/30 bg-green-500/5' : item.status === 'error' ? 'border-red-500/30 bg-red-500/5' : item.status === 'processing' ? 'border-accent/30 bg-accent/5' : ''}">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl ${item.status === 'success' ? 'bg-green-500/10' : item.status === 'error' ? 'bg-red-500/10' : 'bg-accent/10'} flex items-center justify-center">
                        <span class="material-symbols-outlined ${item.status === 'success' ? 'text-green-500' : item.status === 'error' ? 'text-red-500' : 'text-accent'}">table_chart</span>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[250px]">${item.file.name}</p>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-[10px] text-slate-500">${formatBytes(item.file.size)}</span>
                            ${item.status === 'pending' ? '<span class="text-[10px] text-accent font-bold uppercase">Ready</span>' : ''}
                            ${item.status === 'processing' ? '<span class="text-[10px] text-accent font-bold uppercase animate-pulse">Converting...</span>' : ''}
                            ${item.status === 'success' ? '<span class="text-[10px] text-green-500 font-bold uppercase">Done</span>' : ''}
                            ${item.status === 'error' ? '<span class="text-[10px] text-red-500 font-bold uppercase">Failed</span>' : ''}
                            ${item.error ? `<span class="text-[10px] text-red-400">${item.error}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${item.status === 'success' ? `
                        <a href="${item.downloadUrl}" download="converted_${item.file.name.replace(/\.[^/.]+$/, '')}.${fileConfigs[currentConversion].targetLabel.toLowerCase()}" class="w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-all shadow-lg">
                            <span class="material-symbols-outlined text-lg">download</span>
                        </a>
                    ` : ''}
                    ${item.status !== 'processing' ? `
                        <button onclick="window.removeFromQueue('${item.id}')" class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all">
                            <span class="material-symbols-outlined text-base">close</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    window.removeFromQueue = (id) => {
        const item = filesQueue.find(f => f.id === id);
        if (item && item.downloadUrl) {
            URL.revokeObjectURL(item.downloadUrl);
        }
        filesQueue = filesQueue.filter(f => f.id !== id);
        if (filesQueue.length === 0) {
            resetTool();
        } else {
            renderQueue();
        }
    };

    processBtn.addEventListener('click', async () => {
        const pending = filesQueue.filter(f => f.status === 'pending' || f.status === 'error');
        if (pending.length === 0) return;

        isProcessing = true;
        processingStatus.classList.remove('hidden');
        renderQueue();

        const total = pending.length;
        const startTime = Date.now();
        let completed = 0;

        if (!window.XLSX) {
            progressStage.textContent = 'Loading Excel library...';
            await LazyLoader.loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
        }
        if (!window.jspdf) {
            progressStage.textContent = 'Loading PDF library...';
            await LazyLoader.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }

        for (const item of pending) {
            if (completed > 0) {
                const elapsed = Date.now() - startTime;
                const avgTime = elapsed / completed;
                const remaining = total - completed;
                const remainingSecs = Math.round((avgTime * remaining) / 1000);
                etaDisplay.textContent = `ETA: ${remainingSecs}s`;
            }

            item.status = 'processing';
            progressStage.textContent = `Converting ${completed + 1} of ${total}...`;
            globalProgressText.textContent = `File ${completed + 1} of ${total}`;
            progressBar.style.width = `${(completed / total) * 100}%`;
            renderQueue();

            try {
                if (currentConversion === 'xlsx-pdf') {
                    item.resultBlob = await convertXlsxToPdf(item.file);
                } else {
                    item.resultBlob = await convertPdfToXlsx(item.file);
                }
                item.status = 'success';
                item.downloadUrl = URL.createObjectURL(item.resultBlob);
            } catch (error) {
                item.status = 'error';
                item.error = error.message || 'Conversion failed';
            }

            completed++;
            progressBar.style.width = `${(completed / total) * 100}%`;
            renderQueue();
        }

        isProcessing = false;
        processingStatus.classList.add('hidden');
        renderQueue();
    });

    async function convertXlsxToPdf(file) {
        const { jsPDF } = window.jspdf;
        const data = await file.arrayBuffer();
        const workbook = window.XLSX.read(data, { type: 'array' });

        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const colWidth = (pageWidth - margin * 2) / 8;
        const rowHeight = 8;

        for (let sheetIndex = 0; sheetIndex < workbook.SheetNames.length; sheetIndex++) {
            if (sheetIndex > 0) pdf.addPage();

            const sheetName = workbook.SheetNames[sheetIndex];
            const sheet = workbook.Sheets[sheetName];
            const range = window.XLSX.utils.decode_range(sheet['!ref'] || 'A1');

            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text(sheetName, margin, margin + 5);

            let y = margin + 12;
            const maxCols = Math.min(range.e.c - range.s.c + 1, 8);
            const maxRows = Math.min(range.e.r - range.s.r + 1, Math.floor((pageHeight - y - margin) / rowHeight));

            for (let row = range.s.r; row <= range.s.r + maxRows - 1 && row <= range.e.r; row++) {
                let x = margin;
                for (let col = range.s.c; col <= range.s.c + maxCols - 1 && col <= range.e.c; col++) {
                    const cellRef = window.XLSX.utils.encode_cell({ r: row, c: col });
                    const cell = sheet[cellRef];
                    let cellValue = cell?.v !== undefined ? String(cell.v) : (cell?.w || '');
                    const isHeader = row === range.s.r;

                    pdf.setDrawColor(200, 200, 200);
                    pdf.rect(x, y, colWidth, rowHeight);
                    pdf.setFontSize(8);
                    pdf.setFont('helvetica', isHeader ? 'bold' : 'normal');
                    pdf.text(cellValue.substring(0, 12), x + 2, y + 5);
                    x += colWidth;
                }
                y += rowHeight;
            }
        }
        return pdf.output('blob');
    }

    async function convertPdfToXlsx(file) {
        if (!window.pdfjsLib) {
            await LazyLoader.loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const allData = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            let currentRow = [];
            let lastY = null;

            for (const item of content.items) {
                const y = item.transform[5];
                if (lastY !== null && Math.abs(y - lastY) > 3) {
                    if (currentRow.length > 0) allData.push(currentRow);
                    currentRow = [];
                }
                currentRow.push(item.str.trim());
                lastY = y;
            }
            if (currentRow.length > 0) allData.push(currentRow);
        }

        const worksheet = window.XLSX.utils.aoa_to_sheet(allData);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracted Data');
        const wbout = window.XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }

    downloadAllBtn.addEventListener('click', async () => {
        const successes = filesQueue.filter(f => f.status === 'success' && f.resultBlob);
        if (successes.length === 0) return;

        if (successes.length === 1) {
            const item = successes[0];
            const a = document.createElement('a');
            a.href = item.downloadUrl;
            a.download = `converted_${item.file.name.replace(/\.[^/.]+$/, '')}.${fileConfigs[currentConversion].targetLabel.toLowerCase()}`;
            a.click();
            return;
        }

        downloadAllBtn.disabled = true;
        downloadAllBtn.innerHTML = '<span class="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full inline-block"></span> Creating ZIP...';

        const JSZip = window.JSZip || (await LazyLoader.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'), window.JSZip);
        const zip = new JSZip();

        for (const item of successes) {
            zip.file(`converted_${item.file.name.replace(/\.[^/.]+$/, '')}.${fileConfigs[currentConversion].targetLabel.toLowerCase()}`, item.resultBlob);
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = 'converted_files.zip';
        a.click();

        downloadAllBtn.disabled = false;
        downloadAllBtn.innerHTML = '<span class="material-symbols-outlined">download</span>Download All (ZIP)';
    });

    function resetTool() {
        filesQueue.forEach(item => {
            if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl);
        });
        filesQueue = [];
        isProcessing = false;
        dropZone.classList.remove('hidden');
        queueArea.classList.add('hidden');
        processingStatus.classList.add('hidden');
        downloadAllArea.classList.add('hidden');
        progressBar.style.width = '0%';
        renderQueue();
    }

    function formatBytes(bytes, decimals = 1) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    }

    setConversion('xlsx-pdf');
});
