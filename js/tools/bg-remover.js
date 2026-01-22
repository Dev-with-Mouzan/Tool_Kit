


const imageInput = document.getElementById('image-input');
const originalPreview = document.getElementById('preview-original');
const resultPreview = document.getElementById('preview-result');
const downloadBtn = document.getElementById('download-btn');
const processBtn = document.getElementById('process-btn');
const loading = document.getElementById('loading');
const placeholderOrig = document.getElementById('placeholder-orig');
const placeholderRes = document.getElementById('placeholder-res');
const statusMsg = document.getElementById('status-msg');
const downloadSection = document.getElementById('download-section');

let selectedFile = null;
let resultBlob = null;

if (imageInput) {
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        selectedFile = file;
        originalPreview.src = URL.createObjectURL(file);
        originalPreview.classList.remove('hidden');
        if (placeholderOrig) placeholderOrig.style.display = 'none';

        // Reset Result
        resultPreview.src = '';
        resultPreview.classList.add('hidden');
        if (placeholderRes) placeholderRes.style.display = 'block';
        downloadSection.classList.add('hidden');
        statusMsg.classList.add('hidden');

        // Auto-process immediately
        processImage();
    });
}

async function processImage() {
    if (!selectedFile) return;

    loading.classList.remove('hidden');
    if (processBtn) processBtn.classList.add('hidden');
    statusMsg.classList.remove('hidden');
    statusMsg.textContent = "Processing image... Please wait.";
    statusMsg.className = "text-sm text-indigo-400 animate-pulse block mt-2";

    try {
        const formData = new FormData();
        formData.append('image', selectedFile);

        const response = await apiCall('/remove-bg', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        resultBlob = blob;

        resultPreview.src = URL.createObjectURL(blob);
        resultPreview.classList.remove('hidden');
        if (placeholderRes) placeholderRes.style.display = 'none';

        loading.classList.add('hidden');
        statusMsg.textContent = "✓ Background removed successfully!";
        statusMsg.className = "text-sm text-green-400 block mt-2 font-semibold";
        downloadSection.classList.remove('hidden');

    } catch (err) {
        console.error("BG Removal Error:", err);
        console.error("API Base URL:", API_BASE_URL);
        loading.classList.add('hidden');
        if (processBtn) processBtn.classList.remove('hidden');

        let errorMessage = err.message || "Failed to process image.";
        if (err.message.includes("Failed to fetch")) {
            errorMessage = "Backend connection failed. Make sure Railway backend is running.";
        }
        statusMsg.textContent = "Error: " + errorMessage;
        statusMsg.className = "text-sm text-red-400 block mt-2 font-bold";
    }
}

window.downloadResult = function () {
    if (!resultBlob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(resultBlob);
    link.download = 'removed-bg-result.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
