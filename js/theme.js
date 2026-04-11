/**
 * FileToolkit Theme Management
 * Handles dark/light mode toggle and persistence
 */

const ThemeManager = {
    storageKey: 'filetoolkit-theme',

    init() {
        // Check for saved theme or system preference
        const savedTheme = localStorage.getItem(this.storageKey);
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        this.setTheme(theme);

        // Listen for system theme changes if no saved preference
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem(this.storageKey)) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });

        // Sync theme across active tabs/windows
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey && e.newValue) {
                this.setTheme(e.newValue);
            }
        });
    },

    setTheme(theme) {
        console.log('Setting theme to:', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        console.log('Current classes on html:', document.documentElement.className);
        localStorage.setItem(this.storageKey, theme);
        this.updateToggleButton(theme);
    },

    toggle() {
        const isDark = document.documentElement.classList.contains('dark');
        this.setTheme(isDark ? 'light' : 'dark');
    },

    updateToggleButton(theme) {
        const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
        toggleBtns.forEach(btn => {
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
            }
        });
    }
};

// Initialize theme as early as possible to prevent flash
ThemeManager.init();

// Export for use in HTML
window.toggleTheme = () => ThemeManager.toggle();
