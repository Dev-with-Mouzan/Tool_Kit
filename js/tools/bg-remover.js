document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const queueArea = document.getElementById('queue-area');
    const queueList = document.getElementById('queue-list');
    const queueSummary = document.getElementById('queue-summary');
    const addMoreBtn = document.getElementById('add-more-btn');
    const processAllBtn = document.getElementById('process-all-btn');
    const resetAllBtn = document.getElementById('reset-all-btn');
    const previewLightbox = document.getElementById('preview-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');

    let processingQueue = [];
    let isProcessing = false;
    let bgRemovalWorker = null;

    const previewUrlCache = new Map();

    function getPreviewUrl(file) {
        if (!previewUrlCache.has(file)) {
            previewUrlCache.set(file, URL.createObjectURL(file));
        }
        return previewUrlCache.get(file);
    }

    function clearPreviewUrls() {
        previewUrlCache.forEach(url => URL.revokeObjectURL(url));
        previewUrlCache.clear();
    }

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    dropZone.addEventListener('dragover', () => dropZone.classList.add('border-primary/70', 'bg-primary/10'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-primary/70', 'bg-primary/10'));

    dropZone.addEventListener('drop', e => {
        dropZone.classList.remove('border-primary/70', 'bg-primary/10');
        handleFiles(e.dataTransfer.files);
    });

    dropZone.addEventListener('click', () => fileInput.click());
    if (addMoreBtn) addMoreBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
        fileInput.value = '';
    });

    function handleFiles(files) {
        if (!files.length) return;

        let addedCount = 0;
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;

            processingQueue.push({
                id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                file: file,
                status: 'pending',
                resultUrl: null,
                errorMsg: null,
                previewUrl: getPreviewUrl(file)
            });
            addedCount++;
        });

        if (addedCount > 0) {
            updateUI();
            resetButtonState();
        } else {
            alert('Please select valid image files.');
        }
    }

    function resetButtonState() {
        if (!processAllBtn) return;
        processAllBtn.disabled = false;
        processAllBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-green-600', 'from-green-600', 'to-green-700');
        processAllBtn.classList.add('bg-gradient-to-r', 'from-primary', 'to-indigo-600');
        processAllBtn.innerHTML = '<span class="material-symbols-outlined text-sm">auto_awesome</span>Remove All Backgrounds';
    }

    function removeFile(id) {
        if (isProcessing) return;
        processingQueue = processingQueue.filter(item => item.id !== id);
        updateUI();
    }

    function resetAll() {
        if (isProcessing) return;
        processingQueue = [];
        clearPreviewUrls();
        updateUI();
    }

    if (resetAllBtn) resetAllBtn.addEventListener('click', resetAll);

    function updateUI() {
        if (processingQueue.length === 0) {
            dropZone.classList.remove('hidden');
            queueArea.classList.add('hidden');
            return;
        }

        dropZone.classList.add('hidden');
        queueArea.classList.remove('hidden');

        const pendingCount = processingQueue.filter(i => i.status === 'pending').length;
        const doneCount = processingQueue.filter(i => i.status === 'done').length;
        if (queueSummary) {
            queueSummary.textContent = `${processingQueue.length} images total (${pendingCount} pending, ${doneCount} ready)`;
        }

        if (processAllBtn) {
            if (doneCount === processingQueue.length && processingQueue.length > 0) {
                processAllBtn.disabled = false;
                processAllBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'from-primary', 'to-indigo-600', 'bg-gradient-to-r');
                processAllBtn.classList.add('bg-green-600');
                processAllBtn.innerHTML = '<span class="material-symbols-outlined text-sm">download</span>Download All (ZIP)';
            } else if (isProcessing) {
                processAllBtn.disabled = true;
                processAllBtn.classList.add('opacity-50', 'cursor-not-allowed');
            } else if (pendingCount === 0) {
                processAllBtn.disabled = true;
                processAllBtn.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                resetButtonState();
            }
        }

        queueList.innerHTML = '';
        processingQueue.forEach(item => {
            const el = document.createElement('div');
            el.className = 'w-full queue-item glass-card rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6 transition-all border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4 border-l-4 ' + 
                (item.status === 'done' ? 'border-green-500 bg-green-500/5' : 
                 item.status === 'error' ? 'border-red-500 bg-red-500/5' : 
                 item.status === 'processing' ? 'border-primary bg-primary/5' : 'border-transparent');
            
            let statusHTML = '';
            let actionHTML = '';

            if (item.status === 'pending') {
                statusHTML = `<span class="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700">Pending</span>`;
                actionHTML = `<button onclick="removeFile('${item.id}')" class="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-red-500 flex items-center justify-center transition-all border border-slate-300 dark:border-slate-700" title="Remove" ${isProcessing ? 'disabled' : ''}><span class="material-symbols-outlined text-base">delete</span></button>`;
            } else if (item.status === 'processing') {
                statusHTML = `<span class="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/30 flex items-center gap-1.5"><span class="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full"></span> Processing</span>`;
            } else if (item.status === 'done') {
                statusHTML = `<span class="px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 text-[10px] font-bold uppercase tracking-widest border border-green-500/20">Finished</span>`;
                actionHTML = `
                    <div class="flex items-center gap-2">
                        <button onclick="previewImage('${item.resultUrl}')" class="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-white flex items-center justify-center hover:bg-slate-300 transition-all border border-slate-300 dark:border-slate-700 shadow-sm">
                            <span class="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        <a href="${item.resultUrl}" download="no_bg_${item.file.name}" class="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-primary/20">
                            <span class="material-symbols-outlined text-lg">download</span>
                        </a>
                    </div>
                `;
            } else if (item.status === 'error') {
                statusHTML = `<span class="px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 text-[10px] font-bold uppercase tracking-widest border border-red-500/20">Failed</span>`;
                actionHTML = `
                    <div class="flex items-center gap-2">
                        <button onclick="retryItem('${item.id}')" class="w-10 h-10 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white flex items-center justify-center transition-all border border-primary/30" title="Retry">
                            <span class="material-symbols-outlined text-base">replay</span>
                        </button>
                        <button onclick="removeFile('${item.id}')" class="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-red-500 flex items-center justify-center transition-all border border-slate-300 dark:border-slate-700" title="Remove">
                            <span class="material-symbols-outlined text-base">delete</span>
                        </button>
                    </div>`;
            }

            const imgSrc = item.resultUrl || item.previewUrl;
            const previewClasses = item.status === 'done' ? 'checkerboard' : 'bg-slate-100 dark:bg-slate-900';

            el.innerHTML = `
                <div class="w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50 flex items-center justify-center p-1.5 shadow-inner ${previewClasses}">
                    <img src="${imgSrc}" class="max-w-full max-h-full object-contain">
                </div>
                <div class="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 class="text-sm font-bold text-slate-900 dark:text-white truncate mb-1.5" title="${item.file.name}">${item.file.name}</h4>
                    <div class="flex flex-wrap items-center gap-3">
                        <span class="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold border border-slate-200 dark:border-slate-700">${(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                        ${statusHTML}
                    </div>
                    ${item.errorMsg ? `<p class="text-[10px] text-red-500 font-bold mt-1.5 flex items-center gap-1"><span class="material-symbols-outlined text-xs">error</span>${item.errorMsg}</p>` : ''}
                </div>
                <div class="shrink-0">
                    ${actionHTML}
                </div>
            `;
            queueList.appendChild(el);
        });

        if (window.lucide) lucide.createIcons();
    }

    window.removeFile = removeFile;
    window.retryItem = function(id) {
        const item = processingQueue.find(i => i.id === id);
        if (item) {
            item.status = 'pending';
            item.errorMsg = null;
            updateUI();
        }
    };
    window.previewImage = function (url) {
        if (lightboxImg) lightboxImg.src = url;
        if (previewLightbox) {
            previewLightbox.classList.remove('hidden');
            previewLightbox.classList.add('flex');
        }
    };

    let libBackgroundRemoval = null;

    async function initAILibrary() {
        if (!libBackgroundRemoval) {
            try {
                const mod = await import('https://esm.sh/@imgly/background-removal@1.4.5');
                libBackgroundRemoval = {
                    removeBackground: mod.removeBackground || mod.default,
                    preload: mod.preload
                };
            } catch (err) {
                console.error('Failed to load BG removal library:', err);
                throw new Error('AI Library failed to load. Please check your connection.');
            }
        }
        return libBackgroundRemoval;
    }

    async function removeBackground(imageUrl) {
        try {
            const lib = await initAILibrary();
            const blob = await lib.removeBackground(imageUrl, {
                model: 'small',
                progress: (key, current, total) => {
                    if (key === 'compute:inference') {
                        console.log(`Inference progress: ${Math.round((current / total) * 100)}%`);
                    }
                },
                output: {
                    format: 'image/png',
                    quality: 0.8
                }
            });
            return blob;
        } catch (error) {
            console.error('Background removal error:', error);
            throw error;
        }
    }

    processAllBtn.addEventListener('click', async () => {
        const doneCount = processingQueue.filter(i => i.status === 'done').length;
        if (doneCount === processingQueue.length && processingQueue.length > 0) {
            processAllBtn.disabled = true;
            processAllBtn.innerHTML = '<span class="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span> Zipping...';

            try {
                await LazyLoader.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
                const zip = new JSZip();
                for (const item of processingQueue) {
                    const response = await fetch(item.resultUrl);
                    const blob = await response.blob();
                    zip.file(`no_bg_${item.file.name.split('.')[0]}.png`, blob);
                }
                const content = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'filetoolkit_bg_removed.zip';
                a.click();
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error(err);
                alert("Download failed: " + err.message);
            } finally {
                updateUI();
            }
            return;
        }

        if (isProcessing) return;
        const pendingItems = processingQueue.filter(item => item.status === 'pending');
        if (pendingItems.length === 0) return;

        try {
            processAllBtn.innerHTML = '<span class="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span> Preparing AI...';
            const lib = await initAILibrary();
            if (lib.preload) {
                lib.preload({ model: 'small' }).catch(e => console.warn('Preload warning:', e));
            }
        } catch (importError) {
            alert(importError.message);
            resetButtonState();
            return;
        }

        isProcessing = true;
        const processingDetails = document.getElementById('processing-details');
        const progressBar = document.getElementById('batch-progress-bar');
        const progressStage = document.getElementById('progress-stage');
        const etaDisplay = document.getElementById('eta-display');

        if (processingDetails) processingDetails.classList.remove('hidden');
        
        const totalPending = pendingItems.length;
        const startTime = Date.now();
        
        for (let i = 0; i < pendingItems.length; i++) {
            const item = pendingItems[i];
            
            const overallProgress = Math.round((i / totalPending) * 100);
            if (progressBar) progressBar.style.width = `${overallProgress}%`;
            if (progressStage) {
                progressStage.textContent = overallProgress < 80 ? 'Removing Background...' : 'Finalizing...';
            }

            if (i > 0) {
                const elapsed = Date.now() - startTime;
                const avgTime = elapsed / i;
                const remaining = totalPending - i;
                const remainingTime = Math.round((avgTime * remaining) / 1000);
                if (etaDisplay) etaDisplay.textContent = `ETA: ~${remainingTime}s`;
            } else if (etaDisplay) {
                etaDisplay.textContent = `ETA: ~${totalPending * 5}s`;
            }

            processAllBtn.innerHTML = `<span class="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span> Processing (${i + 1}/${totalPending})`;
            
            item.status = 'processing';
            updateUI();

            try {
                // Pre-process: Resize if image is too large for faster AI inference
                let processedImageUrl = item.previewUrl;
                const originalImage = new Image();
                
                // Fix: Attach listener BEFORE setting src to avoid race condition
                await new Promise((resolve, reject) => {
                    originalImage.onload = resolve;
                    originalImage.onerror = () => reject(new Error('Failed to load image for processing'));
                    originalImage.src = item.previewUrl;
                });
                
                const maxSize = 1024;
                if (originalImage.width > maxSize || originalImage.height > maxSize) {
                    const canvas = document.createElement('canvas');
                    let width = originalImage.width;
                    let height = originalImage.height;
                    
                    if (width > height) {
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(originalImage, 0, 0, width, height);
                    
                    const resizedBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
                    processedImageUrl = URL.createObjectURL(resizedBlob);
                }

                const blob = await removeBackground(processedImageUrl);

                item.resultUrl = URL.createObjectURL(blob);
                item.status = 'done';
                
                if (processedImageUrl !== item.previewUrl) {
                    URL.revokeObjectURL(processedImageUrl);
                }
            } catch (error) {
                console.error(`Error processing ${item.file.name}:`, error);
                item.status = 'error';
                item.errorMsg = error.message || 'Background removal failed';
            }

            updateUI();
        }

        if (progressBar) progressBar.style.width = '100%';
        if (progressStage) progressStage.textContent = 'Complete';
        if (etaDisplay) etaDisplay.textContent = 'ETA: 0s';
        
        isProcessing = false;
        updateUI();

        setTimeout(() => {
            if (processingDetails) processingDetails.classList.add('hidden');
        }, 3000);
    });

    // Initial background preload
    initAILibrary().then(lib => {
        if (lib && lib.preload) lib.preload({ model: 'small' }).catch(() => {});
    }).catch(() => {});
});
