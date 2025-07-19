import config from "./config";

// Store the original fetch function
const originalFetch = window.fetch;

// Global fetch override that automatically fixes relative URLs and adds credentials
window.fetch = function(url, options = {}) {
  // Convert relative API URLs to absolute URLs
  let fullUrl = url;
  if (typeof url === 'string' && url.startsWith('/api')) {
    fullUrl = `${config.apiBaseUrl}${url}`;
  }

  // Get token from localStorage for cross-domain auth
  const token = localStorage.getItem('authToken');
  console.log('API request - token from localStorage:', token);

  // Add default credentials and headers for API calls
  const defaultOptions = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
      ...options.headers
    }
  };

  if (token) {
    console.log('Including Authorization header:', `Bearer ${token}`);
  }

  // Merge options for API calls
  const finalOptions = url.startsWith('/api') || url.includes('/api') ? {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  } : options;

  // Call original fetch with corrected URL and options
  return originalFetch.call(this, fullUrl, finalOptions);
};

// Global API wrapper that automatically handles base URLs and credentials
export async function apiFetch(url, options = {}) {
  // Convert relative URLs to absolute URLs
  const fullUrl = url.startsWith('http') ? url : `${config.apiBaseUrl}${url}`;

  // Default options with credentials and proper headers
  const defaultOptions = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...options.headers
    }
  };

  // Merge options
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  try {
    const response = await originalFetch(fullUrl, finalOptions);

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || response.statusText;
      } catch {
        errorMessage = response.statusText;
      }
      throw new Error(errorMessage);
    }

    // Handle empty responses
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${fullUrl}`, error);
    throw error;
  }
}

// Convenience methods
export const api = {
  get: (url, options = {}) => apiFetch(url, { ...options, method: 'GET' }),
  post: (url, data, options = {}) => apiFetch(url, { 
    ...options, 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  put: (url, data, options = {}) => apiFetch(url, { 
    ...options, 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  delete: (url, options = {}) => apiFetch(url, { ...options, method: 'DELETE' }),
  patch: (url, data, options = {}) => apiFetch(url, { 
    ...options, 
    method: 'PATCH', 
    body: JSON.stringify(data) 
  })
};

export default api;
