// This file contains configuration that will be used throughout the application
const config = {
    groqApiKey: import.meta.env.VITE_GROQ_API_KEY || 'your_groq_api_key_here',
    apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000'
};
export default config;
