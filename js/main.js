// Shared JavaScript for all pages

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');

    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Mobile Menu Toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('hidden');
        });
    }

    if (closeMenuBtn && mobileMenu) {
        closeMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
        });
    }

    // Close menu when clicking a link
    const mobileLinks = mobileMenu?.querySelectorAll('a');
    mobileLinks?.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
        });
    });

    // Add active class to current nav link
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('nav a');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath || (currentPath.includes('tools') && link.getAttribute('href').includes('tools'))) {
            // link.classList.add('text-white', 'bg-white/10');
            // Logic to highlight current page if needed
        }
    });

    // Initialize Typewriter Effect
    initTypewriter();

    // Initialize Sidebar Search
    initSidebarSearch();

    // Initialize Home Page Search (if elements exist)
    initSearch();
});

/**
 * Search functionality for the tools sidebar
 */
function initSidebarSearch() {
    const sidebarSearchInput = document.getElementById('sidebar-search');
    const sidebarNav = document.querySelector('aside nav');
    if (!sidebarSearchInput || !sidebarNav) return;

    const navLinks = sidebarNav.querySelectorAll('a:not(.category-header)');
    const categoryHeaders = sidebarNav.querySelectorAll('.category-header');

    sidebarSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        categoryHeaders.forEach(header => {
            const categoryId = header.getAttribute('data-category');
            const categoryLinks = sidebarNav.querySelectorAll(`a[data-category="${categoryId}"]`);
            let visibleInCategory = 0;

            categoryLinks.forEach(link => {
                const text = link.querySelector('span:last-child').textContent.toLowerCase();
                if (text.includes(query)) {
                    link.classList.remove('hidden');
                    visibleInCategory++;
                } else {
                    link.classList.add('hidden');
                }
            });

            if (visibleInCategory === 0) {
                header.classList.add('hidden');
            } else {
                header.classList.remove('hidden');
            }
        });
    });
}

/**
 * Search functionality for the tools grid
 */
function initSearch() {
    const searchInput = document.getElementById('search-input');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    const toolsGrid = document.getElementById('tools-grid');
    const toolCards = document.querySelectorAll('.tool-card');
    
    console.log('initSearch called', { searchInput, mobileSearchInput, toolsGrid, toolCards: toolCards.length });
    
    if (!toolsGrid || toolCards.length === 0) {
        console.log('Search not initialized: toolsGrid or toolCards not found');
        return;
    }

    const noResults = document.createElement('div');
    noResults.id = 'no-results';
    noResults.className = 'hidden col-span-full py-20 text-center flex flex-col items-center gap-4 animate-in fade-in duration-500';
    noResults.innerHTML = `
        <div class="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <span class="material-symbols-outlined text-4xl">search_off</span>
        </div>
        <div class="space-y-1">
            <h3 class="text-xl font-bold text-slate-900 dark:text-white">No tools found</h3>
            <p class="text-slate-500 dark:text-slate-400">Try searching with a different keyword. Or check back later!</p>
        </div>
        <button id="clear-search-btn" class="mt-4 text-primary font-bold hover:underline">Clear search</button>
    `;
    toolsGrid.appendChild(noResults);

    document.getElementById('clear-search-btn')?.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (mobileSearchInput) mobileSearchInput.value = '';
        performSearch('');
        searchInput?.focus();
    });

    const performSearch = (query) => {
        query = query.toLowerCase().trim();
        console.log('performSearch called with:', query);
        let globalVisibleCount = 0;

        const sections = document.querySelectorAll('.tool-category-section');
        console.log('Found sections:', sections.length);
        
        if (query === '') {
            // Show all cards and sections
            document.querySelectorAll('.tool-card').forEach(card => {
                card.classList.remove('hidden');
            });
            document.querySelectorAll('.tool-category-section').forEach(section => {
                section.classList.remove('hidden');
            });
            noResults.classList.add('hidden');
            return;
        }
        
        sections.forEach(section => {
            const cards = section.querySelectorAll('.tool-card');
            let sectionVisibleCount = 0;

            cards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const description = card.querySelector('p').textContent.toLowerCase();
                
                if (title.includes(query) || description.includes(query)) {
                    card.classList.remove('hidden');
                    card.classList.add('animate-in', 'fade-in', 'zoom-in-95', 'duration-300');
                    sectionVisibleCount++;
                    globalVisibleCount++;
                } else {
                    card.classList.add('hidden');
                    card.classList.remove('animate-in', 'fade-in', 'zoom-in-95');
                }
            });

            // Hide/Show entire section based on card visibility
            if (sectionVisibleCount === 0) {
                section.classList.add('hidden');
            } else {
                section.classList.remove('hidden');
            }
        });

        if (globalVisibleCount === 0) {
            noResults.classList.remove('hidden');
        } else {
            noResults.classList.add('hidden');
        }

        // Auto-scroll to results if search is active and results are below fold
        const firstVisibleSection = document.querySelector('.tool-category-section:not(.hidden)');
        if (query.length > 0 && firstVisibleSection && firstVisibleSection.getBoundingClientRect().top > window.innerHeight) {
            firstVisibleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    [searchInput, mobileSearchInput].forEach(input => {
        if (!input) return;

        input.addEventListener('input', (e) => {
            const query = e.target.value;
            // Sync both inputs
            if (input === searchInput && mobileSearchInput) mobileSearchInput.value = query;
            if (input === mobileSearchInput && searchInput) searchInput.value = query;
            
            performSearch(query);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const firstVisible = Array.from(toolCards).find(card => !card.classList.contains('hidden'));
                if (firstVisible) {
                    firstVisible.click();
                }
            }
            if (e.key === 'Escape') {
                input.value = '';
                if (input === searchInput && mobileSearchInput) mobileSearchInput.value = '';
                if (input === mobileSearchInput && searchInput) searchInput.value = '';
                performSearch('');
                input.blur();
            }
        });
    });

    // Global keyboard shortcut ('/') to focus search
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            searchInput?.focus();
            // Scroll to top to see result feedback if necessary
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
    // Direct test - add input listener
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            console.log('Direct search input listener:', e.target.value);
            performSearch(e.target.value);
        });
    }
}

/**
 * Typewriter effect for the hero section
 */
function initTypewriter() {
    const textElement = document.getElementById('typewriter-text');
    if (!textElement) return;

    const phrases = ["No Upload Tools.", "Privacy First.", "Free File Tools.", "Local Processing."];
    let phraseIndex = 0;
    let charIndex = phrases[0].length;
    let isDeleting = true;
    let typingSpeed = 100;

    function type() {
        const currentPhrase = phrases[phraseIndex];

        if (isDeleting) {
            textElement.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50;
        } else {
            textElement.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100;
        }

        if (!isDeleting && charIndex === currentPhrase.length) {
            isDeleting = true;
            typingSpeed = 3000;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typingSpeed = 500;
        }

        setTimeout(type, typingSpeed);
    }

    // Initial delay before starting the loop
    setTimeout(type, 2000);
}

/**
 * Copy text to clipboard and show feedback
 */
function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const span = btn.querySelector('span:last-child');
        const originalText = span.innerText;
        span.innerText = 'Copied!';
        btn.classList.add('text-green-500');
        
        setTimeout(() => {
            span.innerText = originalText;
            btn.classList.remove('text-green-500');
        }, 2000);
    });
}

/**
 * Global utility to download multiple files as a single ZIP
 * @param {Array} files - Array of { name: string, blob: Blob|string }
 * @param {string} zipName - Name of the output zip file
 */
async function downloadAsZip(files, zipName = 'filetoolkit_batch.zip') {
    if (typeof JSZip === 'undefined') {
        console.error('JSZip not loaded');
        alert('ZIP library is still loading. Please try again in a moment.');
        return;
    }

    const zip = new JSZip();
    
    for (const file of files) {
        if (typeof file.blob === 'string') {
            // It's a URL or Blob URL, fetch it
            try {
                const response = await fetch(file.blob);
                const blob = await response.blob();
                zip.file(file.name, blob);
            } catch (e) {
                console.error(`Failed to fetch ${file.name}:`, e);
            }
        } else {
            // It's already a Blob
            zip.file(file.name, file.blob);
        }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = zipName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

/**
 * Contact Form Handler
 */
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const formStatus = document.getElementById('form-status');

    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());

        console.log('Submitting contact form:', data);

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span><span>Preparing...</span>';

        const name = data.name || 'Anonymous';
        const subject = encodeURIComponent(data.subject || 'Contact from FileToolkitPro');
        const body = encodeURIComponent(`Name: ${name}\nEmail: ${data.email || 'Not provided'}\n\nMessage:\n${data.message || ''}`);
        
        window.location.href = `mailto:contact@filetoolkit.unaux.com?subject=${subject}&body=${body}`;
        
        formStatus.className = 'mt-4 p-4 rounded-xl text-center text-sm font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20';
        formStatus.innerHTML = '<span class="material-symbols-outlined align-middle mr-1">check_circle</span> Your email client has opened. Please send the email to complete your message.';
        formStatus.classList.remove('hidden');
        contactForm.reset();
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Send Message</span><span class="material-symbols-outlined">send</span>';
    });
});
