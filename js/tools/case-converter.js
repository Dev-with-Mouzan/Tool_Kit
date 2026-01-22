const inputText = document.getElementById('input-text');
const outputText = document.getElementById('output-text');
const wordCount = document.getElementById('word-count');
const charCount = document.getElementById('char-count');

function updateStats() {
    const text = inputText.value;
    charCount.textContent = text.length;
    wordCount.textContent = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

if (inputText) {
    inputText.addEventListener('input', updateStats);
}

function toUpperCase() {
    outputText.value = inputText.value.toUpperCase();
}

function toLowerCase() {
    outputText.value = inputText.value.toLowerCase();
}

function toTitleCase() {
    outputText.value = inputText.value.toLowerCase().split(' ').map(function (word) {
        return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
}

function toSentenceCase() {
    outputText.value = inputText.value.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, function (c) {
        return c.toUpperCase();
    });
}

function toAlternatingCase() {
    let result = '';
    for (let i = 0; i < inputText.value.length; i++) {
        if (i % 2 === 0) {
            result += inputText.value.charAt(i).toLowerCase();
        } else {
            result += inputText.value.charAt(i).toUpperCase();
        }
    }
    outputText.value = result;
}

function copyToClipboard() {
    outputText.select();
    document.execCommand('copy');
    const btn = document.getElementById('copy-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="check" class="w-4 h-4 mr-2"></i> Copied!';
    lucide.createIcons();
    setTimeout(() => {
        btn.innerHTML = originalText;
        lucide.createIcons();
    }, 2000);
}

function clearText() {
    inputText.value = '';
    outputText.value = '';
    updateStats();
}

function downloadText() {
    const element = document.createElement('a');
    const file = new Blob([outputText.value], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "converted-text.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
