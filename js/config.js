// API Configuration
// Set your backend URL here
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : 'https://toolkit-production-2bdc.up.railway.app';

console.log('API_BASE_URL:', API_BASE_URL);

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
    const defaultOptions = {
        headers: {
            'Accept': 'application/json',
        }
    };
    
    console.log('Making API call to:', url);
    
    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        console.log('Response status:', response.status);
        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}
