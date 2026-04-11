document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const editorArea = document.getElementById('editor-area');
    const fileList = document.getElementById('file-list');
    const compressBtn = document.getElementById('compress-btn');
    const qualityRange = document.getElementById('quality-range');
    const qualityValue = document.getElementById('quality-value');
    const maxWidthInput = document.getElementById('max-width');
    const addMoreBtn = document.getElementById('add-more-btn');
    const dropZoneContainer = document.getElementById('drop-zone-container');
    const progressStage = document.getElementById('progress-stage');
    const etaDisplay = document.getElementById('eta-display');
    const batchProgressBar = document.getElementById('batch-progress-bar');
    const processingDetails = document.getElementById('processing-details');

    let uploadedFiles = [];

    qualityRange.addEventListener('input', (e) => {
        qualityValue.textContent = `${e.target.value}%`;
    });

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-primary', 'bg-primary/[0.03]', 'scale-[0.99]', 'shadow-inner');
        dropZone.classList.remove('border-slate-200', 'dark:border-slate-800');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-primary', 'bg-primary/[0.03]', 'scale-[0.99]', 'shadow-inner');
        dropZone.classList.add('border-slate-200', 'dark:border-slate-800');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-primary', 'bg-primary/[0.03]', 'scale-[0.99]', 'shadow-inner');
        dropZone.classList.add('border-slate-200', 'dark:border-slate-800');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    function handleFiles(files) {
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const previewUrl = URL.createObjectURL(file);
                uploadedFiles.push({
                    id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    file: file,
                    originalSize: file.size,
                    previewUrl: previewUrl,
                    status: 'pending',
                    compressedSize: 0,
                    savingsPercent: 0,
                    downloadUrl: null
                });
            }
        });

        updateUI();
        resetButtonState();
    }

    function updateUI() {
        if (uploadedFiles.length > 0) {
            dropZoneContainer.classList.add('hidden');
            editorArea.classList.remove('hidden');
        } else {
            editorArea.classList.add('hidden');
            dropZoneContainer.classList.remove('hidden');
        }

        fileList.innerHTML = uploadedFiles.map(item => `
            <div class="group p-6 flex flex-col lg:flex-row items-center justify-between gap-6 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800 last:border-0 relative">
                <div class="flex items-center gap-6 w-full lg:w-auto">
                    <div class="relative group/thumb">
                        <div class="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border-2 border-slate-200 dark:border-slate-700 shadow-sm group-hover/thumb:border-primary/50 transition-colors">
                            <img src="${item.previewUrl}" class="w-full h-full object-cover">
                        </div>
                        ${item.status === 'complete' ? `
                            <div class="absolute -top-2 -right-2 bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900">
                                <span class="material-symbols-outlined text-[10px] font-black">check</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="min-w-0 flex-1">
                        <p class="text-slate-900 dark:text-white text-sm font-black truncate max-w-[200px]">${item.file.name}</p>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">${(item.file.type.split('/')[1] || 'image').toUpperCase()}</span>
                            <span class="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                            <span class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">${formatBytes(item.originalSize)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                    ${item.status === 'complete' ? `
                        <div class="flex items-center gap-3 bg-slate-100 dark:bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                            <span class="text-[9px] text-slate-400 font-bold line-through">${formatBytes(item.originalSize)}</span>
                            <span class="material-symbols-outlined text-slate-300 text-sm">arrow_forward</span>
                            <span class="text-xs text-primary font-black">${formatBytes(item.compressedSize)}</span>
                            <span class="text-[9px] text-green-500 font-black">-${item.savingsPercent}%</span>
                        </div>
                        <a href="${item.downloadUrl}" download="compressed_${item.file.name}" class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                            <span class="material-symbols-outlined text-sm">download</span>Download
                        </a>
                    ` : `
                        <div class="flex items-center gap-3">
                            ${item.status === 'pending' ? '<span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ready</span>' : ''}
                            ${item.status === 'processing' ? '<span class="text-[10px] font-bold text-primary uppercase tracking-widest animate-pulse">Processing...</span>' : ''}
                            ${item.status === 'error' ? '<span class="text-[10px] font-bold text-red-500 uppercase tracking-widest">Failed</span>' : ''}
                            <button onclick="window.removeImage('${item.id}')" class="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:border-red-500/30 rounded-xl transition-all border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                <span class="material-symbols-outlined text-lg">delete</span>
                            </button>
                        </div>
                    `}
                </div>
            </div>
        `).join('');
    }

    window.removeImage = (id) => {
        const item = uploadedFiles.find(i => i.id === id);
        if (item) {
            URL.revokeObjectURL(item.previewUrl);
            if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl);
        }
        uploadedFiles = uploadedFiles.filter(i => i.id !== id);

        if (uploadedFiles.length === 0) {
            resetTool();
        } else {
            updateUI();
            resetButtonState();
        }
    };

    function resetTool() {
        uploadedFiles.forEach(item => {
            URL.revokeObjectURL(item.previewUrl);
            if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl);
        });
        uploadedFiles = [];
        editorArea.classList.add('hidden');
        dropZoneContainer.classList.remove('hidden');
        fileInput.value = '';
        resetButtonState();
    }

    addMoreBtn.addEventListener('click', () => fileInput.click());

    compressBtn.addEventListener('click', async () => {
        const completedCount = uploadedFiles.filter(f => f.status === 'complete').length;
        const totalCount = uploadedFiles.length;

        if (completedCount === totalCount && totalCount > 0) {
            compressBtn.disabled = true;
            compressBtn.innerHTML = '<span class="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full inline-block"></span> Creating ZIP...';
            
            await LazyLoader.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
            
            const zip = new JSZip();
            for (const item of uploadedFiles) {
                const res = await fetch(item.downloadUrl);
                const blob = await res.blob();
                zip.file(`compressed_${item.file.name}`, blob);
            }
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'compressed_images.zip';
            a.click();
            URL.revokeObjectURL(url);

            compressBtn.disabled = false;
            compressBtn.innerHTML = '<span class="material-symbols-outlined text-base">download</span>Download All (ZIP)';
            return;
        }

        compressBtn.disabled = true;
        compressBtn.innerHTML = '<span class="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full inline-block"></span> Loading...';
        
        await LazyLoader.loadScript('https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js');

        const startTime = Date.now();
        const pendingFiles = uploadedFiles.filter(item => item.status === 'pending');

        processingDetails.classList.remove('hidden');

        for (let i = 0; i < uploadedFiles.length; i++) {
            const item = uploadedFiles[i];
            if (item.status === 'complete' || item.status === 'error') continue;

            const overallProgress = Math.round((i / uploadedFiles.length) * 100);
            batchProgressBar.style.width = `${overallProgress}%`;
            progressStage.textContent = 'Optimizing...';

            if (i > 0) {
                const elapsed = Date.now() - startTime;
                const timePerFile = elapsed / i;
                const remainingFiles = uploadedFiles.length - i;
                const remainingTime = Math.round((timePerFile * remainingFiles) / 1000);
                etaDisplay.textContent = `ETA: ${remainingTime}s`;
            }

            compressBtn.innerHTML = `<span class="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full inline-block"></span> Image ${i + 1}/${uploadedFiles.length}`;

            try {
                item.status = 'processing';
                updateUI();

                const baseOptions = {
                    maxSizeMB: (qualityRange.value / 100) * 2,
                    maxWidthOrHeight: maxWidthInput.value ? parseInt(maxWidthInput.value) : undefined,
                    useWebWorker: true
                };

                const compressedFile = await imageCompression(item.file, baseOptions);

                item.status = 'complete';
                item.compressedSize = compressedFile.size;
                item.savingsPercent = Math.max(0, Math.round(((item.originalSize - item.compressedSize) / item.originalSize) * 100));

                if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl);
                item.downloadUrl = URL.createObjectURL(compressedFile);

            } catch (error) {
                console.error('Compression Error:', error);
                item.status = 'error';
            }

            updateUI();
        }

        batchProgressBar.style.width = '100%';
        progressStage.textContent = 'Complete!';
        etaDisplay.textContent = 'Done';

        compressBtn.disabled = false;

        const finalCompletedCount = uploadedFiles.filter(f => f.status === 'complete').length;
        if (finalCompletedCount === totalCount) {
            compressBtn.innerHTML = '<span class="material-symbols-outlined text-base">download</span>Download All (ZIP)';
            compressBtn.classList.remove('bg-primary');
            compressBtn.classList.add('bg-green-600');
        } else {
            compressBtn.innerHTML = '<span class="material-symbols-outlined text-base">rocket_launch</span>Process Batch';
            compressBtn.classList.add('bg-primary');
            compressBtn.classList.remove('bg-green-600');
        }

        setTimeout(() => {
            processingDetails.classList.add('hidden');
        }, 2000);
    });

    function resetButtonState() {
        compressBtn.innerHTML = '<span class="material-symbols-outlined text-base">rocket_launch</span>Process Batch';
        compressBtn.classList.remove('bg-green-600');
        compressBtn.classList.add('bg-primary');
        compressBtn.disabled = false;
    }

    function formatBytes(bytes, decimals = 1) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    }
});
