// API Configuration
// Set your backend URL here
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : 'https://toolkit-production-2bdc.up.railway.app';

console.log('API_BASE_URL:', API_BASE_URL);

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
