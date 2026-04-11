document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const editorArea = document.getElementById('editor-area');
    const resultArea = document.getElementById('result-area');
    const cropCanvas = document.getElementById('crop-canvas');
    const countrySelect = document.getElementById('country-select');
    const generateBtn = document.getElementById('generate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const printCanvas = document.getElementById('print-canvas');
    const downloadBtn = document.getElementById('download-btn');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const reqSize = document.getElementById('req-size');
    const reqBg = document.getElementById('req-bg');
    const reqFace = document.getElementById('req-face');

    if (!dropZone || !fileInput) {
        console.error('Critical UI elements missing for passport-photo-maker');
        return;
    }

    let currentFile = null;
    let previewUrl = null;

    const presets = {
        us: { 
            widthMm: 51, heightMm: 51, 
            widthPx: 600, heightPx: 600, 
            label: 'USA Passport',
            sheetCols: 2, sheetRows: 2,
            sizeText: 'Size: 2x2 inches (51x51mm)',
            bgText: 'Background: Plain white',
            faceText: 'Face: 70–80% of frame'
        },
        uk: { 
            widthMm: 35, heightMm: 45, 
            widthPx: 413, heightPx: 531, 
            label: 'UK Passport',
            sheetCols: 4, sheetRows: 2,
            sizeText: 'Size: 35x45mm',
            bgText: 'Background: Plain white or light grey',
            faceText: 'Face: 29–34mm from chin to crown'
        },
        in: { 
            widthMm: 35, heightMm: 45, 
            widthPx: 413, heightPx: 531, 
            label: 'India Passport',
            sheetCols: 4, sheetRows: 2,
            sizeText: 'Size: 35x45mm',
            bgText: 'Background: Plain white',
            faceText: 'Face: 80% coverage'
        },
        eu: { 
            widthMm: 35, heightMm: 45, 
            widthPx: 413, heightPx: 531, 
            label: 'EU Passport',
            sheetCols: 4, sheetRows: 2,
            sizeText: 'Size: 35x45mm',
            bgText: 'Background: Light grey or white',
            faceText: 'Face: 32–36mm from chin to crown'
        },
        pk: { 
            widthMm: 35, heightMm: 45, 
            widthPx: 413, heightPx: 531, 
            label: 'Pakistan Passport',
            sheetCols: 4, sheetRows: 2,
            sizeText: 'Size: 35x45mm',
            bgText: 'Background: Light blue or white',
            faceText: 'Face: 70–80% coverage'
        },
        ca: { 
            widthMm: 50, heightMm: 70, 
            widthPx: 590, heightPx: 826, 
            label: 'Canada Passport',
            sheetCols: 2, sheetRows: 1,
            sizeText: 'Size: 50x70mm',
            bgText: 'Background: Plain white or light coloured',
            faceText: 'Face: 31-36mm from chin to crown'
        },
        au: { 
            widthMm: 35, heightMm: 45, 
            widthPx: 413, heightPx: 531, 
            label: 'Australia Passport',
            sheetCols: 4, sheetRows: 2,
            sizeText: 'Size: 35x45mm',
            bgText: 'Background: Plain white or light grey',
            faceText: 'Face: 32–36mm from chin to crown'
        }
    };

    // Update requirements display when country changes
    if (countrySelect) {
        countrySelect.addEventListener('change', () => {
            const preset = presets[countrySelect.value];
            if (reqSize) reqSize.textContent = preset.sizeText;
            if (reqBg) reqBg.textContent = preset.bgText;
            if (reqFace) reqFace.textContent = preset.faceText;
            // If we have an image loaded, update the crop preview
            if (previewUrl && cropCanvas) drawCropPreview();
        });
    }

    // --- Interaction ---
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(name => {
        dropZone.addEventListener(name, e => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    dropZone.addEventListener('dragover', () => dropZone.classList.add('bg-primary/5', 'border-primary'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('bg-primary/5', 'border-primary'));

    dropZone.addEventListener('drop', e => {
        dropZone.classList.remove('bg-primary/5', 'border-primary');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

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

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) handleFile(fileInput.files[0]);
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) return;
        currentFile = file;

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = URL.createObjectURL(file);

        dropZone.classList.add('hidden');
        if (editorArea) editorArea.classList.remove('hidden');
        if (resultArea) resultArea.classList.add('hidden');

        drawCropPreview();
    }

    function drawCropPreview() {
        if (!cropCanvas || !previewUrl) return;

        const img = new Image();
        img.onload = () => {
            const preset = presets[countrySelect ? countrySelect.value : 'usa'];
            const ctx = cropCanvas.getContext('2d');

            cropCanvas.width = preset.widthPx;
            cropCanvas.height = preset.heightPx;

            // Center crop (top-weighted for face)
            const aspect = preset.widthPx / preset.heightPx;
            let srcW, srcH, srcX, srcY;
            if (img.width / img.height > aspect) {
                srcH = img.height;
                srcW = img.height * aspect;
                srcX = (img.width - srcW) / 2;
                srcY = 0;
            } else {
                srcW = img.width;
                srcH = img.width / aspect;
                srcX = 0;
                srcY = (img.height - srcH) * 0.2;
            }

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
            ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, cropCanvas.width, cropCanvas.height);
        };
        img.src = previewUrl;
    }

    // Generate
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            if (!currentFile) return;

            generateBtn.disabled = true;
            const originalText = generateBtn.innerHTML;
            generateBtn.innerHTML = '<span class="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full inline-block"></span>Generating...';

            try {
                await createPassportSheet();
                if (resultArea) {
                    resultArea.classList.remove('hidden');
                    resultArea.scrollIntoView({ behavior: 'smooth' });
                }
            } catch (err) {
                console.error(err);
                alert('Failed to generate photo: ' + err.message);
            } finally {
                generateBtn.disabled = false;
                generateBtn.innerHTML = originalText;
            }
        });
    }

    async function createPassportSheet() {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const preset = presets[countrySelect ? countrySelect.value : 'usa'];

                // 1. Create Individual Cropped Photo
                const photoCanvas = document.createElement('canvas');
                const pCtx = photoCanvas.getContext('2d');
                photoCanvas.width = preset.widthPx;
                photoCanvas.height = preset.heightPx;

                const aspect = preset.widthPx / preset.heightPx;
                let srcW, srcH, srcX, srcY;
                if (img.width / img.height > aspect) {
                    srcH = img.height;
                    srcW = img.height * aspect;
                    srcX = (img.width - srcW) / 2;
                    srcY = 0;
                } else {
                    srcW = img.width;
                    srcH = img.width / aspect;
                    srcX = 0;
                    srcY = (img.height - srcH) * 0.2;
                }
                pCtx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, photoCanvas.width, photoCanvas.height);

                // 2. Create Print Sheet (4x6 inch @ 300 DPI = 1200x1800 px)
                const sheetW = 1800;
                const sheetH = 1200;
                if (!printCanvas) { reject(new Error('Print canvas not found')); return; }
                printCanvas.width = sheetW;
                printCanvas.height = sheetH;
                const ctx = printCanvas.getContext('2d');

                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, sheetW, sheetH);

                const gutter = 40;
                const totalW = (preset.widthPx * preset.sheetCols) + (gutter * (preset.sheetCols - 1));
                const totalH = (preset.heightPx * preset.sheetRows) + (gutter * (preset.sheetRows - 1));
                const startX = (sheetW - totalW) / 2;
                const startY = (sheetH - totalH) / 2;

                for (let r = 0; r < preset.sheetRows; r++) {
                    for (let c = 0; c < preset.sheetCols; c++) {
                        const x = startX + c * (preset.widthPx + gutter);
                        const y = startY + r * (preset.heightPx + gutter);
                        ctx.drawImage(photoCanvas, x, y);
                        ctx.strokeStyle = '#EEEEEE';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x, y, preset.widthPx, preset.heightPx);
                    }
                }

                photoCanvas.width = 1;
                photoCanvas.height = 1;
                resolve();
            };
            img.onerror = reject;
            img.src = previewUrl;
        });
    }

    // Download PNG sheet
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (!printCanvas) return;
            const link = document.createElement('a');
            link.download = `passport_sheet_${countrySelect ? countrySelect.value : 'custom'}.jpg`;
            link.href = printCanvas.toDataURL('image/jpeg', 0.95);
            link.click();
        });
    }

    // Download as PDF
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', async () => {
            if (!printCanvas) return;
            downloadPdfBtn.disabled = true;
            const originalText = downloadPdfBtn.innerHTML;
            downloadPdfBtn.innerHTML = '<span class="animate-spin w-4 h-4 mr-2 border-2 border-primary border-t-transparent rounded-full inline-block"></span>Creating PDF...';

            try {
                // Load pdf-lib dynamically
                if (typeof PDFLib === 'undefined') {
                    await new Promise((resolve, reject) => {
                        const s = document.createElement('script');
                        s.src = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
                        s.onload = resolve;
                        s.onerror = reject;
                        document.head.appendChild(s);
                    });
                }

                const { PDFDocument } = PDFLib;
                const pdfDoc = await PDFDocument.create();
                // 4x6 inch page in landscape = 432 x 288 points
                const page = pdfDoc.addPage([432, 288]);

                const imageData = printCanvas.toDataURL('image/jpeg', 0.95);
                const jpgImage = await pdfDoc.embedJpg(await fetch(imageData).then(r => r.arrayBuffer()));
                page.drawImage(jpgImage, { x: 0, y: 0, width: 432, height: 288 });

                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `passport_photos_${countrySelect ? countrySelect.value : 'custom'}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error(err);
                alert('Failed to create PDF: ' + err.message);
            } finally {
                downloadPdfBtn.disabled = false;
                downloadPdfBtn.innerHTML = originalText;
            }
        });
    }

    // Reset
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            currentFile = null;
            if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
            if (editorArea) editorArea.classList.add('hidden');
            if (resultArea) resultArea.classList.add('hidden');
            dropZone.classList.remove('hidden');
            fileInput.value = '';
        });
    }
});
