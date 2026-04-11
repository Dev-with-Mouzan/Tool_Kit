document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const queueArea = document.getElementById('queue-area');
    const queueList = document.getElementById('queue-list');
    const queueSummary = document.getElementById('queue-summary');
    const compressAllBtn = document.getElementById('compress-all-btn');
    const addMoreBtn = document.getElementById('add-more-btn');
    const resetAllBtn = document.getElementById('reset-all-btn');

    let pdfFiles = [];

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-primary', 'bg-primary/5');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-primary', 'bg-primary/5'));

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-primary', 'bg-primary/5');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        fileInput.value = '';
    });

    addMoreBtn.addEventListener('click', () => fileInput.click());
    resetAllBtn.addEventListener('click', () => {
        pdfFiles = [];
        renderQueue();
        dropZone.classList.remove('hidden');
        queueArea.classList.add('hidden');
    });

    function handleFiles(files) {
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                pdfFiles.push({
                    id: 'pdf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    file: file,
                    originalSize: file.size,
                    status: 'pending',
                    compressedSize: 0,
                    savings: 0,
                    resultUrl: null
                });
            }
        });

        dropZone.classList.add('hidden');
        queueArea.classList.remove('hidden');
        renderQueue();
    }

    function renderQueue() {
        queueSummary.textContent = `${pdfFiles.length} file${pdfFiles.length !== 1 ? 's' : ''}`;

        const pendingCount = pdfFiles.filter(f => f.status === 'pending').length;
        const doneCount = pdfFiles.filter(f => f.status === 'complete').length;

        compressAllBtn.disabled = pendingCount === 0;

        if (doneCount === pdfFiles.length && pdfFiles.length > 0) {
            compressAllBtn.innerHTML = '<span class="material-symbols-outlined text-sm">download</span>Download All (ZIP)';
            compressAllBtn.classList.remove('from-primary', 'to-indigo-600');
            compressAllBtn.classList.add('bg-green-600');
        } else {
            compressAllBtn.innerHTML = '<span class="material-symbols-outlined text-sm">compress</span>Compress All';
            compressAllBtn.classList.add('from-primary', 'to-indigo-600');
            compressAllBtn.classList.remove('bg-green-600');
        }

        queueList.innerHTML = pdfFiles.map(item => `
            <div class="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl ${item.status === 'complete' ? 'bg-green-500/10' : item.status === 'error' ? 'bg-red-500/10' : 'bg-primary/10'} flex items-center justify-center">
                        <span class="material-symbols-outlined ${item.status === 'complete' ? 'text-green-500' : item.status === 'error' ? 'text-red-500' : 'text-primary'}">picture_as_pdf</span>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">${item.file.name}</p>
                        <div class="flex items-center gap-2 mt-0.5">
                            ${item.status === 'complete' ? `
                                <span class="text-[10px] text-slate-400 line-through">${formatBytes(item.originalSize)}</span>
                                <span class="text-[10px] text-slate-400">→</span>
                                <span class="text-[10px] text-green-600 font-bold">${formatBytes(item.compressedSize)}</span>
                                <span class="text-[10px] text-green-600 font-black">-${item.savings}%</span>
                            ` : `
                                <span class="text-[10px] text-slate-500">${formatBytes(item.originalSize)}</span>
                            `}
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${item.status === 'pending' ? '<span class="text-[10px] text-slate-400 font-bold uppercase">Ready</span>' : ''}
                    ${item.status === 'processing' ? '<span class="text-[10px] text-primary font-bold uppercase animate-pulse">Compressing...</span>' : ''}
                    ${item.status === 'complete' ? `
                        <a href="${item.resultUrl}" download="compressed_${item.file.name}" class="w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-all shadow-lg">
                            <span class="material-symbols-outlined text-lg">download</span>
                        </a>
                    ` : ''}
                    ${item.status === 'error' ? '<span class="text-[10px] text-red-500 font-bold">Failed</span>' : ''}
                    ${item.status !== 'processing' ? `
                        <button onclick="window.removePdf('${item.id}')" class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all">
                            <span class="material-symbols-outlined text-base">close</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    window.removePdf = (id) => {
        const item = pdfFiles.find(i => i.id === id);
        if (item && item.resultUrl) URL.revokeObjectURL(item.resultUrl);
        pdfFiles = pdfFiles.filter(i => i.id !== id);

        if (pdfFiles.length === 0) {
            dropZone.classList.remove('hidden');
            queueArea.classList.add('hidden');
        } else {
            renderQueue();
        }
    };

    compressAllBtn.addEventListener('click', async () => {
        const allDone = pdfFiles.every(f => f.status === 'complete');

        if (allDone && pdfFiles.length > 0) {
            await downloadAllAsZip();
            return;
        }

        compressAllBtn.disabled = true;
        compressAllBtn.innerHTML = '<span class="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full inline-block"></span> Compressing...';

        const pdfLib = window.PDFLib || (await LazyLoader.loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js'), window.PDFLib);
        if (!pdfLib) {
            alert('Failed to load PDF library. Please refresh the page.');
            compressAllBtn.disabled = false;
            compressAllBtn.innerHTML = '<span class="material-symbols-outlined text-sm">compress</span>Compress All';
            return;
        }

        for (const item of pdfFiles) {
            if (item.status !== 'pending') continue;

            item.status = 'processing';
            renderQueue();

            try {
                const arrayBuffer = await item.file.arrayBuffer();
                const pdfDoc = await pdfLib.PDFDocument.load(arrayBuffer);
                const pdfBytes = await pdfDoc.save({
                    useObjectStreams: true,
                    addDefaultPage: false,
                    updateMetadata: false
                });

                item.compressedSize = pdfBytes.length;
                item.savings = Math.max(0, Math.round(((item.originalSize - item.compressedSize) / item.originalSize) * 100));
                
                if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                item.resultUrl = URL.createObjectURL(blob);
                item.status = 'complete';

            } catch (error) {
                console.error('Compression error:', error);
                item.status = 'error';
            }

            renderQueue();
        }

        compressAllBtn.disabled = false;
        renderQueue();
    });

    async function downloadAllAsZip() {
        if (pdfFiles.length === 1) {
            const item = pdfFiles[0];
            const a = document.createElement('a');
            a.href = item.resultUrl;
            a.download = `compressed_${item.file.name}`;
            a.click();
            return;
        }

        compressAllBtn.disabled = true;
        compressAllBtn.innerHTML = '<span class="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full inline-block"></span> Creating ZIP...';

        const JSZip = window.JSZip || (await LazyLoader.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'), window.JSZip);
        if (!JSZip) {
            alert('Failed to load ZIP library. Please refresh the page.');
            compressAllBtn.disabled = false;
            renderQueue();
            return;
        }
        const zip = new JSZip();

        for (const item of pdfFiles) {
            if (item.resultUrl) {
                const res = await fetch(item.resultUrl);
                const blob = await res.blob();
                zip.file(`compressed_${item.file.name}`, blob);
            }
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'compressed_pdfs.zip';
        a.click();
        URL.revokeObjectURL(url);

        compressAllBtn.disabled = false;
        renderQueue();
    }

    function formatBytes(bytes, decimals = 1) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    }
});
