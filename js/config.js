// Configuration for FileToolkitPro (Static Site - No Backend Required)
console.log('FileToolkitPro - 100% Client-Side Processing');

// Helper function for API calls (kept for compatibility, but now just throws error)
async function apiCall(endpoint, options = {}) {
    console.warn('API calls are no longer supported. This tool uses client-side processing only.');
    throw new Error('This feature requires a backend server. The tools have been updated to work client-side.');
}

// Legacy function kept for compatibility
async function testBackendConnection() {
    console.log('Backend connection check skipped - running in client-side mode');
    return false;
}
