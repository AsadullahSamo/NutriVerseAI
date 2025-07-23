// This file contains configuration that will be used throughout the application
const config = {
    groqApiKey: import.meta.env.VITE_GROQ_API_KEY || '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',
    apiBaseUrl: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://nutriverse-ai.onrender.com'
};
export default config;
