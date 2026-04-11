document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const queueArea = document.getElementById('queue-area');
    const queueList = document.getElementById('queue-list');
    const queueSummary = document.getElementById('queue-summary');
    const convertAllBtn = document.getElementById('convert-all-btn');
    const resetAllBtn = document.getElementById('reset-all-btn');
    const addMoreBtn = document.getElementById('add-more-btn');
    const formatSelect = document.getElementById('format-select');

    if (!fileInput || !dropZone) {
        console.error('Critical UI elements missing for image-converter');
        return;
    }

    let filesQueue = [];
    let isProcessing = false;

    // File selection
    dropZone.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON' && e.target.parentElement?.tagName !== 'BUTTON') {
            fileInput.click();
        }
    });
    const selectBtn = dropZone.querySelector('button');
    if (selectBtn) {
        selectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }

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

    if (addMoreBtn) {
        addMoreBtn.addEventListener('click', () => fileInput.click());
    }

    function handleFiles(files) {
        if (!files || files.length === 0) return;
        const targetFormat = formatSelect ? formatSelect.value : 'png';

        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const previewUrl = URL.createObjectURL(file);
                filesQueue.push({
                    id: Math.random().toString(36).substr(2, 9),
                    file,
                    originalSize: file.size,
                    previewUrl,
                    status: 'ready',
                    targetFormat,
                    resultUrl: null,
                    resultSize: 0,
                    error: null
                });
            }
        });

        if (filesQueue.length > 0) {
            dropZone.classList.add('hidden');
            if (queueArea) queueArea.classList.remove('hidden');
            renderQueue();
        }
    }

    // When global format changes, update all pending items
    if (formatSelect) {
        formatSelect.addEventListener('change', () => {
            filesQueue.forEach(item => {
                if (item.status === 'ready' || item.status === 'error') {
                    item.targetFormat = formatSelect.value;
                }
            });
            renderQueue();
        });
    }

    function renderQueue() {
        if (!queueList) return;
        queueList.innerHTML = '';
        if (queueSummary) {
            queueSummary.textContent = filesQueue.length + ' file' + (filesQueue.length !== 1 ? 's' : '');
        }

        filesQueue.forEach(item => {
            const row = document.createElement('div');
            row.className = `p-4 flex items-center gap-4 group transition-all rounded-xl border ${
                item.status === 'complete' ? 'border-green-200 dark:border-green-900/30 bg-green-500/5' :
                item.status === 'error' ? 'border-red-200 dark:border-red-900/30 bg-red-500/5' :
                item.status === 'processing' ? 'border-primary/30 bg-primary/5' :
                'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30'
            }`;

            const statusLabel = item.status === 'ready' ? 'Ready' :
                item.status === 'processing' ? 'Converting...' :
                item.status === 'complete' ? 'Done' : 'Failed';

            const ext = item.file.type.split('/')[1]?.toUpperCase() || 'IMAGE';

            row.innerHTML = `
                <div class="w-14 h-14 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-inner">
                    <img src="${item.previewUrl}" class="w-full h-full object-cover">
                </div>
                <div class="flex-1 min-w-0">
                    <h5 class="text-xs font-bold text-slate-900 dark:text-white truncate">${item.file.name}</h5>
                    <span class="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                        ${formatBytes(item.originalSize)} &bull; ${ext} &rarr;
                        <span class="text-primary font-black">${item.targetFormat.toUpperCase()}</span>
                    </span>
                    ${item.error ? `<p class="text-[9px] text-red-500 mt-1">${item.error}</p>` : ''}
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <span class="text-[9px] font-bold uppercase tracking-widest ${
                        item.status === 'complete' ? 'text-green-500' :
                        item.status === 'error' ? 'text-red-500' :
                        item.status === 'processing' ? 'text-primary animate-pulse' : 'text-slate-400'
                    }">${statusLabel}</span>
                    ${item.status === 'complete' && item.resultUrl ? `
                        <a href="${item.resultUrl}" download="converted_${item.file.name.split('.')[0]}.${item.targetFormat}" class="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all" title="Download">
                            <span class="material-symbols-outlined text-lg">download</span>
                        </a>
                    ` : ''}
                    ${!isProcessing ? `
                        <button class="remove-item-btn w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-all" data-id="${item.id}">
                            <span class="material-symbols-outlined text-lg">close</span>
                        </button>
                    ` : ''}
                </div>
            `;
            queueList.appendChild(row);
        });

        // Bind remove buttons
        queueList.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const idx = filesQueue.findIndex(i => i.id === id);
                if (idx > -1) {
                    URL.revokeObjectURL(filesQueue[idx].previewUrl);
                    if (filesQueue[idx].resultUrl) URL.revokeObjectURL(filesQueue[idx].resultUrl);
                    filesQueue.splice(idx, 1);
                    if (filesQueue.length === 0) reset();
                    else renderQueue();
                }
            };
        });

        // Update convert button state
        if (convertAllBtn) {
            const allDone = filesQueue.length > 0 && filesQueue.every(f => f.status === 'complete');
            if (allDone) {
                convertAllBtn.innerHTML = '<span class="material-symbols-outlined text-sm">download</span>Download All (ZIP)';
                convertAllBtn.classList.remove('from-primary', 'to-indigo-600');
                convertAllBtn.classList.add('bg-green-600');
                convertAllBtn.dataset.mode = 'download';
            } else {
                convertAllBtn.innerHTML = '<span class="material-symbols-outlined text-sm">sync_alt</span>Convert All';
                convertAllBtn.classList.add('from-primary', 'to-indigo-600');
                convertAllBtn.classList.remove('bg-green-600');
                convertAllBtn.dataset.mode = 'convert';
            }
            convertAllBtn.disabled = isProcessing;
        }
    }

    // Convert All / Download All
    if (convertAllBtn) {
        convertAllBtn.addEventListener('click', async () => {
            if (convertAllBtn.dataset.mode === 'download') {
                await downloadAllAsZip();
                return;
            }
            if (isProcessing || filesQueue.length === 0) return;

            isProcessing = true;
            renderQueue();

            const toProcess = filesQueue.filter(f => f.status === 'ready' || f.status === 'error');

            for (let i = 0; i < toProcess.length; i++) {
                const item = toProcess[i];
                item.status = 'processing';
                item.error = null;
                renderQueue();
                convertAllBtn.innerHTML = `<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span>Processing ${i+1}/${toProcess.length}`;

                try {
                    const blob = await convertImage(item.file, item.targetFormat);
                    item.resultUrl = URL.createObjectURL(blob);
                    item.resultSize = blob.size;
                    item.status = 'complete';
                } catch (err) {
                    console.error(err);
                    item.status = 'error';
                    item.error = err.message || 'Conversion failed';
                }
                renderQueue();
            }

            isProcessing = false;
            renderQueue();
        });
    }

    async function downloadAllAsZip() {
        const completed = filesQueue.filter(f => f.status === 'complete' && f.resultUrl);
        if (completed.length === 0) return;

        if (completed.length === 1) {
            const item = completed[0];
            const a = document.createElement('a');
            a.href = item.resultUrl;
            a.download = `converted_${item.file.name.split('.')[0]}.${item.targetFormat}`;
            a.click();
            return;
        }

        convertAllBtn.disabled = true;
        convertAllBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span>Zipping...';

        try {
            if (typeof JSZip === 'undefined') {
                await new Promise((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                    s.onload = resolve;
                    s.onerror = reject;
                    document.head.appendChild(s);
                });
            }

            const zip = new JSZip();
            for (const item of completed) {
                const res = await fetch(item.resultUrl);
                const blob = await res.blob();
                zip.file(`converted_${item.file.name.split('.')[0]}.${item.targetFormat}`, blob);
            }
            const content = await zip.generateAsync({ type: 'blob' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(content);
            a.download = 'converted_images.zip';
            a.click();
            URL.revokeObjectURL(a.href);
        } catch (err) {
            console.error(err);
            alert('Failed to create ZIP. Please download files individually.');
        }

        convertAllBtn.disabled = false;
        renderQueue();
    }

    function reset() {
        filesQueue.forEach(item => {
            if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
            if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
        });
        filesQueue = [];
        fileInput.value = '';
        dropZone.classList.remove('hidden');
        if (queueArea) queueArea.classList.add('hidden');
        isProcessing = false;
    }

    if (resetAllBtn) resetAllBtn.addEventListener('click', reset);

    function convertImage(file, format) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    let mimeType = `image/${format}`;
                    if (format === 'jpeg' || format === 'jpg') mimeType = 'image/jpeg';

                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Canvas conversion failed'));
                    }, mimeType, 0.92);
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});
