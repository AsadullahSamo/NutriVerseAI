export function getGroqApiKey() {
    const key = import.meta.env.VITE_GROQ_API_KEY;
    if (!key) {
        throw new Error('GROQ API key is missing. Make sure VITE_GROQ_API_KEY is set in your .env file');
    }
    return key;
}
