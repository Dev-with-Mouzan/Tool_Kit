const qrText = document.getElementById('qr-text');
const qrContainer = document.getElementById('qr-code');
const qrColor = document.getElementById('qr-color');
const qrBgColor = document.getElementById('qr-bg-color');
const downloadBtn = document.getElementById('download-btn');

let qrcode = null;

function generateQR() {
    // Clear previous
    qrContainer.innerHTML = '';
    downloadBtn.classList.add('hidden');

    if (!qrText.value.trim()) return;

    try {
        qrcode = new QRCode(qrContainer, {
            text: qrText.value,
            width: 256,
            height: 256,
            colorDark: qrColor.value,
            colorLight: qrBgColor.value,
            correctLevel: QRCode.CorrectLevel.H
        });

        // Wait for generation
        setTimeout(() => {
            downloadBtn.classList.remove('hidden');
        }, 100);
    } catch (e) {
        console.error("QR Gen Error", e);
    }
}

qrText.addEventListener('input', () => {
    // Debounce
    clearTimeout(this.debounce);
    this.debounce = setTimeout(generateQR, 500);
});

qrColor.addEventListener('input', generateQR);
qrBgColor.addEventListener('input', generateQR);

function downloadQR() {
    const img = qrContainer.querySelector('img');
    if (img && img.src) {
        const link = document.createElement('a');
        link.href = img.src;
        link.download = 'qrcode.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initial
generateQR();
