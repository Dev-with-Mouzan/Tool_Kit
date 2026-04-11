let ffmpeg = null;
let ffmpegLoaded = false;

console.log('video-converter.js loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const editorArea = document.getElementById('editor-area');
    const queueList = document.getElementById('queue-list');
    const queueCount = document.getElementById('queue-count');
    const convertBtn = document.getElementById('convert-btn');
    const resetBtn = document.getElementById('reset-btn');
    const clearBtn = document.getElementById('clear-completed-btn');
    const downloadAllBtn = document.getElementById('download-all-btn');
    const formatBtns = document.querySelectorAll('.format-btn');
    const progressBar = document.getElementById('progress-bar');
    const globalProgressText = document.getElementById('global-progress-text');
    const processingStatus = document.getElementById('processing-status');
    const statPending = document.getElementById('stat-pending');
    const statSuccess = document.getElementById('stat-success');
    const statError = document.getElementById('stat-error');
    
    console.log('Elements found:', { fileInput, dropZone, editorArea, queueList, queueCount });

    let filesQueue = [];
    let isProcessing = false;
    let globalFormat = 'mp4';

    formatBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            formatBtns.forEach(b => {
                b.classList.remove('border-primary', 'bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/30', 'scale-105');
                b.classList.add('border-slate-200', 'bg-slate-50', 'text-slate-600', 'dark:border-slate-700', 'dark:bg-slate-800', 'dark:text-slate-400');
            });

            btn.classList.add('border-primary', 'bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/30', 'scale-105');
            btn.classList.remove('border-slate-200', 'bg-slate-50', 'text-slate-600', 'dark:border-slate-700', 'dark:bg-slate-800', 'dark:text-slate-400');

            globalFormat = btn.dataset.format;

            filesQueue.forEach(item => {
                if (item.status === 'ready' || item.status === 'error') {
                    item.targetFormat = globalFormat;
                }
            });
            renderQueue();
        });
    });

    if (formatBtns.length > 0) {
        formatBtns[0].click();
    }

    dropZone.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') {
            fileInput.click();
        }
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => e.preventDefault());
    });

    dropZone.addEventListener('dragover', () => dropZone.classList.add('bg-primary/10', 'border-primary'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('bg-primary/10', 'border-primary'));

    dropZone.addEventListener('drop', e => {
        dropZone.classList.remove('bg-primary/10', 'border-primary');
        if (e.dataTransfer.files.length) handleFiles(Array.from(e.dataTransfer.files));
    });

    fileInput.addEventListener('change', () => {
        console.log('File input changed, files:', fileInput.files.length);
        if (fileInput.files.length) {
            handleFiles(Array.from(fileInput.files));
        }
    });

    function handleFiles(files) {
        const validFiles = files.filter(file => file.type.startsWith('video/'));

        if (validFiles.length < files.length) {
            alert('Some files were skipped. Only videos are supported.');
        }

        const largeFilesNum = validFiles.filter(f => f.size > 500 * 1024 * 1024).length;
        if (largeFilesNum > 0) {
            alert(`${largeFilesNum} files exceed the 500MB limit and will be skipped.`);
        }

        const accepts = validFiles.filter(f => f.size <= 500 * 1024 * 1024);

        accepts.forEach(file => {
            filesQueue.push({
                file: file,
                id: Math.random().toString(36).substr(2, 9),
                status: 'ready',
                targetFormat: globalFormat,
                progress: 0,
                resultUrl: null,
                error: null
            });
        });

        if (filesQueue.length > 0) {
            console.log('Showing editor area');
            dropZone.classList.add('hidden');
            dropZone.style.display = 'none';
            editorArea.classList.remove('hidden');
            editorArea.style.display = 'block';
            editorArea.style.visibility = 'visible';
            renderQueue();
        }
    }

    function renderQueue() {
        console.log('renderQueue called');
        console.log('queueList:', queueList);
        if (!queueList) {
            console.error('queueList not found!');
            return;
        }
        queueList.innerHTML = '';
        if (queueCount) queueCount.textContent = filesQueue.length;

        const stats = { ready: 0, success: 0, error: 0, processing: 0 };
        filesQueue.forEach(f => stats[f.status === 'processing' ? 'ready' : f.status]++);
        
        if (statPending) statPending.textContent = stats.ready;
        if (statSuccess) statSuccess.textContent = stats.success;
        if (statError) statError.textContent = stats.error;

        const canConvert = stats.ready > 0 || stats.error > 0;
        const canDownload = stats.success > 0 && !isProcessing;
        
        if (canDownload && !canConvert) {
            convertBtn.disabled = false;
            convertBtn.classList.remove('opacity-50', 'from-primary', 'to-indigo-600', 'shadow-primary/20');
            convertBtn.classList.add('bg-green-600', 'shadow-green-600/20');
            convertBtn.innerHTML = '<span class="material-symbols-outlined text-base">download</span>Download All (ZIP)';
            convertBtn.dataset.mode = 'download';
            if (downloadAllBtn) downloadAllBtn.classList.remove('hidden');
        } else {
            if (downloadAllBtn) downloadAllBtn.classList.add('hidden');
            convertBtn.classList.remove('bg-green-600', 'shadow-green-600/20');
            convertBtn.classList.add('from-primary', 'to-indigo-600', 'shadow-primary/20');
            convertBtn.innerHTML = '<span class="material-symbols-outlined text-base">rocket_launch</span>Process Batch';
            convertBtn.disabled = isProcessing || filesQueue.length === 0;
            if (isProcessing) convertBtn.classList.add('opacity-50');
            else convertBtn.classList.remove('opacity-50');
            convertBtn.dataset.mode = 'convert';
        }

        if (clearBtn) {
            clearBtn.classList.toggle('hidden', (stats.success === 0 && stats.error === 0) || isProcessing);
        }

        filesQueue.forEach(item => {
            console.log('Rendering item:', item.file.name);
            const row = document.createElement('div');
            row.className = `p-5 queue-item bg-white dark:bg-slate-900/50 flex flex-col sm:flex-row items-center gap-6 group transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 border-l-4 ${
                item.status === 'success' ? 'border-green-500 bg-green-500/5' : 
                item.status === 'error' ? 'border-red-500 bg-red-500/5' : 
                item.status === 'processing' ? 'border-primary bg-primary/5' : 'border-transparent'
            }`;

            const statusLabel = item.status === 'ready' ? 'Ready' : 
                               item.status === 'processing' ? 'Converting...' : 
                               item.status === 'success' ? 'Finished' : 'Failed';

            row.innerHTML = `
                <div class="w-full sm:w-auto flex items-center justify-between gap-4 w-full">
                    <div class="flex items-center gap-4 w-full min-w-0">
                        <div class="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center shrink-0 justify-center text-slate-500 group-hover:text-primary transition-all shadow-inner border border-slate-200 dark:border-slate-700">
                            <span class="material-symbols-outlined text-3xl animate-float">movie</span>
                        </div>
                        
                        <div class="flex-1 min-w-0 flex flex-col pt-1">
                            <div class="flex items-center justify-between gap-4 mb-2">
                                <div class="flex flex-col truncate pr-4">
                                    <h5 class="text-xs font-black text-slate-900 dark:text-white truncate tracking-wide">${item.file.name}</h5>
                                    <span class="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                        ${formatBytes(item.file.size)} &bull; ${item.file.type.split('/')[1]?.toUpperCase() || 'VIDEO'} &rarr; 
                                        <span class="text-primary font-black">${item.targetFormat.toUpperCase()}</span>
                                    </span>
                                </div>
                                <div class="flex items-center gap-3 shrink-0">
                                    ${item.status === 'ready' ? `
                                        <span class="text-[9px] font-black uppercase tracking-widest text-slate-500">Ready</span>
                                    ` : `
                                        <span class="text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${
                                            item.status === 'success' ? 'text-green-500' : 
                                            item.status === 'error' ? 'text-red-400' : 
                                            item.status === 'processing' ? 'text-primary animate-pulse' : 'text-slate-500'
                                        }">${statusLabel}</span>
                                    `}
                                </div>
                            </div>

                            ${item.status === 'processing' ? `
                                <div class="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                                    <div class="bg-primary h-full transition-all duration-700 ease-in-out" style="width: ${item.progress}%"></div>
                                </div>
                            ` : ''}
                            
                            ${item.error ? `<div class="flex items-center gap-1.5 text-red-500 italic font-medium mt-1"><span class="material-symbols-outlined text-xs">error</span><span class="text-[9px]">${item.error}</span></div>` : ''}
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2 mt-4 sm:mt-0 w-full justify-end sm:w-auto shrink-0">
                    ${item.status === 'success' ? `
                        <button class="download-item-btn w-9 h-9 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-lg active:scale-90" data-id="${item.id}" title="Download Result">
                            <span class="material-symbols-outlined text-xl">download</span>
                        </button>
                    ` : ''}
                    ${!isProcessing ? `
                        <button class="remove-item-btn w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-all group-hover:opacity-100" data-id="${item.id}" title="Remove from Queue">
                            <span class="material-symbols-outlined text-xl">close</span>
                        </button>
                    ` : ''}
                </div>
            `;

            queueList.appendChild(row);
        });

        console.log('Total items in queueList:', queueList.children.length);
        queueList.style.display = 'flex';
        queueList.style.flexDirection = 'column';
        queueList.style.minHeight = '100px';
        bindQueueEvents();
    }

    function bindQueueEvents() {
        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const item = filesQueue.find(i => i.id === id);
                if (item && item.resultUrl) URL.revokeObjectURL(item.resultUrl);
                filesQueue = filesQueue.filter(item => item.id !== id);
                if (filesQueue.length === 0) reset();
                else renderQueue();
            };
        });

        document.querySelectorAll('.download-item-btn').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const item = filesQueue.find(i => i.id === id);
                if (item && item.resultUrl) triggerDownload(item);
            };
        });
    }

    function triggerDownload(item) {
        const link = document.createElement('a');
        link.href = item.resultUrl;
        const base = item.file.name.split('.').slice(0, -1).join('.');
        link.download = `${base}_converted.${item.targetFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async function loadFFmpeg() {
        if (ffmpegLoaded && ffmpeg) return true;
        
        const progressStage = document.getElementById('progress-stage');
        if (progressStage) progressStage.textContent = 'Loading FFmpeg engine...';
        
        return new Promise(async (resolve, reject) => {
            try {
                if (window._ffmpegReady) {
                    ffmpeg = window._ffmpegInstance;
                    window.ffmpegFetchFile = window._fetchFile;
                    ffmpegLoaded = true;
                    resolve(true);
                    return;
                }
                
                const CDN = 'https://unpkg.com/@ffmpeg';
                
                const { FFmpeg: FFmpegClass, fetchFile: fetchFileFn } = await import(`${CDN}/ffmpeg@0.12.10/+esm`);
                
                ffmpeg = new FFmpegClass();
                
                ffmpeg.on('progress', ({ progress }) => {
                    const pending = filesQueue.filter(f => f.status === 'processing');
                    if (pending.length > 0) {
                        pending[0].progress = Math.min(Math.round(progress * 100), 99);
                        renderQueue();
                    }
                });
                
                await ffmpeg.load();
                
                window._ffmpegReady = true;
                window._ffmpegInstance = ffmpeg;
                window._fetchFile = fetchFileFn;
                window.ffmpegFetchFile = fetchFileFn;
                ffmpegLoaded = true;
                resolve(true);
            } catch (err) {
                console.error('FFmpeg load error:', err);
                reject(err);
            }
        });
    }
                
                const loadScript = (src) => {
                    return new Promise((res, rej) => {
                        const existing = document.querySelector(`script[src="${src}"]`);
                        if (existing) { res(); return; }
                        const s = document.createElement('script');
                        s.src = src;
                        s.crossOrigin = 'anonymous';
                        s.onload = res;
                        s.onerror = () => rej(new Error(`Failed to load: ${src}`));
                        document.head.appendChild(s);
                    });
                };
                
                const base = 'https://cdn.jsdelivr.net/npm/@ffmpeg';
                await loadScript(`${base}/core@0.12.6/dist/umd/ffmpeg-core.js`);
                await loadScript(`${base}/util@0.12.1/dist/umd/index.js`);
                await loadScript(`${base}/ffmpeg@0.12.10/dist/umd/index.js`);
                
                for (let i = 0; i < 50; i++) {
                    if (typeof FFmpeg !== 'undefined') break;
                    await new Promise(r => setTimeout(r, 100));
                }
                
                if (typeof FFmpeg === 'undefined') {
                    throw new Error('FFmpeg library not found on window');
                }
                
                ffmpeg = new FFmpeg();
                
                ffmpeg.on('progress', ({ progress }) => {
                    const pending = filesQueue.filter(f => f.status === 'processing');
                    if (pending.length > 0) {
                        pending[0].progress = Math.min(Math.round(progress * 100), 99);
                        renderQueue();
                    }
                });
                
                await ffmpeg.load({
                    coreURL: `${base}/core@0.12.6/dist/umd/ffmpeg-core.js`,
                    wasmURL: `${base}/core@0.12.6/dist/umd/ffmpeg-core.wasm`
                });
                
                window._ffmpegReady = true;
                window._ffmpegInstance = ffmpeg;
                window._fetchFile = fetchFile;
                window.ffmpegFetchFile = fetchFile;
                ffmpegLoaded = true;
                resolve(true);
            } catch (err) {
                console.error('FFmpeg load error:', err);
                reject(err);
            }
        });
    }

    convertBtn.addEventListener('click', async () => {
        if (convertBtn.dataset.mode === 'download') {
            const successes = filesQueue.filter(f => f.status === 'success' && f.resultUrl);
            if (successes.length === 0) return;

            if (successes.length === 1) {
                triggerDownload(successes[0]);
                return;
            }

            const activeText = convertBtn.innerHTML;
            convertBtn.innerHTML = '<span class="material-symbols-outlined text-base animate-spin">cyclone</span>Zipping...';
            convertBtn.disabled = true;

            try {
                await LazyLoader.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
                
                const zip = new JSZip();
                const folder = zip.folder("FileToolkitPro_Videos");

                for (const item of successes) {
                    const res = await fetch(item.resultUrl);
                    const blob = await res.blob();
                    const base = item.file.name.split('.').slice(0, -1).join('.');
                    folder.file(`${base}_converted.${item.targetFormat}`, blob);
                }

                const content = await zip.generateAsync({ type: "blob" });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(content);
                link.download = "FileToolkitPro_Videos.zip";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
            } catch (err) {
                console.error(err);
                alert("Failed to bundle videos");
            } finally {
                convertBtn.innerHTML = activeText;
                convertBtn.disabled = false;
            }
            return;
        }

        const pending = filesQueue.filter(f => f.status === 'ready' || f.status === 'error');
        if (pending.length === 0) return;

        try {
            await loadFFmpeg();
        } catch (err) {
            alert(err.message);
            return;
        }

        isProcessing = true;
        processingStatus.classList.remove('hidden');
        document.getElementById('processing-details')?.classList.remove('hidden');
        renderQueue();

        let completed = 0;
        let total = pending.length;
        const startTime = Date.now();
        const progressStage = document.getElementById('progress-stage');
        const etaDisplay = document.getElementById('eta-display');
        const batchProgressBar = document.getElementById('batch-progress-bar');
        
        for (const item of pending) {
            if (completed > 0) {
                const elapsed = Date.now() - startTime;
                const avgTime = elapsed / completed;
                const remaining = total - completed;
                const remainingSecs = Math.round((avgTime * remaining) / 1000);
                if (etaDisplay) etaDisplay.textContent = `ETA: ${remainingSecs}s`;
            }
            if (progressStage) {
                progressStage.textContent = completed / total < 0.8 ? 'Transcoding...' : 'Finalizing...';
            }

            item.status = 'processing';
            item.progress = 0;
            item.error = null;
            renderQueue();
            
            globalProgressText.textContent = `Video ${completed + 1} of ${total}`;
            updateGlobalProgress(((completed) / total) * 100);
            if (batchProgressBar) batchProgressBar.style.width = `${(completed / total) * 100}%`;

            try {
                const inputName = `input_${item.id}.${item.file.name.split('.').pop()}`;
                const outputName = `output_${item.id}.${item.targetFormat}`;
                
                const inputData = await window.ffmpegFetchFile(item.file);
                await ffmpeg.writeFile(inputName, inputData);

                let ffmpegArgs;
                if (item.targetFormat === 'gif') {
                    ffmpegArgs = [
                        '-i', inputName,
                        '-vf', 'fps=15,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
                        '-y', outputName
                    ];
                } else if (item.targetFormat === 'mp4') {
                    ffmpegArgs = ['-i', inputName, '-c:v', 'libx264', '-c:a', 'aac', '-y', outputName];
                } else {
                    ffmpegArgs = ['-i', inputName, '-y', outputName];
                }

                await ffmpeg.exec(ffmpegArgs);

                const data = await ffmpeg.readFile(outputName);
                const blob = new Blob([data], { type: `video/${item.targetFormat}` });
                item.resultUrl = URL.createObjectURL(blob);
                item.status = 'success';
                item.progress = 100;

                await ffmpeg.deleteFile(inputName);
                await ffmpeg.deleteFile(outputName);

            } catch (err) {
                console.error(err);
                item.status = 'error';
                item.error = err.message || 'Conversion failed';
            }
            
            completed++;
            updateGlobalProgress((completed / total) * 100);
            if (batchProgressBar) batchProgressBar.style.width = `${(completed / total) * 100}%`;
            renderQueue();
        }

        isProcessing = false;
        processingStatus.classList.add('hidden');
        document.getElementById('processing-details')?.classList.add('hidden');
        renderQueue();
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            filesQueue = filesQueue.filter(f => f.status !== 'success' && f.status !== 'error');
            if (filesQueue.length === 0) reset();
            else renderQueue();
        });
    }

    if (downloadAllBtn) {
        downloadAllBtn.addEventListener('click', async () => {
            convertBtn.click();
        });
    }

    function updateGlobalProgress(percent) {
        if (progressBar) progressBar.style.width = `${percent}%`;
    }

    function reset() {
        filesQueue.forEach(item => {
            if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
        });
        filesQueue = [];
        fileInput.value = '';
        dropZone.classList.remove('hidden');
        editorArea.classList.add('hidden');
        isProcessing = false;
        updateGlobalProgress(0);
        renderQueue();
    }

    resetBtn.addEventListener('click', reset);

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
});
