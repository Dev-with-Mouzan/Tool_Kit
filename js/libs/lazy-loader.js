/**
 * LazyLoader utility for dynamically loading external scripts.
 * Helps improve initial page load by only loading heavy libraries when needed.
 */
const LazyLoader = {
    _loaded: new Set(),
    _pending: new Map(),

    /**
     * Load a script by URL.
     * @param {string} url - The URL of the script to load.
     * @returns {Promise<void>}
     */
    loadScript(url) {
        if (this._loaded.has(url)) {
            return Promise.resolve();
        }
        if (this._pending.has(url)) {
            return this._pending.get(url);
        }

        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.onload = () => {
                this._loaded.add(url);
                this._pending.delete(url);
                resolve();
            };
            script.onerror = () => {
                this._pending.delete(url);
                reject(new Error(`Failed to load script: ${url}`));
            };
            document.head.appendChild(script);
        });

        this._pending.set(url, promise);
        return promise;
    },

    /**
     * Load multiple scripts in order.
     * @param {string[]} urls - Array of script URLs.
     * @returns {Promise<void>}
     */
    async loadScripts(urls) {
        for (const url of urls) {
            await this.loadScript(url);
        }
    }
};

window.LazyLoader = LazyLoader;
