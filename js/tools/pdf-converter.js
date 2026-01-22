// PDF ↔ Word Converter
// Supports bidirectional conversion between PDF and Word (DOCX)

let selectedFile = null;
let conversionMode = 'pdf-to-word'; // or 'word-to-pdf'
let resultBlob = null;

// Configure PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// DOM Elements
const fileInput = document.getElementById('file-input');
const fileName = document.getElementById('file-name');
const convertBtn = document.getElementById('convert-btn');
const progressSection = document.getElementById('progress-section');
const downloadSection = document.getElementById('download-section');
const statusMsg = document.getElementById('status-msg');
const progressBar = document.getElementById('progress-bar');
const btnPdfToWord = document.getElementById('btn-pdf-to-word');
const btnWordToPdf = document.getElementById('btn-word-to-pdf');

// File input handler
if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        selectedFile = file;
        fileName.textContent = file.name;
        convertBtn.disabled = false;

        // Reset download section
        downloadSection.classList.add('hidden');
        progressSection.classList.add('hidden');
    });
}

function selectConversion(mode) {
    conversionMode = mode;

    // Update button styles
    if (mode === 'pdf-to-word') {
        btnPdfToWord.className = 'flex-1 px-6 py-4 rounded-lg border-2 border-indigo-500 bg-indigo-500/20 text-white font-semibold transition-all';
        btnWordToPdf.className = 'flex-1 px-6 py-4 rounded-lg border-2 border-white/20 hover:border-indigo-500/50 text-white font-semibold transition-all';
        fileInput.accept = '.pdf';
        fileName.textContent = 'Click to select PDF file';
        convertBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-5 h-5 inline-block mr-2"></i> Convert to Word';
    } else {
        btnWordToPdf.className = 'flex-1 px-6 py-4 rounded-lg border-2 border-indigo-500 bg-indigo-500/20 text-white font-semibold transition-all';
        btnPdfToWord.className = 'flex-1 px-6 py-4 rounded-lg border-2 border-white/20 hover:border-indigo-500/50 text-white font-semibold transition-all';
        fileInput.accept = '.doc,.docx';
        fileName.textContent = 'Click to select Word file';
        convertBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-5 h-5 inline-block mr-2"></i> Convert to PDF';
    }

    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Reset file selection
    selectedFile = null;
    fileInput.value = '';
    convertBtn.disabled = true;
    downloadSection.classList.add('hidden');
    progressSection.classList.add('hidden');
}

async function convertDocument() {
    if (!selectedFile) return;

    // Reset UI
    progressSection.classList.remove('hidden');
    downloadSection.classList.add('hidden');
    progressBar.style.width = '0%';
    convertBtn.disabled = true;

    try {
        if (conversionMode === 'pdf-to-word') {
            await processPdfToWord();
        } else {
            await processWordToPdf();
        }

        progressBar.style.width = '100%';
        progressSection.classList.add('hidden');
        downloadSection.classList.remove('hidden');

    } catch (error) {
        console.error('Conversion error:', error);
        progressSection.classList.add('hidden');
        alert('Conversion failed: ' + error.message);
        convertBtn.disabled = false;
    }
}

// ==================== PDF TO WORD ====================

async function processPdfToWord() {
    statusMsg.textContent = 'Reading PDF...';
    progressBar.style.width = '20%';

    const arrayBuffer = await selectedFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    statusMsg.textContent = 'Extracting text...';
    progressBar.style.width = '40%';

    const paragraphs = [];
    const numPages = pdf.numPages;

    for (let i = 1; i <= numPages; i++) {
        statusMsg.textContent = `Processing page ${i}/${numPages}...`;
        progressBar.style.width = `${40 + (i / numPages) * 40}%`;

        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Add page heading
        paragraphs.push(
            new docx.Paragraph({
                text: `Page ${i}`,
                heading: docx.HeadingLevel.HEADING_2,
                spacing: {
                    before: 400,
                    after: 200,
                }
            })
        );

        const items = textContent.items;

        // Sort items: Top-to-bottom (Y desc), then Left-to-right (X asc)
        // We use a tolerance of 5 units to group items that are roughly on the same line
        items.sort((a, b) => {
            const yDiff = b.transform[5] - a.transform[5];
            if (Math.abs(yDiff) > 5) return yDiff;
            return a.transform[4] - b.transform[4];
        });

        let currentY = -Infinity;
        let currentLineParts = [];

        items.forEach((item) => {
            // Initialize currentY on first item
            if (currentY === -Infinity) currentY = item.transform[5];

            // Check if we moved to a new line (significant Y change)
            if (Math.abs(currentY - item.transform[5]) > 5) {
                // Flush current line
                if (currentLineParts.length > 0) {
                    paragraphs.push(
                        new docx.Paragraph({
                            text: currentLineParts.join(' ').trim(),
                            spacing: { after: 0 } // Minimal spacing for natural flow
                        })
                    );
                }
                // Start new line
                currentLineParts = [];
                currentY = item.transform[5];
            }

            // Add text segment to current line
            if (item.str.trim()) {
                currentLineParts.push(item.str);
            }
        });

        // Flush the very last line of the page
        if (currentLineParts.length > 0) {
            paragraphs.push(
                new docx.Paragraph({
                    text: currentLineParts.join(' ').trim(),
                    spacing: { after: 0 }
                })
            );
        }
    }

    statusMsg.textContent = 'Creating Word document...';
    progressBar.style.width = '90%';

    const doc = new docx.Document({
        sections: [{
            properties: {},
            children: paragraphs,
        }],
    });

    resultBlob = await docx.Packer.toBlob(doc);
}

// ==================== WORD TO PDF ====================

async function processWordToPdf() {
    statusMsg.textContent = 'Reading Word document...';
    progressBar.style.width = '30%';

    const arrayBuffer = await selectedFile.arrayBuffer();

    statusMsg.textContent = 'Extracting content...';
    progressBar.style.width = '50%';

    const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });

    statusMsg.textContent = 'Creating PDF...';
    progressBar.style.width = '70%';

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Extract plain text from HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = result.value;
    const text = tempDiv.textContent || tempDiv.innerText || '';

    // Split text into lines that fit the page
    const lines = doc.splitTextToSize(text, 180);

    let y = 20;
    const lineHeight = 7;
    const pageHeight = 280;

    lines.forEach(line => {
        if (y > pageHeight) {
            doc.addPage();
            y = 20;
        }
        doc.text(line, 15, y);
        y += lineHeight;
    });

    progressBar.style.width = '95%';
    resultBlob = doc.output('blob');
}

// ==================== DOWNLOAD ====================

function downloadResult() {
    if (!resultBlob) return;

    const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
    const extension = conversionMode === 'pdf-to-word' ? 'docx' : 'pdf';
    const filename = `${baseName}_converted.${extension}`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(resultBlob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

// Legacy function names for backward compatibility
function convertPdfToWord() {
    return convertDocument();
}

function convertWordToPdf() {
    return convertDocument();
}
