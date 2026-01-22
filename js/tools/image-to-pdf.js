const { jsPDF } = window.jspdf;
const imageInput = document.getElementById('image-input');
const docTitle = document.getElementById('doc-title');
const previewContainer = document.getElementById('preview-container');
const downloadBtn = document.getElementById('download-btn');
let images = [];

imageInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const imgData = event.target.result;
            images.push({
                data: imgData,
                width: 0,
                height: 0,
                ratio: 0
            });
            renderPreview(imgData, images.length - 1);
        };
        reader.readAsDataURL(file);
    });
});

function renderPreview(src, index) {
    const div = document.createElement('div');
    div.className = 'relative group';
    div.innerHTML = `
        <img src="${src}" class="w-full h-32 object-cover rounded-lg border border-white/20">
        <button onclick="removeImage(${index})" class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <i data-lucide="x" class="w-4 h-4"></i>
        </button>
    `;
    previewContainer.appendChild(div);
    lucide.createIcons();
    updateDownloadBtn();
}

function removeImage(index) {
    images.splice(index, 1);
    // Re-render all (inefficient but safe for simple lists)
    previewContainer.innerHTML = '';
    images.forEach((img, i) => renderPreview(img.data, i));
    updateDownloadBtn();
}

function updateDownloadBtn() {
    if (images.length > 0) {
        downloadBtn.classList.remove('hidden');
    } else {
        downloadBtn.classList.add('hidden');
    }
}

async function generatePDF() {
    if (images.length === 0) return;

    const doc = new jsPDF();
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    for (let i = 0; i < images.length; i++) {
        const img = images[i];

        // Load image to get dimensions
        const tempImg = new Image();
        tempImg.src = img.data;
        await new Promise(r => tempImg.onload = r);

        // Simple fitting: Fit width, adjust height. If height > page, scale down.
        let imgWidth = width - 20; // 10px margin
        let imgHeight = (tempImg.height * imgWidth) / tempImg.width;

        if (imgHeight > height - 20) {
            imgHeight = height - 20;
            imgWidth = (tempImg.width * imgHeight) / tempImg.height;
        }

        const x = (width - imgWidth) / 2;
        const y = (height - imgHeight) / 2;

        if (i > 0) doc.addPage();
        doc.addImage(img.data, 'JPEG', x, y, imgWidth, imgHeight);

        // Optional text
        // doc.text(10, 10, `Page ${i+1}`);
    }

    const title = docTitle.value.trim() || 'converted-images';
    doc.save(`${title}.pdf`);
}
