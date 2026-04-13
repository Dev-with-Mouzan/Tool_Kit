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

    let currentConversion = 'xlsx-docx';
    let filesQueue = [];
    let isProcessing = false;

    const fileConfigs = {
        'xlsx-docx': { accept: '.xlsx', sourceLabel: 'XLSX', targetLabel: 'DOCX', hint: 'Select XLSX files to convert to DOCX. Multiple files supported.' },
        'docx-xlsx': { accept: '.docx', sourceLabel: 'DOCX', targetLabel: 'XLSX', hint: 'Select DOCX files to convert to XLSX. Multiple files supported.' }
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
                t.classList.add('bg-green-500', 'text-white');
                t.classList.remove('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
            } else {
                t.classList.remove('bg-green-500', 'text-white');
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

    dropZone.addEventListener('dragover', () => dropZone.classList.add('border-green-500', 'bg-green-500/5'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-green-500', 'bg-green-500/5'));
    dropZone.addEventListener('drop', e => {
        dropZone.classList.remove('border-green-500', 'bg-green-500/5');
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
        downloadAllArea.classList.toggle('hidden', filesQueue.length === 0 || stats.success === 0);

        queueList.innerHTML = filesQueue.map(item => `
            <div class="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 ${item.status === 'success' ? 'border-green-500/30 bg-green-500/5' : item.status === 'error' ? 'border-red-500/30 bg-red-500/5' : item.status === 'processing' ? 'border-green-500/30 bg-green-500/5' : ''}">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl ${item.status === 'success' ? 'bg-green-500/10' : item.status === 'error' ? 'bg-red-500/10' : 'bg-green-500/10'} flex items-center justify-center">
                        <span class="material-symbols-outlined ${item.status === 'success' ? 'text-green-500' : item.status === 'error' ? 'text-red-500' : 'text-green-500'}">grid_on</span>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[250px]">${item.file.name}</p>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-[10px] text-slate-500">${formatBytes(item.file.size)}</span>
                            ${item.status === 'pending' ? '<span class="text-[10px] text-green-500 font-bold uppercase">Ready</span>' : ''}
                            ${item.status === 'processing' ? '<span class="text-[10px] text-green-500 font-bold uppercase animate-pulse">Converting...</span>' : ''}
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
        if (!window.docx) {
            progressStage.textContent = 'Loading Word library...';
            await LazyLoader.loadScript('https://unpkg.com/docx@8.5.0/build/index.umd.js');
        }
        if (!window.JSZip) {
            progressStage.textContent = 'Loading compression library...';
            await LazyLoader.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
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
                if (currentConversion === 'xlsx-docx') {
                    item.resultBlob = await convertXlsxToDocx(item.file);
                } else {
                    item.resultBlob = await convertDocxToXlsx(item.file);
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

    async function convertXlsxToDocx(file) {
        const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType } = window.docx;

        const data = await file.arrayBuffer();
        const workbook = window.XLSX.read(data, { type: 'array' });
        const children = [];

        for (let sheetIndex = 0; sheetIndex < workbook.SheetNames.length; sheetIndex++) {
            const sheetName = workbook.SheetNames[sheetIndex];
            const sheet = workbook.Sheets[sheetName];
            const range = window.XLSX.utils.decode_range(sheet['!ref'] || 'A1');

            children.push(
                new Paragraph({
                    text: sheetName,
                    heading: HeadingLevel.HEADING_1,
                    spacing: { after: 200 }
                })
            );

            const tableRows = [];
            const maxCols = Math.min(range.e.c - range.s.c + 1, 10);
            const maxRows = Math.min(range.e.r - range.s.r + 1, 50);

            for (let row = range.s.r; row <= range.s.r + maxRows - 1 && row <= range.e.r; row++) {
                const tableCells = [];
                for (let col = range.s.c; col <= range.s.c + maxCols - 1 && col <= range.e.c; col++) {
                    const cellRef = window.XLSX.utils.encode_cell({ r: row, c: col });
                    const cell = sheet[cellRef];
                    let cellValue = cell?.v !== undefined ? String(cell.v) : (cell?.w || '');
                    const isHeader = row === range.s.r;

                    tableCells.push(
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: cellValue.substring(0, 50), bold: isHeader })] })],
                            shading: isHeader ? { fill: 'E8E8E8' } : undefined,
                            margins: { top: 50, bottom: 50, left: 100, right: 100 }
                        })
                    );
                }
                tableRows.push(new TableRow({ children: tableCells }));
            }

            children.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

            if (sheetIndex < workbook.SheetNames.length - 1) {
                children.push(new Paragraph({ text: '' }));
            }
        }

        const doc = new Document({
            sections: [{ properties: {}, children: children }]
        });

        return await Packer.toBlob(doc);
    }

    async function convertDocxToXlsx(file) {
        const zip = await window.JSZip.loadAsync(await file.arrayBuffer());
        const docFile = zip.file('word/document.xml');
        if (!docFile) throw new Error('Invalid DOCX: Missing document.xml');
        
        const documentXml = await docFile.async('string');

        const parser = new DOMParser();
        const doc = parser.parseFromString(documentXml, 'text/xml');
        const aoa = [];

        const rows = doc.getElementsByTagName('w:tr');
        if (rows.length > 0) {
            for (const row of rows) {
                const rowData = [];
                const cells = row.getElementsByTagName('w:tc');
                for (const cell of cells) {
                    let cellText = '';
                    const texts = cell.getElementsByTagName('w:t');
                    for (const t of texts) {
                        cellText += t.textContent || '';
                    }
                    rowData.push(cellText);
                }
                if (rowData.length > 0) aoa.push(rowData);
            }
        } else {
            // Fallback: extract paragraphs as rows if no tables are found
            const paragraphs = doc.getElementsByTagName('w:p');
            for (const p of paragraphs) {
                const texts = p.getElementsByTagName('w:t');
                let pText = '';
                for (const t of texts) {
                    pText += t.textContent || '';
                }
                if (pText.trim()) aoa.push([pText.trim()]);
            }
        }

        if (aoa.length === 0) aoa.push(['No content found in document']);

        const worksheet = window.XLSX.utils.aoa_to_sheet(aoa);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracted Data');
        
        // Use binary string then convert to array buffer for better compatibility
        const wbout = window.XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
        const buf = new ArrayBuffer(wbout.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < wbout.length; i++) view[i] = wbout.charCodeAt(i) & 0xFF;
        
        return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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

    setConversion('xlsx-docx');
});
