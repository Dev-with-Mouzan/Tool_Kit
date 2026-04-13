// FFmpeg libraries loaded via script tags in HTML to bypass CORS/Worker origin restrictions
const { FFmpeg } = window.FFmpegWASM || {};
const { toBlobURL, fetchFile } = window.FFmpegUtil || {};

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    // ... rest of the elements initialization
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
    
    let filesQueue = [];
    let isProcessing = false;
    let globalFormat = 'mp4';
    let ffmpeg = null;
    let ffmpegLoaded = false;

    // ... (logic from line 29 stays the same)
    // Format selection
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

    if (formatBtns.length > 0) formatBtns[0].click();

    // File handling
    dropZone.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') fileInput.click();
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
        if (fileInput.files.length) handleFiles(Array.from(fileInput.files));
        fileInput.value = '';
    });

    function handleFiles(files) {
        const videos = files.filter(file => file.type.startsWith('video/'));
        const validFiles = videos.filter(f => f.size <= 500 * 1024 * 1024);

        if (videos.length < files.length) alert('Some files were skipped. Only videos are supported.');
        if (validFiles.length < videos.length) alert('Some files exceed the 500MB limit and were skipped.');

        validFiles.forEach(file => {
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
            dropZone.classList.add('hidden');
            editorArea.classList.remove('hidden');
            renderQueue();
        }
    }

    function renderQueue() {
        if (!queueList) return;
        queueList.innerHTML = '';
        if (queueCount) queueCount.textContent = filesQueue.length;

        const stats = { ready: 0, success: 0, error: 0, processing: 0 };
        filesQueue.forEach(f => stats[f.status === 'processing' ? 'ready' : f.status]++);
        
        statPending.textContent = stats.ready;
        statSuccess.textContent = stats.success;
        statError.textContent = stats.error;

        const canDownload = stats.success > 0 && !isProcessing;
        const hasWork = stats.ready > 0 || stats.error > 0;

        if (canDownload && !hasWork) {
            convertBtn.disabled = false;
            convertBtn.classList.remove('from-primary', 'to-indigo-600');
            convertBtn.classList.add('bg-green-600');
            convertBtn.innerHTML = '<span class="material-symbols-outlined text-base">download</span>Download All (ZIP)';
            convertBtn.dataset.mode = 'download';
        } else {
            convertBtn.classList.remove('bg-green-600');
            convertBtn.classList.add('from-primary', 'to-indigo-600');
            convertBtn.innerHTML = '<span class="material-symbols-outlined text-base">rocket_launch</span>Process Batch';
            convertBtn.disabled = isProcessing || filesQueue.length === 0;
            convertBtn.dataset.mode = 'convert';
        }

        if (clearBtn) clearBtn.classList.toggle('hidden', (stats.success === 0 && stats.error === 0) || isProcessing);

        filesQueue.forEach(item => {
            const row = document.createElement('div');
            row.className = `p-4 sm:p-5 queue-item bg-white dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 border-l-4 ${
                item.status === 'success' ? 'border-green-500 bg-green-500/5' : 
                item.status === 'error' ? 'border-red-500 bg-red-500/5' : 
                item.status === 'processing' ? 'border-primary bg-primary/5' : 'border-transparent'
            }`;

            const statusLabel = item.status === 'ready' ? 'Ready' : 
                               item.status === 'processing' ? `Converting (${item.progress}%)` : 
                               item.status === 'success' ? 'Finished' : 'Failed';

            row.innerHTML = `
                <div class="flex-1 flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                        <span class="material-symbols-outlined text-xl sm:text-2xl">movie</span>
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                            <h5 class="text-xs font-black text-slate-900 dark:text-white truncate pr-2">${item.file.name}</h5>
                            <div class="shrink-0 text-[10px] font-black uppercase tracking-wider">
                                <span class="${item.status === 'success' ? 'text-green-500' : item.status === 'error' ? 'text-red-500' : 'text-slate-400'}">${statusLabel}</span>
                            </div>
                        </div>
                        <p class="text-[9px] text-slate-500 font-bold uppercase mt-1">
                            ${formatBytes(item.file.size)} &bull; ${item.targetFormat.toUpperCase()}
                        </p>
                        ${item.status === 'processing' ? `
                            <div class="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                                <div class="bg-primary h-full transition-all duration-300" style="width: ${item.progress}%"></div>
                            </div>
                        ` : ''}
                        ${item.error ? `<p class="text-[9px] text-red-500 mt-1 italic font-medium">${item.error}</p>` : ''}
                    </div>
                </div>
                <div class="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800/50 pt-3 sm:pt-0 sm:border-0 sm:shrink-0">
                    ${item.status === 'success' ? `
                        <button onclick="window.downloadItem('${item.id}')" class="flex-1 sm:flex-none h-9 px-4 sm:px-0 sm:w-9 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all gap-2">
                            <span class="material-symbols-outlined text-lg">download</span>
                            <span class="sm:hidden text-[10px] font-bold uppercase">Download</span>
                        </button>
                    ` : ''}
                    ${!isProcessing ? `
                        <button onclick="window.removeItem('${item.id}')" class="flex-1 sm:flex-none h-9 px-4 sm:px-0 sm:w-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 flex items-center justify-center transition-all gap-2">
                            <span class="material-symbols-outlined text-lg">close</span>
                            <span class="sm:hidden text-[10px] font-bold uppercase">Remove</span>
                        </button>
                    ` : ''}
                </div>
            `;
            queueList.appendChild(row);
        });
    }

    // FFmpeg Loading
    async function initFFmpeg() {
        if (ffmpegLoaded) return true;

        const progressStage = document.getElementById('progress-stage');
        if (progressStage) progressStage.textContent = 'Initializing engine...';

        try {
            // Check for SharedArrayBuffer support
            if (!window.SharedArrayBuffer) {
                console.warn('SharedArrayBuffer not available. FFmpeg will run in single-threaded mode (slower).');
            }

            // Local FFmpeg Library Paths
            const localBase = '../js/libs/ffmpeg';
            ffmpeg = new FFmpeg();
            
            ffmpeg.on('progress', ({ progress }) => {
                const currentFile = filesQueue.find(f => f.status === 'processing');
                if (currentFile) {
                    currentFile.progress = Math.round(progress * 100);
                    renderQueue();
                }
            });

            // Load local core and worker
            await ffmpeg.load({
                coreURL: await toBlobURL(`${localBase}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${localBase}/ffmpeg-core.wasm`, 'application/wasm'),
                workerURL: await toBlobURL(`${localBase}/worker.js`, 'text/javascript'),
            });

            ffmpegLoaded = true;
            return true;
        } catch (err) {
            console.error('FFmpeg Load Error:', err);
            let msg = err.message || 'Unknown error';
            if (msg.includes('SharedArrayBuffer')) {
                msg = 'SharedArrayBuffer not available. This tool requires cross-origin isolation or a modern browser with multithreading support.';
            }
            throw new Error(`Failed to load video engine: ${msg}`);
        }
    }

    convertBtn.addEventListener('click', async () => {
        if (convertBtn.dataset.mode === 'download') {
            downloadAll();
            return;
        }

        const pending = filesQueue.filter(f => f.status === 'ready' || f.status === 'error');
        if (pending.length === 0) return;

        try {
            await initFFmpeg();
        } catch (err) {
            alert(err.message);
            return;
        }

        isProcessing = true;
        processingStatus.classList.remove('hidden');
        renderQueue();

        let completed = 0;
        const startTime = Date.now();

        for (const item of pending) {
            item.status = 'processing';
            item.progress = 0;
            item.error = null;
            renderQueue();

            globalProgressText.textContent = `Processing video ${completed + 1} of ${pending.length}`;
            progressBar.style.width = `${(completed / pending.length) * 100}%`;

            try {
                const inputName = `input_${item.id}_${item.file.name}`;
                const outputName = `output_${item.id}.${item.targetFormat}`;

                await ffmpeg.writeFile(inputName, await fetchFile(item.file));

                let args = ['-i', inputName];
                if (item.targetFormat === 'gif') {
                    args.push('-vf', 'fps=10,scale=320:-1:flags=lanczos', '-y', outputName);
                } else if (item.targetFormat === 'mp4') {
                    args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-c:a', 'aac', '-y', outputName);
                } else {
                    args.push('-y', outputName);
                }

                await ffmpeg.exec(args);

                const data = await ffmpeg.readFile(outputName);
                item.resultUrl = URL.createObjectURL(new Blob([data.buffer], { type: `video/${item.targetFormat}` }));
                item.status = 'success';
                item.progress = 100;

                await ffmpeg.deleteFile(inputName);
                await ffmpeg.deleteFile(outputName);
            } catch (err) {
                console.error(err);
                item.status = 'error';
                item.error = 'Conversion failed';
            }

            completed++;
            renderQueue();
        }

        isProcessing = false;
        processingStatus.classList.add('hidden');
        progressBar.style.width = '100%';
        renderQueue();
    });

    // Globals for buttons
    window.removeItem = (id) => {
        const item = filesQueue.find(f => f.id === id);
        if (item && item.resultUrl) URL.revokeObjectURL(item.resultUrl);
        filesQueue = filesQueue.filter(f => f.id !== id);
        if (filesQueue.length === 0) reset();
        else renderQueue();
    };

    window.downloadItem = (id) => {
        const item = filesQueue.find(f => f.id === id);
        if (item && item.resultUrl) {
            const a = document.createElement('a');
            a.href = item.resultUrl;
            a.download = `converted_${item.file.name.split('.')[0]}.${item.targetFormat}`;
            a.click();
        }
    };

    async function downloadAll() {
        const successes = filesQueue.filter(f => f.status === 'success' && f.resultUrl);
        if (successes.length === 0) return;
        
        const activeText = convertBtn.innerHTML;
        convertBtn.disabled = true;
        convertBtn.innerHTML = 'Zipping...';

        try {
            await LazyLoader.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
            const zip = new JSZip();
            for (const item of successes) {
                const response = await fetch(item.resultUrl);
                const blob = await response.blob();
                zip.file(`converted_${item.id}.${item.targetFormat}`, blob);
            }
            const content = await zip.generateAsync({ type: 'blob' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(content);
            a.download = 'FileToolkitPro_Videos.zip';
            a.click();
        } catch (err) {
            alert('Failed to create ZIP');
        } finally {
            convertBtn.disabled = false;
            convertBtn.innerHTML = activeText;
        }
    }

    function reset() {
        filesQueue.forEach(item => { if (item.resultUrl) URL.revokeObjectURL(item.resultUrl); });
        filesQueue = [];
        fileInput.value = '';
        dropZone.classList.remove('hidden');
        editorArea.classList.add('hidden');
        isProcessing = false;
        renderQueue();
    }

    resetBtn.addEventListener('click', reset);
    if (clearBtn) clearBtn.addEventListener('click', () => {
        filesQueue = filesQueue.filter(f => f.status !== 'success' && f.status !== 'error');
        if (filesQueue.length === 0) reset();
        else renderQueue();
    });

    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024, dm = 1, sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
});
