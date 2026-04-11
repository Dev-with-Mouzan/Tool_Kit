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

    let currentConversion = 'docx-pdf';
    let filesQueue = [];
    let isProcessing = false;

    const fileConfigs = {
        'docx-pdf': { accept: '.docx', sourceLabel: 'DOCX', targetLabel: 'PDF', hint: 'Select DOCX files to convert to PDF. Multiple files supported.' },
        'pdf-docx': { accept: '.pdf', sourceLabel: 'PDF', targetLabel: 'DOCX', hint: 'Select PDF files to convert to DOCX. Multiple files supported.' }
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
                t.classList.add('bg-primary', 'text-white');
                t.classList.remove('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
            } else {
                t.classList.remove('bg-primary', 'text-white');
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

    dropZone.addEventListener('dragover', () => dropZone.classList.add('border-primary', 'bg-primary/5'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-primary', 'bg-primary/5'));
    dropZone.addEventListener('drop', e => {
        dropZone.classList.remove('border-primary', 'bg-primary/5');
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
            <div class="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 ${item.status === 'success' ? 'border-green-500/30 bg-green-500/5' : item.status === 'error' ? 'border-red-500/30 bg-red-500/5' : item.status === 'processing' ? 'border-primary/30 bg-primary/5' : ''}">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl ${item.status === 'success' ? 'bg-green-500/10' : item.status === 'error' ? 'bg-red-500/10' : 'bg-primary/10'} flex items-center justify-center">
                        <span class="material-symbols-outlined ${item.status === 'success' ? 'text-green-500' : item.status === 'error' ? 'text-red-500' : 'text-primary'}">article</span>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[250px]">${item.file.name}</p>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-[10px] text-slate-500">${formatBytes(item.file.size)}</span>
                            ${item.status === 'pending' ? '<span class="text-[10px] text-primary font-bold uppercase">Ready</span>' : ''}
                            ${item.status === 'processing' ? '<span class="text-[10px] text-primary font-bold uppercase animate-pulse">Converting...</span>' : ''}
                            ${item.status === 'success' ? '<span class="text-[10px] text-green-500 font-bold uppercase">Done</span>' : ''}
                            ${item.status === 'error' ? '<span class="text-[10px] text-red-500 font-bold uppercase">Failed</span>' : ''}
                            ${item.error ? `<span class="text-[10px] text-red-400">${item.error}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${item.status === 'success' ? `
                        <a href="${URL.createObjectURL(item.resultBlob)}" download="converted_${item.file.name.replace(/\.[^/.]+$/, '')}.${fileConfigs[currentConversion].targetLabel.toLowerCase()}" class="w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-all shadow-lg">
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
                if (currentConversion === 'docx-pdf') {
                    item.resultBlob = await convertDocxToPdf(item.file);
                } else {
                    item.resultBlob = await convertPdfToDocx(item.file);
                }
                item.status = 'success';
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

    async function convertDocxToPdf(file) {
        if (!window.jspdf) {
            progressStage.textContent = 'Loading PDF library...';
            await LazyLoader.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }

        const { jsPDF } = window.jspdf;
        const text = await extractTextFromDocx(file);

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const maxWidth = pageWidth - (margin * 2);
        let y = margin;
        const lineHeight = 6;

        const lines = text.split('\n');

        for (const line of lines) {
            if (line.trim() === '') {
                y += lineHeight;
                continue;
            }

            const isHeading = line.length < 50 && !line.includes('.');
            const fontSize = isHeading ? 14 : 11;
            const isBold = isHeading;

            pdf.setFontSize(fontSize);
            pdf.setFont('helvetica', isBold ? 'bold' : 'normal');

            const wrappedLines = pdf.splitTextToSize(line.trim(), maxWidth);

            for (const wrappedLine of wrappedLines) {
                if (y > pageHeight - margin - lineHeight) {
                    pdf.addPage();
                    y = margin;
                }
                pdf.text(wrappedLine, margin, y);
                y += lineHeight;
            }

            if (isHeading) y += 4;
        }

        return pdf.output('blob');
    }

    async function extractTextFromDocx(file) {
        const JSZip = window.JSZip || (await LazyLoader.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'), window.JSZip);

        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const documentXml = await zip.file('word/document.xml').async('string');

        const parser = new DOMParser();
        const doc = parser.parseFromString(documentXml, 'text/xml');

        let text = '';
        const paragraphs = doc.getElementsByTagName('w:p');

        for (const p of paragraphs) {
            const texts = p.getElementsByTagName('w:t');
            for (const t of texts) {
                text += t.textContent || '';
            }
            text += '\n';
        }

        return text;
    }

    async function convertPdfToDocx(file) {
        if (!window.pdfjsLib) {
            progressStage.textContent = 'Loading PDF library...';
            await LazyLoader.loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        if (!window.docx) {
            progressStage.textContent = 'Loading Word library...';
            await LazyLoader.loadScript('https://unpkg.com/docx@8.5.0/build/index.umd.js');
        }

        const { Document, Packer, Paragraph, TextRun } = window.docx;

        const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        const children = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();

            let pageText = '';
            let lastY = null;

            for (const item of content.items) {
                if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                    pageText += '\n';
                }
                pageText += item.str;
                lastY = item.transform[5];
            }

            const paragraphs = pageText.split('\n').filter(t => t.trim());

            for (const paraText of paragraphs) {
                children.push(
                    new Paragraph({
                        children: [new TextRun({ text: paraText.trim(), size: 24 })]
                    })
                );
            }

            if (i < pdf.numPages) {
                children.push(new Paragraph({ text: '' }));
            }
        }

        const doc = new Document({
            sections: [{ properties: {}, children: children }]
        });

        return await Packer.toBlob(doc);
    }

    downloadAllBtn.addEventListener('click', async () => {
        const successes = filesQueue.filter(f => f.status === 'success' && f.resultBlob);
        if (successes.length === 0) return;

        if (successes.length === 1) {
            const item = successes[0];
            const a = document.createElement('a');
            a.href = URL.createObjectURL(item.resultBlob);
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

    setConversion('docx-pdf');
});
