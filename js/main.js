// Shared JavaScript for all pages

document.addEventListener('DOMContentLoaded', () => {

    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('button[onclick*="mobile-menu"]'); // Try to find existing generic one or bind new
    // Actually, I used inline onclick in the HTML. I'll stick to that for simplicity or strict binding here.
    // Let's make it cleaner:

    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Add active class to current nav link
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('nav a');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath || (currentPath.includes('tools') && link.getAttribute('href').includes('tools'))) {
            // link.classList.add('text-white', 'bg-white/10');
            // Logic to highlight current page if needed
        }
    });

});
