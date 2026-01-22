// API Configuration
// Set your backend URL here
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : 'https://toolkit-production-2bdc.up.railway.app';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Accept': 'application/json',
        }
    };
    
    return fetch(url, { ...defaultOptions, ...options });
}
