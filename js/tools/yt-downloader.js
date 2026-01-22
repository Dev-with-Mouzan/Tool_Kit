
// function processYouTube() {
//     const urlInput = document.getElementById('yt-url');
//     const resultContainer = document.getElementById('result-container');
//     const errorMsg = document.getElementById('error-msg');
//     const titleEl = document.getElementById('video-title');
//     const thumbEl = document.getElementById('video-thumb');
//     const durationEl = document.getElementById('video-duration');
//     const downloadSection = document.getElementById('download-options');

//     const url = urlInput.value.trim();

//     // Basic validation
//     if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
//         errorMsg.classList.remove('hidden');
//         errorMsg.textContent = "Please enter a valid YouTube URL.";
//         resultContainer.classList.add('hidden');
//         return;
//     }

//     errorMsg.classList.add('hidden');
//     resultContainer.classList.add('hidden');

//     // UI Loading State
//     titleEl.textContent = "Fetching video info...";
//     durationEl.textContent = "";
//     thumbEl.src = "https://placehold.co/640x360?text=Loading";
//     resultContainer.classList.remove('hidden');

//     // 1. Fetch Metadata from our local backend
//     fetch(`http://localhost:5000/yt-info?url=${encodeURIComponent(url)}`)
//         .then(res => {
//             if (!res.ok) throw new Error("Failed to fetch info");
//             return res.json();
//         })
//         .then(data => {
//             titleEl.textContent = data.title;
//             thumbEl.src = data.thumbnail_url;
//             durationEl.textContent = `Duration: ${data.duration_string || 'N/A'}`;

//             // 2. Render Download Buttons from backend data
//             renderDownloadButtons(data.formats, data.title);
//         })
//         .catch(err => {
//             console.error("Metadata fetch failed", err);
//             titleEl.textContent = "Error fetching video";
//             errorMsg.textContent = "Failed to retrieve video info. Please try again.";
//             errorMsg.classList.remove('hidden');
//         });
// }

// function renderDownloadButtons(formats, videoTitle) {
//     const container = document.querySelector('.space-y-3'); // Target the list container
//     container.innerHTML = ''; // Clear existing

//     // Simple sanitize for filename
//     const safeTitle = (videoTitle || 'video').replace(/[^a-z0-9]/gi, '_').substring(0, 50);

//     formats.forEach(opt => {
//         // Determine extension from label or sub
//         let ext = 'mp4';
//         if (opt.label.toLowerCase().includes('audio') || opt.label.toLowerCase().includes('mp3')) {
//             ext = 'mp3';
//         }

//         const proxyUrl = `http://localhost:5000/download?url=${encodeURIComponent(opt.url)}&format_id=${encodeURIComponent(opt.format_id || 'best')}`;

//         const div = document.createElement('div');
//         div.className = 'flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 hover:bg-white/10 transition-colors';
//         div.innerHTML = `
//             <div class="flex items-center gap-3">
//                 <span class="bg-${opt.color}-500/20 text-${opt.color}-300 text-xs px-2 py-1 rounded">${opt.label.split(' ')[2]?.replace(/[()]/g, '') || 'FILE'}</span>
//                 <div class="overflow-hidden">
//                      <span class="text-white text-sm block truncate max-w-[200px]">${opt.label}</span>
//                      <span class="text-gray-400 text-xs">${opt.sub}</span>
//                 </div>
//             </div>
//             <a href="${proxyUrl}" target="_blank"
//                class="px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-1 whitespace-nowrap">
//                Download <i data-lucide="download" class="w-3 h-3 ml-1"></i>
//             </a>
//         `;
//         container.appendChild(div);
//     });

//     // Re-init icons for new elements
//     if (window.lucide) lucide.createIcons();
// }

// // Expose to window for onclick
// window.fetchVideoInfo = processYouTube;

function processYouTube() {
    const urlInput = document.getElementById('yt-url');
    const resultContainer = document.getElementById('result-container');
    const errorMsg = document.getElementById('error-msg');
    const titleEl = document.getElementById('video-title');
    const thumbEl = document.getElementById('video-thumb');
    const durationEl = document.getElementById('video-duration');

    const url = urlInput.value.trim();

    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        errorMsg.textContent = "Invalid YouTube URL";
        errorMsg.classList.remove('hidden');
        return;
    }

    errorMsg.classList.add('hidden');
    resultContainer.classList.remove('hidden');

    titleEl.textContent = "Fetching info...";
    thumbEl.src = "https://placehold.co/640x360?text=Loading";

    fetch(`http://localhost:5000/yt-info?url=${encodeURIComponent(url)}`)
        .then(res => res.json())
        .then(data => {
            titleEl.textContent = data.title;
            thumbEl.src = data.thumbnail_url;
            durationEl.textContent = `Duration: ${data.duration_string}`;

            renderDownloadButtons(data.formats);
        })
        .catch(() => {
            errorMsg.textContent = "Failed to fetch video info";
            errorMsg.classList.remove('hidden');
        });
}

function renderDownloadButtons(formats) {
    const container = document.getElementById('download-options');
    container.innerHTML = "";

    formats.forEach(f => {
        // Determine format type and color
        const isAudio = f.label.toLowerCase().includes('audio') || f.label.toLowerCase().includes('mp3');
        const formatBadge = isAudio ? 'MP3' : 'MP4';
        const badgeColor = isAudio ? 'purple' : 'indigo';

        // Create the download option div
        const optionDiv = document.createElement('div');
        optionDiv.className = 'flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 hover:bg-white/10 transition-colors';

        optionDiv.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="bg-${badgeColor}-500/20 text-${badgeColor}-300 text-xs px-2 py-1 rounded">${formatBadge}</span>
                <span class="text-white text-sm">${f.label}</span>
            </div>
            <button class="download-btn px-4 py-1.5 rounded-full bg-white/10 hover:bg-indigo-600 hover:text-white text-gray-300 text-xs font-medium transition-all">
                Download
            </button>
        `;

        // Add click handler to the download button
        const downloadBtn = optionDiv.querySelector('.download-btn');
        downloadBtn.onclick = () => downloadVideo(f.format_id);

        container.appendChild(optionDiv);
    });
}

function downloadVideo(formatId) {
    const url = document.getElementById('yt-url').value.trim();

    // Create download URL with query parameters (backend uses GET)
    const downloadUrl = `http://localhost:5000/download?url=${encodeURIComponent(url)}&format_id=${encodeURIComponent(formatId)}`;

    // Trigger download by creating a temporary link
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = ''; // Let the server determine the filename
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
}

window.fetchVideoInfo = processYouTube;
