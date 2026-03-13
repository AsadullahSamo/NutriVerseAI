// This file contains configuration that will be used throughout the application
const apiBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
if (!apiBaseUrl) {
    throw new Error("VITE_API_URL (or VITE_API_BASE_URL) is required for the client.");
}

const config = {
    apiBaseUrl
};
export default config;
