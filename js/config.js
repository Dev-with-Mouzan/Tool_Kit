// API Configuration
// Determine backend URL based on environment
let API_BASE_URL;

// If running on Vercel production domain, use Railway backend
if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('tool-kit')) {
    API_BASE_URL = 'https://toolkit-production-2bdc.up.railway.app';
}
// If running locally, use local backend
else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_BASE_URL = 'http://localhost:5000';
}
// Default to Railway for any other domain
else {
    API_BASE_URL = 'https://toolkit-production-2bdc.up.railway.app';
}

console.log('🌐 Environment:', window.location.hostname);
console.log('🔗 API_BASE_URL:', API_BASE_URL);

// Test backend connectivity
async function testBackendConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            console.log('✅ Backend is online');
            return true;
        } else {
            console.error('❌ Backend returned status:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Backend connection failed:', error.message);
        return false;
    }
}

// Test on page load
document.addEventListener('DOMContentLoaded', () => {
    testBackendConnection();
});

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Don't add default headers for FormData - let browser set Content-Type with boundary
    const defaultOptions = {
        headers: options.body instanceof FormData ? {} : {
            'Accept': 'application/json',
        }
    };
    
    console.log('Making API call to:', url);
    console.log('Request options:', { ...defaultOptions, ...options });
    
    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}
