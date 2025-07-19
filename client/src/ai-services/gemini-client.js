// Client-side Gemini client - simplified version for build compatibility
// In a real client app, you'd want to make API calls to your backend instead of directly to Gemini

// Mock model for client-side build
export const model = {
  generateContent: async (prompt) => {
    // In production, this would make an API call to your backend
    throw new Error('Gemini client should not be called directly from client-side code');
  }
};

// Utility function for parsing JSON safely
export function safeJsonParse(jsonString, fallback = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return fallback;
  }
}

// Mock function for client-side compatibility
export async function generateWithRetry(prompt, options = {}) {
  // In production, this would make an API call to your backend
  throw new Error('AI generation should be handled by backend API calls');
}
